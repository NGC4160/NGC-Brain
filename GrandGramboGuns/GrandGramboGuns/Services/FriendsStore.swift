// FriendsStore.swift
// Local friend codes + friends list (UserDefaults). Shell ready for Game Center later.

import Foundation
import Combine
import UIKit

struct FriendEntry: Identifiable, Codable, Equatable, Hashable {
    let id: UUID
    var displayName: String
    /// Canonical form: `GGG-XXXXXX`.
    var friendCode: String
    var addedAt: Date

    /// Cosmetic only — no live presence yet.
    var statusLabel: String {
        // Alternate for visual variety without implying a real connection.
        let seed = abs(friendCode.hashValue)
        return seed.isMultiple(of: 2) ? "Practice ready" : "Offline"
    }
}

enum AddFriendResult: Equatable {
    case success(FriendEntry)
    case invalidCode
    case ownCode
    case duplicate
}

/// Local friends roster. `remotePlayerID` reserved for future Game Center / GKPlayer wiring.
@MainActor
final class FriendsStore: ObservableObject {
    @Published private(set) var myFriendCode: String
    @Published private(set) var friends: [FriendEntry] = []

    /// Last local “invite” display name (lobby party chrome). Not a real push.
    @Published var pendingLocalInviteName: String?

    /// Reserved for future Game Center player ID mapping.
    var remotePlayerID: String? { nil }
    var usesGameCenter: Bool { false }

    private let defaults = UserDefaults.standard
    private let codeKey = "ggg.friends.myCode.v1"
    private let listKey = "ggg.friends.list.v1"

    private static let codeAlphabet = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")

    init() {
        if let existing = defaults.string(forKey: codeKey), Self.isValidCode(existing) {
            myFriendCode = Self.normalize(existing) ?? existing
        } else {
            let generated = Self.generateCode()
            myFriendCode = generated
            defaults.set(generated, forKey: codeKey)
        }
        loadFriends()
    }

    // MARK: - Public API

    @discardableResult
    func addFriend(code raw: String, displayName: String? = nil) -> AddFriendResult {
        guard let code = Self.normalize(raw) else { return .invalidCode }
        if code == myFriendCode { return .ownCode }
        if friends.contains(where: { $0.friendCode == code }) { return .duplicate }

        let name = cleanedDisplayName(displayName) ?? defaultName(for: code)
        let entry = FriendEntry(
            id: UUID(),
            displayName: name,
            friendCode: code,
            addedAt: Date()
        )
        friends.insert(entry, at: 0)
        persistFriends()
        return .success(entry)
    }

    func removeFriend(id: UUID) {
        friends.removeAll { $0.id == id }
        if let pending = pendingLocalInviteName,
           !friends.contains(where: { $0.displayName == pending }) {
            pendingLocalInviteName = nil
        }
        persistFriends()
    }

    func renameFriend(id: UUID, displayName: String) {
        guard let idx = friends.firstIndex(where: { $0.id == id }) else { return }
        let cleaned = cleanedDisplayName(displayName) ?? friends[idx].displayName
        friends[idx].displayName = cleaned
        persistFriends()
    }

    /// Copies the player's own code to the pasteboard.
    func copyMyCodeToPasteboard() {
        UIPasteboard.general.string = myFriendCode
    }

    /// Local-only invite for practice lobbies — no network.
    func sendLocalInvite(to friend: FriendEntry) {
        pendingLocalInviteName = friend.displayName
    }

    func clearLocalInvite() {
        pendingLocalInviteName = nil
    }

    // MARK: - Code helpers

    static func normalize(_ raw: String) -> String? {
        let filtered = raw.uppercased().filter { $0.isLetter || $0.isNumber }
        guard filtered.count == 9, filtered.hasPrefix("GGG") else { return nil }
        let suffix = String(filtered.dropFirst(3))
        guard suffix.count == 6,
              suffix.allSatisfy({ codeAlphabet.contains($0) }) else { return nil }
        return "GGG-\(suffix)"
    }

    static func isValidCode(_ raw: String) -> Bool {
        normalize(raw) != nil
    }

    static func generateCode() -> String {
        var chars: [Character] = []
        chars.reserveCapacity(6)
        for _ in 0..<6 {
            chars.append(codeAlphabet.randomElement()!)
        }
        return "GGG-\(String(chars))"
    }

    // MARK: - Private

    private func loadFriends() {
        guard let data = defaults.data(forKey: listKey) else {
            friends = []
            return
        }
        do {
            let decoded = try JSONDecoder().decode([FriendEntry].self, from: data)
            friends = decoded.sorted { $0.addedAt > $1.addedAt }
        } catch {
            friends = []
        }
    }

    private func persistFriends() {
        do {
            let data = try JSONEncoder().encode(friends)
            defaults.set(data, forKey: listKey)
        } catch {
            // Keep in-memory list; next successful write will persist.
        }
    }

    private func cleanedDisplayName(_ raw: String?) -> String? {
        guard let raw else { return nil }
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        return String(trimmed.prefix(24))
    }

    private func defaultName(for code: String) -> String {
        let suffix = code.split(separator: "-").last.map(String.init) ?? "FRIEND"
        return "Operator \(suffix)"
    }
}
