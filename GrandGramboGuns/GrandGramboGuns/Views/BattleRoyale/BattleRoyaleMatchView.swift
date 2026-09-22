// BattleRoyaleMatchView.swift
// BR match HUD — storm, squad HP, last standing.

import SwiftUI

struct BattleRoyaleMatchView: View {
    let config: ArenaMatchConfig
    let teammateCallsigns: [String]

    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var roster: OperatorRosterStore
    @EnvironmentObject private var ranks: RankProgressStore
    @EnvironmentObject private var coins: CombatCoinStore
    @Environment(\.dismiss) private var dismiss

    @State private var health: Double = 100
    @State private var maxHealth: Double = 100
    @State private var ammo: Int = 30
    @State private var magSize: Int = 30
    @State private var statusMessage = ""
    @State private var isFiring = false
    @State private var moveAxis: CGPoint = .zero
    @State private var outcome: ArenaMatchOutcome?
    @State private var livingEnemies = 0
    @State private var livingSquads = 0
    @State private var playerKills = 0
    @State private var teamKills = 0
    @State private var enemyTeamKills = 0
    @State private var zoneRadius: Float = 34
    @State private var matchTimeRemaining = 0
    @State private var squadHP: [Double] = []
    @State private var squadAlive: [Bool] = []
    @State private var blueprint: GunBlueprint?
    @State private var matchReady = false
    @State private var showEndCard = false
    @State private var showPause = false
    @State private var remountToken = 0
    @State private var readinessGeneration: UInt = 0
    @StateObject private var juice = CombatJuiceBus()

    private var activeOperator: OperatorProfile {
        roster.profile(id: settings.selectedOperatorID)
    }

    private var inputBlocked: Bool {
        !matchReady || showEndCard || showPause
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if let blueprint {
                ArenaMatchSceneView(
                    config: config,
                    blueprint: blueprint,
                    teammateCallsigns: teammateCallsigns,
                    health: $health,
                    ammo: $ammo,
                    statusMessage: $statusMessage,
                    isFiring: $isFiring,
                    moveAxis: $moveAxis,
                    outcome: $outcome,
                    livingEnemies: $livingEnemies,
                    livingSquads: $livingSquads,
                    playerKills: $playerKills,
                    teamKills: $teamKills,
                    enemyTeamKills: $enemyTeamKills,
                    zoneRadius: $zoneRadius,
                    matchTimeRemaining: $matchTimeRemaining,
                    squadHP: $squadHP,
                    squadAlive: $squadAlive,
                    combatEnabled: matchReady && !showEndCard && !showPause,
                    hapticsEnabled: settings.hapticsEnabled,
                    soundVolume: settings.soundVolume,
                    magSize: magSize,
                    thirdPersonMode: settings.thirdPersonMode,
                    operatorProfile: activeOperator,
                    difficulty: settings.storyDifficulty,
                    onPlayerKill: {
                        ranks.grantKill(.arena)
                        coins.grantKill(.arena)
                    },
                    onCombatJuice: { juice.pulse($0) }
                )
                .id(remountToken)
                .ignoresSafeArea()
                .allowsHitTesting(matchReady && !inputBlocked)

                arenaCrosshair
                    .allowsHitTesting(false)
                    .opacity(matchReady && !showEndCard && !showPause ? 1 : 0.25)

                HitMarkerOverlay(juice: juice)
                    .opacity(matchReady && !showEndCard && !showPause ? 1 : 0)

                VStack {
                    topHUD
                    Spacer().allowsHitTesting(false)
                    statusCapsule.allowsHitTesting(false)
                    bottomControls
                        .padding(.bottom, 16)
                        .allowsHitTesting(!inputBlocked)
                        .opacity(matchReady && !showEndCard && !showPause ? 1 : 0.35)
                }
                .padding(.horizontal, 12)
                .allowsHitTesting(!showPause && !showEndCard)
            } else {
                Text("Equip a gun in the Armory first")
                    .foregroundStyle(.white)
            }

            if showPause { pauseOverlay.zIndex(50) }
            if showEndCard, let outcome { endOverlay(outcome).zIndex(70) }
        }
        .navigationBarHidden(true)
        .statusBarHidden(true)
        .rankUpToast(ranks: ranks, hapticsEnabled: settings.hapticsEnabled)
        .coinKillToast(coins: coins)
        .onAppear(perform: setup)
        .onDisappear {
            readinessGeneration &+= 1
            tearDownMatchAudio()
        }
        .onChange(of: outcome) { _, newValue in
            guard let newValue else { return }
            isFiring = false
            moveAxis = .zero
            matchReady = false
            showPause = false
            SoundService.shared.stopMissionMusic(fadeOut: true)
            if newValue == .victory {
                SoundService.shared.playVictorySting(volume: settings.soundVolume)
            } else {
                SoundService.shared.playDefeatSting(volume: settings.soundVolume)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                guard outcome == newValue else { return }
                showEndCard = true
            }
        }
        .onChange(of: matchReady) { _, ready in
            if ready {
                SoundService.shared.startMissionMusic(
                    enabled: settings.musicEnabled,
                    musicVolume: settings.musicVolume,
                    intensity: .high
                )
            }
        }
    }

    private var topHUD: some View {
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
                    Text("BATTLE ROYALE · \(config.squadSize.displayName.uppercased())")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                        .foregroundStyle(.white)
                    Text("SQUADS \(livingSquads) · HOSTILES \(livingEnemies) · ZONE \(Int(zoneRadius))m")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.7, green: 0.45, blue: 1.0))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("ELIMS \(playerKills)")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                    Text("\(ammo)")
                        .font(.system(size: 26, weight: .black, design: .rounded))
                        .foregroundStyle(ammo == 0 ? GGGTheme.danger : GGGTheme.neonAccent)
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

            if !teammateCallsigns.isEmpty {
                ForEach(Array(teammateCallsigns.enumerated()), id: \.offset) { idx, name in
                    let alive = squadAlive.indices.contains(idx) ? squadAlive[idx] : true
                    let hp = squadHP.indices.contains(idx) ? squadHP[idx] : 90
                    HStack(spacing: 6) {
                        Text(alive ? name : "\(name) DOWN")
                            .font(.system(size: 10, weight: .heavy, design: .rounded))
                            .foregroundStyle(alive ? Color(red: 0.15, green: 0.92, blue: 0.85) : GGGTheme.danger)
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Color.white.opacity(0.12))
                                Capsule()
                                    .fill(alive ? Color(red: 0.15, green: 0.92, blue: 0.85) : GGGTheme.danger.opacity(0.4))
                                    .frame(width: geo.size.width * CGFloat(max(0, min(1, hp / 90))))
                            }
                        }
                        .frame(height: 6)
                    }
                }
            }
        }
        .padding(.top, 8)
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

    private var bottomControls: some View {
        HStack(alignment: .bottom, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("MOVE")
                    .font(.system(size: 10, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
                    .padding(.leading, 18)
                VirtualJoystick(axis: $moveAxis, diameter: 150)
            }
            Spacer(minLength: 8).allowsHitTesting(false)
            Text("FIRE")
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundStyle(.white)
                .frame(width: 96, height: 96)
                .background(Circle().fill(isFiring ? GGGTheme.neonAmber : GGGTheme.danger))
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

    private var pauseOverlay: some View {
        ZStack {
            Color.black.opacity(0.75)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture { }
            VStack(spacing: 16) {
                Text("PAUSED")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                Button("RESUME") {
                    showPause = false
                }
                .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
                .padding(.horizontal, 40)
                Button("RESTART") { quickRestart() }
                    .buttonStyle(GhostHubButtonStyle())
                    .padding(.horizontal, 40)
                Button("BACK TO LOBBY") {
                    leaveToLobby()
                }
                .buttonStyle(GhostHubButtonStyle())
                .padding(.horizontal, 40)
                Button("QUIT TO HUB") {
                    leaveToHub()
                }
                .buttonStyle(GhostHubButtonStyle())
                .padding(.horizontal, 40)
            }
            .padding(28)
        }
    }

    private func endOverlay(_ outcome: ArenaMatchOutcome) -> some View {
        ZStack {
            Color.black.opacity(0.78)
                .ignoresSafeArea()
                .contentShape(Rectangle())
                .onTapGesture { }
            VStack(spacing: 16) {
                Text(outcome == .victory ? "VICTORY ROYALE" : "ELIMINATED")
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(outcome == .victory ? GGGTheme.neonAccent : GGGTheme.danger)
                Text("\(config.squadSize.displayName) · \(playerKills) elims")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                if ranks.sessionXP > 0 || ranks.sessionDidRankUp {
                    SessionXPSummaryView(ranks: ranks)
                }
                SessionCoinSummaryView(coins: coins)
                Text(config.practiceLobbyNote)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAmber)
                Button("RESTART") { quickRestart() }
                    .buttonStyle(GhostHubButtonStyle())
                    .padding(.horizontal, 40)
                Button("Back to Lobby") {
                    leaveToLobby()
                }
                .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
                .padding(.horizontal, 40)
            }
        }
    }

    private var arenaCrosshair: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.5), lineWidth: 1.2).frame(width: 36, height: 36)
            Circle().fill(GGGTheme.neonAccent.opacity(0.85)).frame(width: 4, height: 4)
        }
        .offset(y: -30)
    }

    private func leaveToLobby() {
        tearDownMatchAudio()
        isFiring = false
        moveAxis = .zero
        matchReady = false
        showPause = false
        showEndCard = false
        // Nested navigationDestination(isPresented:) — dismiss pops back to lobby.
        dismiss()
    }

    private func leaveToHub() {
        tearDownMatchAudio()
        isFiring = false
        moveAxis = .zero
        matchReady = false
        showPause = false
        showEndCard = false
        appState.path = NavigationPath()
    }

    private func tearDownMatchAudio() {
        SoundService.shared.stopMissionMusic(fadeOut: false)
    }

    private func quickRestart() {
        tearDownMatchAudio()
        isFiring = false
        moveAxis = .zero
        showPause = false
        showEndCard = false
        matchReady = false
        outcome = nil
        playerKills = 0
        teamKills = 0
        enemyTeamKills = 0
        livingEnemies = 0
        livingSquads = 0
        zoneRadius = 34
        remountToken &+= 1
        setup()
    }

    private func setup() {
        readinessGeneration &+= 1
        let generation = readinessGeneration
        ranks.beginSession()
        coins.beginSession()
        let bp: GunBlueprint
        if let id = appState.primaryGunID, let gun = library.gun(id: id) {
            bp = library.blueprint(for: gun)
        } else if let gun = library.guns.first {
            bp = library.blueprint(for: gun)
            appState.primaryGunID = gun.id
        } else {
            bp = GunBlueprint(name: "Issue Carbine", bodyType: .rifle, premadeSkin: .matteBlack)
        }
        blueprint = bp
        magSize = bp.magCapacity
        ammo = magSize
        maxHealth = activeOperator.maxHealth
        health = activeOperator.maxHealth
        statusMessage = "Stand by…"
        matchReady = false
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
            guard generation == readinessGeneration, outcome == nil, !showEndCard else { return }
            matchReady = true
            statusMessage = "WEAPONS FREE"
        }
    }
}
