// LoadingSplashView.swift
// Cold-start splash — brand + progress before Hub / optional How to Play.

import SwiftUI

struct LoadingSplashView: View {
    var progress: Double
    var statusLine: String

    @State private var pulse = false

    var body: some View {
        ZStack {
            GGGTheme.hubGradient.ignoresSafeArea()

            // Soft neon wash
            RadialGradient(
                colors: [
                    GGGTheme.neonAccent.opacity(0.14),
                    Color.clear
                ],
                center: .center,
                startRadius: 20,
                endRadius: 280
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: 40)

                VStack(spacing: 18) {
                    GunSilhouetteLogo()
                        .frame(height: 88)
                        .scaleEffect(pulse ? 1.04 : 0.96)
                        .shadow(color: GGGTheme.logoGreen.opacity(pulse ? 0.65 : 0.3), radius: pulse ? 28 : 12)
                        .animation(.easeInOut(duration: 1.75).repeatForever(autoreverses: true), value: pulse)

                    Text("GRAND GRAMBO GUNS")
                        .font(.system(size: 28, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                        .tracking(2.4)
                        .multilineTextAlignment(.center)

                    Text("TACTICAL ARCADE")
                        .font(.system(size: 12, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.neonAccent)
                        .tracking(3)
                }

                Spacer(minLength: 36)

                VStack(spacing: 14) {
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 6, style: .continuous)
                            .fill(GGGTheme.panelElevated)
                            .overlay(
                                RoundedRectangle(cornerRadius: 6, style: .continuous)
                                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
                            )

                        GeometryReader { geo in
                            let w = max(8, geo.size.width * min(max(progress, 0), 1))
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .fill(GGGTheme.neonGlow)
                                .frame(width: w)
                                .shadow(color: GGGTheme.neonAccent.opacity(0.45), radius: 8, y: 0)
                        }
                    }
                    .frame(height: 10)
                    .padding(.horizontal, 40)

                    HStack {
                        Text(statusLine.uppercased())
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(GGGTheme.subtitle)
                            .tracking(1.2)
                        Spacer()
                        Text("\(Int((min(max(progress, 0), 1) * 100).rounded()))%")
                            .font(.system(size: 12, weight: .heavy, design: .rounded))
                            .foregroundStyle(GGGTheme.neonAccent)
                            .monospacedDigit()
                    }
                    .padding(.horizontal, 44)

                    Text("Stylized video-game toy — not real firearms training.")
                        .font(.system(size: 11, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.steelDim)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 36)
                        .padding(.top, 4)
                }
                .padding(.vertical, 22)
                .background(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(GGGTheme.panel.opacity(0.92))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .stroke(GGGTheme.neonAccent.opacity(0.28), lineWidth: 1.2)
                        )
                )
                .padding(.horizontal, 24)
                .padding(.bottom, 48)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            pulse = true
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Loading Grand Grambo Guns")
        .accessibilityValue("\(Int((min(max(progress, 0), 1) * 100).rounded())) percent")
    }
}

#if DEBUG
struct LoadingSplashView_Previews: PreviewProvider {
    static var previews: some View {
        LoadingSplashView(progress: 0.62, statusLine: "Arming systems")
    }
}
#endif
