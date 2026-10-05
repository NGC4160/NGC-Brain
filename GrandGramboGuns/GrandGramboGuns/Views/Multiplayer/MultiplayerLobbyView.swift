// MultiplayerLobbyView.swift
// Practice multiplayer lobby — TDM/Quick Match + 1v1…4v4 team modes, AI fill.

import SwiftUI

struct MultiplayerLobbyView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var roster: OperatorRosterStore
    @EnvironmentObject private var friends: FriendsStore

    @StateObject private var session = MultiplayerSession(
        config: .multiplayer(kind: .teamDeathmatch, squadSize: .solos)
    )
    @State private var mode: ArenaMatchKind = .teamDeathmatch
    @State private var squadSize: SquadSize = .solos
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

                    modePicker
                    teamModePicker
                    inviteFriendSection
                    lobbyStatus
                    teamPreview
                    actionButtons
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
        .onAppear { refreshConfig() }
        .onChange(of: mode) { _, _ in refreshConfig() }
        .onChange(of: squadSize) { _, _ in refreshConfig() }
        .onChange(of: navigateToMatch) { _, inMatch in
            if !inMatch, session.phase == .inMatch {
                session.returnFromMatch()
            }
        }
        .navigationDestination(isPresented: $navigateToMatch) {
            MultiplayerMatchView(
                config: session.config,
                teammateCallsigns: Array(session.playerSquadCallsigns.dropFirst())
            )
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
                Text("MULTIPLAYER")
                    .font(.system(size: 21, weight: .black, design: .monospaced))
                    .foregroundStyle(.white)
                Text("Local AI arena — practice lobbies only (not online)")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundStyle(GGGTheme.subtitle)
            }
            Spacer()
        }
    }

    private var modePicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("MODE")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .tracking(1.5)

            ForEach([ArenaMatchKind.teamDeathmatch, .quickMatch], id: \.self) { m in
                Button {
                    guard session.phase == .idle || session.phase == .ready || session.phase == .ended else { return }
                    mode = m
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(m.displayName.uppercased())
                                .font(.system(size: 14, weight: .bold, design: .monospaced))
                            Text(m.subtitle)
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(Color.white.opacity(0.75))
                        }
                        Spacer()
                        if mode == m {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(GGGTheme.neonAccent)
                        }
                    }
                    .foregroundStyle(.white)
                    .padding(12)
                    .background(
                        ChamferedRectangle(cut: 7)
                            .fill(mode == m ? Color.white.opacity(0.14) : Color.white.opacity(0.06))
                    )
                    .overlay(
                        ChamferedRectangle(cut: 7)
                            .stroke(mode == m ? GGGTheme.neonAccent.opacity(0.6) : Color.clear, lineWidth: 1.5)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var teamModePicker: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("TEAM MODE")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .tracking(1.5)

            HStack(spacing: 8) {
                ForEach(SquadSize.allCases) { size in
                    Button {
                        guard session.phase == .idle || session.phase == .ready || session.phase == .ended else { return }
                        squadSize = size
                    } label: {
                        Text(size.teamModeLabel)
                            .font(.system(size: 14, weight: .heavy, design: .rounded))
                            .foregroundStyle(squadSize == size ? GGGTheme.background : .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(squadSize == size ? GGGTheme.friendly : Color.white.opacity(0.1))
                            )
                    }
                    .buttonStyle(.plain)
                }
            }

            Text(squadSize.teamModeBlurb)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
        }
    }

    private var lobbyStatus: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(session.statusLine)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            if case .searching = session.phase {
                ProgressView().tint(GGGTheme.neonAccent)
            }
            if case .filling(let joined, let needed) = session.phase {
                ProgressView(value: Double(joined), total: Double(max(1, needed)))
                    .tint(GGGTheme.friendly)
            }
            Text("\(session.config.squadSize.teamModeLabel) · kill goal \(session.config.killGoal) · \(session.config.matchDurationSeconds)s · \(session.config.totalCombatants) AI bodies max")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
            Text("Win: wipe Team B or reach the kill goal first. Climb the lookout ramps for high ground.")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(Color.white.opacity(0.7))
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .tacticalPanel(accent: GGGTheme.friendly)
    }

    private var teamPreview: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text("TEAM A · \(session.config.teamASize)")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.friendly)
                ForEach(session.playerSquadCallsigns.isEmpty ? [playerCallsign] : session.playerSquadCallsigns, id: \.self) { name in
                    Text(name)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.friendly)
                }
                if session.playerSquadCallsigns.count < session.config.teamASize,
                   session.phase == .idle || session.phase == .ended {
                    Text("+ \(session.config.squadSize.teammateCount) AI teammate(s) on search")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(alignment: .leading, spacing: 6) {
                Text("TEAM B · \(session.config.teamBSize)")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.danger)
                if session.enemySquadLabels.isEmpty {
                    Text("\(session.config.teamBSize) AI opponents")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.danger.opacity(0.85))
                } else {
                    ForEach(session.enemySquadLabels, id: \.self) { name in
                        Text(name)
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(GGGTheme.danger)
                    }
                    Text("\(session.config.teamBSize) AI operators")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var actionButtons: some View {
        VStack(spacing: 10) {
            if session.phase == .idle || session.phase == .ended || session.phase == .ready {
                if !canDeploy {
                    Button("SEARCH") {
                        refreshConfig()
                        session.startPracticeSearch(
                            playerCallsign: playerCallsign,
                            availableCallsigns: OperatorProfile.all.map(\.callsign),
                            preferredTeammate: friends.pendingLocalInviteName
                        )
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.friendly))
                } else {
                    Button("START MATCH") {
                        session.markInMatch()
                        navigateToMatch = true
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
                }
            } else {
                Button("CANCEL") { session.cancelSearch() }
                    .buttonStyle(GhostHubButtonStyle())
            }
        }
        .padding(.top, 8)
        .padding(.bottom, 28)
    }

    private func refreshConfig() {
        session.updateConfig(.multiplayer(
            kind: mode,
            squadSize: squadSize
        ))
    }
}
