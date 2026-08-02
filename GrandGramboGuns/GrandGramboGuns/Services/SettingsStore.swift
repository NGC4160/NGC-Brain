// SettingsStore.swift
// UserDefaults-backed settings for volume, haptics, flashlight, shake.

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

    /// 0…1 — mission BGM level (independent of SFX `soundVolume`).
    @Published var musicVolume: Double {
        didSet { defaults.set(musicVolume, forKey: Keys.musicVolume) }
    }

    @Published var flashlightEnabled: Bool {
        didSet { defaults.set(flashlightEnabled, forKey: Keys.flashlight) }
    }

    /// 0…1 — higher = easier to trigger shakes.
    @Published var shakeSensitivity: Double {
        didSet { defaults.set(shakeSensitivity, forKey: Keys.shake) }
    }

    /// Play camera: over-the-shoulder third person when enabled (Story, Range, MP, BR).
    @Published var thirdPersonMode: Bool {
        didSet { defaults.set(thirdPersonMode, forKey: Keys.thirdPerson) }
    }

    /// Selected KESTREL operator callsign id.
    @Published var selectedOperatorID: String {
        didSet { defaults.set(selectedOperatorID, forKey: Keys.operatorID) }
    }

    /// Story Mode combat difficulty (enemy rifle accuracy).
    @Published var storyDifficultyRaw: String {
        didSet { defaults.set(storyDifficultyRaw, forKey: Keys.difficulty) }
    }

    /// First-launch How to Play tutorial completed (replay still available from Hub / Settings).
    @Published var hasCompletedHowToPlayTutorial: Bool {
        didSet { defaults.set(hasCompletedHowToPlayTutorial, forKey: Keys.howToPlay) }
    }

    /// Training bay tip overlay already shown once.
    @Published var hasSeenTrainingTip: Bool {
        didSet { defaults.set(hasSeenTrainingTip, forKey: Keys.trainingTip) }
    }

    /// On-device TTS for COMMS / cutscene dialogue (AVSpeechSynthesizer).
    @Published var dialogueVoicesEnabled: Bool {
        didSet { defaults.set(dialogueVoicesEnabled, forKey: Keys.dialogueVoices) }
    }

    /// Speak when voices are on and SFX are not muted.
    var shouldSpeakDialogue: Bool {
        dialogueVoicesEnabled && soundVolume > 0.001
    }

    var storyDifficulty: StoryDifficulty {
        get { StoryDifficulty(rawValue: storyDifficultyRaw) ?? .medium }
        set { storyDifficultyRaw = newValue.rawValue }
    }

    private let defaults = UserDefaults.standard

    private enum Keys {
        static let soundVolume = "ggg.settings.soundVolume"
        static let haptics = "ggg.settings.haptics"
        static let music = "ggg.settings.music"
        static let musicVolume = "ggg.settings.musicVolume"
        static let flashlight = "ggg.settings.flashlight"
        static let shake = "ggg.settings.shakeSensitivity"
        static let thirdPerson = "ggg.settings.thirdPersonMode.v2"
        static let operatorID = "ggg.settings.operatorID"
        static let difficulty = "ggg.settings.storyDifficulty"
        static let howToPlay = "ggg.settings.howToPlayTutorialCompleted.v2"
        static let dialogueVoices = "ggg.settings.dialogueVoices"
        static let trainingTip = "ggg.settings.trainingTipSeen"
    }

    init() {
        if defaults.object(forKey: Keys.soundVolume) == nil {
            defaults.set(0.9, forKey: Keys.soundVolume)
        }
        if defaults.object(forKey: Keys.haptics) == nil {
            defaults.set(true, forKey: Keys.haptics)
        }
        if defaults.object(forKey: Keys.music) == nil {
            defaults.set(true, forKey: Keys.music)
        }
        if defaults.object(forKey: Keys.musicVolume) == nil {
            defaults.set(0.7, forKey: Keys.musicVolume)
        }
        if defaults.object(forKey: Keys.flashlight) == nil {
            defaults.set(true, forKey: Keys.flashlight)
        }
        if defaults.object(forKey: Keys.shake) == nil {
            defaults.set(0.65, forKey: Keys.shake)
        }
        if defaults.object(forKey: Keys.thirdPerson) == nil {
            defaults.set(true, forKey: Keys.thirdPerson)
        }
        if defaults.object(forKey: Keys.operatorID) == nil {
            defaults.set("grambo", forKey: Keys.operatorID)
        }
        if defaults.object(forKey: Keys.difficulty) == nil {
            defaults.set(StoryDifficulty.medium.rawValue, forKey: Keys.difficulty)
        }
        if defaults.object(forKey: Keys.howToPlay) == nil {
            defaults.set(false, forKey: Keys.howToPlay)
        }
        if defaults.object(forKey: Keys.dialogueVoices) == nil {
            defaults.set(true, forKey: Keys.dialogueVoices)
        }
        if defaults.object(forKey: Keys.trainingTip) == nil {
            defaults.set(false, forKey: Keys.trainingTip)
        }
        soundVolume = defaults.double(forKey: Keys.soundVolume)
        hapticsEnabled = defaults.bool(forKey: Keys.haptics)
        musicEnabled = defaults.bool(forKey: Keys.music)
        musicVolume = defaults.double(forKey: Keys.musicVolume)
        flashlightEnabled = defaults.bool(forKey: Keys.flashlight)
        shakeSensitivity = defaults.double(forKey: Keys.shake)
        thirdPersonMode = defaults.bool(forKey: Keys.thirdPerson)
        selectedOperatorID = defaults.string(forKey: Keys.operatorID) ?? "grambo"
        storyDifficultyRaw = defaults.string(forKey: Keys.difficulty) ?? StoryDifficulty.medium.rawValue
        hasCompletedHowToPlayTutorial = defaults.bool(forKey: Keys.howToPlay)
        hasSeenTrainingTip = defaults.bool(forKey: Keys.trainingTip)
        dialogueVoicesEnabled = defaults.bool(forKey: Keys.dialogueVoices)
    }

    func markHowToPlayCompleted() {
        hasCompletedHowToPlayTutorial = true
    }

    func resetHowToPlayTutorial() {
        hasCompletedHowToPlayTutorial = false
    }

    func markTrainingTipSeen() {
        hasSeenTrainingTip = true
    }
}
