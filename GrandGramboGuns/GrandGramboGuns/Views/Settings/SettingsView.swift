// SettingsView.swift
// Sound, haptics, and destructive data reset.

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var library: GunLibraryStore

    @State private var confirmReset = false

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            Form {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Sound volume")
                            Spacer()
                            Text("\(Int(settings.soundVolume * 100))%")
                                .foregroundStyle(GGGTheme.steel)
                        }
                        Slider(value: $settings.soundVolume, in: 0...1)
                            .tint(GGGTheme.neonAccent)
                    }

                    Toggle("Haptic feedback", isOn: $settings.hapticsEnabled)
                        .tint(GGGTheme.neonAccent)

                    Toggle("Ambient audio session", isOn: $settings.musicEnabled)
                        .tint(GGGTheme.neonAccent)
                } header: {
                    Text("Feel")
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    LabeledContent("Saved guns", value: "\(library.guns.count)")
                    LabeledContent("Paint jobs", value: "\(library.paintJobs.count)")
                    LabeledContent("Skin apps", value: "\(library.skinApplications.count)")
                } header: {
                    Text("Storage")
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    Button("Reset onboarding tips") {
                        UserDefaults.standard.set(true, forKey: "ggg.onboarding.build")
                        UserDefaults.standard.set(true, forKey: "ggg.onboarding.paint")
                        appState.showBuildOnboarding = true
                        appState.showPaintOnboarding = true
                    }
                    .foregroundStyle(GGGTheme.neonAccent)

                    Button("Reset all custom data…", role: .destructive) {
                        confirmReset = true
                    }
                } header: {
                    Text("Data")
                } footer: {
                    Text("Reset removes custom guns, paint jobs, and skin history. Starter toys are re-seeded. This arcade app never stores real firearm data.")
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Grand Grambo Guns")
                            .font(.headline)
                        Text("Stylized offline arcade toy. Not a training tool. No real-world ballistics, construction details, or online features.")
                            .font(.footnote)
                            .foregroundStyle(GGGTheme.steel)
                    }
                }
                .listRowBackground(GGGTheme.panel)
            }
            .scrollContentBackground(.hidden)
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .confirmationDialog(
            "Delete all custom builds and paint?",
            isPresented: $confirmReset,
            titleVisibility: .visible
        ) {
            Button("Reset everything", role: .destructive, action: resetAll)
            Button("Cancel", role: .cancel) {}
        }
    }

    private func resetAll() {
        library.resetAllCustomData()
        appState.equippedGunID = nil
        HapticsService.reload(enabled: settings.hapticsEnabled)
    }
}
