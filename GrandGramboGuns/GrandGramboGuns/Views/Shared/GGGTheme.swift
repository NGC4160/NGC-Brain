// GGGTheme.swift
// Shared bright tactical-arcade design system.

import SwiftUI

enum GGGTheme {
    static let background = Color(hex: "#0A1E38")!
    static let panel = Color(hex: "#123352")!
    static let panelElevated = Color(hex: "#1A4468")!
    static let gunmetal = Color(hex: "#24567A")!
    static let olive = Color(hex: "#36CFC9")!
    static let steel = Color(hex: "#D4EEF8")!
    static let steelDim = Color(hex: "#8BB0C4")!
    /// Classic IR / arcade neon green (original brand accent).
    static let neonAccent = Color(hex: "#39FF14")!
    /// Gun silhouette mark — always the original neon green.
    static let logoGreen = Color(hex: "#39FF14")!
    static let neonPink = Color(hex: "#F078C6")!
    static let neonAmber = Color(hex: "#FFC64A")!
    static let danger = Color(hex: "#FF5E63")!
    static let friendly = Color(hex: "#45DCE0")!
    static let border = Color(hex: "#3A8BB0")!
    static let title = Color.white
    static let subtitle = Color(hex: "#B8DCEC")!

    static let hubGradient = LinearGradient(
        colors: [
            Color(hex: "#123A5C")!,
            Color(hex: "#0A1E38")!,
            Color(hex: "#0E2744")!
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let neonGlow = LinearGradient(
        colors: [friendly, neonAccent],
        startPoint: .leading,
        endPoint: .trailing
    )

    static let panelGradient = LinearGradient(
        colors: [panelElevated.opacity(0.98), panel.opacity(0.98)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Rank badge accent — mirrors `PlayerRank.badgeColor` for theme-side access.
    static func rankBadge(_ rank: PlayerRank) -> Color {
        rank.badgeColor
    }
}

// MARK: - Tactical geometry / surfaces

struct ChamferedRectangle: Shape {
    var cut: CGFloat = 8

    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX + cut, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - cut, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + cut))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - cut))
        path.addLine(to: CGPoint(x: rect.maxX - cut, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX + cut, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - cut))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + cut))
        path.closeSubpath()
        return path
    }
}

struct TacticalPanelModifier: ViewModifier {
    var accent: Color
    var cut: CGFloat

    func body(content: Content) -> some View {
        content
            .background(
                ChamferedRectangle(cut: cut)
                    .fill(GGGTheme.panelGradient)
            )
            .overlay(
                ChamferedRectangle(cut: cut)
                    .stroke(
                        LinearGradient(
                            colors: [accent.opacity(0.7), GGGTheme.border, GGGTheme.friendly.opacity(0.35)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .overlay(alignment: .leading) {
                Rectangle()
                    .fill(accent)
                    .frame(width: 3)
                    .padding(.vertical, cut)
            }
            .shadow(color: accent.opacity(0.12), radius: 7, y: 2)
    }
}

extension View {
    func tacticalPanel(accent: Color = GGGTheme.olive, cut: CGFloat = 8) -> some View {
        modifier(TacticalPanelModifier(accent: accent, cut: cut))
    }
}

struct TacticalSectionLabel: View {
    let code: String
    let title: String

    var body: some View {
        HStack(spacing: 8) {
            Text(code)
                .foregroundStyle(GGGTheme.neonAmber)
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [GGGTheme.border.opacity(0.25), GGGTheme.friendly.opacity(0.7)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(height: 1)
            Text(title)
                .foregroundStyle(GGGTheme.steel)
        }
        .font(.system(size: 10, weight: .bold, design: .monospaced))
        .tracking(1.2)
    }
}

struct TacticalStatusStrip: View {
    let text: String
    var systemImage: String = "antenna.radiowaves.left.and.right"
    var accent: Color = GGGTheme.neonAmber

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: systemImage)
                .font(.system(size: 10, weight: .bold))
            Text(text.uppercased())
                .lineLimit(2)
            Spacer(minLength: 0)
        }
        .font(.system(size: 9, weight: .bold, design: .monospaced))
        .tracking(0.4)
        .foregroundStyle(accent)
        .padding(.horizontal, 10)
        .frame(minHeight: 30)
        .background(
            LinearGradient(
                colors: [GGGTheme.panelElevated, GGGTheme.panel],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .overlay(
            Rectangle()
                .stroke(accent.opacity(0.42), lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
    }
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
            .font(.system(size: 15, weight: .bold, design: .monospaced))
            .foregroundStyle(Color.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                ChamferedRectangle(cut: 8)
                    .fill(
                        configuration.isPressed
                            ? AnyShapeStyle(GGGTheme.gunmetal)
                            : AnyShapeStyle(GGGTheme.panelGradient)
                    )
            )
            .overlay(
                ChamferedRectangle(cut: 8)
                    .stroke(accent.opacity(configuration.isPressed ? 0.95 : 0.7), lineWidth: 1.2)
            )
            .overlay(alignment: .leading) {
                Rectangle()
                    .fill(accent)
                    .frame(width: 4)
                    .padding(.vertical, 8)
            }
            .shadow(color: accent.opacity(0.18), radius: 7, y: 2)
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct GhostHubButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .bold, design: .monospaced))
            .foregroundStyle(GGGTheme.neonAccent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                ChamferedRectangle(cut: 7)
                    .fill(GGGTheme.panelElevated.opacity(configuration.isPressed ? 0.7 : 1))
            )
            .overlay(
                ChamferedRectangle(cut: 7)
                    .stroke(GGGTheme.neonAccent.opacity(0.55), lineWidth: 1.5)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}
