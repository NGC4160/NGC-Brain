// CombatCoinStore.swift
// Persists Combat Coins + shop unlocks (UserDefaults). Separate from XP/ranks.

import Foundation
import Combine

enum CoinPurchaseResult: Equatable, Sendable {
    case success(remainingBalance: Int)
    case alreadyOwned
    case insufficientFunds(need: Int, have: Int)
    case unavailable
}

@MainActor
final class CombatCoinStore: ObservableObject {
    /// Lifetime Combat Coin balance.
    @Published private(set) var balance: Int
    /// Unlocked shop item IDs.
    @Published private(set) var unlockedIDs: Set<String>
    /// Extra custom operator slots from shop packs.
    @Published private(set) var bonusCustomSlots: Int
    /// Coins earned since `beginSession()`.
    @Published private(set) var sessionCoins: Int = 0
    /// One-shot +N side toast amount; consume via `consumeCoinToast()`.
    @Published private(set) var pendingCoinToast: Int?
    /// Bumps on every toastable grant so multi-kills re-trigger the overlay.
    @Published private(set) var coinToastGeneration: UInt = 0
    /// Wall-clock of last toastable gain (for observers / diagnostics).
    @Published private(set) var lastGainAt: Date?

    private let defaults = UserDefaults.standard
    private let balanceKey = "ggg.coins.balance.v1"
    private let unlocksKey = "ggg.coins.unlocks.v1"
    private let bonusSlotsKey = "ggg.coins.bonusSlots.v1"
    private let migratedKey = "ggg.coins.migrated.v1"

    /// Coins awarded per player kill outside Training / Range.
    nonisolated static let coinsPerKill = 2

    init() {
        balance = max(0, defaults.integer(forKey: balanceKey))
        let saved = defaults.stringArray(forKey: unlocksKey) ?? []
        unlockedIDs = Set(saved)
        bonusCustomSlots = max(0, defaults.integer(forKey: bonusSlotsKey))
        seedFreeUnlocks()
    }

    /// Call once after library loads so legacy armory guns stay unlocked.
    func migrateIfNeeded(libraryGunNames: Set<String>, selectedOperatorID: String) {
        guard !defaults.bool(forKey: migratedKey) else { return }

        for name in libraryGunNames {
            if let id = ShopCatalog.gunItemID(forGunName: name) {
                unlockedIDs.insert(id)
            }
        }

        unlockedIDs.formUnion(ShopCatalog.freeOperatorIDs.map { "op_\($0)" })
        if let shopID = ShopCatalog.operatorShopID(forOperatorID: selectedOperatorID) {
            unlockedIDs.insert(shopID)
        } else if ShopCatalog.freeOperatorIDs.contains(selectedOperatorID) {
            unlockedIDs.insert("op_\(selectedOperatorID)")
        }

        // Grandfather attachment/skin unlocks that were always free before the shop.
        for partID in ShopCatalog.freeAttachmentIDs {
            if let id = ShopCatalog.attachmentShopID(forPartID: partID) {
                unlockedIDs.insert(id)
            }
        }
        for skin in ShopCatalog.freeSkinIDs {
            if let id = ShopCatalog.skinShopID(for: skin) {
                unlockedIDs.insert(id)
            }
        }

        persistUnlocks()
        defaults.set(true, forKey: migratedKey)
    }

    func beginSession() {
        sessionCoins = 0
    }

    @discardableResult
    func grantKill(_ source: KillXPSource) -> Int {
        grantCoins(source.coinsPerKill, showToast: source.coinsPerKill > 0)
    }

    @discardableResult
    func grantCoins(_ amount: Int, showToast: Bool = false) -> Int {
        let add = max(0, amount)
        guard add > 0 else { return 0 }
        balance += add
        sessionCoins += add
        defaults.set(balance, forKey: balanceKey)
        if showToast {
            // Replace quickly on multi-kill: show the latest grant amount and bump generation
            // so the side toast restarts even when amount equals the previous toast.
            pendingCoinToast = add
            coinToastGeneration &+= 1
            lastGainAt = Date()
        }
        return add
    }

    func consumeCoinToast() {
        pendingCoinToast = nil
    }

    func canAfford(_ price: Int) -> Bool {
        balance >= max(0, price)
    }

    func isUnlocked(_ itemID: String) -> Bool {
        if unlockedIDs.contains(itemID) { return true }
        if let item = ShopCatalog.item(id: itemID) {
            return isKindUnlocked(item.kind)
        }
        return false
    }

    func isOperatorUnlocked(_ operatorID: String) -> Bool {
        // Base Task Force roster is always free — never gated by Combat Coins.
        if OperatorProfile.baseIDs.contains(operatorID) { return true }
        if ShopCatalog.freeOperatorIDs.contains(operatorID) { return true }
        if unlockedIDs.contains("op_\(operatorID)") { return true }
        if let shopID = ShopCatalog.operatorShopID(forOperatorID: operatorID) {
            return unlockedIDs.contains(shopID)
        }
        return false
    }

    func isAttachmentUnlocked(_ partID: String) -> Bool {
        // Entire base catalog is free; only shop-exclusive IDs require a purchase.
        if AttachmentCatalog.baseIDs.contains(partID) { return true }
        if ShopCatalog.freeAttachmentIDs.contains(partID) { return true }
        if let shopID = ShopCatalog.attachmentShopID(forPartID: partID) {
            return unlockedIDs.contains(shopID)
        }
        // Unknown / unsold parts stay free (legacy saves).
        return ShopCatalog.attachmentShopID(forPartID: partID) == nil
    }

    func isSkinUnlocked(_ skin: PremadeSkinID) -> Bool {
        if ShopCatalog.freeSkinIDs.contains(skin) { return true }
        if let shopID = ShopCatalog.skinShopID(for: skin) {
            return unlockedIDs.contains(shopID)
        }
        return true
    }

    func isGunCatalogUnlocked(_ itemID: String) -> Bool {
        unlockedIDs.contains(itemID)
    }

    /// Owns a shop gun if unlocked OR already present in the armory by name.
    /// Free starters are always owned (Armory-seeded).
    func ownsGun(itemID: String, library: GunLibraryStore) -> Bool {
        if itemID.hasPrefix("gun_") {
            let defID = String(itemID.dropFirst(4))
            if ShopCatalog.freeGunIDs.contains(defID) { return true }
        }
        if unlockedIDs.contains(itemID) { return true }
        guard let gun = ShopCatalog.makeGun(forItemID: itemID) else { return false }
        if ShopCatalog.freeGunNames.contains(gun.name) { return true }
        return library.guns.contains { $0.name == gun.name }
    }

    @discardableResult
    func purchase(_ item: ShopItem, library: GunLibraryStore? = nil) -> CoinPurchaseResult {
        switch item.kind {
        case .gun:
            if let library {
                if ownsGun(itemID: item.id, library: library) {
                    if let gun = ShopCatalog.makeGun(forItemID: item.id),
                       !library.guns.contains(where: { $0.name == gun.name }) {
                        library.upsertGun(gun)
                    }
                    unlockedIDs.insert(item.id)
                    persistUnlocks()
                    return .alreadyOwned
                }
            }
        case .customSlotPack:
            if unlockedIDs.contains(item.id) {
                return .alreadyOwned
            }
        case .attachment, .skin, .operatorUnlock:
            if unlockedIDs.contains(item.id) || isUnlocked(item.id) {
                return .alreadyOwned
            }
        }

        let price = max(0, item.price)
        guard balance >= price else {
            return .insufficientFunds(need: price, have: balance)
        }

        switch item.kind {
        case .gun:
            guard let library, let gun = ShopCatalog.makeGun(forItemID: item.id) else {
                return .unavailable
            }
            if !library.guns.contains(where: { $0.name == gun.name }) {
                library.upsertGun(gun)
            }
        case .attachment, .skin, .operatorUnlock:
            break
        case .customSlotPack(let extra):
            bonusCustomSlots += max(0, extra)
            defaults.set(bonusCustomSlots, forKey: bonusSlotsKey)
        }

        balance -= price
        defaults.set(balance, forKey: balanceKey)
        unlockedIDs.insert(item.id)
        if case .operatorUnlock(let oid) = item.kind {
            unlockedIDs.insert("op_\(oid)")
        }
        persistUnlocks()
        return .success(remainingBalance: balance)
    }

    func resetEconomy() {
        balance = 0
        unlockedIDs = []
        bonusCustomSlots = 0
        sessionCoins = 0
        pendingCoinToast = nil
        lastGainAt = nil
        defaults.removeObject(forKey: balanceKey)
        defaults.removeObject(forKey: unlocksKey)
        defaults.removeObject(forKey: bonusSlotsKey)
        defaults.removeObject(forKey: migratedKey)
        seedFreeUnlocks()
    }

    // MARK: - Private

    private func seedFreeUnlocks() {
        // Seed every free/base operator so legacy saves never treat them as paid.
        for oid in ShopCatalog.freeOperatorIDs {
            unlockedIDs.insert("op_\(oid)")
        }
        // Free starter guns are Armory-seeded, not shop SKUs — never gate them.
        for gid in ShopCatalog.freeGunIDs {
            unlockedIDs.insert("gun_\(gid)")
        }
        persistUnlocks()
    }

    private func isKindUnlocked(_ kind: ShopItemKind) -> Bool {
        switch kind {
        case .gun:
            return false
        case .attachment(let partID):
            return isAttachmentUnlocked(partID)
        case .skin(let skin):
            return isSkinUnlocked(skin)
        case .operatorUnlock(let oid):
            return isOperatorUnlocked(oid)
        case .customSlotPack:
            return false
        }
    }

    private func persistUnlocks() {
        defaults.set(Array(unlockedIDs).sorted(), forKey: unlocksKey)
    }
}
