// RangeView.swift
// Arcade shooting range — tap/hold fire, reload swipe, score + ammo HUD.

import SwiftUI

struct RangeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore

    @State private var ammo = 0
    @State private var magSize = 12
    @State private var score = 0
    @State private var isFiring = false
    @State private var reloadToken = 0
    @State private var blueprint: GunBlueprint?
    @State private var showNoGunAlert = false

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            if let blueprint {
                RangeSceneView(
                    blueprint: blueprint,
                    ammo: $ammo,
                    score: $score,
                    isFiring: isFiring,
                    reloadToken: reloadToken,
                    hapticsEnabled: settings.hapticsEnabled,
                    soundVolume: settings.soundVolume
                )
                .ignoresSafeArea()

                VStack {
                    HStack {
                        scoreBadge
                        Spacer()
                        ammoBadge
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)

                    Spacer()

                    Text(blueprint.name)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(GGGTheme.subtitle)
                        .padding(.bottom, 4)

                    controls
                        .padding(.bottom, 28)
                }

                HStack {
                    Spacer()
                    Color.clear
                        .frame(width: 72)
                        .contentShape(Rectangle())
                        .gesture(
                            DragGesture(minimumDistance: 40)
                                .onEnded { value in
                                    if value.translation.height < -40 {
                                        reload()
                                    }
                                }
                        )
                }
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "target")
                        .font(.system(size: 48))
                        .foregroundStyle(GGGTheme.danger)
                    Text("No gun equipped")
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Text("Pick one in the Armory and tap Equip → Range.")
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
        HStack(spacing: 18) {
            Button {
                reload()
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 26, weight: .bold))
                    Text("RELOAD")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                }
                .foregroundStyle(.white)
                .frame(width: 88, height: 88)
                .background(GGGTheme.panelElevated.opacity(0.92))
                .clipShape(Circle())
                .overlay(Circle().stroke(GGGTheme.neonAccent.opacity(0.5), lineWidth: 2))
            }

            Text("FIRE")
                .font(.system(size: 28, weight: .black, design: .rounded))
                .foregroundStyle(GGGTheme.background)
                .frame(width: 140, height: 140)
                .background(
                    Circle().fill(isFiring ? GGGTheme.neonAmber : GGGTheme.danger)
                )
                .overlay(Circle().stroke(.white.opacity(0.25), lineWidth: 3))
                .scaleEffect(isFiring ? 0.94 : 1)
                .animation(.easeOut(duration: 0.08), value: isFiring)
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { _ in
                            if ammo > 0 { isFiring = true }
                        }
                        .onEnded { _ in isFiring = false }
                )

            Button {
                score = 0
                HapticsService.select(enabled: settings.hapticsEnabled)
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "arrow.counterclockwise")
                        .font(.system(size: 26, weight: .bold))
                    Text("SCORE")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                }
                .foregroundStyle(.white)
                .frame(width: 88, height: 88)
                .background(GGGTheme.panelElevated.opacity(0.92))
                .clipShape(Circle())
                .overlay(Circle().stroke(GGGTheme.steelDim, lineWidth: 2))
            }
        }
    }

    private func loadEquipped() {
        let gun: SavedGun?
        if let id = appState.equippedGunID {
            gun = library.gun(id: id)
        } else {
            gun = library.guns.first
            if let gun { appState.equippedGunID = gun.id }
        }

        guard let gun else {
            blueprint = nil
            return
        }

        let bp = library.blueprint(for: gun)
        blueprint = bp
        magSize = bp.bodyType.defaultMagCapacity
        ammo = magSize
        appState.pendingRangeLaunch = false
    }

    private func reload() {
        ammo = magSize
        reloadToken += 1
        isFiring = false
    }
}
