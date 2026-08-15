// RootView.swift
// Root navigation host — Main Hub + pushed destinations.

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack(path: $appState.path) {
            MainHubView()
                .navigationDestination(for: HubDestination.self) { destination in
                    destinationView(for: destination)
                }
        }
        .tint(GGGTheme.neonAccent)
    }

    @ViewBuilder
    private func destinationView(for destination: HubDestination) -> some View {
        switch destination {
        case .armory:
            ArmoryView()
        case .characters:
            CharactersView()
        case .buildGun:
            BuildGunView()
        case .paintShop:
            PaintShopView()
        case .skins:
            SkinsLibraryView()
        case .shakeShoot:
            ShakeShootView()
        case .range:
            RangeView()
        case .storyMode:
            StoryModeView()
        case .missionPlay(let missionID):
            MissionPlayView(missionID: missionID)
        case .multiplayer:
            MultiplayerLobbyView()
        case .battleRoyale:
            BattleRoyaleLobbyView()
        case .training:
            TrainingView()
        case .shop:
            ShopView()
        case .friends:
            FriendsView()
        case .settings:
            SettingsView()
        }
    }
}
