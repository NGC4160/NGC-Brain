// HapticsService.swift
// Thin wrapper around UIKit feedback generators.

import UIKit

enum HapticsService {
    static func fire(enabled: Bool, bodyType: GunBodyType = .pistol) {
        guard enabled else { return }
        let style: UIImpactFeedbackGenerator.FeedbackStyle
        let intensity: CGFloat
        switch bodyType {
        case .smg, .machineGun:
            style = .light; intensity = 0.7
        case .pistol, .rifle:
            style = .medium; intensity = 0.95
        case .shotgun, .sniper:
            style = .heavy; intensity = 1.0
        }
        let gen = UIImpactFeedbackGenerator(style: style)
        gen.prepare()
        gen.impactOccurred(intensity: intensity)
    }

    static func reload(enabled: Bool) {
        guard enabled else { return }
        let gen = UINotificationFeedbackGenerator()
        gen.prepare()
        gen.notificationOccurred(.success)
    }

    static func attach(enabled: Bool) {
        guard enabled else { return }
        let gen = UIImpactFeedbackGenerator(style: .light)
        gen.prepare()
        gen.impactOccurred(intensity: 0.7)
    }

    static func select(enabled: Bool) {
        guard enabled else { return }
        UISelectionFeedbackGenerator().selectionChanged()
    }

    /// Target impact — light for paper, heavy for steel.
    static func hit(enabled: Bool, heavy: Bool = false) {
        guard enabled else { return }
        let gen = UIImpactFeedbackGenerator(style: heavy ? .heavy : .rigid)
        gen.prepare()
        gen.impactOccurred(intensity: heavy ? 1.0 : 0.85)
    }
}
