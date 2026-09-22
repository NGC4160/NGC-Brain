// BattleRoyaleLobbyView.swift
// BR lobby: squad size + combatant count, AI practice fill, then drop.

import SwiftUI

struct BattleRoyaleLobbyView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var roster: OperatorRosterStore
    @EnvironmentObject private var friends: FriendsStore

    @StateObject private var session = MultiplayerSession(
        config: .battleRoyale(squadSize: .solos, totalCombatants: 16)
    )
    @State private var squadSize: SquadSize = .solos
    @State private var combatants: Double = 16
    @State private var navigateToMatch = false
    @State private var showInviteSheet = false
    @State private var inviteBanner: String?

    private var playerCallsign: String {
        roster.profile(id: settings.selectedOperatorID).callsign
    }

    private var canDeploy: Bool {
        if case .ready = session.phase { return true }
        return false
    }

    var body: some View {
        ZStack {
            GGGTheme.hubGradient.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    header

                    TacticalStatusStrip(text: "SIM-NET // \(session.config.practiceLobbyNote)")

                    squadPicker
                    combatantSlider
                    inviteFriendSection
                    lobbyStatus
                    squadPreview

                    deployButton
                }
                .padding(16)
            }

            if let inviteBanner {
                VStack {
                    Spacer()
                    Text(inviteBanner)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.neonAccent)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(GGGTheme.panelElevated.opacity(0.96))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .padding(.bottom, 28)
                }
                .allowsHitTesting(false)
            }
        }
        .navigationBarHidden(true)
        .onChange(of: squadSize) { _, newValue in
            refreshConfig(squad: newValue, total: Int(combatants))
        }
        .onChange(of: navigateToMatch) { _, inMatch in
            if !inMatch, session.phase == .inMatch {
                session.returnFromMatch()
            }
        }
        .navigationDestination(isPresented: $navigateToMatch) {
            BattleRoyaleMatchView(config: session.config, teammateCallsigns: Array(session.playerSquadCallsigns.dropFirst()))
        }
        .sheet(isPresented: $showInviteSheet) {
            LocalFriendInviteSheet { friend in
                friends.sendLocalInvite(to: friend)
                showInviteSheet = false
                flashInvite("Invite sent (local) — \(friend.displayName)")
                HapticsService.select(enabled: settings.hapticsEnabled)
            }
            .environmentObject(friends)
            .presentationDetents([.medium, .large])
        }
    }

    private var inviteFriendSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("PARTY")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .tracking(1.5)

            if let name = friends.pendingLocalInviteName {
                HStack {
                    Text("Invited: \(name)")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(hex: "#4DA3FF")!)
                    Spacer()
                    Button("Clear") {
                        friends.clearLocalInvite()
                    }
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
                }
            }

            Button {
                showInviteSheet = true
            } label: {
                Label("Invite friend", systemImage: "person.badge.plus")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(GhostHubButtonStyle())

            Text("Local only — no push. Online invites coming later.")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
        }
    }

    private func flashInvite(_ message: String) {
        withAnimation { inviteBanner = message }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
            withAnimation {
                if inviteBanner == message { inviteBanner = nil }
            }
        }
    }

    private var header: some View {
        HStack {
            Button {
                session.cancelSearch()
                appState.path = NavigationPath()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(10)
                    .background(Color.black.opacity(0.45))
                    .clipShape(Circle())
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("BATTLE ROYALE")
                    .font(.system(size: 21, weight: .black, design: .monospaced))
                    .foregroundStyle(.white)
                Text("AI practice — last squad standing · shrinking storm")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundStyle(GGGTheme.subtitle)
            }
            Spacer()
        }
    }

    private var squadPicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("SQUAD SIZE")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .tracking(1.5)

            HStack(spacing: 8) {
                ForEach(SquadSize.allCases) { size in
                    Button {
                        guard session.phase == .idle || session.phase == .ready || session.phase == .ended else { return }
                        squadSize = size
                        HapticsService.select(enabled: settings.hapticsEnabled)
                    } label: {
                        VStack(spacing: 4) {
                            Text(size.displayName)
                                .font(.system(size: 13, weight: .heavy, design: .rounded))
                            Text(size.shortLabel)
                                .font(.system(size: 18, weight: .black, design: .rounded))
                        }
                        .foregroundStyle(squadSize == size ? GGGTheme.background : .white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            ChamferedRectangle(cut: 7)
                                .fill(squadSize == size ? GGGTheme.neonAccent : Color.white.opacity(0.1))
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            Text(squadSize.blurb)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
        }
    }

    private var combatantSlider: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("COMBATANTS")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
                Spacer()
                Text("\(Int(combatants))")
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAccent)
            }
            Slider(value: $combatants, in: 12...24, step: 4) { editing in
                if !editing {
                    refreshConfig(squad: squadSize, total: Int(combatants))
                }
            }
            .tint(GGGTheme.neonAccent)
            .disabled(!(session.phase == .idle || session.phase == .ready || session.phase == .ended))
            Text("Capped for SceneKit stability — not a 100-player lobby.")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
        }
    }

    private var lobbyStatus: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(session.statusLine)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            if case .searching = session.phase {
                ProgressView()
                    .tint(GGGTheme.neonAccent)
            }
            if case .filling(let joined, let needed) = session.phase {
                ProgressView(value: Double(joined), total: Double(max(1, needed)))
                    .tint(GGGTheme.neonAccent)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .tacticalPanel(accent: GGGTheme.neonAmber)
    }

    private var squadPreview: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("YOUR SQUAD")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
            if session.playerSquadCallsigns.isEmpty {
                Text(playerCallsign)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(GGGTheme.friendly)
            } else {
                ForEach(session.playerSquadCallsigns, id: \.self) { name in
                    Text(name)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.friendly)
                }
            }
            if !session.enemySquadLabels.isEmpty {
                Text("ENEMY SQUADS: \(session.enemySquadLabels.joined(separator: " · "))")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(GGGTheme.danger)
                    .padding(.top, 4)
            }
        }
    }

    private var deployButton: some View {
        VStack(spacing: 10) {
            if session.phase == .idle || session.phase == .ended || session.phase == .ready {
                if !canDeploy {
                    Button("FIND MATCH") {
                        refreshConfig(squad: squadSize, total: Int(combatants))
                        let pool = OperatorProfile.all.map(\.callsign)
                        session.startPracticeSearch(
                            playerCallsign: playerCallsign,
                            availableCallsigns: pool,
                            preferredTeammate: friends.pendingLocalInviteName
                        )
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.danger))
                } else {
                    Button("DROP IN") {
                        session.markInMatch()
                        navigateToMatch = true
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
                }
            } else {
                Button("CANCEL") {
                    session.cancelSearch()
                }
                .buttonStyle(GhostHubButtonStyle())
            }
        }
        .padding(.top, 8)
        .padding(.bottom, 28)
    }

    private func refreshConfig(squad: SquadSize, total: Int) {
        let cfg = ArenaMatchConfig.battleRoyale(squadSize: squad, totalCombatants: total)
        combatants = Double(cfg.totalCombatants)
        session.updateConfig(cfg)
    }
}
