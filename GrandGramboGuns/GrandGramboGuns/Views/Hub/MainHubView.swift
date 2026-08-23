// MainHubView.swift
// Home — Shake to Shoot + Range as primary play modes; customize features secondary.
// Cold start: Loading splash → (optional) How to Play → Hub.

import SwiftUI

struct MainHubView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var campaign: CampaignProgressStore
    @EnvironmentObject private var ranks: RankProgressStore
    @EnvironmentObject private var coins: CombatCoinStore
    @EnvironmentObject private var roster: OperatorRosterStore
    @State private var pulse = false
    @State private var showHowToPlay = false
    @State private var showLoading = true
    @State private var loadProgress: Double = 0
    @State private var loadStatus = "Arming systems"
    @State private var didRunColdStart = false
    @State private var showDLCLockedAlert = false

    private let dlcAccent = Color(hex: "#8A7D9C")!

    private var playerCallsign: String {
        roster.profile(id: settings.selectedOperatorID).callsign
    }

    var body: some View {
        ZStack {
            GGGTheme.hubGradient.ignoresSafeArea()

            // Soft clean wash — no hex/static/grain overlays.
            RadialGradient(
                colors: [
                    GGGTheme.friendly.opacity(0.10),
                    Color.clear
                ],
                center: .topTrailing,
                startRadius: 40,
                endRadius: 420
            )
            .ignoresSafeArea()
            .allowsHitTesting(false)

            ScrollView {
                LazyVStack(spacing: 10) {
                    commandHeader
                    commandStatusDeck

                    TacticalStatusStrip(
                        text: "SIM-NET // MP + BR use AI practice operators — no live matchmaking"
                    )

                    TacticalSectionLabel(code: "01", title: "DEPLOYMENT ORDERS")

                    VStack(spacing: 7) {
                        hubButton("Story Mode", code: "OP-IM", icon: "book.closed.fill", accent: GGGTheme.danger, subtitle: "Iron Meridian campaign", status: "ACTIVE") {
                            appState.navigate(to: .storyMode)
                        }
                        ghostLatticeHubButton
                        hubButton("Training", code: "TRN-01", icon: "figure.walk", accent: GGGTheme.neonAccent, subtitle: "Weapons and movement drill", status: "READY") {
                            appState.navigate(to: .training)
                        }
                        hubButton("Battle Royale", code: "BR-SIM", icon: "circle.dashed", accent: GGGTheme.neonAmber, subtitle: "AI operators · storm exercise", status: "SIM") {
                            appState.navigate(to: .battleRoyale)
                        }
                        hubButton("Multiplayer", code: "MP-SIM", icon: "person.3.fill", accent: GGGTheme.friendly, subtitle: "AI arena · TDM / quick match", status: "SIM") {
                            appState.navigate(to: .multiplayer)
                        }
                        hubButton("Shake to Shoot", code: "DRL-02", icon: "iphone.radiowaves.left.and.right", accent: GGGTheme.danger, subtitle: "Motion-fire field drill", status: "READY") {
                            appState.navigate(to: .shakeShoot)
                        }
                        hubButton("Shooting Range", code: "RNG-07", icon: "target", accent: GGGTheme.neonAmber, subtitle: "Live target qualification", status: "OPEN") {
                            appState.navigate(to: .range)
                        }
                    }

                    TacticalSectionLabel(code: "02", title: "QUARTERMASTER + PERSONNEL")
                        .padding(.top, 8)

                    VStack(spacing: 7) {
                        hubButton("Shop", code: "QM-01", icon: "cart.fill", accent: GGGTheme.neonAmber, subtitle: "Weapons, parts, operators") {
                            appState.navigate(to: .shop)
                        }
                        hubButton("Friends", code: "COM-02", icon: "person.badge.plus", accent: GGGTheme.friendly, subtitle: "Local roster and invites") {
                            appState.navigate(to: .friends)
                        }
                        hubButton("Characters", code: "PER-03", icon: "person.3.fill", accent: GGGTheme.olive, subtitle: "Select or create operator") {
                            appState.navigate(to: .characters)
                        }
                        hubButton("Armory", code: "ARM-04", icon: "square.grid.2x2.fill", accent: GGGTheme.neonAccent, subtitle: "Select primary and secondary") {
                            appState.navigate(to: .armory)
                        }
                        hubButton("Build Gun", code: "WPN-05", icon: "wrench.and.screwdriver.fill", accent: GGGTheme.friendly, subtitle: "Bodies and attachments") {
                            appState.navigate(to: .buildGun)
                        }
                        hubButton("Paint Shop", code: "CAM-06", icon: "paintpalette.fill", accent: GGGTheme.olive, subtitle: "Finish and camouflage") {
                            appState.navigate(to: .paintShop)
                        }
                        hubButton("Skins", code: "CAM-07", icon: "sparkles", accent: GGGTheme.neonAmber, subtitle: "Issued weapon finishes") {
                            appState.navigate(to: .skins)
                        }
                    }

                    HStack(spacing: 20) {
                        Button {
                            showHowToPlay = true
                        } label: {
                            Label("How to Play", systemImage: "questionmark.circle.fill")
                                .font(.system(size: 12, weight: .bold, design: .monospaced))
                                .foregroundStyle(GGGTheme.neonAccent)
                        }

                        Button {
                            appState.navigate(to: .settings)
                        } label: {
                            Label("Settings", systemImage: "gearshape.fill")
                                .font(.system(size: 12, weight: .bold, design: .monospaced))
                                .foregroundStyle(GGGTheme.steel)
                        }
                    }
                    .padding(.top, 12)
                    .padding(.bottom, 28)
                }
                .padding(.horizontal, 16)
                // The full-bleed background makes this ScrollView occupy the
                // sensor area; reserve explicit command-header clearance.
                .padding(.top, 58)
            }

            if showLoading {
                LoadingSplashView(progress: loadProgress, statusLine: loadStatus)
                    .transition(.opacity)
                    .zIndex(10)
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            pulse = true
            syncHubMusic()
        }
        .onChange(of: appState.path.count) { _, count in
            if count == 0 {
                syncHubMusic()
            } else {
                SoundService.shared.stopHubMusic(fadeOut: true)
            }
        }
        .onChange(of: settings.musicEnabled) { _, _ in
            syncHubMusic()
        }
        .onChange(of: settings.musicVolume) { _, _ in
            guard appState.path.isEmpty, !showLoading else { return }
            SoundService.shared.updateHubMusicVolume(
                enabled: settings.musicEnabled,
                musicVolume: settings.musicVolume
            )
        }
        .onChange(of: showLoading) { _, loading in
            if !loading { syncHubMusic() }
        }
        .task {
            guard !didRunColdStart else { return }
            didRunColdStart = true
            await runColdStartSequence()
        }
        .fullScreenCover(isPresented: $showHowToPlay) {
            HowToPlayTutorialView {
                showHowToPlay = false
            }
            .environmentObject(settings)
        }
        .alert("Ghost Lattice Locked", isPresented: $showDLCLockedAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(DLCStory.lockedDetail)
        }
    }

    private var commandHeader: some View {
        HStack(spacing: 12) {
            GunSilhouetteLogo()
                .frame(width: 92, height: 42)
                .scaleEffect(pulse ? 1.015 : 0.985)
                .shadow(color: GGGTheme.logoGreen.opacity(pulse ? 0.55 : 0.28), radius: pulse ? 14 : 7)
                .animation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true), value: pulse)

            VStack(alignment: .leading, spacing: 3) {
                Text("GGG // TACTICAL OPERATIONS")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundStyle(GGGTheme.friendly)
                    .tracking(1)
                Text("GRAND GRAMBO GUNS")
                    .font(.system(size: 19, weight: .black, design: .monospaced))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Text("FIELD COMMAND // MOBILE UNIT")
                    .font(.system(size: 9, weight: .medium, design: .monospaced))
                    .foregroundStyle(GGGTheme.steel)
                    .tracking(0.6)
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 6)
        .accessibilityElement(children: .combine)
    }

    private var commandStatusDeck: some View {
        VStack(spacing: 8) {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("ACTIVE OPERATOR")
                        .font(.system(size: 8, weight: .bold, design: .monospaced))
                        .foregroundStyle(GGGTheme.steelDim)
                        .tracking(0.8)
                    Text(playerCallsign.uppercased())
                        .font(.system(size: 15, weight: .black, design: .monospaced))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                }
                Spacer(minLength: 4)
                RankBadgeChip(rank: ranks.currentRank, compact: true)
                HStack(spacing: 5) {
                    Image(systemName: "circle.hexagongrid.fill")
                        .foregroundStyle(GGGTheme.neonAmber)
                    Text("\(coins.balance)")
                        .monospacedDigit()
                }
                .font(.system(size: 12, weight: .black, design: .monospaced))
                .foregroundStyle(.white)
            }

            HStack(spacing: 8) {
                Text("XP \(ranks.totalXP)")
                    .foregroundStyle(GGGTheme.steel)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Rectangle().fill(GGGTheme.gunmetal)
                        Rectangle()
                            .fill(ranks.currentRank.badgeColor)
                            .frame(width: geo.size.width * CGFloat(ranks.progressToNextRank))
                    }
                }
                .frame(height: 4)
                if let needed = ranks.xpNeededForNextRank {
                    Text("\(needed) TO NEXT")
                        .foregroundStyle(GGGTheme.steelDim)
                } else {
                    Text("MAX")
                        .foregroundStyle(GGGTheme.neonAccent)
                }
            }
            .font(.system(size: 8, weight: .bold, design: .monospaced))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .tacticalPanel(accent: ranks.currentRank.badgeColor)
        .accessibilityElement(children: .combine)
    }

    private var ghostLatticeHubButton: some View {
        Button {
            if campaign.isDLCUnlocked {
                appState.pendingStoryDLCTab = true
                appState.navigate(to: .storyMode)
            } else {
                showDLCLockedAlert = true
            }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: campaign.isDLCUnlocked ? "lock.open.fill" : "lock.fill")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(campaign.isDLCUnlocked ? dlcAccent : GGGTheme.steelDim)
                    .frame(width: 34, height: 34)
                    .background(GGGTheme.gunmetal.opacity(0.8))
                VStack(alignment: .leading, spacing: 3) {
                    Text("DLC-GL // GHOST LATTICE")
                        .font(.system(size: 13, weight: .black, design: .monospaced))
                        .foregroundStyle(campaign.isDLCUnlocked ? .white : GGGTheme.steel)
                    Text(
                        campaign.isDLCUnlocked
                            ? "ORACLE resurgence campaign"
                            : DLCStory.lockedTease
                    )
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundStyle(campaign.isDLCUnlocked ? GGGTheme.subtitle : GGGTheme.steelDim)
                    .lineLimit(1)
                }
                Spacer()
                if campaign.isDLCUnlocked {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .bold))
                        .opacity(0.7)
                } else {
                    Text("LOCKED")
                        .font(.system(size: 8, weight: .heavy, design: .monospaced))
                        .foregroundStyle(GGGTheme.steel)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 4)
                        .background(GGGTheme.gunmetal)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .frame(minHeight: 56)
            .opacity(campaign.isDLCUnlocked ? 1 : 0.72)
            .tacticalPanel(accent: campaign.isDLCUnlocked ? dlcAccent : GGGTheme.steelDim)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(
            campaign.isDLCUnlocked
                ? "Enter Ghost Lattice DLC"
                : "Ghost Lattice locked — finish Meridian Fall"
        )
    }

    /// Always finishes: min ~4.2s, soft cap ~4.8s, optional torch warm-up in parallel.
    private func runColdStartSequence() async {
        let minDuration: TimeInterval = 4.2
        let maxDuration: TimeInterval = 4.8
        let start = Date()
        let warmTask = Task { await FlashlightService.warmUp() }

        loadStatus = "Arming systems"
        withAnimation(.easeInOut(duration: 0.95)) {
            loadProgress = 0.22
        }

        try? await Task.sleep(nanoseconds: 1_100_000_000)
        loadStatus = "Calibrating field kit"
        withAnimation(.easeInOut(duration: 1.0)) {
            loadProgress = 0.52
        }

        try? await Task.sleep(nanoseconds: 1_150_000_000)
        loadStatus = "Standing by"
        withAnimation(.easeInOut(duration: 0.9)) {
            loadProgress = 0.78
        }

        try? await Task.sleep(nanoseconds: 1_000_000_000)
        withAnimation(.easeInOut(duration: 0.7)) {
            loadProgress = 0.90
        }

        // Wait out remaining minimum, then brief grace for warm-up up to max.
        let elapsed = Date().timeIntervalSince(start)
        let minRemaining = max(0, minDuration - elapsed)
        if minRemaining > 0 {
            try? await Task.sleep(nanoseconds: UInt64(minRemaining * 1_000_000_000))
        }

        let afterMin = Date().timeIntervalSince(start)
        let grace = max(0, maxDuration - afterMin)
        if grace > 0 && !warmTask.isCancelled {
            await withTaskGroup(of: Void.self) { group in
                group.addTask {
                    _ = await warmTask.result
                }
                group.addTask {
                    try? await Task.sleep(nanoseconds: UInt64(grace * 1_000_000_000))
                }
                await group.next()
                group.cancelAll()
            }
        }
        warmTask.cancel()

        loadStatus = "Ready"
        withAnimation(.easeOut(duration: 0.35)) {
            loadProgress = 1.0
        }
        try? await Task.sleep(nanoseconds: 220_000_000)

        withAnimation(.easeOut(duration: 0.35)) {
            showLoading = false
        }

        // Tutorial only after splash — skip if already completed.
        if !settings.hasCompletedHowToPlayTutorial {
            try? await Task.sleep(nanoseconds: 280_000_000)
            guard !settings.hasCompletedHowToPlayTutorial, !showHowToPlay else { return }
            showHowToPlay = true
        }
    }

    private func hubButton(
        _ title: String,
        code: String,
        icon: String,
        accent: Color,
        subtitle: String? = nil,
        status: String = "READY",
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(accent)
                    .frame(width: 34, height: 34)
                    .background(GGGTheme.gunmetal.opacity(0.8))
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(code) // \(title.uppercased())")
                        .font(.system(size: 13, weight: .black, design: .monospaced))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    if let subtitle {
                        Text(subtitle)
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                            .foregroundStyle(GGGTheme.subtitle)
                            .lineLimit(1)
                    }
                }
                Spacer()
                Text(status)
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundStyle(accent)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 3)
                    .overlay(Rectangle().stroke(accent.opacity(0.55), lineWidth: 1))
                Image(systemName: "chevron.right")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(GGGTheme.steelDim)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .frame(minHeight: 56)
            .tacticalPanel(accent: accent)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(title), \(subtitle ?? ""), \(status)")
    }

    private func syncHubMusic() {
        guard appState.path.isEmpty, !showLoading else {
            SoundService.shared.stopHubMusic(fadeOut: true)
            return
        }
        SoundService.shared.startHubMusic(
            enabled: settings.musicEnabled,
            musicVolume: settings.musicVolume
        )
    }
}

// MARK: - Logo / background

struct GunSilhouetteLogo: View {
    var body: some View {
        Canvas { context, size in
            let w = size.width
            let h = size.height
            var path = Path()
            path.move(to: CGPoint(x: w * 0.12, y: h * 0.55))
            path.addLine(to: CGPoint(x: w * 0.30, y: h * 0.55))
            path.addLine(to: CGPoint(x: w * 0.34, y: h * 0.35))
            path.addLine(to: CGPoint(x: w * 0.78, y: h * 0.35))
            path.addLine(to: CGPoint(x: w * 0.88, y: h * 0.42))
            path.addLine(to: CGPoint(x: w * 0.88, y: h * 0.52))
            path.addLine(to: CGPoint(x: w * 0.55, y: h * 0.52))
            path.addLine(to: CGPoint(x: w * 0.50, y: h * 0.70))
            path.addLine(to: CGPoint(x: w * 0.38, y: h * 0.70))
            path.addLine(to: CGPoint(x: w * 0.34, y: h * 0.55))
            path.addLine(to: CGPoint(x: w * 0.12, y: h * 0.55))
            path.closeSubpath()
            context.fill(path, with: .color(GGGTheme.logoGreen))
            context.stroke(path, with: .color(Color.white.opacity(0.35)), lineWidth: 2)
        }
        .aspectRatio(2.4, contentMode: .fit)
    }
}
