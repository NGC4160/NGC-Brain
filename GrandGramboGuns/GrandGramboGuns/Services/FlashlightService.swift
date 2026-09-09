// FlashlightService.swift
// Brief torch flash to simulate muzzle flash (no-op on Simulator / unsupported devices).

import AVFoundation
import UIKit

enum FlashlightService {
    /// Pulses the rear torch for a short burst. Safe to call frequently.
    static func muzzleFlash(duration: TimeInterval = 0.06) {
        #if targetEnvironment(simulator)
        return
        #else
        guard let device = AVCaptureDevice.default(for: .video),
              device.hasTorch else { return }

        DispatchQueue.global(qos: .userInteractive).async {
            do {
                try device.lockForConfiguration()
                try device.setTorchModeOn(level: 1.0)
                device.unlockForConfiguration()

                Thread.sleep(forTimeInterval: duration)

                try device.lockForConfiguration()
                device.torchMode = .off
                device.unlockForConfiguration()
            } catch {
                // Torch unavailable or busy — ignore.
            }
        }
        #endif
    }

    static func setEnabled(_ on: Bool) {
        #if targetEnvironment(simulator)
        return
        #else
        guard let device = AVCaptureDevice.default(for: .video),
              device.hasTorch else { return }
        do {
            try device.lockForConfiguration()
            device.torchMode = on ? .on : .off
            device.unlockForConfiguration()
        } catch {}
        #endif
    }

    /// Cheap cold-start touch so first muzzle flash isn’t delayed. Never blocks forever.
    static func warmUp() async {
        #if targetEnvironment(simulator)
        try? await Task.sleep(nanoseconds: 40_000_000)
        #else
        await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
            DispatchQueue.global(qos: .utility).async {
                _ = AVCaptureDevice.default(for: .video)?.hasTorch
                cont.resume()
            }
        }
        #endif
    }
}
