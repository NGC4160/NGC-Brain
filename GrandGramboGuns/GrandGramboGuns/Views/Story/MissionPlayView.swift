// MissionPlayView.swift
// In-mission HUD: analog move + fire + dual-weapon switch.
// Flow: pre-cutscene → intro COMMS → play → victory cutscene → end card.

import SwiftUI

struct MissionPlayView: View {
    let missionID: String

    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var campaign: CampaignProgressStore
    @EnvironmentObject private var roster: OperatorRosterStore
    @EnvironmentObject private var ranks: RankProgressStore
    @EnvironmentObject private var coins: CombatCoinStore

    @State private var health: Double = 100
    @State private var maxHealth: Double = 100
    @State private var ammo: Int = 30
    @State private var magSize: Int = 30
    @State private var enemiesLeft: Int = 0
    @State private var statusMessage = ""
    @State private var isFiring = false
    @State private var moveAxis: CGPoint = .zero
    @State private var outcome: MissionSceneView.MissionOutcome?
    @State private var blueprints: [GunBlueprint] = []
    @State private var ammoBySlot: [Int] = [0, 0]
    @State private var magBySlot: [Int] = [30, 30]
    @State private var activeSlot: Int = 0
    @State private var showEndCard = false
    @State private var teammateName = "RANGER"
    @State private var teammateHP: Double = 100
    @State private var teammateMaxHP: Double = 100
    @State private var teammateAlive = true

    /// Blocks combat input until intro pipeline finishes.
    @State private var missionReady = false
    @State private var showPreCutscene = false
    @State private var showIntroDialogue = false
    @State private var showVictoryCutscene = false
    @State private var showPause = false
    /// Remount SceneKit cleanly on quick retry (avoids half-dead enemy graph).
    @State private var remountToken = 0
    @State private var skipIntroOnRemount = false
    @StateObject private var juice = CombatJuiceBus()

    @State private var preCutscene: StoryCutscene?
    @State private var postCutscene: StoryCutscene?
    @State private var introLines: [StoryDialogueLine] = []

    private var mission: CampaignMission? {
        CampaignStory.mission(id: missionID)
    }

    private var activeOperator: OperatorProfile {
        roster.profile(id: settings.selectedOperatorID)
    }

    private var activeBlueprint: GunBlueprint? {
        guard blueprints.indices.contains(activeSlot) else { return blueprints.first }
        return blueprints[activeSlot]
    }

    private var canSwitchWeapons: Bool {
        blueprints.count > 1
    }

    private var inputBlocked: Bool {
        !missionReady || showEndCard || showVictoryCutscene || showPreCutscene || showIntroDialogue || showPause
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if let mission, let blueprint = activeBlueprint {
                MissionSceneView(
                    mission: mission,
                    blueprint: blueprint,
                    health: $health,
                    ammo: $ammo,
                    enemiesLeft: $enemiesLeft,
                    statusMessage: $statusMessage,
                    isFiring: $isFiring,
                    moveAxis: $moveAxis,
                    outcome: $outcome,
                    teammateName: $teammateName,
                    teammateHP: $teammateHP,
                    teammateMaxHP: $teammateMaxHP,
                    teammateAlive: $teammateAlive,
                    combatEnabled: missionReady && !showEndCard && !showVictoryCutscene
                        && !showPreCutscene && !showIntroDialogue && !showPause,
                    hapticsEnabled: settings.hapticsEnabled,
                    soundVolume: settings.soundVolume,
                    magSize: magSize,
                    thirdPersonMode: settings.thirdPersonMode,
                    operatorProfile: activeOperator,
                    difficulty: settings.storyDifficulty,
                    onPlayerKill: {
                        ranks.grantKill(.story)
                        coins.grantKill(.story)
                    },
                    onCombatJuice: { kind in
                        juice.pulse(kind)
                    }
                )
                .id("\(missionID)-\(remountToken)")
                .ignoresSafeArea()
                .allowsHitTesting(missionReady && !inputBlocked)

                CrosshairHUD()
                    .allowsHitTesting(false)
                    .opacity(missionReady && !showEndCard && !showVictoryCutscene && !showPause ? 1 : 0.25)

                HitMarkerOverlay(juice: juice)
                    .opacity(missionReady && !showEndCard && !showPause ? 1 : 0)

                VStack {
                    topHUD(mission)
                        .allowsHitTesting(true)
                    Spacer()
                        .allowsHitTesting(false)
                    statusCapsule
                        .allowsHitTesting(false)
                        .opacity(missionReady && !showPause ? 1 : 0)
                    bottomControls
                        .padding(.bottom, 16)
                        .allowsHitTesting(!inputBlocked)
                        .opacity(missionReady && !showEndCard && !showVictoryCutscene && !showPause ? 1 : 0.35)
                }
                .padding(.horizontal, 12)
            } else {
                Text("Mission data missing")
                    .foregroundStyle(.white)
            }

            if showPreCutscene, let preCutscene {
                StoryCutsceneView(cutscene: preCutscene) {
                    showPreCutscene = false
                    beginIntroDialogueOrPlay()
                }
                .transition(.opacity)
                .zIndex(40)
            }

            if showIntroDialogue, !introLines.isEmpty {
                MissionDialogueOverlay(lines: introLines) {
                    showIntroDialogue = false
                    unlockMissionPlay()
                }
                .transition(.opacity)
                .zIndex(50)
            }

            if showPause {
                pauseOverlay.zIndex(55)
            }

            if showVictoryCutscene, let postCutscene {
                StoryCutsceneView(cutscene: postCutscene) {
                    showVictoryCutscene = false
                    showEndCard = true
                }
                .transition(.opacity)
                .zIndex(60)
            }

            if showEndCard, let outcome {
                endOverlay(outcome)
                    .zIndex(70)
            }
        }
        .navigationBarHidden(true)
        .statusBarHidden(true)
        .rankUpToast(ranks: ranks, hapticsEnabled: settings.hapticsEnabled)
        .coinKillToast(coins: coins)
        .onAppear(perform: setup)
        .onDisappear {
            DialogueVoiceService.shared.stop()
            SoundService.shared.stopMissionMusic(fadeOut: true)
        }
        .onChange(of: ammo) { _, newValue in
            guard ammoBySlot.indices.contains(activeSlot) else { return }
            ammoBySlot[activeSlot] = newValue
        }
        .onChange(of: outcome) { _, newValue in
            guard let newValue else { return }
            isFiring = false
            moveAxis = .zero
            missionReady = false
            showPause = false
            SoundService.shared.stopMissionMusic(fadeOut: true)
            if newValue == .victory {
                SoundService.shared.playVictorySting(volume: settings.soundVolume)
            } else {
                SoundService.shared.playDefeatSting(volume: settings.soundVolume)
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.55) {
                if newValue == .victory, let mission {
                    campaign.markCompleted(mission)
                    if postCutscene != nil {
                        showVictoryCutscene = true
                    } else {
                        showEndCard = true
                    }
                } else {
                    showEndCard = true
                }
            }
        }
        .onChange(of: missionReady) { _, ready in
            syncMissionMusic(combatReady: ready)
        }
        .onChange(of: showVictoryCutscene) { _, showing in
            if showing {
                isFiring = false
                moveAxis = .zero
                SoundService.shared.duckMissionMusic(true)
            }
        }
        .onChange(of: showPreCutscene) { _, showing in
            if showing { isFiring = false; moveAxis = .zero }
        }
        .onChange(of: showIntroDialogue) { _, showing in
            if showing { isFiring = false; moveAxis = .zero }
        }
        .onChange(of: settings.musicEnabled) { _, _ in
            syncMissionMusic(combatReady: missionReady)
        }
        .onChange(of: settings.musicVolume) { _, _ in
            guard missionReady, outcome == nil else { return }
            let intensity = MissionMusicIntensity.forAct(mission?.act ?? 2)
            SoundService.shared.updateMissionMusicVolume(
                enabled: settings.musicEnabled,
                musicVolume: settings.musicVolume,
                intensity: intensity
            )
        }
    }

    private var statusCapsule: some View {
        Text(statusMessage)
            .font(.system(size: 13, weight: .bold, design: .rounded))
            .foregroundStyle(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.black.opacity(0.45))
            .clipShape(Capsule())
    }

    private var pauseOverlay: some View {
        ZStack {
            Color.black.opacity(0.78)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture { }
            VStack(spacing: 14) {
                Text("PAUSED")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                Button("RESUME") {
                    showPause = false
                }
                .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
                .padding(.horizontal, 40)
                Button("RESTART") {
                    quickRestart()
                }
                .buttonStyle(GhostHubButtonStyle())
                .padding(.horizontal, 40)
                Button(DLCStory.isDLCMissionID(missionID) ? "QUIT TO DLC" : "QUIT TO CAMPAIGN") {
                    leaveMission()
                }
                .buttonStyle(GhostHubButtonStyle())
                .padding(.horizontal, 40)
            }
            .padding(28)
        }
    }

    private func setup() {
        guard let mission else { return }
        ranks.beginSession()
        coins.beginSession()
        resolveLoadout(suggestedBody: mission.suggestedBody)

        let op = activeOperator
        maxHealth = op.maxHealth
        health = op.maxHealth
        enemiesLeft = mission.enemyCount
        let loadoutNames = blueprints.map(\.displayName).joined(separator: " / ")
        statusMessage = "\(op.callsign) — \(loadoutNames)"

        let callsign = op.callsign
        let gender = op.voiceGender
        preCutscene = CampaignCutscenes.pre(for: missionID)?.resolved(operatorCallsign: callsign, operatorGender: gender)
        postCutscene = CampaignCutscenes.post(for: missionID)?.resolved(operatorCallsign: callsign, operatorGender: gender)
        introLines = CampaignDialogue.intro(for: missionID).map {
            $0.resolved(operatorCallsign: callsign, operatorGender: gender)
        }

        missionReady = false
        showEndCard = false
        showVictoryCutscene = false
        showIntroDialogue = false
        showPause = false
        outcome = nil

        if skipIntroOnRemount {
            skipIntroOnRemount = false
            showPreCutscene = false
            unlockMissionPlay()
            statusMessage = "WEAPONS FREE — RETRY"
            return
        }

        if preCutscene != nil {
            showPreCutscene = true
        } else {
            beginIntroDialogueOrPlay()
        }
    }

    private func resolveLoadout(suggestedBody: GunBodyType) {
        var resolved: [GunBlueprint] = []

        if let id = appState.primaryGunID, let gun = library.gun(id: id) {
            resolved.append(library.blueprint(for: gun))
        }
        if let id = appState.secondaryGunID, let gun = library.gun(id: id) {
            let bp = library.blueprint(for: gun)
            if resolved.first?.id != bp.id {
                resolved.append(bp)
            }
        }

        if resolved.isEmpty {
            if let gun = library.guns.first {
                resolved.append(library.blueprint(for: gun))
                appState.primaryGunID = gun.id
            } else {
                resolved = [
                    GunBlueprint(name: "Issue Carbine", bodyType: suggestedBody, premadeSkin: .matteBlack)
                ]
            }
        }

        blueprints = resolved
        magBySlot = resolved.map(\.magCapacity)
        while magBySlot.count < 2 { magBySlot.append(magBySlot[0]) }
        ammoBySlot = magBySlot
        activeSlot = 0
        magSize = magBySlot[0]
        ammo = ammoBySlot[0]
    }

    private func beginIntroDialogueOrPlay() {
        if !introLines.isEmpty {
            showIntroDialogue = true
        } else {
            unlockMissionPlay()
        }
    }

    private func unlockMissionPlay() {
        DispatchQueue.main.async {
            guard !showEndCard, outcome == nil, !showPause else { return }
            missionReady = true
            if statusMessage.isEmpty {
                statusMessage = "WEAPONS FREE"
            }
        }
    }

    private func syncMissionMusic(combatReady: Bool) {
        guard combatReady, outcome == nil, !showEndCard, !showVictoryCutscene else {
            if !combatReady {
                SoundService.shared.stopMissionMusic(fadeOut: true)
            }
            return
        }
        let intensity = MissionMusicIntensity.forAct(mission?.act ?? 2)
        SoundService.shared.startMissionMusic(
            enabled: settings.musicEnabled,
            musicVolume: settings.musicVolume,
            intensity: intensity
        )
    }

    private func quickRestart() {
        DialogueVoiceService.shared.stop()
        SoundService.shared.stopMissionMusic(fadeOut: false)
        isFiring = false
        moveAxis = .zero
        showPause = false
        showEndCard = false
        showVictoryCutscene = false
        showPreCutscene = false
        showIntroDialogue = false
        missionReady = false
        outcome = nil
        skipIntroOnRemount = true
        remountToken &+= 1
        // setup() runs via remount onAppear of scene — also reset HUD now
        setup()
    }

    private func leaveMission() {
        DialogueVoiceService.shared.stop()
        SoundService.shared.stopMissionMusic(fadeOut: false)
        isFiring = false
        moveAxis = .zero
        missionReady = false
        showPause = false
        appState.path = NavigationPath()
        appState.navigate(to: .storyMode)
    }

    private func switchWeapon() {
        guard canSwitchWeapons, !inputBlocked else { return }
        isFiring = false
        ammoBySlot[activeSlot] = ammo
        let next = (activeSlot + 1) % blueprints.count
        activeSlot = next
        magSize = magBySlot[next]
        ammo = ammoBySlot[next]
        statusMessage = blueprints[next].displayName.uppercased()
        HapticsService.select(enabled: settings.hapticsEnabled)
        SoundService.shared.playReload(volume: settings.soundVolume * 0.55)
    }

    private func topHUD(_ mission: CampaignMission) -> some View {
        VStack(spacing: 8) {
            HStack {
                Button {
                    showPause = true
                    isFiring = false
                    moveAxis = .zero
                } label: {
                    Image(systemName: "pause.fill")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(10)
                        .background(Color.black.opacity(0.5))
                        .clipShape(Circle())
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(mission.title.uppercased())
                        .font(.system(size: 12, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                    Text("\(activeOperator.callsign) · \(settings.storyDifficulty.displayName.uppercased()) · HOSTILES \(enemiesLeft)")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.danger)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(activeBlueprint?.displayName.uppercased() ?? "WEAPON")
                        .font(.system(size: 10, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                        .lineLimit(1)
                    Text("\(ammo)")
                        .font(.system(size: 26, weight: .black, design: .rounded))
                        .foregroundStyle(ammo == 0 ? GGGTheme.danger : GGGTheme.neonAccent)
                }
            }

            if canSwitchWeapons {
                HStack(spacing: 8) {
                    ForEach(0..<blueprints.count, id: \.self) { idx in
                        let selected = idx == activeSlot
                        Text("\(idx + 1)  \(blueprints[idx].bodyType.displayName.uppercased())")
                            .font(.system(size: 10, weight: .heavy, design: .rounded))
                            .foregroundStyle(selected ? GGGTheme.background : .white.opacity(0.75))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(selected ? GGGTheme.neonAccent : Color.white.opacity(0.12))
                            .clipShape(Capsule())
                    }
                    Spacer()
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.15))
                    Capsule()
                        .fill(health > maxHealth * 0.35 ? GGGTheme.neonAccent : GGGTheme.danger)
                        .frame(width: geo.size.width * CGFloat(max(0, min(1, health / max(1, maxHealth)))))
                }
            }
            .frame(height: 10)

            HStack(spacing: 8) {
                Image(systemName: teammateAlive ? "person.fill" : "person.slash.fill")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(teammateAlive ? Color(red: 0.15, green: 0.92, blue: 0.85) : GGGTheme.danger)
                Text(teammateAlive ? teammateName : "\(teammateName) DOWN")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(teammateAlive ? Color(red: 0.15, green: 0.92, blue: 0.85) : GGGTheme.danger)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.white.opacity(0.12))
                        Capsule()
                            .fill(teammateAlive
                                 ? Color(red: 0.15, green: 0.92, blue: 0.85)
                                 : GGGTheme.danger.opacity(0.5))
                            .frame(width: geo.size.width * CGFloat(
                                max(0, min(1, teammateHP / max(1, teammateMaxHP)))
                            ))
                    }
                }
                .frame(height: 7)
                Text("\(Int(max(0, teammateHP)))")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.85))
                    .frame(minWidth: 28, alignment: .trailing)
            }
        }
        .padding(.top, 8)
    }

    private var bottomControls: some View {
        HStack(alignment: .bottom, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("MOVE")
                    .font(.system(size: 10, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
                    .padding(.leading, 18)
                VirtualJoystick(axis: $moveAxis, diameter: 150)
            }

            Spacer(minLength: 8)
                .allowsHitTesting(false)

            if canSwitchWeapons {
                Button(action: switchWeapon) {
                    VStack(spacing: 4) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.system(size: 20, weight: .bold))
                        Text("SWAP")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                    }
                    .foregroundStyle(.white)
                    .frame(width: 72, height: 72)
                    .background(Circle().fill(GGGTheme.panelElevated))
                    .overlay(Circle().stroke(GGGTheme.neonAccent.opacity(0.55), lineWidth: 2))
                }
                .buttonStyle(.plain)
            }

            Text("FIRE")
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundStyle(.white)
                .frame(width: 96, height: 96)
                .background(
                    Circle().fill(isFiring ? GGGTheme.neonAmber : GGGTheme.danger)
                )
                .overlay(Circle().stroke(.white.opacity(0.3), lineWidth: 2))
                .contentShape(Circle())
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in
                            guard !inputBlocked else { return }
                            isFiring = true
                        }
                        .onEnded { _ in isFiring = false }
                )
        }
    }

    private func endOverlay(_ outcome: MissionSceneView.MissionOutcome) -> some View {
        ZStack {
            Color.black.opacity(0.78).ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    Text(outcome == .victory ? "MISSION COMPLETE" : "MISSION FAILED")
                        .font(.system(size: 26, weight: .black, design: .rounded))
                        .foregroundStyle(outcome == .victory ? GGGTheme.neonAccent : GGGTheme.danger)
                        .scaleEffect(1.02)

                    if outcome == .victory {
                        DialogueTranscriptView(
                            title: "DEBRIEF COMMS",
                            lines: CampaignDialogue.victory(for: missionID).map {
                                $0.resolved(
                                    operatorCallsign: activeOperator.callsign,
                                    operatorGender: activeOperator.voiceGender
                                )
                            }
                        )
                        .padding(.horizontal, 8)
                    }

                    Text(CampaignStory.endCardText(for: missionID, victory: outcome == .victory))
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)

                    if ranks.sessionXP > 0 || ranks.sessionDidRankUp {
                        SessionXPSummaryView(ranks: ranks)
                            .padding(.top, 4)
                    }
                    SessionCoinSummaryView(coins: coins)

                    Button("RESTART MISSION") {
                        quickRestart()
                    }
                    .buttonStyle(GhostHubButtonStyle())
                    .padding(.horizontal, 40)

                    Button(DLCStory.isDLCMissionID(missionID) ? "Back to DLC" : "Back to Campaign") {
                        leaveMission()
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
                    .padding(.horizontal, 40)
                    .padding(.bottom, 24)
                }
                .padding(.top, 48)
            }
        }
    }
}

private struct CrosshairHUD: View {
    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.5), lineWidth: 1.2)
                .frame(width: 36, height: 36)
            Circle()
                .fill(GGGTheme.neonAccent.opacity(0.85))
                .frame(width: 4, height: 4)
        }
        .offset(y: -30)
    }
}
