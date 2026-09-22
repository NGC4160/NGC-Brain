// SeedData.swift
// Free starter guns — always unlocked in Armory. Premium exclusives live in Shop.

import Foundation

enum SeedData {
    /// Free loadout guns for new players. Shop sells distinct exclusives only.
    static func starterGuns() -> [SavedGun] {
        GunCatalog.base.map { $0.makeSavedGun(isStarter: true) }
    }
}
