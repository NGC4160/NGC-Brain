// SavedGun.swift
// Codable persistence models for guns, paint jobs, and skin applications.
// Stored via GunLibraryStore (FileManager) — works on iOS 16+.

import Foundation

struct SavedGun: Identifiable, Codable, Hashable {
    var id: UUID
    var name: String
    var bodyTypeRaw: String
    /// [AttachmentSlot.rawValue: AttachmentPart.id]
    var attachmentsMap: [String: String]
    var premadeSkinRaw: String?
    var paintJobID: UUID?
    var isStarter: Bool
    var createdAt: Date
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        name: String,
        bodyType: GunBodyType,
        attachments: [AttachmentSlot: String] = [:],
        premadeSkin: PremadeSkinID? = nil,
        paintJobID: UUID? = nil,
        isStarter: Bool = false,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.bodyTypeRaw = bodyType.rawValue
        self.attachmentsMap = Dictionary(uniqueKeysWithValues: attachments.map { ($0.key.rawValue, $0.value) })
        self.premadeSkinRaw = premadeSkin?.rawValue
        self.paintJobID = paintJobID
        self.isStarter = isStarter
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    var bodyType: GunBodyType {
        get { GunBodyType(rawValue: bodyTypeRaw) ?? .pistol }
        set { bodyTypeRaw = newValue.rawValue }
    }

    var premadeSkin: PremadeSkinID? {
        get {
            guard let raw = premadeSkinRaw else { return nil }
            return PremadeSkinID(rawValue: raw)
        }
        set { premadeSkinRaw = newValue?.rawValue }
    }

    var attachments: [AttachmentSlot: String] {
        get {
            var result: [AttachmentSlot: String] = [:]
            for (key, value) in attachmentsMap {
                if let slot = AttachmentSlot(rawValue: key) {
                    result[slot] = value
                }
            }
            return result
        }
        set {
            attachmentsMap = Dictionary(uniqueKeysWithValues: newValue.map { ($0.key.rawValue, $0.value) })
            updatedAt = Date()
        }
    }

    mutating func setAttachment(_ partID: String?, for slot: AttachmentSlot) {
        var current = attachments
        if let partID {
            current[slot] = partID
        } else {
            current.removeValue(forKey: slot)
        }
        attachments = current
    }
}

struct PaintJobRecord: Identifiable, Codable, Hashable {
    var id: UUID
    var gunID: UUID
    var name: String
    var strokes: [PaintStroke]
    var createdAt: Date
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        gunID: UUID,
        name: String,
        strokes: [PaintStroke] = [],
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.gunID = gunID
        self.name = name
        self.strokes = strokes
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

struct SkinApplication: Identifiable, Codable, Hashable {
    var id: UUID
    var gunID: UUID
    var skinRaw: String
    var appliedAt: Date

    init(id: UUID = UUID(), gunID: UUID, skin: PremadeSkinID, appliedAt: Date = Date()) {
        self.id = id
        self.gunID = gunID
        self.skinRaw = skin.rawValue
        self.appliedAt = appliedAt
    }

    var skin: PremadeSkinID {
        PremadeSkinID(rawValue: skinRaw) ?? .matteBlack
    }
}

/// On-disk library payload.
struct GunLibraryPayload: Codable {
    var guns: [SavedGun]
    var paintJobs: [PaintJobRecord]
    var skinApplications: [SkinApplication]
}
