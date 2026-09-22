// VirtualJoystick.swift
// Analog stick for story-mode movement — absolute thumb position, large hit pad.

import SwiftUI

struct VirtualJoystick: View {
    @Binding var axis: CGPoint
    var diameter: CGFloat = 148

    @State private var knob: CGPoint = .zero
    @State private var dragging = false

    private var radius: CGFloat { diameter * 0.5 }
    /// How far the knob can travel from center.
    private var knobTravel: CGFloat { radius * 0.62 }
    /// Extra invisible padding so the stick is easy to grab.
    private var hitPad: CGFloat { diameter * 1.35 }

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.black.opacity(0.5))
                .overlay(Circle().stroke(Color.white.opacity(0.28), lineWidth: 2))
                .frame(width: diameter, height: diameter)

            Circle()
                .stroke(Color.white.opacity(0.12), lineWidth: 1)
                .frame(width: diameter * 0.72, height: diameter * 0.72)

            // Cardinal notches
            ForEach(0..<4, id: \.self) { i in
                Capsule()
                    .fill(Color.white.opacity(0.18))
                    .frame(width: 3, height: 10)
                    .offset(y: -diameter * 0.38)
                    .rotationEffect(.degrees(Double(i) * 90))
            }

            Circle()
                .fill(dragging ? GGGTheme.neonAmber : GGGTheme.neonAccent.opacity(0.92))
                .frame(width: diameter * 0.38, height: diameter * 0.38)
                .overlay(Circle().stroke(Color.white.opacity(0.4), lineWidth: 1.5))
                .offset(x: knob.x, y: knob.y)
                .shadow(color: GGGTheme.neonAccent.opacity(dragging ? 0.55 : 0.35), radius: dragging ? 10 : 6)
        }
        .frame(width: hitPad, height: hitPad)
        .contentShape(Circle())
        .gesture(
            DragGesture(minimumDistance: 0, coordinateSpace: .local)
                .onChanged { value in
                    dragging = true
                    // Absolute position from pad center — not translation — so the stick
                    // tracks the thumb even if you grab from the edge.
                    let center = CGPoint(x: hitPad * 0.5, y: hitPad * 0.5)
                    let delta = CGPoint(
                        x: value.location.x - center.x,
                        y: value.location.y - center.y
                    )
                    let clipped = clamp(delta, max: knobTravel)
                    knob = clipped

                    var nx = clipped.x / knobTravel
                    var ny = -clipped.y / knobTravel // screen-up → forward (+)
                    // Soft deadzone so resting thumb doesn't creep.
                    let mag = hypot(nx, ny)
                    if mag < 0.12 {
                        nx = 0
                        ny = 0
                    } else {
                        // Remap remaining range to 0…1 for snappier walk/run.
                        let remapped = (mag - 0.12) / 0.88
                        nx = nx / mag * min(1, remapped)
                        ny = ny / mag * min(1, remapped)
                    }
                    axis = CGPoint(x: nx, y: ny)
                }
                .onEnded { _ in
                    dragging = false
                    withAnimation(.easeOut(duration: 0.14)) { knob = .zero }
                    axis = .zero
                }
        )
        .onDisappear {
            dragging = false
            knob = .zero
            axis = .zero
        }
    }

    private func clamp(_ p: CGPoint, max: CGFloat) -> CGPoint {
        let len = hypot(p.x, p.y)
        guard len > max, len > 0 else { return p }
        return CGPoint(x: p.x / len * max, y: p.y / len * max)
    }
}
