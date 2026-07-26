// GunSceneView.swift
// SwiftUI bridge for SceneKit gun inspection with rotate / zoom gestures.

import SwiftUI
import SceneKit

struct GunSceneView: UIViewRepresentable {
    let blueprint: GunBlueprint
    var allowsCameraControl: Bool = true
    var autoSpin: Bool = false
    var onSnapshotReady: ((SCNView) -> Void)? = nil

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.scene = GunSceneBuilder.makeInspectScene(blueprint: blueprint)
        view.backgroundColor = UIColor(Color(GGGTheme.background))
        view.antialiasingMode = .multisampling4X
        view.allowsCameraControl = allowsCameraControl
        view.autoenablesDefaultLighting = false
        view.isTemporalAntialiasingEnabled = true
        view.preferredFramesPerSecond = 60
        view.delegate = context.coordinator

        if autoSpin {
            context.coordinator.startSpin(on: view)
        }

        // Custom pinch already covered by allowsCameraControl; add double-tap reset.
        let doubleTap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.resetCamera(_:)))
        doubleTap.numberOfTapsRequired = 2
        view.addGestureRecognizer(doubleTap)
        context.coordinator.scnView = view

        DispatchQueue.main.async {
            onSnapshotReady?(view)
        }
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        // Rebuild gun node when blueprint changes — keep camera if possible.
        let cameraTransform = uiView.pointOfView?.transform
        uiView.scene = GunSceneBuilder.makeInspectScene(blueprint: blueprint)
        if let cameraTransform, let pov = uiView.scene?.rootNode.childNode(withName: "camera", recursively: true) {
            pov.transform = cameraTransform
            uiView.pointOfView = pov
        }
        context.coordinator.scnView = uiView
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(autoSpin: autoSpin)
    }

    final class Coordinator: NSObject, SCNSceneRendererDelegate {
        var autoSpin: Bool
        weak var scnView: SCNView?
        private var spinNode: SCNNode?

        init(autoSpin: Bool) {
            self.autoSpin = autoSpin
        }

        func startSpin(on view: SCNView) {
            guard let gun = view.scene?.rootNode.childNode(withName: "gunRoot", recursively: true) else { return }
            spinNode = gun
            let spin = SCNAction.repeatForever(SCNAction.rotateBy(x: 0, y: CGFloat.pi * 2, z: 0, duration: 8))
            gun.runAction(spin, forKey: "hubSpin")
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
        GunSceneView(blueprint: blueprint, allowsCameraControl: false, autoSpin: true)
            .allowsHitTesting(false)
    }
}
