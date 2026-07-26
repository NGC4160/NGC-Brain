// SettingsStore.swift
// UserDefaults-backed settings for volume, haptics, and data reset.

import Foundation
import Combine

@MainActor
final class SettingsStore: ObservableObject {
    @Published var soundVolume: Double {
        didSet { defaults.set(soundVolume, forKey: Keys.soundVolume) }
    }

    @Published var hapticsEnabled: Bool {
        didSet { defaults.set(hapticsEnabled, forKey: Keys.haptics) }
    }

    @Published var musicEnabled: Bool {
        didSet { defaults.set(musicEnabled, forKey: Keys.music) }
    }

    private let defaults = UserDefaults.standard

    private enum Keys {
        static let soundVolume = "ggg.settings.soundVolume"
        static let haptics = "ggg.settings.haptics"
        static let music = "ggg.settings.music"
    }

    init() {
        if defaults.object(forKey: Keys.soundVolume) == nil {
            defaults.set(0.8, forKey: Keys.soundVolume)
        }
        if defaults.object(forKey: Keys.haptics) == nil {
            defaults.set(true, forKey: Keys.haptics)
        }
        if defaults.object(forKey: Keys.music) == nil {
            defaults.set(true, forKey: Keys.music)
        }
        soundVolume = defaults.double(forKey: Keys.soundVolume)
        hapticsEnabled = defaults.bool(forKey: Keys.haptics)
        musicEnabled = defaults.bool(forKey: Keys.music)
    }
}
