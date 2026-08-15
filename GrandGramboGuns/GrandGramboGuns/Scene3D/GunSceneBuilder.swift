// GunSceneBuilder.swift
// Procedural SceneKit gun geometry — FPS-game proportions with layered detail.
// Arcade/toy aesthetic; not real-world firearm construction data.

import SceneKit
import SwiftUI
import UIKit

enum GunSceneBuilder {

    // MARK: - Public scenes

    /// Orbit-camera inspect scene used by Armory / Build / Paint / Skins.
    static func makeInspectScene(blueprint: GunBlueprint) -> SCNScene {
        makeGunPresentationScene(blueprint: blueprint, style: .inspect)
    }

    /// Side-profile held-gun framing for Shake to Shoot (phone-as-gun pose).
    static func makeShakeScene(blueprint: GunBlueprint) -> SCNScene {
        makeGunPresentationScene(blueprint: blueprint, style: .shakeHeld)
    }

    private enum PresentationStyle { case inspect, shakeHeld }

    private static func makeGunPresentationScene(blueprint: GunBlueprint, style: PresentationStyle) -> SCNScene {
        let scene = SCNScene()
        scene.background.contents = UIColor(GGGTheme.background)

        addLighting(to: scene)
        if style == .inspect {
            addFloor(to: scene)
        }

        let gun = buildGunNode(blueprint: blueprint)
        gun.name = "gunRoot"

        let camera = SCNNode()
        camera.name = "camera"
        camera.camera = SCNCamera()
        camera.camera?.wantsHDR = true

        switch style {
        case .inspect:
            gun.position = SCNVector3(0, 0.35, 0)
            camera.camera?.fieldOfView = 42
            camera.position = SCNVector3(0.9, 0.7, 2.2)
            camera.look(at: SCNVector3(0, 0.35, 0))
        case .shakeHeld:
            // Framed like holding the phone as a pistol — gun fills the screen from the right.
            gun.position = SCNVector3(0.15, 0.15, 0)
            gun.eulerAngles = SCNVector3(-0.15, 0.55, 0.08)
            camera.camera?.fieldOfView = 38
            camera.position = SCNVector3(0.55, 0.45, 1.35)
            camera.look(at: SCNVector3(0.05, 0.18, -0.15))
        }

        scene.rootNode.addChildNode(gun)
        scene.rootNode.addChildNode(camera)
        return scene
    }

    /// Range bay — environment + targets. Player rig (anchor / body / camera / guns) is owned by `RangeSceneView`.
    static func makeRangeScene(blueprint: GunBlueprint) -> SCNScene {
        let scene = SCNScene()
        // Sky set inside addRangeRoom; keep a fallback.
        scene.background.contents = UIColor(red: 0.45, green: 0.62, blue: 0.78, alpha: 1)

        addLighting(to: scene)
        addRangeRoom(to: scene)
        addTargets(to: scene)
        // Camera / player rig is owned by RangeSceneView via installRangePlayerRig.
        _ = blueprint

        return scene
    }

    /// Install player anchor, body, and camera for Range (FP/TP). Returns nodes for the coordinator.
    static func installRangePlayerRig(
        in scene: SCNScene,
        look: OperatorAppearance
    ) -> (anchor: SCNNode, body: SCNNode, camera: SCNNode) {
        scene.rootNode.childNode(withName: "playerAnchor", recursively: false)?.removeFromParentNode()
        // Clear any legacy root camera left by older builds.
        scene.rootNode.childNode(withName: "camera", recursively: false)?.removeFromParentNode()

        let anchor = SCNNode()
        anchor.name = "playerAnchor"
        // Into the lane so compact TP chase cam sits inside the stall, not behind stallBack.
        anchor.position = SCNVector3(0, 0, -1.15)
        scene.rootNode.addChildNode(anchor)

        let body = MissionSceneBuilder.makePlayerBodyNode(look: look)
        anchor.addChildNode(body)

        let camera = SCNNode()
        camera.name = "camera"
        camera.camera = SCNCamera()
        camera.camera?.fieldOfView = 65
        camera.camera?.zNear = 0.08
        camera.camera?.zFar = 80
        anchor.addChildNode(camera)

        return (anchor, body, camera)
    }

    // MARK: - Gun assembly

    static func buildGunNode(blueprint: GunBlueprint) -> SCNNode {
        let root = SCNNode()
        root.name = "gunRoot"

        let body = makeBody(for: blueprint.bodyType)
        body.name = "body"
        applyFinish(to: body, blueprint: blueprint, region: .body)
        root.addChildNode(body)

        let sockets = makeSockets(for: blueprint.bodyType)
        for (slot, socket) in sockets {
            root.addChildNode(socket)
            if let part = blueprint.part(for: slot) {
                let node = makeAttachmentNode(part: part)
                applyFinish(to: node, blueprint: blueprint, region: .attachments)
                socket.addChildNode(node)
            }
        }

        applyRegionFills(to: root, blueprint: blueprint)
        return root
    }

    /// Low-poly gun for Story missions (far fewer nodes than Armory gun).
    static func buildLightweightGunNode(blueprint: GunBlueprint) -> SCNNode {
        let root = SCNNode()
        root.name = "gunRoot"
        let color: UIColor = {
            switch blueprint.premadeSkin {
            case .desertTan: return UIColor(red: 0.55, green: 0.48, blue: 0.35, alpha: 1)
            case .oliveDrab: return UIColor(red: 0.3, green: 0.35, blue: 0.25, alpha: 1)
            case .arcticWhite: return UIColor(white: 0.85, alpha: 1)
            case .neon: return UIColor(red: 0.2, green: 0.85, blue: 0.55, alpha: 1)
            case .gold: return UIColor(red: 0.83, green: 0.69, blue: 0.22, alpha: 1)
            default: return UIColor(white: 0.22, alpha: 1)
            }
        }()
        let dark = UIColor(white: 0.12, alpha: 1)
        let type = blueprint.bodyType

        let receiverLen: CGFloat
        let barrelLen: CGFloat
        let barrelR: CGFloat
        switch type {
        case .pistol: receiverLen = 0.28; barrelLen = 0.22; barrelR = 0.02
        case .smg: receiverLen = 0.34; barrelLen = 0.28; barrelR = 0.02
        case .rifle: receiverLen = 0.4; barrelLen = 0.45; barrelR = 0.022
        case .shotgun: receiverLen = 0.36; barrelLen = 0.4; barrelR = 0.032
        case .machineGun: receiverLen = 0.42; barrelLen = 0.5; barrelR = 0.028
        case .sniper: receiverLen = 0.44; barrelLen = 0.55; barrelR = 0.02
        }

        let receiver = SCNBox(width: 0.12, height: 0.1, length: receiverLen, chamferRadius: 0.01)
        receiver.firstMaterial?.diffuse.contents = color
        receiver.firstMaterial?.lightingModel = .constant
        let rec = SCNNode(geometry: receiver)
        rec.position = SCNVector3(0, 0.05, 0)
        root.addChildNode(rec)

        let barrel = SCNCylinder(radius: barrelR, height: barrelLen)
        barrel.firstMaterial?.diffuse.contents = dark
        barrel.firstMaterial?.lightingModel = .constant
        let bar = SCNNode(geometry: barrel)
        bar.eulerAngles.x = .pi / 2
        bar.position = SCNVector3(0, 0.06, -Float(receiverLen) * 0.5 - Float(barrelLen) * 0.45)
        root.addChildNode(bar)

        let grip = SCNBox(width: 0.09, height: 0.22, length: 0.1, chamferRadius: 0.015)
        grip.firstMaterial?.diffuse.contents = dark
        grip.firstMaterial?.lightingModel = .constant
        let g = SCNNode(geometry: grip)
        g.position = SCNVector3(0, -0.1, 0.08)
        g.eulerAngles.x = 0.25
        root.addChildNode(g)

        if type != .pistol {
            let stock = SCNBox(width: 0.08, height: 0.1, length: 0.18, chamferRadius: 0.01)
            stock.firstMaterial?.diffuse.contents = color
            stock.firstMaterial?.lightingModel = .constant
            let s = SCNNode(geometry: stock)
            s.position = SCNVector3(0, 0.05, Float(receiverLen) * 0.45)
            root.addChildNode(s)
        }
        return root
    }

    /// Local-space muzzle tip used by Range muzzle flash.
    static func muzzleTip(for type: GunBodyType) -> SCNVector3 {
        switch type {
        case .pistol: return SCNVector3(0, 0.10, -0.58)
        case .smg: return SCNVector3(0, 0.11, -0.72)
        case .rifle: return SCNVector3(0, 0.13, -1.05)
        case .shotgun: return SCNVector3(0, 0.12, -0.88)
        case .machineGun: return SCNVector3(0, 0.14, -1.15)
        case .sniper: return SCNVector3(0, 0.14, -1.35)
        }
    }

    // MARK: - Bodies

    private static func makeBody(for type: GunBodyType) -> SCNNode {
        switch type {
        case .pistol: return makePistolBody()
        case .smg: return makeSMGBody()
        case .rifle: return makeRifleBody()
        case .shotgun: return makeShotgunBody()
        case .machineGun: return makeMachineGunBody()
        case .sniper: return makeSniperBody()
        }
    }

    private static func makePistolBody() -> SCNNode {
        let node = SCNNode()
        let steel = UIColor(white: 0.32, alpha: 1)
        let dark = UIColor(white: 0.10, alpha: 1)
        let polymer = UIColor(white: 0.07, alpha: 1)
        let blued = UIColor(red: 0.14, green: 0.16, blue: 0.18, alpha: 1)

        // Frame
        node.addChildNode(box("receiver", w: 0.145, h: 0.105, d: 0.36, color: polymer, at: SCNVector3(0, 0.035, 0.03), chamfer: 0.014))
        // Beaver-tail / backstrap
        node.addChildNode(box("receiver", w: 0.12, h: 0.08, d: 0.08, color: polymer, at: SCNVector3(0, 0.05, 0.18), chamfer: 0.02))
        // Slide (slightly tapered look via layered boxes)
        node.addChildNode(box("slide", w: 0.15, h: 0.072, d: 0.40, color: blued, at: SCNVector3(0, 0.122, -0.02), chamfer: 0.008))
        node.addChildNode(box("slide", w: 0.148, h: 0.02, d: 0.38, color: steel, at: SCNVector3(0, 0.155, -0.02), chamfer: 0.004))
        // Cocking serrations (rear + front)
        for i in 0..<6 {
            let z = Float(0.10) + Float(i) * 0.022
            node.addChildNode(box("slide", w: 0.152, h: 0.035, d: 0.006, color: dark, at: SCNVector3(0, 0.125, z), chamfer: 0.001))
        }
        for i in 0..<3 {
            let z = Float(-0.14) - Float(i) * 0.02
            node.addChildNode(box("slide", w: 0.152, h: 0.03, d: 0.005, color: dark, at: SCNVector3(0, 0.125, z), chamfer: 0.001))
        }
        // Recoil spring plug / muzzle bushing
        node.addChildNode(cylinder("barrel", radius: 0.032, height: 0.04, color: steel, at: SCNVector3(0, 0.10, -0.24), axis: .z))
        // Barrel
        node.addChildNode(cylinder("barrel", radius: 0.022, height: 0.26, color: UIColor(white: 0.18, alpha: 1), at: SCNVector3(0, 0.10, -0.40), axis: .z))
        // Ejection port recess
        node.addChildNode(box("slide", w: 0.04, h: 0.04, d: 0.12, color: UIColor(white: 0.05, alpha: 1), at: SCNVector3(0.06, 0.13, -0.04), chamfer: 0.002))
        // Grip
        let grip = box("gripBlock", w: 0.112, h: 0.30, d: 0.125, color: polymer, at: SCNVector3(0, -0.145, 0.10), chamfer: 0.022)
        grip.eulerAngles.x = 0.30
        node.addChildNode(grip)
        // Grip panels / stipple blocks
        for i in 0..<5 {
            let y = Float(-0.07) - Float(i) * 0.04
            let ridge = box("gripBlock", w: 0.118, h: 0.01, d: 0.09, color: dark, at: SCNVector3(0, y, 0.12), chamfer: 0.002)
            ridge.eulerAngles.x = 0.30
            node.addChildNode(ridge)
        }
        // Mag release
        node.addChildNode(cylinder("receiver", radius: 0.012, height: 0.03, color: steel, at: SCNVector3(0.06, -0.02, 0.06), axis: .x))
        // Slide stop lever
        node.addChildNode(box("receiver", w: 0.04, h: 0.015, d: 0.06, color: steel, at: SCNVector3(-0.07, 0.04, 0.0), chamfer: 0.003))
        // Trigger guard + curved trigger
        node.addChildNode(box("receiver", w: 0.075, h: 0.018, d: 0.13, color: dark, at: SCNVector3(0, -0.02, -0.02), chamfer: 0.006))
        node.addChildNode(box("receiver", w: 0.075, h: 0.10, d: 0.018, color: dark, at: SCNVector3(0, -0.06, -0.08), chamfer: 0.006))
        let trigger = box("receiver", w: 0.018, h: 0.065, d: 0.028, color: steel, at: SCNVector3(0, -0.035, -0.015), chamfer: 0.006)
        trigger.eulerAngles.x = 0.22
        node.addChildNode(trigger)
        // Magwell
        node.addChildNode(box("receiver", w: 0.095, h: 0.045, d: 0.105, color: dark, at: SCNVector3(0, -0.09, 0.08), chamfer: 0.008))
        // Sights — Novak-style rear + front post
        node.addChildNode(box("slide", w: 0.06, h: 0.022, d: 0.018, color: dark, at: SCNVector3(0, 0.175, 0.15), chamfer: 0.002))
        node.addChildNode(box("slide", w: 0.012, h: 0.01, d: 0.012, color: UIColor(white: 0.9, alpha: 1), at: SCNVector3(-0.018, 0.182, 0.15), chamfer: 0.001))
        node.addChildNode(box("slide", w: 0.012, h: 0.01, d: 0.012, color: UIColor(white: 0.9, alpha: 1), at: SCNVector3(0.018, 0.182, 0.15), chamfer: 0.001))
        node.addChildNode(box("slide", w: 0.025, h: 0.035, d: 0.02, color: dark, at: SCNVector3(0, 0.178, -0.20), chamfer: 0.002))
        node.addChildNode(sphere("slide", radius: 0.006, color: UIColor(red: 1, green: 0.85, blue: 0.2, alpha: 1), at: SCNVector3(0, 0.195, -0.20)))
        return node
    }

    private static func makeSMGBody() -> SCNNode {
        let node = SCNNode()
        let steel = UIColor(white: 0.26, alpha: 1)
        let dark = UIColor(white: 0.10, alpha: 1)
        let polymer = UIColor(white: 0.07, alpha: 1)

        // Upper receiver
        node.addChildNode(box("receiver", w: 0.14, h: 0.12, d: 0.50, color: steel, at: SCNVector3(0, 0.12, -0.02), chamfer: 0.01))
        // Lower receiver
        node.addChildNode(box("receiver", w: 0.135, h: 0.10, d: 0.42, color: dark, at: SCNVector3(0, 0.02, 0.04), chamfer: 0.01))
        // Top rail
        node.addChildNode(picatinnyRail(name: "railTop", length: 0.42, at: SCNVector3(0, 0.195, -0.04)))
        // Handguard
        node.addChildNode(box("handguard", w: 0.13, h: 0.10, d: 0.32, color: polymer, at: SCNVector3(0, 0.06, -0.28), chamfer: 0.012))
        // Side rails on handguard
        node.addChildNode(box("handguard", w: 0.02, h: 0.04, d: 0.28, color: dark, at: SCNVector3(0.075, 0.06, -0.28), chamfer: 0.002))
        node.addChildNode(box("handguard", w: 0.02, h: 0.04, d: 0.28, color: dark, at: SCNVector3(-0.075, 0.06, -0.28), chamfer: 0.002))
        // Barrel
        node.addChildNode(cylinder("barrel", radius: 0.024, height: 0.38, color: UIColor(white: 0.18, alpha: 1), at: SCNVector3(0, 0.11, -0.55), axis: .z))
        // Gas tube / shroud
        node.addChildNode(cylinder("barrel", radius: 0.014, height: 0.22, color: steel, at: SCNVector3(0, 0.145, -0.42), axis: .z))
        // Pistol grip
        let grip = box("gripBlock", w: 0.10, h: 0.26, d: 0.12, color: polymer, at: SCNVector3(0, -0.12, 0.12), chamfer: 0.018)
        grip.eulerAngles.x = 0.32
        node.addChildNode(grip)
        // Magwell
        node.addChildNode(box("receiver", w: 0.10, h: 0.08, d: 0.12, color: dark, at: SCNVector3(0, -0.06, 0.02), chamfer: 0.008))
        // Trigger guard + trigger
        node.addChildNode(box("receiver", w: 0.07, h: 0.02, d: 0.11, color: dark, at: SCNVector3(0, -0.04, -0.06), chamfer: 0.003))
        node.addChildNode(box("receiver", w: 0.018, h: 0.055, d: 0.028, color: dark, at: SCNVector3(0, -0.05, -0.04), chamfer: 0.003))
        // Stock adapter / buffer stub
        node.addChildNode(cylinder("receiver", radius: 0.035, height: 0.10, color: steel, at: SCNVector3(0, 0.10, 0.30), axis: .z))
        // Charging handle hint
        node.addChildNode(box("receiver", w: 0.08, h: 0.02, d: 0.04, color: dark, at: SCNVector3(0, 0.185, 0.14), chamfer: 0.003))
        return node
    }

    private static func makeRifleBody() -> SCNNode {
        let node = SCNNode()
        let steel = UIColor(white: 0.25, alpha: 1)
        let dark = UIColor(white: 0.10, alpha: 1)
        let polymer = UIColor(white: 0.08, alpha: 1)
        let tan = UIColor(red: 0.35, green: 0.32, blue: 0.26, alpha: 1)

        // Upper receiver
        node.addChildNode(box("receiver", w: 0.145, h: 0.13, d: 0.48, color: steel, at: SCNVector3(0, 0.14, 0.02), chamfer: 0.01))
        // Lower receiver
        node.addChildNode(box("receiver", w: 0.14, h: 0.11, d: 0.40, color: dark, at: SCNVector3(0, 0.03, 0.08), chamfer: 0.01))
        // Full-length top rail
        node.addChildNode(picatinnyRail(name: "railTop", length: 0.62, at: SCNVector3(0, 0.22, -0.12)))
        // Handguard / forend
        node.addChildNode(box("handguard", w: 0.135, h: 0.11, d: 0.48, color: tan, at: SCNVector3(0, 0.08, -0.35), chamfer: 0.014))
        // M-LOK style side slots
        for i in 0..<4 {
            let z = Float(-0.20) - Float(i) * 0.08
            node.addChildNode(box("handguard", w: 0.02, h: 0.025, d: 0.05, color: dark, at: SCNVector3(0.072, 0.08, z), chamfer: 0.002))
            node.addChildNode(box("handguard", w: 0.02, h: 0.025, d: 0.05, color: dark, at: SCNVector3(-0.072, 0.08, z), chamfer: 0.002))
        }
        // Bottom rail section for grip/underbarrel
        node.addChildNode(box("handguard", w: 0.06, h: 0.02, d: 0.30, color: dark, at: SCNVector3(0, 0.01, -0.32), chamfer: 0.002))
        // Barrel
        node.addChildNode(cylinder("barrel", radius: 0.022, height: 0.72, color: UIColor(white: 0.16, alpha: 1), at: SCNVector3(0, 0.12, -0.78), axis: .z))
        // Gas block
        node.addChildNode(box("barrel", w: 0.05, h: 0.05, d: 0.08, color: steel, at: SCNVector3(0, 0.145, -0.62), chamfer: 0.004))
        // Front sight post
        node.addChildNode(box("barrel", w: 0.03, h: 0.08, d: 0.03, color: dark, at: SCNVector3(0, 0.20, -0.62), chamfer: 0.002))
        // Gas tube
        node.addChildNode(cylinder("barrel", radius: 0.01, height: 0.40, color: steel, at: SCNVector3(0, 0.17, -0.40), axis: .z))
        // Magwell
        node.addChildNode(box("receiver", w: 0.105, h: 0.09, d: 0.13, color: dark, at: SCNVector3(0, -0.04, 0.04), chamfer: 0.008))
        // Pistol grip
        let grip = box("gripBlock", w: 0.105, h: 0.28, d: 0.125, color: polymer, at: SCNVector3(0, -0.14, 0.18), chamfer: 0.018)
        grip.eulerAngles.x = 0.35
        node.addChildNode(grip)
        // Trigger group
        node.addChildNode(box("receiver", w: 0.07, h: 0.02, d: 0.12, color: dark, at: SCNVector3(0, -0.02, -0.02), chamfer: 0.003))
        node.addChildNode(box("receiver", w: 0.018, h: 0.06, d: 0.03, color: dark, at: SCNVector3(0, -0.04, 0.0), chamfer: 0.003))
        // Buffer tube + castle nut + stock
        node.addChildNode(cylinder("receiver", radius: 0.038, height: 0.22, color: steel, at: SCNVector3(0, 0.12, 0.38), axis: .z))
        node.addChildNode(cylinder("receiver", radius: 0.045, height: 0.03, color: dark, at: SCNVector3(0, 0.12, 0.28), axis: .z))
        node.addChildNode(box("receiver", w: 0.12, h: 0.14, d: 0.22, color: polymer, at: SCNVector3(0, 0.10, 0.52), chamfer: 0.02))
        node.addChildNode(box("receiver", w: 0.10, h: 0.08, d: 0.06, color: polymer, at: SCNVector3(0, 0.02, 0.58), chamfer: 0.01))
        // Ejection port + dust cover recess
        node.addChildNode(box("receiver", w: 0.02, h: 0.05, d: 0.10, color: UIColor(white: 0.05, alpha: 1), at: SCNVector3(0.075, 0.14, -0.02), chamfer: 0.002))
        // Forward assist
        node.addChildNode(cylinder("receiver", radius: 0.016, height: 0.03, color: steel, at: SCNVector3(-0.08, 0.14, 0.12), axis: .x))
        // Bolt release paddle
        node.addChildNode(box("receiver", w: 0.04, h: 0.03, d: 0.05, color: steel, at: SCNVector3(-0.08, 0.02, 0.04), chamfer: 0.004))
        // Charging handle
        node.addChildNode(box("receiver", w: 0.09, h: 0.018, d: 0.05, color: dark, at: SCNVector3(0, 0.215, 0.18), chamfer: 0.003))
        // Mag catch / selector detail
        node.addChildNode(box("receiver", w: 0.035, h: 0.012, d: 0.04, color: steel, at: SCNVector3(0.08, 0.0, 0.1), chamfer: 0.002))
        node.addChildNode(cylinder("receiver", radius: 0.012, height: 0.025, color: steel, at: SCNVector3(0.08, 0.05, 0.14), axis: .x))
        // Flash hider
        node.addChildNode(cylinder("barrel", radius: 0.028, height: 0.08, color: dark, at: SCNVector3(0, 0.12, -1.12), axis: .z))
        for i in 0..<3 {
            let a = Float(i) * (.pi * 2 / 3)
            node.addChildNode(box("barrel", w: 0.01, h: 0.035, d: 0.05, color: UIColor(white: 0.05, alpha: 1),
                                  at: SCNVector3(cos(a) * 0.02, 0.12 + sin(a) * 0.02, -1.14), chamfer: 0.001))
        }
        return node
    }

    private static func makeShotgunBody() -> SCNNode {
        let node = SCNNode()
        let steel = UIColor(white: 0.30, alpha: 1)
        let dark = UIColor(white: 0.12, alpha: 1)
        let wood = UIColor(red: 0.28, green: 0.18, blue: 0.10, alpha: 1)
        let polymer = UIColor(white: 0.09, alpha: 1)

        // Receiver
        node.addChildNode(box("receiver", w: 0.16, h: 0.15, d: 0.42, color: steel, at: SCNVector3(0, 0.10, 0.04), chamfer: 0.014))
        // Ejection port
        node.addChildNode(box("receiver", w: 0.02, h: 0.06, d: 0.14, color: UIColor(white: 0.05, alpha: 1), at: SCNVector3(0.085, 0.12, -0.02), chamfer: 0.002))
        // Main barrel (thick)
        node.addChildNode(cylinder("barrel", radius: 0.038, height: 0.58, color: UIColor(white: 0.18, alpha: 1), at: SCNVector3(0, 0.14, -0.52), axis: .z))
        // Magazine tube under barrel
        node.addChildNode(cylinder("barrel", radius: 0.028, height: 0.45, color: steel, at: SCNVector3(0, 0.06, -0.42), axis: .z))
        // Barrel band
        node.addChildNode(box("barrel", w: 0.09, h: 0.10, d: 0.04, color: dark, at: SCNVector3(0, 0.10, -0.55), chamfer: 0.004))
        // Pump forend
        let pump = box("pump", w: 0.13, h: 0.11, d: 0.26, color: wood, at: SCNVector3(0, 0.04, -0.22), chamfer: 0.02)
        node.addChildNode(pump)
        // Pump grooves
        for i in 0..<5 {
            let z = Float(-0.14) - Float(i) * 0.035
            node.addChildNode(box("pump", w: 0.135, h: 0.02, d: 0.012, color: dark, at: SCNVector3(0, 0.0, z), chamfer: 0.002))
        }
        // Pistol grip / grip area
        let grip = box("gripBlock", w: 0.11, h: 0.26, d: 0.13, color: polymer, at: SCNVector3(0, -0.12, 0.14), chamfer: 0.018)
        grip.eulerAngles.x = 0.30
        node.addChildNode(grip)
        // Trigger guard + trigger
        node.addChildNode(box("receiver", w: 0.075, h: 0.02, d: 0.12, color: dark, at: SCNVector3(0, -0.02, 0.0), chamfer: 0.003))
        node.addChildNode(box("receiver", w: 0.02, h: 0.06, d: 0.035, color: dark, at: SCNVector3(0, -0.04, 0.02), chamfer: 0.003))
        // Bead sight
        node.addChildNode(sphere("barrel", radius: 0.012, color: UIColor(white: 0.85, alpha: 1), at: SCNVector3(0, 0.195, -0.72)))
        // Loading gate area
        node.addChildNode(box("receiver", w: 0.08, h: 0.04, d: 0.12, color: dark, at: SCNVector3(0, 0.02, 0.08), chamfer: 0.006))
        // Stock stub / receiver rear
        node.addChildNode(box("receiver", w: 0.14, h: 0.12, d: 0.10, color: steel, at: SCNVector3(0, 0.10, 0.28), chamfer: 0.01))
        return node
    }

    private static func makeMachineGunBody() -> SCNNode {
        let node = SCNNode()
        let steel = UIColor(white: 0.24, alpha: 1)
        let dark = UIColor(white: 0.09, alpha: 1)
        let polymer = UIColor(white: 0.07, alpha: 1)

        node.addChildNode(box("receiver", w: 0.16, h: 0.16, d: 0.55, color: steel, at: SCNVector3(0, 0.14, 0.0), chamfer: 0.012))
        node.addChildNode(box("receiver", w: 0.155, h: 0.12, d: 0.48, color: dark, at: SCNVector3(0, 0.02, 0.06), chamfer: 0.01))
        node.addChildNode(picatinnyRail(name: "railTop", length: 0.50, at: SCNVector3(0, 0.24, -0.06)))
        // Heavy barrel + cooling jacket rings
        node.addChildNode(cylinder("barrel", radius: 0.032, height: 0.85, color: UIColor(white: 0.15, alpha: 1), at: SCNVector3(0, 0.14, -0.75), axis: .z))
        for i in 0..<6 {
            let z = Float(-0.45) - Float(i) * 0.08
            node.addChildNode(cylinder("barrel", radius: 0.04, height: 0.02, color: steel, at: SCNVector3(0, 0.14, z), axis: .z))
        }
        // Box mag / belt feed cover
        node.addChildNode(box("receiver", w: 0.18, h: 0.14, d: 0.22, color: dark, at: SCNVector3(0.08, -0.02, 0.02), chamfer: 0.01))
        let grip = box("gripBlock", w: 0.11, h: 0.28, d: 0.13, color: polymer, at: SCNVector3(0, -0.14, 0.18), chamfer: 0.018)
        grip.eulerAngles.x = 0.32
        node.addChildNode(grip)
        node.addChildNode(box("handguard", w: 0.14, h: 0.10, d: 0.36, color: polymer, at: SCNVector3(0, 0.06, -0.32), chamfer: 0.012))
        node.addChildNode(cylinder("receiver", radius: 0.04, height: 0.18, color: steel, at: SCNVector3(0, 0.12, 0.36), axis: .z))
        node.addChildNode(box("receiver", w: 0.07, h: 0.02, d: 0.12, color: dark, at: SCNVector3(0, -0.02, -0.02), chamfer: 0.003))
        return node
    }

    private static func makeSniperBody() -> SCNNode {
        let node = SCNNode()
        let steel = UIColor(white: 0.22, alpha: 1)
        let dark = UIColor(white: 0.08, alpha: 1)
        let polymer = UIColor(white: 0.06, alpha: 1)

        node.addChildNode(box("receiver", w: 0.14, h: 0.12, d: 0.52, color: steel, at: SCNVector3(0, 0.12, 0.04), chamfer: 0.01))
        node.addChildNode(picatinnyRail(name: "railTop", length: 0.40, at: SCNVector3(0, 0.20, 0.0)))
        // Extra-long free-float barrel
        node.addChildNode(cylinder("barrel", radius: 0.02, height: 1.05, color: UIColor(white: 0.14, alpha: 1), at: SCNVector3(0, 0.13, -0.85), axis: .z))
        node.addChildNode(cylinder("barrel", radius: 0.028, height: 0.12, color: steel, at: SCNVector3(0, 0.13, -1.28), axis: .z))
        // Chassis / forend
        node.addChildNode(box("handguard", w: 0.13, h: 0.09, d: 0.55, color: polymer, at: SCNVector3(0, 0.05, -0.35), chamfer: 0.012))
        // Magwell
        node.addChildNode(box("receiver", w: 0.10, h: 0.08, d: 0.12, color: dark, at: SCNVector3(0, -0.02, 0.06), chamfer: 0.008))
        let grip = box("gripBlock", w: 0.10, h: 0.26, d: 0.12, color: polymer, at: SCNVector3(0, -0.14, 0.16), chamfer: 0.016)
        grip.eulerAngles.x = 0.3
        node.addChildNode(grip)
        // Fixed stock with cheek riser
        node.addChildNode(box("stock", w: 0.11, h: 0.12, d: 0.36, color: polymer, at: SCNVector3(0, 0.10, 0.42), chamfer: 0.014))
        node.addChildNode(box("stock", w: 0.09, h: 0.05, d: 0.18, color: dark, at: SCNVector3(0, 0.18, 0.40), chamfer: 0.008))
        node.addChildNode(box("stock", w: 0.12, h: 0.14, d: 0.04, color: dark, at: SCNVector3(0, 0.08, 0.60), chamfer: 0.006))
        node.addChildNode(box("receiver", w: 0.018, h: 0.06, d: 0.03, color: dark, at: SCNVector3(0, -0.04, 0.0), chamfer: 0.003))
        return node
    }

    // MARK: - Sockets

    private static func makeSockets(for type: GunBodyType) -> [AttachmentSlot: SCNNode] {
        let opticY: Float
        let opticZ: Float
        let muzzleY: Float
        let muzzleZ: Float
        let stockY: Float
        let stockZ: Float
        let magY: Float
        let magZ: Float
        let gripY: Float
        let gripZ: Float
        let ubY: Float
        let ubZ: Float

        switch type {
        case .pistol:
            opticY = 0.20; opticZ = -0.04
            muzzleY = 0.10; muzzleZ = -0.55
            stockY = 0.08; stockZ = 0.24
            magY = -0.24; magZ = 0.10
            gripY = -0.02; gripZ = -0.10
            ubY = -0.02; ubZ = -0.18
        case .smg:
            opticY = 0.22; opticZ = -0.06
            muzzleY = 0.11; muzzleZ = -0.74
            stockY = 0.10; stockZ = 0.36
            magY = -0.14; magZ = 0.02
            gripY = 0.0; gripZ = -0.28
            ubY = -0.01; ubZ = -0.32
        case .rifle:
            opticY = 0.25; opticZ = -0.08
            muzzleY = 0.12; muzzleZ = -1.12
            stockY = 0.12; stockZ = 0.50
            magY = -0.12; magZ = 0.04
            gripY = 0.0; gripZ = -0.30
            ubY = -0.01; ubZ = -0.36
        case .shotgun:
            opticY = 0.20; opticZ = 0.0
            muzzleY = 0.14; muzzleZ = -0.82
            stockY = 0.10; stockZ = 0.34
            magY = -0.10; magZ = 0.08
            gripY = -0.02; gripZ = -0.18
            ubY = -0.02; ubZ = -0.28
        case .machineGun:
            opticY = 0.27; opticZ = -0.08
            muzzleY = 0.14; muzzleZ = -1.18
            stockY = 0.12; stockZ = 0.46
            magY = -0.12; magZ = 0.02
            gripY = 0.0; gripZ = -0.30
            ubY = -0.02; ubZ = -0.40
        case .sniper:
            opticY = 0.24; opticZ = -0.02
            muzzleY = 0.13; muzzleZ = -1.38
            stockY = 0.10; stockZ = 0.58
            magY = -0.10; magZ = 0.06
            gripY = 0.0; gripZ = -0.28
            ubY = -0.02; ubZ = -0.42
        }

        func socket(_ name: String, at pos: SCNVector3) -> SCNNode {
            let n = SCNNode()
            n.name = name
            n.position = pos
            return n
        }

        return [
            .optic: socket("socket_optic", at: SCNVector3(0, opticY, opticZ)),
            .muzzle: socket("socket_muzzle", at: SCNVector3(0, muzzleY, muzzleZ)),
            .grip: socket("socket_grip", at: SCNVector3(0, gripY, gripZ)),
            .stock: socket("socket_stock", at: SCNVector3(0, stockY, stockZ)),
            .magazine: socket("socket_magazine", at: SCNVector3(0, magY, magZ)),
            .underbarrel: socket("socket_underbarrel", at: SCNVector3(0, ubY, ubZ))
        ]
    }

    // MARK: - Attachments

    private static func makeAttachmentNode(part: AttachmentPart) -> SCNNode {
        let color = UIColor.from(swiftUI: part.accentColor)
        let node: SCNNode
        switch part.meshKey {
        case "optic_reddot":
            node = makeRedDot(color: color)
        case "optic_holo":
            node = makeHolo(color: color)
        case "optic_scope":
            node = makeScope(color: color)
        case "muzzle_brake":
            node = makeMuzzleBrake(color: color)
        case "muzzle_flash":
            node = makeFlashHider(color: color)
        case "muzzle_comp":
            node = makeCompensator(color: color)
        case "grip_vertical":
            node = makeVertGrip(color: color)
        case "grip_angled":
            node = makeAngledGrip(color: color)
        case "stock_solid":
            node = makeSolidStock(color: color)
        case "stock_fold":
            node = makeFoldStock(color: color)
        case "mag_std":
            node = makeStdMag(color: color)
        case "mag_drum":
            node = makeDrumMag(color: color)
        case "mag_extended":
            node = makeExtendedMag(color: color)
        case "ub_laser":
            node = makeLaser(color: color)
        case "ub_light":
            node = makeTacticalLight(color: color)
        case "ub_rail":
            node = makeRailBlock(color: color)
        case "ub_bipod":
            node = makeBipod(color: color)
        default:
            node = box("part", w: 0.08, h: 0.08, d: 0.08, color: color, at: SCNVector3(0, 0, 0))
        }
        node.name = part.meshKey
        return node
    }

    private static func makeRedDot(color: UIColor) -> SCNNode {
        let root = SCNNode()
        let housing = UIColor(white: 0.12, alpha: 1)
        // Picatinny mount
        root.addChildNode(box("optic", w: 0.07, h: 0.018, d: 0.11, color: housing, at: SCNVector3(0, 0.01, 0), chamfer: 0.003))
        for i in 0..<4 {
            let z = Float(0.04) - Float(i) * 0.025
            root.addChildNode(box("optic", w: 0.065, h: 0.01, d: 0.01, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(0, 0.0, z), chamfer: 0.001))
        }
        // Emitter hood
        root.addChildNode(box("optic", w: 0.085, h: 0.065, d: 0.095, color: color, at: SCNVector3(0, 0.055, 0), chamfer: 0.01))
        // Recessed glass
        let lens = SCNNode(geometry: SCNCylinder(radius: 0.03, height: 0.015))
        lens.geometry?.firstMaterial?.diffuse.contents = UIColor(red: 0.4, green: 0.05, blue: 0.05, alpha: 0.4)
        lens.geometry?.firstMaterial?.emission.contents = UIColor.red.withAlphaComponent(0.35)
        lens.geometry?.firstMaterial?.transparency = 0.45
        lens.eulerAngles.x = .pi / 2
        lens.position = SCNVector3(0, 0.058, -0.04)
        lens.name = "optic"
        root.addChildNode(lens)
        let rear = SCNNode(geometry: SCNCylinder(radius: 0.026, height: 0.012))
        rear.geometry?.firstMaterial?.diffuse.contents = UIColor(white: 0.05, alpha: 0.5)
        rear.eulerAngles.x = .pi / 2
        rear.position = SCNVector3(0, 0.058, 0.04)
        rear.name = "optic"
        root.addChildNode(rear)
        // Illuminated reticle
        let dot = sphere("optic", radius: 0.005, color: .red, at: SCNVector3(0, 0.058, -0.01))
        dot.geometry?.firstMaterial?.emission.contents = UIColor.red
        root.addChildNode(dot)
        // Windage / elevation caps
        root.addChildNode(cylinder("optic", radius: 0.014, height: 0.022, color: housing, at: SCNVector3(0.048, 0.055, 0.0), axis: .x))
        root.addChildNode(cylinder("optic", radius: 0.014, height: 0.018, color: housing, at: SCNVector3(0, 0.095, 0.0), axis: .y))
        // Battery compartment
        root.addChildNode(cylinder("optic", radius: 0.02, height: 0.025, color: housing, at: SCNVector3(-0.045, 0.04, 0.02), axis: .y))
        return root
    }

    private static func makeHolo(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box("optic", w: 0.08, h: 0.02, d: 0.12, color: color, at: SCNVector3(0, 0.01, 0), chamfer: 0.003))
        // Square hood
        root.addChildNode(box("optic", w: 0.10, h: 0.09, d: 0.04, color: color, at: SCNVector3(0, 0.065, -0.04), chamfer: 0.004))
        root.addChildNode(box("optic", w: 0.10, h: 0.09, d: 0.03, color: color, at: SCNVector3(0, 0.065, 0.05), chamfer: 0.004))
        // Side walls
        root.addChildNode(box("optic", w: 0.015, h: 0.09, d: 0.12, color: color, at: SCNVector3(0.05, 0.065, 0), chamfer: 0.002))
        root.addChildNode(box("optic", w: 0.015, h: 0.09, d: 0.12, color: color, at: SCNVector3(-0.05, 0.065, 0), chamfer: 0.002))
        // Glass pane
        let glass = box("optic", w: 0.07, h: 0.07, d: 0.01, color: UIColor.green.withAlphaComponent(0.25), at: SCNVector3(0, 0.065, 0))
        glass.geometry?.firstMaterial?.emission.contents = UIColor.green.withAlphaComponent(0.4)
        glass.geometry?.firstMaterial?.transparency = 0.6
        root.addChildNode(glass)
        return root
    }

    private static func makeScope(color: UIColor) -> SCNNode {
        let root = SCNNode()
        // Mount rings
        root.addChildNode(box("optic", w: 0.06, h: 0.04, d: 0.04, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(0, 0.02, -0.08), chamfer: 0.004))
        root.addChildNode(box("optic", w: 0.06, h: 0.04, d: 0.04, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(0, 0.02, 0.08), chamfer: 0.004))
        // Main tube
        root.addChildNode(cylinder("optic", radius: 0.032, height: 0.32, color: color, at: SCNVector3(0, 0.07, 0), axis: .z))
        // Objective bell
        root.addChildNode(cylinder("optic", radius: 0.048, height: 0.08, color: color, at: SCNVector3(0, 0.07, -0.18), axis: .z))
        // Eyepiece
        root.addChildNode(cylinder("optic", radius: 0.042, height: 0.07, color: color, at: SCNVector3(0, 0.07, 0.18), axis: .z))
        // Turrets
        root.addChildNode(cylinder("optic", radius: 0.018, height: 0.03, color: UIColor(white: 0.25, alpha: 1), at: SCNVector3(0, 0.115, 0), axis: .y))
        root.addChildNode(cylinder("optic", radius: 0.016, height: 0.028, color: UIColor(white: 0.25, alpha: 1), at: SCNVector3(0.04, 0.07, 0), axis: .x))
        // Lens glow
        let lens = sphere("optic", radius: 0.03, color: UIColor(red: 0.2, green: 0.4, blue: 0.8, alpha: 0.5), at: SCNVector3(0, 0.07, -0.22))
        lens.geometry?.firstMaterial?.emission.contents = UIColor(red: 0.3, green: 0.5, blue: 1.0, alpha: 0.35)
        root.addChildNode(lens)
        return root
    }

    private static func makeMuzzleBrake(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(cylinder("muzzle", radius: 0.035, height: 0.10, color: color, at: SCNVector3(0, 0, -0.02), axis: .z))
        // Side vents
        for i in 0..<3 {
            let z = Float(-0.01) - Float(i) * 0.025
            root.addChildNode(box("muzzle", w: 0.09, h: 0.025, d: 0.015, color: UIColor(white: 0.15, alpha: 1), at: SCNVector3(0, 0.01, z), chamfer: 0.002))
        }
        // Thread collar
        root.addChildNode(cylinder("muzzle", radius: 0.028, height: 0.03, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(0, 0, 0.05), axis: .z))
        return root
    }

    private static func makeFlashHider(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(cylinder("muzzle", radius: 0.030, height: 0.05, color: color, at: SCNVector3(0, 0, 0.02), axis: .z))
        // Birdcage prongs
        for i in 0..<6 {
            let angle = Float(i) * (.pi * 2 / 6)
            let prong = box("muzzle", w: 0.012, h: 0.012, d: 0.08, color: color, at: SCNVector3(cos(angle) * 0.028, sin(angle) * 0.028, -0.04), chamfer: 0.002)
            root.addChildNode(prong)
        }
        return root
    }

    private static func makeCompensator(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(cylinder("muzzle", radius: 0.032, height: 0.06, color: color, at: SCNVector3(0, 0, 0.0), axis: .z))
        root.addChildNode(cylinder("muzzle", radius: 0.038, height: 0.04, color: UIColor(white: 0.22, alpha: 1), at: SCNVector3(0, 0, -0.04), axis: .z))
        // Top ports
        root.addChildNode(box("muzzle", w: 0.02, h: 0.02, d: 0.04, color: UIColor(white: 0.12, alpha: 1), at: SCNVector3(0, 0.035, -0.02), chamfer: 0.002))
        root.addChildNode(box("muzzle", w: 0.02, h: 0.02, d: 0.04, color: UIColor(white: 0.12, alpha: 1), at: SCNVector3(0.02, 0.03, -0.02), chamfer: 0.002))
        root.addChildNode(box("muzzle", w: 0.02, h: 0.02, d: 0.04, color: UIColor(white: 0.12, alpha: 1), at: SCNVector3(-0.02, 0.03, -0.02), chamfer: 0.002))
        return root
    }

    private static func makeVertGrip(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box("grip", w: 0.055, h: 0.02, d: 0.06, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(0, 0.0, 0), chamfer: 0.004))
        let shaft = cylinder("grip", radius: 0.028, height: 0.16, color: color, at: SCNVector3(0, -0.09, 0), axis: .y)
        root.addChildNode(shaft)
        // Finger ridges
        for i in 0..<4 {
            let y = Float(-0.04) - Float(i) * 0.028
            root.addChildNode(cylinder("grip", radius: 0.032, height: 0.012, color: UIColor(white: 0.12, alpha: 1), at: SCNVector3(0, y, 0), axis: .y))
        }
        // Cap
        root.addChildNode(cylinder("grip", radius: 0.030, height: 0.02, color: UIColor(white: 0.15, alpha: 1), at: SCNVector3(0, -0.18, 0), axis: .y))
        return root
    }

    private static func makeAngledGrip(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box("grip", w: 0.055, h: 0.02, d: 0.06, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(0, 0.0, 0), chamfer: 0.004))
        let wedge = box("grip", w: 0.06, h: 0.07, d: 0.16, color: color, at: SCNVector3(0, -0.04, 0.03), chamfer: 0.012)
        wedge.eulerAngles.x = 0.55
        root.addChildNode(wedge)
        return root
    }

    private static func makeSolidStock(color: UIColor) -> SCNNode {
        let root = SCNNode()
        // Tube / receiver interface
        root.addChildNode(cylinder("stock", radius: 0.035, height: 0.08, color: UIColor(white: 0.25, alpha: 1), at: SCNVector3(0, 0, 0.02), axis: .z))
        // Cheek weld / body
        root.addChildNode(box("stock", w: 0.10, h: 0.12, d: 0.28, color: color, at: SCNVector3(0, 0.02, 0.18), chamfer: 0.02))
        // Buttpad
        root.addChildNode(box("stock", w: 0.11, h: 0.16, d: 0.03, color: UIColor(white: 0.08, alpha: 1), at: SCNVector3(0, 0.0, 0.34), chamfer: 0.008))
        // Shoulder pad texture
        root.addChildNode(box("stock", w: 0.105, h: 0.04, d: 0.02, color: UIColor(white: 0.15, alpha: 1), at: SCNVector3(0, -0.05, 0.34), chamfer: 0.004))
        return root
    }

    private static func makeFoldStock(color: UIColor) -> SCNNode {
        let root = SCNNode()
        // Hinge
        root.addChildNode(cylinder("stock", radius: 0.025, height: 0.06, color: UIColor(white: 0.3, alpha: 1), at: SCNVector3(0, 0, 0.02), axis: .x))
        // Strut tubes
        root.addChildNode(cylinder("stock", radius: 0.012, height: 0.24, color: color, at: SCNVector3(0.03, 0.02, 0.14), axis: .z))
        root.addChildNode(cylinder("stock", radius: 0.012, height: 0.24, color: color, at: SCNVector3(-0.03, 0.02, 0.14), axis: .z))
        // Butt plate
        root.addChildNode(box("stock", w: 0.10, h: 0.12, d: 0.025, color: UIColor(white: 0.12, alpha: 1), at: SCNVector3(0, 0.0, 0.28), chamfer: 0.006))
        // Cross brace
        root.addChildNode(box("stock", w: 0.08, h: 0.02, d: 0.02, color: color, at: SCNVector3(0, 0.02, 0.16), chamfer: 0.003))
        return root
    }

    private static func makeStdMag(color: UIColor) -> SCNNode {
        let root = SCNNode()
        let mag = box("mag", w: 0.075, h: 0.20, d: 0.10, color: color, at: SCNVector3(0, -0.08, 0), chamfer: 0.008)
        mag.eulerAngles.x = 0.08
        root.addChildNode(mag)
        // Mag ribs
        for i in 0..<3 {
            let y = Float(-0.02) - Float(i) * 0.04
            let rib = box("mag", w: 0.078, h: 0.01, d: 0.08, color: UIColor(white: 0.15, alpha: 1), at: SCNVector3(0, y, 0), chamfer: 0.002)
            rib.eulerAngles.x = 0.08
            root.addChildNode(rib)
        }
        // Base plate
        root.addChildNode(box("mag", w: 0.08, h: 0.02, d: 0.11, color: UIColor(white: 0.18, alpha: 1), at: SCNVector3(0, -0.19, 0.01), chamfer: 0.004))
        return root
    }

    private static func makeDrumMag(color: UIColor) -> SCNNode {
        let root = SCNNode()
        let drum = cylinder("mag", radius: 0.11, height: 0.09, color: color, at: SCNVector3(0, -0.10, 0), axis: .x)
        root.addChildNode(drum)
        // Hub
        root.addChildNode(cylinder("mag", radius: 0.035, height: 0.095, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(0, -0.10, 0), axis: .x))
        // Feed tower
        root.addChildNode(box("mag", w: 0.07, h: 0.10, d: 0.08, color: color, at: SCNVector3(0, -0.02, 0), chamfer: 0.006))
        // Window ring
        let ring = SCNNode(geometry: SCNTorus(ringRadius: 0.08, pipeRadius: 0.008))
        ring.geometry?.firstMaterial?.diffuse.contents = UIColor(white: 0.3, alpha: 1)
        ring.eulerAngles.y = .pi / 2
        ring.position = SCNVector3(0.05, -0.10, 0)
        ring.name = "mag"
        root.addChildNode(ring)
        return root
    }

    private static func makeExtendedMag(color: UIColor) -> SCNNode {
        let root = SCNNode()
        let mag = box("mag", w: 0.075, h: 0.32, d: 0.10, color: color, at: SCNVector3(0, -0.14, 0), chamfer: 0.008)
        mag.eulerAngles.x = 0.06
        root.addChildNode(mag)
        for i in 0..<5 {
            let y = Float(-0.02) - Float(i) * 0.045
            let rib = box("mag", w: 0.078, h: 0.01, d: 0.08, color: UIColor(white: 0.15, alpha: 1), at: SCNVector3(0, y, 0), chamfer: 0.002)
            rib.eulerAngles.x = 0.06
            root.addChildNode(rib)
        }
        root.addChildNode(box("mag", w: 0.085, h: 0.025, d: 0.115, color: UIColor(white: 0.18, alpha: 1), at: SCNVector3(0, -0.31, 0.01), chamfer: 0.005))
        return root
    }

    private static func makeLaser(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box("ub", w: 0.045, h: 0.04, d: 0.12, color: UIColor(white: 0.15, alpha: 1), at: SCNVector3(0, -0.02, 0), chamfer: 0.006))
        // Emitter
        let emitter = cylinder("ub", radius: 0.012, height: 0.03, color: color, at: SCNVector3(0, -0.02, -0.07), axis: .z)
        emitter.geometry?.firstMaterial?.emission.contents = color.withAlphaComponent(0.8)
        root.addChildNode(emitter)
        // Beam hint
        let beam = cylinder("ub", radius: 0.004, height: 0.18, color: color.withAlphaComponent(0.35), at: SCNVector3(0, -0.02, -0.17), axis: .z)
        beam.geometry?.firstMaterial?.emission.contents = color.withAlphaComponent(0.5)
        beam.geometry?.firstMaterial?.transparency = 0.5
        root.addChildNode(beam)
        // Mount clamp
        root.addChildNode(box("ub", w: 0.05, h: 0.02, d: 0.06, color: UIColor(white: 0.25, alpha: 1), at: SCNVector3(0, 0.01, 0.02), chamfer: 0.003))
        return root
    }

    private static func makeTacticalLight(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box("ub", w: 0.05, h: 0.045, d: 0.10, color: UIColor(white: 0.18, alpha: 1), at: SCNVector3(0, -0.02, 0.02), chamfer: 0.006))
        // Head
        let head = cylinder("ub", radius: 0.028, height: 0.05, color: color, at: SCNVector3(0, -0.02, -0.06), axis: .z)
        root.addChildNode(head)
        // Lens
        let lens = sphere("ub", radius: 0.02, color: UIColor(white: 0.95, alpha: 0.8), at: SCNVector3(0, -0.02, -0.09))
        lens.geometry?.firstMaterial?.emission.contents = UIColor(white: 0.9, alpha: 0.6)
        root.addChildNode(lens)
        // Mount
        root.addChildNode(box("ub", w: 0.05, h: 0.02, d: 0.05, color: UIColor(white: 0.25, alpha: 1), at: SCNVector3(0, 0.01, 0.02), chamfer: 0.003))
        return root
    }

    private static func makeRailBlock(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box("ub", w: 0.06, h: 0.025, d: 0.22, color: color, at: SCNVector3(0, -0.01, 0), chamfer: 0.003))
        // Picatinny teeth
        for i in 0..<7 {
            let z = Float(0.08) - Float(i) * 0.028
            root.addChildNode(box("ub", w: 0.055, h: 0.015, d: 0.012, color: UIColor(white: 0.3, alpha: 1), at: SCNVector3(0, 0.01, z), chamfer: 0.001))
        }
        return root
    }

    private static func makeBipod(color: UIColor) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box("ub", w: 0.06, h: 0.03, d: 0.08, color: color, at: SCNVector3(0, -0.02, 0.02), chamfer: 0.004))
        let left = cylinder("ub", radius: 0.01, height: 0.22, color: color, at: SCNVector3(-0.05, -0.12, 0.0), axis: .y)
        left.eulerAngles.z = 0.35
        let right = cylinder("ub", radius: 0.01, height: 0.22, color: color, at: SCNVector3(0.05, -0.12, 0.0), axis: .y)
        right.eulerAngles.z = -0.35
        root.addChildNode(left)
        root.addChildNode(right)
        root.addChildNode(sphere("ub", radius: 0.015, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(-0.08, -0.22, 0)))
        root.addChildNode(sphere("ub", radius: 0.015, color: UIColor(white: 0.2, alpha: 1), at: SCNVector3(0.08, -0.22, 0)))
        return root
    }

    // MARK: - Materials / finishes

    private static func applyFinish(to node: SCNNode, blueprint: GunBlueprint, region: PaintRegion) {
        let skin = blueprint.premadeSkin ?? .matteBlack
        let base = UIColor.from(swiftUI: Color(hex: skin.primaryHex) ?? GGGTheme.steel)
        let accent = UIColor.from(swiftUI: Color(hex: skin.accentHex) ?? GGGTheme.neonAccent)

        node.enumerateChildNodes { child, _ in
            guard let mat = child.geometry?.firstMaterial else { return }
            let name = (child.name ?? "").lowercased()
            mat.lightingModel = .physicallyBased

            let isMetalPart = name.contains("barrel") || name.contains("muzzle") || name.contains("slide") || name.contains("rail")
            let isPolymer = name.contains("grip") || name.contains("stock") || name.contains("pump") || name.contains("handguard")

            switch skin.pattern {
            case .solid:
                mat.diffuse.contents = base
                mat.metalness.contents = isMetalPart ? 0.75 : (isPolymer ? 0.05 : 0.25)
                mat.roughness.contents = isMetalPart ? 0.28 : (isPolymer ? 0.72 : 0.55)
            case .camo:
                mat.diffuse.contents = camoImage(base: base, accent: accent)
                mat.metalness.contents = isMetalPart ? 0.4 : 0.05
                mat.roughness.contents = 0.75
            case .metal:
                mat.diffuse.contents = base
                mat.metalness.contents = 0.95
                mat.roughness.contents = name.contains("chrome") || skin == .chrome ? 0.12 : 0.22
                mat.emission.contents = UIColor.clear
            case .neon:
                mat.diffuse.contents = base
                mat.emission.contents = accent.withAlphaComponent(isMetalPart ? 0.35 : 0.55)
                mat.metalness.contents = 0.35
                mat.roughness.contents = 0.4
            }
            _ = region
        }
    }

    private static func applyRegionFills(to root: SCNNode, blueprint: GunBlueprint) {
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
        ambient.light?.intensity = 420
        ambient.light?.color = UIColor(red: 0.85, green: 0.88, blue: 0.95, alpha: 1)
        scene.rootNode.addChildNode(ambient)

        let key = SCNNode()
        key.light = SCNLight()
        key.light?.type = .directional
        key.light?.intensity = 900
        key.light?.castsShadow = false
        key.light?.color = UIColor(red: 1.0, green: 0.96, blue: 0.88, alpha: 1)
        key.eulerAngles = SCNVector3(-1.0, 0.55, 0)
        scene.rootNode.addChildNode(key)

        let fill = SCNNode()
        fill.light = SCNLight()
        fill.light?.type = .directional
        fill.light?.intensity = 380
        fill.light?.color = UIColor(red: 0.7, green: 0.8, blue: 1.0, alpha: 1)
        fill.eulerAngles = SCNVector3(-0.25, -0.9, 0)
        scene.rootNode.addChildNode(fill)
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
        // Covered outdoor bay: dirt lanes, stall, berm, modest lights.
        scene.background.contents = UIColor(red: 0.42, green: 0.58, blue: 0.74, alpha: 1)

        let dirt = SCNFloor()
        dirt.reflectivity = 0.02
        dirt.firstMaterial?.diffuse.contents = UIColor(red: 0.30, green: 0.26, blue: 0.20, alpha: 1)
        dirt.firstMaterial?.roughness.contents = 0.95
        scene.rootNode.addChildNode(SCNNode(geometry: dirt))

        let concrete = UIColor(red: 0.38, green: 0.37, blue: 0.34, alpha: 1)
        let steel = UIColor(white: 0.22, alpha: 1)
        let warn = UIColor(red: 0.85, green: 0.65, blue: 0.12, alpha: 1)

        // Shooting stall (booth)
        scene.rootNode.addChildNode(box("stallLeft", w: 0.14, h: 1.55, d: 1.35, color: concrete, at: SCNVector3(-1.05, 0.78, 0.15)))
        scene.rootNode.addChildNode(box("stallRight", w: 0.14, h: 1.55, d: 1.35, color: concrete, at: SCNVector3(1.05, 0.78, 0.15)))
        scene.rootNode.addChildNode(box("stallShelf", w: 2.0, h: 0.07, d: 0.5, color: concrete, at: SCNVector3(0, 1.0, 0.4)))
        scene.rootNode.addChildNode(box("stallBack", w: 2.2, h: 1.8, d: 0.1, color: UIColor(white: 0.18, alpha: 1), at: SCNVector3(0, 1.1, 0.85)))
        scene.rootNode.addChildNode(box("stallStripeL", w: 0.04, h: 1.55, d: 1.35, color: warn, at: SCNVector3(-0.96, 0.78, 0.15)))
        scene.rootNode.addChildNode(box("stallStripeR", w: 0.04, h: 1.55, d: 1.35, color: warn, at: SCNVector3(0.96, 0.78, 0.15)))

        // Overhead canopy + beams
        scene.rootNode.addChildNode(box("canopy", w: 4.2, h: 0.08, d: 2.8, color: UIColor(white: 0.16, alpha: 1), at: SCNVector3(0, 2.65, 0.05)))
        scene.rootNode.addChildNode(box("beamL", w: 0.12, h: 0.12, d: 2.6, color: steel, at: SCNVector3(-1.4, 2.5, 0.05)))
        scene.rootNode.addChildNode(box("beamR", w: 0.12, h: 0.12, d: 2.6, color: steel, at: SCNVector3(1.4, 2.5, 0.05)))

        // Cheap bay lights (point — no shadows)
        for x: Float in [-0.7, 0.7] {
            let lamp = SCNNode()
            lamp.light = SCNLight()
            lamp.light?.type = .omni
            lamp.light?.intensity = 280
            lamp.light?.attenuationStartDistance = 1
            lamp.light?.attenuationEndDistance = 14
            lamp.light?.color = UIColor(red: 1.0, green: 0.95, blue: 0.82, alpha: 1)
            lamp.position = SCNVector3(x, 2.45, -0.2)
            scene.rootNode.addChildNode(lamp)
            scene.rootNode.addChildNode(box("lampHousing", w: 0.28, h: 0.06, d: 0.18, color: steel, at: SCNVector3(x, 2.55, -0.2)))
        }

        // Side fences / safety walls
        let fence = UIColor(red: 0.20, green: 0.23, blue: 0.18, alpha: 1)
        scene.rootNode.addChildNode(box("fenceL", w: 0.14, h: 1.7, d: 18, color: fence, at: SCNVector3(-7.2, 0.85, -8)))
        scene.rootNode.addChildNode(box("fenceR", w: 0.14, h: 1.7, d: 18, color: fence, at: SCNVector3(7.2, 0.85, -8)))

        // Lane dividers (posts every ~3m)
        for z: Float in [-3, -6, -9, -12] {
            for x: Float in [-4.5, -1.5, 1.5, 4.5] {
                scene.rootNode.addChildNode(box("lanePost", w: 0.08, h: 0.55, d: 0.08, color: warn, at: SCNVector3(x, 0.28, z)))
            }
            // Thin lane rail between posts
            scene.rootNode.addChildNode(box("laneRail", w: 9.0, h: 0.04, d: 0.04, color: UIColor(white: 0.35, alpha: 1), at: SCNVector3(0, 0.52, z)))
        }

        // Dirt berm + rubber backstop strip
        let berm = UIColor(red: 0.42, green: 0.32, blue: 0.20, alpha: 1)
        scene.rootNode.addChildNode(box("berm", w: 16, h: 2.5, d: 2.6, color: berm, at: SCNVector3(0, 1.05, -16)))
        scene.rootNode.addChildNode(box("bermTop", w: 16, h: 0.55, d: 1.2, color: UIColor(red: 0.24, green: 0.34, blue: 0.17, alpha: 1), at: SCNVector3(0, 2.35, -15.4)))
        scene.rootNode.addChildNode(box("backstop", w: 14, h: 1.8, d: 0.35, color: UIColor(red: 0.12, green: 0.12, blue: 0.11, alpha: 1), at: SCNVector3(0, 1.1, -14.7)))

        // Distance markers
        for meters in [5, 10, 15] {
            let z = Float(-meters) * 1.05
            scene.rootNode.addChildNode(box("marker", w: 0.08, h: 0.9, d: 0.08, color: .darkGray, at: SCNVector3(-5.6, 0.45, z)))
            scene.rootNode.addChildNode(box("marker", w: 0.38, h: 0.24, d: 0.04, color: UIColor(white: 0.88, alpha: 1), at: SCNVector3(-5.6, 0.98, z)))
        }

        // Sandbags mid-lane
        let sand = UIColor(red: 0.55, green: 0.45, blue: 0.28, alpha: 1)
        for i in 0..<5 {
            scene.rootNode.addChildNode(box("sandbag", w: 0.52, h: 0.26, d: 0.34, color: sand, at: SCNVector3(-2.6 + Float(i) * 0.48, 0.13, -6.4), chamfer: 0.05))
        }
    }

    private static func addTargets(to scene: SCNScene) {
        // Mix of paper silhouettes + steel plates across the bay.
        let specs: [(SCNVector3, Bool)] = [
            (SCNVector3(-2.4, 0, -7.5), false),   // paper
            (SCNVector3(-0.8, 0, -9.0), true),    // steel
            (SCNVector3(1.2, 0, -8.2), false),
            (SCNVector3(2.6, 0, -10.5), true),
            (SCNVector3(-1.6, 0, -12.0), false),
            (SCNVector3(0.4, 0, -13.5), true),
            (SCNVector3(2.0, 0, -14.2), false),
            (SCNVector3(-3.0, 0, -11.0), true)
        ]
        for (i, spec) in specs.enumerated() {
            let target = makeTargetNode(index: i, steel: spec.1)
            target.position = spec.0
            scene.rootNode.addChildNode(target)
        }
    }

    /// Paper IPSC silhouette or steel flip plate for the range bay.
    /// Name encodes kind: `target_<n>_steel` or `target_<n>_paper`.
    static func makeTargetNode(index: Int, steel: Bool = false) -> SCNNode {
        let root = SCNNode()
        root.name = steel ? "target_\(index)_steel" : "target_\(index)_paper"

        let stand = box("stand", w: 0.07, h: 1.2, d: 0.07, color: UIColor(white: 0.22, alpha: 1), at: SCNVector3(0, 0.55, 0))
        let base = box("stand", w: 0.35, h: 0.06, d: 0.28, color: UIColor(white: 0.18, alpha: 1), at: SCNVector3(0, 0.03, 0.02), chamfer: 0.01)

        let hitSurface = SCNNode()
        hitSurface.name = "hitSurface"
        hitSurface.position = SCNVector3(0, 0, 0)

        if steel {
            // Pepper-popper style steel plate (hinges at bottom of plate).
            let plate = box("steel", w: 0.38, h: 0.55, d: 0.04, color: UIColor(red: 0.55, green: 0.56, blue: 0.58, alpha: 1), at: SCNVector3(0, 1.05, 0), chamfer: 0.02)
            plate.geometry?.firstMaterial?.metalness.contents = 0.85
            plate.geometry?.firstMaterial?.roughness.contents = 0.28
            let hinge = box("steel", w: 0.42, h: 0.06, d: 0.06, color: UIColor(white: 0.3, alpha: 1), at: SCNVector3(0, 0.76, 0.02))
            let face = box("steel", w: 0.22, h: 0.22, d: 0.02, color: UIColor(red: 0.75, green: 0.22, blue: 0.12, alpha: 1), at: SCNVector3(0, 1.12, 0.03), chamfer: 0.01)
            hitSurface.addChildNode(plate)
            hitSurface.addChildNode(hinge)
            hitSurface.addChildNode(face)
        } else {
            // Cardboard / paper silhouette with scoring zones.
            let cardboard = UIColor(red: 0.78, green: 0.68, blue: 0.48, alpha: 1)
            let ink = UIColor(red: 0.12, green: 0.12, blue: 0.11, alpha: 1)
            let body = box("zone_c", w: 0.48, h: 0.72, d: 0.03, color: cardboard, at: SCNVector3(0, 0.98, 0), chamfer: 0.03)
            // Larger head zone so distant / sniper shots register HEAD more reliably.
            let head = box("zone_head", w: 0.30, h: 0.32, d: 0.04, color: cardboard, at: SCNVector3(0, 1.48, 0), chamfer: 0.03)
            let aZone = box("zone_a", w: 0.22, h: 0.32, d: 0.015, color: ink, at: SCNVector3(0, 0.95, 0.02), chamfer: 0.01)
            let ring = SCNNode(geometry: SCNTorus(ringRadius: 0.10, pipeRadius: 0.012))
            ring.name = "zone_a"
            ring.geometry?.firstMaterial?.diffuse.contents = UIColor(white: 0.08, alpha: 1)
            ring.geometry?.firstMaterial?.lightingModel = .constant
            ring.eulerAngles.x = .pi / 2
            ring.position = SCNVector3(0, 0.95, 0.035)
            hitSurface.addChildNode(body)
            hitSurface.addChildNode(head)
            hitSurface.addChildNode(aZone)
            hitSurface.addChildNode(ring)
        }

        root.addChildNode(stand)
        root.addChildNode(base)
        root.addChildNode(hitSurface)

        let shape = SCNPhysicsShape(node: hitSurface, options: [.type: SCNPhysicsShape.ShapeType.boundingBox])
        root.physicsBody = SCNPhysicsBody(type: .static, shape: shape)
        root.physicsBody?.categoryBitMask = 2
        root.physicsBody?.contactTestBitMask = 1

        return root
    }

    // MARK: - Helpers

    private enum Axis { case x, y, z }

    private static func box(
        _ name: String,
        w: CGFloat, h: CGFloat, d: CGFloat,
        color: UIColor,
        at: SCNVector3,
        chamfer: CGFloat = 0.0
    ) -> SCNNode {
        let radius = chamfer > 0 ? chamfer : min(w, h, d) * 0.06
        let g = SCNBox(width: w, height: h, length: d, chamferRadius: radius)
        g.firstMaterial?.diffuse.contents = color
        g.firstMaterial?.roughness.contents = 0.55
        g.firstMaterial?.metalness.contents = 0.2
        g.firstMaterial?.lightingModel = .physicallyBased
        let n = SCNNode(geometry: g)
        n.name = name
        n.position = at
        return n
    }

    private static func cylinder(
        _ name: String,
        radius: CGFloat,
        height: CGFloat,
        color: UIColor,
        at: SCNVector3,
        axis: Axis
    ) -> SCNNode {
        let g = SCNCylinder(radius: radius, height: height)
        g.firstMaterial?.diffuse.contents = color
        g.firstMaterial?.roughness.contents = 0.35
        g.firstMaterial?.metalness.contents = 0.65
        g.firstMaterial?.lightingModel = .physicallyBased
        let n = SCNNode(geometry: g)
        n.name = name
        n.position = at
        switch axis {
        case .x: n.eulerAngles.z = .pi / 2
        case .y: break
        case .z: n.eulerAngles.x = .pi / 2
        }
        return n
    }

    private static func sphere(_ name: String, radius: CGFloat, color: UIColor, at: SCNVector3) -> SCNNode {
        let g = SCNSphere(radius: radius)
        g.firstMaterial?.diffuse.contents = color
        g.firstMaterial?.lightingModel = .physicallyBased
        let n = SCNNode(geometry: g)
        n.name = name
        n.position = at
        return n
    }

    private static func picatinnyRail(name: String, length: Float, at: SCNVector3) -> SCNNode {
        let root = SCNNode()
        root.name = name
        root.position = at
        root.addChildNode(box(name, w: 0.07, h: 0.018, d: CGFloat(length), color: UIColor(white: 0.12, alpha: 1), at: SCNVector3(0, 0, 0), chamfer: 0.002))
        let teeth = Int(length / 0.035)
        for i in 0..<teeth {
            let z = length / 2 - 0.02 - Float(i) * 0.035
            root.addChildNode(box(name, w: 0.06, h: 0.012, d: 0.014, color: UIColor(white: 0.22, alpha: 1), at: SCNVector3(0, 0.012, z), chamfer: 0.001))
        }
        return root
    }
}

// Bridge SwiftUI Color → UIColor (requires iOS 17+ UIColor(Color) init).
private extension UIColor {
    static func from(swiftUI color: Color) -> UIColor {
        UIColor(color)
    }
}
