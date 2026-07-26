// MainHubView.swift
// Cinematic title screen with big navigation buttons.

import SwiftUI

struct MainHubView: View {
    @EnvironmentObject private var appState: AppState
    @State private var pulse = false

    var body: some View {
        ZStack {
            GGGTheme.hubGradient.ignoresSafeArea()
            HexGridBackground()
                .opacity(0.18)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: 24)

                // Brand mark — gun silhouette + title
                VStack(spacing: 14) {
                    GunSilhouetteLogo()
                        .frame(height: 88)
                        .scaleEffect(pulse ? 1.03 : 0.97)
                        .shadow(color: GGGTheme.neonAccent.opacity(0.55), radius: pulse ? 24 : 10)
                        .animation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true), value: pulse)

                    Text("GRAND GRAMBO")
                        .font(.system(size: 34, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                        .tracking(3)

                    Text("GUNS")
                        .font(.system(size: 52, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.neonGlow)
                        .tracking(10)

                    Text("Arcade customizer • Offline toy sim")
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                }
                .padding(.bottom, 36)

                VStack(spacing: 12) {
                    hubButton("Armory", icon: "square.grid.2x2.fill", accent: GGGTheme.neonAccent) {
                        appState.navigate(to: .armory)
                    }
                    hubButton("Build Gun", icon: "wrench.and.screwdriver.fill", accent: GGGTheme.neonAmber) {
                        appState.navigate(to: .buildGun)
                    }
                    hubButton("Paint Shop", icon: "paintpalette.fill", accent: GGGTheme.neonPink) {
                        appState.navigate(to: .paintShop)
                    }
                    hubButton("Skins", icon: "sparkles", accent: Color(hex: "#4DA3FF")!) {
                        appState.navigate(to: .skins)
                    }
                    hubButton("Range", icon: "target", accent: GGGTheme.danger) {
                        appState.navigate(to: .range)
                    }
                }
                .padding(.horizontal, 28)

                Spacer(minLength: 16)

                Button {
                    appState.navigate(to: .settings)
                } label: {
                    Label("Settings", systemImage: "gearshape.fill")
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                }
                .padding(.bottom, 28)
            }
        }
        .navigationBarHidden(true)
        .onAppear { pulse = true }
    }

    private func hubButton(_ title: String, icon: String, accent: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .bold))
                    .frame(width: 28)
                Text(title)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .bold))
                    .opacity(0.7)
            }
            .padding(.horizontal, 20)
        }
        .buttonStyle(NeonHubButtonStyle(accent: accent))
    }
}

// MARK: - Logo / background

struct GunSilhouetteLogo: View {
    var body: some View {
        Canvas { context, size in
            let w = size.width
            let h = size.height
            var path = Path()
            // Stylized side-profile silhouette (toy block shapes).
            path.move(to: CGPoint(x: w * 0.12, y: h * 0.55))
            path.addLine(to: CGPoint(x: w * 0.30, y: h * 0.55))
            path.addLine(to: CGPoint(x: w * 0.34, y: h * 0.35))
            path.addLine(to: CGPoint(x: w * 0.78, y: h * 0.35))
            path.addLine(to: CGPoint(x: w * 0.88, y: h * 0.42))
            path.addLine(to: CGPoint(x: w * 0.88, y: h * 0.52))
            path.addLine(to: CGPoint(x: w * 0.55, y: h * 0.52))
            path.addLine(to: CGPoint(x: w * 0.50, y: h * 0.70))
            path.addLine(to: CGPoint(x: w * 0.38, y: h * 0.70))
            path.addLine(to: CGPoint(x: w * 0.34, y: h * 0.55))
            path.addLine(to: CGPoint(x: w * 0.12, y: h * 0.55))
            path.closeSubpath()

            context.fill(path, with: .color(GGGTheme.neonAccent.opacity(0.92)))
            context.stroke(path, with: .color(.white.opacity(0.35)), lineWidth: 2)
        }
        .aspectRatio(2.4, contentMode: .fit)
    }
}

struct HexGridBackground: View {
    var body: some View {
        Canvas { context, size in
            let step: CGFloat = 36
            var y: CGFloat = 0
            var row = 0
            while y < size.height + step {
                var x: CGFloat = row.isMultiple(of: 2) ? 0 : step * 0.5
                while x < size.width + step {
                    var hex = Path()
                    let r: CGFloat = 14
                    for i in 0..<6 {
                        let angle = CGFloat(i) * .pi / 3 - .pi / 6
                        let pt = CGPoint(x: x + cos(angle) * r, y: y + sin(angle) * r)
                        if i == 0 { hex.move(to: pt) } else { hex.addLine(to: pt) }
                    }
                    hex.closeSubpath()
                    context.stroke(hex, with: .color(GGGTheme.neonAccent.opacity(0.25)), lineWidth: 0.8)
                    x += step
                }
                y += step * 0.75
                row += 1
            }
        }
    }
}
