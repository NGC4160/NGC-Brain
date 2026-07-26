// RangeSceneView.swift
// SceneKit range host — fire, recoil, muzzle flash, target hits.

import SwiftUI
import SceneKit

struct RangeSceneView: UIViewRepresentable {
    let blueprint: GunBlueprint
    @Binding var ammo: Int
    @Binding var score: Int
    var isFiring: Bool
    var reloadToken: Int
    var hapticsEnabled: Bool
    var soundVolume: Double

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.scene = GunSceneBuilder.makeRangeScene(blueprint: blueprint)
        view.backgroundColor = UIColor(Color(GGGTheme.background))
        view.antialiasingMode = .multisampling4X
        view.allowsCameraControl = false
        view.preferredFramesPerSecond = 60
        view.delegate = context.coordinator
        view.isPlaying = true

        // Gravity for tip-over targets.
        view.scene?.physicsWorld.gravity = SCNVector3(0, -9.8, 0)

        context.coordinator.scnView = view
        context.coordinator.blueprint = blueprint
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        context.coordinator.ammo = ammo
        context.coordinator.scoreBinding = $score
        context.coordinator.ammoBinding = $ammo
        context.coordinator.hapticsEnabled = hapticsEnabled
        context.coordinator.soundVolume = soundVolume

        if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            context.coordinator.playReload()
        }

        if isFiring {
            context.coordinator.startFiring()
        } else {
            context.coordinator.stopFiring()
        }

        // Rebuild gun if blueprint identity changed.
        if context.coordinator.blueprint?.id != blueprint.id
            || context.coordinator.blueprint?.premadeSkin != blueprint.premadeSkin
            || context.coordinator.blueprint?.attachments != blueprint.attachments {
            uiView.scene = GunSceneBuilder.makeRangeScene(blueprint: blueprint)
            uiView.scene?.physicsWorld.gravity = SCNVector3(0, -9.8, 0)
            context.coordinator.blueprint = blueprint
            context.coordinator.scnView = uiView
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, SCNSceneRendererDelegate {
        weak var scnView: SCNView?
        var blueprint: GunBlueprint?
        var ammo: Int = 0
        var ammoBinding: Binding<Int>?
        var scoreBinding: Binding<Int>?
        var hapticsEnabled = true
        var soundVolume = 0.8
        var lastReloadToken = 0

        private var fireTimer: Timer?
        private var lastFire = Date.distantPast

        func startFiring() {
            guard fireTimer == nil else { return }
            let interval = blueprint?.bodyType.fireInterval ?? 0.2
            fireTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
                DispatchQueue.main.async { self?.fireOnce() }
            }
            fireOnce()
        }

        func stopFiring() {
            fireTimer?.invalidate()
            fireTimer = nil
        }

        func playReload() {
            HapticsService.reload(enabled: hapticsEnabled)
            SoundService.shared.playReload(volume: soundVolume)
            guard let gun = scnView?.scene?.rootNode.childNode(withName: "gunRoot", recursively: true) else { return }
            let dip = SCNAction.rotateBy(x: 0.35, y: 0, z: 0, duration: 0.12)
            let up = SCNAction.rotateBy(x: -0.35, y: 0, z: 0, duration: 0.18)
            gun.runAction(.sequence([dip, up]))
        }

        private func fireOnce() {
            guard let ammoBinding, ammoBinding.wrappedValue > 0 else {
                stopFiring()
                return
            }
            ammoBinding.wrappedValue -= 1

            HapticsService.fire(enabled: hapticsEnabled)
            SoundService.shared.playFire(volume: soundVolume)
            recoil()
            muzzleFlash()
            raycastHit()
        }

        private func recoil() {
            guard let gun = scnView?.scene?.rootNode.childNode(withName: "gunRoot", recursively: true) else { return }
            let kick = SCNAction.moveBy(x: 0, y: 0.02, z: 0.04, duration: 0.04)
            let recover = SCNAction.moveBy(x: 0, y: -0.02, z: -0.04, duration: 0.08)
            let rotKick = SCNAction.rotateBy(x: -0.08, y: 0, z: CGFloat.random(in: -0.02...0.02), duration: 0.04)
            let rotRecover = SCNAction.rotateBy(x: 0.08, y: 0, z: 0, duration: 0.1)
            gun.runAction(.group([
                .sequence([kick, recover]),
                .sequence([rotKick, rotRecover])
            ]))
        }

        private func muzzleFlash() {
            guard let gun = scnView?.scene?.rootNode.childNode(withName: "gunRoot", recursively: true) else { return }
            let flash = SCNNode(geometry: SCNSphere(radius: 0.06))
            flash.geometry?.firstMaterial?.diffuse.contents = UIColor.orange
            flash.geometry?.firstMaterial?.emission.contents = UIColor.yellow
            // Approximate muzzle tip in local gun space.
            flash.position = SCNVector3(0, 0.12, -0.75)
            gun.addChildNode(flash)
            flash.runAction(.sequence([
                .wait(duration: 0.05),
                .fadeOut(duration: 0.06),
                .removeFromParentNode()
            ]))
        }

        private func raycastHit() {
            guard let view = scnView,
                  let scene = view.scene,
                  let camera = scene.rootNode.childNode(withName: "camera", recursively: true) else { return }

            // Straight-ahead arcade ray from camera.
            let origin = camera.worldPosition
            let direction = SCNVector3(0, 0, -1)
            let hits = scene.rootNode.hitTestWithSegment(
                from: origin,
                to: SCNVector3(origin.x + direction.x * 20, origin.y + direction.y * 20, origin.z + direction.z * 20)
            )

            // Also nudge nearby targets with a light impulse for more arcade fun.
            scene.rootNode.enumerateChildNodes { node, _ in
                guard let name = node.name, name.hasPrefix("target_"),
                      let body = node.physicsBody else { return }
                let dx = node.worldPosition.x - origin.x
                let dz = node.worldPosition.z - origin.z
                let dist = sqrt(dx * dx + dz * dz)
                // Cone check: roughly centered targets within 14m.
                if dist < 14, abs(dx) < 1.2 + dist * 0.05 {
                    body.applyForce(SCNVector3(dx * 0.05, 1.8, -2.5), asImpulse: true)
                    scoreBinding?.wrappedValue += 10
                    SoundService.shared.playHit(volume: soundVolume)
                    flashTarget(node)
                }
            }

            if let first = hits.first(where: { $0.node.name?.hasPrefix("target_") == true || $0.node.parent?.name?.hasPrefix("target_") == true }) {
                let target = first.node.name?.hasPrefix("target_") == true ? first.node : first.node.parent!
                target.physicsBody?.applyForce(SCNVector3(0, 2.5, -3), asImpulse: true)
                scoreBinding?.wrappedValue += 25
                flashTarget(target)
            }
        }

        private func flashTarget(_ node: SCNNode) {
            node.enumerateChildNodes { child, _ in
                guard let mat = child.geometry?.firstMaterial else { return }
                let original = mat.emission.contents
                    mat.emission.contents = UIColor(Color(GGGTheme.neonAccent))
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
                    mat.emission.contents = original
                }
            }
        }
    }
}
