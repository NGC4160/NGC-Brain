// SkinsLibraryView.swift
// Premade skin library — one-tap apply, combinable with custom paint.

import SwiftUI

struct SkinsLibraryView: View {
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var coins: CombatCoinStore

    @State private var selectedGunID: UUID?
    @State private var blueprint = GunBlueprint()
    @State private var keepCustomPaint = true
    @State private var appliedBanner: String?

    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            VStack(spacing: 12) {
                Menu {
                    ForEach(library.guns) { gun in
                        Button(gun.displayName) { load(gun) }
                    }
                } label: {
                    HStack {
                        Text(blueprint.displayName.isEmpty ? "Select gun" : "Skinning: \(blueprint.displayName)")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                        Spacer()
                        Image(systemName: "chevron.up.chevron.down")
                    }
                    .foregroundStyle(.white)
                    .padding(12)
                    .background(GGGTheme.panel)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .padding(.horizontal)

                GunSceneView(blueprint: blueprint, allowsCameraControl: true)
                    .frame(height: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(Color(hex: "#4DA3FF")!.opacity(0.5), lineWidth: 1)
                    )
                    .padding(.horizontal)

                Toggle(isOn: $keepCustomPaint) {
                    Text("Keep custom paint layers")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                }
                .tint(GGGTheme.neonAccent)
                .padding(.horizontal)

                ScrollView {
                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(PremadeSkinID.allCases) { skin in
                            let unlocked = coins.isSkinUnlocked(skin)
                            Button {
                                guard unlocked else {
                                    if let shopID = ShopCatalog.skinShopID(for: skin),
                                       let item = ShopCatalog.item(id: shopID) {
                                        withAnimation {
                                            appliedBanner = "Locked — \(item.price) CC in Shop"
                                        }
                                    } else {
                                        withAnimation { appliedBanner = "Locked — unlock in Shop" }
                                    }
                                    HapticsService.select(enabled: settings.hapticsEnabled)
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
                                        withAnimation { appliedBanner = nil }
                                    }
                                    return
                                }
                                apply(skin)
                            } label: {
                                VStack(alignment: .leading, spacing: 10) {
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .fill(skinPreview(skin))
                                        .frame(height: 72)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                                .stroke(blueprint.premadeSkin == skin ? GGGTheme.neonAccent : .clear, lineWidth: 2)
                                        )
                                        .overlay {
                                            if !unlocked {
                                                Image(systemName: "lock.fill")
                                                    .font(.system(size: 18, weight: .bold))
                                                    .foregroundStyle(.white.opacity(0.9))
                                            }
                                        }
                                        .opacity(unlocked ? 1 : 0.55)
                                    Text(skin.displayName)
                                        .font(.system(size: 14, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                    if unlocked {
                                        Text(skin.pattern.rawValue.uppercased())
                                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                                            .foregroundStyle(GGGTheme.steel)
                                    } else if let shopID = ShopCatalog.skinShopID(for: skin),
                                              let item = ShopCatalog.item(id: shopID) {
                                        Text("\(item.price) CC")
                                            .font(.system(size: 10, weight: .heavy, design: .rounded))
                                            .foregroundStyle(GGGTheme.neonAmber)
                                    }
                                }
                                .padding(12)
                                .background(GGGTheme.panelElevated)
                                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }

                if let appliedBanner {
                    Text(appliedBanner)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.neonAccent)
                        .padding(.bottom, 8)
                        .transition(.opacity)
                }
            }
        }
        .navigationTitle("Skins")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .onAppear {
            if selectedGunID == nil, let first = library.guns.first { load(first) }
        }
    }

    private func skinPreview(_ skin: PremadeSkinID) -> LinearGradient {
        LinearGradient(
            colors: [
                Color(hex: skin.primaryHex)!,
                Color(hex: skin.accentHex)!
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private func load(_ gun: SavedGun) {
        selectedGunID = gun.id
        blueprint = library.blueprint(for: gun)
    }

    private func apply(_ skin: PremadeSkinID) {
        guard let gunID = selectedGunID else { return }
        blueprint.premadeSkin = skin
        if !keepCustomPaint {
            blueprint.paintStrokes = []
        }

        library.applySkin(skin, toGunID: gunID, clearPaint: !keepCustomPaint)
        // Refresh blueprint from store so paint clear is reflected.
        if let gun = library.gun(id: gunID) {
            blueprint = library.blueprint(for: gun)
            blueprint.premadeSkin = skin
        }

        HapticsService.attach(enabled: settings.hapticsEnabled)
        withAnimation {
            appliedBanner = "Applied \(skin.displayName)"
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
            withAnimation { appliedBanner = nil }
        }
    }
}
