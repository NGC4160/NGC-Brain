// ArmoryView.swift
// Flat armory grid with body-type filters, dual loadout equip + rename.

import SwiftUI
import UIKit

struct ArmoryView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore

    @State private var selectedGun: SavedGun?
    @State private var renameTarget: SavedGun?
    @State private var shareImage: UIImage?
    @State private var showShare = false
    @State private var categoryFilter: GunBodyType? = nil
    @State private var renameDraft = ""
    @State private var showRenameSheet = false

    private let columns = [
        GridItem(.flexible(), spacing: 14),
        GridItem(.flexible(), spacing: 14)
    ]

    private var filteredGuns: [SavedGun] {
        guard let categoryFilter else { return library.guns }
        return library.guns.filter { $0.bodyType == categoryFilter }
    }

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
                VStack(spacing: 0) {
                    loadoutBar
                    categoryChips
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 14) {
                            ForEach(filteredGuns) { gun in
                                ArmoryCell(
                                    gun: gun,
                                    blueprint: library.blueprint(for: gun),
                                    slots: appState.loadoutSlots(containing: gun.id)
                                ) {
                                    HapticsService.select(enabled: settings.hapticsEnabled)
                                    selectedGun = gun
                                } onRename: {
                                    beginRename(gun)
                                }
                            }
                        }
                        .padding(16)
                    }
                }
            }
        }
        .navigationTitle("Armory")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .sheet(item: $selectedGun) { gun in
            let live = library.gun(id: gun.id) ?? gun
            GunInspectSheet(
                gun: live,
                blueprint: library.blueprint(for: live),
                primaryEquipped: appState.isEquipped(live.id, in: .primary),
                secondaryEquipped: appState.isEquipped(live.id, in: .secondary),
                onEquipPrimary: {
                    appState.equip(live.id, slot: .primary)
                    HapticsService.select(enabled: settings.hapticsEnabled)
                    selectedGun = nil
                },
                onEquipSecondary: {
                    appState.equip(live.id, slot: .secondary)
                    HapticsService.select(enabled: settings.hapticsEnabled)
                    selectedGun = nil
                },
                onShake: {
                    appState.equip(live.id, open: .shake)
                    selectedGun = nil
                },
                onRange: {
                    appState.equip(live.id, open: .range)
                    selectedGun = nil
                },
                onShare: {
                    if let image = ShareCardExporter.makeCard(for: library.blueprint(for: live)) {
                        shareImage = image
                        showShare = true
                    }
                },
                onRename: {
                    beginRename(live)
                },
                onDelete: live.isStarter ? nil : {
                    if appState.primaryGunID == live.id { appState.primaryGunID = nil }
                    if appState.secondaryGunID == live.id { appState.secondaryGunID = nil }
                    library.deleteGun(id: live.id)
                    selectedGun = nil
                }
            )
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showRenameSheet) {
            renameSheet
        }
        .sheet(isPresented: $showShare) {
            if let shareImage {
                ActivityShareSheet(items: [shareImage])
            }
        }
    }

    private func beginRename(_ gun: SavedGun) {
        renameTarget = gun
        renameDraft = gun.displayName
        showRenameSheet = true
        HapticsService.select(enabled: settings.hapticsEnabled)
    }

    private var renameSheet: some View {
        NavigationStack {
            ZStack {
                GGGTheme.background.ignoresSafeArea()
                VStack(alignment: .leading, spacing: 16) {
                    Text("Name your gun")
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)

                    TextField("Display name", text: $renameDraft)
                        .textFieldStyle(.plain)
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(14)
                        .background(GGGTheme.panelElevated)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.words)

                    if let gun = renameTarget, gun.displayName != gun.name || gun.customDisplayName != nil {
                        Text("Catalog: \(gun.name)")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(GGGTheme.steel)
                    }

                    Spacer()

                    Button("Save Name") {
                        saveRename()
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))

                    if renameTarget?.customDisplayName != nil {
                        Button("Clear Custom Name") {
                            guard let id = renameTarget?.id else { return }
                            library.renameGun(id: id, displayName: nil)
                            if let updated = library.gun(id: id) {
                                renameTarget = updated
                                if selectedGun?.id == id { selectedGun = updated }
                            }
                            showRenameSheet = false
                        }
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 8)
                    }
                }
                .padding(20)
            }
            .navigationTitle("Rename")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showRenameSheet = false }
                        .foregroundStyle(GGGTheme.subtitle)
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    private func saveRename() {
        guard let id = renameTarget?.id else { return }
        library.renameGun(id: id, displayName: renameDraft)
        if let updated = library.gun(id: id) {
            renameTarget = updated
            if selectedGun?.id == id { selectedGun = updated }
        }
        showRenameSheet = false
        HapticsService.select(enabled: settings.hapticsEnabled)
    }

    private var loadoutBar: some View {
        HStack(spacing: 10) {
            loadoutChip(slot: .primary, gunID: appState.primaryGunID)
            loadoutChip(slot: .secondary, gunID: appState.secondaryGunID)
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 4)
    }

    private func loadoutChip(slot: LoadoutSlot, gunID: UUID?) -> some View {
        let name = gunID.flatMap { library.gun(id: $0)?.displayName } ?? "Empty"
        return VStack(alignment: .leading, spacing: 2) {
            Text(slot.label)
                .font(.system(size: 10, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            Text(name)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(gunID == nil ? GGGTheme.steel : .white)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(GGGTheme.panelElevated)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private var categoryChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip("ALL", selected: categoryFilter == nil) { categoryFilter = nil }
                ForEach(GunBodyType.allCases) { type in
                    chip(type.displayName.uppercased(), selected: categoryFilter == type) {
                        categoryFilter = type
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
    }

    private func chip(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(selected ? GGGTheme.background : GGGTheme.subtitle)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(selected ? GGGTheme.neonAccent : GGGTheme.panelElevated)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct ArmoryCell: View {
    let gun: SavedGun
    let blueprint: GunBlueprint
    let slots: [LoadoutSlot]
    let onTap: () -> Void
    let onRename: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                ZStack(alignment: .topTrailing) {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(GGGTheme.panelElevated)
                    GunThumbnailView(blueprint: blueprint)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                    if !slots.isEmpty {
                        HStack(spacing: 4) {
                            ForEach(slots) { slot in
                                Text(slot.shortLabel)
                                    .font(.system(size: 10, weight: .black, design: .rounded))
                                    .foregroundStyle(GGGTheme.background)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 3)
                                    .background(GGGTheme.neonAccent)
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(8)
                    }
                }
                .frame(height: 130)

                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(gun.displayName)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    Button {
                        onRename()
                    } label: {
                        Image(systemName: "pencil")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(GGGTheme.neonAccent)
                            .padding(6)
                            .background(GGGTheme.panelElevated)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Rename \(gun.displayName)")
                }

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
                    .stroke(
                        slots.isEmpty ? GGGTheme.steelDim.opacity(0.6) : GGGTheme.neonAccent.opacity(0.7),
                        lineWidth: slots.isEmpty ? 1 : 1.5
                    )
            )
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button {
                onRename()
            } label: {
                Label("Rename", systemImage: "pencil")
            }
            Button {
                onTap()
            } label: {
                Label("Inspect", systemImage: "eye")
            }
        }
    }
}

struct GunInspectSheet: View {
    let gun: SavedGun
    let blueprint: GunBlueprint
    var primaryEquipped: Bool = false
    var secondaryEquipped: Bool = false
    var onEquipPrimary: (() -> Void)? = nil
    var onEquipSecondary: (() -> Void)? = nil
    let onShake: () -> Void
    let onRange: () -> Void
    let onShare: () -> Void
    var onRename: (() -> Void)? = nil
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

                    if gun.displayName != gun.name {
                        Text("Catalog: \(gun.name)")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(GGGTheme.steelDim)
                    }

                    attachmentChips

                    VStack(spacing: 10) {
                        if let onEquipPrimary {
                            Button(primaryEquipped ? "Primary Equipped" : "Equip Primary", action: onEquipPrimary)
                                .buttonStyle(NeonHubButtonStyle(accent: primaryEquipped ? GGGTheme.steel : GGGTheme.neonAccent))
                                .disabled(primaryEquipped)
                        }
                        if let onEquipSecondary {
                            Button(secondaryEquipped ? "Secondary Equipped" : "Equip Secondary", action: onEquipSecondary)
                                .buttonStyle(NeonHubButtonStyle(accent: secondaryEquipped ? GGGTheme.steel : GGGTheme.neonAmber))
                                .disabled(secondaryEquipped)
                        }
                        Button("Shake to Shoot", action: onShake)
                            .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.danger))
                        Button("Shooting Range", action: onRange)
                            .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAmber))
                        Button {
                            onShare()
                        } label: {
                            Label("Share Card", systemImage: "square.and.arrow.up")
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundStyle(GGGTheme.neonAccent)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
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
            .navigationTitle(gun.displayName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if let onRename {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button(action: onRename) {
                            Image(systemName: "pencil")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(GGGTheme.neonAccent)
                        }
                        .accessibilityLabel("Rename gun")
                    }
                }
            }
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
