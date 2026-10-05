// CombatJuiceViews.swift
// Hit markers + kill confirms shared across Mission / Training / Arena.

import SwiftUI

enum CombatJuiceKind: Equatable {
    case hit
    case headshot
    case kill
    case headshotKill
}

/// Lightweight pub-sub for SceneKit → SwiftUI combat feedback (no heavy state).
@MainActor
final class CombatJuiceBus: ObservableObject {
    @Published private(set) var generation: UInt = 0
    @Published private(set) var kind: CombatJuiceKind = .hit
    @Published private(set) var killLabel: String?

    func pulse(_ kind: CombatJuiceKind) {
        self.kind = kind
        switch kind {
        case .kill:
            killLabel = "ELIMINATED"
        case .headshotKill:
            killLabel = "HEADSHOT KILL"
        default:
            killLabel = nil
        }
        generation &+= 1
    }
}

struct HitMarkerOverlay: View {
    @ObservedObject var juice: CombatJuiceBus

    @State private var markerVisible = false
    @State private var killVisible = false
    @State private var shownGeneration: UInt = 0

    var body: some View {
        ZStack {
            if markerVisible {
                HitMarkerShape(headshot: juice.kind == .headshot || juice.kind == .headshotKill)
                    .stroke(
                        juice.kind == .headshot || juice.kind == .headshotKill
                            ? Color.red
                            : Color.white,
                        lineWidth: juice.kind == .headshot || juice.kind == .headshotKill ? 2.4 : 1.8
                    )
                    .frame(width: 28, height: 28)
                    .offset(y: -30)
                    .opacity(markerVisible ? 1 : 0)
            }

            if killVisible, let label = juice.killLabel {
                Text(label)
                    .font(.system(size: 15, weight: .black, design: .rounded))
                    .foregroundStyle(
                        juice.kind == .headshotKill ? Color.red : GGGTheme.neonAccent
                    )
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.55))
                    .clipShape(Capsule())
                    .offset(y: -78)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .allowsHitTesting(false)
        .onChange(of: juice.generation) { _, gen in
            guard gen != shownGeneration else { return }
            shownGeneration = gen
            withAnimation(.easeOut(duration: 0.06)) {
                markerVisible = true
            }
            let isKill = juice.kind == .kill || juice.kind == .headshotKill
            if isKill {
                withAnimation(.spring(response: 0.28, dampingFraction: 0.75)) {
                    killVisible = true
                }
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.14) {
                withAnimation(.easeOut(duration: 0.12)) {
                    markerVisible = false
                }
            }
            if isKill {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.85) {
                    withAnimation(.easeOut(duration: 0.2)) {
                        killVisible = false
                    }
                }
            }
        }
    }
}

private struct HitMarkerShape: Shape {
    var headshot: Bool

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let cx = rect.midX
        let cy = rect.midY
        let arm: CGFloat = headshot ? 11 : 9
        let gap: CGFloat = headshot ? 3.5 : 4.5
        path.move(to: CGPoint(x: cx - arm, y: cy))
        path.addLine(to: CGPoint(x: cx - gap, y: cy))
        path.move(to: CGPoint(x: cx + gap, y: cy))
        path.addLine(to: CGPoint(x: cx + arm, y: cy))
        path.move(to: CGPoint(x: cx, y: cy - arm))
        path.addLine(to: CGPoint(x: cx, y: cy - gap))
        path.move(to: CGPoint(x: cx, y: cy + gap))
        path.addLine(to: CGPoint(x: cx, y: cy + arm))
        if headshot {
            path.addEllipse(in: CGRect(x: cx - 3, y: cy - 3, width: 6, height: 6))
        }
        return path
    }
}
