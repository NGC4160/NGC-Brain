// FriendsView.swift
// Local friends list — friend codes, add/remove. Honest about device-only storage.

import SwiftUI

struct FriendsView: View {
    @EnvironmentObject private var friends: FriendsStore
    @EnvironmentObject private var settings: SettingsStore

    @State private var addCode = ""
    @State private var addName = ""
    @State private var banner: String?
    @State private var bannerIsError = false
    @State private var copied = false
    @State private var confirmRemove: FriendEntry?

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    honestyBanner
                    myCodeCard
                    addFriendCard
                    friendsListSection
                }
                .padding(20)
                .padding(.bottom, 28)
            }

            if let banner {
                VStack {
                    Spacer()
                    Text(banner)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(bannerIsError ? GGGTheme.danger : GGGTheme.neonAccent)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(GGGTheme.panelElevated.opacity(0.96))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .padding(.bottom, 28)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .allowsHitTesting(false)
            }
        }
        .navigationTitle("Friends")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .confirmationDialog(
            confirmRemove.map { "Remove \($0.displayName)?" } ?? "Remove friend?",
            isPresented: Binding(
                get: { confirmRemove != nil },
                set: { if !$0 { confirmRemove = nil } }
            ),
            titleVisibility: .visible
        ) {
            if let entry = confirmRemove {
                Button("Remove", role: .destructive) {
                    friends.removeFriend(id: entry.id)
                    HapticsService.select(enabled: settings.hapticsEnabled)
                    confirmRemove = nil
                    flash("Removed \(entry.displayName)", error: false)
                }
                Button("Cancel", role: .cancel) { confirmRemove = nil }
            }
        }
    }

    private var honestyBanner: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "info.circle.fill")
                .foregroundStyle(GGGTheme.neonAmber)
            Text("Friends are saved on this device. Online invites coming later.")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(GGGTheme.panel)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(GGGTheme.neonAmber.opacity(0.35), lineWidth: 1)
        )
    }

    private var myCodeCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("YOUR FRIEND CODE")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .tracking(1.5)

            HStack {
                Text(friends.myFriendCode)
                    .font(.system(size: 26, weight: .black, design: .monospaced))
                    .foregroundStyle(GGGTheme.neonAccent)
                    .textSelection(.enabled)
                Spacer()
                Button {
                    friends.copyMyCodeToPasteboard()
                    copied = true
                    HapticsService.select(enabled: settings.hapticsEnabled)
                    flash("Copied \(friends.myFriendCode)", error: false)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
                        copied = false
                    }
                } label: {
                    Label(copied ? "Copied" : "Copy", systemImage: copied ? "checkmark" : "doc.on.doc")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.background)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(GGGTheme.neonAccent)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            Text("Share this code so others can add you locally on their device.")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(GGGTheme.panelElevated)
        )
    }

    private var addFriendCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ADD FRIEND")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .tracking(1.5)

            TextField("Friend code (GGG-XXXXXX)", text: $addCode)
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
                .font(.system(size: 16, weight: .semibold, design: .monospaced))
                .padding(12)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color.black.opacity(0.35)))
                .foregroundStyle(.white)

            TextField("Display name (optional)", text: $addName)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled()
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .padding(12)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color.black.opacity(0.35)))
                .foregroundStyle(.white)

            Button("ADD FRIEND") {
                submitAdd()
            }
            .buttonStyle(NeonHubButtonStyle(accent: Color(hex: "#4DA3FF")!))
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(GGGTheme.panel)
        )
    }

    private var friendsListSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("FRIENDS (\(friends.friends.count))")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .tracking(1.5)

            if friends.friends.isEmpty {
                Text("No friends yet — enter a code above.")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                    .padding(.vertical, 8)
            } else {
                ForEach(friends.friends) { entry in
                    friendRow(entry)
                }
            }
        }
    }

    private func friendRow(_ entry: FriendEntry) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "person.crop.circle.fill")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(Color(hex: "#4DA3FF")!)

            VStack(alignment: .leading, spacing: 3) {
                Text(entry.displayName)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(entry.friendCode)
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .foregroundStyle(GGGTheme.neonAccent)
                Text(entry.statusLabel)
                    .font(.system(size: 11, weight: .semibold, design: .rounded))
                    .foregroundStyle(entry.statusLabel == "Practice ready" ? GGGTheme.neonAccent.opacity(0.85) : GGGTheme.steel)
            }

            Spacer()

            Button {
                confirmRemove = entry
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(GGGTheme.danger)
                    .padding(10)
                    .background(Color.white.opacity(0.08))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Remove \(entry.displayName)")
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(GGGTheme.panelElevated)
        )
    }

    private func submitAdd() {
        let result = friends.addFriend(
            code: addCode,
            displayName: addName.isEmpty ? nil : addName
        )
        switch result {
        case .success(let entry):
            addCode = ""
            addName = ""
            HapticsService.select(enabled: settings.hapticsEnabled)
            flash("Added \(entry.displayName)", error: false)
        case .invalidCode:
            flash("Invalid code — use GGG-XXXXXX", error: true)
        case .ownCode:
            flash("That’s your own code", error: true)
        case .duplicate:
            flash("Already on your friends list", error: true)
        }
    }

    private func flash(_ message: String, error: Bool) {
        bannerIsError = error
        withAnimation(.easeOut(duration: 0.2)) {
            banner = message
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
            withAnimation(.easeOut(duration: 0.2)) {
                if banner == message { banner = nil }
            }
        }
    }
}

// MARK: - Local invite picker (MP / BR lobbies)

struct LocalFriendInviteSheet: View {
    @EnvironmentObject private var friends: FriendsStore
    @Environment(\.dismiss) private var dismiss
    var onInvite: (FriendEntry) -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                GGGTheme.background.ignoresSafeArea()
                if friends.friends.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "person.badge.plus")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(GGGTheme.steel)
                        Text("No friends yet")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                        Text("Add someone by friend code in Friends first.")
                            .font(.system(size: 14, weight: .medium, design: .rounded))
                            .foregroundStyle(GGGTheme.subtitle)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }
                } else {
                    List {
                        Section {
                            ForEach(friends.friends) { entry in
                                Button {
                                    onInvite(entry)
                                } label: {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(entry.displayName)
                                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                                .foregroundStyle(.white)
                                            Text(entry.friendCode)
                                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                                .foregroundStyle(GGGTheme.neonAccent)
                                        }
                                        Spacer()
                                        Text("Invite")
                                            .font(.system(size: 13, weight: .heavy, design: .rounded))
                                            .foregroundStyle(GGGTheme.neonAccent)
                                    }
                                }
                                .listRowBackground(GGGTheme.panel)
                            }
                        } footer: {
                            Text("Invite sent (local) only — no real push. Online invites coming later.")
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("Invite Friend")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
