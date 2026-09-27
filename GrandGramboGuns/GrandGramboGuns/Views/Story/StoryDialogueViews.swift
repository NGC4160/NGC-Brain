// StoryDialogueViews.swift
// Speaker-labeled dialogue cards for briefings and in-mission radio.

import SwiftUI

struct DialogueLineCard: View {
    let line: StoryDialogueLine

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .center, spacing: 10) {
                Circle()
                    .fill(line.faction.accent)
                    .frame(width: 10, height: 10)
                VStack(alignment: .leading, spacing: 2) {
                    Text(line.speaker)
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(line.faction.accent)
                    Text("\(line.role)  ·  \(line.faction.channelLabel)")
                        .font(.system(size: 10, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                }
                Spacer(minLength: 0)
            }

            Text(line.text)
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(.white.opacity(0.92))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(GGGTheme.panelElevated)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(line.faction.accent.opacity(0.45), lineWidth: 1.2)
        )
    }
}

struct DialogueTranscriptView: View {
    let title: String
    let lines: [StoryDialogueLine]

    @EnvironmentObject private var settings: SettingsStore
    @State private var isSpeakingSequence = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAccent)
                Spacer(minLength: 8)
                if settings.shouldSpeakDialogue && !lines.isEmpty {
                    Button(isSpeakingSequence ? "SKIP VO" : "PLAY VO") {
                        if isSpeakingSequence {
                            DialogueVoiceService.shared.stop()
                            isSpeakingSequence = false
                        } else {
                            startSequence()
                        }
                    }
                    .font(.system(size: 10, weight: .heavy, design: .rounded))
                    .foregroundStyle(isSpeakingSequence ? GGGTheme.danger : GGGTheme.neonAmber)
                    .buttonStyle(.plain)
                }
            }

            Text(settings.shouldSpeakDialogue
                 ? "Names show who is speaking — lines auto-play in order."
                 : "Names show who is speaking on the net.")
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .foregroundStyle(GGGTheme.subtitle)

            ForEach(lines) { line in
                DialogueLineCard(line: line)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(GGGTheme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .onAppear { startSequence() }
        .onDisappear {
            DialogueVoiceService.shared.stop()
            isSpeakingSequence = false
        }
    }

    private func startSequence() {
        guard settings.shouldSpeakDialogue, !lines.isEmpty else {
            isSpeakingSequence = false
            return
        }
        isSpeakingSequence = true
        DialogueVoiceService.shared.speakSequence(lines: lines, enabled: true)
        // Approximate end of sequence so SKIP flips back to PLAY when done.
        let approxSeconds = lines.reduce(0.0) { partial, line in
            partial + max(1.2, Double(line.text.count) * 0.045) + 0.35
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + approxSeconds) {
            isSpeakingSequence = false
        }
    }
}

/// Full-screen radio overlay — tap to advance; speaker name always visible.
struct MissionDialogueOverlay: View {
    let lines: [StoryDialogueLine]
    let onFinished: () -> Void

    @EnvironmentObject private var settings: SettingsStore
    @State private var index = 0

    private var current: StoryDialogueLine? {
        guard lines.indices.contains(index) else { return nil }
        return lines[index]
    }

    var body: some View {
        ZStack {
            Color.black.opacity(0.72).ignoresSafeArea()

            VStack(spacing: 16) {
                Spacer()

                if let current {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text("COMMS")
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundStyle(GGGTheme.neonAccent)
                            Spacer()
                            Text("\(index + 1) / \(lines.count)")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .foregroundStyle(GGGTheme.steel)
                        }

                        // Big speaker identity block — impossible to miss.
                        VStack(alignment: .leading, spacing: 4) {
                            Text("SPEAKING")
                                .font(.system(size: 10, weight: .heavy, design: .rounded))
                                .foregroundStyle(GGGTheme.steel)
                            Text(current.speaker)
                                .font(.system(size: 26, weight: .black, design: .rounded))
                                .foregroundStyle(current.faction.accent)
                            Text(current.role)
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundStyle(.white.opacity(0.85))
                            Text(current.faction.channelLabel)
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundStyle(GGGTheme.steel)
                        }
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(current.faction.accent.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(current.faction.accent.opacity(0.55), lineWidth: 1.5)
                        )

                        Text(current.text)
                            .font(.system(size: 17, weight: .semibold, design: .rounded))
                            .foregroundStyle(.white)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.top, 4)

                        Button(action: advance) {
                            Text(index + 1 >= lines.count ? "BEGIN MISSION" : "NEXT  ›")
                                .font(.system(size: 15, weight: .black, design: .rounded))
                                .foregroundStyle(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(GGGTheme.neonAccent)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .padding(.top, 8)
                    }
                    .padding(18)
                    .background(GGGTheme.panel)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .padding(.horizontal, 16)
                }

                Spacer().frame(height: 24)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: advance)
        .onAppear { speakCurrentLine() }
        .onChange(of: index) { _, _ in speakCurrentLine() }
        .onDisappear { DialogueVoiceService.shared.stop() }
    }

    private func speakCurrentLine() {
        guard let current else {
            DialogueVoiceService.shared.stop()
            return
        }
        DialogueVoiceService.shared.speak(line: current, enabled: settings.shouldSpeakDialogue)
    }

    private func advance() {
        HapticsService.select(enabled: true)
        DialogueVoiceService.shared.stop()
        if index + 1 >= lines.count {
            onFinished()
        } else {
            withAnimation(.easeInOut(duration: 0.15)) {
                index += 1
            }
        }
    }
}
