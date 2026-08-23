// GunBlueprint.swift
// Lightweight in-memory representation used by builders & SceneKit.

import Foundation

/// Transient gun configuration while editing in Build / Paint / Range.
struct GunBlueprint: Identifiable, Equatable {
    var id: UUID
    /// Canonical / catalog name — combat stats & shop identity.
    var name: String
    /// Optional player nickname for HUD / Armory labels.
    var customDisplayName: String?
    var bodyType: GunBodyType
    var attachments: [AttachmentSlot: String]
    var premadeSkin: PremadeSkinID?
    var paintStrokes: [PaintStroke]
    var isStarter: Bool

    init(
        id: UUID = UUID(),
        name: String = "New Build",
        customDisplayName: String? = nil,
        bodyType: GunBodyType = .pistol,
        attachments: [AttachmentSlot: String] = [:],
        premadeSkin: PremadeSkinID? = .matteBlack,
        paintStrokes: [PaintStroke] = [],
        isStarter: Bool = false
    ) {
        self.id = id
        self.name = name
        self.customDisplayName = SavedGun.normalizedDisplayName(customDisplayName)
        self.bodyType = bodyType
        self.attachments = attachments
        self.premadeSkin = premadeSkin
        self.paintStrokes = paintStrokes
        self.isStarter = isStarter
    }

    init(from gun: SavedGun, paint: PaintJobRecord? = nil) {
        self.id = gun.id
        self.name = gun.name
        self.customDisplayName = gun.customDisplayName
        self.bodyType = gun.bodyType
        self.attachments = gun.attachments
        self.premadeSkin = gun.premadeSkin
        self.paintStrokes = paint?.strokes ?? []
        self.isStarter = gun.isStarter
    }

    /// Label for HUD / pickers — nickname when set, else canonical name.
    var displayName: String {
        if let custom = SavedGun.normalizedDisplayName(customDisplayName) {
            return custom
        }
        return name
    }

    func part(for slot: AttachmentSlot) -> AttachmentPart? {
        guard let id = attachments[slot] else { return nil }
        return AttachmentCatalog.part(id: id)
    }

    /// Catalog combat identity when named; otherwise class defaults.
    var combatStats: GunCombatStats {
        GunCatalog.stats(forName: name, bodyType: bodyType)
    }

    var magCapacity: Int { combatStats.magCapacity }
    var fireInterval: TimeInterval { combatStats.fireInterval }
    var accuracyBloom: Float { combatStats.accuracyBloom }
    var recoilKickAmount: CGFloat { combatStats.recoilKick }
    var torchFlashDuration: TimeInterval { combatStats.torchFlashDuration }
    var shotDamage: Int { combatStats.shotDamage }
}
