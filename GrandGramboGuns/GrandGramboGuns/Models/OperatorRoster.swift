// OperatorRoster.swift
// Premade + custom Task Force KESTREL operators for Story Mode.

import Foundation
import SwiftUI
import UIKit

/// Visual kit for the third-person player mesh + UI accents.
/// SWAT / special-forces silhouette: dark plate carriers, helmets, masks, unit patches.
struct OperatorAppearance: Hashable, Codable, Equatable {
    var suitR: Double
    var suitG: Double
    var suitB: Double
    var pantsR: Double
    var pantsG: Double
    var pantsB: Double
    var helmetR: Double
    var helmetG: Double
    var helmetB: Double
    var skinR: Double
    var skinG: Double
    var skinB: Double
    var accentR: Double
    var accentG: Double
    var accentB: Double
    var hasShoulderPads: Bool
    var hasVisor: Bool
    var hasMedicCross: Bool
    var bulkyTorso: Bool
    /// Lower-face balaclava / ski mask (CQB / night ops).
    var hasBalaclava: Bool
    /// Comms earpiece + boom mic on helmet.
    var hasHeadset: Bool
    /// Knee plate armor.
    var hasKneePads: Bool
    /// Forearm hard plates.
    var hasArmGuards: Bool
    /// Shoulder unit / IR patch.
    var hasUnitPatch: Bool
    /// Short kit identity line for Characters UI (e.g. "OD plate · FAST helm").
    var gearNotes: String

    var suit: UIColor { UIColor(red: suitR, green: suitG, blue: suitB, alpha: 1) }
    var pants: UIColor { UIColor(red: pantsR, green: pantsG, blue: pantsB, alpha: 1) }
    var helmet: UIColor { UIColor(red: helmetR, green: helmetG, blue: helmetB, alpha: 1) }
    var skin: UIColor { UIColor(red: skinR, green: skinG, blue: skinB, alpha: 1) }
    var accentUIColor: UIColor { UIColor(red: accentR, green: accentG, blue: accentB, alpha: 1) }
    var accentColor: Color { Color(red: accentR, green: accentG, blue: accentB) }

    /// Dark plate-carrier tone derived from suit (reads as SWAT armor, not neon).
    var plateCarrier: UIColor {
        UIColor(
            red: max(0, suitR * 0.55),
            green: max(0, suitG * 0.55),
            blue: max(0, suitB * 0.55),
            alpha: 1
        )
    }

    static func rgb(_ r: Double, _ g: Double, _ b: Double) -> (Double, Double, Double) { (r, g, b) }

    static func make(
        suit: (Double, Double, Double),
        pants: (Double, Double, Double),
        helmet: (Double, Double, Double),
        skin: (Double, Double, Double),
        accent: (Double, Double, Double),
        hasShoulderPads: Bool = false,
        hasVisor: Bool = false,
        hasMedicCross: Bool = false,
        bulkyTorso: Bool = false,
        hasBalaclava: Bool = false,
        hasHeadset: Bool = false,
        hasKneePads: Bool = false,
        hasArmGuards: Bool = false,
        hasUnitPatch: Bool = false,
        gearNotes: String = ""
    ) -> OperatorAppearance {
        OperatorAppearance(
            suitR: suit.0, suitG: suit.1, suitB: suit.2,
            pantsR: pants.0, pantsG: pants.1, pantsB: pants.2,
            helmetR: helmet.0, helmetG: helmet.1, helmetB: helmet.2,
            skinR: skin.0, skinG: skin.1, skinB: skin.2,
            accentR: accent.0, accentG: accent.1, accentB: accent.2,
            hasShoulderPads: hasShoulderPads,
            hasVisor: hasVisor,
            hasMedicCross: hasMedicCross,
            bulkyTorso: bulkyTorso,
            hasBalaclava: hasBalaclava,
            hasHeadset: hasHeadset,
            hasKneePads: hasKneePads,
            hasArmGuards: hasArmGuards,
            hasUnitPatch: hasUnitPatch,
            gearNotes: gearNotes
        )
    }

    /// Default custom template — charcoal SWAT plate kit with muted IR green.
    static let starterCustom = OperatorAppearance.make(
        suit: (0.10, 0.11, 0.13),
        pants: (0.07, 0.07, 0.09),
        helmet: (0.12, 0.13, 0.15),
        skin: (0.52, 0.40, 0.32),
        accent: (0.28, 0.62, 0.42),
        hasHeadset: true,
        hasUnitPatch: true,
        gearNotes: "Charcoal plate · comms · IR patch"
    )

    enum CodingKeys: String, CodingKey {
        case suitR, suitG, suitB, pantsR, pantsG, pantsB
        case helmetR, helmetG, helmetB, skinR, skinG, skinB
        case accentR, accentG, accentB
        case hasShoulderPads, hasVisor, hasMedicCross, bulkyTorso
        case hasBalaclava, hasHeadset, hasKneePads, hasArmGuards, hasUnitPatch
        case gearNotes
    }

    init(
        suitR: Double, suitG: Double, suitB: Double,
        pantsR: Double, pantsG: Double, pantsB: Double,
        helmetR: Double, helmetG: Double, helmetB: Double,
        skinR: Double, skinG: Double, skinB: Double,
        accentR: Double, accentG: Double, accentB: Double,
        hasShoulderPads: Bool, hasVisor: Bool, hasMedicCross: Bool, bulkyTorso: Bool,
        hasBalaclava: Bool, hasHeadset: Bool, hasKneePads: Bool, hasArmGuards: Bool, hasUnitPatch: Bool,
        gearNotes: String
    ) {
        self.suitR = suitR; self.suitG = suitG; self.suitB = suitB
        self.pantsR = pantsR; self.pantsG = pantsG; self.pantsB = pantsB
        self.helmetR = helmetR; self.helmetG = helmetG; self.helmetB = helmetB
        self.skinR = skinR; self.skinG = skinG; self.skinB = skinB
        self.accentR = accentR; self.accentG = accentG; self.accentB = accentB
        self.hasShoulderPads = hasShoulderPads
        self.hasVisor = hasVisor
        self.hasMedicCross = hasMedicCross
        self.bulkyTorso = bulkyTorso
        self.hasBalaclava = hasBalaclava
        self.hasHeadset = hasHeadset
        self.hasKneePads = hasKneePads
        self.hasArmGuards = hasArmGuards
        self.hasUnitPatch = hasUnitPatch
        self.gearNotes = gearNotes
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        suitR = try c.decode(Double.self, forKey: .suitR)
        suitG = try c.decode(Double.self, forKey: .suitG)
        suitB = try c.decode(Double.self, forKey: .suitB)
        pantsR = try c.decode(Double.self, forKey: .pantsR)
        pantsG = try c.decode(Double.self, forKey: .pantsG)
        pantsB = try c.decode(Double.self, forKey: .pantsB)
        helmetR = try c.decode(Double.self, forKey: .helmetR)
        helmetG = try c.decode(Double.self, forKey: .helmetG)
        helmetB = try c.decode(Double.self, forKey: .helmetB)
        skinR = try c.decode(Double.self, forKey: .skinR)
        skinG = try c.decode(Double.self, forKey: .skinG)
        skinB = try c.decode(Double.self, forKey: .skinB)
        accentR = try c.decode(Double.self, forKey: .accentR)
        accentG = try c.decode(Double.self, forKey: .accentG)
        accentB = try c.decode(Double.self, forKey: .accentB)
        hasShoulderPads = try c.decodeIfPresent(Bool.self, forKey: .hasShoulderPads) ?? false
        hasVisor = try c.decodeIfPresent(Bool.self, forKey: .hasVisor) ?? false
        hasMedicCross = try c.decodeIfPresent(Bool.self, forKey: .hasMedicCross) ?? false
        bulkyTorso = try c.decodeIfPresent(Bool.self, forKey: .bulkyTorso) ?? false
        hasBalaclava = try c.decodeIfPresent(Bool.self, forKey: .hasBalaclava) ?? false
        hasHeadset = try c.decodeIfPresent(Bool.self, forKey: .hasHeadset) ?? false
        hasKneePads = try c.decodeIfPresent(Bool.self, forKey: .hasKneePads) ?? false
        hasArmGuards = try c.decodeIfPresent(Bool.self, forKey: .hasArmGuards) ?? false
        hasUnitPatch = try c.decodeIfPresent(Bool.self, forKey: .hasUnitPatch) ?? false
        gearNotes = try c.decodeIfPresent(String.self, forKey: .gearNotes) ?? ""
    }
}

/// TTS / VO gender for operators (AVSpeechSynthesisVoice selection).
enum OperatorVoiceGender: String, Codable, CaseIterable, Identifiable, Hashable {
    case female
    case male
    case neutral

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .female: return "Female"
        case .male: return "Male"
        case .neutral: return "Neutral"
        }
    }

    /// Premade callsigns / IDs — match case-insensitively (REINA, Reina, reina).
    static func inferred(from nameOrID: String) -> OperatorVoiceGender {
        let key = nameOrID.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        switch key {
        case "reina", "vesper", "wraith", "nyx", "echo", "circe": return .female
        case "grambo", "brick", "ghost", "havoc", "talon", "anvil": return .male
        case "solstice": return .neutral
        default: return .neutral
        }
    }

    /// Resolve gender for a dialogue speaker (operator callsign, resolved `{OPERATOR}`, or NPC).
    static func forSpeaker(
        _ speaker: String,
        faction: StorySpeakerFaction,
        explicitOperatorGender: OperatorVoiceGender? = nil
    ) -> OperatorVoiceGender {
        let upper = speaker.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let femaleNames = ["REINA", "VESPER", "WRAITH", "NYX", "ECHO", "CIRCE"]
        let maleNames = ["GRAMBO", "BRICK", "GHOST", "HAVOC", "TALON", "ANVIL"]
        if femaleNames.contains(where: { upper == $0 || upper.split(separator: " ").map(String.init).contains($0) }) {
            return .female
        }
        if maleNames.contains(where: { upper == $0 || upper.split(separator: " ").map(String.init).contains($0) }) {
            return .male
        }

        if faction == .operatorSelf {
            return explicitOperatorGender ?? inferred(from: upper)
        }

        // Non-operator defaults: command / hostiles / Oracle — male-leaning firm; system — neutral.
        switch faction {
        case .kestrel, .overwatch, .meridian, .oracle:
            return .male
        case .system, .operatorSelf:
            return .neutral
        }
    }
}

enum OperatorLook: String, CaseIterable, Identifiable {
    case grambo
    case vesper
    case brick
    case ghost
    case reina
    case wraith
    // Shop-exclusive looks
    case nyx
    case havoc
    case echo
    case talon
    case circe
    case anvil
    case solstice

    var id: String { rawValue }

    var voiceGender: OperatorVoiceGender {
        OperatorVoiceGender.inferred(from: rawValue)
    }

    var appearance: OperatorAppearance {
        switch self {
        case .grambo:
            // OD green plate carrier, matte black FAST helm, KESTREL IR green.
            return .make(
                suit: (0.11, 0.14, 0.11),
                pants: (0.08, 0.09, 0.08),
                helmet: (0.10, 0.10, 0.11),
                skin: (0.50, 0.40, 0.32),
                accent: (0.32, 0.58, 0.38),
                hasHeadset: true,
                hasUnitPatch: true,
                gearNotes: "OD plate · FAST helm · IR green patch"
            )
        case .vesper:
            // Midnight navy scout — slim, blue visor strip, boom mic.
            return .make(
                suit: (0.09, 0.11, 0.18),
                pants: (0.06, 0.07, 0.12),
                helmet: (0.10, 0.13, 0.22),
                skin: (0.60, 0.46, 0.36),
                accent: (0.35, 0.52, 0.78),
                hasVisor: true,
                hasHeadset: true,
                hasArmGuards: true,
                gearNotes: "Navy soft-armor · blue visor · scout mic"
            )
        case .brick:
            // Coyote heavy — tan plates, burnt-orange IR, full breach silhouette.
            return .make(
                suit: (0.28, 0.24, 0.18),
                pants: (0.18, 0.16, 0.12),
                helmet: (0.34, 0.28, 0.20),
                skin: (0.42, 0.32, 0.26),
                accent: (0.78, 0.42, 0.18),
                hasShoulderPads: true,
                bulkyTorso: true,
                hasKneePads: true,
                hasArmGuards: true,
                hasUnitPatch: true,
                gearNotes: "Coyote heavy · pads · orange IR"
            )
        case .ghost:
            // Ash night kit — light plates over charcoal, cold gray accents.
            return .make(
                suit: (0.62, 0.64, 0.68),
                pants: (0.14, 0.14, 0.16),
                helmet: (0.72, 0.74, 0.78),
                skin: (0.52, 0.42, 0.36),
                accent: (0.58, 0.60, 0.66),
                hasShoulderPads: true,
                hasVisor: true,
                hasBalaclava: true,
                hasHeadset: true,
                gearNotes: "Ash night kit · mask · gray visor"
            )
        case .reina:
            // Black medic SWAT — crimson helm stripe, white cross, headset.
            return .make(
                suit: (0.11, 0.10, 0.11),
                pants: (0.08, 0.08, 0.09),
                helmet: (0.42, 0.10, 0.12),
                skin: (0.56, 0.42, 0.34),
                accent: (0.82, 0.22, 0.26),
                hasMedicCross: true,
                hasHeadset: true,
                hasKneePads: true,
                hasUnitPatch: true,
                gearNotes: "Black medic · crimson helm · white cross"
            )
        case .wraith:
            // Void CQB — near-black with subdued violet, balaclava + visor.
            return .make(
                suit: (0.08, 0.07, 0.11),
                pants: (0.06, 0.05, 0.08),
                helmet: (0.14, 0.09, 0.20),
                skin: (0.44, 0.36, 0.33),
                accent: (0.48, 0.28, 0.68),
                hasVisor: true,
                hasBalaclava: true,
                hasArmGuards: true,
                gearNotes: "Void CQB · balaclava · violet IR"
            )
        case .nyx:
            // Midnight infil — deepest indigo, violet IR, full mask stack.
            return .make(
                suit: (0.05, 0.05, 0.10),
                pants: (0.03, 0.03, 0.07),
                helmet: (0.09, 0.07, 0.16),
                skin: (0.46, 0.34, 0.28),
                accent: (0.55, 0.32, 0.82),
                hasVisor: true,
                hasBalaclava: true,
                hasHeadset: true,
                hasArmGuards: true,
                gearNotes: "Midnight infil · dual-mask · indigo IR"
            )
        case .havoc:
            // Demo breach — charcoal + hazard-orange plates, max armor.
            return .make(
                suit: (0.16, 0.09, 0.07),
                pants: (0.10, 0.07, 0.06),
                helmet: (0.28, 0.14, 0.08),
                skin: (0.48, 0.36, 0.28),
                accent: (0.88, 0.40, 0.12),
                hasShoulderPads: true,
                bulkyTorso: true,
                hasKneePads: true,
                hasArmGuards: true,
                hasUnitPatch: true,
                gearNotes: "Demo plates · hazard orange · knee armor"
            )
        case .echo:
            // Comms netrunner — dark teal soft kit, cyan IR, radio + mic.
            return .make(
                suit: (0.07, 0.14, 0.16),
                pants: (0.05, 0.09, 0.11),
                helmet: (0.08, 0.18, 0.22),
                skin: (0.58, 0.44, 0.36),
                accent: (0.22, 0.72, 0.68),
                hasVisor: true,
                hasHeadset: true,
                hasUnitPatch: true,
                gearNotes: "Teal soft kit · radio pack · cyan IR"
            )
        case .talon:
            // Overwatch marksman — forest drab, muted gold chevron.
            return .make(
                suit: (0.12, 0.16, 0.10),
                pants: (0.08, 0.11, 0.07),
                helmet: (0.16, 0.20, 0.12),
                skin: (0.42, 0.32, 0.24),
                accent: (0.78, 0.66, 0.28),
                hasShoulderPads: true,
                hasHeadset: true,
                hasKneePads: true,
                hasUnitPatch: true,
                gearNotes: "Forest drab · gold chevron · overwatch"
            )
        case .circe:
            // Disruptor — plum soft armor, bone-white helm, magenta accent.
            return .make(
                suit: (0.16, 0.07, 0.14),
                pants: (0.10, 0.05, 0.09),
                helmet: (0.78, 0.78, 0.82),
                skin: (0.62, 0.46, 0.38),
                accent: (0.85, 0.28, 0.58),
                hasVisor: true,
                hasBalaclava: true,
                hasArmGuards: true,
                gearNotes: "Plum soft kit · bone helm · magenta IR"
            )
        case .anvil:
            // Steel door-kicker — blue-gray plates, bronze helm, max breach kit.
            return .make(
                suit: (0.14, 0.16, 0.20),
                pants: (0.10, 0.11, 0.14),
                helmet: (0.38, 0.28, 0.16),
                skin: (0.38, 0.28, 0.22),
                accent: (0.68, 0.48, 0.26),
                hasShoulderPads: true,
                bulkyTorso: true,
                hasKneePads: true,
                hasArmGuards: true,
                hasUnitPatch: true,
                gearNotes: "Steel plates · bronze helm · breach pads"
            )
        case .solstice:
            // Desert patrol — sand plate, amber visor, sun IR.
            return .make(
                suit: (0.34, 0.28, 0.18),
                pants: (0.22, 0.18, 0.12),
                helmet: (0.42, 0.34, 0.20),
                skin: (0.64, 0.50, 0.38),
                accent: (0.86, 0.62, 0.22),
                hasVisor: true,
                hasHeadset: true,
                hasKneePads: true,
                hasUnitPatch: true,
                gearNotes: "Sand plate · amber visor · desert IR"
            )
        }
    }
}

struct OperatorProfile: Identifiable, Hashable {
    let id: String
    let callsign: String
    let role: String
    let bio: String
    let accent: Color
    let look: OperatorAppearance
    let moveSpeedMultiplier: Float
    let maxHealth: Double
    let damageTakenMultiplier: Double
    let medkitBonus: Double
    let voiceGender: OperatorVoiceGender
    let isCustom: Bool
    /// Purchased from Shop — not part of the free base roster.
    let isShopExclusive: Bool

    init(
        id: String,
        callsign: String,
        role: String,
        bio: String,
        accent: Color,
        look: OperatorAppearance,
        moveSpeedMultiplier: Float,
        maxHealth: Double,
        damageTakenMultiplier: Double,
        medkitBonus: Double,
        voiceGender: OperatorVoiceGender? = nil,
        isCustom: Bool = false,
        isShopExclusive: Bool = false
    ) {
        self.id = id
        self.callsign = callsign
        self.role = role
        self.bio = bio
        self.accent = accent
        self.look = look
        self.moveSpeedMultiplier = moveSpeedMultiplier
        self.maxHealth = maxHealth
        self.damageTakenMultiplier = damageTakenMultiplier
        self.medkitBonus = medkitBonus
        // Prefer explicit → premade id → callsign inference → neutral.
        if let voiceGender {
            self.voiceGender = voiceGender
        } else {
            let fromID = OperatorVoiceGender.inferred(from: id)
            self.voiceGender = fromID != .neutral ? fromID : OperatorVoiceGender.inferred(from: callsign)
        }
        self.isCustom = isCustom
        self.isShopExclusive = isShopExclusive
    }

    /// Free Task Force KESTREL roster — always unlocked, never sold in Shop.
    static let base: [OperatorProfile] = [
        OperatorProfile(
            id: "grambo",
            callsign: "GRAMBO",
            role: "Assault",
            bio: "Task Force lead. OD plate carrier and FAST helm — default KESTREL kit.",
            accent: Color(red: 0.32, green: 0.58, blue: 0.38),
            look: OperatorLook.grambo.appearance,
            moveSpeedMultiplier: 1.0,
            maxHealth: 100,
            damageTakenMultiplier: 1.0,
            medkitBonus: 0,
            voiceGender: .male
        ),
        OperatorProfile(
            id: "vesper",
            callsign: "VESPER",
            role: "Scout",
            bio: "Navy soft-armor infil. Blue visor, boom mic — fast, thin plates.",
            accent: Color(red: 0.35, green: 0.52, blue: 0.78),
            look: OperatorLook.vesper.appearance,
            moveSpeedMultiplier: 1.22,
            maxHealth: 85,
            damageTakenMultiplier: 1.15,
            medkitBonus: 0,
            voiceGender: .female
        ),
        OperatorProfile(
            id: "brick",
            callsign: "BRICK",
            role: "Heavy",
            bio: "Coyote heavy plates and orange IR. Walking cover — slow, hard to drop.",
            accent: Color(red: 0.78, green: 0.42, blue: 0.18),
            look: OperatorLook.brick.appearance,
            moveSpeedMultiplier: 0.82,
            maxHealth: 140,
            damageTakenMultiplier: 0.75,
            medkitBonus: 5,
            voiceGender: .male
        ),
        OperatorProfile(
            id: "ghost",
            callsign: "GHOST",
            role: "Recon",
            bio: "Ash night kit with balaclava and gray visor. Cold nerves, mid armor.",
            accent: Color(red: 0.58, green: 0.60, blue: 0.66),
            look: OperatorLook.ghost.appearance,
            moveSpeedMultiplier: 1.05,
            maxHealth: 95,
            damageTakenMultiplier: 1.0,
            medkitBonus: 0,
            voiceGender: .male
        ),
        OperatorProfile(
            id: "reina",
            callsign: "REINA",
            role: "Medic",
            bio: "Black SWAT medic — crimson helm, white cross, combat lifesaver kit.",
            accent: Color(red: 0.82, green: 0.22, blue: 0.26),
            look: OperatorLook.reina.appearance,
            moveSpeedMultiplier: 1.0,
            maxHealth: 110,
            damageTakenMultiplier: 0.95,
            medkitBonus: 20,
            voiceGender: .female
        ),
        OperatorProfile(
            id: "wraith",
            callsign: "WRAITH",
            role: "CQB",
            bio: "Void CQB predator — balaclava, violet IR, sprint-ready lean pool.",
            accent: Color(red: 0.48, green: 0.28, blue: 0.68),
            look: OperatorLook.wraith.appearance,
            moveSpeedMultiplier: 1.15,
            maxHealth: 90,
            damageTakenMultiplier: 1.1,
            medkitBonus: 0,
            voiceGender: .female
        )
    ]

    /// Shop-only operators — unlock with Combat Coins, then selectable in Characters.
    static let shopExclusive: [OperatorProfile] = [
        OperatorProfile(
            id: "nyx",
            callsign: "NYX",
            role: "Infil",
            bio: "Midnight dual-mask infil. Deepest indigo kit for silent entries.",
            accent: Color(red: 0.55, green: 0.32, blue: 0.82),
            look: OperatorLook.nyx.appearance,
            moveSpeedMultiplier: 1.28,
            maxHealth: 80,
            damageTakenMultiplier: 1.2,
            medkitBonus: 0,
            voiceGender: .female,
            isShopExclusive: true
        ),
        OperatorProfile(
            id: "echo",
            callsign: "ECHO",
            role: "Comms",
            bio: "Teal soft kit and radio pack. Netrunner nerves on long relays.",
            accent: Color(red: 0.22, green: 0.72, blue: 0.68),
            look: OperatorLook.echo.appearance,
            moveSpeedMultiplier: 1.08,
            maxHealth: 100,
            damageTakenMultiplier: 1.0,
            medkitBonus: 5,
            voiceGender: .female,
            isShopExclusive: true
        ),
        OperatorProfile(
            id: "solstice",
            callsign: "SOLSTICE",
            role: "Patrol",
            bio: "Sand plate and amber visor. All-weather desert patrol kit.",
            accent: Color(red: 0.86, green: 0.62, blue: 0.22),
            look: OperatorLook.solstice.appearance,
            moveSpeedMultiplier: 1.0,
            maxHealth: 105,
            damageTakenMultiplier: 0.95,
            medkitBonus: 0,
            voiceGender: .neutral,
            isShopExclusive: true
        ),
        OperatorProfile(
            id: "havoc",
            callsign: "HAVOC",
            role: "Demo",
            bio: "Hazard-orange breach plates. Slow, armored, hard to put down.",
            accent: Color(red: 0.88, green: 0.40, blue: 0.12),
            look: OperatorLook.havoc.appearance,
            moveSpeedMultiplier: 0.78,
            maxHealth: 150,
            damageTakenMultiplier: 0.7,
            medkitBonus: 5,
            voiceGender: .male,
            isShopExclusive: true
        ),
        OperatorProfile(
            id: "talon",
            callsign: "TALON",
            role: "Marksman",
            bio: "Forest drab overwatch with gold IR chevron. Patient mid-range pushes.",
            accent: Color(red: 0.78, green: 0.66, blue: 0.28),
            look: OperatorLook.talon.appearance,
            moveSpeedMultiplier: 0.95,
            maxHealth: 95,
            damageTakenMultiplier: 1.05,
            medkitBonus: 0,
            voiceGender: .male,
            isShopExclusive: true
        ),
        OperatorProfile(
            id: "circe",
            callsign: "CIRCE",
            role: "Disruptor",
            bio: "Plum soft kit, bone helm, magenta IR. CQB chaos with a lean pool.",
            accent: Color(red: 0.85, green: 0.28, blue: 0.58),
            look: OperatorLook.circe.appearance,
            moveSpeedMultiplier: 1.2,
            maxHealth: 88,
            damageTakenMultiplier: 1.12,
            medkitBonus: 0,
            voiceGender: .female,
            isShopExclusive: true
        ),
        OperatorProfile(
            id: "anvil",
            callsign: "ANVIL",
            role: "Breach",
            bio: "Steel plates and bronze helm. Door-kicker pads, crawl pace, max armor.",
            accent: Color(red: 0.68, green: 0.48, blue: 0.26),
            look: OperatorLook.anvil.appearance,
            moveSpeedMultiplier: 0.8,
            maxHealth: 145,
            damageTakenMultiplier: 0.72,
            medkitBonus: 10,
            voiceGender: .male,
            isShopExclusive: true
        )
    ]

    /// Base roster + shop exclusives (customs live in OperatorRosterStore).
    static let all: [OperatorProfile] = base + shopExclusive

    static func premade(id: String) -> OperatorProfile? {
        all.first { $0.id == id }
    }

    static var baseIDs: Set<String> { Set(base.map(\.id)) }
    static var shopExclusiveIDs: Set<String> { Set(shopExclusive.map(\.id)) }
}

/// Stat / role template used when creating a custom operator.
enum OperatorArchetype: String, CaseIterable, Identifiable, Codable {
    case balanced
    case scout
    case heavy
    case medic
    case recon
    case cqb

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .balanced: return "Assault"
        case .scout: return "Scout"
        case .heavy: return "Heavy"
        case .medic: return "Medic"
        case .recon: return "Recon"
        case .cqb: return "CQB"
        }
    }

    var blurb: String {
        switch self {
        case .balanced: return "Even HP, speed, and armor."
        case .scout: return "Fastest. Thin armor."
        case .heavy: return "Tank HP. Slowest."
        case .medic: return "Extra medkit heal."
        case .recon: return "Mid kit for long pushes."
        case .cqb: return "Sprint-ready lean pool."
        }
    }

    var moveSpeedMultiplier: Float {
        switch self {
        case .balanced: return 1.0
        case .scout: return 1.22
        case .heavy: return 0.82
        case .medic: return 1.0
        case .recon: return 1.05
        case .cqb: return 1.15
        }
    }

    var maxHealth: Double {
        switch self {
        case .balanced: return 100
        case .scout: return 85
        case .heavy: return 140
        case .medic: return 110
        case .recon: return 95
        case .cqb: return 90
        }
    }

    var damageTakenMultiplier: Double {
        switch self {
        case .balanced: return 1.0
        case .scout: return 1.15
        case .heavy: return 0.75
        case .medic: return 0.95
        case .recon: return 1.0
        case .cqb: return 1.1
        }
    }

    var medkitBonus: Double {
        switch self {
        case .medic: return 20
        case .heavy: return 5
        default: return 0
        }
    }
}

struct CustomOperatorRecord: Identifiable, Codable, Hashable {
    var id: String
    var callsign: String
    var role: String
    var bio: String
    var appearance: OperatorAppearance
    var archetypeRaw: String
    /// Optional VO gender; nil = infer from callsign / neutral.
    var voiceGenderRaw: String?
    var createdAt: Date
    var updatedAt: Date

    var archetype: OperatorArchetype {
        OperatorArchetype(rawValue: archetypeRaw) ?? .balanced
    }

    var voiceGender: OperatorVoiceGender {
        if let raw = voiceGenderRaw, let g = OperatorVoiceGender(rawValue: raw) {
            return g
        }
        return OperatorVoiceGender.inferred(from: callsign)
    }

    func asProfile() -> OperatorProfile {
        let arch = archetype
        return OperatorProfile(
            id: id,
            callsign: callsign.uppercased(),
            role: role,
            bio: bio.isEmpty ? "Custom KESTREL operator. \(arch.blurb)" : bio,
            accent: appearance.accentColor,
            look: appearance,
            moveSpeedMultiplier: arch.moveSpeedMultiplier,
            maxHealth: arch.maxHealth,
            damageTakenMultiplier: arch.damageTakenMultiplier,
            medkitBonus: arch.medkitBonus,
            voiceGender: voiceGender,
            isCustom: true
        )
    }
}
