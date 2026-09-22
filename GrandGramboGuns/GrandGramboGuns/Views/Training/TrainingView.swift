// TrainingView.swift
// Combat practice bay — move / aim / fire / reload / SWAP with soft dummies.
// No campaign pressure, no game-over kick; exits cleanly to Hub.

import SwiftUI

struct TrainingView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var roster: OperatorRosterStore

    @State private var health: Double = 100
    @State private var maxHealth: Double = 100
    @State private var ammo: Int = 30
    @State private var magSize: Int = 30
    @State private var statusMessage = ""
    @State private var isFiring = false
    @State private var moveAxis: CGPoint = .zero
    @State private var dummyHits = 0
    @State private var livingDummies = 0
    @State private var resetToken = 0

    @State private var blueprints: [GunBlueprint] = []
    @State private var ammoBySlot: [Int] = [0, 0]
    @State private var magBySlot: [Int] = [30, 30]
    @State private var activeSlot: Int = 0

    @State private var trainingReady = false
    @State private var showTips = true
    @State private var showPause = false
    @State private var infiniteAmmo = true
    @State private var softDummies = true
    @State private var tipStep = 0
    @StateObject private var juice = CombatJuiceBus()

    private var activeOperator: OperatorProfile {
        roster.profile(id: settings.selectedOperatorID)
    }

    private var activeBlueprint: GunBlueprint? {
        guard blueprints.indices.contains(activeSlot) else { return blueprints.first }
        return blueprints[activeSlot]
    }

    private var canSwitchWeapons: Bool { blueprints.count > 1 }

    private var inputBlocked: Bool {
        !trainingReady || showPause || showTips
    }

    private let tipLines = [
        "MOVE with the left stick. Drag the right side of the screen to AIM.",
        "Hold FIRE to shoot. Tap RELOAD to refill. SWAP switches Armory guns.",
        "Soft dummies respawn — they won’t end Training. Use cover to practice LOS.",
        "Pick up yellow ammo crates and green medkits. Infinite Ammo keeps the mag full."
    ]

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if let blueprint = activeBlueprint {
                TrainingSceneView(
                    blueprint: blueprint,
                    health: $health,
                    ammo: $ammo,
                    statusMessage: $statusMessage,
                    isFiring: $isFiring,
                    moveAxis: $moveAxis,
                    dummyHits: $dummyHits,
                    livingDummies: $livingDummies,
                    combatEnabled: trainingReady && !showPause && !showTips,
                    infiniteAmmo: infiniteAmmo,
                    softDummiesEnabled: softDummies,
                    resetToken: resetToken,
                    hapticsEnabled: settings.hapticsEnabled,
                    soundVolume: settings.soundVolume,
                    magSize: magSize,
                    thirdPersonMode: settings.thirdPersonMode,
                    operatorProfile: activeOperator,
                    onCombatJuice: { juice.pulse($0) }
                )
                .id(resetToken)
                .ignoresSafeArea()
                .allowsHitTesting(trainingReady && !inputBlocked)

                CrosshairRing()
                    .allowsHitTesting(false)
                    .opacity(trainingReady && !showTips && !showPause ? 1 : 0.25)

                HitMarkerOverlay(juice: juice)
                    .opacity(trainingReady && !showTips && !showPause ? 1 : 0)

                VStack {
                    topHUD
                        .allowsHitTesting(true)
                    Spacer().allowsHitTesting(false)
                    Text(statusMessage)
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(GGGTheme.panel.opacity(0.88))
                        .overlay(Rectangle().stroke(GGGTheme.border, lineWidth: 1))
                        .opacity(trainingReady && !showTips ? 1 : 0)
                    bottomControls
                        .padding(.bottom, 16)
                        .allowsHitTesting(!inputBlocked)
                        .opacity(trainingReady && !showTips && !showPause ? 1 : 0.35)
                }
                .padding(.horizontal, 12)
            } else {
                Text("Equip a gun in the Armory first")
                    .foregroundStyle(.white)
            }

            if showTips {
                tipsOverlay.zIndex(40)
            }
            if showPause {
                pauseOverlay.zIndex(50)
            }
        }
        .navigationBarHidden(true)
        .statusBarHidden(true)
        .onAppear(perform: setup)
        .onDisappear {
            SoundService.shared.stopMissionMusic(fadeOut: true)
        }
        .onChange(of: ammo) { _, newValue in
            guard ammoBySlot.indices.contains(activeSlot) else { return }
            ammoBySlot[activeSlot] = newValue
        }
        .onChange(of: trainingReady) { _, ready in
            if ready {
                SoundService.shared.startMissionMusic(
                    enabled: settings.musicEnabled,
                    musicVolume: settings.musicVolume * 0.55,
                    intensity: .low
                )
            } else {
                SoundService.shared.stopMissionMusic(fadeOut: true)
            }
        }
        .onChange(of: settings.musicEnabled) { _, _ in
            guard trainingReady, !showPause else { return }
            if settings.musicEnabled {
                SoundService.shared.startMissionMusic(
                    enabled: true,
                    musicVolume: settings.musicVolume * 0.55,
                    intensity: .low
                )
            } else {
                SoundService.shared.stopMissionMusic(fadeOut: true)
            }
        }
        .onChange(of: dummyHits) { _, hits in
            if hits >= 1 {
                settings.markTrainingTipSeen()
            }
        }
    }

    private var topHUD: some View {
        VStack(spacing: 8) {
            HStack {
                Button {
                    exitToHub()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(10)
                        .background(Color.black.opacity(0.5))
                        .clipShape(Circle())
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("TRAINING")
                        .font(.system(size: 11, weight: .heavy, design: .monospaced))
                        .foregroundStyle(.white)
                    Text("\(activeOperator.callsign) · HITS \(dummyHits) · DUMMIES \(livingDummies)")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundStyle(GGGTheme.neonAccent)
                }

                Spacer()

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

                VStack(alignment: .trailing, spacing: 2) {
                    Text(activeBlueprint?.displayName.uppercased() ?? "WEAPON")
                        .font(.system(size: 10, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                        .lineLimit(1)
                    Text(infiniteAmmo ? "∞" : "\(ammo)")
                        .font(.system(size: 26, weight: .black, design: .rounded))
                        .foregroundStyle((!infiniteAmmo && ammo == 0) ? GGGTheme.danger : GGGTheme.neonAccent)
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
        }
        .padding(8)
        .background(GGGTheme.background.opacity(0.76))
        .overlay(Rectangle().stroke(GGGTheme.border.opacity(0.8), lineWidth: 1))
        .padding(.top, 4)
    }

    private var bottomControls: some View {
        HStack(alignment: .bottom, spacing: 6) {
            VStack(alignment: .leading, spacing: 4) {
                Text("MOVE")
                    .font(.system(size: 10, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
                    .padding(.leading, 18)
                VirtualJoystick(axis: $moveAxis, diameter: 120)
            }

            Spacer(minLength: 4).allowsHitTesting(false)

            Button(action: reloadMag) {
                VStack(spacing: 3) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 16, weight: .bold))
                    Text("RELOAD")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                }
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Circle().fill(GGGTheme.panelElevated))
                .overlay(Circle().stroke(GGGTheme.neonAmber.opacity(0.55), lineWidth: 2))
            }
            .buttonStyle(.plain)

            if canSwitchWeapons {
                Button(action: switchWeapon) {
                    VStack(spacing: 3) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.system(size: 18, weight: .bold))
                        Text("SWAP")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                    }
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Circle().fill(GGGTheme.panelElevated))
                    .overlay(Circle().stroke(GGGTheme.neonAccent.opacity(0.55), lineWidth: 2))
                }
                .buttonStyle(.plain)
            }

            Text("FIRE")
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundStyle(.white)
                .frame(width: 88, height: 88)
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

    private var tipsOverlay: some View {
        ZStack {
            Color.black.opacity(0.78).ignoresSafeArea()
            VStack(spacing: 18) {
                Text("TRAINING BAY")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundStyle(Color(hex: "#2ECC71")!)

                Text(tipLines[min(tipStep, tipLines.count - 1)])
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 28)
                    .frame(minHeight: 72)

                HStack(spacing: 8) {
                    ForEach(0..<tipLines.count, id: \.self) { i in
                        Circle()
                            .fill(i == tipStep ? Color(hex: "#2ECC71")! : Color.white.opacity(0.25))
                            .frame(width: 8, height: 8)
                    }
                }

                if tipStep < tipLines.count - 1 {
                    Button("NEXT TIP") {
                        tipStep += 1
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: Color(hex: "#2ECC71")!))
                    .padding(.horizontal, 40)
                } else {
                    Button("ENTER BAY") {
                        showTips = false
                        settings.markTrainingTipSeen()
                        unlockTraining()
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: Color(hex: "#2ECC71")!))
                    .padding(.horizontal, 40)
                }

                Button("Skip tips") {
                    showTips = false
                    settings.markTrainingTipSeen()
                    unlockTraining()
                }
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
            }
            .padding(.vertical, 32)
        }
    }

    private var pauseOverlay: some View {
        ZStack {
            Color.black.opacity(0.78).ignoresSafeArea()
            VStack(spacing: 14) {
                Text("PAUSED")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundStyle(.white)

                Toggle(isOn: $infiniteAmmo) {
                    Text("Infinite ammo")
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(.white)
                }
                .tint(Color(hex: "#2ECC71")!)
                .padding(.horizontal, 36)

                Toggle(isOn: $softDummies) {
                    Text("Soft dummies (respawn)")
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(.white)
                }
                .tint(Color(hex: "#2ECC71")!)
                .padding(.horizontal, 36)

                Button("RESUME") {
                    showPause = false
                }
                .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
                .padding(.horizontal, 40)

                Button("RESTART") {
                    softReset()
                    showPause = false
                }
                .buttonStyle(GhostHubButtonStyle())
                .padding(.horizontal, 40)

                Button("Show tips") {
                    tipStep = 0
                    showTips = true
                    showPause = false
                    trainingReady = false
                    isFiring = false
                    moveAxis = .zero
                    SoundService.shared.stopMissionMusic(fadeOut: true)
                }
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(GGGTheme.steel)

                Button("Exit to Hub") {
                    exitToHub()
                }
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(GGGTheme.danger)
            }
            .padding(.vertical, 28)
        }
    }

    private func setup() {
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
                resolved = [GunBlueprint(name: "Issue Carbine", bodyType: .rifle, premadeSkin: .matteBlack)]
            }
        }

        blueprints = resolved
        magBySlot = resolved.map(\.magCapacity)
        while magBySlot.count < 2 { magBySlot.append(magBySlot[0]) }
        ammoBySlot = magBySlot
        activeSlot = 0
        magSize = magBySlot[0]
        ammo = ammoBySlot[0]

        let op = activeOperator
        maxHealth = op.maxHealth
        health = op.maxHealth
        statusMessage = "\(op.callsign) — TRAINING"

        tipStep = 0
        showTips = !settings.hasSeenTrainingTip
        trainingReady = false
        showPause = false

        if !showTips {
            unlockTraining()
        }
    }

    private func unlockTraining() {
        DispatchQueue.main.async {
            guard !showTips, !showPause else { return }
            trainingReady = true
            if statusMessage.isEmpty || statusMessage.contains("TRAINING") {
                statusMessage = "WEAPONS FREE — PRACTICE"
            }
        }
    }

    private func softReset() {
        isFiring = false
        moveAxis = .zero
        health = maxHealth
        for i in ammoBySlot.indices {
            ammoBySlot[i] = magBySlot[i]
        }
        ammo = ammoBySlot[activeSlot]
        dummyHits = 0
        resetToken &+= 1
        statusMessage = "RESTART — BACK ON THE LINE"
        SoundService.shared.stopMissionMusic(fadeOut: false)
        if trainingReady {
            SoundService.shared.startMissionMusic(
                enabled: settings.musicEnabled,
                musicVolume: settings.musicVolume * 0.55,
                intensity: .low
            )
        }
    }

    private func reloadMag() {
        guard !inputBlocked else { return }
        isFiring = false
        ammo = magSize
        if ammoBySlot.indices.contains(activeSlot) {
            ammoBySlot[activeSlot] = magSize
        }
        statusMessage = "RELOADED"
        HapticsService.select(enabled: settings.hapticsEnabled)
        SoundService.shared.playReload(volume: settings.soundVolume)
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

    private func exitToHub() {
        isFiring = false
        moveAxis = .zero
        trainingReady = false
        SoundService.shared.stopMissionMusic(fadeOut: false)
        appState.path = NavigationPath()
    }
}

private struct CrosshairRing: View {
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
