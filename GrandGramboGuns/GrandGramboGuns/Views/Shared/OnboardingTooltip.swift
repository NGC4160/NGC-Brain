// OnboardingTooltip.swift
// First-run tip overlays for Build Gun and Paint Shop.

import SwiftUI

struct OnboardingTooltip: View {
    let title: String
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.55).ignoresSafeArea()
            VStack(alignment: .leading, spacing: 16) {
                Label(title, systemImage: "lightbulb.fill")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAmber)

                Text(message)
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                    .fixedSize(horizontal: false, vertical: true)

                Button("Got it", action: onDismiss)
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(GGGTheme.panel)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(GGGTheme.neonAccent.opacity(0.4), lineWidth: 1.5)
            )
            .padding(28)
        }
        .transition(.opacity.combined(with: .scale(scale: 0.96)))
    }
}
