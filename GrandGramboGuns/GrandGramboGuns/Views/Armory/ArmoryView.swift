// ArmoryView.swift
// Grid of starter + user-created guns with inspect / equip actions.

import SwiftUI
import UIKit

struct ArmoryView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore

    @State private var selectedGun: SavedGun?
    @State private var shareImage: UIImage?
    @State private var showShare = false

    private let columns = [
        GridItem(.flexible(), spacing: 14),
        GridItem(.flexible(), spacing: 14)
    ]

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            if library.guns.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "shippingbox")
                        .font(.system(size: 44, weight: .bold))
                    Text("Armory Empty")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                    Text("Build a gun to fill the racks.")
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                }
                .foregroundStyle(GGGTheme.subtitle)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 14) {
                        ForEach(library.guns) { gun in
                            ArmoryCell(gun: gun, blueprint: library.blueprint(for: gun)) {
                                HapticsService.select(enabled: settings.hapticsEnabled)
                                selectedGun = gun
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle("Armory")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .sheet(item: $selectedGun) { gun in
            GunInspectSheet(
                gun: gun,
                blueprint: library.blueprint(for: gun),
                onEquip: {
                    appState.equip(gun.id, openRange: true)
                    selectedGun = nil
                },
                onShare: {
                    if let image = ShareCardExporter.makeCard(for: library.blueprint(for: gun)) {
                        shareImage = image
                        showShare = true
                    }
                },
                onDelete: gun.isStarter ? nil : {
                    library.deleteGun(id: gun.id)
                    selectedGun = nil
                }
            )
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showShare) {
            if let shareImage {
                ActivityShareSheet(items: [shareImage])
            }
        }
    }
}

private struct ArmoryCell: View {
    let gun: SavedGun
    let blueprint: GunBlueprint
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(GGGTheme.panelElevated)
                    GunThumbnailView(blueprint: blueprint)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .frame(height: 130)

                Text(gun.name)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .lineLimit(1)

                HStack {
                    Text(gun.bodyType.displayName.uppercased())
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.neonAccent)
                    Spacer()
                    if gun.isStarter {
                        Text("STARTER")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(GGGTheme.steel)
                    }
                }
            }
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(GGGTheme.panel)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(GGGTheme.steelDim.opacity(0.6), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct GunInspectSheet: View {
    let gun: SavedGun
    let blueprint: GunBlueprint
    let onEquip: () -> Void
    let onShare: () -> Void
    var onDelete: (() -> Void)?

    var body: some View {
        NavigationStack {
            ZStack {
                GGGTheme.background.ignoresSafeArea()
                VStack(spacing: 16) {
                    GunSceneView(blueprint: blueprint, allowsCameraControl: true)
                        .frame(maxHeight: .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .stroke(GGGTheme.neonAccent.opacity(0.35), lineWidth: 1)
                        )
                        .padding(.horizontal)

                    Text("Drag to rotate • Pinch to zoom • Double-tap to reset")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)

                    attachmentChips

                    HStack(spacing: 12) {
                        Button("Equip → Range", action: onEquip)
                            .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.danger))
                        Button {
                            onShare()
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(GGGTheme.neonAccent)
                                .frame(width: 56, height: 56)
                                .background(GGGTheme.panelElevated)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                    }
                    .padding(.horizontal)

                    if let onDelete {
                        Button("Delete Build", role: .destructive, action: onDelete)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .padding(.bottom, 8)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle(gun.name)
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var attachmentChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(AttachmentSlot.allCases) { slot in
                    if let part = blueprint.part(for: slot) {
                        Label(part.name, systemImage: slot.systemImage)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(GGGTheme.panelElevated)
                            .clipShape(Capsule())
                            .foregroundStyle(GGGTheme.subtitle)
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}
