// RankProgressStore.swift
// Persists kill XP + operator rank across launches (UserDefaults).

import Foundation
import Combine

@MainActor
final class RankProgressStore: ObservableObject {
    /// Lifetime XP — never resets on app update unless the key changes.
    @Published private(set) var totalXP: Int
    @Published private(set) var currentRank: PlayerRank

    /// XP earned since `beginSession()` (mission / match outing).
    @Published private(set) var sessionXP: Int = 0
    /// Highest rank reached during the current session (for end-card celebration).
    @Published private(set) var sessionRankBefore: PlayerRank = .recruit
    @Published private(set) var sessionDidRankUp: Bool = false

    /// One-shot toast target; consume via `consumeRankUpToast()`.
    @Published private(set) var pendingRankUpToast: RankUpRewardPayload?

    /// Cosmetic titles unlocked via rank-ups.
    @Published private(set) var unlockedTitles: [String] = []
    /// Lifetime camo credits from ranks (Paint Shop flair counter).
    @Published private(set) var camoCredits: Int = 0

    private let defaults = UserDefaults.standard
    private let xpKey = "ggg.rank.totalXP.v1"
    private let claimedRewardsKey = "ggg.rank.claimedRewards.v1"
    private let titlesKey = "ggg.rank.titles.v1"
    private let camoKey = "ggg.rank.camoCredits.v1"

    /// Ranks whose coin/title/camo reward has already been granted.
    private var claimedRewardRanks: Set<Int>

    /// Optional coin grant hook — wired from App so rank-ups can pay Combat Coins.
    var coinGrantHandler: ((Int) -> Void)?

    init() {
        let saved = max(0, defaults.integer(forKey: xpKey))
        totalXP = saved
        let rank = PlayerRank.rank(forTotalXP: saved)
        currentRank = rank
        sessionRankBefore = rank
        let claimed = defaults.array(forKey: claimedRewardsKey) as? [Int] ?? []
        var claimedSet = Set(claimed)
        unlockedTitles = defaults.stringArray(forKey: titlesKey) ?? []
        camoCredits = max(0, defaults.integer(forKey: camoKey))
        // Backfill claim markers for current rank so mid-save players aren't double-paid.
        if rank != .recruit, !claimedSet.contains(rank.rawValue) {
            for r in PlayerRank.allCases where r <= rank && r != .recruit {
                claimedSet.insert(r.rawValue)
            }
            defaults.set(Array(claimedSet).sorted(), forKey: claimedRewardsKey)
        }
        claimedRewardRanks = claimedSet
    }

    /// Progress 0…1 toward the next rank (1.0 at max rank).
    var progressToNextRank: Double {
        guard let next = currentRank.next else { return 1 }
        let floor = currentRank.xpThreshold
        let ceiling = next.xpThreshold
        let span = max(1, ceiling - floor)
        return min(1, Double(totalXP - floor) / Double(span))
    }

    var xpIntoCurrentRank: Int {
        max(0, totalXP - currentRank.xpThreshold)
    }

    var xpNeededForNextRank: Int? {
        guard let next = currentRank.next else { return nil }
        return max(0, next.xpThreshold - totalXP)
    }

    var nextRank: PlayerRank? { currentRank.next }

    /// Call when entering a mission or match.
    func beginSession() {
        sessionXP = 0
        sessionRankBefore = currentRank
        sessionDidRankUp = false
    }

    @discardableResult
    func grantKill(_ source: KillXPSource) -> RankGrantResult {
        grantXP(source.xpPerKill)
    }

    @discardableResult
    func grantXP(_ amount: Int) -> RankGrantResult {
        let add = max(0, amount)
        let previous = currentRank
        totalXP += add
        sessionXP += add
        defaults.set(totalXP, forKey: xpKey)

        let newRank = PlayerRank.rank(forTotalXP: totalXP)
        currentRank = newRank

        var reward: RankUpRewardPayload?
        if newRank > previous {
            sessionDidRankUp = true
            reward = grantRankRewards(from: previous, to: newRank)
            if let reward {
                pendingRankUpToast = reward
            } else {
                pendingRankUpToast = RankUpRewardPayload(
                    rank: newRank,
                    coinsGranted: 0,
                    titleUnlock: newRank.titleUnlock,
                    camoCredits: 0
                )
            }
        }

        return RankGrantResult(
            xpGranted: add,
            totalXP: totalXP,
            previousRank: previous,
            newRank: newRank,
            reward: reward
        )
    }

    func consumeRankUpToast() {
        pendingRankUpToast = nil
    }

    func resetProgress() {
        totalXP = 0
        currentRank = .recruit
        sessionXP = 0
        sessionRankBefore = .recruit
        sessionDidRankUp = false
        pendingRankUpToast = nil
        claimedRewardRanks = []
        unlockedTitles = []
        camoCredits = 0
        defaults.removeObject(forKey: xpKey)
        defaults.removeObject(forKey: claimedRewardsKey)
        defaults.removeObject(forKey: titlesKey)
        defaults.removeObject(forKey: camoKey)
    }

    // MARK: - Private

    private func grantRankRewards(from previous: PlayerRank, to newRank: PlayerRank) -> RankUpRewardPayload? {
        var coins = 0
        var camo = 0
        var lastTitle = newRank.titleUnlock

        for rank in PlayerRank.allCases where rank > previous && rank <= newRank {
            if claimedRewardRanks.contains(rank.rawValue) { continue }
            claimedRewardRanks.insert(rank.rawValue)
            coins += rank.rankUpCoinBonus
            camo += rank.camoCreditReward
            lastTitle = rank.titleUnlock
            if !unlockedTitles.contains(rank.titleUnlock) {
                unlockedTitles.append(rank.titleUnlock)
            }
        }

        persistClaimed()
        defaults.set(unlockedTitles, forKey: titlesKey)
        if camo > 0 {
            camoCredits += camo
            defaults.set(camoCredits, forKey: camoKey)
        }
        if coins > 0 {
            coinGrantHandler?(coins)
        }

        return RankUpRewardPayload(
            rank: newRank,
            coinsGranted: coins,
            titleUnlock: lastTitle,
            camoCredits: camo
        )
    }

    private func persistClaimed() {
        defaults.set(Array(claimedRewardRanks).sorted(), forKey: claimedRewardsKey)
    }
}
