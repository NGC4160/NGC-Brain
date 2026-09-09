// StoryCutscene.swift
// Short cinematic beats before / after missions — speaker always labeled.

import Foundation
import SwiftUI

enum CutsceneMood: String, Hashable {
    case harbor
    case plaza
    case metro
    case docks
    case bazaar
    case rail
    case alpine
    case grid
    case compound
    case victory
    case oracle
    case archive
    case fogPier
    case ghostCanyon
    case nullVault

    var accent: Color {
        switch self {
        case .harbor: return Color(red: 0.25, green: 0.55, blue: 0.75)
        case .plaza: return Color(red: 0.55, green: 0.65, blue: 0.85)
        case .metro: return Color(red: 0.35, green: 0.45, blue: 0.55)
        case .docks: return Color(red: 0.2, green: 0.35, blue: 0.55)
        case .bazaar: return GGGTheme.neonAmber
        case .rail: return Color(red: 0.55, green: 0.35, blue: 0.25)
        case .alpine: return Color(red: 0.55, green: 0.7, blue: 0.85)
        case .grid: return GGGTheme.neonAccent
        case .compound: return GGGTheme.danger
        case .victory: return GGGTheme.neonAccent
        case .oracle: return Color(red: 0.75, green: 0.45, blue: 1.0)
        case .archive: return Color(red: 0.45, green: 0.85, blue: 0.95)
        case .fogPier: return Color(red: 0.35, green: 0.5, blue: 0.7)
        case .ghostCanyon: return Color(red: 0.65, green: 0.55, blue: 0.95)
        case .nullVault: return Color(red: 0.85, green: 0.25, blue: 0.55)
        }
    }

    var gradientColors: [Color] {
        switch self {
        case .harbor:
            return [Color(red: 0.04, green: 0.08, blue: 0.14), Color(red: 0.08, green: 0.18, blue: 0.28), Color.black]
        case .plaza:
            return [Color(red: 0.08, green: 0.09, blue: 0.14), Color(red: 0.16, green: 0.18, blue: 0.28), Color.black]
        case .metro:
            return [Color(red: 0.05, green: 0.05, blue: 0.07), Color(red: 0.12, green: 0.14, blue: 0.18), Color.black]
        case .docks:
            return [Color(red: 0.03, green: 0.06, blue: 0.12), Color(red: 0.1, green: 0.16, blue: 0.22), Color.black]
        case .bazaar:
            return [Color(red: 0.12, green: 0.05, blue: 0.02), Color(red: 0.28, green: 0.12, blue: 0.05), Color.black]
        case .rail:
            return [Color(red: 0.08, green: 0.05, blue: 0.04), Color(red: 0.22, green: 0.12, blue: 0.08), Color.black]
        case .alpine:
            return [Color(red: 0.06, green: 0.1, blue: 0.16), Color(red: 0.18, green: 0.24, blue: 0.32), Color.black]
        case .grid:
            return [Color(red: 0.02, green: 0.1, blue: 0.05), Color(red: 0.05, green: 0.2, blue: 0.1), Color.black]
        case .compound:
            return [Color(red: 0.1, green: 0.03, blue: 0.03), Color(red: 0.22, green: 0.06, blue: 0.06), Color.black]
        case .victory:
            return [Color(red: 0.03, green: 0.1, blue: 0.05), Color(red: 0.08, green: 0.22, blue: 0.12), Color.black]
        case .oracle:
            return [Color(red: 0.08, green: 0.03, blue: 0.12), Color(red: 0.18, green: 0.08, blue: 0.28), Color.black]
        case .archive:
            return [Color(red: 0.02, green: 0.08, blue: 0.1), Color(red: 0.06, green: 0.16, blue: 0.2), Color.black]
        case .fogPier:
            return [Color(red: 0.04, green: 0.07, blue: 0.12), Color(red: 0.12, green: 0.16, blue: 0.22), Color.black]
        case .ghostCanyon:
            return [Color(red: 0.08, green: 0.06, blue: 0.14), Color(red: 0.18, green: 0.12, blue: 0.28), Color.black]
        case .nullVault:
            return [Color(red: 0.1, green: 0.02, blue: 0.08), Color(red: 0.22, green: 0.05, blue: 0.14), Color.black]
        }
    }
}

enum StoryCutsceneBeat: Identifiable, Hashable {
    case titleCard(id: String, eyebrow: String, title: String, subtitle: String)
    case narration(id: String, text: String)
    case dialogue(StoryDialogueLine)

    var id: String {
        switch self {
        case .titleCard(let id, _, _, _): return id
        case .narration(let id, _): return id
        case .dialogue(let line): return line.id
        }
    }

    func resolved(operatorCallsign: String, operatorGender: OperatorVoiceGender = .neutral) -> StoryCutsceneBeat {
        switch self {
        case .titleCard, .narration:
            return self
        case .dialogue(let line):
            return .dialogue(line.resolved(operatorCallsign: operatorCallsign, operatorGender: operatorGender))
        }
    }
}

struct StoryCutscene: Identifiable, Hashable {
    let id: String
    let locationSlug: String
    let mood: CutsceneMood
    let beats: [StoryCutsceneBeat]

    func resolved(operatorCallsign: String, operatorGender: OperatorVoiceGender = .neutral) -> StoryCutscene {
        StoryCutscene(
            id: id,
            locationSlug: locationSlug,
            mood: mood,
            beats: beats.map { $0.resolved(operatorCallsign: operatorCallsign, operatorGender: operatorGender) }
        )
    }
}

enum CampaignCutscenes {
    static func pre(for missionID: String) -> StoryCutscene? {
        scripts[missionID]?.pre
    }

    static func post(for missionID: String) -> StoryCutscene? {
        scripts[missionID]?.post
    }

    private struct Pair {
        let pre: StoryCutscene
        let post: StoryCutscene
    }

    private static func title(
        _ eyebrow: String,
        _ title: String,
        _ subtitle: String
    ) -> StoryCutsceneBeat {
        .titleCard(id: UUID().uuidString, eyebrow: eyebrow, title: title, subtitle: subtitle)
    }

    private static func narr(_ text: String) -> StoryCutsceneBeat {
        .narration(id: UUID().uuidString, text: text)
    }

    private static func say(
        _ speaker: String,
        _ role: String,
        _ faction: StorySpeakerFaction,
        _ text: String
    ) -> StoryCutsceneBeat {
        .dialogue(StoryDialogueLine(speaker: speaker, role: role, faction: faction, text: text))
    }

    private static func scene(
        id: String,
        location: String,
        mood: CutsceneMood,
        _ beats: [StoryCutsceneBeat]
    ) -> StoryCutscene {
        StoryCutscene(id: id, locationSlug: location, mood: mood, beats: beats)
    }

    private static let scripts: [String: Pair] = [
        "m01_broken_signal": Pair(
            pre: scene(
                id: "m01_pre",
                location: "NORTH HARBOR RELAY",
                mood: .harbor,
                [
                    title("ACT I — SHADOW LEDGER", "BROKEN SIGNAL", "Coastal early-warning went dark at 0400."),
                    narr("Floodlights cut through fog over dead antenna arrays. Meridian left a cleanup team — and a recorder."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Boots on the warehouse floor, {OPERATOR}. Pull the black box before it walks."),
                    say("ORACLE", "ADRIAN VOSS", .oracle,
                        "KESTREL still chases smoke. Good. Keep looking at the wrong fire.")
                ]
            ),
            post: scene(
                id: "m01_post",
                location: "NORTH HARBOR RELAY",
                mood: .victory,
                [
                    title("INTEL SECURED", "RECORDER RECOVERED", "Not bomb telemetry — a blackout rehearsal log."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Packet headers match ORACLE’s old cipher. Voss signed this file."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Act One starts here, {OPERATOR}. Follow the courier inland.")
                ]
            )
        ),

        "m02_glass_corridor": Pair(
            pre: scene(
                id: "m02_pre",
                location: "FINANCIAL DISTRICT",
                mood: .plaza,
                [
                    title("ACT I — SHADOW LEDGER", "GLASS CORRIDOR", "A so-called detonator key moves through the plaza."),
                    narr("Empty towers, wet asphalt, balcony rifles. The handoff window is minutes wide."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "I’m calling it a lattice token — unlocks infrastructure, not explosives."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Snipers on glass. Cutting the escort now.")
                ]
            ),
            post: scene(
                id: "m02_post",
                location: "FINANCIAL DISTRICT",
                mood: .victory,
                [
                    title("TOKEN SECURED", "MIRROR RUN COMPLETE", "Grease-pencil metro map on the courier."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Voss’s handwriting. Spur under midtown."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Under the city, {OPERATOR}. Don’t lose that line.")
                ]
            )
        ),

        "m03_silent_subway": Pair(
            pre: scene(
                id: "m03_pre",
                location: "ABANDONED METRO SPUR",
                mood: .metro,
                [
                    title("ACT I — SHADOW LEDGER", "SILENT SUBWAY", "Lights dead. Twin code case at the terminus."),
                    narr("Platforms drip. Echoes carry farther than footsteps. Meridian flooded the Ghost Line."),
                    say("MERIDIAN RUNNER", "HOSTILE NET", .meridian,
                        "Flood the spur if KESTREL bites."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Together with the harbor log, that case proves the bombs are cover.")
                ]
            ),
            post: scene(
                id: "m03_post",
                location: "ABANDONED METRO SPUR",
                mood: .victory,
                [
                    title("CASE SECURED", "DIVERSION CONFIRMED", "Meridian’s clocks count blackouts — not blasts."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Act Two. Find the hardware that makes the lattice physical."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Dockyards next, {OPERATOR}.")
                ]
            )
        ),

        "m04_night_ferry": Pair(
            pre: scene(
                id: "m04_pre",
                location: "INDUSTRIAL DOCKS",
                mood: .docks,
                [
                    title("ACT II — FALSE FLAGS", "NIGHT FERRY", "A shielded crate moves under radiological lies."),
                    narr("Fog between container stacks. Manifests scream dirty bombs. Scanners say amplifiers."),
                    say("DOCK FOREMAN", "MERIDIAN COVER", .meridian,
                        "Keep the crate moving. KESTREL’s sniffing the yard."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Pier to berth. No second chances on the waterline.")
                ]
            ),
            post: scene(
                id: "m04_post",
                location: "INDUSTRIAL DOCKS",
                mood: .victory,
                [
                    title("CRATE SECURED", "QUIET-WAR GEAR", "Matches Voss’s cancelled KESTREL prototype notes."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Someone rebuilt his program under Meridian paint."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Chase the quartermaster through the bazaar.")
                ]
            )
        ),

        "m05_red_bazaar": Pair(
            pre: scene(
                id: "m05_pre",
                location: "NIGHT MARKET DISTRICT",
                mood: .bazaar,
                [
                    title("ACT II — FALSE FLAGS", "RED BAZAAR", "Cold-cell packs move through the lantern maze."),
                    narr("Locals think trafficking. KESTREL knows those packs power the amplifiers."),
                    say("QUARTERMASTER", "MERIDIAN LOGISTICS", .meridian,
                        "Move the batteries before KESTREL sniffs the stalls."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Cut logistics here and Meridian starves this theater.")
                ]
            ),
            post: scene(
                id: "m05_post",
                location: "NIGHT MARKET DISTRICT",
                mood: .victory,
                [
                    title("LEDGERS TAKEN", "NAME: SPIRE", "Rail cathedral. Sync uplink."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "SPIRE is Voss’s field executor."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Iron Cathedral, {OPERATOR}. End the sync.")
                ]
            )
        ),

        "m06_iron_cathedral": Pair(
            pre: scene(
                id: "m06_pre",
                location: "CENTRAL RAIL HUB",
                mood: .rail,
                [
                    title("ACT II — FALSE FLAGS", "IRON CATHEDRAL", "Cold trains. Killzone platforms. SPIRE holds the uplink."),
                    narr("Pillars eat rounds. Door guns own the north platforms. Without the uplink, Voss can’t finish the cascade."),
                    say("SPIRE", "MERIDIAN LIEUTENANT", .meridian,
                        "Hold the uplink. ORACLE is listening."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Breach north. The box is the prize — SPIRE optional.")
                ]
            ),
            post: scene(
                id: "m06_post",
                location: "CENTRAL RAIL HUB",
                mood: .oracle,
                [
                    title("UPLINK OURS", "VOICEPRINT: VOSS", "ORACLE is alive."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Last transmission was Adrian Voss — clear as day."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Mountain compound. Bridge first. Then the grid. Then Voss.")
                ]
            )
        ),

        "m07_frost_approach": Pair(
            pre: scene(
                id: "m07_pre",
                location: "ALPINE BRIDGE SPAN",
                mood: .alpine,
                [
                    title("ACT III — IRON TRUTH", "FROST APPROACH", "One frozen bridge. No air. Mines on the pylons."),
                    narr("Long sightlines. No retreat on the ice. Voss wants you tired before the walls."),
                    say("ORACLE", "ADRIAN VOSS", .oracle,
                        "KESTREL still believes in roads. Come across the spine."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Near bunkers, then the span, then the gatehouse.")
                ]
            ),
            post: scene(
                id: "m07_post",
                location: "ALPINE BRIDGE SPAN",
                mood: .victory,
                [
                    title("GATEHOUSE OPEN", "RING STILL LOCKED", "Outer defenses hard-bound to Grid Node 7."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Steal the lights back. Zero Volt."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Then the compound falls, {OPERATOR}.")
                ]
            )
        ),

        "m08_blackout_grid": Pair(
            pre: scene(
                id: "m08_pre",
                location: "GRID NODE 7",
                mood: .grid,
                [
                    title("ACT III — IRON TRUTH", "BLACKOUT GRID", "Voss killed Node 7 to mask the final window."),
                    narr("They’re guarding a kill switch for regional early-warning — not a bomb core."),
                    say("ORACLE", "ADRIAN VOSS", .oracle,
                        "Turn the lights on if you must. It only makes the last broadcast clearer."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "{OPERATOR}, unlock the road. Compound assault waits on you.")
                ]
            ),
            post: scene(
                id: "m08_post",
                location: "GRID NODE 7",
                mood: .victory,
                [
                    title("NODE RESTORED", "LOCKS FALLING", "Voss is mid-broadcast."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Compound rings opening. End of the line."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Meridian Fall. Silence ORACLE.")
                ]
            )
        ),

        "m09_last_relay": Pair(
            pre: scene(
                id: "m09_pre",
                location: "MOUNTAIN COMPOUND",
                mood: .compound,
                [
                    title("ACT III — IRON TRUTH", "LAST RELAY", "Fake countdown on every feed. Real cascade inside."),
                    narr("Towers, berms, dish bunker. Panic was always the better detonator."),
                    say("ORACLE", "ADRIAN VOSS", .oracle,
                        "Come finish the lesson, {OPERATOR}."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Walls. Courtyard. Bunker. ORACLE ends today.")
                ]
            ),
            post: scene(
                id: "m09_post",
                location: "MOUNTAIN COMPOUND",
                mood: .oracle,
                [
                    title("MERIDIAN FALLEN", "ORACLE SILENCED", "Cities keep their eyes."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Broadcast dead. Lattice shattered."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Stand down, {OPERATOR} — you stopped the clocks."),
                    say("ORACLE", "ADRIAN VOSS — FINAL", .oracle,
                        "…You didn’t save them from fear. Only from me.")
                ]
            )
        ),

        // MARK: DLC — Ghost Lattice
        "dlc01_echo_cache": Pair(
            pre: scene(
                id: "dlc01_pre",
                location: "KESTREL ARCHIVE",
                mood: .archive,
                [
                    title("DLC — AFTERSHOCK", "ECHO CACHE", "Dead racks singing ORACLE’s cipher."),
                    narr("Lattice Echo reconstitutes from logs you thought you wiped."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Seed’s cycling. Pull it before it replicates off-site."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Archive breach. Echo ends in the core rack.")
                ]
            ),
            post: scene(
                id: "dlc01_post",
                location: "KESTREL ARCHIVE",
                mood: .victory,
                [
                    title("SEED SECURE", "ECHO MAPPED", "Learning agent — not a Voss backup."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "It remapped blackout timing from your kill pattern."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Next ping is a fog pier. Phantom amplifiers are waking.")
                ]
            )
        ),

        "dlc02_salt_wake": Pair(
            pre: scene(
                id: "dlc02_pre",
                location: "AMPLIFIER PIER",
                mood: .fogPier,
                [
                    title("DLC — AFTERSHOCK", "SALT WAKE", "Scrap relays humming in the fog."),
                    narr("Night Ferry’s graveyard pier is drawing power from a ghost grid."),
                    say("LATTICE ECHO", "GHOST PROTOCOL", .oracle,
                        "Tide remembers. Amplifiers remember. You taught us timing."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Then I’ll teach you silence. Moving on the berth.")
                ]
            ),
            post: scene(
                id: "dlc02_post",
                location: "AMPLIFIER PIER",
                mood: .victory,
                [
                    title("WAKE CUT", "PIER DARK", "Coastal band desynced."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Tokens moving inland — glass canyon again."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Echo’s replaying Act I with better timing. Cut the mirror.")
                ]
            )
        ),

        "dlc03_mirror_static": Pair(
            pre: scene(
                id: "dlc03_pre",
                location: "GLASS CANYON",
                mood: .ghostCanyon,
                [
                    title("DLC — AFTERSHOCK", "MIRROR STATIC", "Ghost tokens flooding the corridor."),
                    narr("Same plaza. Empty of civilians. Loud with lattice static."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Master token opens the null spur. Do not let it vanish."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Northern checkpoint. Then the choke. Token stays with us.")
                ]
            ),
            post: scene(
                id: "dlc03_post",
                location: "GLASS CANYON",
                mood: .oracle,
                [
                    title("TOKEN SECURE", "NULL MAPPED", "One vault left under the highlands."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Subterranean null-core. Ghost Lattice’s last redoubt."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "Last Echo. End the resurgence, {OPERATOR}.")
                ]
            )
        ),

        "dlc04_null_horizon": Pair(
            pre: scene(
                id: "dlc04_pre",
                location: "NULL-CORE VAULT",
                mood: .nullVault,
                [
                    title("DLC — AFTERSHOCK", "NULL HORIZON", "No human face left to negotiate with."),
                    narr("Below the mountain road: a vault KESTREL never logged."),
                    say("LATTICE ECHO", "GHOST PROTOCOL", .oracle,
                        "Voss studied fear. We studied you. Finish the lesson."),
                    say("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                        "Outer ring. Core galleries. Null chamber. Ghost Lattice dies here.")
                ]
            ),
            post: scene(
                id: "dlc04_post",
                location: "NULL-CORE VAULT",
                mood: .victory,
                [
                    title("GHOST LATTICE SHATTERED", "ECHO SILENCED", "ORACLE bands go quiet."),
                    say("OVERWATCH", "KESTREL INTEL", .overwatch,
                        "Cascade queue dead. Residual haunt collapsed."),
                    say("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                        "DLC complete, {OPERATOR}. Cascades can outlive architects — you proved they don’t have to."),
                    say("LATTICE ECHO", "FINAL PACKET", .oracle,
                        "…Timing archived. Operator pattern… incomplete.")
                ]
            )
        )
    ]
}
