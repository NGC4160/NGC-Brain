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
        case .buildGun:
            BuildGunView()
        case .paintShop:
            PaintShopView()
        case .skins:
            SkinsLibraryView()
        case .range:
            RangeView()
        case .settings:
            SettingsView()
        }
    }
}
