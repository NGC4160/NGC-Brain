// CharactersView.swift
// Premade KESTREL operators + create-your-own custom characters.

import SwiftUI

struct CharactersView: View {
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var roster: OperatorRosterStore
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var coins: CombatCoinStore

    @State private var creatorSession: CreatorSession?
    @State private var tab: CharacterTab = .premade
    @State private var saveError: String?
    @State private var lockedMessage: String?

    private enum CharacterTab: String, CaseIterable, Identifiable {
        case premade
        case custom
        var id: String { rawValue }
        var title: String {
            switch self {
            case .premade: return "PREMADE"
            case .custom: return "MY OPS"
            }
        }
    }

    /// Drives `sheet(item:)` so create vs edit always hydrates correctly.
    private enum CreatorSession: Identifiable {
        case create
        case edit(CustomOperatorRecord)

        var id: String {
            switch self {
            case .create: return "create"
            case .edit(let record): return "edit-\(record.id)"
            }
        }

        var existing: CustomOperatorRecord? {
            switch self {
            case .create: return nil
            case .edit(let record): return record
            }
        }
    }

    var body: some View {
        ZStack {
            GGGTheme.hubGradient.ignoresSafeArea()

            VStack(spacing: 0) {
                selectedBanner
                tabPicker
                ScrollView {
                    LazyVStack(spacing: 12) {
                        if let lockedMessage {
                            Text(lockedMessage)
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(GGGTheme.neonAmber)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        if tab == .premade {
                            ForEach(OperatorProfile.base) { op in
                                characterRow(op)
                            }
                            if !OperatorProfile.shopExclusive.isEmpty {
                                Text("SHOP OPERATORS")
                                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                                    .foregroundStyle(GGGTheme.neonAmber)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.top, 8)
                                ForEach(OperatorProfile.shopExclusive) { op in
                                    characterRow(op)
                                }
                            }
                        } else {
                            createButton
                            if let saveError {
                                Text(saveError)
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                    .foregroundStyle(GGGTheme.danger)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            if roster.customs.isEmpty {
                                emptyCustoms
                            } else {
                                ForEach(roster.customs) { record in
                                    customRow(record)
                                }
                            }
                        }
                    }
                    .padding(16)
                }
            }
        }
        .navigationTitle("Characters")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .onAppear(perform: sanitizeActiveSelection)
        .onChange(of: roster.customs) { _, _ in
            sanitizeActiveSelection()
        }
        .sheet(item: $creatorSession) { session in
            CharacterCreatorSheet(
                existing: session.existing,
                onSave: { record in
                    guard roster.upsert(record) else {
                        saveError = "Roster full — delete an operator first."
                        creatorSession = nil
                        tab = .custom
                        return
                    }
                    settings.selectedOperatorID = record.id
                    saveError = nil
                    tab = .custom
                    creatorSession = nil
                    HapticsService.select(enabled: settings.hapticsEnabled)
                },
                onCancel: {
                    creatorSession = nil
                }
            )
            .environmentObject(settings)
            .environmentObject(roster)
            .preferredColorScheme(.dark)
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
    }

    private var selectedBanner: some View {
        let op = roster.profile(id: settings.selectedOperatorID)
        return HStack(spacing: 12) {
            OperatorAvatarView(look: op.look, size: 48)
            VStack(alignment: .leading, spacing: 2) {
                Text("ACTIVE")
                    .font(.system(size: 9, weight: .heavy, design: .monospaced))
                    .foregroundStyle(GGGTheme.neonAccent)
                Text(op.callsign)
                    .font(.system(size: 17, weight: .black, design: .monospaced))
                    .foregroundStyle(.white)
                Text("\(op.role) · HP \(Int(op.maxHealth)) · Speed \(Int(op.moveSpeedMultiplier * 100))%")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                if !op.look.gearNotes.isEmpty {
                    Text(op.look.gearNotes)
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(op.accent)
                        .lineLimit(1)
                }
            }
            Spacer()
            if op.isCustom {
                Text("CUSTOM")
                    .font(.system(size: 9, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.background)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(GGGTheme.neonAmber)
                    .clipShape(Capsule())
            }
        }
        .padding(14)
        .tacticalPanel(accent: op.accent)
    }

    private var tabPicker: some View {
        HStack(spacing: 8) {
            ForEach(CharacterTab.allCases) { item in
                Button {
                    tab = item
                } label: {
                    Text(item.title)
                        .font(.system(size: 13, weight: .black, design: .rounded))
                        .foregroundStyle(tab == item ? .black : .white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(tab == item ? GGGTheme.neonAccent : GGGTheme.panelElevated)
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var createButton: some View {
        Button {
            guard roster.canCreateMore else {
                saveError = "Roster full (\(roster.maxCustoms) max). Buy more slots in Shop."
                return
            }
            saveError = nil
            creatorSession = .create
        } label: {
            HStack {
                Image(systemName: "plus.circle.fill")
                Text(roster.canCreateMore ? "Create Operator" : "Roster Full (\(roster.maxCustoms))")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                Spacer()
            }
            .foregroundStyle(roster.canCreateMore ? GGGTheme.background : GGGTheme.steel)
            .padding(16)
            .background(roster.canCreateMore ? GGGTheme.neonAccent : GGGTheme.panelElevated)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!roster.canCreateMore)
    }

    private var emptyCustoms: some View {
        VStack(spacing: 10) {
            Image(systemName: "person.crop.circle.badge.plus")
                .font(.system(size: 36, weight: .bold))
            Text("No custom operators yet")
                .font(.system(size: 16, weight: .bold, design: .rounded))
            Text("Build your own callsign, tactical kit colors, and combat archetype.")
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .multilineTextAlignment(.center)
                .foregroundStyle(GGGTheme.subtitle)
        }
        .foregroundStyle(GGGTheme.steel)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    private func characterRow(_ op: OperatorProfile) -> some View {
        let selected = settings.selectedOperatorID == op.id
        let unlocked = op.isCustom || coins.isOperatorUnlocked(op.id)
        return Button {
            guard unlocked else {
                if let shopID = ShopCatalog.operatorShopID(forOperatorID: op.id),
                   let item = ShopCatalog.item(id: shopID) {
                    lockedMessage = "\(op.callsign) is locked — \(item.price) CC in Shop."
                } else {
                    lockedMessage = "\(op.callsign) is locked — unlock in Shop."
                }
                HapticsService.select(enabled: settings.hapticsEnabled)
                return
            }
            lockedMessage = nil
            settings.selectedOperatorID = op.id
            HapticsService.select(enabled: settings.hapticsEnabled)
        } label: {
            HStack(spacing: 14) {
                ZStack(alignment: .bottomTrailing) {
                    OperatorAvatarView(look: op.look, size: 56)
                        .opacity(unlocked ? 1 : 0.45)
                    // Accent armor badge strip
                    RoundedRectangle(cornerRadius: 2, style: .continuous)
                        .fill(op.accent)
                        .frame(width: 14, height: 4)
                        .offset(x: 2, y: 2)
                }
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(op.callsign)
                            .font(.system(size: 16, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                        if !unlocked {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(GGGTheme.neonAmber)
                        }
                        if op.isShopExclusive {
                            Text("SHOP")
                                .font(.system(size: 9, weight: .heavy, design: .rounded))
                                .foregroundStyle(GGGTheme.background)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(GGGTheme.neonAmber)
                                .clipShape(Capsule())
                        }
                        if op.isCustom {
                            Text("CUSTOM")
                                .font(.system(size: 9, weight: .heavy, design: .rounded))
                                .foregroundStyle(GGGTheme.background)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(GGGTheme.neonAmber)
                                .clipShape(Capsule())
                        }
                    }
                    HStack(spacing: 6) {
                        Text(op.role.uppercased())
                            .font(.system(size: 11, weight: .heavy, design: .rounded))
                            .foregroundStyle(op.accent)
                        // SWAT unit accent bar
                        Capsule()
                            .fill(op.accent.opacity(0.85))
                            .frame(width: 18, height: 4)
                        if op.look.bulkyTorso {
                            Text("HEAVY")
                                .font(.system(size: 8, weight: .heavy, design: .rounded))
                                .foregroundStyle(GGGTheme.background)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(op.accent.opacity(0.9))
                                .clipShape(Capsule())
                        }
                    }
                    if !op.look.gearNotes.isEmpty {
                        Text(op.look.gearNotes.uppercased())
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(op.look.helmet).opacity(0.95))
                            .lineLimit(1)
                    }
                    Text(op.bio)
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                        .lineLimit(2)
                    if unlocked {
                        Text("HP \(Int(op.maxHealth)) · Spd \(Int(op.moveSpeedMultiplier * 100))% · Armor \(armorLabel(op))")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(GGGTheme.steel)
                    } else if let shopID = ShopCatalog.operatorShopID(forOperatorID: op.id),
                              let item = ShopCatalog.item(id: shopID) {
                        Text("\(item.price) Combat Coins · Shop")
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(GGGTheme.neonAmber)
                    }
                }
                Spacer(minLength: 0)
                if selected && unlocked {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(GGGTheme.neonAccent)
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(selected && unlocked ? op.accent.opacity(0.18) : GGGTheme.panel)
            )
            .overlay(alignment: .leading) {
                // Left armor accent strip — unique per operator
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(op.accent)
                    .frame(width: 4)
                    .padding(.vertical, 10)
                    .padding(.leading, 2)
            }
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(
                        selected && unlocked ? op.accent : GGGTheme.steelDim.opacity(0.5),
                        lineWidth: selected && unlocked ? 1.5 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }

    private func customRow(_ record: CustomOperatorRecord) -> some View {
        let op = record.asProfile()
        return VStack(spacing: 8) {
            characterRow(op)
            HStack {
                Button("Edit") {
                    creatorSession = .edit(record)
                }
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)

                Spacer()

                Button("Delete", role: .destructive) {
                    if settings.selectedOperatorID == record.id {
                        settings.selectedOperatorID = "grambo"
                    }
                    roster.delete(id: record.id)
                    HapticsService.reload(enabled: settings.hapticsEnabled)
                }
                .font(.system(size: 13, weight: .semibold, design: .rounded))
            }
            .padding(.horizontal, 8)
        }
    }

    private func armorLabel(_ op: OperatorProfile) -> String {
        let pct = Int((2.0 - op.damageTakenMultiplier) * 100)
        return "\(max(0, pct))%"
    }

    /// If a deleted / locked operator is still selected, fall back to GRAMBO.
    private func sanitizeActiveSelection() {
        let id = settings.selectedOperatorID
        if !roster.contains(id: id) {
            settings.selectedOperatorID = "grambo"
            return
        }
        let profile = roster.profile(id: id)
        if !profile.isCustom && !coins.isOperatorUnlocked(id) {
            settings.selectedOperatorID = "grambo"
        }
    }
}

// MARK: - Avatar

struct OperatorAvatarView: View {
    let look: OperatorAppearance
    var size: CGFloat = 56

    private var corner: CGFloat { size * 0.2 }

    var body: some View {
        ZStack {
            // Tactical card backdrop — suit wash + vignette, not a flat swatch
            RoundedRectangle(cornerRadius: corner, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(look.suit).opacity(0.95),
                            Color(look.plateCarrier),
                            Color(white: 0.04)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            // Soft IR glow behind silhouette
            Circle()
                .fill(Color(look.accentUIColor).opacity(0.18))
                .frame(width: size * 0.55, height: size * 0.55)
                .blur(radius: size * 0.08)
                .offset(y: -size * 0.02)

            // Plate carrier plate
            RoundedRectangle(cornerRadius: size * 0.08, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(look.plateCarrier).opacity(0.95),
                            Color(look.helmet).opacity(0.55)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(width: size * 0.58, height: size * 0.40)
                .overlay(
                    RoundedRectangle(cornerRadius: size * 0.08, style: .continuous)
                        .stroke(Color(look.accentUIColor).opacity(0.35), lineWidth: 1)
                )
                .offset(y: size * 0.08)

            // Mag pouch row on carrier
            HStack(spacing: size * 0.03) {
                ForEach(0..<3, id: \.self) { _ in
                    RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                        .fill(Color(look.pants))
                        .frame(width: size * 0.10, height: size * 0.12)
                        .overlay(alignment: .top) {
                            Capsule()
                                .fill(Color(look.accentUIColor).opacity(0.85))
                                .frame(width: size * 0.07, height: size * 0.018)
                                .offset(y: size * 0.01)
                        }
                }
            }
            .offset(y: size * 0.10)

            VStack(spacing: size * 0.02) {
                // Helmet / mask stack
                ZStack {
                    // Dome
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [Color(look.helmet), Color(look.helmet).opacity(0.7)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: size * 0.46, height: size * 0.22)
                        .shadow(color: .black.opacity(0.45), radius: 2, y: 1)

                    // Brow ridge
                    Capsule()
                        .fill(Color(look.helmet).opacity(0.95))
                        .frame(width: size * 0.40, height: size * 0.045)
                        .offset(y: -size * 0.05)

                    if look.hasBalaclava {
                        Capsule()
                            .fill(Color(white: 0.07))
                            .frame(width: size * 0.36, height: size * 0.10)
                            .offset(y: size * 0.07)
                        Capsule()
                            .fill(Color(white: 0.02))
                            .frame(width: size * 0.22, height: size * 0.028)
                            .offset(y: size * 0.05)
                    }

                    if look.hasVisor {
                        Capsule()
                            .fill(Color(look.accentUIColor).opacity(0.9))
                            .frame(width: size * 0.34, height: size * 0.05)
                            .shadow(color: Color(look.accentUIColor).opacity(0.55), radius: 3)
                            .offset(y: size * 0.01)
                    }

                    if look.hasHeadset {
                        HStack(spacing: size * 0.30) {
                            Circle()
                                .fill(Color(white: 0.12))
                                .frame(width: size * 0.09, height: size * 0.09)
                                .overlay(Circle().stroke(Color(look.accentUIColor).opacity(0.4), lineWidth: 1))
                            Circle()
                                .fill(Color(white: 0.12))
                                .frame(width: size * 0.09, height: size * 0.09)
                                .overlay(Circle().stroke(Color(look.accentUIColor).opacity(0.4), lineWidth: 1))
                        }
                    }
                }
                .offset(y: -size * 0.02)

                // Cummerbund IR bar
                RoundedRectangle(cornerRadius: 2, style: .continuous)
                    .fill(Color(look.accentUIColor))
                    .frame(width: size * 0.42, height: size * 0.055)
                    .shadow(color: Color(look.accentUIColor).opacity(0.4), radius: 2)
                    .offset(y: size * 0.18)

                if look.hasMedicCross {
                    Image(systemName: "cross.fill")
                        .font(.system(size: size * 0.11, weight: .bold))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.5), radius: 1)
                        .offset(y: size * 0.14)
                }

                HStack(spacing: size * 0.07) {
                    Capsule().fill(Color(look.pants)).frame(width: size * 0.11, height: size * 0.16)
                    Capsule().fill(Color(look.pants)).frame(width: size * 0.11, height: size * 0.16)
                }
                .offset(y: size * 0.16)
            }

            if look.hasShoulderPads {
                HStack {
                    RoundedRectangle(cornerRadius: 2.5, style: .continuous)
                        .fill(Color(look.helmet))
                        .frame(width: size * 0.13, height: size * 0.11)
                        .shadow(color: .black.opacity(0.35), radius: 1)
                    Spacer()
                    RoundedRectangle(cornerRadius: 2.5, style: .continuous)
                        .fill(Color(look.helmet))
                        .frame(width: size * 0.13, height: size * 0.11)
                        .shadow(color: .black.opacity(0.35), radius: 1)
                }
                .padding(.horizontal, size * 0.03)
                .offset(y: size * 0.04)
            }

            if look.hasUnitPatch {
                RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                    .fill(Color(look.accentUIColor))
                    .frame(width: size * 0.09, height: size * 0.11)
                    .overlay(
                        RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                            .stroke(Color.white.opacity(0.25), lineWidth: 0.5)
                    )
                    .offset(x: size * 0.28, y: size * 0.02)
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: corner, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: corner, style: .continuous)
                .stroke(
                    LinearGradient(
                        colors: [
                            Color(look.accentUIColor).opacity(0.95),
                            Color(look.accentUIColor).opacity(0.35)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1.75
                )
        )
        .overlay(alignment: .topLeading) {
            if look.bulkyTorso {
                Image(systemName: "shield.fill")
                    .font(.system(size: size * 0.13, weight: .bold))
                    .foregroundStyle(Color(look.accentUIColor))
                    .shadow(color: .black.opacity(0.5), radius: 1)
                    .offset(x: 3, y: 3)
            }
        }
        .shadow(color: Color(look.accentUIColor).opacity(0.2), radius: 4, y: 1)
    }
}

// MARK: - Creator

struct CharacterCreatorSheet: View {
    let existing: CustomOperatorRecord?
    let onSave: (CustomOperatorRecord) -> Void
    let onCancel: () -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var callsign: String = ""
    @State private var bio: String = ""
    @State private var archetype: OperatorArchetype = .balanced
    @State private var voiceGender: OperatorVoiceGender = .neutral
    @State private var appearance: OperatorAppearance = .starterCustom
    @State private var baseLook: OperatorLook = .grambo
    @State private var showValidationHint = false
    @State private var didHydrate = false

    private let suitSwatches: [(Double, Double, Double)] = [
        (0.11, 0.14, 0.11), (0.09, 0.11, 0.18), (0.28, 0.24, 0.18),
        (0.62, 0.64, 0.68), (0.11, 0.10, 0.11), (0.08, 0.07, 0.11),
        (0.16, 0.09, 0.07), (0.07, 0.14, 0.16),
        (0.10, 0.11, 0.13), (0.14, 0.16, 0.20)
    ]
    private let accentSwatches: [(Double, Double, Double)] = [
        (0.32, 0.58, 0.38), (0.35, 0.52, 0.78), (0.78, 0.42, 0.18),
        (0.58, 0.60, 0.66), (0.82, 0.22, 0.26), (0.48, 0.28, 0.68),
        (0.88, 0.40, 0.12), (0.22, 0.72, 0.68),
        (0.78, 0.66, 0.28), (0.68, 0.48, 0.26)
    ]
    private let skinSwatches: [(Double, Double, Double)] = [
        (0.5, 0.4, 0.32), (0.62, 0.48, 0.38), (0.42, 0.32, 0.26),
        (0.55, 0.45, 0.38), (0.58, 0.42, 0.34), (0.45, 0.38, 0.35),
        (0.72, 0.58, 0.48), (0.35, 0.28, 0.24)
    ]

    private var trimmedCallsign: String {
        callsign.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSave: Bool {
        !trimmedCallsign.isEmpty
    }

    var body: some View {
        NavigationStack {
            ZStack {
                GGGTheme.hubGradient.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        previewCard
                        callsignField
                        genderPicker
                        archetypePicker
                        kitPresetRow
                        colorSection("SUIT", current: (appearance.suitR, appearance.suitG, appearance.suitB), swatches: suitSwatches) { r, g, b in
                            appearance.suitR = r; appearance.suitG = g; appearance.suitB = b
                            appearance.pantsR = max(0, r - 0.04)
                            appearance.pantsG = max(0, g - 0.04)
                            appearance.pantsB = max(0, b - 0.04)
                            appearance.helmetR = min(1, r + 0.05)
                            appearance.helmetG = min(1, g + 0.05)
                            appearance.helmetB = min(1, b + 0.05)
                        }
                        colorSection("ACCENT", current: (appearance.accentR, appearance.accentG, appearance.accentB), swatches: accentSwatches) { r, g, b in
                            appearance.accentR = r; appearance.accentG = g; appearance.accentB = b
                        }
                        colorSection("SKIN", current: (appearance.skinR, appearance.skinG, appearance.skinB), swatches: skinSwatches) { r, g, b in
                            appearance.skinR = r; appearance.skinG = g; appearance.skinB = b
                        }
                        gearToggles
                        bioField
                        if showValidationHint && !canSave {
                            Text("Enter a callsign to save.")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(GGGTheme.danger)
                        }
                        Button {
                            save()
                        } label: {
                            Text("Save Operator")
                        }
                        .buttonStyle(NeonHubButtonStyle(accent: canSave ? GGGTheme.neonAccent : GGGTheme.steel))
                        .padding(.top, 4)
                    }
                    .padding(20)
                }
            }
            .navigationTitle(existing == nil ? "Create Operator" : "Edit Operator")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(GGGTheme.panel, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        onCancel()
                        dismiss()
                    }
                }
            }
            .onAppear(perform: hydrateIfNeeded)
        }
    }

    private var previewCard: some View {
        HStack(spacing: 16) {
            OperatorAvatarView(look: appearance, size: 72)
            VStack(alignment: .leading, spacing: 4) {
                Text(trimmedCallsign.isEmpty ? "CALLSIGN" : trimmedCallsign.uppercased())
                    .font(.system(size: 20, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                Text(archetype.displayName.uppercased())
                    .font(.system(size: 12, weight: .heavy, design: .rounded))
                    .foregroundStyle(appearance.accentColor)
                Text("HP \(Int(archetype.maxHealth)) · Spd \(Int(archetype.moveSpeedMultiplier * 100))%")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                Text(archetype.blurb)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
            }
            Spacer()
        }
        .padding(14)
        .background(GGGTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var callsignField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("CALLSIGN")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            TextField("Enter callsign", text: $callsign)
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
                .foregroundStyle(.white)
                .tint(GGGTheme.neonAccent)
                .padding(12)
                .background(GGGTheme.panelElevated)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .onChange(of: callsign) { _, newValue in
                    if newValue.count > 12 {
                        callsign = String(newValue.prefix(12))
                    }
                    if !trimmedCallsign.isEmpty {
                        showValidationHint = false
                    }
                    // Auto-suggest premade genders when typing known callsigns.
                    let inferred = OperatorVoiceGender.inferred(from: newValue)
                    if inferred != .neutral {
                        voiceGender = inferred
                    }
                }
        }
    }

    private var genderPicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("VOICE")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            HStack(spacing: 8) {
                ForEach(OperatorVoiceGender.allCases) { item in
                    Button {
                        voiceGender = item
                    } label: {
                        Text(item.displayName.uppercased())
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundStyle(voiceGender == item ? .black : .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(voiceGender == item ? GGGTheme.neonAccent : GGGTheme.panelElevated)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            Text("Used for COMMS / cutscene speech. Neutral if unknown.")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
        }
    }

    private var archetypePicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("ARCHETYPE")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(OperatorArchetype.allCases) { item in
                    Button {
                        archetype = item
                    } label: {
                        Text(item.displayName.uppercased())
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundStyle(archetype == item ? .black : .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .fill(archetype == item ? GGGTheme.neonAccent : GGGTheme.panelElevated)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var kitPresetRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("START FROM PREMADE KIT")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(OperatorLook.allCases) { look in
                        Button {
                            baseLook = look
                            appearance = look.appearance
                            voiceGender = look.voiceGender
                        } label: {
                            OperatorAvatarView(look: look.appearance, size: 44)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                                        .stroke(baseLook == look ? GGGTheme.neonAccent : .clear, lineWidth: 2)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func colorSection(
        _ title: String,
        current: (Double, Double, Double),
        swatches: [(Double, Double, Double)],
        apply: @escaping (Double, Double, Double) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            HStack(spacing: 8) {
                ForEach(0..<swatches.count, id: \.self) { idx in
                    let s = swatches[idx]
                    let selected = abs(current.0 - s.0) < 0.02
                        && abs(current.1 - s.1) < 0.02
                        && abs(current.2 - s.2) < 0.02
                    Button {
                        apply(s.0, s.1, s.2)
                    } label: {
                        Circle()
                            .fill(Color(red: s.0, green: s.1, blue: s.2))
                            .frame(width: 28, height: 28)
                            .overlay(Circle().stroke(.white.opacity(selected ? 0.9 : 0.2), lineWidth: selected ? 2 : 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var gearToggles: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SWAT GEAR")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            Toggle("Visor", isOn: $appearance.hasVisor).tint(GGGTheme.neonAccent)
            Toggle("Balaclava", isOn: $appearance.hasBalaclava).tint(GGGTheme.neonAccent)
            Toggle("Headset / radio", isOn: $appearance.hasHeadset).tint(GGGTheme.neonAccent)
            Toggle("Shoulder pads", isOn: $appearance.hasShoulderPads).tint(GGGTheme.neonAccent)
            Toggle("Arm guards", isOn: $appearance.hasArmGuards).tint(GGGTheme.neonAccent)
            Toggle("Knee pads", isOn: $appearance.hasKneePads).tint(GGGTheme.neonAccent)
            Toggle("Unit patch", isOn: $appearance.hasUnitPatch).tint(GGGTheme.neonAccent)
            Toggle("Medic cross", isOn: $appearance.hasMedicCross).tint(GGGTheme.neonAccent)
            Toggle("Heavy frame", isOn: $appearance.bulkyTorso).tint(GGGTheme.neonAccent)
        }
        .padding(14)
        .background(GGGTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .foregroundStyle(.white)
    }

    private var bioField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("BIO (OPTIONAL)")
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)
            TextField("Short operator bio", text: $bio, axis: .vertical)
                .lineLimit(2...4)
                .foregroundStyle(.white)
                .tint(GGGTheme.neonAccent)
                .padding(12)
                .background(GGGTheme.panelElevated)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private func hydrateIfNeeded() {
        guard !didHydrate else { return }
        didHydrate = true
        if let existing {
            callsign = existing.callsign
            bio = existing.bio
            archetype = existing.archetype
            voiceGender = existing.voiceGender
            appearance = existing.appearance
            baseLook = OperatorLook.allCases.first(where: { $0.appearance == existing.appearance }) ?? .grambo
        } else {
            callsign = ""
            bio = ""
            archetype = .balanced
            voiceGender = .neutral
            appearance = OperatorAppearance.starterCustom
            baseLook = .grambo
        }
        showValidationHint = false
    }

    private func save() {
        guard canSave else {
            showValidationHint = true
            return
        }
        let now = Date()
        let record = CustomOperatorRecord(
            id: existing?.id ?? "custom_\(UUID().uuidString)",
            callsign: trimmedCallsign.uppercased(),
            role: archetype.displayName,
            bio: bio.trimmingCharacters(in: .whitespacesAndNewlines),
            appearance: appearance,
            archetypeRaw: archetype.rawValue,
            voiceGenderRaw: voiceGender.rawValue,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now
        )
        onSave(record)
    }
}
