// AppState.swift
// Shared navigation + equipped-gun state for the whole app.

import SwiftUI
import Combine

/// Top-level destinations reachable from the Main Hub.
enum HubDestination: Hashable, Identifiable {
    case armory
    case buildGun
    case paintShop
    case skins
    case range
    case settings

    var id: Self { self }

    var title: String {
        switch self {
        case .armory: return "Armory"
        case .buildGun: return "Build Gun"
        case .paintShop: return "Paint Shop"
        case .skins: return "Skins"
        case .range: return "Range"
        case .settings: return "Settings"
        }
    }
}

/// Global UI / session state (not persisted — see GunLibraryStore for that).
@MainActor
final class AppState: ObservableObject {
    /// Currently equipped gun ID used by the Range.
    @Published var equippedGunID: UUID?

    /// Path-based navigation stack from the hub.
    @Published var path = NavigationPath()

    /// When true, Range should present immediately after equip.
    @Published var pendingRangeLaunch = false

    /// First-run onboarding flags (mirrored from UserDefaults for reactivity).
    @Published var showBuildOnboarding: Bool
    @Published var showPaintOnboarding: Bool

    private let buildKey = "ggg.onboarding.build"
    private let paintKey = "ggg.onboarding.paint"

    init() {
        let defaults = UserDefaults.standard
        // Default to showing onboarding until dismissed once.
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

    func equip(_ gunID: UUID, openRange: Bool = false) {
        equippedGunID = gunID
        if openRange {
            pendingRangeLaunch = true
            path.append(HubDestination.range)
        }
    }
}
