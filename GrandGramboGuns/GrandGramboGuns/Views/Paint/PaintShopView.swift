// PaintShopView.swift
// Full 3D paint mode with color picker, tools, and layer regions.

import SwiftUI
import UIKit

struct PaintShopView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var settings: SettingsStore
    @EnvironmentObject private var library: GunLibraryStore

    @State private var selectedGunID: UUID?
    @State private var blueprint = GunBlueprint()
    @State private var selectedTool: PaintTool = .spray
    @State private var selectedRegion: PaintRegion = .body
    @State private var paintColor = Color(hex: "#39FF14")!
    @State private var brushSize: Double = 0.45
    @State private var jobName = "Custom Paint"
    @State private var showSaved = false
    @State private var activePaintJobID: UUID?

    var body: some View {
        ZStack {
            GGGTheme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                gunPicker
                    .padding(.horizontal)
                    .padding(.top, 8)

                GunSceneView(blueprint: blueprint, allowsCameraControl: true)
                    .frame(height: 240)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(GGGTheme.neonPink.opacity(0.45), lineWidth: 1)
                    )
                    .padding()
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onEnded { value in
                                guard selectedTool != .fill else { return }
                                let size = CGSize(width: UIScreen.main.bounds.width - 32, height: 240)
                                let nx = min(max(value.location.x / size.width, 0), 1)
                                let ny = min(max(1 - value.location.y / size.height, 0), 1)
                                applyStroke(x: nx, y: ny)
                            }
                    )

                toolsBar
                regionBar
                colorRow

                HStack {
                    Text("Brush size")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                    Slider(value: $brushSize, in: 0.15...1)
                        .tint(GGGTheme.neonPink)
                }
                .padding(.horizontal)

                TextField("Paint job name", text: $jobName)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(GGGTheme.panel)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .padding(.horizontal)
                    .foregroundStyle(.white)

                HStack(spacing: 12) {
                    Button("Fill Region") {
                        selectedTool = .fill
                        applyStroke(x: 0.5, y: 0.5)
                    }
                    .buttonStyle(GhostHubButtonStyle())

                    Button("Undo") {
                        if !blueprint.paintStrokes.isEmpty {
                            blueprint.paintStrokes.removeLast()
                        }
                    }
                    .buttonStyle(GhostHubButtonStyle())
                }
                .padding(.horizontal)
                .padding(.top, 8)

                Button("Save Paint Job") { savePaint() }
                    .buttonStyle(NeonHubButtonStyle(accent: GGGTheme.neonPink))
                    .padding()
            }

            if appState.showPaintOnboarding {
                OnboardingTooltip(
                    title: "Paint Shop",
                    message: "Choose a gun, pick a part layer (Body, Barrel…), then spray, fill, or stamp camo. Colors stack as layers — save when it looks sharp."
                ) {
                    withAnimation { appState.dismissPaintOnboarding() }
                }
            }
        }
        .navigationTitle("Paint Shop")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(GGGTheme.panel, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .onAppear { selectFirstGunIfNeeded() }
        .alert("Paint saved", isPresented: $showSaved) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Your paint job is linked to this gun and will show in Armory & Range.")
        }
    }

    private var gunPicker: some View {
        Menu {
            ForEach(library.guns) { gun in
                Button(gun.name) { load(gun: gun) }
            }
        } label: {
            HStack {
                Text(blueprint.name.isEmpty ? "Select gun" : blueprint.name)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                Spacer()
                Image(systemName: "chevron.up.chevron.down")
            }
            .foregroundStyle(.white)
            .padding(12)
            .background(GGGTheme.panelElevated)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private var toolsBar: some View {
        HStack(spacing: 8) {
            ForEach(PaintTool.allCases) { tool in
                Button {
                    selectedTool = tool
                    HapticsService.select(enabled: settings.hapticsEnabled)
                } label: {
                    Label(tool.displayName, systemImage: tool.systemImage)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .foregroundStyle(selectedTool == tool ? GGGTheme.background : .white)
                        .background(Capsule().fill(selectedTool == tool ? GGGTheme.neonPink : GGGTheme.panel))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal)
    }

    private var regionBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(PaintRegion.allCases) { region in
                    Button {
                        selectedRegion = region
                    } label: {
                        Text(region.displayName)
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .foregroundStyle(selectedRegion == region ? GGGTheme.background : GGGTheme.subtitle)
                            .background(Capsule().fill(selectedRegion == region ? GGGTheme.neonAccent : GGGTheme.panelElevated))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
    }

    private var colorRow: some View {
        HStack(spacing: 14) {
            ColorPicker("Color", selection: $paintColor, supportsOpacity: false)
                .labelsHidden()
                .scaleEffect(1.3)

            ForEach(["#39FF14", "#FF2BD6", "#FFB000", "#4DA3FF", "#FFFFFF", "#1A1A1A", "#D4AF37", "#C2A46B"], id: \.self) { hex in
                Circle()
                    .fill(Color(hex: hex)!)
                    .frame(width: 28, height: 28)
                    .overlay(Circle().stroke(.white.opacity(0.25), lineWidth: 1))
                    .onTapGesture { paintColor = Color(hex: hex)! }
            }
            Spacer()
        }
        .padding(.horizontal)
        .padding(.bottom, 8)
    }

    private func selectFirstGunIfNeeded() {
        guard selectedGunID == nil, let first = library.guns.first else { return }
        load(gun: first)
    }

    private func load(gun: SavedGun) {
        selectedGunID = gun.id
        let paint = library.paintJob(id: gun.paintJobID)
        activePaintJobID = paint?.id
        blueprint = GunBlueprint(from: gun, paint: paint)
        if let paint { jobName = paint.name }
    }

    private func applyStroke(x: Double, y: Double) {
        guard selectedGunID != nil else { return }
        let hex = paintColor.toHex() ?? "#39FF14"

        if selectedTool == .fill {
            blueprint.paintStrokes.removeAll {
                $0.region == selectedRegion && $0.tool == PaintTool.fill.rawValue
            }
        }

        let stroke = PaintStroke(
            region: selectedRegion,
            tool: selectedTool.rawValue,
            colorHex: hex,
            x: x,
            y: y,
            size: brushSize
        )
        blueprint.paintStrokes.append(stroke)
        HapticsService.attach(enabled: settings.hapticsEnabled)
    }

    private func savePaint() {
        guard let gunID = selectedGunID else { return }
        let jobID = activePaintJobID ?? UUID()
        let job = PaintJobRecord(
            id: jobID,
            gunID: gunID,
            name: jobName,
            strokes: blueprint.paintStrokes,
            createdAt: library.paintJob(id: jobID)?.createdAt ?? Date(),
            updatedAt: Date()
        )
        library.upsertPaintJob(job, linkToGunID: gunID)
        activePaintJobID = job.id
        showSaved = true
    }
}

private extension Color {
    func toHex() -> String? {
        let ui = UIColor(self)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        guard ui.getRed(&r, green: &g, blue: &b, alpha: &a) else { return nil }
        return String(format: "#%02X%02X%02X", Int(r * 255), Int(g * 255), Int(b * 255))
    }
}
