// ShakeShootView.swift
// Core “use phone like a gun” mode — shake (or tap) to fire with sound, haptics, flashlight.

import SwiftUI

struct ShakeShootView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore

    @StateObject private var shake = MotionShakeService()

    @State private var ammo = 0
    @State private var magSize = 12
    @State private var blueprint: GunBlueprint?
    @State private var recoilKick: CGFloat = 0
    @State private var flashOverlay = false
    @State private var emptyClickPulse = false
    @State private var lastHandledShake = 0

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if let blueprint {
                // First-person-ish gun presentation
                GunSceneView(
                    blueprint: blueprint,
                    allowsCameraControl: false,
                    autoSpin: false,
                    shakeHeldPose: true
                )
                .offset(y: recoilKick)
                .rotation3DEffect(.degrees(Double(recoilKick) * -1.2), axis: (x: 1, y: 0.15, z: 0))
                .ignoresSafeArea()

                // Screen flash when firing (supplements torch)
                if flashOverlay {
                    Color.orange.opacity(0.35)
                        .ignoresSafeArea()
                        .allowsHitTesting(false)
                }

                VStack {
                    topBar(name: blueprint.displayName, bodyType: blueprint.bodyType)
                    Spacer()
                    bottomBar(bodyType: blueprint.bodyType)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            } else {
                emptyState
            }
        }
        .navigationTitle("Shake to Shoot")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .onAppear(perform: loadEquipped)
        .onDisappear {
            shake.stop()
            FlashlightService.setEnabled(false)
        }
        .onChange(of: shake.shakePulse) { _, newValue in
            guard newValue != lastHandledShake else { return }
            lastHandledShake = newValue
            handleFireRequest()
        }
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
    }

    // MARK: - Chrome

    private func topBar(name: String, bodyType: GunBodyType) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(bodyType.displayName.uppercased())
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAccent)
            }
            Spacer()
            ammoBadge
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial.opacity(0.85))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var ammoBadge: some View {
        VStack(spacing: 0) {
            Text("\(ammo)")
                .font(.system(size: 36, weight: .black, design: .rounded))
                .foregroundStyle(ammo == 0 ? GGGTheme.danger : .white)
            Text(ammo == 0 ? "RELOAD" : "ROUNDS")
                .font(.system(size: 9, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .tracking(1)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.5))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(ammo == 0 ? GGGTheme.danger.opacity(0.8) : Color.white.opacity(0.15), lineWidth: 1.5)
                )
        )
        .scaleEffect(emptyClickPulse ? 1.12 : 1)
    }

    private func bottomBar(bodyType: GunBodyType) -> some View {
        VStack(spacing: 14) {
            Text(ammo == 0 ? "RELOAD TO CONTINUE" : "SHAKE TO SHOOT")
                .font(.system(size: 13, weight: .heavy, design: .rounded))
                .foregroundStyle(ammo == 0 ? GGGTheme.danger : GGGTheme.subtitle)
                .tracking(2)

            HStack(spacing: 16) {
                Button(action: reload) {
                    Label("RELOAD", systemImage: "arrow.clockwise")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(GGGTheme.panelElevated)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(GGGTheme.neonAccent.opacity(0.5), lineWidth: 1.5)
                        )
                }

                // Tap / hold fire — Simulator fallback + accessibility.
                Text(ammo == 0 ? "EMPTY" : "FIRE")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundStyle(GGGTheme.background)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(ammo == 0 ? GGGTheme.steelDim : GGGTheme.danger)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { _ in
                                shake.simulateShake()
                            }
                    )
            }

            Text("Hold phone like a gun • Shake hard to fire • \(bodyType.displayName) ROF")
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
                .multilineTextAlignment(.center)
        }
        .padding(.bottom, 8)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "iphone.radiowaves.left.and.right")
                .font(.system(size: 48))
                .foregroundStyle(GGGTheme.neonAccent)
            Text("No gun equipped")
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text("Pick a gun in the Armory, then come back to shake-fire.")
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 28)
            Button("Open Armory") {
                appState.path = NavigationPath()
                appState.navigate(to: .armory)
            }
            .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonAccent))
            .padding(.horizontal, 40)
        }
    }

    // MARK: - Logic

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
        magSize = bp.magCapacity
        ammo = magSize
        appState.pendingShakeLaunch = false

        let auto = bp.bodyType == .smg || bp.bodyType == .machineGun
        shake.start(
            sensitivity: settings.shakeSensitivity,
            minInterval: bp.fireInterval,
            sustainWhileShaking: auto
        )
    }

    private func handleFireRequest() {
        guard let blueprint else { return }

        if ammo <= 0 {
            // Empty magazine click — matches reference “reload when out of bullets” loop.
            SoundService.shared.playEmpty(volume: settings.soundVolume)
            withAnimation(.easeOut(duration: 0.08)) { emptyClickPulse = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
                emptyClickPulse = false
            }
            HapticsService.select(enabled: settings.hapticsEnabled)
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
            return
        }

        ammo -= 1
        SoundService.shared.playFire(bodyType: blueprint.bodyType, volume: settings.soundVolume)
        HapticsService.fire(enabled: settings.hapticsEnabled, bodyType: blueprint.bodyType)

        if settings.flashlightEnabled {
            FlashlightService.muzzleFlash(duration: blueprint.torchFlashDuration)
        }

        // Visual recoil + screen flash
        withAnimation(.easeOut(duration: 0.04)) {
            recoilKick = blueprint.recoilKickAmount
            flashOverlay = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
            withAnimation(.easeOut(duration: 0.12)) {
                recoilKick = 0
                flashOverlay = false
            }
        }
    }

    private func reload() {
        ammo = magSize
        reloadTokenBump()
        SoundService.shared.playReload(volume: settings.soundVolume)
        HapticsService.reload(enabled: settings.hapticsEnabled)
    }

    private func reloadTokenBump() {
        // Restart shake cooldown with current body interval after reload.
        if let blueprint {
            let auto = blueprint.bodyType == .smg || blueprint.bodyType == .machineGun
            shake.start(
                sensitivity: settings.shakeSensitivity,
                minInterval: blueprint.fireInterval,
                sustainWhileShaking: auto
            )
        }
    }
}

