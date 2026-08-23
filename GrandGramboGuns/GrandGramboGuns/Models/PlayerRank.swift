// PlayerRank.swift
// Kill-XP progression ladder for Grand Grambo Guns.

import SwiftUI

/// Where a kill XP grant came from.
enum KillXPSource: String, Sendable {
    case story
    case training
    case arena

    /// Base XP awarded per player kill (headshot bonuses reserved for later).
    var xpPerKill: Int {
        switch self {
        case .story: return 22
        case .training: return 0 // practice bay — no XP
        case .arena: return 18
        }
    }

    /// Combat Coins per player kill. Training / Range stay at 0.
    var coinsPerKill: Int {
        switch self {
        case .story, .arena: return CombatCoinStore.coinsPerKill
        case .training: return 0
        }
    }
}

/// Persistent operator ranks. Thresholds are cumulative total XP.
enum PlayerRank: Int, CaseIterable, Identifiable, Comparable, Sendable {
    case recruit = 0
    case privateRank
    case corporal
    case sergeant
    case lieutenant
    case captain
    case major
    case colonel
    case general
    case legend
    case grandGrambo

    var id: Int { rawValue }

    var displayName: String {
        switch self {
        case .recruit: return "Recruit"
        case .privateRank: return "Private"
        case .corporal: return "Corporal"
        case .sergeant: return "Sergeant"
        case .lieutenant: return "Lieutenant"
        case .captain: return "Captain"
        case .major: return "Major"
        case .colonel: return "Colonel"
        case .general: return "General"
        case .legend: return "Legend"
        case .grandGrambo: return "Grand Grambo"
        }
    }

    /// Minimum total XP required to hold this rank.
    /// Stretched ~1.75× again (vs prior 15k Grand Grambo ladder) so ranks take longer.
    var xpThreshold: Int {
        switch self {
        case .recruit: return 0
        case .privateRank: return 300
        case .corporal: return 900
        case .sergeant: return 1_700
        case .lieutenant: return 2_800
        case .captain: return 4_500
        case .major: return 6_800
        case .colonel: return 9_800
        case .general: return 14_000
        case .legend: return 19_500
        case .grandGrambo: return 26_500
        }
    }

    var badgeColor: Color {
        switch self {
        case .recruit: return GGGTheme.steel
        case .privateRank: return Color(hex: "#7F8C8D")!
        case .corporal: return Color(hex: "#27AE60")!
        case .sergeant: return Color(hex: "#2ECC71")!
        case .lieutenant: return Color(hex: "#3498DB")!
        case .captain: return Color(hex: "#4DA3FF")!
        case .major: return Color(hex: "#9B59B6")!
        case .colonel: return Color(hex: "#C0392B")!
        case .general: return GGGTheme.neonAmber
        case .legend: return GGGTheme.neonPink
        case .grandGrambo: return GGGTheme.neonAccent
        }
    }

    var next: PlayerRank? {
        PlayerRank(rawValue: rawValue + 1)
    }

    /// Combat Coins granted once when first reaching this rank.
    var rankUpCoinBonus: Int {
        switch self {
        case .recruit: return 0
        case .privateRank: return 20
        case .corporal: return 30
        case .sergeant: return 40
        case .lieutenant: return 50
        case .captain: return 65
        case .major: return 80
        case .colonel: return 100
        case .general: return 125
        case .legend: return 150
        case .grandGrambo: return 200
        }
    }

    /// Cosmetic title unlock shown on rank-up toast (persisted).
    var titleUnlock: String {
        "\(displayName) Operator"
    }

    /// Camo credit toward Paint Shop flair (informational + persisted count).
    var camoCreditReward: Int {
        switch self {
        case .recruit: return 0
        case .privateRank, .corporal: return 1
        case .sergeant, .lieutenant, .captain: return 2
        default: return 3
        }
    }

    static func < (lhs: PlayerRank, rhs: PlayerRank) -> Bool {
        lhs.rawValue < rhs.rawValue
    }

    static func rank(forTotalXP xp: Int) -> PlayerRank {
        let clamped = max(0, xp)
        var current = PlayerRank.recruit
        for rank in PlayerRank.allCases where clamped >= rank.xpThreshold {
            current = rank
        }
        return current
    }
}

/// One-shot payload for rank-up celebration UI.
struct RankUpRewardPayload: Equatable, Sendable {
    let rank: PlayerRank
    let coinsGranted: Int
    let titleUnlock: String
    let camoCredits: Int
}

struct RankGrantResult: Equatable, Sendable {
    let xpGranted: Int
    let totalXP: Int
    let previousRank: PlayerRank
    let newRank: PlayerRank
    var reward: RankUpRewardPayload?

    var didRankUp: Bool { newRank > previousRank }
}
