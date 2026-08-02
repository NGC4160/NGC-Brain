// SettingsView.swift
// Sound, haptics, and destructive data reset.

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var campaign: CampaignProgressStore
    @EnvironmentObject private var roster: OperatorRosterStore
    @EnvironmentObject private var ranks: RankProgressStore
    @EnvironmentObject private var coins: CombatCoinStore
    @EnvironmentObject private var friends: FriendsStore

    @State private var confirmReset = false
    @State private var confirmCampaignReset = false
    @State private var confirmRankReset = false
    @State private var confirmCoinsReset = false
    @State private var showHowToPlay = false
    @State private var copiedFriendCode = false

    private var activeOperator: OperatorProfile {
        roster.profile(id: settings.selectedOperatorID)
    }

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            Form {
                Section {
                    Button {
                        showHowToPlay = true
                    } label: {
                        HStack {
                            Label("How to Play", systemImage: "questionmark.circle.fill")
                                .foregroundStyle(GGGTheme.neonAccent)
                            Spacer()
                            if settings.hasCompletedHowToPlayTutorial {
                                Text("Replay")
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                                    .foregroundStyle(GGGTheme.steel)
                            } else {
                                Text("New")
                                    .font(.system(size: 13, weight: .bold, design: .rounded))
                                    .foregroundStyle(GGGTheme.neonAmber)
                            }
                        }
                    }
                } header: {
                    Text("Tutorial")
                } footer: {
                    Text("Seven-page field guide covering move/aim, weapons, story COMMS, ally HUD, walls, pickups, and Range.")
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    HStack {
                        RankBadgeChip(rank: ranks.currentRank)
                        Spacer()
                        Text("\(ranks.totalXP) XP")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(GGGTheme.neonAccent)
                    }
                    HubRankProgressBar(ranks: ranks)
                } header: {
                    Text("Operator rank")
                } footer: {
                    Text("Earn XP from Story, Multiplayer, and Battle Royale kills. Training and Range do not award XP.")
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    HStack {
                        Label("Combat Coins", systemImage: "circle.hexagongrid.circle.fill")
                            .foregroundStyle(GGGTheme.neonAmber)
                        Spacer()
                        Text("\(coins.balance) CC")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                } header: {
                    Text("Shop currency")
                } footer: {
                    Text("+\(CombatCoinStore.coinsPerKill) CC per kill in Story/DLC, Multiplayer, and Battle Royale. Spend in Hub → Shop.")
                }
                .listRowBackground(GGGTheme.panel)

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

                    Toggle("Flashlight muzzle flash", isOn: $settings.flashlightEnabled)
                        .tint(GGGTheme.neonAccent)

                    Toggle("Third-person camera", isOn: $settings.thirdPersonMode)
                        .tint(GGGTheme.neonAccent)

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Shake sensitivity")
                            Spacer()
                            Text("\(Int(settings.shakeSensitivity * 100))%")
                                .foregroundStyle(GGGTheme.steel)
                        }
                        Slider(value: $settings.shakeSensitivity, in: 0.15...1)
                            .tint(GGGTheme.neonAccent)
                    }

                    Toggle("Mission music", isOn: $settings.musicEnabled)
                        .tint(GGGTheme.neonAccent)

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Music volume")
                            Spacer()
                            Text("\(Int(settings.musicVolume * 100))%")
                                .foregroundStyle(GGGTheme.steel)
                        }
                        Slider(value: $settings.musicVolume, in: 0...1)
                            .tint(GGGTheme.neonAccent)
                            .disabled(!settings.musicEnabled)
                            .opacity(settings.musicEnabled ? 1 : 0.45)
                    }

                    Toggle("Dialogue voices", isOn: $settings.dialogueVoicesEnabled)
                        .tint(GGGTheme.neonAccent)
                        .onChange(of: settings.dialogueVoicesEnabled) { _, on in
                            if !on { DialogueVoiceService.shared.stop() }
                        }
                } header: {
                    Text("Feel")
                } footer: {
                    Text("No ads. Offline only. Mission music is original looping BGM (quiet under gunfire). Dialogue voices use on-device speech (no downloads) for COMMS, briefings, cutscenes, and debrief — muted when Sound volume is 0. Flashlight uses the rear torch on a real iPhone (not available in Simulator). Third-person camera (default on) applies to Story, Range, Multiplayer, and Battle Royale — turn off for classic first-person.")
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    Picker("Story difficulty", selection: Binding(
                        get: { settings.storyDifficulty },
                        set: { settings.storyDifficulty = $0 }
                    )) {
                        ForEach(StoryDifficulty.allCases) { level in
                            Text(level.displayName).tag(level)
                        }
                    }
                    .tint(GGGTheme.neonAccent)
                } header: {
                    Text("Story difficulty")
                } footer: {
                    Text(settings.storyDifficulty.blurb)
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    Button {
                        appState.navigate(to: .characters)
                    } label: {
                        HStack {
                            OperatorAvatarView(look: activeOperator.look, size: 36)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(activeOperator.callsign)
                                    .font(.system(size: 15, weight: .bold, design: .rounded))
                                    .foregroundStyle(.white)
                                Text("\(activeOperator.role) · \(activeOperator.isCustom ? "Custom" : "Premade")")
                                    .font(.system(size: 12, weight: .medium, design: .rounded))
                                    .foregroundStyle(GGGTheme.subtitle)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(GGGTheme.steel)
                        }
                    }
                } header: {
                    Text("Active character")
                } footer: {
                    Text(activeOperator.bio)
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    HStack {
                        Text(friends.myFriendCode)
                            .font(.system(size: 18, weight: .black, design: .monospaced))
                            .foregroundStyle(GGGTheme.neonAccent)
                            .textSelection(.enabled)
                        Spacer()
                        Button {
                            friends.copyMyCodeToPasteboard()
                            copiedFriendCode = true
                            HapticsService.select(enabled: settings.hapticsEnabled)
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                copiedFriendCode = false
                            }
                        } label: {
                            Label(copiedFriendCode ? "Copied" : "Copy", systemImage: copiedFriendCode ? "checkmark" : "doc.on.doc")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                        }
                        .tint(GGGTheme.neonAccent)
                    }

                    Button {
                        appState.navigate(to: .friends)
                    } label: {
                        HStack {
                            Label("Friends list", systemImage: "person.badge.plus")
                                .foregroundStyle(.white)
                            Spacer()
                            Text("\(friends.friends.count)")
                                .foregroundStyle(GGGTheme.steel)
                            Image(systemName: "chevron.right")
                                .foregroundStyle(GGGTheme.steel)
                        }
                    }
                } header: {
                    Text("Friends")
                } footer: {
                    Text("Friends are saved on this device. Online invites coming later.")
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    LabeledContent("Saved guns", value: "\(library.guns.count)")
                    LabeledContent("Paint jobs", value: "\(library.paintJobs.count)")
                    LabeledContent("Skin apps", value: "\(library.skinApplications.count)")
                    LabeledContent("Custom operators", value: "\(roster.customs.count)")
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

                    Button("Reset How to Play tutorial") {
                        settings.resetHowToPlayTutorial()
                        showHowToPlay = true
                    }
                    .foregroundStyle(GGGTheme.neonAccent)

                    Button("Reset story campaign progress…", role: .destructive) {
                        confirmCampaignReset = true
                    }

                    Button("Reset operator rank / XP…", role: .destructive) {
                        confirmRankReset = true
                    }

                    Button("Reset Combat Coins / shop unlocks…", role: .destructive) {
                        confirmCoinsReset = true
                    }

                    Button("Reset all custom data…", role: .destructive) {
                        confirmReset = true
                    }
                } header: {
                    Text("Data")
                } footer: {
                    Text("Reset removes custom guns, paint jobs, and skin history. Starter toys are re-seeded. Campaign reset unlocks Mission 1 only. Rank reset clears kill XP (not coins). Coin reset clears balance and shop unlocks only.")
                }
                .listRowBackground(GGGTheme.panel)

                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Grand Grambo Guns")
                            .font(.headline)
                        Text("Offline gun simulator — shake to shoot, customize, and range. No ads, no tracking. Not a training tool.")
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
        .confirmationDialog(
            "Reset Operation Iron Meridian progress?",
            isPresented: $confirmCampaignReset,
            titleVisibility: .visible
        ) {
            Button("Reset campaign", role: .destructive) {
                campaign.resetProgress()
                HapticsService.select(enabled: settings.hapticsEnabled)
            }
            Button("Cancel", role: .cancel) {}
        }
        .confirmationDialog(
            "Reset operator rank and kill XP?",
            isPresented: $confirmRankReset,
            titleVisibility: .visible
        ) {
            Button("Reset rank", role: .destructive) {
                ranks.resetProgress()
                HapticsService.select(enabled: settings.hapticsEnabled)
            }
            Button("Cancel", role: .cancel) {}
        }
        .confirmationDialog(
            "Reset Combat Coins and shop unlocks?",
            isPresented: $confirmCoinsReset,
            titleVisibility: .visible
        ) {
            Button("Reset coins & unlocks", role: .destructive) {
                coins.resetEconomy()
                roster.bonusCustomSlots = 0
                HapticsService.select(enabled: settings.hapticsEnabled)
            }
            Button("Cancel", role: .cancel) {}
        }
        .fullScreenCover(isPresented: $showHowToPlay) {
            HowToPlayTutorialView {
                showHowToPlay = false
            }
            .environmentObject(settings)
        }
    }

    private func resetAll() {
        library.resetAllCustomData()
        roster.resetAllCustoms()
        appState.clearLoadout()
        settings.selectedOperatorID = "grambo"
        HapticsService.reload(enabled: settings.hapticsEnabled)
    }
}
