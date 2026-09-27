// DialogueVoiceService.swift
// On-device AVSpeechSynthesizer VO for COMMS / cutscene dialogue — no voice packs.

import AVFoundation
import Foundation

/// Speaks existing `StoryDialogueLine` text with faction-tuned pitch/rate and gendered voices.
final class DialogueVoiceService: NSObject, AVSpeechSynthesizerDelegate, @unchecked Sendable {
    static let shared = DialogueVoiceService()

    private let synthesizer = AVSpeechSynthesizer()
    private let lock = NSLock()
    private var ownsMusicDuck = false
    private var cachedVoices: [AVSpeechSynthesisVoice] = []

    /// Queued briefing / transcript lines spoken one-by-one.
    private var sequenceQueue: [StoryDialogueLine] = []
    private var sequenceActive = false
    private var sequenceGap: TimeInterval = 0.35
    private var sequenceGeneration = 0

    private override init() {
        super.init()
        synthesizer.delegate = self
        cachedVoices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.hasPrefix("en") }
    }

    // MARK: - Settings bridge (safe from SceneKit / background)

    /// Mirrors `SettingsStore.shouldSpeakDialogue` via UserDefaults (no MainActor required).
    static var isDialogueSpeechAllowed: Bool {
        let defaults = UserDefaults.standard
        let voicesOn: Bool
        if defaults.object(forKey: "ggg.settings.dialogueVoices") == nil {
            voicesOn = true
        } else {
            voicesOn = defaults.bool(forKey: "ggg.settings.dialogueVoices")
        }
        let volume: Double
        if let stored = defaults.object(forKey: "ggg.settings.soundVolume") as? Double {
            volume = stored
        } else {
            volume = 0.9
        }
        return voicesOn && volume > 0.001
    }

    // MARK: - Public

    /// Speak a dialogue line. Stops any previous utterance / sequence first.
    func speak(line: StoryDialogueLine, enabled: Bool) {
        clearSequence()
        guard enabled else {
            stop()
            return
        }
        let text = line.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else {
            stop()
            return
        }
        speak(
            text: text,
            profile: .forFaction(line.faction, speaker: line.speaker),
            gender: line.resolvedVoiceGender
        )
    }

    /// Speak a short radio one-liner (teammate contact, etc.).
    func speakRadio(speaker: String, text: String, enabled: Bool, gender: OperatorVoiceGender? = nil) {
        clearSequence()
        guard enabled else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        let resolvedGender = gender
            ?? OperatorVoiceGender.forSpeaker(speaker, faction: .kestrel)
        speak(
            text: trimmed,
            profile: .operatorSelf,
            gender: resolvedGender
        )
    }

    /// Auto-play a transcript (briefing / debrief) one line at a time with short gaps.
    func speakSequence(lines: [StoryDialogueLine], enabled: Bool, gap: TimeInterval = 0.35) {
        stop()
        guard enabled else { return }
        let cleaned = lines.filter {
            !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
        guard !cleaned.isEmpty else { return }

        lock.lock()
        sequenceQueue = cleaned
        sequenceActive = true
        sequenceGap = gap
        sequenceGeneration &+= 1
        let gen = sequenceGeneration
        lock.unlock()

        speakNextInSequence(generation: gen)
    }

    /// Speak narration / title-card copy with a neutral system voice.
    func speakNarration(_ text: String, enabled: Bool) {
        clearSequence()
        guard enabled else {
            stop()
            return
        }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            stop()
            return
        }
        speak(text: trimmed, profile: .system, gender: .neutral)
    }

    /// Halt speech, clear any briefing sequence, and restore mission BGM duck if we owned it.
    func stop() {
        clearSequence()

        lock.lock()
        let shouldUnduck = ownsMusicDuck
        ownsMusicDuck = false
        lock.unlock()

        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        if shouldUnduck {
            SoundService.shared.duckMissionMusic(false)
        }
    }

    // MARK: - Internals

    private struct VoiceProfile {
        let rate: Float
        let pitch: Float
        let preferLower: Bool
        let preferHigher: Bool

        /// WATCHTOWER / KESTREL command — firm, slightly lower.
        static let kestrel = VoiceProfile(rate: 0.47, pitch: 0.90, preferLower: true, preferHigher: false)
        /// OVERWATCH — clipped intel cadence.
        static let overwatch = VoiceProfile(rate: 0.54, pitch: 1.02, preferLower: true, preferHigher: false)
        /// Player / field operator — conversational.
        static let operatorSelf = VoiceProfile(rate: 0.50, pitch: 1.05, preferLower: false, preferHigher: false)
        /// Meridian / SPIRE — hostile edge (faster, lower pitch).
        static let meridian = VoiceProfile(rate: 0.55, pitch: 0.80, preferLower: true, preferHigher: false)
        /// ORACLE / Voss — colder, slower.
        static let oracle = VoiceProfile(rate: 0.34, pitch: 0.70, preferLower: true, preferHigher: false)
        /// Neutral system / narration.
        static let system = VoiceProfile(rate: 0.46, pitch: 0.95, preferLower: false, preferHigher: false)

        static func forFaction(_ faction: StorySpeakerFaction, speaker: String) -> VoiceProfile {
            let upper = speaker.uppercased()
            // Speaker-name overrides when faction alone is ambiguous.
            if upper.contains("ORACLE") || upper.contains("VOSS") || upper.contains("LATTICE ECHO") {
                return .oracle
            }
            if upper.contains("SPIRE") || upper.contains("MERIDIAN") || upper.contains("QUARTERMASTER")
                || upper.contains("FOREMAN") || upper.contains("RUNNER") {
                return .meridian
            }
            if upper.contains("WATCHTOWER") || upper.contains("KESTREL") {
                return .kestrel
            }
            if upper.contains("OVERWATCH") {
                return .overwatch
            }
            switch faction {
            case .kestrel: return .kestrel
            case .overwatch: return .overwatch
            case .operatorSelf: return .operatorSelf
            case .meridian: return .meridian
            case .oracle: return .oracle
            case .system: return .system
            }
        }
    }

    private func clearSequence() {
        lock.lock()
        sequenceQueue = []
        sequenceActive = false
        sequenceGeneration &+= 1
        lock.unlock()
    }

    private func speakNextInSequence(generation: Int) {
        lock.lock()
        guard sequenceActive, generation == sequenceGeneration, !sequenceQueue.isEmpty else {
            lock.unlock()
            return
        }
        let line = sequenceQueue.removeFirst()
        lock.unlock()

        let text = line.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else {
            scheduleNextInSequence(generation: generation)
            return
        }
        speak(
            text: text,
            profile: .forFaction(line.faction, speaker: line.speaker),
            gender: line.resolvedVoiceGender
        )
    }

    private func scheduleNextInSequence(generation: Int) {
        DispatchQueue.main.asyncAfter(deadline: .now() + sequenceGap) { [weak self] in
            guard let self else { return }
            self.lock.lock()
            let still = self.sequenceActive && generation == self.sequenceGeneration
            let remaining = self.sequenceQueue.count
            self.lock.unlock()
            if still && remaining > 0 {
                self.speakNextInSequence(generation: generation)
            } else if still {
                self.lock.lock()
                self.sequenceActive = false
                self.lock.unlock()
                self.unduckAfterSpeech()
            }
        }
    }

    private func speak(text: String, profile: VoiceProfile, gender: OperatorVoiceGender) {
        // Stop prior utterance without unducking yet — avoids a BGM swell between lines.
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = profile.rate
        // Nudge pitch slightly by gender when the OS voice is gender-ambiguous.
        switch gender {
        case .female:
            utterance.pitchMultiplier = min(1.25, profile.pitch + 0.06)
        case .male:
            utterance.pitchMultiplier = max(0.65, profile.pitch - 0.04)
        case .neutral:
            utterance.pitchMultiplier = profile.pitch
        }
        utterance.volume = 1.0
        utterance.preUtteranceDelay = 0.05
        utterance.postUtteranceDelay = 0.05
        utterance.voice = pickVoice(profile: profile, gender: gender)

        duckForVO()
        synthesizer.speak(utterance)
    }

    private func pickVoice(profile: VoiceProfile, gender: OperatorVoiceGender) -> AVSpeechSynthesisVoice? {
        let en = cachedVoices.isEmpty
            ? AVSpeechSynthesisVoice.speechVoices().filter { $0.language.hasPrefix("en") }
            : cachedVoices

        let targetAVGender: AVSpeechSynthesisVoiceGender?
        switch gender {
        case .female: targetAVGender = .female
        case .male: targetAVGender = .male
        case .neutral: targetAVGender = nil
        }

        func score(_ voice: AVSpeechSynthesisVoice) -> Int {
            var s = voiceQualityScore(voice) * 10
            if voice.language.hasPrefix("en-US") { s += 5 }
            else if voice.language.hasPrefix("en-GB") { s += profile.preferLower ? 4 : 2 }
            else if voice.language.hasPrefix("en-AU") { s += profile.preferHigher ? 3 : 1 }
            if let targetAVGender, voice.gender == targetAVGender { s += 20 }
            // Prefer not-unspecified when we want a gendered voice.
            if targetAVGender != nil, voice.gender == .unspecified { s -= 5 }
            return s
        }

        let ranked = en.sorted { score($0) > score($1) }
        if let best = ranked.first { return best }
        return AVSpeechSynthesisVoice(language: "en-US")
    }

    private func voiceQualityScore(_ voice: AVSpeechSynthesisVoice) -> Int {
        switch voice.quality {
        case .premium: return 3
        case .enhanced: return 2
        default: return 1
        }
    }

    private func duckForVO() {
        lock.lock()
        let already = ownsMusicDuck
        ownsMusicDuck = true
        lock.unlock()
        if !already {
            SoundService.shared.duckMissionMusic(true)
        }
    }

    private func unduckAfterSpeech() {
        lock.lock()
        let shouldUnduck = ownsMusicDuck
        ownsMusicDuck = false
        lock.unlock()
        if shouldUnduck {
            SoundService.shared.duckMissionMusic(false)
        }
    }

    // MARK: - AVSpeechSynthesizerDelegate

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        lock.lock()
        let gen = sequenceGeneration
        let continueSequence = sequenceActive && !sequenceQueue.isEmpty
        let sequenceDone = sequenceActive && sequenceQueue.isEmpty
        lock.unlock()

        if continueSequence {
            scheduleNextInSequence(generation: gen)
        } else {
            if sequenceDone {
                lock.lock()
                sequenceActive = false
                lock.unlock()
            }
            unduckAfterSpeech()
        }
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        // If we immediately start another line, ownsMusicDuck stays true and we skip unduck.
        // Only unduck when nothing is queued/speaking.
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.lock.lock()
            let speaking = self.synthesizer.isSpeaking
            let seq = self.sequenceActive && !self.sequenceQueue.isEmpty
            self.lock.unlock()
            if !speaking && !seq {
                self.unduckAfterSpeech()
            }
        }
    }
}
