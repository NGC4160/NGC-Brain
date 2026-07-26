// GunBlueprint.swift
// Lightweight in-memory representation used by builders & SceneKit.

import Foundation

/// Transient gun configuration while editing in Build / Paint / Range.
struct GunBlueprint: Identifiable, Equatable {
    var id: UUID
    var name: String
    var bodyType: GunBodyType
    var attachments: [AttachmentSlot: String]
    var premadeSkin: PremadeSkinID?
    var paintStrokes: [PaintStroke]
    var isStarter: Bool

    init(
        id: UUID = UUID(),
        name: String = "New Build",
        bodyType: GunBodyType = .pistol,
        attachments: [AttachmentSlot: String] = [:],
        premadeSkin: PremadeSkinID? = .matteBlack,
        paintStrokes: [PaintStroke] = [],
        isStarter: Bool = false
    ) {
        self.id = id
        self.name = name
        self.bodyType = bodyType
        self.attachments = attachments
        self.premadeSkin = premadeSkin
        self.paintStrokes = paintStrokes
        self.isStarter = isStarter
    }

    init(from gun: SavedGun, paint: PaintJobRecord? = nil) {
        self.id = gun.id
        self.name = gun.name
        self.bodyType = gun.bodyType
        self.attachments = gun.attachments
        self.premadeSkin = gun.premadeSkin
        self.paintStrokes = paint?.strokes ?? []
        self.isStarter = gun.isStarter
    }

    func part(for slot: AttachmentSlot) -> AttachmentPart? {
        guard let id = attachments[slot] else { return nil }
        return AttachmentCatalog.part(id: id)
    }
}
