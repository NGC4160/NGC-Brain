// HowToPlayTutorialView.swift
// Multi-page in-app field guide — first launch + replay from Hub / Settings.

import SwiftUI

struct TutorialPage: Identifiable, Equatable {
    let id: Int
    let badge: String
    let icon: String
    let accent: Color
    let title: String
    let body: String
    let tips: [String]
}

enum HowToPlayContent {
    static let pages: [TutorialPage] = [
        TutorialPage(
            id: 0,
            badge: "01  CONTROLS",
            icon: "dpad.fill",
            accent: GGGTheme.neonAccent,
            title: "Move & look",
            body: "Left stick walks. Drag the right half of the screen to look and aim. Third-person over-the-shoulder is the default — flip to first-person anytime in Settings.",
            tips: [
                "MOVE stick — lower left",
                "Look / aim — pan right half",
                "Settings → Third-person camera"
            ]
        ),
        TutorialPage(
            id: 1,
            badge: "02  WEAPONS",
            icon: "scope",
            accent: GGGTheme.danger,
            title: "Fire, reload & SWAP",
            body: "Hold FIRE to shoot. Tap RELOAD when the mag runs dry — empty guns click. Equip PRIMARY and SECONDARY in the Armory, then tap SWAP in combat to flip between them.",
            tips: [
                "Hold FIRE — release to stop",
                "Armory sets P1 / P2 loadout",
                "SWAP cycles your dual guns"
            ]
        ),
        TutorialPage(
            id: 2,
            badge: "03  STORY",
            icon: "book.closed.fill",
            accent: Color(hex: "#C0392B")!,
            title: "COMMS, voices & cover",
            body: "Story opens with cutscenes and radio COMMS. Lines speak aloud when Dialogue voices is on in Settings — tap to advance anytime. Solid walls block movement and bullets both ways; use corners before you push.",
            tips: [
                "Tap to advance COMMS",
                "Toggle Dialogue voices in Settings",
                "Walls stop shots — yours and theirs"
            ]
        ),
        TutorialPage(
            id: 3,
            badge: "04  SQUAD",
            icon: "person.2.fill",
            accent: Color(red: 0.15, green: 0.92, blue: 0.85),
            title: "Ally & hostiles",
            body: "Your teal KESTREL AI teammate fights beside you — watch their HUD HP strip. Enemies track smarter now: aim for the head when you can. If your ally goes down, finish the fight yourself.",
            tips: [
                "Teal bar = ally health",
                "Headshots hit harder",
                "Objectives still count if ally is DOWN"
            ]
        ),
        TutorialPage(
            id: 4,
            badge: "05  PICKUPS",
            icon: "cross.case.fill",
            accent: Color(hex: "#4DA3FF")!,
            title: "Ammo vs medkit",
            body: "Walk into field pickups — no button needed. Olive/amber crates refill magazines. Red medkits restore health. Scout the map before the push.",
            tips: [
                "Ammo crate → magazine fill",
                "Medkit → heal HP",
                "Grab both before a hard room"
            ]
        ),
        TutorialPage(
            id: 5,
            badge: "06  TRAINING",
            icon: "figure.martial.arts",
            accent: Color(hex: "#2ECC71")!,
            title: "Training bay",
            body: "Practice move, aim, fire, reload, and SWAP on soft dummies. Training awards no XP and no Combat Coins — pure warm-up with optional infinite ammo.",
            tips: [
                "Soft dummies respawn",
                "No XP · no Combat Coins",
                "Exit cleanly back to Hub"
            ]
        ),
        TutorialPage(
            id: 6,
            badge: "07  RANGE",
            icon: "target",
            accent: GGGTheme.neonPink,
            title: "Shooting Range",
            body: "Optional scored practice: drag to aim, hold FIRE, tap RELOAD, SWAP loadout guns, and knock down targets. No story pressure — great before a mission.",
            tips: [
                "Drag to aim · hold FIRE",
                "RELOAD tops the mag",
                "Warm-up before Story"
            ]
        ),
        TutorialPage(
            id: 7,
            badge: "08  RANKS",
            icon: "star.fill",
            accent: GGGTheme.neonAmber,
            title: "Ranks & XP",
            body: "Kills in Story, Multiplayer, and Battle Royale grant XP toward your rank. Training does not. Climb the board from Hub → Ranks.",
            tips: [
                "Story & arena kills grant XP",
                "Training bay stays XP-free",
                "Check progress in Ranks"
            ]
        ),
        TutorialPage(
            id: 8,
            badge: "09  SHOP",
            icon: "cart.fill",
            accent: Color(hex: "#F1C40F")!,
            title: "Combat Coins & Shop",
            body: "Each kill in Story, MP, and BR drops +2 Combat Coins (toast on screen). Spend them in Hub → Shop for exclusive guns, operators, and attachments.",
            tips: [
                "+2 CC per kill (toast)",
                "Shop: guns · ops · attachments",
                "Coins are separate from XP"
            ]
        ),
        TutorialPage(
            id: 9,
            badge: "10  FRIENDS",
            icon: "person.crop.circle.badge.plus",
            accent: Color(hex: "#5DADE2")!,
            title: "Friends & codes",
            body: "Share your friend code and add others on this device. The list is local — great for party labels in practice lobbies. Online sync is not live yet.",
            tips: [
                "Copy / share your friend code",
                "Add codes in Friends",
                "Stored on this device only"
            ]
        ),
        TutorialPage(
            id: 10,
            badge: "11  ARENA",
            icon: "person.3.fill",
            accent: Color(hex: "#9B59B6")!,
            title: "Multiplayer & BR",
            body: "Multiplayer and Battle Royale are practice AI lobbies today — MP picks 1v1…4v4 Team A vs Team B; BR keeps Solos/Duos/Trios/Squads. In TDM, climb the east/west ramps onto lookout towers and shoot from the deck. Storm zone in BR; TDM / Quick Match in MP. Real net play is on the roadmap.",
            tips: [
                "AI practice lobbies (honest)",
                "MP: 1v1 · 2v2 · 3v3 · 4v4",
                "TDM lookouts: walk the ramp up"
            ]
        ),
        TutorialPage(
            id: 11,
            badge: "12  DLC",
            icon: "sparkles",
            accent: Color(hex: "#8E44AD")!,
            title: "Ghost Lattice",
            body: "Ghost Lattice unlocks after you finish Meridian Fall in the main campaign. Until then the Hub / Story entry stays locked — clear Iron Meridian first.",
            tips: [
                "Beat Meridian Fall to unlock",
                "Entry on Hub & Story select",
                "New ops after the cascade"
            ]
        )
    ]
}

struct HowToPlayTutorialView: View {
    var onFinished: () -> Void

    @EnvironmentObject private var settings: SettingsStore
    @State private var pageIndex = 0

    private var pages: [TutorialPage] { HowToPlayContent.pages }
    private var page: TutorialPage { pages[pageIndex] }
    private var isLast: Bool { pageIndex >= pages.count - 1 }

    var body: some View {
        ZStack {
            GGGTheme.hubGradient.ignoresSafeArea()

            VStack(spacing: 0) {
                header
                    .padding(.horizontal, 20)
                    .padding(.top, 16)

                TabView(selection: $pageIndex) {
                    ForEach(pages) { p in
                        pageCard(p)
                            .tag(p.id)
                            .padding(.horizontal, 20)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut(duration: 0.25), value: pageIndex)

                footer
                    .padding(.horizontal, 20)
                    .padding(.bottom, 28)
                    .padding(.top, 8)
            }
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("FIELD GUIDE")
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(GGGTheme.neonAccent)
                    .tracking(1.5)
                Text("How to Play")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
            }
            Spacer()
            Button("Skip") {
                completeAndDismiss()
            }
            .font(.system(size: 15, weight: .semibold, design: .rounded))
            .foregroundStyle(GGGTheme.steel)
        }
    }

    private func pageCard(_ p: TutorialPage) -> some View {
        VStack(spacing: 18) {
            Spacer(minLength: 8)

            ZStack {
                Circle()
                    .fill(p.accent.opacity(0.16))
                    .frame(width: 96, height: 96)
                Circle()
                    .stroke(p.accent.opacity(0.55), lineWidth: 2)
                    .frame(width: 96, height: 96)
                Image(systemName: p.icon)
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(p.accent)
                    .shadow(color: p.accent.opacity(0.45), radius: 10)
            }

            VStack(alignment: .leading, spacing: 12) {
                Text(p.badge)
                    .font(.system(size: 11, weight: .heavy, design: .rounded))
                    .foregroundStyle(p.accent)
                    .tracking(1.2)

                Text(p.title)
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(.white)

                Text(p.body)
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(GGGTheme.subtitle)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(alignment: .leading, spacing: 8) {
                    ForEach(p.tips, id: \.self) { tip in
                        HStack(alignment: .top, spacing: 10) {
                            Circle()
                                .fill(p.accent)
                                .frame(width: 7, height: 7)
                                .padding(.top, 5)
                            Text(tip)
                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                                .foregroundStyle(.white.opacity(0.9))
                        }
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(GGGTheme.panelElevated)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(p.accent.opacity(0.4), lineWidth: 1.2)
                )
            }
            .padding(18)
            .background(GGGTheme.panel)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
            )

            Spacer(minLength: 8)
        }
    }

    private var footer: some View {
        VStack(spacing: 14) {
            HStack(spacing: 8) {
                ForEach(pages) { p in
                    Capsule()
                        .fill(p.id == pageIndex ? page.accent : GGGTheme.steelDim)
                        .frame(width: p.id == pageIndex ? 22 : 8, height: 8)
                        .animation(.easeOut(duration: 0.2), value: pageIndex)
                }
            }

            HStack(spacing: 12) {
                if pageIndex > 0 {
                    Button {
                        withAnimation { pageIndex -= 1 }
                    } label: {
                        Text("Back")
                    }
                    .buttonStyle(GhostHubButtonStyle())
                }

                Button {
                    if isLast {
                        completeAndDismiss()
                    } else {
                        withAnimation { pageIndex += 1 }
                    }
                } label: {
                    Text(isLast ? "Got it — deploy" : "Next")
                }
                .buttonStyle(NeonHubButtonStyle(accent: page.accent))
            }
        }
    }

    private func completeAndDismiss() {
        settings.markHowToPlayCompleted()
        onFinished()
    }
}

#if DEBUG
struct HowToPlayTutorialView_Previews: PreviewProvider {
    static var previews: some View {
        HowToPlayTutorialView(onFinished: {})
            .environmentObject(SettingsStore())
    }
}
#endif
