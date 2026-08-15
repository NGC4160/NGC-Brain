// MotionShakeService.swift
// Detects device shakes for shake-to-shoot mode (CoreMotion).

import Foundation
import CoreMotion
import Combine

@MainActor
final class MotionShakeService: ObservableObject {
    @Published private(set) var shakePulse: Int = 0

    private let motion = CMMotionManager()
    private var lastFire = Date.distantPast
    private var cooldown: TimeInterval = 0.12
    private var threshold: Double = 2.4
    /// When true, sustained high acceleration keeps firing at `cooldown` (SMG / MG feel).
    private var sustainFire = true

    func start(sensitivity: Double, minInterval: TimeInterval, sustainWhileShaking: Bool = true) {
        cooldown = max(0.04, minInterval)
        // sensitivity 0…1 → threshold ~3.2 (gentle) … 1.6 (hair trigger)
        threshold = 3.2 - (sensitivity * 1.6)
        sustainFire = sustainWhileShaking

        guard motion.isAccelerometerAvailable else { return }
        motion.accelerometerUpdateInterval = 1.0 / 60.0
        motion.startAccelerometerUpdates(to: .main) { [weak self] data, _ in
            guard let self, let data else { return }
            let a = data.acceleration
            let magnitude = sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
            let jerk = abs(magnitude - 1.0)
            let active = magnitude > self.threshold || jerk > (self.threshold - 1.0)
            guard active else { return }

            let now = Date()
            guard now.timeIntervalSince(self.lastFire) >= self.cooldown else { return }
            self.lastFire = now
            self.shakePulse += 1
        }
    }

    func stop() {
        motion.stopAccelerometerUpdates()
    }

    /// Simulator / accessibility: treat as a shake.
    func simulateShake() {
        let now = Date()
        guard now.timeIntervalSince(lastFire) >= cooldown else { return }
        lastFire = now
        shakePulse += 1
    }
}
