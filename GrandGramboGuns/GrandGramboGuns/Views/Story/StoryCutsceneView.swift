// StoryCutsceneView.swift
// Full-screen cinematic overlay — tap / Continue to advance; Skip available.

import SwiftUI

struct StoryCutsceneView: View {
    let cutscene: StoryCutscene
    let onFinished: () -> Void

    @EnvironmentObject private var settings: SettingsStore
    @State private var index = 0
    @State private var pulse = false

    private var current: StoryCutsceneBeat? {
        guard cutscene.beats.indices.contains(index) else { return nil }
        return cutscene.beats[index]
    }

    private var isLast: Bool {
        index + 1 >= cutscene.beats.count
    }

    var body: some View {
        ZStack {
            atmosphere
            vignette

            VStack(spacing: 0) {
                topBar
                Spacer(minLength: 12)
                beatPanel
                Spacer(minLength: 8)
                bottomBar
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: advance)
        .onAppear {
            withAnimation(.easeInOut(duration: 3.2).repeatForever(autoreverses: true)) {
                pulse = true
            }
            speakCurrentBeat()
        }
        .onChange(of: index) { _, _ in speakCurrentBeat() }
        .onDisappear { DialogueVoiceService.shared.stop() }
    }

    private var atmosphere: some View {
        ZStack {
            LinearGradient(
                colors: cutscene.mood.gradientColors,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Soft drifting wash
            Circle()
                .fill(cutscene.mood.accent.opacity(pulse ? 0.18 : 0.08))
                .frame(width: 340, height: 340)
                .blur(radius: 60)
                .offset(x: pulse ? 40 : -30, y: pulse ? -80 : -40)
                .ignoresSafeArea()

            // Scanline suggestion (kept light — heavy ForEach under SceneKit stalls)
            VStack(spacing: 6) {
                ForEach(0..<12, id: \.self) { _ in
                    Rectangle()
                        .fill(Color.white.opacity(0.02))
                        .frame(height: 1)
                }
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)
        }
    }

    private var vignette: some View {
        RadialGradient(
            colors: [.clear, Color.black.opacity(0.72)],
            center: .center,
            startRadius: 80,
            endRadius: 420
        )
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }

    private var topBar: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("CUTSCENE")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(cutscene.mood.accent)
                Text(cutscene.locationSlug)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.85))
            }
            Spacer()
            Button("SKIP") {
                HapticsService.select(enabled: true)
                DialogueVoiceService.shared.stop()
                onFinished()
            }
            .font(.system(size: 13, weight: .heavy, design: .rounded))
            .foregroundStyle(GGGTheme.steel)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.08))
            .clipShape(Capsule())
            .buttonStyle(.plain)
        }
    }

    @ViewBuilder
    private var beatPanel: some View {
        if let current {
            VStack(alignment: .leading, spacing: 16) {
                switch current {
                case .titleCard(_, let eyebrow, let title, let subtitle):
                    titleCard(eyebrow: eyebrow, title: title, subtitle: subtitle)
                case .narration(_, let text):
                    narrationCard(text)
                case .dialogue(let line):
                    dialogueCard(line)
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(GGGTheme.panel.opacity(0.92))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(cutscene.mood.accent.opacity(0.4), lineWidth: 1.4)
            )
            .id(current.id)
            .transition(.opacity.combined(with: .move(edge: .bottom)))
        }
    }

    private func titleCard(eyebrow: String, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(eyebrow.uppercased())
                .font(.system(size: 11, weight: .heavy, design: .rounded))
                .foregroundStyle(cutscene.mood.accent)
                .tracking(1.5)
            Text(title)
                .font(.system(size: 28, weight: .black, design: .rounded))
                .foregroundStyle(.white)
            Text(subtitle)
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func narrationCard(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("NARRATION")
                .font(.system(size: 10, weight: .heavy, design: .rounded))
                .foregroundStyle(GGGTheme.steel)
            Text(text)
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .foregroundStyle(.white.opacity(0.92))
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func dialogueCard(_ line: StoryDialogueLine) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text("SPEAKING")
                    .font(.system(size: 10, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
                Text(line.speaker)
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(line.faction.accent)
                Text(line.role)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.85))
                Text(line.faction.channelLabel)
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.steel)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(line.faction.accent.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(line.faction.accent.opacity(0.55), lineWidth: 1.5)
            )

            Text(line.text)
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var bottomBar: some View {
        VStack(spacing: 10) {
            Text("\(index + 1) / \(max(cutscene.beats.count, 1))")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(GGGTheme.steel)

            Button(action: advance) {
                Text(isLast ? "CONTINUE" : "NEXT  ›")
                    .font(.system(size: 15, weight: .black, design: .rounded))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(cutscene.mood.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
        }
    }

    private func speakCurrentBeat() {
        guard settings.shouldSpeakDialogue, let current else {
            DialogueVoiceService.shared.stop()
            return
        }
        switch current {
        case .dialogue(let line):
            DialogueVoiceService.shared.speak(line: line, enabled: true)
        case .narration(_, let text):
            DialogueVoiceService.shared.speakNarration(text, enabled: true)
        case .titleCard(_, _, let title, let subtitle):
            // Soft VO for title cards — title + subtitle only (not the whole wall).
            let joined = [title, subtitle]
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
                .joined(separator: ". ")
            DialogueVoiceService.shared.speakNarration(joined, enabled: true)
        }
    }

    private func advance() {
        HapticsService.select(enabled: true)
        DialogueVoiceService.shared.stop()
        if isLast {
            onFinished()
        } else {
            withAnimation(.easeInOut(duration: 0.18)) {
                index += 1
            }
        }
    }
}
