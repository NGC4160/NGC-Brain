// GrandGramboGunsApp.swift
// Grand Grambo Guns — App entry point
//
// Offline arcade-style virtual gun simulator & customizer.
// Stylized video-game toy only — no real-world firearm instruction.

import SwiftUI

@main
struct GrandGramboGunsApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var settings = SettingsStore()
    @StateObject private var library = GunLibraryStore()
    @StateObject private var campaign = CampaignProgressStore()
    @StateObject private var roster = OperatorRosterStore()
    @StateObject private var ranks = RankProgressStore()
    @StateObject private var coins = CombatCoinStore()
    @StateObject private var friends = FriendsStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(settings)
                .environmentObject(library)
                .environmentObject(campaign)
                .environmentObject(roster)
                .environmentObject(ranks)
                .environmentObject(coins)
                .environmentObject(friends)
                .preferredColorScheme(.dark)
                .onAppear {
                    coins.migrateIfNeeded(
                        libraryGunNames: Set(library.guns.map(\.name)),
                        selectedOperatorID: settings.selectedOperatorID
                    )
                    roster.bonusCustomSlots = coins.bonusCustomSlots
                    ranks.coinGrantHandler = { amount in
                        coins.grantCoins(amount, showToast: false)
                    }
                }
        }
    }
}
