// RangeSceneView.swift
// SceneKit range — aim, fire, recoil/FX, paper+steel targets with realistic hit feedback.
// Supports shared FP / third-person chase camera via PlayCameraHelper.

import SwiftUI
import SceneKit
import UIKit

struct RangeSceneView: UIViewRepresentable {
    let blueprint: GunBlueprint
    @Binding var ammo: Int
    @Binding var score: Int
    @Binding var lastHitLabel: String
    var isFiring: Bool
    var reloadToken: Int
    var hapticsEnabled: Bool
    var soundVolume: Double
    var thirdPersonMode: Bool
    var operatorLook: OperatorAppearance

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.backgroundColor = UIColor(GGGTheme.background)
        view.antialiasingMode = .none
        view.allowsCameraControl = false
        view.preferredFramesPerSecond = 30
        view.delegate = context.coordinator
        view.isPlaying = true
        view.isMultipleTouchEnabled = true
        view.autoenablesDefaultLighting = false
        view.contentScaleFactor = min(UIScreen.main.scale, 2.0)

        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handlePan(_:)))
        pan.maximumNumberOfTouches = 1
        view.addGestureRecognizer(pan)

        context.coordinator.configure(
            view: view,
            blueprint: blueprint,
            thirdPersonMode: thirdPersonMode,
            operatorLook: operatorLook
        )
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        let c = context.coordinator
        c.ammoBinding = $ammo
        c.scoreBinding = $score
        c.lastHitBinding = $lastHitLabel
        c.hapticsEnabled = hapticsEnabled
        c.soundVolume = soundVolume

        if c.thirdPersonMode != thirdPersonMode {
            c.thirdPersonMode = thirdPersonMode
            c.applyCameraMode()
        }
        if c.operatorLook != operatorLook {
            c.operatorLook = operatorLook
            c.refreshPlayerBody()
        }

        if c.lastReloadToken != reloadToken {
            c.lastReloadToken = reloadToken
            c.playReload()
        }

        if isFiring {
            c.startFiring()
        } else {
            c.stopFiring()
        }

        if c.blueprint?.id != blueprint.id
            || c.blueprint?.premadeSkin != blueprint.premadeSkin
            || c.blueprint?.attachments != blueprint.attachments {
            c.applyWeapon(blueprint)
        }
    }

    static func dismantleUIView(_ uiView: SCNView, coordinator: Coordinator) {
        coordinator.teardown()
        uiView.delegate = nil
        uiView.isPlaying = false
        uiView.scene = nil
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, SCNSceneRendererDelegate {
        weak var scnView: SCNView?
        var blueprint: GunBlueprint?
        var ammoBinding: Binding<Int>?
        var scoreBinding: Binding<Int>?
        var lastHitBinding: Binding<String>?
        var hapticsEnabled = true
        var soundVolume = 0.8
        var lastReloadToken = 0
        var thirdPersonMode = true
        var operatorLook = OperatorLook.grambo.appearance

        /// Look angles (radians). Drag on the view to aim.
        var yaw: Float = 0
        var pitch: Float = 0
        /// Temporary camera kick from recoil (decays each frame).
        var recoilPitch: Float = 0
        var recoilYaw: Float = 0
        var shotCount = 0

        private var fireTimer: Timer?
        private var isReloading = false
        private var emptyClickPlayed = false
        private var lastHitClear: DispatchWorkItem?
        private var activeFXCount = 0
        private let maxActiveFX = 10

        private weak var playerAnchor: SCNNode?
        private weak var playerBody: SCNNode?
        private weak var playerCamera: SCNNode?
        private weak var fpGun: SCNNode?
        private weak var tpGun: SCNNode?

        func teardown() {
            stopFiring()
            lastHitClear?.cancel()
            lastHitClear = nil
            activeFXCount = 0
            scnView?.delegate = nil
            scnView?.isPlaying = false
            scnView = nil
            playerAnchor = nil
            playerBody = nil
            playerCamera = nil
            fpGun = nil
            tpGun = nil
        }

        func configure(
            view: SCNView,
            blueprint: GunBlueprint,
            thirdPersonMode: Bool,
            operatorLook: OperatorAppearance
        ) {
            scnView = view
            self.blueprint = blueprint
            self.thirdPersonMode = thirdPersonMode
            self.operatorLook = operatorLook
            yaw = 0
            pitch = 0
            recoilPitch = 0
            recoilYaw = 0
            shotCount = 0
            activeFXCount = 0

            let scene = GunSceneBuilder.makeRangeScene(blueprint: blueprint)
            view.scene = scene
            let rig = GunSceneBuilder.installRangePlayerRig(in: scene, look: operatorLook)
            playerAnchor = rig.anchor
            playerBody = rig.body
            playerCamera = rig.camera
            // Critical: makeRangeScene no longer leaves a root camera; without this the view is black.
            view.pointOfView = rig.camera
            attachGuns(blueprint: blueprint)
            applyCameraMode()
        }

        func applyWeapon(_ blueprint: GunBlueprint) {
            self.blueprint = blueprint
            attachGuns(blueprint: blueprint)
            applyCameraMode()
        }

        func refreshPlayerBody() {
            guard let scene = scnView?.scene, let blueprint else { return }
            let rig = GunSceneBuilder.installRangePlayerRig(in: scene, look: operatorLook)
            playerAnchor = rig.anchor
            playerBody = rig.body
            playerCamera = rig.camera
            scnView?.pointOfView = rig.camera
            attachGuns(blueprint: blueprint)
            applyCameraMode()
        }

        private func attachGuns(blueprint: GunBlueprint) {
            guard let camera = playerCamera else { return }
            let guns = PlayCameraHelper.attachGuns(
                blueprint: blueprint,
                toCamera: camera,
                toBody: playerBody,
                previousFP: fpGun,
                previousTP: tpGun,
                lightweight: false,
                rangeStyleFP: true
            )
            fpGun = guns.fp
            tpGun = guns.tp
        }

        func applyCameraMode() {
            guard let cam = playerCamera else { return }
            let aimPitch = pitch + recoilPitch
            PlayCameraHelper.applyMode(
                thirdPerson: thirdPersonMode,
                camera: cam,
                playerBody: playerBody,
                fpGun: fpGun,
                tpGun: tpGun,
                playerAnchor: playerAnchor,
                yaw: yaw + recoilYaw,
                pitch: aimPitch,
                eyeHeight: PlayCameraHelper.rangeEyeHeight,
                firstPersonFOV: 65,
                thirdPersonOffset: PlayCameraHelper.rangeThirdPersonLocalOffset,
                thirdPersonPitchBias: PlayCameraHelper.rangeThirdPersonPitchBias,
                thirdPersonPitchScale: PlayCameraHelper.rangeThirdPersonPitchScale,
                thirdPersonFOV: PlayCameraHelper.rangeThirdPersonFOV
            )
            if scnView?.pointOfView !== cam {
                scnView?.pointOfView = cam
            }
        }

        private func activeGun() -> SCNNode? {
            thirdPersonMode ? tpGun : fpGun
        }

        // MARK: - Frame update (recoil settle)

        func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
            guard abs(recoilPitch) > 0.0004 || abs(recoilYaw) > 0.0004 else { return }
            recoilPitch *= 0.78
            recoilYaw *= 0.78
            if abs(recoilPitch) < 0.0004 { recoilPitch = 0 }
            if abs(recoilYaw) < 0.0004 { recoilYaw = 0 }
            applyAim()
        }

        // MARK: - Aim

        @objc func handlePan(_ gesture: UIPanGestureRecognizer) {
            guard let view = gesture.view else { return }
            let t = gesture.translation(in: view)
            gesture.setTranslation(.zero, in: view)

            yaw += Float(t.x) * 0.004
            pitch -= Float(t.y) * 0.003
            yaw = max(-1.1, min(1.1, yaw))
            pitch = max(-0.55, min(0.45, pitch))
            applyAim()
        }

        func applyAim() {
            applyCameraMode()
        }

        // MARK: - Fire loop

        func startFiring() {
            guard !isReloading else { return }
            if (ammoBinding?.wrappedValue ?? 0) <= 0 {
                if !emptyClickPlayed {
                    emptyClickPlayed = true
                    SoundService.shared.playEmpty(volume: soundVolume)
                }
                return
            }
            emptyClickPlayed = false
            guard fireTimer == nil else { return }
            let interval = blueprint?.fireInterval ?? 0.2
            // .common so FIRE keeps ticking while the aim pan gesture runs.
            let timer = Timer(timeInterval: interval, repeats: true) { [weak self] _ in
                self?.fireOnce()
            }
            RunLoop.main.add(timer, forMode: .common)
            fireTimer = timer
            fireOnce()
        }

        func stopFiring() {
            fireTimer?.invalidate()
            fireTimer = nil
            emptyClickPlayed = false
        }

        private func fireOnce() {
            guard !isReloading else { return }
            guard let ammoBinding, ammoBinding.wrappedValue > 0 else {
                stopFiring()
                if !emptyClickPlayed {
                    emptyClickPlayed = true
                    SoundService.shared.playEmpty(volume: soundVolume)
                }
                return
            }
            ammoBinding.wrappedValue -= 1
            shotCount += 1

            let body = blueprint?.bodyType ?? .pistol
            HapticsService.fire(enabled: hapticsEnabled, bodyType: body)
            SoundService.shared.playFire(bodyType: body, volume: soundVolume)
            // Hit first so the round tracks the pre-recoil crosshair (sniper cam kick is large).
            raycastHit(body: body)
            recoil(for: body)
            muzzleFlash(for: body)
            maybeEjectCasing(for: body)
        }

        // MARK: - Reload animation

        func playReload() {
            stopFiring()
            isReloading = true
            HapticsService.reload(enabled: hapticsEnabled)
            SoundService.shared.playReload(volume: soundVolume)

            guard let gun = activeGun() else {
                isReloading = false
                return
            }

            gun.removeAction(forKey: "reload")
            let body = blueprint?.bodyType ?? .pistol
            let action = reloadAction(for: body, on: gun)
            gun.runAction(action, forKey: "reload") { [weak self] in
                DispatchQueue.main.async { self?.isReloading = false }
            }
        }

        private func reloadAction(for body: GunBodyType, on gun: SCNNode) -> SCNAction {
            animateMagDrop(on: gun)
            animateSlideOrPump(on: gun, body: body)

            switch body {
            case .pistol:
                return .sequence([
                    .group([
                        .rotateBy(x: 0.45, y: 0.08, z: 0, duration: 0.14),
                        .moveBy(x: 0, y: -0.04, z: 0.03, duration: 0.14)
                    ]),
                    .wait(duration: 0.18),
                    .group([
                        .rotateBy(x: -0.45, y: -0.08, z: 0, duration: 0.16),
                        .moveBy(x: 0, y: 0.04, z: -0.03, duration: 0.16)
                    ]),
                    .rotateBy(x: -0.12, y: 0, z: 0, duration: 0.08),
                    .rotateBy(x: 0.12, y: 0, z: 0, duration: 0.10)
                ])
            case .shotgun:
                return .sequence([
                    .rotateBy(x: 0.25, y: 0, z: 0, duration: 0.10),
                    .wait(duration: 0.05),
                    .rotateBy(x: -0.25, y: 0, z: 0, duration: 0.12),
                    .moveBy(x: 0, y: 0, z: 0.06, duration: 0.14),
                    .moveBy(x: 0, y: 0, z: -0.06, duration: 0.14)
                ])
            case .sniper:
                return .sequence([
                    .rotateBy(x: 0.2, y: 0.35, z: 0.1, duration: 0.18),
                    .moveBy(x: 0, y: 0, z: 0.08, duration: 0.16),
                    .wait(duration: 0.12),
                    .moveBy(x: 0, y: 0, z: -0.08, duration: 0.14),
                    .rotateBy(x: -0.2, y: -0.35, z: -0.1, duration: 0.18)
                ])
            case .smg, .rifle, .machineGun:
                return .sequence([
                    .group([
                        .rotateBy(x: 0.35, y: -0.12, z: 0, duration: 0.15),
                        .moveBy(x: 0, y: -0.05, z: 0.04, duration: 0.15)
                    ]),
                    .wait(duration: 0.22),
                    .group([
                        .rotateBy(x: -0.35, y: 0.12, z: 0, duration: 0.18),
                        .moveBy(x: 0, y: 0.05, z: -0.04, duration: 0.18)
                    ]),
                    .moveBy(x: 0, y: 0, z: 0.05, duration: 0.10),
                    .moveBy(x: 0, y: 0, z: -0.05, duration: 0.12)
                ])
            }
        }

        private func animateMagDrop(on gun: SCNNode) {
            guard let magSocket = gun.childNode(withName: "socket_magazine", recursively: true),
                  let mag = magSocket.childNodes.first else { return }
            let dropY = SCNAction.moveBy(x: 0, y: -0.22, z: 0, duration: 0.15)
            dropY.timingMode = .easeIn
            let riseY = SCNAction.moveBy(x: 0, y: 0.22, z: 0, duration: 0.18)
            riseY.timingMode = .easeOut
            mag.runAction(.sequence([
                dropY,
                .fadeOut(duration: 0.05),
                .wait(duration: 0.15),
                .fadeIn(duration: 0.05),
                riseY
            ]))
        }

        private func animateSlideOrPump(on gun: SCNNode, body: GunBodyType) {
            if body == .shotgun,
               let pump = gun.childNode(withName: "pump", recursively: true) {
                pump.runAction(.sequence([
                    .moveBy(x: 0, y: 0, z: 0.12, duration: 0.14),
                    .moveBy(x: 0, y: 0, z: -0.12, duration: 0.16)
                ]))
                return
            }
            if let slide = gun.childNode(withName: "slide", recursively: true) {
                slide.runAction(.sequence([
                    .moveBy(x: 0, y: 0, z: 0.08, duration: 0.10),
                    .wait(duration: 0.08),
                    .moveBy(x: 0, y: 0, z: -0.08, duration: 0.12)
                ]))
            }
        }

        // MARK: - Recoil / flash / casing

        private func recoil(for body: GunBodyType) {
            guard let gun = activeGun() else { return }
            let (kickY, kickZ, rot, duration, camKick): (CGFloat, CGFloat, CGFloat, TimeInterval, Float) = {
                switch body {
                case .pistol: return (0.02, 0.04, 0.08, 0.04, 0.028)
                case .smg: return (0.012, 0.022, 0.045, 0.03, 0.014)
                case .rifle: return (0.025, 0.05, 0.1, 0.05, 0.034)
                case .shotgun: return (0.048, 0.085, 0.16, 0.07, 0.055)
                case .machineGun: return (0.016, 0.032, 0.055, 0.035, 0.018)
                case .sniper: return (0.055, 0.1, 0.18, 0.09, 0.07)
                }
            }()

            gun.removeAction(forKey: "recoil")
            let kick = SCNAction.moveBy(x: 0, y: kickY, z: kickZ, duration: duration)
            let recover = SCNAction.moveBy(x: 0, y: -kickY, z: -kickZ, duration: duration * 2.1)
            let rotKick = SCNAction.rotateBy(x: -rot, y: 0, z: CGFloat.random(in: -0.025...0.025), duration: duration)
            let rotRecover = SCNAction.rotateBy(x: rot, y: 0, z: 0, duration: duration * 2.3)
            gun.runAction(.group([
                .sequence([kick, recover]),
                .sequence([rotKick, rotRecover])
            ]), forKey: "recoil")

            // Camera kick — settles via renderer decay.
            recoilPitch += camKick
            recoilYaw += Float.random(in: -camKick * 0.35...camKick * 0.35)
            recoilPitch = min(recoilPitch, 0.22)
            applyAim()
        }

        private func muzzleFlash(for body: GunBodyType) {
            guard let gun = activeGun() else { return }
            guard activeFXCount < maxActiveFX else { return }
            let tip = GunSceneBuilder.muzzleTip(for: body)
            let radius: CGFloat = {
                switch body {
                case .pistol: return 0.045
                case .smg: return 0.038
                case .rifle: return 0.05
                case .shotgun: return 0.085
                case .machineGun: return 0.055
                case .sniper: return 0.07
                }
            }()

            let flashRoot = SCNNode()
            flashRoot.position = tip

            let core = SCNNode(geometry: SCNSphere(radius: radius))
            core.geometry?.firstMaterial?.diffuse.contents = UIColor.orange
            core.geometry?.firstMaterial?.emission.contents = UIColor.yellow
            core.geometry?.firstMaterial?.lightingModel = .constant
            flashRoot.addChildNode(core)

            let cone = SCNNode(geometry: SCNCone(topRadius: 0, bottomRadius: radius * 1.6, height: radius * 2.8))
            cone.geometry?.firstMaterial?.diffuse.contents = UIColor(red: 1, green: 0.7, blue: 0.2, alpha: 0.85)
            cone.geometry?.firstMaterial?.emission.contents = UIColor(red: 1, green: 0.85, blue: 0.3, alpha: 1)
            cone.geometry?.firstMaterial?.lightingModel = .constant
            // Point down -Z (muzzle forward).
            cone.eulerAngles.x = -.pi / 2
            cone.position = SCNVector3(0, 0, -Float(radius) * 1.2)
            flashRoot.addChildNode(cone)

            gun.addChildNode(flashRoot)
            activeFXCount += 1
            let hold: TimeInterval = (body == .shotgun || body == .sniper) ? 0.07 : 0.035
            let fade: TimeInterval = (body == .shotgun || body == .sniper) ? 0.09 : 0.05
            flashRoot.runAction(.sequence([
                .wait(duration: hold),
                .fadeOut(duration: fade),
                .removeFromParentNode(),
                .run { [weak self] _ in self?.activeFXCount = max(0, (self?.activeFXCount ?? 1) - 1) }
            ]))
        }

        private func maybeEjectCasing(for body: GunBodyType) {
            // Skip most SMG/MG casings to keep node count modest.
            switch body {
            case .smg, .machineGun:
                guard shotCount % 3 == 0 else { return }
            default: break
            }
            guard activeFXCount < maxActiveFX else { return }
            guard let gun = activeGun() else { return }

            let casing = SCNNode(geometry: SCNCylinder(radius: 0.007, height: 0.022))
            casing.geometry?.firstMaterial?.diffuse.contents = UIColor(red: 0.82, green: 0.68, blue: 0.22, alpha: 1)
            casing.geometry?.firstMaterial?.metalness.contents = 0.7
            casing.geometry?.firstMaterial?.roughness.contents = 0.35
            casing.eulerAngles.z = .pi / 2
            casing.position = SCNVector3(0.06, 0.08, -0.12)
            gun.addChildNode(casing)
            activeFXCount += 1

            let side: CGFloat = Bool.random() ? 1 : 0.85
            casing.runAction(.sequence([
                .group([
                    .moveBy(x: 0.22 * side, y: 0.12, z: CGFloat.random(in: -0.04...0.06), duration: 0.16),
                    .rotateBy(x: 2.4, y: 1.8, z: 3.0, duration: 0.16)
                ]),
                .group([
                    .moveBy(x: 0.12 * side, y: -0.55, z: 0.08, duration: 0.28),
                    .rotateBy(x: 1.5, y: 2.0, z: 1.2, duration: 0.28)
                ]),
                .fadeOut(duration: 0.08),
                .removeFromParentNode(),
                .run { [weak self] _ in self?.activeFXCount = max(0, (self?.activeFXCount ?? 1) - 1) }
            ]))
        }

        // MARK: - Hits

        private func raycastHit(body: GunBodyType) {
            guard let scene = scnView?.scene,
                  let camera = playerCamera
                    ?? scene.rootNode.childNode(withName: "camera", recursively: true) else { return }

            let aimDist = body.rangeAimDistance
            let b = blueprint?.accuracyBloom ?? body.accuracyBloom
            let ox = b > 0 ? Float.random(in: -b...b) : 0
            let oy = b > 0 ? Float.random(in: -b...b) : 0
            // Slight upward bias matches on-screen crosshair.
            let farCam = camera.convertPosition(SCNVector3(ox, 0.08 + oy, -aimDist), to: nil)
            let camOrigin = camera.convertPosition(SCNVector3(0, 0, 0), to: nil)

            // TP: fire from eye height so LOS matches the crosshair, not the chase cam.
            let origin: SCNVector3
            let far: SCNVector3
            if thirdPersonMode {
                let eye = PlayCameraHelper.eyeWorldPosition(
                    anchor: playerAnchor,
                    height: PlayCameraHelper.rangeEyeHeight
                )
                let dx = farCam.x - camOrigin.x
                let dy = farCam.y - camOrigin.y
                let dz = farCam.z - camOrigin.z
                let len = max(0.001, sqrt(dx * dx + dy * dy + dz * dz))
                let scale: Float = aimDist / len
                origin = eye
                far = SCNVector3(eye.x + dx * scale, eye.y + dy * scale, eye.z + dz * scale)
            } else {
                origin = camOrigin
                far = farCam
            }

            var scored = scoreSegmentHit(from: origin, to: far, body: body, scene: scene)

            // Sniper micro aim-assist: tiny lateral offsets if the primary ray missed.
            if !scored, body == .sniper {
                let assists: [(Float, Float)] = [(-0.035, 0), (0.035, 0), (0, 0.04), (0, -0.03)]
                for (ax, ay) in assists {
                    let farAssistCam = camera.convertPosition(SCNVector3(ox + ax, 0.08 + oy + ay, -aimDist), to: nil)
                    let farAssist: SCNVector3
                    if thirdPersonMode {
                        let eye = PlayCameraHelper.eyeWorldPosition(
                            anchor: playerAnchor,
                            height: PlayCameraHelper.rangeEyeHeight
                        )
                        let ddx = farAssistCam.x - camOrigin.x
                        let ddy = farAssistCam.y - camOrigin.y
                        let ddz = farAssistCam.z - camOrigin.z
                        let len = max(0.001, sqrt(ddx * ddx + ddy * ddy + ddz * ddz))
                        let scale: Float = aimDist / len
                        farAssist = SCNVector3(eye.x + ddx * scale, eye.y + ddy * scale, eye.z + ddz * scale)
                    } else {
                        farAssist = farAssistCam
                    }
                    if scoreSegmentHit(from: origin, to: farAssist, body: body, scene: scene) {
                        scored = true
                        break
                    }
                }
            }

            // Shotgun pellet offsets
            if body == .shotgun {
                for dx: Float in [-0.22, 0.22, -0.12, 0.12] {
                    let far2Cam = camera.convertPosition(SCNVector3(dx, 0.06, -aimDist), to: nil)
                    let far2: SCNVector3
                    if thirdPersonMode {
                        let eye = PlayCameraHelper.eyeWorldPosition(
                            anchor: playerAnchor,
                            height: PlayCameraHelper.rangeEyeHeight
                        )
                        let ddx = far2Cam.x - camOrigin.x
                        let ddy = far2Cam.y - camOrigin.y
                        let ddz = far2Cam.z - camOrigin.z
                        let len = max(0.001, sqrt(ddx * ddx + ddy * ddy + ddz * ddz))
                        let scale: Float = aimDist / len
                        far2 = SCNVector3(eye.x + ddx * scale, eye.y + ddy * scale, eye.z + ddz * scale)
                    } else {
                        far2 = far2Cam
                    }
                    let pelletHits = scene.rootNode.hitTestWithSegment(from: origin, to: far2)
                    for hit in pelletHits {
                        if shouldIgnoreHitNode(hit.node) { continue }
                        if hit.node.name == "stand" { continue }
                        if isPassThroughProp(hit.node) { continue }
                        if isSolidStopper(hit.node) { break }
                        guard let targetRoot = targetRoot(for: hit.node),
                              !isTargetDown(targetRoot) else { continue }
                        let kind = targetKind(targetRoot)
                        if kind == "steel" {
                            if !scored {
                                registerSteelHit(targetRoot: targetRoot, worldPoint: hit.worldCoordinates)
                                scored = true
                            }
                        } else {
                            addBulletHole(on: targetRoot, worldPoint: hit.worldCoordinates)
                            scoreBinding?.wrappedValue += 12
                            if !scored {
                                announceHit("PELLET +12")
                                SoundService.shared.playHit(volume: soundVolume * 0.75)
                                scored = true
                            }
                        }
                        break
                    }
                }
            }
        }

        /// Returns true if the segment scored a target hit (walls / berms still stop the round).
        @discardableResult
        private func scoreSegmentHit(from origin: SCNVector3, to far: SCNVector3, body: GunBodyType, scene: SCNScene) -> Bool {
            let hits = scene.rootNode.hitTestWithSegment(from: origin, to: far)
            for hit in hits {
                if shouldIgnoreHitNode(hit.node) { continue }
                if hit.node.name == "stand" { continue }
                if isPassThroughProp(hit.node) { continue }
                if isSolidStopper(hit.node) {
                    if hit.node.name == "berm" || hit.node.name == "backstop" || hit.node.name == "bermTop" {
                        dirtPuff(at: hit.worldCoordinates)
                    }
                    return false
                }
                guard let targetRoot = targetRoot(for: hit.node) else { continue }
                if isTargetDown(targetRoot) { continue }

                let kind = targetKind(targetRoot)
                let local = hit.localCoordinates

                if kind == "steel" {
                    registerSteelHit(targetRoot: targetRoot, worldPoint: hit.worldCoordinates)
                    return true
                } else {
                    let (pts, label) = scorePaperHit(nodeName: hit.node.name, local: local, body: body)
                    addBulletHole(on: targetRoot, worldPoint: hit.worldCoordinates)
                    scoreBinding?.wrappedValue += pts
                    announceHit("\(label) +\(pts)")
                    SoundService.shared.playHit(volume: soundVolume)
                    HapticsService.hit(enabled: hapticsEnabled)
                    flashImpact(on: targetRoot)
                    return true
                }
            }
            return false
        }

        private func targetKind(_ targetRoot: SCNNode) -> String {
            (targetRoot.name?.contains("_steel") == true) ? "steel" : "paper"
        }

        private func shouldIgnoreHitNode(_ node: SCNNode) -> Bool {
            var walk: SCNNode? = node
            while let n = walk {
                let name = n.name ?? ""
                if name == "playerBody" || name == "playerAnchor"
                    || name == "gunRoot" || name == "gunRootTP" {
                    return true
                }
                walk = n.parent
            }
            return false
        }

        private func isSolidStopper(_ node: SCNNode) -> Bool {
            switch node.name {
            case "berm", "backstop", "bermTop", "fenceL", "fenceR",
                 "stallBack", "stallLeft", "stallRight", "stallShelf", "canopy":
                return true
            default:
                return false
            }
        }

        private func isPassThroughProp(_ node: SCNNode) -> Bool {
            switch node.name {
            case "lanePost", "laneRail", "sandbag", "marker", "stallStripeL", "stallStripeR",
                 "beamL", "beamR", "lampHousing":
                return true
            default:
                return false
            }
        }

        private func isTargetDown(_ targetRoot: SCNNode) -> Bool {
            targetRoot.childNode(withName: "hitSurface", recursively: false)?.action(forKey: "flip") != nil
        }

        private func scorePaperHit(nodeName: String?, local: SCNVector3, body: GunBodyType = .pistol) -> (Int, String) {
            let name = nodeName ?? ""
            let headBonus = body == .sniper ? 75 : 50
            if name == "zone_head" {
                return (headBonus, "HEAD")
            }
            if name == "zone_a" {
                return (35, "A-ZONE")
            }
            // Fallback Y heuristic — slightly lower threshold so near-misses into the head box still count.
            let relY = local.y
            if name.contains("head") || relY > 1.28 {
                return (headBonus, "HEAD")
            }
            let dx = abs(local.x)
            let dy = abs(local.y - 0.95)
            if dx < 0.12 && dy < 0.18 {
                return (35, "A-ZONE")
            }
            if name == "zone_c" || dx < 0.26 {
                return (20, "BODY")
            }
            return (10, "EDGE")
        }

        private func registerSteelHit(targetRoot: SCNNode, worldPoint: SCNVector3) {
            scoreBinding?.wrappedValue += 40
            announceHit("STEEL +40")
            SoundService.shared.playRicochet(volume: soundVolume)
            HapticsService.hit(enabled: hapticsEnabled, heavy: true)
            sparkBurst(at: worldPoint)
            flipSteel(targetRoot)
        }

        private func flipSteel(_ targetRoot: SCNNode) {
            guard let surface = targetRoot.childNode(withName: "hitSurface", recursively: false) else { return }
            surface.removeAction(forKey: "flip")
            // Pivot around hinge (~y 0.76): rotate plate away from shooter.
            // Presence of the "flip" action marks the plate as down (replaces userData).
            let down = SCNAction.rotateBy(x: -.pi / 2.05, y: 0, z: 0, duration: 0.22)
            down.timingMode = .easeIn
            let up = SCNAction.rotateBy(x: .pi / 2.05, y: 0, z: 0, duration: 0.35)
            up.timingMode = .easeOut
            surface.runAction(.sequence([
                down,
                .wait(duration: 2.4),
                up
            ]), forKey: "flip")
        }

        private func sparkBurst(at world: SCNVector3) {
            guard let scene = scnView?.scene else { return }
            let root = SCNNode()
            root.position = world
            scene.rootNode.addChildNode(root)

            for _ in 0..<5 {
                let spark = SCNNode(geometry: SCNSphere(radius: 0.012))
                spark.geometry?.firstMaterial?.diffuse.contents = UIColor.yellow
                spark.geometry?.firstMaterial?.emission.contents = UIColor.orange
                spark.geometry?.firstMaterial?.lightingModel = .constant
                root.addChildNode(spark)
                let dx = CGFloat.random(in: -0.18...0.18)
                let dy = CGFloat.random(in: 0.05...0.28)
                let dz = CGFloat.random(in: -0.08...0.12)
                spark.runAction(.sequence([
                    .group([
                        .moveBy(x: dx, y: dy, z: dz, duration: 0.14),
                        .fadeOut(duration: 0.14)
                    ]),
                    .removeFromParentNode()
                ]))
            }
            root.runAction(.sequence([.wait(duration: 0.2), .removeFromParentNode()]))
        }

        private func dirtPuff(at world: SCNVector3) {
            guard let scene = scnView?.scene else { return }
            let puff = SCNNode(geometry: SCNSphere(radius: 0.06))
            puff.geometry?.firstMaterial?.diffuse.contents = UIColor(red: 0.45, green: 0.35, blue: 0.22, alpha: 0.7)
            puff.geometry?.firstMaterial?.lightingModel = .constant
            puff.position = world
            scene.rootNode.addChildNode(puff)
            puff.runAction(.sequence([
                .group([
                    .scale(to: 2.2, duration: 0.18),
                    .fadeOut(duration: 0.18)
                ]),
                .removeFromParentNode()
            ]))
        }

        private func announceHit(_ text: String) {
            lastHitBinding?.wrappedValue = text
            lastHitClear?.cancel()
            let work = DispatchWorkItem { [weak self] in
                self?.lastHitBinding?.wrappedValue = ""
            }
            lastHitClear = work
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.1, execute: work)
        }

        private func targetRoot(for node: SCNNode) -> SCNNode? {
            var n: SCNNode? = node
            while let cur = n {
                if let name = cur.name, name.hasPrefix("target_") { return cur }
                n = cur.parent
            }
            return nil
        }

        private func addBulletHole(on target: SCNNode, worldPoint: SCNVector3) {
            let host = target.childNode(withName: "hitSurface", recursively: false) ?? target
            let existing = host.childNodes.filter { $0.name == "bulletHole" }
            if existing.count > 36 {
                existing.first?.removeFromParentNode()
            }

            let local = host.convertPosition(worldPoint, from: nil)
            let hole = SCNNode(geometry: SCNCylinder(radius: 0.014, height: 0.01))
            hole.name = "bulletHole"
            hole.geometry?.firstMaterial?.diffuse.contents = UIColor(white: 0.04, alpha: 1)
            hole.geometry?.firstMaterial?.emission.contents = UIColor(white: 0.015, alpha: 1)
            hole.geometry?.firstMaterial?.lightingModel = .constant
            hole.eulerAngles.x = .pi / 2
            hole.position = SCNVector3(local.x, local.y, local.z + 0.02)

            let ring = SCNNode(geometry: SCNTorus(ringRadius: 0.018, pipeRadius: 0.0035))
            ring.geometry?.firstMaterial?.diffuse.contents = UIColor(white: 0.18, alpha: 1)
            ring.geometry?.firstMaterial?.lightingModel = .constant
            ring.eulerAngles.x = .pi / 2
            hole.addChildNode(ring)

            host.addChildNode(hole)
        }

        private func flashImpact(on node: SCNNode) {
            node.enumerateChildNodes { child, _ in
                guard child.name?.hasPrefix("zone_") == true || child.name == "steel",
                      let mat = child.geometry?.firstMaterial else { return }
                let original = mat.emission.contents
                mat.emission.contents = UIColor.white.withAlphaComponent(0.4)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.07) {
                    mat.emission.contents = original
                }
            }
        }
    }
}
