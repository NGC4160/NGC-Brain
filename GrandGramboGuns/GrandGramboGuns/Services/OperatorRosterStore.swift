// OperatorRosterStore.swift
// Persists custom operators and resolves premade + custom profiles.

import Foundation
import Combine

@MainActor
final class OperatorRosterStore: ObservableObject {
    @Published private(set) var customs: [CustomOperatorRecord] = []
    /// Extra slots from Combat Coin shop packs (synced from CombatCoinStore).
    @Published var bonusCustomSlots: Int = 0

    static let baseMaxCustoms = 12
    /// Back-compat alias — prefer `maxCustoms` instance property when bonus slots apply.
    static var maxCustoms: Int { baseMaxCustoms }

    var maxCustoms: Int { Self.baseMaxCustoms + max(0, bonusCustomSlots) }

    private let fileURL: URL

    /// Prefer seconds-since-1970 for new writes (reliable round-trip).
    /// Load still accepts legacy ISO-8601 payloads from earlier builds.
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = [.prettyPrinted, .sortedKeys]
        e.dateEncodingStrategy = .secondsSince1970
        return e
    }()

    init(filename: String = "operator_roster.json") {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        fileURL = dir.appendingPathComponent(filename)
        load()
    }

    var canCreateMore: Bool { customs.count < maxCustoms }

    /// Premades first, then customs (newest first).
    var allProfiles: [OperatorProfile] {
        OperatorProfile.all + customs.map { $0.asProfile() }
    }

    func custom(id: String) -> CustomOperatorRecord? {
        customs.first { $0.id == id }
    }

    func profile(id: String) -> OperatorProfile {
        if let premade = OperatorProfile.premade(id: id) { return premade }
        if let custom = customs.first(where: { $0.id == id }) { return custom.asProfile() }
        return OperatorProfile.all[0]
    }

    /// Whether `id` still resolves to a real roster entry (premade or custom).
    func contains(id: String) -> Bool {
        OperatorProfile.premade(id: id) != nil || customs.contains(where: { $0.id == id })
    }

    @discardableResult
    func upsert(_ record: CustomOperatorRecord) -> Bool {
        if let idx = customs.firstIndex(where: { $0.id == record.id }) {
            customs[idx] = record
        } else {
            guard canCreateMore else { return false }
            customs.insert(record, at: 0)
        }
        customs.sort { $0.updatedAt > $1.updatedAt }
        save()
        return true
    }

    func delete(id: String) {
        customs.removeAll { $0.id == id }
        save()
    }

    func resetAllCustoms() {
        customs = []
        save()
    }

    private struct DiskPayload: Codable {
        var customs: [CustomOperatorRecord]
    }

    private func load() {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            customs = []
            return
        }
        do {
            let data = try Data(contentsOf: fileURL)
            if let payload = Self.decodePayload(data) {
                customs = payload.customs.sorted { $0.updatedAt > $1.updatedAt }
            } else {
                customs = []
            }
        } catch {
            customs = []
        }
    }

    private func save() {
        do {
            let data = try encoder.encode(DiskPayload(customs: customs))
            try data.write(to: fileURL, options: [.atomic])
        } catch {
            // Keep in-memory roster for the session even if disk write fails.
        }
    }

    /// Decode with several date strategies so older ISO-8601 files still load.
    private static func decodePayload(_ data: Data) -> DiskPayload? {
        let strategies: [JSONDecoder.DateDecodingStrategy] = [
            .secondsSince1970,
            .iso8601,
            .custom { decoder in
                let container = try decoder.singleValueContainer()
                if let seconds = try? container.decode(Double.self) {
                    return Date(timeIntervalSince1970: seconds)
                }
                let string = try container.decode(String.self)
                let fractional = ISO8601DateFormatter()
                fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                let plain = ISO8601DateFormatter()
                plain.formatOptions = [.withInternetDateTime]
                if let date = fractional.date(from: string) ?? plain.date(from: string) {
                    return date
                }
                throw DecodingError.dataCorruptedError(
                    in: container,
                    debugDescription: "Unrecognized date: \(string)"
                )
            }
        ]
        for strategy in strategies {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = strategy
            if let payload = try? decoder.decode(DiskPayload.self, from: data) {
                return payload
            }
        }
        return nil
    }

}
