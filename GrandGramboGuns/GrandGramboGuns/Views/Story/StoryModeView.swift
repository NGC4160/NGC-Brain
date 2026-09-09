// StoryModeView.swift
// Campaign select — Operation Iron Meridian + Ghost Lattice DLC.

import SwiftUI

private enum StoryPackTab: String, CaseIterable, Identifiable {
    case campaign
    case dlc

    var id: String { rawValue }

    var label: String {
        switch self {
        case .campaign: return "Campaign"
        case .dlc: return "DLC"
        }
    }
}

struct StoryModeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var campaign: CampaignProgressStore
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var roster: OperatorRosterStore
    @EnvironmentObject private var coins: CombatCoinStore

    @State private var selected: CampaignMission?
    @State private var showPrologue = true
    @State private var packTab: StoryPackTab = .campaign
    @State private var showDLCLockedAlert = false

    private let dlcAccent = Color(hex: "#8A7D9C")!

    private var activeOperator: OperatorProfile {
        roster.profile(id: settings.selectedOperatorID)
    }

    private var selectableOperators: [OperatorProfile] {
        roster.allProfiles.filter { op in
            op.isCustom || coins.isOperatorUnlocked(op.id)
        }
    }

    var body: some View {
        ZStack {
            GGGTheme.hubGradient.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    packPicker
                    ghostLatticeEntryButton
                    header
                    difficultyPicker
                    operatorPicker

                    switch packTab {
                    case .campaign:
                        campaignContent
                    case .dlc:
                        dlcContent
                    }
                }
                .padding(20)
            }
        }
        .navigationTitle("Story Mode")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .onAppear {
            if appState.pendingStoryDLCTab {
                packTab = .dlc
                showPrologue = true
                appState.pendingStoryDLCTab = false
            }
        }
        .alert("Ghost Lattice Locked", isPresented: $showDLCLockedAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(DLCStory.lockedDetail)
        }
        .sheet(item: $selected) { mission in
            MissionBriefingSheet(
                mission: mission,
                operatorProfile: activeOperator,
                difficulty: settings.storyDifficulty,
                onDeploy: {
                    selected = nil
                    appState.path.append(HubDestination.missionPlay(missionID: mission.id))
                }
            )
            .presentationDetents([.large])
        }
    }

    // MARK: - Pack tabs

    private var packPicker: some View {
        HStack(spacing: 8) {
            ForEach(StoryPackTab.allCases) { tab in
                Button {
                    if tab == .dlc, !campaign.isDLCUnlocked {
                        showDLCLockedAlert = true
                    }
                    packTab = tab
                    showPrologue = true
                } label: {
                    HStack(spacing: 6) {
                        if tab == .dlc {
                            Image(systemName: campaign.isDLCUnlocked ? "lock.open.fill" : "lock.fill")
                                .font(.system(size: 12, weight: .bold))
                        }
                        Text(tab.label.uppercased())
                            .font(.system(size: 13, weight: .black, design: .rounded))
                        if tab == .dlc, campaign.isDLCUnlocked {
                            Text("NEW")
                                .font(.system(size: 9, weight: .heavy, design: .rounded))
                                .foregroundStyle(.black)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Capsule().fill(dlcAccent))
                        }
                    }
                    .foregroundStyle(packTabLabelColor(tab))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(
                            ChamferedRectangle(cut: 6)
                            .fill(packTabBackground(tab))
                    )
                    .overlay(
                        ChamferedRectangle(cut: 6)
                            .stroke(packTabBorder(tab), lineWidth: tab == .dlc && !campaign.isDLCUnlocked ? 1.5 : 0)
                    )
                    .opacity(tab == .dlc && !campaign.isDLCUnlocked ? 0.72 : 1)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func packTabLabelColor(_ tab: StoryPackTab) -> Color {
        if tab == .dlc, !campaign.isDLCUnlocked {
            return packTab == tab ? GGGTheme.steel : GGGTheme.steelDim
        }
        return packTab == tab ? .black : .white
    }

    private func packTabBackground(_ tab: StoryPackTab) -> Color {
        guard packTab == tab else { return GGGTheme.panelElevated }
        if tab == .dlc, !campaign.isDLCUnlocked {
            return GGGTheme.panelElevated
        }
        return tab == .dlc ? dlcAccent : GGGTheme.neonAccent
    }

    private func packTabBorder(_ tab: StoryPackTab) -> Color {
        tab == .dlc && !campaign.isDLCUnlocked ? dlcAccent.opacity(0.55) : .clear
    }

    /// Prominent Ghost Lattice entry — locked until Meridian Fall is finished.
    private var ghostLatticeEntryButton: some View {
        Button {
            if campaign.isDLCUnlocked {
                packTab = .dlc
                showPrologue = true
            } else {
                showDLCLockedAlert = true
            }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: campaign.isDLCUnlocked ? "lock.open.fill" : "lock.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(campaign.isDLCUnlocked ? dlcAccent : GGGTheme.steelDim)
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 3) {
                    Text("GHOST LATTICE")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundStyle(campaign.isDLCUnlocked ? .white : GGGTheme.steel)
                    Text(
                        campaign.isDLCUnlocked
                            ? "Enter DLC — ORACLE Resurgence"
                            : DLCStory.lockedTease
                    )
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(
                        campaign.isDLCUnlocked
                            ? Color(red: 0.85, green: 0.65, blue: 1.0)
                            : GGGTheme.neonAmber
                    )
                }

                Spacer()

                if campaign.isDLCUnlocked {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(dlcAccent)
                } else {
                    Text("LOCKED")
                        .font(.system(size: 10, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.steelDim)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(GGGTheme.panelElevated))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(
                        campaign.isDLCUnlocked
                            ? dlcAccent.opacity(0.22)
                            : GGGTheme.panel.opacity(0.65)
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(
                        campaign.isDLCUnlocked ? dlcAccent.opacity(0.85) : dlcAccent.opacity(0.4),
                        lineWidth: 1.5
                    )
            )
            .opacity(campaign.isDLCUnlocked ? 1 : 0.78)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(
            campaign.isDLCUnlocked
                ? "Enter Ghost Lattice DLC"
                : "Ghost Lattice locked — finish Meridian Fall"
        )
    }

    // MARK: - Headers

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            if packTab == .campaign {
                Text(CampaignStory.campaignTitle.uppercased())
                    .font(.system(size: 21, weight: .black, design: .monospaced))
                    .foregroundStyle(.white)
                Text(CampaignStory.campaignTagline)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAmber)
                Text("Choose a Character, equip two Armory guns, then cut Meridian’s lattice mission by mission.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
            } else {
                HStack(spacing: 8) {
                    Text(DLCStory.packLabel)
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                        .foregroundStyle(.black)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(Color(red: 0.75, green: 0.45, blue: 1.0)))
                    Text("ORACLE RESURGENCE")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                        .foregroundStyle(Color(red: 0.75, green: 0.45, blue: 1.0))
                        .tracking(1)
                }
                Text(DLCStory.campaignTitle)
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                Text(DLCStory.campaignTagline)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(Color(red: 0.85, green: 0.65, blue: 1.0))
                if campaign.isDLCUnlocked {
                    Text("Four aftershock missions. Same dual weapons, teammate, and mission pipeline — hotter stakes.")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                } else {
                    Text(DLCStory.lockedDetail)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.neonAmber)
                }
            }
        }
    }

    // MARK: - Campaign content

    private var campaignContent: some View {
        Group {
            if showPrologue {
                prologueCard(
                    title: "PROLOGUE",
                    body: CampaignStory.prologue,
                    accent: GGGTheme.neonAccent
                )
            }
            ForEach(groupedCampaignMissions, id: \.act) { group in
                actBanner(
                    title: CampaignStory.actTitle(group.act),
                    synopsis: CampaignStory.actSynopsis(group.act),
                    accent: GGGTheme.neonAmber
                )
                ForEach(group.missions) { mission in
                    missionRow(mission)
                }
            }
            if campaign.campaignFinished {
                epilogueCard(
                    title: "CAMPAIGN COMPLETE",
                    body: CampaignStory.epilogue(victory: true),
                    accent: GGGTheme.neonAccent
                )
            }
        }
    }

    // MARK: - DLC content

    private var dlcContent: some View {
        Group {
            if !campaign.isDLCUnlocked {
                dlcLockedCard
            } else {
                if showPrologue {
                    prologueCard(
                        title: "DLC PROLOGUE",
                        body: DLCStory.prologue,
                        accent: Color(red: 0.75, green: 0.45, blue: 1.0)
                    )
                }
                ForEach(groupedDLCMissions, id: \.act) { group in
                    actBanner(
                        title: DLCStory.actTitle(group.act),
                        synopsis: DLCStory.actSynopsis(group.act),
                        accent: Color(red: 0.85, green: 0.65, blue: 1.0)
                    )
                    ForEach(group.missions) { mission in
                        missionRow(mission, dlcStyle: true)
                    }
                }
                if campaign.dlcFinished {
                    epilogueCard(
                        title: "DLC COMPLETE",
                        body: DLCStory.epilogue(victory: true),
                        accent: Color(red: 0.75, green: 0.45, blue: 1.0)
                    )
                }
            }
        }
    }

    private var dlcLockedCard: some View {
        Button {
            showDLCLockedAlert = true
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(dlcAccent)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("GHOST LATTICE — LOCKED")
                            .font(.system(size: 15, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                        Text(DLCStory.lockedTease)
                            .font(.system(size: 13, weight: .semibold, design: .rounded))
                            .foregroundStyle(GGGTheme.neonAmber)
                    }
                }
                Text("After Meridian Fall, residual ORACLE bands start whispering again. Lattice Echo — a ghost protocol — tries to finish the cascade without Voss.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                    .fixedSize(horizontal: false, vertical: true)
                    .multilineTextAlignment(.leading)
                Text(DLCStory.lockedDetail)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
                Text("Finish mission 09 · Last Relay to unlock 4 DLC strikes.")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(GGGTheme.steelDim)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(GGGTheme.panel.opacity(0.7))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(dlcAccent.opacity(0.45), lineWidth: 1.5)
            )
            .opacity(0.85)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Shared pieces

    private var groupedCampaignMissions: [(act: Int, missions: [CampaignMission])] {
        Dictionary(grouping: CampaignStory.missions, by: \.act)
            .map { (act: $0.key, missions: $0.value.sorted { $0.number < $1.number }) }
            .sorted { $0.act < $1.act }
    }

    private var groupedDLCMissions: [(act: Int, missions: [CampaignMission])] {
        Dictionary(grouping: DLCStory.missions, by: \.act)
            .map { (act: $0.key, missions: $0.value.sorted { $0.number < $1.number }) }
            .sorted { $0.act < $1.act }
    }

    private func actBanner(title: String, synopsis: String, accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 13, weight: .black, design: .rounded))
                .foregroundStyle(accent)
            Text(synopsis)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.top, 6)
    }

    private var difficultyPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("DIFFICULTY")
                .font(.system(size: 12, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            HStack(spacing: 8) {
                ForEach(StoryDifficulty.allCases) { level in
                    Button {
                        settings.storyDifficulty = level
                    } label: {
                        Text(level.displayName.uppercased())
                            .font(.system(size: 13, weight: .black, design: .rounded))
                            .foregroundStyle(settings.storyDifficulty == level ? .black : .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(settings.storyDifficulty == level ? GGGTheme.neonAccent : GGGTheme.panelElevated)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            Text(settings.storyDifficulty.blurb)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
        }
        .padding(14)
        .background(GGGTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var operatorPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("OPERATOR")
                    .font(.system(size: 12, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAccent)
                Spacer()
                Button("All Characters") {
                    appState.navigate(to: .characters)
                }
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(GGGTheme.neonAmber)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(selectableOperators) { op in
                        Button {
                            settings.selectedOperatorID = op.id
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 8) {
                                    OperatorAvatarView(look: op.look, size: 28)
                                    VStack(alignment: .leading, spacing: 2) {
                                        HStack {
                                            Text(op.callsign)
                                                .font(.system(size: 13, weight: .black, design: .rounded))
                                                .foregroundStyle(.white)
                                            if op.isCustom {
                                                Text("★")
                                                    .font(.system(size: 10, weight: .bold))
                                                    .foregroundStyle(GGGTheme.neonAmber)
                                            }
                                        }
                                        Text(op.role)
                                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                                            .foregroundStyle(op.accent)
                                    }
                                }
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(settings.selectedOperatorID == op.id ? op.accent.opacity(0.25) : GGGTheme.panelElevated)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(settings.selectedOperatorID == op.id ? op.accent : Color.clear, lineWidth: 1.5)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            Text(activeOperator.bio)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .background(GGGTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func prologueCard(title: String, body: String, accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(title)
                    .font(.system(size: 12, weight: .heavy, design: .rounded))
                    .foregroundStyle(accent)
                Spacer()
                Button("Hide") { showPrologue = false }
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
            }
            Text(body)
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .background(GGGTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func epilogueCard(title: String, body: String, accent: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 12, weight: .heavy, design: .rounded))
                .foregroundStyle(accent)
            Text(body)
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
        }
        .padding(16)
        .background(GGGTheme.panelElevated)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func missionRow(_ mission: CampaignMission, dlcStyle: Bool = false) -> some View {
        let unlocked = campaign.isUnlocked(mission)
        let done = campaign.isCompleted(mission)
        let numberAccent = dlcStyle ? Color(red: 0.75, green: 0.45, blue: 1.0) : GGGTheme.neonAccent
        let lockHint = dlcStyle && !campaign.isDLCUnlocked
            ? DLCStory.lockedTease
            : nil

        return Button {
            guard unlocked else { return }
            selected = mission
        } label: {
            HStack(spacing: 14) {
                VStack(spacing: 4) {
                    Text(dlcStyle ? "DLC" : "ACT \(mission.act)")
                        .font(.system(size: 10, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                    Text(String(format: "%02d", mission.number))
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(done ? numberAccent : .white)
                }
                .frame(width: 56)

                VStack(alignment: .leading, spacing: 4) {
                    Text(mission.title)
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundStyle(unlocked ? .white : GGGTheme.steelDim)
                    Text(mission.situation)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.neonAmber.opacity(unlocked ? 0.9 : 0.4))
                        .lineLimit(2)
                    if let lockHint, !unlocked {
                        Text(lockHint)
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(Color(red: 0.75, green: 0.45, blue: 1.0).opacity(0.8))
                    } else {
                        Text(mission.location)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(GGGTheme.subtitle)
                            .lineLimit(1)
                    }
                    Text("\(mission.enemyCount) hostiles • \(mission.ammoPickups) ammo • \(mission.medkitPickups) medkits")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                }

                Spacer()

                if done {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundStyle(numberAccent)
                } else if !unlocked {
                    Image(systemName: "lock.fill")
                        .foregroundStyle(GGGTheme.steelDim)
                } else {
                    Image(systemName: "chevron.right")
                        .foregroundStyle(dlcStyle ? Color(red: 0.75, green: 0.45, blue: 1.0) : GGGTheme.neonAmber)
                }
            }
            .padding(14)
            .background(unlocked ? GGGTheme.panel : GGGTheme.panel.opacity(0.55))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(done ? numberAccent.opacity(0.5) : Color.clear, lineWidth: 1.5)
            )
        }
        .buttonStyle(.plain)
        .disabled(!unlocked)
    }
}

private struct MissionBriefingSheet: View {
    let mission: CampaignMission
    let operatorProfile: OperatorProfile
    let difficulty: StoryDifficulty
    let onDeploy: () -> Void
    @Environment(\.dismiss) private var dismiss

    private var isDLC: Bool { DLCStory.isDLC(mission) }

    var body: some View {
        NavigationStack {
            ZStack {
                GGGTheme.hubGradient.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        if isDLC {
                            Text("DLC · GHOST LATTICE")
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundStyle(Color(red: 0.75, green: 0.45, blue: 1.0))
                                .tracking(1)
                        }
                        Text(mission.codename)
                            .font(.system(size: 12, weight: .heavy, design: .rounded))
                            .foregroundStyle(GGGTheme.neonAmber)
                            .tracking(2)
                        Text(mission.title)
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                        Text(mission.location)
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                            .foregroundStyle(GGGTheme.subtitle)

                        fieldGuideCard

                        labeled(
                            "DIFFICULTY",
                            "\(difficulty.displayName)\n\(difficulty.blurb)"
                        )
                        labeled(
                            "OPERATOR",
                            "\(operatorProfile.callsign) — \(operatorProfile.role)\nHP \(Int(operatorProfile.maxHealth)) · Speed \(Int(operatorProfile.moveSpeedMultiplier * 100))%"
                        )
                        labeled("SITUATION", mission.situation)
                        labeled("BRIEFING", mission.briefing)

                        DialogueTranscriptView(
                            title: "COMMS",
                            lines: CampaignDialogue.briefing(for: mission.id).map {
                                $0.resolved(
                                    operatorCallsign: operatorProfile.callsign,
                                    operatorGender: operatorProfile.voiceGender
                                )
                            }
                        )

                        labeled("INTEL", mission.intel)
                        labeled("OBJECTIVE", mission.objective)
                        labeled(
                            "SUPPLY",
                            "\(mission.ammoPickups) ammo crates · \(mission.medkitPickups) medkits on the map.\nEliminating a hostile grants +15 ammo."
                        )
                        labeled("LOADOUT TIP", "Recommended: \(mission.suggestedBody.displayName). Equip Primary + Secondary in the Armory, then SWAP in-mission.")

                        Button("DEPLOY", action: onDeploy)
                            .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.danger))
                            .padding(.top, 8)
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Mission Brief")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private var fieldGuideCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("FIELD GUIDE — PICKUPS")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)

            Text("Walk into these on the map to collect them.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)

            HStack(alignment: .top, spacing: 14) {
                pickupExample(
                    title: "AMMO CRATE",
                    detail: "Olive / amber box with a yellow stripe and dark band. Refills your magazine reserve."
                ) {
                    AmmoCrateIcon()
                }

                pickupExample(
                    title: "MEDKIT",
                    detail: "Red box with a white medical cross. Restores health when you walk over it."
                ) {
                    MedkitIcon()
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(GGGTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(GGGTheme.neonAmber.opacity(0.45), lineWidth: 1.5)
        )
    }

    private func pickupExample<Icon: View>(
        title: String,
        detail: String,
        @ViewBuilder icon: () -> Icon
    ) -> some View {
        VStack(spacing: 10) {
            icon()
                .frame(height: 72)
            Text(title)
                .font(.system(size: 12, weight: .black, design: .rounded))
                .foregroundStyle(.white)
            Text(detail)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(GGGTheme.panelElevated)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func labeled(_ title: String, _ body: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            Text(body)
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(GGGTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct AmmoCrateIcon: View {
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(Color(red: 0.72, green: 0.52, blue: 0.12))
                .frame(width: 70, height: 52)
            RoundedRectangle(cornerRadius: 2, style: .continuous)
                .fill(Color(white: 0.12))
                .frame(width: 74, height: 14)
            RoundedRectangle(cornerRadius: 2, style: .continuous)
                .fill(Color(red: 1.0, green: 0.85, blue: 0.2))
                .frame(width: 22, height: 8)
                .offset(y: -18)
        }
    }
}

private struct MedkitIcon: View {
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(Color(red: 0.82, green: 0.12, blue: 0.12))
                .frame(width: 64, height: 48)
            Capsule()
                .fill(Color.white)
                .frame(width: 10, height: 28)
            Capsule()
                .fill(Color.white)
                .frame(width: 28, height: 10)
        }
    }
}
