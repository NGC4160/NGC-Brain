// ShopCatalog.swift
// Combat Coin shop inventory — guns, attachments/cosmetics, operators.

import Foundation
import SwiftUI

enum ShopCategory: String, CaseIterable, Identifiable, Sendable {
    case guns
    case attachments
    case operators

    var id: String { rawValue }

    var title: String {
        switch self {
        case .guns: return "GUNS"
        case .attachments: return "ATTACHMENTS"
        case .operators: return "OPERATORS"
        }
    }

    var systemImage: String {
        switch self {
        case .guns: return "wrench.and.screwdriver.fill"
        case .attachments: return "paintpalette.fill"
        case .operators: return "person.3.fill"
        }
    }
}

enum ShopItemKind: Equatable, Sendable {
    case gun
    case attachment(partID: String)
    case skin(PremadeSkinID)
    case operatorUnlock(operatorID: String)
    case customSlotPack(extraSlots: Int)
}

struct ShopItem: Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    let blurb: String
    let price: Int
    let category: ShopCategory
    let kind: ShopItemKind
    /// SF Symbol for list row.
    let systemImage: String
}

enum ShopCatalog {
    /// Base premade operators — always free, never sold in Shop.
    static let freeOperatorIDs: Set<String> = OperatorProfile.baseIDs

    /// Base catalog parts always available in Build — never sold in Shop.
    static let freeAttachmentIDs: Set<String> = AttachmentCatalog.baseIDs

    /// Free starter guns — always in Armory, never sold in Shop.
    static let freeGunIDs: Set<String> = GunCatalog.freeIDs
    static let freeGunNames: Set<String> = GunCatalog.freeNames

    /// Premade skins always available.
    static let freeSkinIDs: Set<PremadeSkinID> = [
        .matteBlack, .desertTan, .oliveDrab
    ]

    static let all: [ShopItem] = guns + attachments + operators

    static func items(in category: ShopCategory) -> [ShopItem] {
        all.filter { $0.category == category }
    }

    static func item(id: String) -> ShopItem? {
        all.first { $0.id == id }
    }

    // MARK: - Guns (shop-exclusive only; starters stay free in Armory)

    static let guns: [ShopItem] = GunCatalog.shopExclusive.map { def in
        ShopItem(
            id: GunCatalog.shopItemID(forDefinitionID: def.id),
            name: def.name,
            blurb: def.blurb,
            price: def.shopPrice,
            category: .guns,
            kind: .gun,
            systemImage: def.systemImage
        )
    }

    /// Factory for purchased shop guns (never free starters).
    static func makeGun(forItemID id: String) -> SavedGun? {
        guard id.hasPrefix("gun_") else { return nil }
        let defID = String(id.dropFirst(4))
        guard let def = GunCatalog.definition(id: defID), def.isShopExclusive else { return nil }
        return def.makeSavedGun(isStarter: false)
    }

    static func gunItemID(forGunName name: String) -> String? {
        guard let def = GunCatalog.definition(named: name), def.isShopExclusive else { return nil }
        return GunCatalog.shopItemID(forDefinitionID: def.id)
    }

    // MARK: - Attachments & cosmetics (shop-exclusive parts + premium skins)

    static let attachments: [ShopItem] = [
        ShopItem(
            id: "att_optic_kestrel_reflex",
            name: "KESTREL Reflex",
            blurb: "Amber Task Force optic — shop exclusive",
            price: 55,
            category: .attachments,
            kind: .attachment(partID: "optic_kestrel_reflex"),
            systemImage: "scope"
        ),
        ShopItem(
            id: "att_optic_oracle_holo",
            name: "Oracle Lattice",
            blurb: "Cyan intel holo for Build Gun",
            price: 65,
            category: .attachments,
            kind: .attachment(partID: "optic_oracle_holo"),
            systemImage: "square.grid.3x3"
        ),
        ShopItem(
            id: "att_optic_meridian_glass",
            name: "Meridian Glass",
            blurb: "Gold long-glass for Meridian ops",
            price: 85,
            category: .attachments,
            kind: .attachment(partID: "optic_meridian_glass"),
            systemImage: "dot.scope"
        ),
        ShopItem(
            id: "att_muzzle_night_can",
            name: "Night Can",
            blurb: "Dark muzzle can for night pushes",
            price: 55,
            category: .attachments,
            kind: .attachment(partID: "muzzle_night_can"),
            systemImage: "moon.fill"
        ),
        ShopItem(
            id: "att_muzzle_breach_port",
            name: "Breach Port",
            blurb: "Orange-port muzzle for door work",
            price: 50,
            category: .attachments,
            kind: .attachment(partID: "muzzle_breach_port"),
            systemImage: "flame"
        ),
        ShopItem(
            id: "att_grip_skeleton",
            name: "Skeleton Grip",
            blurb: "Violet skeletal grip style",
            price: 45,
            category: .attachments,
            kind: .attachment(partID: "grip_skeleton"),
            systemImage: "hand.raised.fill"
        ),
        ShopItem(
            id: "att_grip_stub_ops",
            name: "Stub Ops Grip",
            blurb: "Teal stub grip for CQB kits",
            price: 40,
            category: .attachments,
            kind: .attachment(partID: "grip_stub_ops"),
            systemImage: "hand.point.up.left.fill"
        ),
        ShopItem(
            id: "att_stock_ops_collapse",
            name: "Ops Collapsible",
            blurb: "Neon-trim folding stock",
            price: 60,
            category: .attachments,
            kind: .attachment(partID: "stock_ops_collapse"),
            systemImage: "rectangle.portrait.fill"
        ),
        ShopItem(
            id: "att_mag_helix_drum",
            name: "Helix Drum",
            blurb: "High-cap helix drum magazine",
            price: 80,
            category: .attachments,
            kind: .attachment(partID: "mag_helix_drum"),
            systemImage: "circle.circle"
        ),
        ShopItem(
            id: "att_mag_kestrel_ext",
            name: "KESTREL Extended",
            blurb: "Task Force extended mag",
            price: 70,
            category: .attachments,
            kind: .attachment(partID: "mag_kestrel_ext"),
            systemImage: "rectangle.stack.fill"
        ),
        ShopItem(
            id: "att_ub_pulse_laser",
            name: "Pulse Laser",
            blurb: "Hot-pink underbarrel pulse laser",
            price: 75,
            category: .attachments,
            kind: .attachment(partID: "ub_pulse_laser"),
            systemImage: "light.min"
        ),
        ShopItem(
            id: "att_ub_flare_light",
            name: "Flare Light",
            blurb: "Amber flare underbarrel light",
            price: 55,
            category: .attachments,
            kind: .attachment(partID: "ub_flare_light"),
            systemImage: "flashlight.on.fill"
        ),
        ShopItem(
            id: "att_ub_deploy_bipod",
            name: "Deploy Bipod",
            blurb: "Steel deploy bipod for prone work",
            price: 90,
            category: .attachments,
            kind: .attachment(partID: "ub_deploy_bipod"),
            systemImage: "line.3.horizontal"
        ),
        ShopItem(
            id: "skin_digital_camo",
            name: "Digital Camo Pack",
            blurb: "Premade finish for Skins",
            price: 60,
            category: .attachments,
            kind: .skin(.digitalCamo),
            systemImage: "square.grid.3x3.fill"
        ),
        ShopItem(
            id: "skin_arctic_white",
            name: "Arctic White Pack",
            blurb: "Premade finish for Skins",
            price: 50,
            category: .attachments,
            kind: .skin(.arcticWhite),
            systemImage: "snowflake"
        ),
        ShopItem(
            id: "skin_chrome",
            name: "Chrome Pack",
            blurb: "Mirror metal finish",
            price: 70,
            category: .attachments,
            kind: .skin(.chrome),
            systemImage: "circle.hexagongrid.fill"
        ),
        ShopItem(
            id: "skin_gold",
            name: "Gold Pack",
            blurb: "Showpiece metal finish",
            price: 90,
            category: .attachments,
            kind: .skin(.gold),
            systemImage: "star.fill"
        ),
        ShopItem(
            id: "skin_neon",
            name: "Neon Pulse Pack",
            blurb: "Arcade neon finish",
            price: 100,
            category: .attachments,
            kind: .skin(.neon),
            systemImage: "sparkles"
        )
    ]

    // MARK: - Operators (shop-exclusive only; base roster is free)

    static let operators: [ShopItem] = [
        ShopItem(
            id: "op_nyx",
            name: "NYX",
            blurb: "Infil — midnight dual-mask SWAT, fastest feet",
            price: 140,
            category: .operators,
            kind: .operatorUnlock(operatorID: "nyx"),
            systemImage: "moon.stars.fill"
        ),
        ShopItem(
            id: "op_echo",
            name: "ECHO",
            blurb: "Comms — teal soft kit, radio pack, cyan IR",
            price: 130,
            category: .operators,
            kind: .operatorUnlock(operatorID: "echo"),
            systemImage: "antenna.radiowaves.left.and.right"
        ),
        ShopItem(
            id: "op_solstice",
            name: "SOLSTICE",
            blurb: "Patrol — sand plate, amber visor, desert IR",
            price: 150,
            category: .operators,
            kind: .operatorUnlock(operatorID: "solstice"),
            systemImage: "sun.max.fill"
        ),
        ShopItem(
            id: "op_havoc",
            name: "HAVOC",
            blurb: "Demo — hazard-orange breach plates, max armor",
            price: 180,
            category: .operators,
            kind: .operatorUnlock(operatorID: "havoc"),
            systemImage: "flame.fill"
        ),
        ShopItem(
            id: "op_talon",
            name: "TALON",
            blurb: "Marksman — forest drab, gold IR overwatch",
            price: 170,
            category: .operators,
            kind: .operatorUnlock(operatorID: "talon"),
            systemImage: "scope"
        ),
        ShopItem(
            id: "op_circe",
            name: "CIRCE",
            blurb: "Disruptor — plum kit, bone helm, magenta IR",
            price: 200,
            category: .operators,
            kind: .operatorUnlock(operatorID: "circe"),
            systemImage: "bolt.horizontal.fill"
        ),
        ShopItem(
            id: "op_anvil",
            name: "ANVIL",
            blurb: "Breach — steel plates, bronze helm, door-kicker",
            price: 220,
            category: .operators,
            kind: .operatorUnlock(operatorID: "anvil"),
            systemImage: "shield.fill"
        ),
        ShopItem(
            id: "roster_slots_2",
            name: "Roster Expand +2",
            blurb: "Two extra custom operator slots",
            price: 120,
            category: .operators,
            kind: .customSlotPack(extraSlots: 2),
            systemImage: "person.badge.plus"
        ),
        ShopItem(
            id: "roster_slots_2b",
            name: "Roster Expand +2 (II)",
            blurb: "Another two custom slots",
            price: 180,
            category: .operators,
            kind: .customSlotPack(extraSlots: 2),
            systemImage: "person.badge.plus"
        )
    ]

    static func operatorShopID(forOperatorID id: String) -> String? {
        operators.first {
            if case .operatorUnlock(let oid) = $0.kind { return oid == id }
            return false
        }?.id
    }

    static func attachmentShopID(forPartID partID: String) -> String? {
        attachments.first {
            if case .attachment(let pid) = $0.kind { return pid == partID }
            return false
        }?.id
    }

    static func skinShopID(for skin: PremadeSkinID) -> String? {
        attachments.first {
            if case .skin(let s) = $0.kind { return s == skin }
            return false
        }?.id
    }
}
