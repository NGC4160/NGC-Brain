// ShopView.swift
// Combat Coin shop — unlock guns, attachments/cosmetics, operators.

import SwiftUI

struct ShopView: View {
    @EnvironmentObject private var coins: CombatCoinStore
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var roster: OperatorRosterStore

    @State private var category: ShopCategory = .guns
    @State private var banner: String?
    @State private var bannerIsError = false
    @State private var confirmItem: ShopItem?

    var body: some View {
        ZStack {
            GGGTheme.hubGradient.ignoresSafeArea()

            VStack(spacing: 0) {
                balanceBar
                categoryPicker
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(ShopCatalog.items(in: category)) { item in
                            shopRow(item)
                        }
                    }
                    .padding(16)
                }
            }

            if let banner {
                VStack {
                    Spacer()
                    Text(banner)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(bannerIsError ? GGGTheme.danger : GGGTheme.neonAccent)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(GGGTheme.panelElevated.opacity(0.96))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .padding(.bottom, 28)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .allowsHitTesting(false)
            }
        }
        .navigationTitle("Shop")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .confirmationDialog(
            confirmItem.map { "Buy \($0.name) for \($0.price) Combat Coins?" } ?? "Confirm purchase",
            isPresented: Binding(
                get: { confirmItem != nil },
                set: { if !$0 { confirmItem = nil } }
            ),
            titleVisibility: .visible
        ) {
            if let item = confirmItem {
                Button("Buy — \(item.price) CC") {
                    performPurchase(item)
                    confirmItem = nil
                }
                Button("Cancel", role: .cancel) {
                    confirmItem = nil
                }
            }
        }
    }

    private var balanceBar: some View {
        HStack {
            Label("Combat Coins", systemImage: "circle.hexagongrid.circle.fill")
                .font(.system(size: 12, weight: .heavy, design: .monospaced))
                .foregroundStyle(GGGTheme.neonAmber)
            Spacer()
            Text("\(coins.balance)")
                .font(.system(size: 21, weight: .black, design: .monospaced))
                .foregroundStyle(.white)
            Text("CC")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(GGGTheme.panel.opacity(0.95))
    }

    private var categoryPicker: some View {
        HStack(spacing: 8) {
            ForEach(ShopCategory.allCases) { cat in
                Button {
                    category = cat
                    HapticsService.select(enabled: settings.hapticsEnabled)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: cat.systemImage)
                        Text(cat.title)
                    }
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .foregroundStyle(category == cat ? .black : .white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(
                        ChamferedRectangle(cut: 6)
                            .fill(category == cat ? GGGTheme.neonAmber : GGGTheme.panelElevated)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private func shopRow(_ item: ShopItem) -> some View {
        let owned = isOwned(item)
        return HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(GGGTheme.panelElevated)
                    .frame(width: 52, height: 52)
                Image(systemName: item.systemImage)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(owned ? GGGTheme.neonAccent : GGGTheme.neonAmber)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(item.name)
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    if owned {
                        Text("OWNED")
                            .font(.system(size: 9, weight: .heavy, design: .rounded))
                            .foregroundStyle(GGGTheme.background)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(GGGTheme.neonAccent)
                            .clipShape(Capsule())
                    } else {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(GGGTheme.steel)
                    }
                }
                Text(item.blurb)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                    .lineLimit(2)
            }

            Spacer(minLength: 8)

            if owned {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(GGGTheme.neonAccent)
            } else {
                Button {
                    if coins.canAfford(item.price) {
                        confirmItem = item
                    } else {
                        showBanner(
                            "Need \(item.price) CC — you have \(coins.balance).",
                            error: true
                        )
                        HapticsService.select(enabled: settings.hapticsEnabled)
                    }
                } label: {
                    VStack(spacing: 2) {
                        Text("\(item.price)")
                            .font(.system(size: 16, weight: .black, design: .rounded))
                        Text("BUY")
                            .font(.system(size: 10, weight: .heavy, design: .rounded))
                    }
                    .foregroundStyle(coins.canAfford(item.price) ? GGGTheme.background : .white.opacity(0.7))
                    .frame(width: 64)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(coins.canAfford(item.price) ? GGGTheme.neonAmber : GGGTheme.steel.opacity(0.45))
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .tacticalPanel(accent: owned ? GGGTheme.neonAccent : GGGTheme.neonAmber.opacity(0.55))
    }

    private func isOwned(_ item: ShopItem) -> Bool {
        switch item.kind {
        case .gun:
            return coins.ownsGun(itemID: item.id, library: library)
        case .customSlotPack:
            return coins.unlockedIDs.contains(item.id)
        default:
            return coins.isUnlocked(item.id)
        }
    }

    private func performPurchase(_ item: ShopItem) {
        let result = coins.purchase(item, library: library)
        switch result {
        case .success:
            if case .customSlotPack = item.kind {
                roster.bonusCustomSlots = coins.bonusCustomSlots
            }
            showBanner("Unlocked \(item.name) — \(coins.balance) CC left.", error: false)
            HapticsService.reload(enabled: settings.hapticsEnabled)
        case .alreadyOwned:
            showBanner("Already owned.", error: false)
        case .insufficientFunds(let need, let have):
            showBanner("Need \(need) CC — you have \(have).", error: true)
        case .unavailable:
            showBanner("Item unavailable.", error: true)
        }
    }

    private func showBanner(_ text: String, error: Bool) {
        bannerIsError = error
        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
            banner = text
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) {
            withAnimation(.easeOut(duration: 0.25)) {
                if banner == text { banner = nil }
            }
        }
    }
}
