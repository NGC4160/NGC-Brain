// GunSceneBuilder.swift
// Procedural SceneKit toy-gun geometry — stylized blocks, not realistic models.
// Attachments are simple child nodes parented to named sockets.

import SceneKit
import SwiftUI
import UIKit

enum GunSceneBuilder {

    // MARK: - Public scenes

    /// Orbit-camera inspect scene used by Armory / Build / Paint / Skins.
    static func makeInspectScene(blueprint: GunBlueprint) -> SCNScene {
        let scene = SCNScene()
        scene.background.contents = UIColor(GGGTheme.background)

        addLighting(to: scene)
        addFloor(to: scene)

        let gun = buildGunNode(blueprint: blueprint)
        gun.name = "gunRoot"
        gun.position = SCNVector3(0, 0.35, 0)
        scene.rootNode.addChildNode(gun)

        let camera = SCNNode()
        camera.name = "camera"
        camera.camera = SCNCamera()
        camera.camera?.fieldOfView = 42
        camera.camera?.wantsHDR = true
        camera.position = SCNVector3(0.9, 0.7, 2.2)
        camera.look(at: SCNVector3(0, 0.35, 0))
        scene.rootNode.addChildNode(camera)

        return scene
    }

    /// First-person-ish Range scene with indoor walls, floor, and target props.
    static func makeRangeScene(blueprint: GunBlueprint) -> SCNScene {
        let scene = SCNScene()
        scene.background.contents = UIColor(red: 0.08, green: 0.10, blue: 0.09, alpha: 1)

        addLighting(to: scene)
        addRangeRoom(to: scene)

        let gun = buildGunNode(blueprint: blueprint)
        gun.name = "gunRoot"
        // Held slightly in front of camera for a toy FPS feel.
        gun.position = SCNVector3(0.18, -0.22, -0.55)
        gun.eulerAngles = SCNVector3(-0.08, 0.08, 0)
        gun.scale = SCNVector3(0.55, 0.55, 0.55)

        let camera = SCNNode()
        camera.name = "camera"
        camera.camera = SCNCamera()
        camera.camera?.fieldOfView = 65
        camera.position = SCNVector3(0, 1.4, 0)
        camera.addChildNode(gun)
        scene.rootNode.addChildNode(camera)

        addTargets(to: scene)
        return scene
    }

    // MARK: - Gun assembly

    static func buildGunNode(blueprint: GunBlueprint) -> SCNNode {
        let root = SCNNode()
        root.name = "gunRoot"

        let body = makeBody(for: blueprint.bodyType)
        body.name = "body"
        applyFinish(to: body, blueprint: blueprint, region: .body)
        root.addChildNode(body)

        // Named sockets for modular attachments.
        let sockets = makeSockets(for: blueprint.bodyType)
        for (slot, socket) in sockets {
            root.addChildNode(socket)
            if let part = blueprint.part(for: slot) {
                let node = makeAttachmentNode(part: part)
                applyFinish(to: node, blueprint: blueprint, region: .attachments)
                socket.addChildNode(node)
            }
        }

        // Region-colored accents from paint strokes (fill overrides).
        applyRegionFills(to: root, blueprint: blueprint)
        return root
    }

    // MARK: - Bodies (procedural boxes)

    private static func makeBody(for type: GunBodyType) -> SCNNode {
        let node = SCNNode()
        switch type {
        case .pistol:
            node.addChildNode(box("receiver", w: 0.18, h: 0.14, d: 0.45, color: .darkGray, at: SCNVector3(0, 0.05, 0)))
            node.addChildNode(box("barrel", w: 0.07, h: 0.07, d: 0.35, color: .gray, at: SCNVector3(0, 0.08, -0.35)))
            node.addChildNode(box("gripBlock", w: 0.12, h: 0.28, d: 0.14, color: .black, at: SCNVector3(0, -0.12, 0.08)))
            node.addChildNode(box("slide", w: 0.16, h: 0.06, d: 0.40, color: .darkGray, at: SCNVector3(0, 0.14, -0.02)))
        case .smg:
            node.addChildNode(box("receiver", w: 0.16, h: 0.16, d: 0.55, color: .darkGray, at: SCNVector3(0, 0.08, 0)))
            node.addChildNode(box("barrel", w: 0.06, h: 0.06, d: 0.40, color: .gray, at: SCNVector3(0, 0.10, -0.42)))
            node.addChildNode(box("gripBlock", w: 0.11, h: 0.26, d: 0.13, color: .black, at: SCNVector3(0, -0.10, 0.10)))
            node.addChildNode(box("handguard", w: 0.14, h: 0.10, d: 0.28, color: .darkGray, at: SCNVector3(0, 0.04, -0.22)))
        case .rifle:
            node.addChildNode(box("receiver", w: 0.15, h: 0.15, d: 0.70, color: .darkGray, at: SCNVector3(0, 0.10, 0)))
            node.addChildNode(box("barrel", w: 0.05, h: 0.05, d: 0.70, color: .gray, at: SCNVector3(0, 0.12, -0.60)))
            node.addChildNode(box("gripBlock", w: 0.11, h: 0.24, d: 0.12, color: .black, at: SCNVector3(0, -0.08, 0.18)))
            node.addChildNode(box("handguard", w: 0.13, h: 0.10, d: 0.40, color: .darkGray, at: SCNVector3(0, 0.06, -0.28)))
            node.addChildNode(box("railTop", w: 0.08, h: 0.03, d: 0.50, color: .black, at: SCNVector3(0, 0.20, -0.05)))
        case .shotgun:
            node.addChildNode(box("receiver", w: 0.18, h: 0.16, d: 0.55, color: .darkGray, at: SCNVector3(0, 0.08, 0)))
            node.addChildNode(box("barrel", w: 0.09, h: 0.09, d: 0.55, color: .gray, at: SCNVector3(0, 0.10, -0.48)))
            node.addChildNode(box("gripBlock", w: 0.12, h: 0.26, d: 0.14, color: .black, at: SCNVector3(0, -0.10, 0.14)))
            node.addChildNode(box("pump", w: 0.12, h: 0.10, d: 0.22, color: .black, at: SCNVector3(0, 0.02, -0.22)))
        }
        return node
    }

    private static func makeSockets(for type: GunBodyType) -> [AttachmentSlot: SCNNode] {
        // Approximate socket positions per body — toy proportions.
        let opticZ: Float
        let muzzleZ: Float
        let stockZ: Float
        let magY: Float

        switch type {
        case .pistol:
            opticZ = -0.05; muzzleZ = -0.55; stockZ = 0.22; magY = -0.22
        case .smg:
            opticZ = -0.05; muzzleZ = -0.65; stockZ = 0.32; magY = -0.18
        case .rifle:
            opticZ = -0.05; muzzleZ = -0.95; stockZ = 0.42; magY = -0.12
        case .shotgun:
            opticZ = 0.0; muzzleZ = -0.78; stockZ = 0.36; magY = -0.16
        }

        func socket(_ name: String, at pos: SCNVector3) -> SCNNode {
            let n = SCNNode()
            n.name = name
            n.position = pos
            return n
        }

        return [
            .optic: socket("socket_optic", at: SCNVector3(0, 0.24, opticZ)),
            .muzzle: socket("socket_muzzle", at: SCNVector3(0, 0.10, muzzleZ)),
            .grip: socket("socket_grip", at: SCNVector3(0, -0.02, -0.15)),
            .stock: socket("socket_stock", at: SCNVector3(0, 0.08, stockZ)),
            .magazine: socket("socket_magazine", at: SCNVector3(0, magY, 0.05)),
            .underbarrel: socket("socket_underbarrel", at: SCNVector3(0, -0.02, -0.30))
        ]
    }

    private static func makeAttachmentNode(part: AttachmentPart) -> SCNNode {
        let color = UIColor.from(swiftUI: part.accentColor)
        let node: SCNNode
        switch part.meshKey {
        case "optic_reddot":
            node = box("optic", w: 0.08, h: 0.08, d: 0.10, color: color, at: .zero)
            let lens = SCNNode(geometry: SCNSphere(radius: 0.025))
            lens.geometry?.firstMaterial?.diffuse.contents = UIColor.red
            lens.geometry?.firstMaterial?.emission.contents = UIColor.red
            lens.position = SCNVector3(0, 0.02, 0)
            node.addChildNode(lens)
        case "optic_holo":
            node = box("optic", w: 0.10, h: 0.10, d: 0.12, color: color, at: .zero)
        case "optic_scope":
            node = SCNNode()
            let tube = SCNNode(geometry: SCNCylinder(radius: 0.04, height: 0.28))
            tube.geometry?.firstMaterial?.diffuse.contents = color
            tube.eulerAngles.x = .pi / 2
            node.addChildNode(tube)
        case "muzzle_brake":
            node = box("muzzle", w: 0.09, h: 0.09, d: 0.12, color: color, at: .zero)
        case "muzzle_flash":
            node = SCNNode(geometry: SCNCone(topRadius: 0.02, bottomRadius: 0.07, height: 0.14))
            node.geometry?.firstMaterial?.diffuse.contents = color
            node.eulerAngles.x = -.pi / 2
        case "muzzle_comp":
            node = box("muzzle", w: 0.08, h: 0.08, d: 0.10, color: color, at: .zero)
        case "grip_vertical":
            node = box("grip", w: 0.07, h: 0.16, d: 0.07, color: color, at: SCNVector3(0, -0.08, 0))
        case "grip_angled":
            node = box("grip", w: 0.08, h: 0.08, d: 0.14, color: color, at: SCNVector3(0, -0.04, 0.02))
            node.eulerAngles.x = 0.4
        case "stock_solid":
            node = box("stock", w: 0.10, h: 0.14, d: 0.28, color: color, at: SCNVector3(0, 0, 0.10))
        case "stock_fold":
            node = box("stock", w: 0.06, h: 0.10, d: 0.22, color: color, at: SCNVector3(0, 0.02, 0.08))
        case "mag_std":
            node = box("mag", w: 0.08, h: 0.18, d: 0.10, color: color, at: SCNVector3(0, -0.06, 0))
        case "mag_drum":
            node = SCNNode(geometry: SCNCylinder(radius: 0.10, height: 0.08))
            node.geometry?.firstMaterial?.diffuse.contents = color
            node.eulerAngles.z = .pi / 2
            node.position = SCNVector3(0, -0.08, 0)
        case "mag_extended":
            node = box("mag", w: 0.08, h: 0.28, d: 0.10, color: color, at: SCNVector3(0, -0.10, 0))
        case "ub_laser":
            node = box("ub", w: 0.05, h: 0.05, d: 0.14, color: color, at: .zero)
            node.geometry?.firstMaterial?.emission.contents = color
        case "ub_light":
            node = box("ub", w: 0.06, h: 0.06, d: 0.12, color: color, at: .zero)
        case "ub_rail":
            node = box("ub", w: 0.08, h: 0.04, d: 0.20, color: color, at: .zero)
        default:
            node = box("part", w: 0.08, h: 0.08, d: 0.08, color: color, at: .zero)
        }
        node.name = part.meshKey
        return node
    }

    // MARK: - Materials / finishes

    private static func applyFinish(to node: SCNNode, blueprint: GunBlueprint, region: PaintRegion) {
        let skin = blueprint.premadeSkin ?? .matteBlack
        let base = UIColor.from(swiftUI: Color(hex: skin.primaryHex) ?? GGGTheme.steel)
        let accent = UIColor.from(swiftUI: Color(hex: skin.accentHex) ?? GGGTheme.neonAccent)

        node.enumerateChildNodes { child, _ in
            guard let mat = child.geometry?.firstMaterial else { return }
            mat.lightingModel = .physicallyBased
            switch skin.pattern {
            case .solid:
                mat.diffuse.contents = base
                mat.metalness.contents = 0.15
                mat.roughness.contents = 0.65
            case .camo:
                mat.diffuse.contents = camoImage(base: base, accent: accent)
                mat.metalness.contents = 0.05
                mat.roughness.contents = 0.8
            case .metal:
                mat.diffuse.contents = base
                mat.metalness.contents = 0.95
                mat.roughness.contents = 0.18
                mat.emission.contents = UIColor.clear
            case .neon:
                mat.diffuse.contents = base
                mat.emission.contents = accent.withAlphaComponent(0.55)
                mat.metalness.contents = 0.3
                mat.roughness.contents = 0.4
            }
            _ = region
        }
    }

    private static func applyRegionFills(to root: SCNNode, blueprint: GunBlueprint) {
        // Last fill stroke per region wins.
        var fills: [PaintRegion: UIColor] = [:]
        for stroke in blueprint.paintStrokes where stroke.tool == PaintTool.fill.rawValue {
            fills[stroke.region] = UIColor.from(swiftUI: Color(hex: stroke.colorHex) ?? .white)
        }
        guard !fills.isEmpty else { return }

        func tint(_ nameContains: String, color: UIColor) {
            root.enumerateChildNodes { child, _ in
                guard let name = child.name, name.lowercased().contains(nameContains),
                      let mat = child.geometry?.firstMaterial else { return }
                mat.diffuse.contents = color
            }
        }

        if let c = fills[.body] { tint("receiver", color: c); tint("handguard", color: c); tint("slide", color: c); tint("pump", color: c) }
        if let c = fills[.barrel] { tint("barrel", color: c) }
        if let c = fills[.grip] { tint("grip", color: c) }
        if let c = fills[.stock] { tint("stock", color: c) }
        if let c = fills[.attachments] {
            for slot in AttachmentSlot.allCases {
                if let socket = root.childNode(withName: "socket_\(slot.rawValue)", recursively: true) {
                    socket.enumerateChildNodes { child, _ in
                        child.geometry?.firstMaterial?.diffuse.contents = c
                    }
                }
            }
        }

        // Spray / camo stamps — approximate as small emissive discs near region centers.
        for stroke in blueprint.paintStrokes where stroke.tool != PaintTool.fill.rawValue {
            let stamp = SCNNode(geometry: SCNSphere(radius: CGFloat(0.02 + stroke.size * 0.04)))
            let color = UIColor.from(swiftUI: Color(hex: stroke.colorHex) ?? GGGTheme.neonAccent)
            stamp.geometry?.firstMaterial?.diffuse.contents = color
            stamp.geometry?.firstMaterial?.emission.contents = color.withAlphaComponent(0.35)
            stamp.position = SCNVector3(
                Float(stroke.x - 0.5) * 0.3,
                Float(stroke.y) * 0.25,
                Float((stroke.x + stroke.y) * 0.2 - 0.2)
            )
            stamp.name = "paintStamp"
            root.addChildNode(stamp)
        }
    }

    private static func camoImage(base: UIColor, accent: UIColor) -> UIImage {
        let size = CGSize(width: 64, height: 64)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            base.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
            accent.withAlphaComponent(0.7).setFill()
            for _ in 0..<18 {
                let r = CGRect(
                    x: CGFloat.random(in: 0...56),
                    y: CGFloat.random(in: 0...56),
                    width: CGFloat.random(in: 6...16),
                    height: CGFloat.random(in: 6...16)
                )
                ctx.cgContext.fillEllipse(in: r)
            }
        }
    }

    // MARK: - Environment

    private static func addLighting(to scene: SCNScene) {
        let ambient = SCNNode()
        ambient.light = SCNLight()
        ambient.light?.type = .ambient
        ambient.light?.intensity = 300
        ambient.light?.color = UIColor(white: 0.7, alpha: 1)
        scene.rootNode.addChildNode(ambient)

        let key = SCNNode()
        key.light = SCNLight()
        key.light?.type = .directional
        key.light?.intensity = 800
        key.light?.castsShadow = true
        key.eulerAngles = SCNVector3(-0.9, 0.6, 0)
        scene.rootNode.addChildNode(key)

        let rim = SCNNode()
        rim.light = SCNLight()
        rim.light?.type = .omni
        rim.light?.intensity = 400
        rim.light?.color = UIColor.from(swiftUI: GGGTheme.neonAccent)
        rim.position = SCNVector3(-1.5, 1.2, 1.0)
        scene.rootNode.addChildNode(rim)
    }

    private static func addFloor(to scene: SCNScene) {
        let floor = SCNFloor()
        floor.reflectivity = 0.05
        floor.firstMaterial?.diffuse.contents = UIColor(white: 0.08, alpha: 1)
        floor.firstMaterial?.roughness.contents = 0.9
        let node = SCNNode(geometry: floor)
        node.position = SCNVector3(0, 0, 0)
        scene.rootNode.addChildNode(node)
    }

    private static func addRangeRoom(to scene: SCNScene) {
        addFloor(to: scene)

        let wallMat = UIColor(red: 0.12, green: 0.14, blue: 0.13, alpha: 1)
        let back = box("backWall", w: 12, h: 4, d: 0.2, color: wallMat, at: SCNVector3(0, 2, -14))
        let left = box("leftWall", w: 0.2, h: 4, d: 16, color: wallMat, at: SCNVector3(-6, 2, -6))
        let right = box("rightWall", w: 0.2, h: 4, d: 16, color: wallMat, at: SCNVector3(6, 2, -6))
        scene.rootNode.addChildNode(back)
        scene.rootNode.addChildNode(left)
        scene.rootNode.addChildNode(right)

        // Neon strip accent
        let neon = UIColor.from(swiftUI: GGGTheme.neonAccent)
        let strip = box("neonStrip", w: 8, h: 0.08, d: 0.08, color: neon, at: SCNVector3(0, 3.5, -13.8))
        strip.geometry?.firstMaterial?.emission.contents = neon
        scene.rootNode.addChildNode(strip)
    }

    private static func addTargets(to scene: SCNScene) {
        let positions: [SCNVector3] = [
            SCNVector3(-2.2, 1.0, -8),
            SCNVector3(0, 1.0, -9.5),
            SCNVector3(2.0, 1.0, -8.5),
            SCNVector3(-1.0, 1.4, -11),
            SCNVector3(1.4, 0.8, -10.5),
            SCNVector3(0.2, 1.2, -12.5)
        ]
        for (i, pos) in positions.enumerated() {
            let target = makeTargetNode(index: i)
            target.position = pos
            scene.rootNode.addChildNode(target)
        }
    }

    static func makeTargetNode(index: Int) -> SCNNode {
        let root = SCNNode()
        root.name = "target_\(index)"

        let stand = box("stand", w: 0.08, h: 1.2, d: 0.08, color: .darkGray, at: SCNVector3(0, 0, 0))
        let plate = SCNNode(geometry: SCNCylinder(radius: 0.35, height: 0.06))
        plate.name = "plate"
        plate.geometry?.firstMaterial?.diffuse.contents = UIColor(white: 0.92, alpha: 1)
        plate.geometry?.firstMaterial?.emission.contents = UIColor.from(swiftUI: GGGTheme.neonAmber).withAlphaComponent(0.15)
        plate.eulerAngles.x = .pi / 2
        plate.position = SCNVector3(0, 0.7, 0)

        let ring = SCNNode(geometry: SCNTorus(ringRadius: 0.22, pipeRadius: 0.03))
        ring.geometry?.firstMaterial?.diffuse.contents = UIColor.from(swiftUI: GGGTheme.danger)
        ring.eulerAngles.x = .pi / 2
        ring.position = SCNVector3(0, 0.7, 0.04)

        root.addChildNode(stand)
        root.addChildNode(plate)
        root.addChildNode(ring)

        // Physics for arcade tip-over.
        root.physicsBody = SCNPhysicsBody(type: .dynamic, shape: nil)
        root.physicsBody?.mass = 0.8
        root.physicsBody?.friction = 0.9
        root.physicsBody?.restitution = 0.2
        root.physicsBody?.isAffectedByGravity = true
        root.physicsBody?.categoryBitMask = 2
        root.physicsBody?.contactTestBitMask = 1

        return root
    }

    // MARK: - Helpers

    private static func box(_ name: String, w: CGFloat, h: CGFloat, d: CGFloat, color: UIColor, at: SCNVector3) -> SCNNode {
        let g = SCNBox(width: w, height: h, length: d, chamferRadius: min(w, h, d) * 0.08)
        g.firstMaterial?.diffuse.contents = color
        g.firstMaterial?.roughness.contents = 0.55
        g.firstMaterial?.metalness.contents = 0.2
        let n = SCNNode(geometry: g)
        n.name = name
        n.position = at
        return n
    }
}

// Bridge SwiftUI Color → UIColor without recursing on UIColor(Color).
private extension UIColor {
    static func from(swiftUI color: Color) -> UIColor {
        UIColor(color)
    }
}
