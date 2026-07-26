// GGGTheme.swift
// Dark military-ish theme with neon accents.

import SwiftUI

enum GGGTheme {
    static let background = Color(hex: "#0B0F0C")!
    static let panel = Color(hex: "#141A16")!
    static let panelElevated = Color(hex: "#1C2420")!
    static let steel = Color(hex: "#8A938C")!
    static let steelDim = Color(hex: "#4A524C")!
    static let neonAccent = Color(hex: "#39FF14")!
    static let neonPink = Color(hex: "#FF2BD6")!
    static let neonAmber = Color(hex: "#FFB000")!
    static let danger = Color(hex: "#FF3B3B")!
    static let title = Color.white
    static let subtitle = Color(hex: "#B7C2BA")!

    static let hubGradient = LinearGradient(
        colors: [
            Color(hex: "#0B0F0C")!,
            Color(hex: "#102018")!,
            Color(hex: "#0B0F0C")!
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let neonGlow = LinearGradient(
        colors: [neonAccent.opacity(0.9), neonPink.opacity(0.55)],
        startPoint: .leading,
        endPoint: .trailing
    )
}

// MARK: - Color hex helper

extension Color {
    init?(hex: String) {
        var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if cleaned.hasPrefix("#") { cleaned.removeFirst() }
        guard cleaned.count == 6,
              let value = UInt64(cleaned, radix: 16) else { return nil }
        let r = Double((value & 0xFF0000) >> 16) / 255
        let g = Double((value & 0x00FF00) >> 8) / 255
        let b = Double(value & 0x0000FF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Shared button styles

struct NeonHubButtonStyle: ButtonStyle {
    var accent: Color = GGGTheme.neonAccent

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 20, weight: .bold, design: .rounded))
            .foregroundStyle(GGGTheme.background)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(accent.opacity(configuration.isPressed ? 0.75 : 1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct GhostHubButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 17, weight: .semibold, design: .rounded))
            .foregroundStyle(GGGTheme.neonAccent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(GGGTheme.panelElevated.opacity(configuration.isPressed ? 0.7 : 1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(GGGTheme.neonAccent.opacity(0.55), lineWidth: 1.5)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}
