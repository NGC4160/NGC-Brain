// BuildGunView.swift
// Modular custom gun creator with live 3D preview.

import SwiftUI

struct BuildGunView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var coins: CombatCoinStore

    @State private var blueprint = GunBlueprint()
    @State private var selectedSlot: AttachmentSlot = .optic
    @State private var showSavedAlert = false
    @State private var editingExistingID: UUID?
    @State private var lockBanner: String?

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                GunSceneView(blueprint: blueprint, allowsCameraControl: true)
                    .frame(height: 260)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(GGGTheme.neonAmber.opacity(0.4), lineWidth: 1)
                    )
                    .padding(.horizontal)
                    .padding(.top, 8)

                TextField("Name your build", text: $blueprint.name)
                    .textFieldStyle(.plain)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(14)
                    .background(GGGTheme.panel)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .padding(.horizontal)
                    .padding(.top, 12)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(GunBodyType.allCases) { type in
                            bodyChip(type)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 12)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(AttachmentSlot.allCases) { slot in
                            slotChip(slot)
                        }
                    }
                    .padding(.horizontal)
                }

                ScrollView {
                    LazyVGrid(
                        columns: [GridItem(.adaptive(minimum: 100), spacing: 10)],
                        spacing: 10
                    ) {
                        partButton(title: "None", selected: blueprint.attachments[selectedSlot] == nil) {
                            blueprint.attachments.removeValue(forKey: selectedSlot)
                            HapticsService.attach(enabled: settings.hapticsEnabled)
                            SoundService.shared.playAttach(volume: settings.soundVolume)
                        }

                        ForEach(AttachmentCatalog.parts(for: selectedSlot)) { part in
                            let unlocked = coins.isAttachmentUnlocked(part.id)
                            partButton(
                                title: unlocked ? part.name : "\(part.name) · LOCK",
                                selected: blueprint.attachments[selectedSlot] == part.id,
                                accent: unlocked ? part.accentColor : GGGTheme.steel
                            ) {
                                guard unlocked else {
                                    if let shopID = ShopCatalog.attachmentShopID(forPartID: part.id),
                                       let item = ShopCatalog.item(id: shopID) {
                                        lockBanner = "\(part.name) — \(item.price) CC in Shop"
                                    } else {
                                        lockBanner = "\(part.name) is locked — unlock in Shop"
                                    }
                                    HapticsService.select(enabled: settings.hapticsEnabled)
                                    return
                                }
                                lockBanner = nil
                                blueprint.attachments[selectedSlot] = part.id
                                HapticsService.attach(enabled: settings.hapticsEnabled)
                                SoundService.shared.playAttach(volume: settings.soundVolume)
                            }
                        }
                    }
                    .padding()
                }

                if let lockBanner {
                    Text(lockBanner)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.neonAmber)
                        .padding(.horizontal)
                        .padding(.bottom, 6)
                }

                Button("Save to Armory") {
                    saveGun()
                }
                .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAmber))
                .padding(.horizontal)
                .padding(.bottom, 12)
            }

            if appState.showBuildOnboarding {
                OnboardingTooltip(
                    title: "Build Gun",
                    message: "Pick a body style, then tap slots (Optics, Muzzle, Grip…) and attach toy parts. Your 3D preview updates instantly. Name it and save to the Armory."
                ) {
                    withAnimation { appState.dismissBuildOnboarding() }
                }
            }
        }
        .navigationTitle("Build Gun")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .alert("Saved!", isPresented: $showSavedAlert) {
            Button("Armory") {
                dismiss()
                appState.path = NavigationPath()
                appState.navigate(to: .armory)
            }
            Button("Keep Building", role: .cancel) {}
        } message: {
            Text("“\(blueprint.name)” is racked in the Armory.")
        }
    }

    private func bodyChip(_ type: GunBodyType) -> some View {
        Button {
            blueprint.bodyType = type
            HapticsService.select(enabled: settings.hapticsEnabled)
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Text(type.displayName)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                Text(type.blurb)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
            }
            .foregroundStyle(blueprint.bodyType == type ? GGGTheme.background : .white)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(blueprint.bodyType == type ? GGGTheme.neonAmber : GGGTheme.panelElevated)
            )
        }
        .buttonStyle(.plain)
    }

    private func slotChip(_ slot: AttachmentSlot) -> some View {
        Button {
            selectedSlot = slot
            HapticsService.select(enabled: settings.hapticsEnabled)
        } label: {
            Label(slot.displayName, systemImage: slot.systemImage)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .foregroundStyle(selectedSlot == slot ? GGGTheme.background : GGGTheme.subtitle)
                .background(
                    Capsule().fill(selectedSlot == slot ? GGGTheme.neonAccent : GGGTheme.panel)
                )
        }
        .buttonStyle(.plain)
    }

    private func partButton(title: String, selected: Bool, accent: Color = GGGTheme.steel, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(selected ? GGGTheme.background : .white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(selected ? accent : GGGTheme.panelElevated)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(accent.opacity(selected ? 0 : 0.5), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private func saveGun() {
        let name = blueprint.name.trimmingCharacters(in: .whitespacesAndNewlines)
        blueprint.name = name.isEmpty ? "Custom Build" : name

        let id = editingExistingID ?? blueprint.id
        let existing = library.gun(id: id)
        var gun = SavedGun(
            id: id,
            name: blueprint.name,
            customDisplayName: existing?.customDisplayName,
            bodyType: blueprint.bodyType,
            attachments: blueprint.attachments,
            premadeSkin: blueprint.premadeSkin ?? .matteBlack,
            paintJobID: existing?.paintJobID,
            isStarter: false,
            createdAt: existing?.createdAt ?? Date(),
            updatedAt: Date()
        )
        // Keep paint / skin from existing record if editing.
        if let existing {
            gun.premadeSkin = existing.premadeSkin ?? gun.premadeSkin
            gun.paintJobID = existing.paintJobID
        }
        library.upsertGun(gun)
        editingExistingID = gun.id
        blueprint.id = gun.id
        showSavedAlert = true
    }
}
