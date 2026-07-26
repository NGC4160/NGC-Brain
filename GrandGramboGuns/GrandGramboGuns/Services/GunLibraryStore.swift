// GunLibraryStore.swift
// FileManager + Codable persistence for the armory library.

import Foundation
import Combine

@MainActor
final class GunLibraryStore: ObservableObject {
    @Published private(set) var guns: [SavedGun] = []
    @Published private(set) var paintJobs: [PaintJobRecord] = []
    @Published private(set) var skinApplications: [SkinApplication] = []

    private let fileURL: URL
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = [.prettyPrinted, .sortedKeys]
        e.dateEncodingStrategy = .iso8601
        return e
    }()
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    init(filename: String = "gun_library.json") {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        fileURL = dir.appendingPathComponent(filename)
        load()
        ensureStarters()
    }

    // MARK: - Queries

    func gun(id: UUID) -> SavedGun? {
        guns.first { $0.id == id }
    }

    func paintJob(id: UUID?) -> PaintJobRecord? {
        guard let id else { return nil }
        return paintJobs.first { $0.id == id }
    }

    func blueprint(for gun: SavedGun) -> GunBlueprint {
        GunBlueprint(from: gun, paint: paintJob(id: gun.paintJobID))
    }

    // MARK: - Mutations

    func upsertGun(_ gun: SavedGun) {
        if let idx = guns.firstIndex(where: { $0.id == gun.id }) {
            guns[idx] = gun
        } else {
            guns.insert(gun, at: 0)
        }
        sortGuns()
        save()
    }

    func deleteGun(id: UUID) {
        guns.removeAll { $0.id == id && $0.isStarter == false }
        paintJobs.removeAll { $0.gunID == id }
        skinApplications.removeAll { $0.gunID == id }
        save()
    }

    func upsertPaintJob(_ job: PaintJobRecord, linkToGunID gunID: UUID) {
        if let idx = paintJobs.firstIndex(where: { $0.id == job.id }) {
            paintJobs[idx] = job
        } else {
            paintJobs.append(job)
        }
        if let gIdx = guns.firstIndex(where: { $0.id == gunID }) {
            guns[gIdx].paintJobID = job.id
            guns[gIdx].updatedAt = Date()
        }
        sortGuns()
        save()
    }

    func applySkin(_ skin: PremadeSkinID, toGunID gunID: UUID, clearPaint: Bool) {
        guard let idx = guns.firstIndex(where: { $0.id == gunID }) else { return }
        guns[idx].premadeSkin = skin
        guns[idx].updatedAt = Date()
        if clearPaint, let paintID = guns[idx].paintJobID,
           let pIdx = paintJobs.firstIndex(where: { $0.id == paintID }) {
            paintJobs[pIdx].strokes = []
            paintJobs[pIdx].updatedAt = Date()
        }
        skinApplications.insert(SkinApplication(gunID: gunID, skin: skin), at: 0)
        sortGuns()
        save()
    }

    func resetAllCustomData() {
        guns.removeAll()
        paintJobs.removeAll()
        skinApplications.removeAll()
        ensureStarters()
        save()
    }

    // MARK: - Persistence

    private func load() {
        guard FileManager.default.fileExists(atPath: fileURL.path),
              let data = try? Data(contentsOf: fileURL),
              let payload = try? decoder.decode(GunLibraryPayload.self, from: data) else {
            guns = []
            paintJobs = []
            skinApplications = []
            return
        }
        guns = payload.guns
        paintJobs = payload.paintJobs
        skinApplications = payload.skinApplications
        sortGuns()
    }

    private func save() {
        let payload = GunLibraryPayload(
            guns: guns,
            paintJobs: paintJobs,
            skinApplications: skinApplications
        )
        do {
            let data = try encoder.encode(payload)
            try data.write(to: fileURL, options: [.atomic])
        } catch {
            print("GunLibraryStore save failed: \(error)")
        }
    }

    private func sortGuns() {
        guns.sort { $0.updatedAt > $1.updatedAt }
    }

    private func ensureStarters() {
        if guns.contains(where: { $0.isStarter }) { return }
        for gun in SeedData.starterGuns() {
            guns.append(gun)
        }
        sortGuns()
        save()
    }
}
