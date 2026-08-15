// MultiplayerSession.swift
// Practice lobby session — fills with AI; structure ready for Game Center later.

import Foundation
import Combine

enum MultiplayerLobbyPhase: Equatable {
    case idle
    case searching
    case filling(botsJoined: Int, botsNeeded: Int)
    case ready
    case inMatch
    case ended
}

/// Net-ready session shell. MVP fills with bots after a short “Searching…” delay.
@MainActor
final class MultiplayerSession: ObservableObject {
    @Published private(set) var phase: MultiplayerLobbyPhase = .idle
    @Published private(set) var statusLine = "Ready"
    @Published var config: ArenaMatchConfig
    @Published private(set) var playerSquadCallsigns: [String] = []
    @Published private(set) var enemySquadLabels: [String] = []

    /// Reserved for future GKMatch / Game Center wiring.
    var remoteMatchID: String?
    var usesLiveNetworking: Bool { false }

    private var fillTask: Task<Void, Never>?

    init(config: ArenaMatchConfig) {
        self.config = config
    }

    func updateConfig(_ config: ArenaMatchConfig) {
        guard phase == .idle || phase == .ended || phase == .ready else { return }
        self.config = config
        phase = .idle
        statusLine = "Ready"
        playerSquadCallsigns = []
        enemySquadLabels = []
    }

    func cancelSearch() {
        fillTask?.cancel()
        fillTask = nil
        phase = .idle
        statusLine = "Cancelled"
        playerSquadCallsigns = []
        enemySquadLabels = []
    }

    /// Starts practice lobby fill. Callsigns exclude the player's selected operator when provided.
    /// `preferredTeammate` (local friend invite) is slotted first when squad size > 1 — cosmetic / party display only.
    func startPracticeSearch(
        playerCallsign: String,
        availableCallsigns: [String],
        preferredTeammate: String? = nil
    ) {
        fillTask?.cancel()
        phase = .searching
        statusLine = "Searching…"
        playerSquadCallsigns = [playerCallsign]
        enemySquadLabels = []

        let isTDM = config.kind != .battleRoyale
        let teammatesNeeded = config.squadSize.teammateCount
        let enemySlots = config.enemyCount
        let enemySquads = max(1, config.enemySquadCount)
        var pool = availableCallsigns.filter { $0.uppercased() != playerCallsign.uppercased() }
        if let preferred = preferredTeammate?.trimmingCharacters(in: .whitespacesAndNewlines),
           !preferred.isEmpty,
           preferred.uppercased() != playerCallsign.uppercased() {
            pool.removeAll { $0.uppercased() == preferred.uppercased() }
            pool.insert(preferred, at: 0)
        }

        fillTask = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(nanoseconds: 900_000_000)
            guard !Task.isCancelled else { return }

            await MainActor.run {
                self.phase = .filling(botsJoined: 0, botsNeeded: teammatesNeeded + enemySlots)
                self.statusLine = isTDM
                    ? "Filling \(self.config.squadSize.teamModeLabel) with AI…"
                    : "Filling lobby with AI…"
            }

            var mates: [String] = []
            for i in 0..<teammatesNeeded {
                try? await Task.sleep(nanoseconds: 280_000_000)
                guard !Task.isCancelled else { return }
                let name = Self.pickCallsign(pool: pool, used: mates + [playerCallsign], index: i)
                mates.append(name)
                await MainActor.run {
                    self.playerSquadCallsigns = [playerCallsign] + mates
                    let joined = mates.count
                    self.phase = .filling(botsJoined: joined, botsNeeded: teammatesNeeded + enemySlots)
                    self.statusLine = isTDM
                        ? "Team A fill \(joined)/\(teammatesNeeded)…"
                        : "Squad fill \(joined)/\(teammatesNeeded)…"
                }
            }

            var labels: [String] = []
            if isTDM {
                // One opposing team — fill slots as Team B AI count.
                for s in 0..<enemySlots {
                    try? await Task.sleep(nanoseconds: 220_000_000)
                    guard !Task.isCancelled else { return }
                    if labels.isEmpty {
                        labels.append("TEAM B")
                    }
                    await MainActor.run {
                        self.enemySquadLabels = labels
                        let joined = teammatesNeeded + (s + 1)
                        self.phase = .filling(botsJoined: joined, botsNeeded: teammatesNeeded + enemySlots)
                        self.statusLine = "Team B AI \(s + 1)/\(enemySlots)…"
                    }
                }
                if enemySlots == 0 {
                    labels.append("TEAM B")
                    await MainActor.run { self.enemySquadLabels = labels }
                }
            } else {
                for s in 0..<enemySquads {
                    try? await Task.sleep(nanoseconds: 220_000_000)
                    guard !Task.isCancelled else { return }
                    labels.append("HOSTILE-\(s + 1)")
                    await MainActor.run {
                        self.enemySquadLabels = labels
                        let joined = teammatesNeeded + min(enemySlots, labels.count * self.config.squadSize.rawValue)
                        self.phase = .filling(botsJoined: joined, botsNeeded: teammatesNeeded + enemySlots)
                        self.statusLine = "Enemy squads \(labels.count)/\(enemySquads)…"
                    }
                }
            }

            guard !Task.isCancelled else { return }
            await MainActor.run {
                self.phase = .ready
                let modeNote = isTDM ? "\(self.config.squadSize.teamModeLabel) ready — " : ""
                self.statusLine = "\(modeNote)\(self.config.practiceLobbyNote)"
            }
        }
    }

    func markInMatch() {
        phase = .inMatch
        statusLine = "In match"
    }

    func markEnded() {
        phase = .ended
        statusLine = "Match over"
    }

    /// Call when the match view is dismissed back to the lobby so rematch UI works.
    func returnFromMatch() {
        fillTask?.cancel()
        fillTask = nil
        phase = .ended
        statusLine = "Match over — search again when ready"
    }

    private static func pickCallsign(pool: [String], used: [String], index: Int) -> String {
        let usedSet = Set(used.map { $0.uppercased() })
        if let pick = pool.first(where: { !usedSet.contains($0.uppercased()) }) {
            return pick
        }
        let fallbacks = ["RANGER", "VIPER", "GHOST", "HAWK", "NOVA", "REAPER", "ECHO", "BLAZE"]
        for f in fallbacks where !usedSet.contains(f) {
            return f
        }
        return "BOT-\(index + 1)"
    }
}
