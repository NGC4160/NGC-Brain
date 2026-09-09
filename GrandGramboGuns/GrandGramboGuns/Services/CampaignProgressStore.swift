// CampaignProgressStore.swift
// Persists story-mode mission unlocks / completions (campaign + DLC).

import Foundation
import Combine

@MainActor
final class CampaignProgressStore: ObservableObject {
    @Published private(set) var completedIDs: Set<String>
    @Published private(set) var campaignFinished: Bool
    @Published private(set) var dlcFinished: Bool

    private let defaults = UserDefaults.standard
    private let completedKey = "ggg.campaign.completed"
    private let finishedKey = "ggg.campaign.finished"
    private let dlcFinishedKey = "ggg.dlc.ghost_lattice.finished"

    init() {
        let saved = defaults.stringArray(forKey: completedKey) ?? []
        completedIDs = Set(saved)
        campaignFinished = defaults.bool(forKey: finishedKey)
        dlcFinished = defaults.bool(forKey: dlcFinishedKey)

        // Recover finished flags from completed IDs if keys were missing.
        if !campaignFinished, let last = CampaignStory.missions.last, completedIDs.contains(last.id) {
            campaignFinished = true
            defaults.set(true, forKey: finishedKey)
        }
        if !dlcFinished, let last = DLCStory.missions.last, completedIDs.contains(last.id) {
            dlcFinished = true
            defaults.set(true, forKey: dlcFinishedKey)
        }
    }

    /// DLC pack unlocks only after main campaign (Meridian Fall) is complete.
    var isDLCUnlocked: Bool { campaignFinished }

    func isUnlocked(_ mission: CampaignMission) -> Bool {
        if DLCStory.isDLC(mission) {
            guard campaignFinished else { return false }
            if mission.number == 1 { return true }
            guard let prev = DLCStory.missions.first(where: { $0.number == mission.number - 1 }) else {
                return false
            }
            return completedIDs.contains(prev.id)
        }

        if mission.number == 1 { return true }
        guard let prev = CampaignStory.missions.first(where: { $0.number == mission.number - 1 }) else {
            return false
        }
        return completedIDs.contains(prev.id)
    }

    func isCompleted(_ mission: CampaignMission) -> Bool {
        completedIDs.contains(mission.id)
    }

    func markCompleted(_ mission: CampaignMission) {
        completedIDs.insert(mission.id)
        defaults.set(Array(completedIDs), forKey: completedKey)

        if mission.id == CampaignStory.missions.last?.id {
            campaignFinished = true
            defaults.set(true, forKey: finishedKey)
        }
        if mission.id == DLCStory.missions.last?.id {
            dlcFinished = true
            defaults.set(true, forKey: dlcFinishedKey)
        }
    }

    func resetProgress() {
        completedIDs = []
        campaignFinished = false
        dlcFinished = false
        defaults.removeObject(forKey: completedKey)
        defaults.set(false, forKey: finishedKey)
        defaults.set(false, forKey: dlcFinishedKey)
    }
}
