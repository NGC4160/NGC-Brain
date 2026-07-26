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

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(settings)
                .environmentObject(library)
                .preferredColorScheme(.dark)
        }
    }
}
