// SoundService.swift
// Lightweight procedural / system-sound arcade audio.
// Keeps the app fully offline — no bundled gunshot samples required.

import AVFoundation
import AudioToolbox

@MainActor
final class SoundService {
    static let shared = SoundService()

    private var players: [AVAudioPlayer] = []

    private init() {
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default)
        try? AVAudioSession.sharedInstance().setActive(true)
    }

    func playFire(volume: Double) {
        // Soft click as a stand-in arcade “pew” — not a realistic firearm sound.
        AudioServicesPlaySystemSound(1104)
        _ = volume
    }

    func playReload(volume: Double) {
        AudioServicesPlaySystemSound(1105)
        _ = volume
    }

    func playAttach(volume: Double) {
        AudioServicesPlaySystemSound(1103)
        _ = volume
    }

    func playHit(volume: Double) {
        AudioServicesPlaySystemSound(1057)
        _ = volume
    }
}
