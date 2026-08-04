// OperatorMeshBuilder.swift
// Shared SWAT / special-forces body mesh for Story, Arena, Training, Range.
// Keep poly count modest: boxes + a few spheres only.

import SceneKit
import UIKit

enum OperatorMeshBuilder {

    // MARK: - Public

    /// Third-person player / teammate body. Callers set `name` ("playerBody" / "teammateBody").
    static func makeBodyNode(look: OperatorAppearance) -> SCNNode {
        let root = SCNNode()

        let torsoW: CGFloat = look.bulkyTorso ? 0.58 : 0.48
        let torsoH: CGFloat = look.bulkyTorso ? 0.74 : 0.64
        let torsoD: CGFloat = look.bulkyTorso ? 0.40 : 0.32

        // Soft uniform underlayer
        addBox(
            to: root,
            width: torsoW * 0.96, height: torsoH, length: torsoD * 0.92,
            chamfer: 0.04,
            material: fabric(look.suit, roughness: 0.78, specular: 0.12),
            at: SCNVector3(0, 1.14, 0)
        )

        // Plate carrier shell (darker, slightly metal)
        let carrierMat = armor(look.plateCarrier, metalness: 0.28, roughness: 0.48)
        addBox(
            to: root,
            width: torsoW * 0.94, height: torsoH * 0.78, length: torsoD + 0.06,
            chamfer: 0.03,
            material: carrierMat,
            at: SCNVector3(0, 1.18, 0.02)
        )

        // Upper plate / yoke
        addBox(
            to: root,
            width: torsoW * 0.78, height: 0.12, length: torsoD + 0.08,
            chamfer: 0.02,
            material: armor(look.helmet, metalness: 0.35, roughness: 0.42),
            at: SCNVector3(0, 1.42, 0.03)
        )

        // IR / unit accent cummerbund stripe
        let stripeMat = SCNMaterial()
        stripeMat.diffuse.contents = look.accentUIColor
        stripeMat.emission.contents = look.accentUIColor.withAlphaComponent(0.22)
        stripeMat.lightingModel = .blinn
        stripeMat.specular.contents = UIColor.white.withAlphaComponent(0.35)
        stripeMat.shininess = 0.55
        addBox(
            to: root,
            width: torsoW * 0.74, height: 0.07, length: torsoD + 0.09,
            chamfer: 0.015,
            material: stripeMat,
            at: SCNVector3(0, 1.30, 0.04)
        )

        // Lower molle band
        addBox(
            to: root,
            width: torsoW * 0.90, height: 0.05, length: torsoD + 0.07,
            chamfer: 0.01,
            material: armor(look.helmet, metalness: 0.22, roughness: 0.55),
            at: SCNVector3(0, 1.02, 0.03)
        )

        addChestPouches(to: root, look: look, torsoW: torsoW, torsoD: torsoD)
        addBeltKit(to: root, look: look)

        // Hips / pants
        addBox(
            to: root,
            width: look.bulkyTorso ? 0.52 : 0.44, height: 0.30, length: 0.30,
            chamfer: 0.04,
            material: fabric(look.pants, roughness: 0.82, specular: 0.08),
            at: SCNVector3(0, 0.72, 0)
        )

        addHeadKit(to: root, look: look)
        addLimbs(to: root, look: look)
        addPack(to: root, look: look)

        if look.hasShoulderPads {
            for x: Float in [-0.34, 0.34] {
                addBox(
                    to: root,
                    width: 0.20, height: 0.13, length: 0.24,
                    chamfer: 0.03,
                    material: armor(look.helmet, metalness: 0.4, roughness: 0.4),
                    at: SCNVector3(x, 1.38, 0.01)
                )
                // Soft deltoid under pad
                addBox(
                    to: root,
                    width: 0.14, height: 0.08, length: 0.16,
                    chamfer: 0.02,
                    material: fabric(look.suit, roughness: 0.75, specular: 0.1),
                    at: SCNVector3(x * 0.92, 1.28, 0)
                )
            }
        }

        if look.hasUnitPatch {
            let patchMat = SCNMaterial()
            patchMat.diffuse.contents = look.accentUIColor
            patchMat.emission.contents = look.accentUIColor.withAlphaComponent(0.35)
            patchMat.lightingModel = .blinn
            patchMat.specular.contents = UIColor.white.withAlphaComponent(0.5)
            addBox(
                to: root,
                width: 0.07, height: 0.10, length: 0.03,
                chamfer: 0.004,
                material: patchMat,
                at: SCNVector3(0.24, 1.34, 0.18)
            )
        }

        if look.hasMedicCross {
            let white = hardPlastic(UIColor.white, specular: 0.55)
            addBox(to: root, width: 0.055, height: 0.17, length: 0.035, chamfer: 0.008, material: white, at: SCNVector3(0, 1.22, 0.24))
            addBox(to: root, width: 0.13, height: 0.055, length: 0.035, chamfer: 0.008, material: white, at: SCNVector3(0, 1.22, 0.24))
        }

        return root
    }

    /// Ally wrapper: shared body + teal IFF stripe. Rifle / HP bar stay in MissionSceneBuilder.
    static func makeTeammateBody(look: OperatorAppearance) -> SCNNode {
        let body = makeBodyNode(look: look)
        body.name = "teammateBody"

        let stripe = SCNBox(width: 0.07, height: 0.36, length: 0.05, chamferRadius: 0.01)
        let mat = SCNMaterial()
        mat.diffuse.contents = UIColor(red: 0.1, green: 0.95, blue: 0.88, alpha: 1)
        mat.emission.contents = UIColor(red: 0.05, green: 0.45, blue: 0.4, alpha: 1)
        mat.lightingModel = .constant
        stripe.firstMaterial = mat
        let stripeNode = SCNNode(geometry: stripe)
        stripeNode.name = "kestrelMark"
        stripeNode.position = SCNVector3(-0.32, 1.22, 0.03)
        body.addChildNode(stripeNode)

        return body
    }

    // MARK: - Subassemblies

    private static func addHeadKit(to root: SCNNode, look: OperatorAppearance) {
        let helmR: CGFloat = look.bulkyTorso ? 0.185 : 0.168

        // Skin / neck
        addSphere(to: root, radius: 0.145, material: skin(look.skin), at: SCNVector3(0, 1.68, 0), scale: SCNVector3(1, 1.05, 0.95))

        if look.hasBalaclava {
            // Contoured lower-face mask (reads as balaclava, not a flat slab)
            addBox(
                to: root,
                width: 0.24, height: 0.14, length: 0.20,
                chamfer: 0.05,
                material: fabric(UIColor(red: 0.05, green: 0.05, blue: 0.06, alpha: 1), roughness: 0.9, specular: 0.05),
                at: SCNVector3(0, 1.62, -0.02)
            )
            // Eye slit
            addBox(
                to: root,
                width: 0.18, height: 0.035, length: 0.06,
                chamfer: 0.01,
                material: hardPlastic(UIColor(white: 0.02, alpha: 1), specular: 0.2),
                at: SCNVector3(0, 1.66, -0.10)
            )
        }

        // FAST / Ops-Core style dome
        let helmMat = armor(look.helmet, metalness: 0.38, roughness: 0.36)
        addSphere(to: root, radius: helmR, material: helmMat, at: SCNVector3(0, 1.78, 0.01), scale: SCNVector3(1.02, 0.68, 1.08))

        // Brow ridge
        addBox(
            to: root,
            width: look.bulkyTorso ? 0.30 : 0.26, height: 0.045, length: 0.16,
            chamfer: 0.012,
            material: helmMat,
            at: SCNVector3(0, 1.84, -0.07)
        )

        // Nape / occipital cover
        addBox(
            to: root,
            width: 0.20, height: 0.08, length: 0.12,
            chamfer: 0.02,
            material: helmMat,
            at: SCNVector3(0, 1.70, 0.12)
        )

        // Side rails (NVG / headset mounts)
        for x: Float in [-0.15, 0.15] {
            addBox(
                to: root,
                width: 0.035, height: 0.07, length: 0.12,
                chamfer: 0.006,
                material: hardPlastic(UIColor(white: 0.14, alpha: 1), specular: 0.4),
                at: SCNVector3(x, 1.78, 0.02)
            )
        }

        // Front NVG shroud bump (accent on visor kits, muted otherwise)
        let shroudColor = look.hasVisor ? look.accentUIColor : UIColor(white: 0.16, alpha: 1)
        addBox(
            to: root,
            width: 0.08, height: 0.05, length: 0.06,
            chamfer: 0.01,
            material: hardPlastic(shroudColor, specular: 0.45),
            at: SCNVector3(0, 1.88, -0.10)
        )

        if look.hasVisor {
            let visorMat = SCNMaterial()
            visorMat.diffuse.contents = look.accentUIColor.withAlphaComponent(0.82)
            visorMat.emission.contents = look.accentUIColor.withAlphaComponent(0.38)
            visorMat.lightingModel = .blinn
            visorMat.specular.contents = UIColor.white.withAlphaComponent(0.65)
            visorMat.shininess = 0.85
            addBox(
                to: root,
                width: 0.24, height: 0.055, length: 0.07,
                chamfer: 0.012,
                material: visorMat,
                at: SCNVector3(0, 1.73, -0.13)
            )
        }

        if look.hasHeadset {
            let cupMat = hardPlastic(UIColor(white: 0.11, alpha: 1), specular: 0.35)
            for x: Float in [-0.17, 0.17] {
                addBox(
                    to: root,
                    width: 0.07, height: 0.09, length: 0.09,
                    chamfer: 0.02,
                    material: cupMat,
                    at: SCNVector3(x, 1.75, 0)
                )
            }
            // Boom mic
            addBox(
                to: root,
                width: 0.035, height: 0.028, length: 0.13,
                chamfer: 0.008,
                material: hardPlastic(UIColor(white: 0.2, alpha: 1), specular: 0.4),
                at: SCNVector3(0.13, 1.66, -0.09)
            )
            addSphere(
                to: root,
                radius: 0.022,
                material: hardPlastic(look.accentUIColor, specular: 0.5),
                at: SCNVector3(0.13, 1.64, -0.15)
            )
        }
    }

    private static func addChestPouches(to root: SCNNode, look: OperatorAppearance, torsoW: CGFloat, torsoD: CGFloat) {
        let pouchMat = fabric(look.pants, roughness: 0.7, specular: 0.1)
        let trimMat = hardPlastic(look.accentUIColor.withAlphaComponent(0.9), specular: 0.3)
        let z: Float = Float(torsoD) * 0.5 + 0.06
        let yRow: Float = look.bulkyTorso ? 1.18 : 1.16

        // Layout fingerprint from kit flags — keeps all 13 ops readable without new fields.
        let seed = pouchSeed(look)
        switch seed % 3 {
        case 0:
            // Triple mag row (assault / default)
            for i in -1...1 {
                let x = Float(i) * 0.11
                addBox(to: root, width: 0.09, height: 0.14, length: 0.07, chamfer: 0.012, material: pouchMat, at: SCNVector3(x, yRow, z))
                addBox(to: root, width: 0.07, height: 0.02, length: 0.06, chamfer: 0.004, material: trimMat, at: SCNVector3(x, yRow + 0.07, z + 0.01))
            }
        case 1:
            // Twin mags + side dump (scout / medic lean)
            for i in [-1, 1] {
                let x = Float(i) * 0.10
                addBox(to: root, width: 0.10, height: 0.15, length: 0.075, chamfer: 0.012, material: pouchMat, at: SCNVector3(x, yRow, z))
            }
            addBox(to: root, width: 0.08, height: 0.10, length: 0.08, chamfer: 0.015, material: pouchMat, at: SCNVector3(Float(torsoW) * 0.42, 1.05, 0.08))
            addBox(to: root, width: 0.06, height: 0.015, length: 0.05, chamfer: 0.003, material: trimMat, at: SCNVector3(0, yRow + 0.08, z + 0.01))
        default:
            // Quad micro pouches (heavy / demo)
            for i in 0..<4 {
                let x = Float(i) * 0.09 - 0.135
                addBox(to: root, width: 0.075, height: 0.12, length: 0.065, chamfer: 0.01, material: pouchMat, at: SCNVector3(x, yRow - 0.02, z))
            }
            addBox(to: root, width: 0.12, height: 0.02, length: 0.05, chamfer: 0.004, material: trimMat, at: SCNVector3(0, yRow + 0.06, z + 0.01))
        }
    }

    private static func addBeltKit(to root: SCNNode, look: OperatorAppearance) {
        let beltMat = armor(look.plateCarrier, metalness: 0.2, roughness: 0.55)
        addBox(
            to: root,
            width: look.bulkyTorso ? 0.54 : 0.46, height: 0.07, length: 0.28,
            chamfer: 0.015,
            material: beltMat,
            at: SCNVector3(0, 0.88, 0)
        )
        // Drop pouch
        addBox(
            to: root,
            width: 0.12, height: 0.14, length: 0.10,
            chamfer: 0.02,
            material: fabric(look.pants, roughness: 0.75, specular: 0.08),
            at: SCNVector3(0.16, 0.78, 0.12)
        )
        if look.hasMedicCross {
            // IFAK side pouch
            addBox(
                to: root,
                width: 0.10, height: 0.12, length: 0.09,
                chamfer: 0.018,
                material: fabric(UIColor(red: 0.55, green: 0.12, blue: 0.14, alpha: 1), roughness: 0.7, specular: 0.12),
                at: SCNVector3(-0.18, 0.80, 0.10)
            )
        }
    }

    private static func addLimbs(to root: SCNNode, look: OperatorAppearance) {
        let pantsMat = fabric(look.pants, roughness: 0.8, specular: 0.08)
        let suitMat = fabric(look.suit, roughness: 0.76, specular: 0.1)
        let bootMat = armor(UIColor(white: 0.07, alpha: 1), metalness: 0.15, roughness: 0.65)
        let legW: CGFloat = look.bulkyTorso ? 0.175 : 0.145

        for x: Float in [-0.135, 0.135] {
            addBox(to: root, width: legW, height: 0.50, length: 0.16, chamfer: 0.03, material: pantsMat, at: SCNVector3(x, 0.30, 0))
            // Boot
            addBox(to: root, width: legW + 0.02, height: 0.10, length: 0.22, chamfer: 0.02, material: bootMat, at: SCNVector3(x, 0.06, -0.03))

            if look.hasKneePads {
                addBox(
                    to: root,
                    width: legW + 0.04, height: 0.11, length: 0.13,
                    chamfer: 0.02,
                    material: armor(look.helmet, metalness: 0.35, roughness: 0.4),
                    at: SCNVector3(x, 0.40, -0.07)
                )
            }
        }

        for x: Float in [-0.30, 0.30] {
            addBox(to: root, width: 0.12, height: 0.44, length: 0.12, chamfer: 0.03, material: suitMat, at: SCNVector3(x, 1.14, 0))
            // Glove / cuff
            addBox(
                to: root,
                width: 0.11, height: 0.08, length: 0.11,
                chamfer: 0.02,
                material: fabric(UIColor(white: 0.09, alpha: 1), roughness: 0.85, specular: 0.06),
                at: SCNVector3(x, 0.94, 0)
            )

            if look.hasArmGuards {
                addBox(
                    to: root,
                    width: 0.145, height: 0.17, length: 0.145,
                    chamfer: 0.02,
                    material: armor(look.helmet, metalness: 0.4, roughness: 0.38),
                    at: SCNVector3(x, 1.06, 0)
                )
            }
        }
    }

    private static func addPack(to root: SCNNode, look: OperatorAppearance) {
        let packH: CGFloat = look.hasHeadset ? 0.42 : 0.34
        let packMat = fabric(look.pants, roughness: 0.72, specular: 0.1)
        addBox(
            to: root,
            width: look.bulkyTorso ? 0.32 : 0.28, height: packH, length: 0.15,
            chamfer: 0.03,
            material: packMat,
            at: SCNVector3(0, 1.16, 0.24)
        )
        // Hydration / radio hump
        addBox(
            to: root,
            width: 0.18, height: 0.16, length: 0.08,
            chamfer: 0.02,
            material: armor(look.plateCarrier, metalness: 0.18, roughness: 0.6),
            at: SCNVector3(0, 1.30, 0.30)
        )
        if look.hasHeadset {
            let antMat = hardPlastic(look.accentUIColor, specular: 0.55)
            addBox(to: root, width: 0.028, height: 0.24, length: 0.028, chamfer: 0.004, material: antMat, at: SCNVector3(0.09, 1.46, 0.28))
            addSphere(to: root, radius: 0.02, material: antMat, at: SCNVector3(0.09, 1.58, 0.28))
        }
    }

    // MARK: - Materials

    private static func fabric(_ color: UIColor, roughness: CGFloat, specular: CGFloat) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.lightingModel = .blinn
        m.specular.contents = UIColor.white.withAlphaComponent(specular)
        m.shininess = max(0.05, 1.0 - roughness)
        m.locksAmbientWithDiffuse = true
        return m
    }

    private static func armor(_ color: UIColor, metalness: CGFloat, roughness: CGFloat) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.lightingModel = .physicallyBased
        m.metalness.contents = metalness
        m.roughness.contents = roughness
        m.specular.contents = UIColor.white.withAlphaComponent(0.45)
        return m
    }

    private static func hardPlastic(_ color: UIColor, specular: CGFloat) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.lightingModel = .blinn
        m.specular.contents = UIColor.white.withAlphaComponent(specular)
        m.shininess = 0.7
        return m
    }

    private static func skin(_ color: UIColor) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.lightingModel = .blinn
        m.specular.contents = UIColor(red: 1, green: 0.9, blue: 0.85, alpha: 0.25)
        m.shininess = 0.25
        return m
    }

    // MARK: - Geometry helpers

    private static func addBox(
        to parent: SCNNode,
        width: CGFloat, height: CGFloat, length: CGFloat,
        chamfer: CGFloat,
        material: SCNMaterial,
        at position: SCNVector3
    ) {
        let geo = SCNBox(width: width, height: height, length: length, chamferRadius: chamfer)
        geo.firstMaterial = material
        let node = SCNNode(geometry: geo)
        node.position = position
        parent.addChildNode(node)
    }

    private static func addSphere(
        to parent: SCNNode,
        radius: CGFloat,
        material: SCNMaterial,
        at position: SCNVector3,
        scale: SCNVector3 = SCNVector3(1, 1, 1)
    ) {
        let geo = SCNSphere(radius: radius)
        geo.segmentCount = 12 // modest tessellation
        geo.firstMaterial = material
        let node = SCNNode(geometry: geo)
        node.position = position
        node.scale = scale
        parent.addChildNode(node)
    }

    private static func pouchSeed(_ look: OperatorAppearance) -> Int {
        var s = 0
        if look.bulkyTorso { s += 2 }
        if look.hasMedicCross { s += 1 }
        if look.hasVisor { s += 1 }
        if look.hasBalaclava { s += 2 }
        if look.hasShoulderPads { s += 1 }
        if look.hasHeadset { s += 1 }
        s += Int((look.accentR + look.accentG * 2 + look.accentB * 3) * 10) % 5
        return s
    }
}
