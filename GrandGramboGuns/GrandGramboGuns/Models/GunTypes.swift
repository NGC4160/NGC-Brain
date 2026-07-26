// GunTypes.swift
// Stylized toy-gun enums and attachment slots.
// Cartoonish / arcade aesthetic — not real firearm data.

import Foundation
import SwiftUI

// MARK: - Base body styles

/// High-level toy body shapes available in Build Gun.
enum GunBodyType: String, Codable, CaseIterable, Identifiable {
    case pistol
    case smg
    case rifle
    case shotgun

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .pistol: return "Pistol"
        case .smg: return "SMG"
        case .rifle: return "Rifle"
        case .shotgun: return "Shotgun"
        }
    }

    /// Short flavor text for the builder UI.
    var blurb: String {
        switch self {
        case .pistol: return "Compact sidearm vibe"
        case .smg: return "Spray-happy arcade blaster"
        case .rifle: return "Long-range toy rifle"
        case .shotgun: return "Wide boomstick energy"
        }
    }

    /// Default mag capacity for arcade Range play (toy numbers only).
    var defaultMagCapacity: Int {
        switch self {
        case .pistol: return 12
        case .smg: return 30
        case .rifle: return 25
        case .shotgun: return 6
        }
    }

    /// Fire rate hint for Range animation timing (shots per second feel).
    var fireInterval: TimeInterval {
        switch self {
        case .pistol: return 0.22
        case .smg: return 0.08
        case .rifle: return 0.14
        case .shotgun: return 0.45
        }
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
    static let all: [AttachmentPart] = [
        // Optics
        .init(id: "optic_reddot", name: "Red Dot", slot: .optic, meshKey: "optic_reddot", accentHex: "#FF3B3B"),
        .init(id: "optic_holo", name: "Holo Box", slot: .optic, meshKey: "optic_holo", accentHex: "#39FF14"),
        .init(id: "optic_scope", name: "Long Scope", slot: .optic, meshKey: "optic_scope", accentHex: "#4DA3FF"),
        // Muzzle
        .init(id: "muzzle_brake", name: "Brake Cap", slot: .muzzle, meshKey: "muzzle_brake", accentHex: "#B0B0B0"),
        .init(id: "muzzle_flash", name: "Flash Cone", slot: .muzzle, meshKey: "muzzle_flash", accentHex: "#FFAA00"),
        .init(id: "muzzle_comp", name: "Comp Tip", slot: .muzzle, meshKey: "muzzle_comp", accentHex: "#888888"),
        // Grip
        .init(id: "grip_vertical", name: "Vert Grip", slot: .grip, meshKey: "grip_vertical", accentHex: "#2A2A2A"),
        .init(id: "grip_angled", name: "Angle Grip", slot: .grip, meshKey: "grip_angled", accentHex: "#3D3D3D"),
        // Stock
        .init(id: "stock_solid", name: "Solid Stock", slot: .stock, meshKey: "stock_solid", accentHex: "#1F1F1F"),
        .init(id: "stock_fold", name: "Fold Stock", slot: .stock, meshKey: "stock_fold", accentHex: "#333333"),
        // Magazine
        .init(id: "mag_std", name: "Std Mag", slot: .magazine, meshKey: "mag_std", accentHex: "#222222"),
        .init(id: "mag_drum", name: "Drum Mag", slot: .magazine, meshKey: "mag_drum", accentHex: "#444444"),
        .init(id: "mag_extended", name: "XL Mag", slot: .magazine, meshKey: "mag_extended", accentHex: "#2C2C2C"),
        // Underbarrel
        .init(id: "ub_laser", name: "Neon Laser", slot: .underbarrel, meshKey: "ub_laser", accentHex: "#FF00AA"),
        .init(id: "ub_light", name: "Tactical Light", slot: .underbarrel, meshKey: "ub_light", accentHex: "#FFF4B0"),
        .init(id: "ub_rail", name: "Rail Block", slot: .underbarrel, meshKey: "ub_rail", accentHex: "#555555")
    ]

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
