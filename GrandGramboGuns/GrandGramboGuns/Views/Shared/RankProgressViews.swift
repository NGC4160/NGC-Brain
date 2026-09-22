// RankProgressViews.swift
// Hub XP bar, end-of-session summary, and one-shot rank-up banner.

import SwiftUI

struct RankBadgeChip: View {
    let rank: PlayerRank
    var compact: Bool = false

    var body: some View {
        HStack(spacing: compact ? 6 : 8) {
            Circle()
                .fill(rank.badgeColor)
                .frame(width: compact ? 8 : 10, height: compact ? 8 : 10)
                .shadow(color: rank.badgeColor.opacity(0.55), radius: 4)
            Text(rank.displayName.uppercased())
                .font(.system(size: compact ? 10 : 12, weight: .heavy, design: .monospaced))
                .foregroundStyle(.white)
                .tracking(compact ? 0.5 : 1)
        }
        .padding(.horizontal, compact ? 10 : 12)
        .padding(.vertical, compact ? 5 : 7)
        .background(GGGTheme.panelGradient)
        .overlay(Rectangle().stroke(rank.badgeColor.opacity(0.82), lineWidth: 1))
        .shadow(color: rank.badgeColor.opacity(0.18), radius: 6, y: 1)
    }
}

/// Compact hub strip: rank chip + XP bar toward next.
struct HubRankProgressBar: View {
    @ObservedObject var ranks: RankProgressStore

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                RankBadgeChip(rank: ranks.currentRank, compact: true)
                Spacer()
                if let next = ranks.nextRank, let need = ranks.xpNeededForNextRank {
                    Text("\(need) XP → \(next.displayName)")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundStyle(GGGTheme.steel)
                } else {
                    Text("MAX RANK")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.neonAccent)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(GGGTheme.gunmetal)
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    ranks.currentRank.badgeColor.opacity(0.85),
                                    GGGTheme.neonAccent.opacity(0.9)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geo.size.width * CGFloat(ranks.progressToNextRank))
                }
            }
            .frame(height: 5)
            .shadow(color: GGGTheme.neonAccent.opacity(0.28), radius: 4, y: 0)

            Text("\(ranks.totalXP) XP lifetime")
                .font(.system(size: 9, weight: .medium, design: .monospaced))
                .foregroundStyle(GGGTheme.steelDim)
        }
        .padding(14)
        .tacticalPanel(accent: ranks.currentRank.badgeColor)
    }
}

/// End-of-mission / match XP block.
struct SessionXPSummaryView: View {
    @ObservedObject var ranks: RankProgressStore

    var body: some View {
        VStack(spacing: 8) {
            Text("+\(ranks.sessionXP) XP")
                .font(.system(size: 22, weight: .black, design: .rounded))
                .foregroundStyle(GGGTheme.neonAccent)

            if ranks.sessionDidRankUp {
                Text("RANK UP → \(ranks.currentRank.displayName.uppercased())")
                    .font(.system(size: 13, weight: .heavy, design: .rounded))
                    .foregroundStyle(ranks.currentRank.badgeColor)
            } else {
                RankBadgeChip(rank: ranks.currentRank, compact: true)
            }

            if let next = ranks.nextRank, let need = ranks.xpNeededForNextRank {
                Text("\(need) XP to \(next.displayName)")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
            }
        }
        .padding(.vertical, 4)
    }
}

/// Floating one-shot celebration banner.
struct RankUpBannerView: View {
    let reward: RankUpRewardPayload
    var onDismiss: () -> Void

    @State private var visible = false

    var body: some View {
        VStack {
            HStack(spacing: 12) {
                Image(systemName: "chevron.up.circle.fill")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(reward.rank.badgeColor)
                VStack(alignment: .leading, spacing: 2) {
                    Text("RANK UP")
                        .font(.system(size: 11, weight: .heavy, design: .rounded))
                        .foregroundStyle(GGGTheme.steel)
                        .tracking(1.5)
                    Text(reward.rank.displayName.uppercased())
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    HStack(spacing: 8) {
                        if reward.coinsGranted > 0 {
                            Text("+\(reward.coinsGranted) COINS")
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundStyle(GGGTheme.neonAmber)
                        }
                        Text(reward.titleUnlock)
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                            .foregroundStyle(GGGTheme.neonAccent)
                            .lineLimit(1)
                        if reward.camoCredits > 0 {
                            Text("+\(reward.camoCredits) CAMO")
                                .font(.system(size: 11, weight: .heavy, design: .rounded))
                                .foregroundStyle(GGGTheme.neonPink)
                        }
                    }
                }
                Spacer()
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(GGGTheme.panelElevated)
                    .shadow(color: reward.rank.badgeColor.opacity(0.45), radius: 12, y: 4)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(reward.rank.badgeColor.opacity(0.7), lineWidth: 1.5)
            )
            .padding(.horizontal, 20)
            .padding(.top, 52)
            .offset(y: visible ? 0 : -40)
            .opacity(visible ? 1 : 0)

            Spacer()
        }
        .allowsHitTesting(false)
        .onAppear {
            withAnimation(.spring(response: 0.42, dampingFraction: 0.78)) {
                visible = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.8) {
                withAnimation(.easeOut(duration: 0.28)) {
                    visible = false
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    onDismiss()
                }
            }
        }
    }
}

/// Overlay helper — shows banner when `pendingRankUpToast` is set.
struct RankUpToastOverlay: ViewModifier {
    @ObservedObject var ranks: RankProgressStore
    var hapticsEnabled: Bool = true

    func body(content: Content) -> some View {
        content.overlay {
            if let reward = ranks.pendingRankUpToast {
                RankUpBannerView(reward: reward) {
                    ranks.consumeRankUpToast()
                }
                .zIndex(200)
                .transition(.move(edge: .top).combined(with: .opacity))
                .onAppear {
                    HapticsService.reload(enabled: hapticsEnabled)
                    SoundService.shared.playAttach(volume: 0.7)
                }
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: ranks.pendingRankUpToast)
    }
}

extension View {
    func rankUpToast(ranks: RankProgressStore, hapticsEnabled: Bool = true) -> some View {
        modifier(RankUpToastOverlay(ranks: ranks, hapticsEnabled: hapticsEnabled))
    }
}
