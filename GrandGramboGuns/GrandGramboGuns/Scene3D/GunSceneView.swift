// GunSceneView.swift
// SwiftUI bridge for SceneKit gun inspection with rotate / zoom gestures.

import SwiftUI
import SceneKit

struct GunSceneView: UIViewRepresentable {
    let blueprint: GunBlueprint
    var allowsCameraControl: Bool = true
    var autoSpin: Bool = false
    /// When true, uses held-gun framing for Shake to Shoot.
    var shakeHeldPose: Bool = false
    /// Compact Armory cells — no MSAA, low FPS, lighter scale.
    var thumbnailMode: Bool = false
    var onSnapshotReady: ((SCNView) -> Void)? = nil

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.backgroundColor = UIColor(GGGTheme.background)
        view.allowsCameraControl = allowsCameraControl
        view.autoenablesDefaultLighting = false
        view.isTemporalAntialiasingEnabled = false

        if thumbnailMode {
            view.antialiasingMode = .none
            view.preferredFramesPerSecond = 20
            view.contentScaleFactor = min(UIScreen.main.scale, 1.5)
        } else {
            // Inspect / paint / shake: one MSAA sample is enough; 30fps avoids UI thrash.
            view.antialiasingMode = .multisampling2X
            view.preferredFramesPerSecond = 30
            view.contentScaleFactor = min(UIScreen.main.scale, 2.0)
        }

        view.delegate = context.coordinator
        context.coordinator.scnView = view
        context.coordinator.thumbnailMode = thumbnailMode
        context.coordinator.apply(
            blueprint: blueprint,
            shakeHeldPose: shakeHeldPose,
            to: view,
            preserveCamera: false,
            autoSpin: autoSpin
        )

        // Custom pinch already covered by allowsCameraControl; add double-tap reset.
        if !thumbnailMode {
            let doubleTap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.resetCamera(_:)))
            doubleTap.numberOfTapsRequired = 2
            view.addGestureRecognizer(doubleTap)
        }

        if let onSnapshotReady {
            DispatchQueue.main.async {
                onSnapshotReady(view)
            }
        }
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        let c = context.coordinator
        c.scnView = uiView
        uiView.allowsCameraControl = allowsCameraControl

        // Critical: do NOT rebuild the SCNScene on every SwiftUI pass —
        // that remounts the gun, flashes the camera, and tanks Armory / Paint / Build FPS.
        // Ignore name-only edits (Build gun name field) — they don't affect the mesh.
        let blueprintChanged = !Coordinator.visuallyEqual(c.appliedBlueprint, blueprint)
        let poseChanged = c.appliedShakeHeldPose != shakeHeldPose
        if blueprintChanged || poseChanged {
            c.apply(
                blueprint: blueprint,
                shakeHeldPose: shakeHeldPose,
                to: uiView,
                preserveCamera: !shakeHeldPose && !poseChanged,
                autoSpin: autoSpin
            )
        } else if autoSpin {
            c.ensureSpin(on: uiView)
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
        var appliedBlueprint: GunBlueprint?
        var appliedShakeHeldPose = false
        var thumbnailMode = false
        private var wantsSpin = false

        /// Mesh-relevant equality — name/isStarter changes must not remount SceneKit.
        static func visuallyEqual(_ a: GunBlueprint?, _ b: GunBlueprint) -> Bool {
            guard let a else { return false }
            return a.id == b.id
                && a.bodyType == b.bodyType
                && a.attachments == b.attachments
                && a.premadeSkin == b.premadeSkin
                && a.paintStrokes == b.paintStrokes
        }

        func teardown() {
            scnView?.scene?.rootNode.childNode(withName: "gunRoot", recursively: true)?
                .removeAction(forKey: "hubSpin")
            scnView?.isPlaying = false
            scnView?.delegate = nil
            scnView = nil
            appliedBlueprint = nil
        }

        func apply(
            blueprint: GunBlueprint,
            shakeHeldPose: Bool,
            to view: SCNView,
            preserveCamera: Bool,
            autoSpin: Bool
        ) {
            let cameraTransform = preserveCamera ? view.pointOfView?.transform : nil
            view.scene = shakeHeldPose
                ? GunSceneBuilder.makeShakeScene(blueprint: blueprint)
                : GunSceneBuilder.makeInspectScene(blueprint: blueprint)
            appliedBlueprint = blueprint
            appliedShakeHeldPose = shakeHeldPose
            wantsSpin = autoSpin

            if !shakeHeldPose, let cameraTransform,
               let pov = view.scene?.rootNode.childNode(withName: "camera", recursively: true) {
                pov.transform = cameraTransform
                view.pointOfView = pov
            } else if let pov = view.scene?.rootNode.childNode(withName: "camera", recursively: true) {
                view.pointOfView = pov
            }

            if autoSpin {
                ensureSpin(on: view)
                view.isPlaying = true
            } else if thumbnailMode {
                view.isPlaying = false
            }
        }

        func ensureSpin(on view: SCNView) {
            guard wantsSpin,
                  let gun = view.scene?.rootNode.childNode(withName: "gunRoot", recursively: true) else { return }
            if gun.action(forKey: "hubSpin") == nil {
                let spin = SCNAction.repeatForever(SCNAction.rotateBy(x: 0, y: CGFloat.pi * 2, z: 0, duration: 10))
                gun.runAction(spin, forKey: "hubSpin")
            }
            view.isPlaying = true
        }

        @objc func resetCamera(_ gesture: UITapGestureRecognizer) {
            guard let view = scnView,
                  let camera = view.scene?.rootNode.childNode(withName: "camera", recursively: true) else { return }
            SCNTransaction.begin()
            SCNTransaction.animationDuration = 0.35
            camera.position = SCNVector3(0.9, 0.7, 2.2)
            camera.look(at: SCNVector3(0, 0.35, 0))
            view.pointOfView = camera
            SCNTransaction.commit()
        }
    }
}

/// Compact thumbnail used in Armory grid cells.
struct GunThumbnailView: View {
    let blueprint: GunBlueprint

    var body: some View {
        GunSceneView(
            blueprint: blueprint,
            allowsCameraControl: false,
            autoSpin: true,
            thumbnailMode: true
        )
        .allowsHitTesting(false)
    }
}
