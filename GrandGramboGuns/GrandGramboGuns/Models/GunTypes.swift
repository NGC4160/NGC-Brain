// GunTypes.swift
// Stylized toy-gun enums and attachment slots.
// Cartoonish / arcade aesthetic — not real firearm data.

import Foundation
import SwiftUI

// MARK: - Base body styles

/// High-level gun body categories (mirrors common simulator category sets).
enum GunBodyType: String, Codable, CaseIterable, Identifiable {
    case pistol
    case smg
    case rifle
    case shotgun
    case machineGun
    case sniper

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .pistol: return "Pistol"
        case .smg: return "SMG"
        case .rifle: return "Rifle"
        case .shotgun: return "Shotgun"
        case .machineGun: return "Machine Gun"
        case .sniper: return "Sniper"
        }
    }

    /// Short flavor text for the builder UI.
    var blurb: String {
        switch self {
        case .pistol: return "Compact sidearm — shake for crisp shots"
        case .smg: return "Close-range spray — very fast fire rate"
        case .rifle: return "Battle rifle — snappy mid-rate fire"
        case .shotgun: return "Heavy boom — slow pump feel"
        case .machineGun: return "Sustained fire — high capacity belt feel"
        case .sniper: return "Long gun — slow, heavy single shots"
        }
    }

    /// Mag capacity for Range / Shake modes.
    var defaultMagCapacity: Int {
        switch self {
        case .pistol: return 15
        case .smg: return 30
        case .rifle: return 30
        case .shotgun: return 8
        case .machineGun: return 100
        case .sniper: return 5
        }
    }

    /// Fire rate (seconds between shots). Tuned to feel distinct per category.
    var fireInterval: TimeInterval {
        switch self {
        case .pistol: return 0.20
        case .smg: return 0.048
        case .rifle: return 0.125
        case .shotgun: return 0.78
        case .machineGun: return 0.068
        case .sniper: return 1.05
        }
    }

    /// Torch flash length for shake-to-shoot muzzle flash.
    var torchFlashDuration: TimeInterval {
        switch self {
        case .pistol: return 0.05
        case .smg: return 0.032
        case .rifle: return 0.06
        case .shotgun: return 0.11
        case .machineGun: return 0.038
        case .sniper: return 0.12
        }
    }

    /// UI recoil kick (points) for shake-to-shoot overlay.
    var recoilKickAmount: CGFloat {
        switch self {
        case .pistol: return 11
        case .smg: return 4
        case .rifle: return 15
        case .shotgun: return 28
        case .machineGun: return 7
        case .sniper: return 34
        }
    }

    /// Range / combat aim bloom half-width in camera space at the far aim point.
    /// Shotgun uses pellet offsets instead (returns 0). Sniper is near-pinpoint.
    var accuracyBloom: Float {
        switch self {
        case .pistol: return 0.032
        case .smg: return 0.088
        case .rifle: return 0.016
        case .shotgun: return 0.0
        case .machineGun: return 0.062
        case .sniper: return 0.001
        }
    }

    /// SceneKit gun-model kick used by Mission / Arena / Training.
    var combatRecoilKick: (y: CGFloat, z: CGFloat, rot: CGFloat, duration: TimeInterval) {
        switch self {
        case .pistol: return (0.022, 0.042, 0.09, 0.04)
        case .smg: return (0.010, 0.018, 0.04, 0.028)
        case .rifle: return (0.028, 0.052, 0.11, 0.05)
        case .shotgun: return (0.052, 0.092, 0.17, 0.08)
        case .machineGun: return (0.014, 0.028, 0.05, 0.032)
        case .sniper: return (0.058, 0.11, 0.19, 0.095)
        }
    }

    /// Max raycast / engagement distance for Mission & Arena.
    /// Snipers reach much farther; other classes keep the prior mid-map cap so they can't laser-snipe.
    var maxEngagementRange: Float {
        switch self {
        case .sniper: return 95
        default: return 50
        }
    }

    /// Training-bay engagement distance (maps are tighter than open Mission).
    var trainingEngagementRange: Float {
        switch self {
        case .sniper: return 90
        default: return 45
        }
    }

    /// Range mode segment length (camera-space −Z aim point).
    var rangeAimDistance: Float {
        switch self {
        case .sniper: return 90
        default: return 45
        }
    }

    /// Squared enemy hit-capsule radius for combat raycasts.
    /// Snipers get a slightly more forgiving volume so distant hits register reliably.
    var hitRadiusSquared: Float {
        switch self {
        case .sniper: return 2.56 // ~1.60 m
        default: return 1.55      // ~1.24 m
        }
    }

    /// Body sample heights (meters). Kept below the head sphere so torso hits don't steal headshots.
    var hitSampleHeights: [Float] {
        switch self {
        case .sniper: return [0.85, 1.15, 1.45]
        default: return [1.0, 1.35]
        }
    }

    /// Enemy head sphere center height (matches EnemyMeshBuilder helmet / enemyHead ≈1.78).
    var headHitCenterY: Float { 1.78 }

    /// Squared head hit radius. Snipers get a generous head volume for long-range reliability.
    var headHitRadiusSquared: Float {
        switch self {
        case .sniper: return 0.48 // ~0.69 m
        default: return 0.22      // ~0.47 m (visual head ~0.16)
        }
    }

    /// Damage multiplier for headshots.
    var headshotDamageMultiplier: Float {
        switch self {
        case .sniper: return 2.0
        default: return 1.5
        }
    }

    /// Apply headshot multiplier (minimum 1 damage).
    func damageWithHeadshot(_ base: Int, isHeadshot: Bool) -> Int {
        guard isHeadshot else { return max(1, base) }
        return max(1, Int((Float(base) * headshotDamageMultiplier).rounded()))
    }

    /// Base hit damage used when a gun has no catalog override.
    var shotDamage: Int {
        switch self {
        case .pistol, .smg, .machineGun: return 1
        case .rifle: return 2
        case .shotgun: return 3
        case .sniper: return 4
        }
    }

    var defaultCombatStats: GunCombatStats {
        GunCombatStats(
            magCapacity: defaultMagCapacity,
            fireInterval: fireInterval,
            accuracyBloom: accuracyBloom,
            recoilKick: recoilKickAmount,
            torchFlashDuration: torchFlashDuration,
            shotDamage: shotDamage
        )
    }
}

// MARK: - Named gun catalog (free starters + shop exclusives)

/// Per-weapon combat identity — shop exclusives differ from class defaults.
struct GunCombatStats: Equatable, Sendable {
    var magCapacity: Int
    var fireInterval: TimeInterval
    var accuracyBloom: Float
    var recoilKick: CGFloat
    var torchFlashDuration: TimeInterval
    var shotDamage: Int
}

/// Named weapon definition (mirrors OperatorProfile / AttachmentCatalog pattern).
struct GunDefinition: Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    let bodyType: GunBodyType
    let blurb: String
    let attachments: [AttachmentSlot: String]
    let premadeSkin: PremadeSkinID
    let stats: GunCombatStats
    let isShopExclusive: Bool
    let shopPrice: Int
    let systemImage: String

    func makeSavedGun(isStarter: Bool) -> SavedGun {
        SavedGun(
            name: name,
            bodyType: bodyType,
            attachments: attachments,
            premadeSkin: premadeSkin,
            isStarter: isStarter
        )
    }
}

/// Free Armory starters + Combat Coin shop exclusives.
enum GunCatalog {
    /// Always free in Armory — never sold in Shop.
    static let base: [GunDefinition] = [
        GunDefinition(
            id: "street_sparrow",
            name: "Street Sparrow",
            bodyType: .pistol,
            blurb: "Compact free sidearm",
            attachments: [
                .optic: "optic_reddot",
                .magazine: "mag_std",
                .muzzle: "muzzle_comp"
            ],
            premadeSkin: .matteBlack,
            stats: GunBodyType.pistol.defaultCombatStats,
            isShopExclusive: false,
            shopPrice: 0,
            systemImage: "bolt.fill"
        ),
        GunDefinition(
            id: "neon_hornet",
            name: "Neon Hornet",
            bodyType: .smg,
            blurb: "Arcade free SMG",
            attachments: [
                .optic: "optic_holo",
                .grip: "grip_vertical",
                .stock: "stock_fold",
                .magazine: "mag_drum",
                .underbarrel: "ub_laser"
            ],
            premadeSkin: .neon,
            stats: GunBodyType.smg.defaultCombatStats,
            isShopExclusive: false,
            shopPrice: 0,
            systemImage: "flame.fill"
        ),
        GunDefinition(
            id: "desert_lance",
            name: "Desert Lance",
            bodyType: .rifle,
            blurb: "Free mid-range rifle",
            attachments: [
                .optic: "optic_scope",
                .muzzle: "muzzle_brake",
                .grip: "grip_angled",
                .stock: "stock_solid",
                .magazine: "mag_extended",
                .underbarrel: "ub_rail"
            ],
            premadeSkin: .desertTan,
            stats: GunBodyType.rifle.defaultCombatStats,
            isShopExclusive: false,
            shopPrice: 0,
            systemImage: "scope"
        ),
        GunDefinition(
            id: "boom_box",
            name: "Boom Box",
            bodyType: .shotgun,
            blurb: "Free room-clear boomstick",
            attachments: [
                .muzzle: "muzzle_flash",
                .stock: "stock_solid",
                .magazine: "mag_std",
                .underbarrel: "ub_light"
            ],
            premadeSkin: .oliveDrab,
            stats: GunBodyType.shotgun.defaultCombatStats,
            isShopExclusive: false,
            shopPrice: 0,
            systemImage: "burst.fill"
        ),
        GunDefinition(
            id: "glass_needle",
            name: "Glass Needle",
            bodyType: .sniper,
            blurb: "Free long-glass starter",
            attachments: [
                .optic: "optic_scope",
                .muzzle: "muzzle_brake",
                .stock: "stock_solid",
                .magazine: "mag_std",
                .underbarrel: "ub_bipod"
            ],
            premadeSkin: .arcticWhite,
            stats: GunBodyType.sniper.defaultCombatStats,
            isShopExclusive: false,
            shopPrice: 0,
            systemImage: "dot.scope"
        )
    ]

    /// Shop-only weapons — distinct stats/identity, not starter attachment clones.
    static let shopExclusive: [GunDefinition] = [
        // Pistols
        GunDefinition(
            id: "velvet_spike",
            name: "Velvet Spike",
            bodyType: .pistol,
            blurb: "Needle-fast pocket iron — low mag, snappy cadence",
            attachments: [
                .optic: "optic_reddot",
                .muzzle: "muzzle_comp",
                .magazine: "mag_std"
            ],
            premadeSkin: .chrome,
            stats: GunCombatStats(
                magCapacity: 12,
                fireInterval: 0.16,
                accuracyBloom: 0.022,
                recoilKick: 8,
                torchFlashDuration: 0.04,
                shotDamage: 1
            ),
            isShopExclusive: true,
            shopPrice: 90,
            systemImage: "bolt.fill"
        ),
        GunDefinition(
            id: "chrome_warden",
            name: "Chrome Warden",
            bodyType: .pistol,
            blurb: "Heavy chrome slugger — slower, harder hits",
            attachments: [
                .muzzle: "muzzle_brake",
                .magazine: "mag_extended",
                .grip: "grip_vertical"
            ],
            premadeSkin: .chrome,
            stats: GunCombatStats(
                magCapacity: 10,
                fireInterval: 0.28,
                accuracyBloom: 0.016,
                recoilKick: 16,
                torchFlashDuration: 0.07,
                shotDamage: 2
            ),
            isShopExclusive: true,
            shopPrice: 110,
            systemImage: "shield.lefthalf.filled"
        ),
        GunDefinition(
            id: "pocket_riot",
            name: "Pocket Riot",
            bodyType: .pistol,
            blurb: "Spray-happy sidearm — fat mag, wild bloom",
            attachments: [
                .optic: "optic_holo",
                .muzzle: "muzzle_flash",
                .magazine: "mag_drum",
                .underbarrel: "ub_laser"
            ],
            premadeSkin: .neon,
            stats: GunCombatStats(
                magCapacity: 18,
                fireInterval: 0.14,
                accuracyBloom: 0.048,
                recoilKick: 7,
                torchFlashDuration: 0.035,
                shotDamage: 1
            ),
            isShopExclusive: true,
            shopPrice: 100,
            systemImage: "flame.fill"
        ),
        // SMGs
        GunDefinition(
            id: "razor_cicada",
            name: "Razor Cicada",
            bodyType: .smg,
            blurb: "Hyper-cycle SMG — blistering rate, wide spray",
            attachments: [
                .optic: "optic_reddot",
                .grip: "grip_angled",
                .stock: "stock_fold",
                .magazine: "mag_std",
                .muzzle: "muzzle_comp"
            ],
            premadeSkin: .matteBlack,
            stats: GunCombatStats(
                magCapacity: 28,
                fireInterval: 0.042,
                accuracyBloom: 0.095,
                recoilKick: 4,
                torchFlashDuration: 0.03,
                shotDamage: 1
            ),
            isShopExclusive: true,
            shopPrice: 130,
            systemImage: "bolt.horizontal.fill"
        ),
        GunDefinition(
            id: "smoke_rattle",
            name: "Smoke Rattle",
            bodyType: .smg,
            blurb: "Controlled SMG — tighter bloom, deeper drum",
            attachments: [
                .optic: "optic_holo",
                .grip: "grip_vertical",
                .stock: "stock_solid",
                .magazine: "mag_drum",
                .muzzle: "muzzle_brake",
                .underbarrel: "ub_light"
            ],
            premadeSkin: .digitalCamo,
            stats: GunCombatStats(
                magCapacity: 40,
                fireInterval: 0.068,
                accuracyBloom: 0.048,
                recoilKick: 6,
                torchFlashDuration: 0.04,
                shotDamage: 1
            ),
            isShopExclusive: true,
            shopPrice: 145,
            systemImage: "smoke.fill"
        ),
        GunDefinition(
            id: "grid_viper",
            name: "Grid Viper",
            bodyType: .smg,
            blurb: "Neon grid SMG — laser-lean CQB predator",
            attachments: [
                .optic: "optic_holo",
                .grip: "grip_angled",
                .stock: "stock_fold",
                .magazine: "mag_extended",
                .underbarrel: "ub_laser",
                .muzzle: "muzzle_flash"
            ],
            premadeSkin: .neon,
            stats: GunCombatStats(
                magCapacity: 32,
                fireInterval: 0.05,
                accuracyBloom: 0.062,
                recoilKick: 5,
                torchFlashDuration: 0.032,
                shotDamage: 1
            ),
            isShopExclusive: true,
            shopPrice: 155,
            systemImage: "sparkles"
        ),
        // Rifles
        GunDefinition(
            id: "ash_vanguard",
            name: "Ash Vanguard",
            bodyType: .rifle,
            blurb: "Ash-gray battle rifle — snappy mid-lane workhorse",
            attachments: [
                .optic: "optic_holo",
                .muzzle: "muzzle_comp",
                .grip: "grip_vertical",
                .stock: "stock_solid",
                .magazine: "mag_std",
                .underbarrel: "ub_rail"
            ],
            premadeSkin: .matteBlack,
            stats: GunCombatStats(
                magCapacity: 28,
                fireInterval: 0.125,
                accuracyBloom: 0.015,
                recoilKick: 12,
                torchFlashDuration: 0.055,
                shotDamage: 2
            ),
            isShopExclusive: true,
            shopPrice: 160,
            systemImage: "scope"
        ),
        GunDefinition(
            id: "cobalt_marauder",
            name: "Cobalt Marauder",
            bodyType: .rifle,
            blurb: "Hard-hitting cobalt rifle — slower cadence, heavier punch",
            attachments: [
                .optic: "optic_scope",
                .muzzle: "muzzle_brake",
                .grip: "grip_angled",
                .stock: "stock_solid",
                .magazine: "mag_extended",
                .underbarrel: "ub_bipod"
            ],
            premadeSkin: .arcticWhite,
            stats: GunCombatStats(
                magCapacity: 24,
                fireInterval: 0.18,
                accuracyBloom: 0.01,
                recoilKick: 18,
                torchFlashDuration: 0.08,
                shotDamage: 3
            ),
            isShopExclusive: true,
            shopPrice: 175,
            systemImage: "target"
        ),
        GunDefinition(
            id: "kestrel_pulse",
            name: "KESTREL Pulse",
            bodyType: .rifle,
            blurb: "Task Force pulse rifle — high mag, confident mid fire",
            attachments: [
                .optic: "optic_holo",
                .muzzle: "muzzle_flash",
                .grip: "grip_vertical",
                .stock: "stock_fold",
                .magazine: "mag_drum",
                .underbarrel: "ub_laser"
            ],
            premadeSkin: .desertTan,
            stats: GunCombatStats(
                magCapacity: 36,
                fireInterval: 0.12,
                accuracyBloom: 0.02,
                recoilKick: 13,
                torchFlashDuration: 0.05,
                shotDamage: 2
            ),
            isShopExclusive: true,
            shopPrice: 185,
            systemImage: "antenna.radiowaves.left.and.right"
        ),
        // Machine guns
        GunDefinition(
            id: "beltstorm",
            name: "Beltstorm",
            bodyType: .machineGun,
            blurb: "Deep-belt MG — volume fire, loose bloom",
            attachments: [
                .optic: "optic_reddot",
                .muzzle: "muzzle_brake",
                .grip: "grip_vertical",
                .stock: "stock_solid",
                .magazine: "mag_drum",
                .underbarrel: "ub_bipod"
            ],
            premadeSkin: .digitalCamo,
            stats: GunCombatStats(
                magCapacity: 130,
                fireInterval: 0.062,
                accuracyBloom: 0.07,
                recoilKick: 7,
                torchFlashDuration: 0.035,
                shotDamage: 1
            ),
            isShopExclusive: true,
            shopPrice: 190,
            systemImage: "line.3.horizontal.decrease"
        ),
        GunDefinition(
            id: "helix_avalanche",
            name: "Helix Avalanche",
            bodyType: .machineGun,
            blurb: "Helix-fed MG — tighter cone, steadier belt",
            attachments: [
                .optic: "optic_holo",
                .muzzle: "muzzle_comp",
                .grip: "grip_angled",
                .stock: "stock_solid",
                .magazine: "mag_drum",
                .underbarrel: "ub_rail"
            ],
            premadeSkin: .oliveDrab,
            stats: GunCombatStats(
                magCapacity: 95,
                fireInterval: 0.078,
                accuracyBloom: 0.042,
                recoilKick: 9,
                torchFlashDuration: 0.04,
                shotDamage: 1
            ),
            isShopExclusive: true,
            shopPrice: 205,
            systemImage: "circle.circle"
        ),
        GunDefinition(
            id: "furnace_rail",
            name: "Furnace Rail",
            bodyType: .machineGun,
            blurb: "Slow-rail MG — fewer rounds, bruising hits",
            attachments: [
                .optic: "optic_scope",
                .muzzle: "muzzle_brake",
                .grip: "grip_vertical",
                .stock: "stock_solid",
                .magazine: "mag_extended",
                .underbarrel: "ub_bipod"
            ],
            premadeSkin: .matteBlack,
            stats: GunCombatStats(
                magCapacity: 75,
                fireInterval: 0.095,
                accuracyBloom: 0.035,
                recoilKick: 11,
                torchFlashDuration: 0.055,
                shotDamage: 2
            ),
            isShopExclusive: true,
            shopPrice: 215,
            systemImage: "flame"
        ),
        // Snipers
        GunDefinition(
            id: "glass_oracle",
            name: "Glass Oracle",
            bodyType: .sniper,
            blurb: "Crystal long-glass — quicker cycle, six in the tube",
            attachments: [
                .optic: "optic_scope",
                .muzzle: "muzzle_comp",
                .stock: "stock_solid",
                .magazine: "mag_extended",
                .underbarrel: "ub_bipod"
            ],
            premadeSkin: .arcticWhite,
            stats: GunCombatStats(
                magCapacity: 6,
                fireInterval: 0.92,
                accuracyBloom: 0.001,
                recoilKick: 28,
                torchFlashDuration: 0.1,
                shotDamage: 4
            ),
            isShopExclusive: true,
            shopPrice: 180,
            systemImage: "dot.scope"
        ),
        GunDefinition(
            id: "longtooth",
            name: "Longtooth",
            bodyType: .sniper,
            blurb: "Heavy pick rifle — brutal damage, glacial cadence",
            attachments: [
                .optic: "optic_scope",
                .muzzle: "muzzle_brake",
                .stock: "stock_solid",
                .magazine: "mag_std",
                .grip: "grip_angled",
                .underbarrel: "ub_bipod"
            ],
            premadeSkin: .gold,
            stats: GunCombatStats(
                magCapacity: 4,
                fireInterval: 1.25,
                accuracyBloom: 0.0004,
                recoilKick: 38,
                torchFlashDuration: 0.14,
                shotDamage: 5
            ),
            isShopExclusive: true,
            shopPrice: 210,
            systemImage: "eye.fill"
        ),
        GunDefinition(
            id: "void_latch",
            name: "Void Latch",
            bodyType: .sniper,
            blurb: "Night-void latch — patient overwatch with neon trim",
            attachments: [
                .optic: "optic_scope",
                .muzzle: "muzzle_flash",
                .stock: "stock_fold",
                .magazine: "mag_extended",
                .underbarrel: "ub_laser"
            ],
            premadeSkin: .neon,
            stats: GunCombatStats(
                magCapacity: 5,
                fireInterval: 1.08,
                accuracyBloom: 0.0012,
                recoilKick: 30,
                torchFlashDuration: 0.11,
                shotDamage: 4
            ),
            isShopExclusive: true,
            shopPrice: 200,
            systemImage: "moon.stars.fill"
        )
    ]

    static let all: [GunDefinition] = base + shopExclusive

    static var freeIDs: Set<String> { Set(base.map(\.id)) }
    static var freeNames: Set<String> { Set(base.map(\.name)) }
    static var shopExclusiveIDs: Set<String> { Set(shopExclusive.map(\.id)) }

    static func definition(id: String) -> GunDefinition? {
        all.first { $0.id == id }
    }

    static func definition(named name: String) -> GunDefinition? {
        all.first { $0.name == name }
    }

    static func stats(forName name: String, bodyType: GunBodyType) -> GunCombatStats {
        definition(named: name)?.stats ?? bodyType.defaultCombatStats
    }

    static func shopItemID(forDefinitionID id: String) -> String {
        "gun_\(id)"
    }
}

// MARK: - Attachment slots

/// Modular slots on a stylized gun body.
enum AttachmentSlot: String, Codable, CaseIterable, Identifiable {
    case optic
    case muzzle
    case grip
    case stock
    case magazine
    case underbarrel

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .optic: return "Optics"
        case .muzzle: return "Muzzle"
        case .grip: return "Grip"
        case .stock: return "Stock"
        case .magazine: return "Magazine"
        case .underbarrel: return "Underbarrel"
        }
    }

    var systemImage: String {
        switch self {
        case .optic: return "scope"
        case .muzzle: return "flame"
        case .grip: return "hand.raised.fill"
        case .stock: return "rectangle.portrait.fill"
        case .magazine: return "rectangle.stack.fill"
        case .underbarrel: return "line.3.horizontal"
        }
    }
}

// MARK: - Catalog attachment pieces

/// A single attachable piece from the toy catalog.
struct AttachmentPart: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let slot: AttachmentSlot
    /// SceneKit node name / geometry key used by GunSceneBuilder.
    let meshKey: String
    /// Arcade-only visual tint (not a finish system).
    let accentHex: String

    var accentColor: Color {
        Color(hex: accentHex) ?? GGGTheme.steel
    }
}

/// Built-in attachment catalog (stylized names only).
enum AttachmentCatalog {
    /// Always free in Build — never sold in Shop.
    static let base: [AttachmentPart] = [
        // Optics
        .init(id: "optic_reddot", name: "Red Dot", slot: .optic, meshKey: "optic_reddot", accentHex: "#FF3B3B"),
        .init(id: "optic_holo", name: "Holo Sight", slot: .optic, meshKey: "optic_holo", accentHex: "#39FF14"),
        .init(id: "optic_scope", name: "Rifle Scope", slot: .optic, meshKey: "optic_scope", accentHex: "#4DA3FF"),
        // Muzzle
        .init(id: "muzzle_brake", name: "Muzzle Brake", slot: .muzzle, meshKey: "muzzle_brake", accentHex: "#B0B0B0"),
        .init(id: "muzzle_flash", name: "Flash Hider", slot: .muzzle, meshKey: "muzzle_flash", accentHex: "#FFAA00"),
        .init(id: "muzzle_comp", name: "Compensator", slot: .muzzle, meshKey: "muzzle_comp", accentHex: "#888888"),
        // Grip
        .init(id: "grip_vertical", name: "Vertical Grip", slot: .grip, meshKey: "grip_vertical", accentHex: "#2A2A2A"),
        .init(id: "grip_angled", name: "Angled Grip", slot: .grip, meshKey: "grip_angled", accentHex: "#3D3D3D"),
        // Stock
        .init(id: "stock_solid", name: "Solid Stock", slot: .stock, meshKey: "stock_solid", accentHex: "#1F1F1F"),
        .init(id: "stock_fold", name: "Folding Stock", slot: .stock, meshKey: "stock_fold", accentHex: "#333333"),
        // Magazine
        .init(id: "mag_std", name: "Standard Mag", slot: .magazine, meshKey: "mag_std", accentHex: "#222222"),
        .init(id: "mag_drum", name: "Drum Mag", slot: .magazine, meshKey: "mag_drum", accentHex: "#444444"),
        .init(id: "mag_extended", name: "Extended Mag", slot: .magazine, meshKey: "mag_extended", accentHex: "#2C2C2C"),
        // Underbarrel
        .init(id: "ub_laser", name: "Laser Module", slot: .underbarrel, meshKey: "ub_laser", accentHex: "#FF00AA"),
        .init(id: "ub_light", name: "Tactical Light", slot: .underbarrel, meshKey: "ub_light", accentHex: "#FFF4B0"),
        .init(id: "ub_rail", name: "Picatinny Rail", slot: .underbarrel, meshKey: "ub_rail", accentHex: "#555555"),
        .init(id: "ub_bipod", name: "Bipod", slot: .underbarrel, meshKey: "ub_bipod", accentHex: "#666666")
    ]

    /// Shop-only parts — distinct IDs/looks; reuse meshKeys for SceneKit.
    static let shopExclusive: [AttachmentPart] = [
        .init(id: "optic_kestrel_reflex", name: "KESTREL Reflex", slot: .optic, meshKey: "optic_reddot", accentHex: "#FFB020"),
        .init(id: "optic_oracle_holo", name: "Oracle Lattice", slot: .optic, meshKey: "optic_holo", accentHex: "#00E5FF"),
        .init(id: "optic_meridian_glass", name: "Meridian Glass", slot: .optic, meshKey: "optic_scope", accentHex: "#D4AF37"),
        .init(id: "muzzle_night_can", name: "Night Can", slot: .muzzle, meshKey: "muzzle_flash", accentHex: "#2A3A4A"),
        .init(id: "muzzle_breach_port", name: "Breach Port", slot: .muzzle, meshKey: "muzzle_brake", accentHex: "#FF6A20"),
        .init(id: "grip_skeleton", name: "Skeleton Grip", slot: .grip, meshKey: "grip_angled", accentHex: "#8B5CFF"),
        .init(id: "grip_stub_ops", name: "Stub Ops Grip", slot: .grip, meshKey: "grip_vertical", accentHex: "#1FA88A"),
        .init(id: "stock_ops_collapse", name: "Ops Collapsible", slot: .stock, meshKey: "stock_fold", accentHex: "#3DFF9A"),
        .init(id: "mag_helix_drum", name: "Helix Drum", slot: .magazine, meshKey: "mag_drum", accentHex: "#39FF14"),
        .init(id: "mag_kestrel_ext", name: "KESTREL Extended", slot: .magazine, meshKey: "mag_extended", accentHex: "#4DA3FF"),
        .init(id: "ub_pulse_laser", name: "Pulse Laser", slot: .underbarrel, meshKey: "ub_laser", accentHex: "#FF2BD6"),
        .init(id: "ub_flare_light", name: "Flare Light", slot: .underbarrel, meshKey: "ub_light", accentHex: "#FFE066"),
        .init(id: "ub_deploy_bipod", name: "Deploy Bipod", slot: .underbarrel, meshKey: "ub_bipod", accentHex: "#9AA4B2")
    ]

    static let all: [AttachmentPart] = base + shopExclusive

    static var baseIDs: Set<String> { Set(base.map(\.id)) }
    static var shopExclusiveIDs: Set<String> { Set(shopExclusive.map(\.id)) }

    static func parts(for slot: AttachmentSlot) -> [AttachmentPart] {
        all.filter { $0.slot == slot }
    }

    static func part(id: String) -> AttachmentPart? {
        all.first { $0.id == id }
    }
}

// MARK: - Premade skins

enum PremadeSkinID: String, Codable, CaseIterable, Identifiable {
    case matteBlack
    case desertTan
    case digitalCamo
    case gold
    case chrome
    case neon
    case arcticWhite
    case oliveDrab

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .matteBlack: return "Matte Black"
        case .desertTan: return "Desert Tan"
        case .digitalCamo: return "Digital Camo"
        case .gold: return "Gold"
        case .chrome: return "Chrome"
        case .neon: return "Neon Pulse"
        case .arcticWhite: return "Arctic White"
        case .oliveDrab: return "Olive Drab"
        }
    }

    /// Primary base color for SceneKit materials.
    var primaryHex: String {
        switch self {
        case .matteBlack: return "#1A1A1A"
        case .desertTan: return "#C2A46B"
        case .digitalCamo: return "#3E5C3A"
        case .gold: return "#D4AF37"
        case .chrome: return "#C8D0D8"
        case .neon: return "#1B0033"
        case .arcticWhite: return "#F0F4F8"
        case .oliveDrab: return "#556B2F"
        }
    }

    var accentHex: String {
        switch self {
        case .matteBlack: return "#39FF14"
        case .desertTan: return "#8B6914"
        case .digitalCamo: return "#A8C686"
        case .gold: return "#FFF1A8"
        case .chrome: return "#FFFFFF"
        case .neon: return "#FF00E5"
        case .arcticWhite: return "#4DA3FF"
        case .oliveDrab: return "#8FBC8F"
        }
    }

    /// Pattern hint consumed by GunSceneBuilder (camo / chrome / solid).
    var pattern: SkinPattern {
        switch self {
        case .digitalCamo: return .camo
        case .chrome: return .metal
        case .gold: return .metal
        case .neon: return .neon
        default: return .solid
        }
    }
}

enum SkinPattern: String, Codable {
    case solid
    case camo
    case metal
    case neon
}

// MARK: - Paint layers

enum PaintTool: String, CaseIterable, Identifiable {
    case spray
    case fill
    case camoStamp

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .spray: return "Spray"
        case .fill: return "Fill"
        case .camoStamp: return "Camo"
        }
    }

    var systemImage: String {
        switch self {
        case .spray: return "paintbrush.pointed.fill"
        case .fill: return "drop.fill"
        case .camoStamp: return "square.grid.3x3.fill"
        }
    }
}

/// Named paintable regions on the toy gun.
enum PaintRegion: String, Codable, CaseIterable, Identifiable {
    case body
    case barrel
    case grip
    case stock
    case attachments

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .body: return "Body"
        case .barrel: return "Barrel"
        case .grip: return "Grip"
        case .stock: return "Stock"
        case .attachments: return "Attachments"
        }
    }
}

/// A single paint stroke / fill stored for a region.
struct PaintStroke: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var region: PaintRegion
    var tool: String
    var colorHex: String
    /// Normalized 0…1 position for spray stamps (ignored for fill).
    var x: Double
    var y: Double
    var size: Double
}
