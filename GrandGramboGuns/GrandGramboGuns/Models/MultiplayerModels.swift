// MultiplayerModels.swift
// Squad sizes + match config for Battle Royale / Multiplayer (AI practice now; net-ready later).

import Foundation

enum SquadSize: Int, CaseIterable, Identifiable, Codable, Hashable {
    case solos = 1
    case duos = 2
    case trios = 3
    case squads = 4

    var id: Int { rawValue }

    /// BR / party language.
    var displayName: String {
        switch self {
        case .solos: return "Solos"
        case .duos: return "Duos"
        case .trios: return "Trios"
        case .squads: return "Squads"
        }
    }

    /// Multiplayer TDM team playlist: 1v1 … 4v4.
    var teamModeLabel: String {
        "\(rawValue)v\(rawValue)"
    }

    var shortLabel: String {
        switch self {
        case .solos: return "1"
        case .duos: return "2"
        case .trios: return "3"
        case .squads: return "4"
        }
    }

    var blurb: String {
        switch self {
        case .solos: return "You alone — last operator standing"
        case .duos: return "You + 1 AI teammate"
        case .trios: return "You + 2 AI teammates"
        case .squads: return "You + 3 AI teammates"
        }
    }

    /// Honest lobby copy for Multiplayer NxN playlists.
    var teamModeBlurb: String {
        switch self {
        case .solos: return "Team A: you · Team B: 1 AI — wipe or hit the kill goal"
        case .duos: return "Team A: you + 1 AI · Team B: 2 AI"
        case .trios: return "Team A: you + 2 AI · Team B: 3 AI"
        case .squads: return "Team A: you + 3 AI · Team B: 4 AI"
        }
    }

    var teammateCount: Int { max(0, rawValue - 1) }

    /// Bodies on each side for symmetric TDM (player side includes the local player).
    var teamSize: Int { rawValue }
}

enum ArenaMatchKind: String, CaseIterable, Identifiable, Codable, Hashable {
    case battleRoyale
    case teamDeathmatch
    case quickMatch

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .battleRoyale: return "Battle Royale"
        case .teamDeathmatch: return "Team Deathmatch"
        case .quickMatch: return "Quick Match"
        }
    }

    var subtitle: String {
        switch self {
        case .battleRoyale: return "Shrinking zone · last squad standing"
        case .teamDeathmatch: return "NxN arena · wipe Team B or hit kill goal"
        case .quickMatch: return "Fast NxN TDM — AI practice lobby"
        }
    }
}

/// Immutable match parameters handed to the arena SceneKit view.
struct ArenaMatchConfig: Hashable, Codable {
    var kind: ArenaMatchKind
    var squadSize: SquadSize
    /// Total combatants including the player (clamped for SceneKit stability).
    var totalCombatants: Int
    var killGoal: Int
    var matchDurationSeconds: Int

    static let brCombatantRange = 12...24
    /// Symmetric TDM: 1v1…4v4 → 2…8 bodies.
    static let mpCombatantRange = 2...8

    static func battleRoyale(squadSize: SquadSize, totalCombatants: Int = 16) -> ArenaMatchConfig {
        let clamped = min(brCombatantRange.upperBound, max(brCombatantRange.lowerBound, totalCombatants))
        let aligned = alignToSquad(clamped, squad: squadSize)
        return ArenaMatchConfig(
            kind: .battleRoyale,
            squadSize: squadSize,
            totalCombatants: aligned,
            killGoal: 0,
            matchDurationSeconds: 0
        )
    }

    /// Symmetric Team A vs Team B: `squadSize` operators per side (1v1…4v4).
    static func multiplayer(
        kind: ArenaMatchKind = .teamDeathmatch,
        squadSize: SquadSize,
        killGoal: Int? = nil,
        durationSeconds: Int? = nil
    ) -> ArenaMatchConfig {
        let mode = kind == .battleRoyale ? .teamDeathmatch : kind
        let team = squadSize.teamSize
        let total = min(mpCombatantRange.upperBound, max(mpCombatantRange.lowerBound, team * 2))
        let defaultGoal = mode == .quickMatch ? max(team, team + 1) : max(team, 3)
        let defaultDuration = mode == .quickMatch ? 90 + team * 15 : 120 + team * 20
        return ArenaMatchConfig(
            kind: mode,
            squadSize: squadSize,
            totalCombatants: total,
            killGoal: max(1, killGoal ?? defaultGoal),
            matchDurationSeconds: max(60, durationSeconds ?? defaultDuration)
        )
    }

    var enemyCount: Int { max(0, totalCombatants - squadSize.rawValue) }
    var enemySquadCount: Int {
        guard kind != .battleRoyale else {
            let size = max(1, squadSize.rawValue)
            return Int(ceil(Double(enemyCount) / Double(size)))
        }
        // TDM / Quick Match: one opposing team (Team B).
        return enemyCount > 0 ? 1 : 0
    }

    var teamASize: Int { squadSize.teamSize }
    var teamBSize: Int { enemyCount }

    var practiceLobbyNote: String {
        "Practice lobby — AI operators (not online multiplayer)"
    }

    private static func alignToSquad(_ total: Int, squad: SquadSize) -> Int {
        let s = max(1, squad.rawValue)
        let rounded = Int((Double(total) / Double(s)).rounded()) * s
        return max(s * 2, rounded) // at least player squad + one enemy squad
    }
}

enum ArenaMatchOutcome: Equatable {
    case victory
    case defeat
}
