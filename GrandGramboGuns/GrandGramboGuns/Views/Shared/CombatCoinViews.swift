// CombatCoinViews.swift
// Hub balance chip, session earnings, and compact +CC kill toast (right edge).

import SwiftUI

struct HubCombatCoinBalance: View {
    @ObservedObject var coins: CombatCoinStore

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "circle.hexagongrid.circle.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(GGGTheme.neonAmber)
                .shadow(color: GGGTheme.neonAmber.opacity(0.5), radius: 5, y: 0)
            Text("\(coins.balance) CC")
                .font(.system(size: 13, weight: .heavy, design: .monospaced))
                .foregroundStyle(.white)
            Spacer()
            Text("+\(CombatCoinStore.coinsPerKill)/kill")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .foregroundStyle(GGGTheme.steel)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .tacticalPanel(accent: GGGTheme.neonAmber)
        .shadow(color: GGGTheme.neonAmber.opacity(0.12), radius: 7, y: 2)
    }
}

struct SessionCoinSummaryView: View {
    @ObservedObject var coins: CombatCoinStore

    var body: some View {
        if coins.sessionCoins > 0 {
            Text("+\(coins.sessionCoins) Combat Coins")
                .font(.system(size: 16, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAmber)
        }
    }
}

/// Compact side-edge kill toast — stays clear of joystick / FIRE and rank-up banner.
struct CoinToastBannerView: View {
    let amount: Int
    let generation: UInt
    var onDismiss: () -> Void

    @State private var visible = false
    @State private var dismissToken = UUID()

    var body: some View {
        HStack {
            Spacer(minLength: 0)
            HStack(spacing: 6) {
                Image(systemName: "circle.hexagongrid.circle.fill")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(GGGTheme.neonAmber)
                    .shadow(color: GGGTheme.neonAmber.opacity(0.55), radius: 4, y: 0)
                Text("+\(amount) CC")
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .monospacedDigit()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                Capsule(style: .continuous)
                    .fill(GGGTheme.panelElevated.opacity(0.92))
                    .shadow(color: GGGTheme.neonAmber.opacity(0.28), radius: 8, y: 2)
            )
            .overlay(
                Capsule(style: .continuous)
                    .stroke(GGGTheme.neonAmber.opacity(0.7), lineWidth: 1)
            )
            .offset(x: visible ? 0 : 28)
            .opacity(visible ? 1 : 0)
            .padding(.trailing, 10)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
        .padding(.top, 118)
        .allowsHitTesting(false)
        .onAppear { present() }
        .onChange(of: generation) { _, _ in
            present()
        }
    }

    private func present() {
        let token = UUID()
        dismissToken = token
        visible = false
        withAnimation(.spring(response: 0.32, dampingFraction: 0.84)) {
            visible = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.25) {
            guard dismissToken == token else { return }
            withAnimation(.easeOut(duration: 0.18)) {
                visible = false
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                guard dismissToken == token else { return }
                onDismiss()
            }
        }
    }
}

struct CoinToastOverlay: ViewModifier {
    @ObservedObject var coins: CombatCoinStore

    func body(content: Content) -> some View {
        content.overlay {
            if let amount = coins.pendingCoinToast {
                CoinToastBannerView(
                    amount: amount,
                    generation: coins.coinToastGeneration
                ) {
                    coins.consumeCoinToast()
                }
                .id(coins.coinToastGeneration)
                .zIndex(190) // below rank-up (200); side placement avoids overlap
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .opacity
                ))
            }
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.86), value: coins.coinToastGeneration)
    }
}

extension View {
    func coinKillToast(coins: CombatCoinStore) -> some View {
        modifier(CoinToastOverlay(coins: coins))
    }
}
