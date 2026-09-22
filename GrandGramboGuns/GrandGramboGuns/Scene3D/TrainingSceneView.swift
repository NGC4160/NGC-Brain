// TrainingSceneView.swift
// Practice combat bay — shared control stack (PlayCameraHelper, colliders, LOS, pickups).
// Soft dummies respawn; player death gently resets. No match outcomes.

import SwiftUI
import SceneKit
import UIKit

struct TrainingSceneView: UIViewRepresentable {
    let blueprint: GunBlueprint

    @Binding var health: Double
    @Binding var ammo: Int
    @Binding var statusMessage: String
    @Binding var isFiring: Bool
    @Binding var moveAxis: CGPoint
    @Binding var dummyHits: Int
    @Binding var livingDummies: Int

    var combatEnabled: Bool
    var infiniteAmmo: Bool
    var softDummiesEnabled: Bool
    var resetToken: Int
    var hapticsEnabled: Bool
    var soundVolume: Double
    var magSize: Int
    var thirdPersonMode: Bool
    var operatorProfile: OperatorProfile
    /// Fired on main when a training dummy is downed (optional; Training does not award XP).
    var onPlayerKill: (() -> Void)? = nil
    var onCombatJuice: ((CombatJuiceKind) -> Void)? = nil

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.antialiasingMode = .none
        view.allowsCameraControl = false
        view.preferredFramesPerSecond = 30
        view.isPlaying = false
        view.backgroundColor = .black
        view.isMultipleTouchEnabled = true
        view.autoenablesDefaultLighting = false
        view.contentScaleFactor = min(UIScreen.main.scale, 2.0)

        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handlePan(_:)))
        pan.maximumNumberOfTouches = 1
        view.addGestureRecognizer(pan)

        context.coordinator.configure(
            view: view,
            blueprint: blueprint,
            magSize: magSize,
            thirdPersonMode: thirdPersonMode,
            operatorProfile: operatorProfile,
            softDummiesEnabled: softDummiesEnabled
        )
        view.delegate = context.coordinator
        view.isPlaying = false
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        let c = context.coordinator
        c.healthBinding = $health
        c.ammoBinding = $ammo
        c.statusBinding = $statusMessage
        c.dummyHitsBinding = $dummyHits
        c.livingDummiesBinding = $livingDummies
        c.hapticsEnabled = hapticsEnabled
        c.soundVolume = soundVolume
        c.magSize = magSize
        c.moveAxis = moveAxis
        c.operatorProfile = operatorProfile
        c.moveSpeed = 5.8 * operatorProfile.moveSpeedMultiplier
        c.infiniteAmmo = infiniteAmmo
        c.softDummiesEnabled = softDummiesEnabled
        c.onPlayerKill = onPlayerKill
        c.onCombatJuice = onCombatJuice

        c.setCombatEnabled(combatEnabled)

        if c.lastResetToken != resetToken {
            c.lastResetToken = resetToken
            c.softResetPlayer()
        }

        if c.thirdPersonMode != thirdPersonMode {
            c.thirdPersonMode = thirdPersonMode
            c.applyCameraMode()
        }

        if c.blueprint?.id != blueprint.id {
            let wasFiring = c.wantsFiring
            if wasFiring { c.stopFiring() }
            c.applyWeapon(blueprint)
            c.magSize = magSize
            c.syncAmmo(infiniteAmmo ? magSize : ammo)
            if infiniteAmmo, ammo != magSize {
                DispatchQueue.main.async { ammo = magSize }
            }
            if wasFiring, combatEnabled { c.startFiring() }
        } else {
            c.magSize = magSize
            if infiniteAmmo {
                if c.ammoCache != magSize {
                    c.syncAmmo(magSize)
                }
                if ammo != magSize {
                    DispatchQueue.main.async { ammo = magSize }
                }
            } else {
                c.syncAmmo(ammo)
            }
        }

        let wantFire = isFiring && combatEnabled
        if wantFire != c.wantsFiring {
            c.wantsFiring = wantFire
            if wantFire { c.startFiring() } else { c.stopFiring() }
        }
    }

    static func dismantleUIView(_ uiView: SCNView, coordinator: Coordinator) {
        coordinator.teardown()
        uiView.delegate = nil
        uiView.isPlaying = false
        uiView.scene = nil
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator: NSObject, SCNSceneRendererDelegate {
        weak var scnView: SCNView?
        var blueprint: GunBlueprint?
        var magSize = 30

        var healthBinding: Binding<Double>?
        var ammoBinding: Binding<Int>?
        var statusBinding: Binding<String>?
        var dummyHitsBinding: Binding<Int>?
        var livingDummiesBinding: Binding<Int>?
        var onPlayerKill: (() -> Void)?
        var onCombatJuice: ((CombatJuiceKind) -> Void)?

        var hapticsEnabled = true
        var soundVolume = 0.9
        var moveAxis: CGPoint = .zero
        var thirdPersonMode = true
        var operatorProfile = OperatorProfile.all[0]
        var moveSpeed: Float = 5.2
        var wantsFiring = false
        var infiniteAmmo = true
        var softDummiesEnabled = true
        var lastResetToken = 0
        /// Exposed for SwiftUI infinite-ammo sync without binding storms.
        private(set) var ammoCache: Int = 30

        private var yaw: Float = .pi
        private var pitch: Float = 0
        private var fireTimer: Timer?
        private var enemyHP: [String: Int] = [:]
        private var enemyMaxHP: [String: Int] = [:]
        private var enemyWeapon: [String: MissionSceneBuilder.EnemyWeapon] = [:]
        private var enemyNextAttack: [String: Date] = [:]
        private var enemyBurstLeft: [String: Int] = [:]
        private var enemySeekCoverUntil: [String: Date] = [:]
        private var enemySpawnPos: [String: SCNVector3] = [:]
        private var enemyRespawnAt: [String: Date] = [:]
        private var sceneConfigured = false
        private var combatEnabled = false
        private var combatGraceUntil = Date.distantPast
        private var playerHurtCooldown = Date.distantPast
        private var lastUpdateTime: TimeInterval = 0
        private var lastEnemySoundTime: CFTimeInterval = 0
        private var healthCache: Double = 100
        private var mapHalfExtent: Float = 14
        private var colliders: [MissionSceneBuilder.Collider] = []
        private var enemyNodes: [SCNNode] = []
        private var enemyWeaponNode: [ObjectIdentifier: SCNNode] = [:]
        private var pickupNodes: [SCNNode] = []
        private var pendingPickupSpawns: [(kind: String, id: Int, pos: SCNVector3, at: Date)] = []
        private var enemyAITick = 0
        private var activeFXCount = 0
        private let maxActiveFX = 6
        private var lastStatusAt: CFTimeInterval = 0
        private var lastStatusText = ""
        private var lookPanEnabled = false
        private var dummyHitsCache = 0
        private var playerSpawn = SCNVector3(0, 0, 10)
        private var nextEnemyID = 100
        private var lastPlayerEye = SCNVector3(0, 0, 0)
        private var playerSpeedXZ: Float = 0
        private var hasPlayerEyeSample = false

        private let playerRadius: Float = 0.34
        private let aiProfile = EnemyCombatAI.profile(difficulty: .easy, mode: .training)
        private var enemyHitChance: Float { aiProfile.hitChance }

        private weak var playerAnchor: SCNNode?
        private weak var playerBody: SCNNode?
        private weak var playerCamera: SCNNode?
        private weak var fpGun: SCNNode?
        private weak var tpGun: SCNNode?

        func teardown() {
            stopFiring()
            wantsFiring = false
            combatEnabled = false
            sceneConfigured = false
            scnView?.isPlaying = false
            scnView?.delegate = nil
            scnView = nil
            enemyNodes.removeAll()
            enemyWeaponNode.removeAll()
            pickupNodes.removeAll()
            pendingPickupSpawns.removeAll()
            playerAnchor = nil
            playerBody = nil
            playerCamera = nil
            fpGun = nil
            tpGun = nil
        }

        func setCombatEnabled(_ enabled: Bool) {
            let was = combatEnabled
            combatEnabled = enabled && sceneConfigured
            if combatEnabled {
                scnView?.preferredFramesPerSecond = 30
                scnView?.isPlaying = true
                if !was {
                    lastUpdateTime = 0
                    combatGraceUntil = Date().addingTimeInterval(0.9)
                    playerHurtCooldown = combatGraceUntil
                    let arm = Date().addingTimeInterval(0.7)
                    for key in enemyNextAttack.keys { enemyNextAttack[key] = arm }
                    if let ammoBinding {
                        ammoCache = infiniteAmmo ? magSize : ammoBinding.wrappedValue
                    }
                }
            } else {
                scnView?.preferredFramesPerSecond = 15
                scnView?.isPlaying = false
                if wantsFiring { stopFiring(); wantsFiring = false }
            }
        }

        func configure(
            view: SCNView,
            blueprint: GunBlueprint,
            magSize: Int,
            thirdPersonMode: Bool,
            operatorProfile: OperatorProfile,
            softDummiesEnabled: Bool
        ) {
            scnView = view
            self.blueprint = blueprint
            self.magSize = magSize
            self.thirdPersonMode = thirdPersonMode
            self.operatorProfile = operatorProfile
            self.softDummiesEnabled = softDummiesEnabled
            self.moveSpeed = 5.8 * operatorProfile.moveSpeedMultiplier
            sceneConfigured = false
            combatEnabled = false
            lastUpdateTime = 0
            enemyAITick = 0
            activeFXCount = 0
            ammoCache = magSize
            healthCache = operatorProfile.maxHealth
            dummyHitsCache = 0
            lookPanEnabled = false
            nextEnemyID = 100
            stopFiring()
            wantsFiring = false
            yaw = .pi
            pitch = 0

            let built = ArenaSceneBuilder.buildTraining(dummyCount: softDummiesEnabled ? 4 : 3)
            view.scene = built.scene
            mapHalfExtent = built.mapHalfExtent
            colliders = built.colliders
            playerSpawn = built.playerSpawn

            let spawnXZ = resolveFreePosition(x: built.playerSpawn.x, z: built.playerSpawn.z, radius: playerRadius)
            let anchor = SCNNode()
            anchor.name = "playerAnchor"
            anchor.position = SCNVector3(spawnXZ.x, 0, spawnXZ.z)
            built.scene.rootNode.addChildNode(anchor)
            playerAnchor = anchor

            let body = MissionSceneBuilder.makePlayerBodyNode(look: operatorProfile.look)
            anchor.addChildNode(body)
            playerBody = body

            let camera = SCNNode()
            camera.name = "playerCamera"
            camera.camera = SCNCamera()
            camera.camera?.zFar = 55
            camera.camera?.wantsHDR = false
            camera.camera?.bloomIntensity = 0
            anchor.addChildNode(camera)
            playerCamera = camera
            attachGuns(blueprint: blueprint, toCamera: camera, toBody: body)
            // Explicit POV — same black-screen guard as Range (SceneKit won't guess a nested camera).
            view.pointOfView = camera

            enemyHP.removeAll()
            enemyMaxHP.removeAll()
            enemyWeapon.removeAll()
            enemyNextAttack.removeAll()
            enemyBurstLeft.removeAll()
            enemySeekCoverUntil.removeAll()
            enemySpawnPos.removeAll()
            enemyRespawnAt.removeAll()
            enemyNodes.removeAll()
            enemyWeaponNode.removeAll()
            hasPlayerEyeSample = false
            playerSpeedXZ = 0

            for (i, spawn) in built.enemySpawns.enumerated() {
                spawnDummy(id: i, at: spawn, in: built.scene.rootNode, rifleOnly: !softDummiesEnabled)
            }

            pickupNodes.removeAll()
            pendingPickupSpawns.removeAll()
            for (i, spawn) in built.ammoSpawns.enumerated() {
                let n = MissionSceneBuilder.makeAmmoPickup(id: i, at: spawn)
                built.scene.rootNode.addChildNode(n)
                pickupNodes.append(n)
            }
            for (i, spawn) in built.medkitSpawns.enumerated() {
                let n = MissionSceneBuilder.makeMedkitPickup(id: i, at: spawn)
                built.scene.rootNode.addChildNode(n)
                pickupNodes.append(n)
            }

            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.livingDummiesBinding?.wrappedValue = self.enemyNodes.count
                self.dummyHitsBinding?.wrappedValue = 0
                self.statusBinding?.wrappedValue = "Practice bay online"
            }
            applyCameraMode()
            sceneConfigured = true
            combatEnabled = false
        }

        private func spawnDummy(id: Int, at spawn: SCNVector3, in root: SCNNode, rifleOnly: Bool) {
            let weapon: MissionSceneBuilder.EnemyWeapon = rifleOnly ? .rifle : ((id % 3 == 0) ? .knife : .rifle)
            let free = resolveFreePosition(x: spawn.x, z: spawn.z, radius: playerRadius)
            let pos = SCNVector3(free.x, 0, free.z)
            let enemy = MissionSceneBuilder.makeEnemyNode(id: id, at: pos, weapon: weapon)
            let name = enemy.name ?? "enemy_\(id)"
            let maxHP = weapon == .knife ? 3 : 4
            enemyHP[name] = maxHP
            enemyMaxHP[name] = maxHP
            enemyWeapon[name] = weapon
            enemyNextAttack[name] = Date.distantFuture
            enemyBurstLeft[name] = aiProfile.burstSize
            enemySpawnPos[name] = pos
            MissionSceneBuilder.updateEnemyHealthBar(on: enemy, ratio: 1)
            root.addChildNode(enemy)
            enemyNodes.append(enemy)
            if let gun = enemy.childNode(withName: "enemyGun", recursively: false)
                ?? enemy.childNode(withName: "enemyKnife", recursively: false) {
                enemyWeaponNode[ObjectIdentifier(enemy)] = gun
            }
        }

        func syncAmmo(_ value: Int) { ammoCache = value }

        func applyWeapon(_ blueprint: GunBlueprint) {
            self.blueprint = blueprint
            guard let camera = playerCamera
                    ?? playerAnchor?.childNode(withName: "playerCamera", recursively: false) else { return }
            playerCamera = camera
            attachGuns(blueprint: blueprint, toCamera: camera, toBody: playerBody)
            applyCameraMode()
        }

        private func attachGuns(blueprint: GunBlueprint, toCamera camera: SCNNode, toBody body: SCNNode?) {
            let guns = PlayCameraHelper.attachGuns(
                blueprint: blueprint,
                toCamera: camera,
                toBody: body,
                previousFP: fpGun,
                previousTP: tpGun
            )
            fpGun = guns.fp
            tpGun = guns.tp
        }

        func applyCameraMode() {
            guard let cam = playerCamera
                    ?? playerAnchor?.childNode(withName: "playerCamera", recursively: false) else { return }
            playerCamera = cam
            PlayCameraHelper.applyMode(
                thirdPerson: thirdPersonMode,
                camera: cam,
                playerBody: playerBody,
                fpGun: fpGun,
                tpGun: tpGun,
                playerAnchor: playerAnchor,
                yaw: yaw,
                pitch: pitch
            )
            if scnView?.pointOfView !== cam {
                scnView?.pointOfView = cam
            }
        }

        func softResetPlayer() {
            guard let anchor = playerAnchor else { return }
            stopFiring()
            wantsFiring = false
            let free = resolveFreePosition(x: playerSpawn.x, z: playerSpawn.z, radius: playerRadius)
            anchor.position = SCNVector3(free.x, 0, free.z)
            yaw = .pi
            pitch = 0
            healthCache = operatorProfile.maxHealth
            setHealth(healthCache)
            ammoCache = magSize
            setAmmo(magSize)
            combatGraceUntil = Date().addingTimeInterval(1.0)
            playerHurtCooldown = combatGraceUntil
            applyCameraMode()
            setStatus("Soft reset")
        }

        @objc func handlePan(_ g: UIPanGestureRecognizer) {
            guard let view = g.view else { return }
            let loc = g.location(in: view)
            let moveZoneMaxX = view.bounds.width * 0.42
            switch g.state {
            case .began:
                lookPanEnabled = loc.x >= moveZoneMaxX
                guard lookPanEnabled else { return }
            case .changed:
                guard lookPanEnabled else { return }
            case .ended, .cancelled, .failed:
                lookPanEnabled = false
                return
            default:
                return
            }
            let t = g.translation(in: view)
            g.setTranslation(.zero, in: view)
            yaw += Float(t.x) * 0.0052
            pitch -= Float(t.y) * 0.0036
            pitch = max(-1.05, min(0.95, pitch))
            applyCameraMode()
        }

        private func eyeWorldPosition() -> SCNVector3 {
            PlayCameraHelper.eyeWorldPosition(anchor: playerAnchor)
        }

        // MARK: - Frame

        func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
            guard sceneConfigured, let scene = scnView?.scene, let anchor = playerAnchor else { return }
            guard combatEnabled else {
                lastUpdateTime = 0
                return
            }

            let dt: Float
            if lastUpdateTime == 0 {
                dt = 1.0 / 60.0
            } else {
                dt = min(0.05, Float(time - lastUpdateTime))
            }
            lastUpdateTime = time

            anchor.eulerAngles.y = yaw
            if isBlocked(x: anchor.position.x, z: anchor.position.z) {
                let free = resolveFreePosition(x: anchor.position.x, z: anchor.position.z, radius: playerRadius)
                anchor.position = SCNVector3(free.x, 0, free.z)
            }

            let ax = Float(moveAxis.x)
            let ay = Float(moveAxis.y)
            let mag = min(1, sqrt(ax * ax + ay * ay))
            if mag > 0.001 {
                let forwardX = -sin(yaw)
                let forwardZ = -cos(yaw)
                let rightX = cos(yaw)
                let rightZ = -sin(yaw)
                let worldX = rightX * ax + forwardX * ay
                let worldZ = rightZ * ax + forwardZ * ay
                let dirLen = max(0.001, sqrt(worldX * worldX + worldZ * worldZ))
                let dx = worldX / dirLen
                let dz = worldZ / dirLen
                let speed = moveSpeed * (0.45 + 0.55 * mag) * 1.15
                let step = speed * dt
                let current = eyeWorldPosition()
                let moved = tryMove(fromX: current.x, fromZ: current.z, dx: dx, dz: dz, step: step, in: scene)
                anchor.position = SCNVector3(moved.x, 0, moved.z)
            }

            if thirdPersonMode, let cam = playerCamera {
                PlayCameraHelper.syncThirdPersonPitch(camera: cam, pitch: pitch)
            }

            let eye = eyeWorldPosition()
            if hasPlayerEyeSample {
                let pdx = eye.x - lastPlayerEye.x
                let pdz = eye.z - lastPlayerEye.z
                playerSpeedXZ = sqrt(pdx * pdx + pdz * pdz) / max(dt, 0.001)
            } else {
                hasPlayerEyeSample = true
            }
            lastPlayerEye = eye
            if enemyAITick & 1 == 0 {
                collectPickups(near: eye)
                processPickupRespawns(in: scene)
            }
            updateEnemies(playerEye: eye, in: scene, dt: dt)
            processDummyRespawns(in: scene)
        }

        private func isBlocked(x: Float, z: Float) -> Bool {
            if abs(x) > mapHalfExtent || abs(z) > mapHalfExtent { return true }
            for box in colliders where box.contains(x, z, radius: playerRadius) { return true }
            return false
        }

        private func resolveFreePosition(x: Float, z: Float, radius: Float) -> (x: Float, z: Float) {
            var px = max(-mapHalfExtent, min(mapHalfExtent, x))
            var pz = max(-mapHalfExtent, min(mapHalfExtent, z))
            for _ in 0..<6 {
                var moved = false
                for box in colliders {
                    let push = box.pushOut(x: px, z: pz, radius: radius)
                    if push.0 != 0 || push.1 != 0 {
                        px += push.0; pz += push.1; moved = true
                    }
                }
                px = max(-mapHalfExtent, min(mapHalfExtent, px))
                pz = max(-mapHalfExtent, min(mapHalfExtent, pz))
                if !moved { break }
            }
            if !isBlocked(x: px, z: pz) { return (px, pz) }
            let step: Float = 0.55
            for ring in 1...12 {
                let count = ring * 6
                for i in 0..<count {
                    let a = Float(i) / Float(count) * (.pi * 2)
                    let sx = x + cos(a) * step * Float(ring)
                    let sz = z + sin(a) * step * Float(ring)
                    let cx = max(-mapHalfExtent, min(mapHalfExtent, sx))
                    let cz = max(-mapHalfExtent, min(mapHalfExtent, sz))
                    if !isBlocked(x: cx, z: cz) { return (cx, cz) }
                }
            }
            return (px, pz)
        }

        private func hasLineOfSight(fromX: Float, fromZ: Float, toX: Float, toZ: Float) -> Bool {
            let dx = toX - fromX
            let dz = toZ - fromZ
            let len = sqrt(dx * dx + dz * dz)
            guard len > 0.05 else { return true }
            let inv = 1 / len
            let inset: Float = min(0.22, len * 0.35)
            let x0 = fromX + dx * inv * inset
            let z0 = fromZ + dz * inv * inset
            let x1 = toX - dx * inv * inset
            let z1 = toZ - dz * inv * inset
            for box in colliders where box.intersectsSegment(x0: x0, z0: z0, x1: x1, z1: z1) {
                return false
            }
            return true
        }

        private func wallDistanceAlongRay(originX: Float, originZ: Float, dirX: Float, dirZ: Float, maxDist: Float) -> Float {
            let lenXZ = sqrt(dirX * dirX + dirZ * dirZ)
            guard lenXZ > 1e-5 else { return maxDist }
            let nx = dirX / lenXZ
            let nz = dirZ / lenXZ
            let endX = originX + nx * maxDist
            let endZ = originZ + nz * maxDist
            var best = maxDist
            for box in colliders {
                if let t = box.firstIntersectionT(x0: originX, z0: originZ, x1: endX, z1: endZ) {
                    let d = t * maxDist
                    if d > 0.12, d < best { best = d }
                }
            }
            return best
        }

        private func tryMove(fromX: Float, fromZ: Float, dx: Float, dz: Float, step: Float, in scene: SCNScene) -> (x: Float, z: Float) {
            _ = scene
            let tryFull = SCNVector3(fromX + dx * step, 1.6, fromZ + dz * step)
            if !isBlocked(x: tryFull.x, z: tryFull.z) { return (tryFull.x, tryFull.z) }
            let tryX = SCNVector3(fromX + dx * step, 1.6, fromZ)
            let tryZ = SCNVector3(fromX, 1.6, fromZ + dz * step)
            var nx = fromX
            var nz = fromZ
            if !isBlocked(x: tryX.x, z: tryX.z) { nx = tryX.x }
            if !isBlocked(x: tryZ.x, z: tryZ.z) { nz = tryZ.z }
            return (nx, nz)
        }

        private func collectPickups(near position: SCNVector3) {
            var i = 0
            while i < pickupNodes.count {
                let node = pickupNodes[i]
                guard let name = node.name, node.parent != nil else {
                    pickupNodes.remove(at: i); continue
                }
                let dx = node.position.x - position.x
                let dz = node.position.z - position.z
                if dx * dx + dz * dz < 1.8 {
                    let pos = node.position
                    node.removeFromParentNode()
                    pickupNodes.remove(at: i)
                    if name.hasPrefix("ammo_") {
                        if !infiniteAmmo {
                            let add = max(6, magSize / 2)
                            setAmmo(min(magSize * 3, ammoCache + add))
                            setStatus("Ammo +\(add)")
                        } else {
                            setStatus("Ammo pickup (demo)")
                        }
                        SoundService.shared.playAttach(volume: soundVolume)
                        pendingPickupSpawns.append((kind: "ammo", id: i + 10, pos: pos, at: Date().addingTimeInterval(8)))
                    } else if name.hasPrefix("medkit_") {
                        let heal = 35 + operatorProfile.medkitBonus
                        setHealth(min(operatorProfile.maxHealth, healthCache + heal))
                        setStatus("Medkit +\(Int(heal)) HP")
                        SoundService.shared.playReload(volume: soundVolume)
                        pendingPickupSpawns.append((kind: "medkit", id: i + 20, pos: pos, at: Date().addingTimeInterval(10)))
                    }
                    continue
                }
                i += 1
            }
        }

        private func processPickupRespawns(in scene: SCNScene) {
            let now = Date()
            var keep: [(kind: String, id: Int, pos: SCNVector3, at: Date)] = []
            for item in pendingPickupSpawns {
                if now >= item.at {
                    let node: SCNNode
                    if item.kind == "ammo" {
                        node = MissionSceneBuilder.makeAmmoPickup(id: item.id, at: item.pos)
                    } else {
                        node = MissionSceneBuilder.makeMedkitPickup(id: item.id, at: item.pos)
                    }
                    scene.rootNode.addChildNode(node)
                    pickupNodes.append(node)
                } else {
                    keep.append(item)
                }
            }
            pendingPickupSpawns = keep
        }

        // MARK: - Dummies

        private func updateEnemies(playerEye: SCNVector3, in scene: SCNScene, dt: Float) {
            var alive = 0
            enemyAITick &+= 1
            let now = Date()
            let canHurt = softDummiesEnabled && now >= combatGraceUntil
            let buckets = 3
            let bucket = enemyAITick % buckets
            let aiTime = CACurrentMediaTime()
            let profile = aiProfile

            if enemyAITick % 40 == 0 {
                enemyNodes.removeAll { node in
                    let dead = node.parent == nil || (node.name.flatMap { enemyHP[$0] } ?? 0) <= 0
                    if dead {
                        enemyWeaponNode.removeValue(forKey: ObjectIdentifier(node))
                        if let name = node.name {
                            enemyBurstLeft.removeValue(forKey: name)
                            enemySeekCoverUntil.removeValue(forKey: name)
                        }
                    }
                    return dead
                }
            }

            for (idx, node) in enemyNodes.enumerated() {
                guard let name = node.name, let hp = enemyHP[name], hp > 0, node.parent != nil else { continue }
                alive += 1
                guard softDummiesEnabled else { continue }
                guard idx % buckets == bucket else { continue }

                let weapon = enemyWeapon[name] ?? .rifle
                let dx = playerEye.x - node.position.x
                let dz = playerEye.z - node.position.z
                let dist = sqrt(dx * dx + dz * dz)
                node.eulerAngles.y = atan2(dx, dz)

                let los = hasLineOfSight(
                    fromX: node.position.x, fromZ: node.position.z,
                    toX: playerEye.x, toZ: playerEye.z
                )
                let seekCover = now < (enemySeekCoverUntil[name] ?? .distantPast)
                let betweenBursts = weapon == .rifle
                    && (enemyBurstLeft[name] ?? 0) <= 0
                    && now < (enemyNextAttack[name] ?? .distantPast)

                let intent = EnemyCombatAI.moveIntent(
                    weapon: weapon,
                    enemyX: node.position.x,
                    enemyZ: node.position.z,
                    targetX: playerEye.x,
                    targetZ: playerEye.z,
                    dist: dist,
                    hasLOS: los,
                    seekCover: seekCover,
                    betweenBursts: betweenBursts,
                    enemyIndex: idx,
                    time: aiTime,
                    colliders: colliders,
                    profile: profile
                )
                let stepScale = dt * Float(buckets)
                if intent.shouldMove {
                    moveActor(
                        node,
                        towardX: intent.dirX,
                        towardZ: intent.dirZ,
                        speed: intent.speed,
                        dt: stepScale,
                        in: scene
                    )
                }

                guard canHurt else { continue }

                if weapon == .knife {
                    if los, dist < profile.knifeSlashRange, now >= (enemyNextAttack[name] ?? .distantPast) {
                        enemyNextAttack[name] = now.addingTimeInterval(profile.knifeCooldown)
                        damagePlayer(amount: 5, reason: "Dummy knife — soft hit")
                    }
                } else if dist < profile.rifleEngageMax, dist > 2.0, now >= (enemyNextAttack[name] ?? .distantPast) {
                    var burst = enemyBurstLeft[name] ?? profile.burstSize
                    enemyNextAttack[name] = EnemyCombatAI.scheduleAfterRifleShot(
                        now: now,
                        burstRemaining: &burst,
                        profile: profile
                    )
                    enemyBurstLeft[name] = burst
                    if burst <= 0 {
                        enemySeekCoverUntil[name] = now.addingTimeInterval(profile.coverSeekSeconds * 0.45)
                    }
                    muzzleFlash(on: enemyWeaponNode[ObjectIdentifier(node)], color: .yellow)
                    let t = CACurrentMediaTime()
                    if t - lastEnemySoundTime > 0.22 {
                        lastEnemySoundTime = t
                        SoundService.shared.playFire(bodyType: .rifle, volume: soundVolume * 0.28)
                    }
                    let chance = EnemyCombatAI.adjustedHitChance(
                        profile: profile,
                        playerSpeedXZ: playerSpeedXZ
                    )
                    if los, Float.random(in: 0...1) < chance {
                        damagePlayer(amount: 5, reason: "Dummy fire — soft hit")
                    }
                }
            }

            DispatchQueue.main.async { [weak self] in
                self?.livingDummiesBinding?.wrappedValue = alive
            }
        }

        private func processDummyRespawns(in scene: SCNScene) {
            guard softDummiesEnabled else { return }
            let now = Date()
            var done: [String] = []
            for (name, at) in enemyRespawnAt {
                guard now >= at, let spawn = enemySpawnPos[name] else { continue }
                done.append(name)
                nextEnemyID += 1
                spawnDummy(id: nextEnemyID, at: spawn, in: scene.rootNode, rifleOnly: false)
                setStatus("Dummy respawned")
            }
            for name in done {
                enemyRespawnAt.removeValue(forKey: name)
            }
        }

        private func moveActor(_ node: SCNNode, towardX: Float, towardZ: Float, speed: Float, dt: Float, in scene: SCNScene) {
            let moved = tryMove(fromX: node.position.x, fromZ: node.position.z, dx: towardX, dz: towardZ, step: speed * dt, in: scene)
            node.position.x = moved.x
            node.position.z = moved.z
            if isBlocked(x: node.position.x, z: node.position.z) {
                let free = resolveFreePosition(x: node.position.x, z: node.position.z, radius: playerRadius)
                node.position.x = free.x
                node.position.z = free.z
            }
        }

        private func muzzleFlash(on gun: SCNNode?, color: UIColor) {
            guard let gun else { return }
            spawnTransientFX(parent: gun, radius: 0.05, color: color, position: SCNVector3(0, 0, -0.4), life: 0.09)
        }

        // MARK: - Damage / fire

        private func damagePlayer(amount: Double, reason: String) {
            guard combatEnabled else { return }
            guard Date() >= combatGraceUntil else { return }
            guard Date().timeIntervalSince(playerHurtCooldown) > 0.95 else { return }
            playerHurtCooldown = Date()
            let scaled = amount * operatorProfile.damageTakenMultiplier * 0.75
            let newHP = max(0, healthCache - scaled)
            setHealth(newHP)
            setStatus(reason)
            HapticsService.fire(enabled: hapticsEnabled, bodyType: .shotgun)
            if newHP <= 0 {
                softResetPlayer()
                setStatus("Downed — soft reset (Training)")
            }
        }

        private func setStatus(_ text: String) {
            let t = CACurrentMediaTime()
            if text == lastStatusText, t - lastStatusAt < 0.45 { return }
            if t - lastStatusAt < 0.12 { return }
            lastStatusAt = t
            lastStatusText = text
            DispatchQueue.main.async { [weak self] in
                self?.statusBinding?.wrappedValue = text
            }
        }

        private func setAmmo(_ value: Int) {
            ammoCache = value
            DispatchQueue.main.async { [weak self] in self?.ammoBinding?.wrappedValue = value }
        }

        private func setHealth(_ value: Double) {
            healthCache = value
            DispatchQueue.main.async { [weak self] in self?.healthBinding?.wrappedValue = value }
        }

        func startFiring() {
            guard fireTimer == nil, combatEnabled else { return }
            let interval = blueprint?.fireInterval ?? 0.14
            let timer = Timer(timeInterval: interval, repeats: true) { [weak self] _ in self?.fireOnce() }
            RunLoop.main.add(timer, forMode: .common)
            fireTimer = timer
            fireOnce()
        }

        func stopFiring() {
            fireTimer?.invalidate()
            fireTimer = nil
        }

        private func fireOnce() {
            guard combatEnabled else { return }
            if !infiniteAmmo {
                guard ammoCache > 0 else {
                    SoundService.shared.playEmpty(volume: soundVolume)
                    stopFiring(); wantsFiring = false
                    return
                }
                setAmmo(ammoCache - 1)
            } else if ammoCache < magSize {
                setAmmo(magSize)
            }

            let body = blueprint?.bodyType ?? .rifle
            HapticsService.fire(enabled: hapticsEnabled, bodyType: body)
            SoundService.shared.playFire(bodyType: body, volume: soundVolume)
            let kick = body.combatRecoilKick
            let gun = thirdPersonMode ? tpGun : fpGun
            gun?.removeAction(forKey: "recoil")
            gun?.runAction(.group([
                .sequence([
                    .moveBy(x: 0, y: kick.y, z: kick.z, duration: kick.duration),
                    .moveBy(x: 0, y: -kick.y, z: -kick.z, duration: kick.duration * 2.0)
                ]),
                .sequence([
                    .rotateBy(x: -kick.rot, y: 0, z: CGFloat.random(in: -0.02...0.02), duration: kick.duration),
                    .rotateBy(x: kick.rot, y: 0, z: 0, duration: kick.duration * 2.1)
                ])
            ]), forKey: "recoil")
            if let hit = raycastEnemy(body: body) {
                let base = blueprint?.shotDamage ?? shotDamage(for: body)
                let dmg = body.damageWithHeadshot(base, isHeadshot: hit.isHeadshot)
                applyDamage(to: hit.node, amount: dmg, isHeadshot: hit.isHeadshot)
            }
        }

        private func shotDamage(for body: GunBodyType) -> Int {
            switch body {
            case .pistol, .smg, .machineGun: return 1
            case .rifle: return 2
            case .shotgun: return 3
            case .sniper: return 4
            }
        }

        private struct EnemyRayHit {
            let node: SCNNode
            let isHeadshot: Bool
        }

        /// Snipers: long range + thicker capsule + generous head sphere. Wall LOS still blocks.
        private func raycastEnemy(body: GunBodyType) -> EnemyRayHit? {
            let eye = eyeWorldPosition()
            let bloom = blueprint?.accuracyBloom ?? body.accuracyBloom
            let ox = bloom > 0 ? Float.random(in: -bloom...bloom) : 0
            let oy = bloom > 0 ? Float.random(in: -bloom...bloom) : 0
            var lookX = -sin(yaw) * cos(pitch) + ox
            var lookY = sin(pitch) + oy
            var lookZ = -cos(yaw) * cos(pitch)
            let lookLen = max(0.001, sqrt(lookX * lookX + lookY * lookY + lookZ * lookZ))
            lookX /= lookLen; lookY /= lookLen; lookZ /= lookLen
            let maxRange = body.trainingEngagementRange
            let hitR2 = body.hitRadiusSquared
            let headR2 = body.headHitRadiusSquared
            let headY = body.headHitCenterY
            let wallCap = wallDistanceAlongRay(originX: eye.x, originZ: eye.z, dirX: lookX, dirZ: lookZ, maxDist: maxRange)
            var bestDist: Float = min(maxRange, wallCap)
            var best: EnemyRayHit?
            for enemy in enemyNodes {
                guard let name = enemy.name, let hp = enemyHP[name], hp > 0, enemy.parent != nil else { continue }
                let ex = enemy.position.x
                let ez = enemy.position.z
                guard hasLineOfSight(fromX: eye.x, fromZ: eye.z, toX: ex, toZ: ez) else { continue }

                do {
                    let toX = ex - eye.x
                    let toY = headY - eye.y
                    let toZ = ez - eye.z
                    let along = toX * lookX + toY * lookY + toZ * lookZ
                    if along > 0.4, along < bestDist {
                        let cx = eye.x + lookX * along
                        let cy = eye.y + lookY * along
                        let cz = eye.z + lookZ * along
                        let dx = cx - ex; let dy = cy - headY; let dz = cz - ez
                        if dx * dx + dy * dy + dz * dz < headR2 {
                            bestDist = along
                            best = EnemyRayHit(node: enemy, isHeadshot: true)
                            continue
                        }
                    }
                }

                for bodyY in body.hitSampleHeights {
                    let toX = ex - eye.x
                    let toY = bodyY - eye.y
                    let toZ = ez - eye.z
                    let along = toX * lookX + toY * lookY + toZ * lookZ
                    guard along > 0.4, along < bestDist else { continue }
                    let cx = eye.x + lookX * along
                    let cy = eye.y + lookY * along
                    let cz = eye.z + lookZ * along
                    let dx = cx - ex; let dy = cy - bodyY; let dz = cz - ez
                    if dx * dx + dy * dy + dz * dz < hitR2 {
                        bestDist = along
                        best = EnemyRayHit(node: enemy, isHeadshot: false)
                        break
                    }
                }
            }
            return best
        }

        private func applyDamage(to enemy: SCNNode, amount: Int, isHeadshot: Bool = false) {
            guard combatEnabled else { return }
            guard let name = enemy.name, let hp = enemyHP[name], hp > 0 else { return }
            let maxHP = max(1, enemyMaxHP[name] ?? hp)
            let newHP = max(0, hp - max(1, amount))
            enemyHP[name] = newHP
            MissionSceneBuilder.updateEnemyHealthBar(on: enemy, ratio: Float(newHP) / Float(maxHP))
            let sparkY: Float = isHeadshot ? 1.78 : 1.3
            spawnTransientFX(
                parent: enemy,
                radius: isHeadshot ? 0.09 : 0.06,
                color: isHeadshot ? .red : .orange,
                position: SCNVector3(0, sparkY, 0),
                life: isHeadshot ? 0.14 : 0.1
            )
            if isHeadshot {
                SoundService.shared.playHeadshot(volume: soundVolume)
            } else {
                SoundService.shared.playHit(volume: soundVolume)
            }
            if newHP > 0 {
                enemySeekCoverUntil[name] = Date().addingTimeInterval(aiProfile.coverSeekSeconds * 0.7)
                setStatus(isHeadshot ? "HEADSHOT — \(newHP) HP" : "Hit — \(newHP) HP")
                let juice = onCombatJuice
                let kind: CombatJuiceKind = isHeadshot ? .headshot : .hit
                DispatchQueue.main.async { juice?(kind) }
            } else {
                dummyHitsCache += 1
                let juice = onCombatJuice
                let kind: CombatJuiceKind = isHeadshot ? .headshotKill : .kill
                DispatchQueue.main.async { [weak self] in
                    guard let self else { return }
                    juice?(kind)
                    self.dummyHitsBinding?.wrappedValue = self.dummyHitsCache
                    self.onPlayerKill?()
                }
                if !infiniteAmmo {
                    setAmmo(min(magSize * 3, ammoCache + 8))
                }
                setStatus(isHeadshot ? "HEADSHOT — Dummy down" : "Dummy down")
                SoundService.shared.playKillConfirm(volume: soundVolume)
                enemyWeaponNode.removeValue(forKey: ObjectIdentifier(enemy))
                enemy.childNode(withName: "healthBar", recursively: false)?.isHidden = true
                if softDummiesEnabled {
                    enemyRespawnAt[name] = Date().addingTimeInterval(3.5)
                }
                let victim = enemy
                DispatchQueue.main.async {
                    victim.runAction(.sequence([.fadeOut(duration: 0.16), .removeFromParentNode()]))
                }
            }
        }

        private func spawnTransientFX(parent: SCNNode, radius: CGFloat, color: UIColor, position: SCNVector3, life: TimeInterval) {
            guard activeFXCount < maxActiveFX else { return }
            activeFXCount += 1
            let flash = SCNNode(geometry: SCNSphere(radius: radius))
            flash.geometry?.firstMaterial?.emission.contents = color
            flash.geometry?.firstMaterial?.lightingModel = .constant
            flash.position = position
            parent.addChildNode(flash)
            flash.runAction(.sequence([
                .wait(duration: life * 0.45),
                .fadeOut(duration: life * 0.55),
                .removeFromParentNode(),
                .run { [weak self] _ in
                    self?.activeFXCount = max(0, (self?.activeFXCount ?? 1) - 1)
                }
            ]))
        }
    }
}
