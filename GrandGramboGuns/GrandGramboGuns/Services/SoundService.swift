// SoundService.swift
// Offline arcade audio — prebaked SFX buffers + separate looping mission BGM player.

import AVFoundation
import AudioToolbox
import QuartzCore

/// Mission BGM intensity — maps cheaply to act number (1…3).
enum MissionMusicIntensity: Int, Sendable {
    case low = 1
    case mid = 2
    case high = 3

    static func forAct(_ act: Int) -> MissionMusicIntensity {
        switch act {
        case ...1: return .low
        case 2: return .mid
        default: return .high
        }
    }

    /// Relative gain vs the quiet music bed (~−15 dB under full-scale SFX).
    /// High is slightly hotter for Act III / DLC (Ghost Lattice reuses hot BGM).
    var gain: Float {
        switch self {
        case .low: return 0.85
        case .mid: return 1.0
        case .high: return 1.18
        }
    }

    var resourceName: String {
        switch self {
        case .high: return "mission_bgm_hot"
        case .low, .mid: return "mission_bgm_combat"
        }
    }
}

/// Offline arcade sounds via cached buffers — safe to call from SceneKit callbacks.
/// Mission music uses a dedicated looping AVAudioPlayer so SFX stay audible underneath.
final class SoundService: @unchecked Sendable {
    static let shared = SoundService()

    private let lock = NSLock()
    private var players: [AVAudioPlayer] = []
    private var fireWAV: [GunBodyType: Data] = [:]
    private var emptyWAV: Data?
    private var reloadWAV: Data?
    private var attachWAV: Data?
    private var hitWAV: Data?
    private var headshotWAV: Data?
    private var killWAV: Data?
    private var ricochetWAV: Data?
    private var victoryStingWAV: Data?
    private var defeatStingWAV: Data?
    private var hubLoopWAV: Data?
    private var lastFireTime: CFTimeInterval = 0
    private let minFireGap: CFTimeInterval = 0.028

    private enum MusicKind: Equatable {
        case none
        case mission(String) // resource basename
        case hub
    }

    // Separate mix bus for BGM — never shares the SFX player pool.
    private var musicPlayer: AVAudioPlayer?
    private var musicKind: MusicKind = .none
    private var musicTargetVolume: Float = 0
    private var musicDucked = false
    /// Bumps to cancel in-flight fade callbacks when start/stop races.
    private var musicGeneration: UInt64 = 0
    /// ~−15 dB relative to unity so gunshots cut through.
    private let musicBedGain: Float = 0.178
    /// Hub bed sits quieter than combat (~−20 dB).
    private let hubMusicBedGain: Float = 0.10

    private init() {
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        warmBuffers()
    }

    private func warmBuffers() {
        for type in GunBodyType.allCases {
            fireWAV[type] = makeFireWAV(for: type)
        }
        emptyWAV = makeBurstWAV(frequency: 900, duration: 0.035, volume: 0.35, noiseMix: 0.05, pitchDecay: 6.0)
        reloadWAV = makeBurstWAV(frequency: 220, duration: 0.08, volume: 0.5, noiseMix: 0.15, pitchDecay: 1.2)
        attachWAV = makeBurstWAV(frequency: 480, duration: 0.04, volume: 0.4, noiseMix: 0.1, pitchDecay: 4.0)
        hitWAV = makeBurstWAV(frequency: 980, duration: 0.04, volume: 0.5, noiseMix: 0.18, pitchDecay: 6.0)
        headshotWAV = makeBurstWAV(frequency: 1320, duration: 0.07, volume: 0.62, noiseMix: 0.12, pitchDecay: 4.5)
        killWAV = makeBurstWAV(frequency: 160, duration: 0.11, volume: 0.7, noiseMix: 0.35, pitchDecay: 2.2)
        ricochetWAV = makeBurstWAV(frequency: 1400, duration: 0.07, volume: 0.55, noiseMix: 0.55, pitchDecay: 8.0)
        victoryStingWAV = makeChordSting(freqs: [220, 277, 330], duration: 0.42, volume: 0.55)
        defeatStingWAV = makeChordSting(freqs: [110, 98, 82], duration: 0.48, volume: 0.5)
        hubLoopWAV = makeHubLoopWAV()
    }

    func playFire(bodyType: GunBodyType, volume: Double) {
        let now = CACurrentMediaTime()
        // Hard cap — prevents audio/main-thread storms during SMG + enemy fire.
        guard now - lastFireTime >= minFireGap else { return }
        lastFireTime = now

        let v = Float(max(0, min(1, volume)))
        if let data = fireWAV[bodyType] {
            playCached(data, volume: v)
        }
        // System clicks are cheap; skip for high-rate weapons to avoid spam.
        switch bodyType {
        case .smg, .machineGun: break
        case .pistol: AudioServicesPlaySystemSound(1104)
        case .rifle: AudioServicesPlaySystemSound(1103)
        case .shotgun, .sniper: AudioServicesPlaySystemSound(1057)
        }
    }

    func playEmpty(volume: Double) {
        if let data = emptyWAV { playCached(data, volume: Float(max(0, min(1, volume)))) }
        AudioServicesPlaySystemSound(1105)
    }

    func playFire(volume: Double) {
        playFire(bodyType: .pistol, volume: volume)
    }

    func playReload(volume: Double) {
        if let data = reloadWAV { playCached(data, volume: Float(max(0, min(1, volume)))) }
        AudioServicesPlaySystemSound(1105)
    }

    func playAttach(volume: Double) {
        if let data = attachWAV { playCached(data, volume: Float(max(0, min(1, volume)))) }
    }

    func playHit(volume: Double) {
        if let data = hitWAV { playCached(data, volume: Float(max(0, min(1, volume)))) }
    }

    func playHeadshot(volume: Double) {
        if let data = headshotWAV { playCached(data, volume: Float(max(0, min(1, volume)))) }
        AudioServicesPlaySystemSound(1057)
    }

    func playKillConfirm(volume: Double) {
        if let data = killWAV { playCached(data, volume: Float(max(0, min(1, volume)) * 0.9)) }
    }

    func playVictorySting(volume: Double) {
        if let data = victoryStingWAV { playCached(data, volume: Float(max(0, min(1, volume)))) }
    }

    func playDefeatSting(volume: Double) {
        if let data = defeatStingWAV { playCached(data, volume: Float(max(0, min(1, volume)))) }
    }

    /// Sharp metallic ping for steel-plate impacts.
    func playRicochet(volume: Double) {
        if let data = ricochetWAV { playCached(data, volume: Float(max(0, min(1, volume)))) }
        AudioServicesPlaySystemSound(1057)
    }

    // MARK: - Mission BGM

    /// Start looping mission combat music. No-op when disabled or volume is ~0.
    /// Safe to call repeatedly — restarts only when the track/intensity changes.
    func startMissionMusic(
        enabled: Bool,
        musicVolume: Double,
        intensity: MissionMusicIntensity = .mid
    ) {
        guard enabled, musicVolume > 0.001 else {
            stopMissionMusic(fadeOut: true)
            return
        }

        let target = musicBedGain
            * intensity.gain
            * Float(max(0, min(1, musicVolume)))
        let kind = MusicKind.mission(intensity.resourceName)

        lock.lock()
        let playingSame = musicKind == kind && musicPlayer?.isPlaying == true
        if playingSame {
            musicGeneration &+= 1
            musicTargetVolume = target
            musicDucked = false
            let player = musicPlayer
            let gen = musicGeneration
            lock.unlock()
            fadeMusic(player: player, to: target, generation: gen)
            return
        }
        lock.unlock()

        stopMissionMusic(fadeOut: false)

        guard let url = Bundle.main.url(forResource: intensity.resourceName, withExtension: "wav") else {
            return
        }

        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.numberOfLoops = -1
            player.volume = 0
            player.prepareToPlay()
            player.play()

            lock.lock()
            musicGeneration &+= 1
            let gen = musicGeneration
            musicPlayer = player
            musicKind = kind
            musicTargetVolume = target
            musicDucked = false
            lock.unlock()
            fadeMusic(player: player, to: target, generation: gen)
        } catch {
            // Ignore — combat must continue without music.
        }
    }

    /// Quiet procedural hub bed. Stops automatically when mission music starts.
    func startHubMusic(enabled: Bool, musicVolume: Double) {
        guard enabled, musicVolume > 0.001 else {
            stopHubMusic(fadeOut: true)
            return
        }

        let target = hubMusicBedGain * Float(max(0, min(1, musicVolume)))

        lock.lock()
        let playingSame = musicKind == .hub && musicPlayer?.isPlaying == true
        if playingSame {
            musicGeneration &+= 1
            musicTargetVolume = target
            musicDucked = false
            let player = musicPlayer
            let gen = musicGeneration
            lock.unlock()
            fadeMusic(player: player, to: target, generation: gen)
            return
        }
        lock.unlock()

        stopMissionMusic(fadeOut: false)

        guard let data = hubLoopWAV else { return }
        do {
            let player = try AVAudioPlayer(data: data)
            player.numberOfLoops = -1
            player.volume = 0
            player.prepareToPlay()
            player.play()

            lock.lock()
            musicGeneration &+= 1
            let gen = musicGeneration
            musicPlayer = player
            musicKind = .hub
            musicTargetVolume = target
            musicDucked = false
            lock.unlock()
            fadeMusic(player: player, to: target, generation: gen)
        } catch {
            // Ignore — hub stays silent.
        }
    }

    func stopHubMusic(fadeOut: Bool = true) {
        lock.lock()
        let isHub = musicKind == .hub
        lock.unlock()
        guard isHub else { return }
        stopMissionMusic(fadeOut: fadeOut)
    }

    func updateHubMusicVolume(enabled: Bool, musicVolume: Double) {
        if !enabled || musicVolume <= 0.001 {
            stopHubMusic(fadeOut: true)
            return
        }
        lock.lock()
        let isHub = musicKind == .hub
        lock.unlock()
        if !isHub {
            startHubMusic(enabled: enabled, musicVolume: musicVolume)
            return
        }
        lock.lock()
        musicTargetVolume = hubMusicBedGain * Float(max(0, min(1, musicVolume)))
        let dest = musicTargetVolume * (musicDucked ? 0.28 : 1.0)
        let player = musicPlayer
        musicGeneration &+= 1
        let gen = musicGeneration
        lock.unlock()
        fadeMusic(player: player, to: dest, generation: gen)
    }

    /// Soften music under COMMS / cutscene overlays without killing the loop.
    func duckMissionMusic(_ ducked: Bool) {
        lock.lock()
        musicDucked = ducked
        let player = musicPlayer
        let dest = musicTargetVolume * (ducked ? 0.28 : 1.0)
        musicGeneration &+= 1
        let gen = musicGeneration
        lock.unlock()
        fadeMusic(player: player, to: dest, generation: gen)
    }

    /// Update live music level (settings slider) without restarting the loop.
    func updateMissionMusicVolume(enabled: Bool, musicVolume: Double, intensity: MissionMusicIntensity = .mid) {
        if !enabled || musicVolume <= 0.001 {
            stopMissionMusic(fadeOut: true)
            return
        }
        lock.lock()
        let hasPlayer = musicPlayer != nil
        lock.unlock()
        if !hasPlayer {
            startMissionMusic(enabled: enabled, musicVolume: musicVolume, intensity: intensity)
            return
        }
        lock.lock()
        musicTargetVolume = musicBedGain * intensity.gain * Float(max(0, min(1, musicVolume)))
        let dest = musicTargetVolume * (musicDucked ? 0.28 : 1.0)
        let player = musicPlayer
        musicGeneration &+= 1
        let gen = musicGeneration
        lock.unlock()
        fadeMusic(player: player, to: dest, generation: gen)
    }

    /// Stop BGM (mission or hub). Call on victory/fail/exit so music never leaks.
    func stopMissionMusic(fadeOut: Bool = true) {
        lock.lock()
        musicGeneration &+= 1
        let gen = musicGeneration
        musicTargetVolume = 0
        musicDucked = false
        musicKind = .none
        guard let player = musicPlayer else {
            lock.unlock()
            return
        }
        musicPlayer = nil
        lock.unlock()

        if fadeOut, player.isPlaying, player.volume > 0.01 {
            fadeMusic(player: player, to: 0, generation: gen) {
                player.stop()
            }
            // Hard stop in case a newer start/stop cancelled the fade callbacks.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                if player.isPlaying { player.stop() }
            }
        } else {
            player.stop()
        }
    }

    private func fadeMusic(
        player: AVAudioPlayer?,
        to dest: Float,
        generation: UInt64,
        completion: (() -> Void)? = nil
    ) {
        guard let player else {
            completion?()
            return
        }
        let start = player.volume
        let steps = 6
        for step in 1...steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.03 * Double(step)) { [weak self] in
                guard let self else { return }
                self.lock.lock()
                let current = self.musicGeneration
                self.lock.unlock()
                guard current == generation else { return }
                let p = Float(step) / Float(steps)
                player.volume = start + (dest - start) * p
                if step == steps {
                    completion?()
                }
            }
        }
    }

    private func playCached(_ data: Data, volume: Float) {
        // Keep AVAudioPlayer creation off the hot path when possible by cloning quickly.
        do {
            let player = try AVAudioPlayer(data: data)
            player.volume = volume
            player.play()
            lock.lock()
            players.append(player)
            if players.count > 12 {
                players.removeAll { !$0.isPlaying }
                if players.count > 12 {
                    players.removeFirst(players.count - 12)
                }
            }
            lock.unlock()
        } catch {
            // Ignore — game must keep running even if audio fails.
        }
    }

    private func makeFireWAV(for type: GunBodyType) -> Data? {
        // Distinct timbre per class — pitch, length, and noise mix do the heavy lifting.
        switch type {
        case .pistol:
            return makeBurstWAV(frequency: 210, duration: 0.048, volume: 0.95, noiseMix: 0.38, pitchDecay: 2.8)
        case .smg:
            return makeBurstWAV(frequency: 390, duration: 0.022, volume: 0.68, noiseMix: 0.62, pitchDecay: 4.2)
        case .rifle:
            return makeBurstWAV(frequency: 105, duration: 0.095, volume: 1.0, noiseMix: 0.32, pitchDecay: 1.45)
        case .shotgun:
            return makeBurstWAV(frequency: 48, duration: 0.20, volume: 1.0, noiseMix: 0.88, pitchDecay: 0.75)
        case .machineGun:
            return makeBurstWAV(frequency: 78, duration: 0.034, volume: 0.92, noiseMix: 0.58, pitchDecay: 3.4)
        case .sniper:
            return makeBurstWAV(frequency: 42, duration: 0.26, volume: 1.0, noiseMix: 0.52, pitchDecay: 0.62)
        }
    }

    private func makeChordSting(freqs: [Double], duration: Double, volume: Double) -> Data? {
        let sampleRate = 16000.0
        let frameCount = Int(duration * sampleRate)
        guard frameCount > 0, !freqs.isEmpty else { return nil }
        var data = Data(count: frameCount * MemoryLayout<Float>.size)
        data.withUnsafeMutableBytes { raw in
            guard let ptr = raw.bindMemory(to: Float.self).baseAddress else { return }
            var phases = Array(repeating: 0.0, count: freqs.count)
            for i in 0..<frameCount {
                let t = Double(i) / sampleRate
                let env = exp(-t * 3.2) * (1.0 - t / duration)
                var sample = 0.0
                for (idx, f) in freqs.enumerated() {
                    phases[idx] += 2.0 * Double.pi * f / sampleRate
                    sample += sin(phases[idx]) / Double(freqs.count)
                }
                ptr[i] = Float(sample * env * volume)
            }
        }
        return Self.makeWAV(pcmFloat32: data, sampleRate: Int(sampleRate))
    }

    /// Dark tactical hub loop — original procedural bed (no copyrighted material).
    private func makeHubLoopWAV() -> Data? {
        let sampleRate = 16000.0
        let duration = 4.0
        let frameCount = Int(duration * sampleRate)
        var data = Data(count: frameCount * MemoryLayout<Float>.size)
        data.withUnsafeMutableBytes { raw in
            guard let ptr = raw.bindMemory(to: Float.self).baseAddress else { return }
            var p1 = 0.0, p2 = 0.0, p3 = 0.0
            var noiseSeed: UInt64 = 0xC0FFEE42
            for i in 0..<frameCount {
                let t = Double(i) / sampleRate
                // Soft pulse every ~1.33s
                let pulse = max(0, sin(t * Double.pi * 1.5)) * 0.35
                p1 += 2.0 * Double.pi * 55.0 / sampleRate
                p2 += 2.0 * Double.pi * 82.5 / sampleRate
                p3 += 2.0 * Double.pi * 110.0 / sampleRate
                noiseSeed = noiseSeed &* 6364136223846793005 &+ 1
                let noise = Double(Int64(bitPattern: noiseSeed) % 10001) / 5000.0 - 1.0
                let drone = sin(p1) * 0.45 + sin(p2) * 0.28 + sin(p3) * 0.12 * pulse
                let bed = drone + noise * 0.04
                // Edge fade so loop seams stay quiet
                let edge = min(1.0, Double(i) / 800.0, Double(frameCount - i) / 800.0)
                ptr[i] = Float(bed * 0.55 * edge)
            }
        }
        return Self.makeWAV(pcmFloat32: data, sampleRate: Int(sampleRate))
    }

    private func makeBurstWAV(
        frequency: Double,
        duration: Double,
        volume: Double,
        noiseMix: Double,
        pitchDecay: Double
    ) -> Data? {
        let sampleRate = 16000.0
        let frameCount = Int(duration * sampleRate)
        guard frameCount > 0 else { return nil }

        var data = Data(count: frameCount * MemoryLayout<Float>.size)
        data.withUnsafeMutableBytes { raw in
            guard let ptr = raw.bindMemory(to: Float.self).baseAddress else { return }
            var phase = 0.0
            var noiseSeed: UInt64 = 0xDEADBEEF
            for i in 0..<frameCount {
                let t = Double(i) / sampleRate
                let env = exp(-t * (3.0 + pitchDecay))
                let freq = frequency * (1.0 + 0.35 * exp(-t * pitchDecay * 2))
                phase += 2.0 * Double.pi * freq / sampleRate
                // Deterministic noise (no Double.random per sample — was a freeze source).
                noiseSeed = noiseSeed &* 6364136223846793005 &+ 1
                let noise = Double(Int64(bitPattern: noiseSeed) % 10001) / 5000.0 - 1.0
                let tone = sin(phase)
                ptr[i] = Float((tone * (1 - noiseMix) + noise * noiseMix) * env * volume)
            }
        }
        return Self.makeWAV(pcmFloat32: data, sampleRate: Int(sampleRate))
    }

    private static func makeWAV(pcmFloat32: Data, sampleRate: Int) -> Data? {
        let floatCount = pcmFloat32.count / MemoryLayout<Float>.size
        var int16 = Data(count: floatCount * 2)
        pcmFloat32.withUnsafeBytes { srcRaw in
            int16.withUnsafeMutableBytes { dstRaw in
                guard let src = srcRaw.bindMemory(to: Float.self).baseAddress,
                      let dst = dstRaw.bindMemory(to: Int16.self).baseAddress else { return }
                for i in 0..<floatCount {
                    let clipped = max(-1, min(1, src[i]))
                    dst[i] = Int16(clipped * Float(Int16.max))
                }
            }
        }

        let channels: UInt16 = 1
        let bitsPerSample: UInt16 = 16
        let byteRate = UInt32(sampleRate) * UInt32(channels) * UInt32(bitsPerSample / 8)
        let blockAlign = channels * bitsPerSample / 8
        let dataSize = UInt32(int16.count)

        var wav = Data()
        func appendUInt32(_ v: UInt32) {
            var le = v.littleEndian
            wav.append(Data(bytes: &le, count: 4))
        }
        func appendUInt16(_ v: UInt16) {
            var le = v.littleEndian
            wav.append(Data(bytes: &le, count: 2))
        }

        wav.append(contentsOf: [0x52, 0x49, 0x46, 0x46]) // RIFF
        appendUInt32(36 + dataSize)
        wav.append(contentsOf: [0x57, 0x41, 0x56, 0x45]) // WAVE
        wav.append(contentsOf: [0x66, 0x6D, 0x74, 0x20]) // fmt
        appendUInt32(16)
        appendUInt16(1)
        appendUInt16(channels)
        appendUInt32(UInt32(sampleRate))
        appendUInt32(byteRate)
        appendUInt16(blockAlign)
        appendUInt16(bitsPerSample)
        wav.append(contentsOf: [0x64, 0x61, 0x74, 0x61]) // data
        appendUInt32(dataSize)
        wav.append(int16)
        return wav
    }
}
