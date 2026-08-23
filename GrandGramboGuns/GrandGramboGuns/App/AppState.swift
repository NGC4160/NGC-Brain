// AppState.swift
// Shared navigation + dual-weapon loadout state for the whole app.

import SwiftUI
import Combine

/// Top-level destinations reachable from the Main Hub.
enum HubDestination: Hashable, Identifiable {
    case armory
    case characters
    case buildGun
    case paintShop
    case skins
    case shakeShoot
    case range
    case storyMode
    case missionPlay(missionID: String)
    case multiplayer
    case battleRoyale
    case training
    case shop
    case friends
    case settings

    var id: String {
        switch self {
        case .armory: return "armory"
        case .characters: return "characters"
        case .buildGun: return "buildGun"
        case .paintShop: return "paintShop"
        case .skins: return "skins"
        case .shakeShoot: return "shakeShoot"
        case .range: return "range"
        case .storyMode: return "storyMode"
        case .missionPlay(let id): return "missionPlay_\(id)"
        case .multiplayer: return "multiplayer"
        case .battleRoyale: return "battleRoyale"
        case .training: return "training"
        case .shop: return "shop"
        case .friends: return "friends"
        case .settings: return "settings"
        }
    }

    var title: String {
        switch self {
        case .armory: return "Armory"
        case .characters: return "Characters"
        case .buildGun: return "Build Gun"
        case .paintShop: return "Paint Shop"
        case .skins: return "Skins"
        case .shakeShoot: return "Shake to Shoot"
        case .range: return "Range"
        case .storyMode: return "Story Mode"
        case .missionPlay: return "Mission"
        case .multiplayer: return "Multiplayer"
        case .battleRoyale: return "Battle Royale"
        case .training: return "Training"
        case .shop: return "Shop"
        case .friends: return "Friends"
        case .settings: return "Settings"
        }
    }
}

enum LoadoutSlot: Int, CaseIterable, Identifiable {
    case primary = 0
    case secondary = 1

    var id: Int { rawValue }

    var label: String {
        switch self {
        case .primary: return "PRIMARY"
        case .secondary: return "SECONDARY"
        }
    }

    var shortLabel: String {
        switch self {
        case .primary: return "P1"
        case .secondary: return "P2"
        }
    }
}

/// Global UI / session state (not persisted — see GunLibraryStore for that).
@MainActor
final class AppState: ObservableObject {
    /// Primary loadout gun (used by Shake / Range / Story slot 1).
    @Published var primaryGunID: UUID?
    /// Optional second armory gun for Story Mode weapon switch.
    @Published var secondaryGunID: UUID?

    /// Path-based navigation stack from the hub.
    @Published var path = NavigationPath()

    @Published var pendingRangeLaunch = false
    @Published var pendingShakeLaunch = false
    /// When true, Story Mode opens on the Ghost Lattice DLC tab.
    @Published var pendingStoryDLCTab = false

    /// First-run onboarding flags (mirrored from UserDefaults for reactivity).
    @Published var showBuildOnboarding: Bool
    @Published var showPaintOnboarding: Bool

    private let buildKey = "ggg.onboarding.build"
    private let paintKey = "ggg.onboarding.paint"

    /// Back-compat alias — primary is the “active” gun for Range / Shake.
    var equippedGunID: UUID? {
        get { primaryGunID }
        set { primaryGunID = newValue }
    }

    init() {
        let defaults = UserDefaults.standard
        if defaults.object(forKey: buildKey) == nil {
            defaults.set(true, forKey: buildKey)
        }
        if defaults.object(forKey: paintKey) == nil {
            defaults.set(true, forKey: paintKey)
        }
        showBuildOnboarding = defaults.bool(forKey: buildKey)
        showPaintOnboarding = defaults.bool(forKey: paintKey)
    }

    func dismissBuildOnboarding() {
        showBuildOnboarding = false
        UserDefaults.standard.set(false, forKey: buildKey)
    }

    func dismissPaintOnboarding() {
        showPaintOnboarding = false
        UserDefaults.standard.set(false, forKey: paintKey)
    }

    func navigate(to destination: HubDestination) {
        path.append(destination)
    }

    enum PlayMode {
        case shake
        case range
    }

    func equippedID(for slot: LoadoutSlot) -> UUID? {
        switch slot {
        case .primary: return primaryGunID
        case .secondary: return secondaryGunID
        }
    }

    func isEquipped(_ gunID: UUID, in slot: LoadoutSlot) -> Bool {
        equippedID(for: slot) == gunID
    }

    func loadoutSlots(containing gunID: UUID) -> [LoadoutSlot] {
        LoadoutSlot.allCases.filter { isEquipped(gunID, in: $0) }
    }

    /// Equip into a loadout slot. Same gun can’t occupy both slots.
    /// Shake / Range always open with the gun as primary.
    func equip(_ gunID: UUID, slot: LoadoutSlot = .primary, open mode: PlayMode? = nil) {
        if mode != nil {
            if secondaryGunID == gunID { secondaryGunID = nil }
            primaryGunID = gunID
        } else {
            switch slot {
            case .primary:
                if secondaryGunID == gunID { secondaryGunID = nil }
                primaryGunID = gunID
            case .secondary:
                if primaryGunID == gunID { primaryGunID = nil }
                secondaryGunID = gunID
            }
        }

        switch mode {
        case .shake:
            pendingShakeLaunch = true
            path.append(HubDestination.shakeShoot)
        case .range:
            pendingRangeLaunch = true
            path.append(HubDestination.range)
        case .none:
            break
        }
    }

    func clearLoadout() {
        primaryGunID = nil
        secondaryGunID = nil
    }
}
