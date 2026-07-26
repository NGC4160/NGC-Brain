// ShareCardExporter.swift
// Renders a simple share card (name + 3D snapshot) for ActivityView.

import SwiftUI
import UIKit
import SceneKit

enum ShareCardExporter {
    /// Builds a shareable UIImage: dark card with gun name + SceneKit snapshot.
    @MainActor
    static func makeCard(for blueprint: GunBlueprint, size: CGSize = CGSize(width: 1080, height: 1350)) -> UIImage? {
        let sceneView = SCNView(frame: CGRect(origin: .zero, size: CGSize(width: 900, height: 700)))
        sceneView.scene = GunSceneBuilder.makeInspectScene(blueprint: blueprint)
        sceneView.backgroundColor = UIColor(Color(GGGTheme.background))
        sceneView.antialiasingMode = .multisampling4X
        sceneView.pointOfView = sceneView.scene?.rootNode.childNode(withName: "camera", recursively: true)

        // Allow one layout pass before snapshot.
        sceneView.setNeedsLayout()
        sceneView.layoutIfNeeded()
        let snapshot = sceneView.snapshot()

        let renderer = ImageRenderer(
            content: ShareCardView(
                gunName: blueprint.name,
                bodyLabel: blueprint.bodyType.displayName,
                snapshot: Image(uiImage: snapshot)
            )
            .frame(width: size.width, height: size.height)
        )
        renderer.scale = 1
        return renderer.uiImage
    }
}

private struct ShareCardView: View {
    let gunName: String
    let bodyLabel: String
    let snapshot: Image

    var body: some View {
        ZStack {
            GGGTheme.hubGradient
            VStack(spacing: 28) {
                Text("GRAND GRAMBO GUNS")
                    .font(.system(size: 28, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAccent)
                    .tracking(4)

                snapshot
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 700)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .stroke(GGGTheme.neonAccent.opacity(0.45), lineWidth: 2)
                    )
                    .padding(.horizontal, 40)

                VStack(spacing: 8) {
                    Text(gunName)
                        .font(.system(size: 48, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text(bodyLabel.uppercased())
                        .font(.system(size: 22, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                        .tracking(3)
                }

                Text("ARCADE TOY BUILD")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
                    .padding(.top, 12)

                Spacer(minLength: 0)
            }
            .padding(.top, 64)
            .padding(.bottom, 48)
        }
    }
}

/// SwiftUI wrapper for the system share sheet.
struct ActivityShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
