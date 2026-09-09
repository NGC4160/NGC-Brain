// RangeView.swift
// Shooting range — drag to aim, hold fire, reload, SWAP loadout, scored targets.

import SwiftUI

struct RangeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore
    @EnvironmentObject private var roster: OperatorRosterStore

    @State private var ammo = 0
    @State private var magSize = 12
    @State private var score = 0
    @State private var isFiring = false
    @State private var reloadToken = 0
    @State private var blueprint: GunBlueprint?
    @State private var showNoGunAlert = false
    @State private var activeSlot: LoadoutSlot = .primary
    @State private var ammoBySlot: [LoadoutSlot: Int] = [:]
    @State private var lastHitLabel = ""

    private var canSwap: Bool {
        appState.primaryGunID != nil && appState.secondaryGunID != nil
    }

    private var activeOperator: OperatorProfile {
        roster.profile(id: settings.selectedOperatorID)
    }

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            if let blueprint {
                RangeSceneView(
                    blueprint: blueprint,
                    ammo: $ammo,
                    score: $score,
                    lastHitLabel: $lastHitLabel,
                    isFiring: isFiring,
                    reloadToken: reloadToken,
                    hapticsEnabled: settings.hapticsEnabled,
                    soundVolume: settings.soundVolume,
                    thirdPersonMode: settings.thirdPersonMode,
                    operatorLook: activeOperator.look
                )
                .ignoresSafeArea()

                CrosshairView()
                    .allowsHitTesting(false)

                VStack {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 6) {
                            scoreBadge
                            if !lastHitLabel.isEmpty {
                                Text(lastHitLabel)
                                    .font(.system(size: 14, weight: .black, design: .rounded))
                                    .foregroundStyle(GGGTheme.neonAccent)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(.ultraThinMaterial)
                                    .clipShape(Capsule())
                                    .transition(.opacity.combined(with: .move(edge: .top)))
                            }
                        }
                        .animation(.easeOut(duration: 0.15), value: lastHitLabel)

                        Spacer()

                        VStack(alignment: .trailing, spacing: 6) {
                            ammoBadge
                            if canSwap {
                                Text(activeSlot == .primary ? "PRIMARY" : "SECONDARY")
                                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                                    .foregroundStyle(GGGTheme.subtitle)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(.ultraThinMaterial)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)

                    Spacer()
                        .allowsHitTesting(false)

                    Text(canSwap
                          ? "Drag to aim • Hold FIRE • RELOAD • SWAP"
                          : "Drag to aim • Hold FIRE • RELOAD")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                        .padding(.bottom, 4)
                        .allowsHitTesting(false)

                    controls
                        .padding(.bottom, 28)
                }
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "target")
                        .font(.system(size: 48))
                        .foregroundStyle(GGGTheme.danger)
                    Text("No gun equipped")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Text("Pick Primary / Secondary in the Armory, then open Shooting Range.")
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                    Button("Open Armory") {
                        appState.path = NavigationPath()
                        appState.navigate(to: .armory)
                    }
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
                    .padding(.horizontal, 40)
                }
            }
        }
        .navigationTitle("Range")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .onAppear(perform: loadEquipped)
        .alert("Equip a gun first", isPresented: $showNoGunAlert) {
            Button("OK", role: .cancel) {}
        }
    }

    private var scoreBadge: some View {
        Label("\(score)", systemImage: "star.fill")
            .font(.system(size: 18, weight: .black, design: .rounded))
            .foregroundStyle(GGGTheme.neonAmber)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
    }

    private var ammoBadge: some View {
        Label("\(ammo) / \(magSize)", systemImage: "circle.grid.3x3.fill")
            .font(.system(size: 18, weight: .black, design: .rounded))
            .foregroundStyle(ammo == 0 ? GGGTheme.danger : GGGTheme.neonAccent)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
    }

    private var controls: some View {
        HStack(spacing: 14) {
            Button {
                reload()
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 24, weight: .bold))
                    Text("RELOAD")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                }
                .foregroundStyle(.white)
                .frame(width: 80, height: 80)
                .background(GGGTheme.panelElevated.opacity(0.92))
                .clipShape(Circle())
                .overlay(Circle().stroke(GGGTheme.neonAccent.opacity(0.5), lineWidth: 2))
            }

            if canSwap {
                Button {
                    swapWeapon()
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.system(size: 20, weight: .bold))
                        Text("SWAP")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                    }
                    .foregroundStyle(.white)
                    .frame(width: 72, height: 72)
                    .background(Circle().fill(GGGTheme.panelElevated.opacity(0.92)))
                    .overlay(Circle().stroke(GGGTheme.neonAccent.opacity(0.55), lineWidth: 2))
                }
                .buttonStyle(.plain)
            }

            Text("FIRE")
                .font(.system(size: 26, weight: .black, design: .rounded))
                .foregroundStyle(.white)
                .frame(width: canSwap ? 120 : 140, height: canSwap ? 120 : 140)
                .background(
                    Circle().fill(isFiring ? GGGTheme.neonAmber : GGGTheme.danger)
                )
                .overlay(Circle().stroke(.white.opacity(0.25), lineWidth: 3))
                .scaleEffect(isFiring ? 0.94 : 1)
                .animation(.easeOut(duration: 0.08), value: isFiring)
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in isFiring = true }
                        .onEnded { _ in isFiring = false }
                )

            Button {
                score = 0
                lastHitLabel = ""
                HapticsService.select(enabled: settings.hapticsEnabled)
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "arrow.counterclockwise")
                        .font(.system(size: 24, weight: .bold))
                    Text("SCORE")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                }
                .foregroundStyle(.white)
                .frame(width: 80, height: 80)
                .background(GGGTheme.panelElevated.opacity(0.92))
                .clipShape(Circle())
                .overlay(Circle().stroke(GGGTheme.steelDim, lineWidth: 2))
            }
        }
    }

    private func loadEquipped() {
        activeSlot = .primary
        ammoBySlot = [:]

        // Prefer primary; fall back to secondary or first library gun.
        let primaryID = appState.primaryGunID
        let secondaryID = appState.secondaryGunID
        let gun: SavedGun?
        if let primaryID, let g = library.gun(id: primaryID) {
            gun = g
            activeSlot = .primary
        } else if let secondaryID, let g = library.gun(id: secondaryID) {
            gun = g
            activeSlot = .secondary
            appState.primaryGunID = g.id
        } else if let first = library.guns.first {
            gun = first
            appState.primaryGunID = first.id
            activeSlot = .primary
        } else {
            gun = nil
        }

        guard let gun else {
            blueprint = nil
            return
        }

        applyGun(gun, slot: activeSlot, resetAmmo: true)
        appState.pendingRangeLaunch = false
    }

    private func applyGun(_ gun: SavedGun, slot: LoadoutSlot, resetAmmo: Bool) {
        let bp = library.blueprint(for: gun)
        blueprint = bp
        magSize = bp.magCapacity
        if resetAmmo {
            ammo = magSize
            ammoBySlot[slot] = magSize
        } else {
            ammo = ammoBySlot[slot] ?? magSize
        }
        activeSlot = slot
        isFiring = false
    }

    private func swapWeapon() {
        guard canSwap else { return }
        isFiring = false
        ammoBySlot[activeSlot] = ammo

        let next: LoadoutSlot = activeSlot == .primary ? .secondary : .primary
        guard let id = appState.equippedID(for: next),
              let gun = library.gun(id: id) else { return }

        applyGun(gun, slot: next, resetAmmo: false)
        HapticsService.select(enabled: settings.hapticsEnabled)
        SoundService.shared.playReload(volume: settings.soundVolume * 0.55)
        lastHitLabel = next == .primary ? "PRIMARY" : "SECONDARY"
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            if lastHitLabel == "PRIMARY" || lastHitLabel == "SECONDARY" {
                lastHitLabel = ""
            }
        }
    }

    private func reload() {
        ammo = magSize
        ammoBySlot[activeSlot] = magSize
        reloadToken += 1
        isFiring = false
    }
}

// MARK: - Crosshair

private struct CrosshairView: View {
    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.55), lineWidth: 1.5)
                .frame(width: 44, height: 44)
            Circle()
                .fill(GGGTheme.neonAccent.opacity(0.9))
                .frame(width: 5, height: 5)
            Rectangle()
                .fill(Color.white.opacity(0.7))
                .frame(width: 1.5, height: 12)
                .offset(y: -22)
            Rectangle()
                .fill(Color.white.opacity(0.7))
                .frame(width: 1.5, height: 12)
                .offset(y: 22)
            Rectangle()
                .fill(Color.white.opacity(0.7))
                .frame(width: 12, height: 1.5)
                .offset(x: -22)
            Rectangle()
                .fill(Color.white.opacity(0.7))
                .frame(width: 12, height: 1.5)
                .offset(x: 22)
        }
        .shadow(color: .black.opacity(0.5), radius: 2)
        .offset(y: -48)
    }
}
