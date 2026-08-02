// EnemyMeshBuilder.swift
// Meridian hostile special-forces mesh — dark kits + red/orange IR accents.
// Distinct from KESTREL teal operators in OperatorMeshBuilder (do not share that path).
// Modest poly: boxes + a few low-segment spheres; shared materials where safe.

import SceneKit
import UIKit

enum EnemyMeshBuilder {

    enum Kit {
        case rifle
        case knife
    }

    // MARK: - Public

    /// Attaches Meridian body parts as **direct children** of `root` so hit-flash
    /// (`enemyTorso`, recursively: false) and future headshots (`enemyHead`) keep working.
    static func attachBody(to root: SCNNode, kit: Kit) {
        switch kit {
        case .rifle: attachRifleTrooper(to: root)
        case .knife: attachKnifeAssassin(to: root)
        }
    }

    // MARK: - Rifle trooper (full plate + pack)

    private static func attachRifleTrooper(to root: SCNNode) {
        let shared = SharedMaterials.rifle

        // Soft underlayer
        addBox(
            to: root, name: "enemyBody",
            width: 0.46, height: 0.66, length: 0.30, chamfer: 0.04,
            material: shared.fatigues,
            at: SCNVector3(0, 1.14, 0)
        )

        // Plate carrier — unique material so hit-flash does not bleed across enemies
        // Local −Z is face/weapon forward (matches enemyGun / enemyKnife).
        let torsoMat = cloneArmor(Palette.plate)
        addBox(
            to: root, name: "enemyTorso",
            width: 0.50, height: 0.52, length: 0.38, chamfer: 0.03,
            material: torsoMat,
            at: SCNVector3(0, 1.18, -0.02)
        )

        // Upper yoke
        addBox(
            to: root, name: "enemyBody",
            width: 0.40, height: 0.11, length: 0.40, chamfer: 0.02,
            material: shared.armorDark,
            at: SCNVector3(0, 1.42, -0.03)
        )

        // Hostile IR cummerbund (red-orange — opposite of KESTREL teal)
        addBox(
            to: root, name: "enemyBody",
            width: 0.38, height: 0.065, length: 0.41, chamfer: 0.012,
            material: shared.irAccent,
            at: SCNVector3(0, 1.30, -0.04)
        )

        // Lower molle band
        addBox(
            to: root, name: "enemyBody",
            width: 0.46, height: 0.045, length: 0.38, chamfer: 0.01,
            material: shared.armorDark,
            at: SCNVector3(0, 1.02, -0.03)
        )

        // Triple mag pouches (chest, toward weapon forward)
        for i in -1...1 {
            let x = Float(i) * 0.11
            addBox(
                to: root, name: "enemyBody",
                width: 0.09, height: 0.14, length: 0.07, chamfer: 0.012,
                material: shared.pouch,
                at: SCNVector3(x, 1.16, -0.24)
            )
            addBox(
                to: root, name: "enemyBody",
                width: 0.07, height: 0.018, length: 0.055, chamfer: 0.004,
                material: shared.irTrim,
                at: SCNVector3(x, 1.23, -0.25)
            )
        }

        // Side radio / dump
        addBox(
            to: root, name: "enemyBody",
            width: 0.08, height: 0.12, length: 0.08, chamfer: 0.015,
            material: shared.pouch,
            at: SCNVector3(0.28, 1.08, -0.08)
        )

        // Meridian shoulder patch
        addBox(
            to: root, name: "enemyBody",
            width: 0.06, height: 0.09, length: 0.03, chamfer: 0.004,
            material: shared.irAccent,
            at: SCNVector3(0.24, 1.34, -0.18)
        )

        // Shoulder pads
        for x: Float in [-0.32, 0.32] {
            addBox(
                to: root, name: "enemyBody",
                width: 0.18, height: 0.12, length: 0.22, chamfer: 0.03,
                material: shared.armorDark,
                at: SCNVector3(x, 1.38, -0.01)
            )
        }

        addBelt(to: root, shared: shared, wide: true)
        addHipsAndLegs(to: root, shared: shared, kneePads: true, legSpread: 0.135)
        addArms(to: root, shared: shared, guards: true, spread: 0.30)
        addBackPack(to: root, shared: shared, withAntenna: true)
        addHeadKit(to: root, shared: shared, style: .maskedHelm)
    }

    // MARK: - Knife assassin (lighter CQC harness)

    private static func attachKnifeAssassin(to root: SCNNode) {
        let shared = SharedMaterials.knife

        // Slimmer fatigues
        addBox(
            to: root, name: "enemyBody",
            width: 0.42, height: 0.62, length: 0.28, chamfer: 0.04,
            material: shared.fatigues,
            at: SCNVector3(0, 1.14, 0)
        )

        // Soft armor vest (unique for flash)
        let torsoMat = cloneArmor(Palette.assassinPlate)
        addBox(
            to: root, name: "enemyTorso",
            width: 0.44, height: 0.46, length: 0.34, chamfer: 0.03,
            material: torsoMat,
            at: SCNVector3(0, 1.16, -0.02)
        )

        // X-harness straps (reads as CQC / no heavy plate)
        addBox(
            to: root, name: "enemyBody",
            width: 0.06, height: 0.42, length: 0.04, chamfer: 0.008,
            material: shared.armorDark,
            at: SCNVector3(-0.10, 1.22, -0.18)
        )
        addBox(
            to: root, name: "enemyBody",
            width: 0.06, height: 0.42, length: 0.04, chamfer: 0.008,
            material: shared.armorDark,
            at: SCNVector3(0.10, 1.22, -0.18)
        )

        // Amber IR slash (knife faction accent — warmer than rifle red)
        addBox(
            to: root, name: "enemyBody",
            width: 0.34, height: 0.05, length: 0.36, chamfer: 0.01,
            material: shared.irAccent,
            at: SCNVector3(0, 1.28, -0.04)
        )

        // Twin utility pouches only
        for x: Float in [-0.10, 0.10] {
            addBox(
                to: root, name: "enemyBody",
                width: 0.09, height: 0.11, length: 0.065, chamfer: 0.012,
                material: shared.pouch,
                at: SCNVector3(x, 1.10, -0.22)
            )
        }

        // Sheathed spare blade on chest
        addBox(
            to: root, name: "enemyBody",
            width: 0.04, height: 0.02, length: 0.16, chamfer: 0.004,
            material: shared.bladeSteel,
            at: SCNVector3(-0.18, 1.20, -0.20)
        )

        addBelt(to: root, shared: shared, wide: false)
        addHipsAndLegs(to: root, shared: shared, kneePads: false, legSpread: 0.125)
        addArms(to: root, shared: shared, guards: false, spread: 0.28)
        // No backpack — silhouette stays lean
        addHeadKit(to: root, shared: shared, style: .fullBalaclava)
    }

    // MARK: - Shared subassemblies

    private enum HeadStyle {
        case maskedHelm
        case fullBalaclava
    }

    private static func addHeadKit(to root: SCNNode, shared: SharedMaterials.Bundle, style: HeadStyle) {
        // Neck / skin peek
        addSphere(
            to: root, name: "enemyBody",
            radius: 0.14, material: shared.skin,
            at: SCNVector3(0, 1.66, 0),
            scale: SCNVector3(1, 1.02, 0.92)
        )

        switch style {
        case .maskedHelm:
            // Lower face plate / gas-mask shell (−Z = face forward)
            addBox(
                to: root, name: "enemyBody",
                width: 0.22, height: 0.13, length: 0.18, chamfer: 0.04,
                material: shared.mask,
                at: SCNVector3(0, 1.62, -0.04)
            )
            // Dual filter cans
            for x: Float in [-0.07, 0.07] {
                addSphere(
                    to: root, name: "enemyBody",
                    radius: 0.035, material: shared.armorDark,
                    at: SCNVector3(x, 1.58, -0.14)
                )
            }
            // Eye slit with IR glow
            addBox(
                to: root, name: "enemyBody",
                width: 0.16, height: 0.03, length: 0.05, chamfer: 0.008,
                material: shared.visorGlow,
                at: SCNVector3(0, 1.66, -0.13)
            )

        case .fullBalaclava:
            addBox(
                to: root, name: "enemyBody",
                width: 0.24, height: 0.16, length: 0.20, chamfer: 0.05,
                material: shared.mask,
                at: SCNVector3(0, 1.62, -0.03)
            )
            addBox(
                to: root, name: "enemyBody",
                width: 0.17, height: 0.032, length: 0.055, chamfer: 0.008,
                material: shared.visorGlow,
                at: SCNVector3(0, 1.66, -0.13)
            )
        }

        // Helmet dome — named enemyHead for headshot volume discovery
        let helm = SCNSphere(radius: style == .maskedHelm ? 0.172 : 0.160)
        helm.segmentCount = 12
        helm.firstMaterial = shared.helmet
        let helmNode = SCNNode(geometry: helm)
        helmNode.name = "enemyHead"
        helmNode.position = SCNVector3(0, 1.78, 0)
        helmNode.scale = SCNVector3(1.02, 0.68, 1.08)
        root.addChildNode(helmNode)

        // Brow ridge
        addBox(
            to: root, name: "enemyBody",
            width: 0.26, height: 0.04, length: 0.15, chamfer: 0.01,
            material: shared.helmet,
            at: SCNVector3(0, 1.84, -0.08)
        )

        // Occipital cover (back of helm, +Z)
        addBox(
            to: root, name: "enemyBody",
            width: 0.18, height: 0.07, length: 0.10, chamfer: 0.02,
            material: shared.helmet,
            at: SCNVector3(0, 1.70, 0.12)
        )

        // Side rails
        for x: Float in [-0.15, 0.15] {
            addBox(
                to: root, name: "enemyBody",
                width: 0.032, height: 0.065, length: 0.11, chamfer: 0.006,
                material: shared.plastic,
                at: SCNVector3(x, 1.78, 0)
            )
        }

        // NVG shroud with hostile accent
        addBox(
            to: root, name: "enemyBody",
            width: 0.075, height: 0.045, length: 0.055, chamfer: 0.01,
            material: shared.irTrim,
            at: SCNVector3(0, 1.88, -0.11)
        )

        if style == .maskedHelm {
            // Comms cups
            for x: Float in [-0.17, 0.17] {
                addBox(
                    to: root, name: "enemyBody",
                    width: 0.065, height: 0.085, length: 0.085, chamfer: 0.02,
                    material: shared.plastic,
                    at: SCNVector3(x, 1.75, 0)
                )
            }
        }
    }

    private static func addBelt(to root: SCNNode, shared: SharedMaterials.Bundle, wide: Bool) {
        addBox(
            to: root, name: "enemyBody",
            width: wide ? 0.50 : 0.44, height: 0.065, length: 0.28, chamfer: 0.015,
            material: shared.armorDark,
            at: SCNVector3(0, 0.88, 0)
        )
        addBox(
            to: root, name: "enemyBody",
            width: 0.11, height: 0.13, length: 0.09, chamfer: 0.02,
            material: shared.pouch,
            at: SCNVector3(wide ? 0.16 : 0.14, 0.78, -0.12)
        )
    }

    private static func addHipsAndLegs(
        to root: SCNNode,
        shared: SharedMaterials.Bundle,
        kneePads: Bool,
        legSpread: Float
    ) {
        addBox(
            to: root, name: "enemyBody",
            width: 0.46, height: 0.30, length: 0.30, chamfer: 0.04,
            material: shared.pants,
            at: SCNVector3(0, 0.72, 0)
        )

        for x: Float in [-legSpread, legSpread] {
            addBox(
                to: root, name: "enemyBody",
                width: 0.15, height: 0.50, length: 0.16, chamfer: 0.03,
                material: shared.pants,
                at: SCNVector3(x, 0.30, 0)
            )
            addBox(
                to: root, name: "enemyBody",
                width: 0.17, height: 0.10, length: 0.22, chamfer: 0.02,
                material: shared.boot,
                at: SCNVector3(x, 0.06, -0.04)
            )
            if kneePads {
                addBox(
                    to: root, name: "enemyBody",
                    width: 0.17, height: 0.10, length: 0.12, chamfer: 0.02,
                    material: shared.armorDark,
                    at: SCNVector3(x, 0.40, -0.08)
                )
            }
        }
    }

    private static func addArms(
        to root: SCNNode,
        shared: SharedMaterials.Bundle,
        guards: Bool,
        spread: Float
    ) {
        for x: Float in [-spread, spread] {
            addBox(
                to: root, name: "enemyBody",
                width: 0.115, height: 0.44, length: 0.115, chamfer: 0.03,
                material: shared.fatigues,
                at: SCNVector3(x, 1.14, 0)
            )
            addBox(
                to: root, name: "enemyBody",
                width: 0.105, height: 0.075, length: 0.105, chamfer: 0.02,
                material: shared.glove,
                at: SCNVector3(x, 0.94, 0)
            )
            if guards {
                addBox(
                    to: root, name: "enemyBody",
                    width: 0.14, height: 0.16, length: 0.14, chamfer: 0.02,
                    material: shared.armorDark,
                    at: SCNVector3(x, 1.06, 0)
                )
            }
        }
    }

    private static func addBackPack(to root: SCNNode, shared: SharedMaterials.Bundle, withAntenna: Bool) {
        // +Z = back (away from weapon forward)
        addBox(
            to: root, name: "enemyBody",
            width: 0.28, height: 0.40, length: 0.14, chamfer: 0.03,
            material: shared.pouch,
            at: SCNVector3(0, 1.16, 0.24)
        )
        addBox(
            to: root, name: "enemyBody",
            width: 0.17, height: 0.15, length: 0.075, chamfer: 0.02,
            material: shared.armorDark,
            at: SCNVector3(0, 1.30, 0.30)
        )
        if withAntenna {
            addBox(
                to: root, name: "enemyBody",
                width: 0.026, height: 0.22, length: 0.026, chamfer: 0.004,
                material: shared.irTrim,
                at: SCNVector3(0.09, 1.46, 0.28)
            )
            addSphere(
                to: root, name: "enemyBody",
                radius: 0.018, material: shared.irAccent,
                at: SCNVector3(0.09, 1.58, 0.28)
            )
        }
    }

    // MARK: - Palette / shared materials

    private enum Palette {
        static let fatigues = UIColor(red: 0.09, green: 0.09, blue: 0.10, alpha: 1)
        static let pants = UIColor(red: 0.07, green: 0.07, blue: 0.08, alpha: 1)
        static let plate = UIColor(red: 0.14, green: 0.12, blue: 0.12, alpha: 1)
        static let assassinPlate = UIColor(red: 0.11, green: 0.10, blue: 0.11, alpha: 1)
        static let armorDark = UIColor(red: 0.10, green: 0.09, blue: 0.09, alpha: 1)
        static let helmet = UIColor(red: 0.08, green: 0.07, blue: 0.07, alpha: 1)
        static let pouch = UIColor(red: 0.12, green: 0.11, blue: 0.10, alpha: 1)
        static let mask = UIColor(red: 0.05, green: 0.05, blue: 0.055, alpha: 1)
        static let skin = UIColor(red: 0.38, green: 0.30, blue: 0.24, alpha: 1)
        static let boot = UIColor(white: 0.06, alpha: 1)
        static let glove = UIColor(white: 0.08, alpha: 1)
        static let plastic = UIColor(white: 0.13, alpha: 1)
        /// Rifle hostiles — hot red-orange IR
        static let irRifle = UIColor(red: 0.92, green: 0.22, blue: 0.06, alpha: 1)
        /// Knife hostiles — amber IR (still hostile, slightly different kit read)
        static let irKnife = UIColor(red: 0.95, green: 0.42, blue: 0.08, alpha: 1)
        static let blade = UIColor(red: 0.72, green: 0.74, blue: 0.76, alpha: 1)
    }

    /// Materials reused across all enemies of a kit. Torso plate is cloned per enemy.
    private enum SharedMaterials {
        struct Bundle {
            let fatigues: SCNMaterial
            let pants: SCNMaterial
            let armorDark: SCNMaterial
            let helmet: SCNMaterial
            let pouch: SCNMaterial
            let mask: SCNMaterial
            let skin: SCNMaterial
            let boot: SCNMaterial
            let glove: SCNMaterial
            let plastic: SCNMaterial
            let irAccent: SCNMaterial
            let irTrim: SCNMaterial
            let visorGlow: SCNMaterial
            let bladeSteel: SCNMaterial
        }

        static let rifle: Bundle = makeBundle(ir: Palette.irRifle)
        static let knife: Bundle = makeBundle(ir: Palette.irKnife)

        private static func makeBundle(ir: UIColor) -> Bundle {
            Bundle(
                fatigues: fabric(Palette.fatigues, roughness: 0.82, specular: 0.08),
                pants: fabric(Palette.pants, roughness: 0.85, specular: 0.06),
                armorDark: armor(Palette.armorDark, metalness: 0.32, roughness: 0.48),
                helmet: armor(Palette.helmet, metalness: 0.38, roughness: 0.40),
                pouch: fabric(Palette.pouch, roughness: 0.75, specular: 0.10),
                mask: fabric(Palette.mask, roughness: 0.9, specular: 0.05),
                skin: skinMat(Palette.skin),
                boot: armor(Palette.boot, metalness: 0.12, roughness: 0.68),
                glove: fabric(Palette.glove, roughness: 0.88, specular: 0.05),
                plastic: hardPlastic(Palette.plastic, specular: 0.4),
                irAccent: irMaterial(ir, emission: 0.28),
                irTrim: irMaterial(ir, emission: 0.18),
                visorGlow: irMaterial(ir, emission: 0.45),
                bladeSteel: steel(Palette.blade)
            )
        }
    }

    private static func cloneArmor(_ color: UIColor) -> SCNMaterial {
        armor(color, metalness: 0.30, roughness: 0.46)
    }

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
        m.specular.contents = UIColor.white.withAlphaComponent(0.4)
        return m
    }

    private static func hardPlastic(_ color: UIColor, specular: CGFloat) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.lightingModel = .blinn
        m.specular.contents = UIColor.white.withAlphaComponent(specular)
        m.shininess = 0.65
        return m
    }

    private static func skinMat(_ color: UIColor) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.lightingModel = .blinn
        m.specular.contents = UIColor(red: 1, green: 0.9, blue: 0.85, alpha: 0.22)
        m.shininess = 0.22
        return m
    }

    private static func irMaterial(_ color: UIColor, emission: CGFloat) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.emission.contents = color.withAlphaComponent(emission)
        m.lightingModel = .blinn
        m.specular.contents = UIColor.white.withAlphaComponent(0.4)
        m.shininess = 0.55
        return m
    }

    private static func steel(_ color: UIColor) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.lightingModel = .physicallyBased
        m.metalness.contents = 0.85
        m.roughness.contents = 0.28
        return m
    }

    // MARK: - Geometry helpers

    private static func addBox(
        to parent: SCNNode,
        name: String,
        width: CGFloat, height: CGFloat, length: CGFloat,
        chamfer: CGFloat,
        material: SCNMaterial,
        at position: SCNVector3
    ) {
        let geo = SCNBox(width: width, height: height, length: length, chamferRadius: chamfer)
        geo.firstMaterial = material
        let node = SCNNode(geometry: geo)
        node.name = name
        node.position = position
        parent.addChildNode(node)
    }

    private static func addSphere(
        to parent: SCNNode,
        name: String,
        radius: CGFloat,
        material: SCNMaterial,
        at position: SCNVector3,
        scale: SCNVector3 = SCNVector3(1, 1, 1)
    ) {
        let geo = SCNSphere(radius: radius)
        geo.segmentCount = 12
        geo.firstMaterial = material
        let node = SCNNode(geometry: geo)
        node.name = name
        node.position = position
        node.scale = scale
        parent.addChildNode(node)
    }
}
