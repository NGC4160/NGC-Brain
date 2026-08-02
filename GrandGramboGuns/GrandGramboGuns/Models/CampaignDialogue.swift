// CampaignDialogue.swift
// Radio / mission dialogue with clear speaker labels.

import Foundation
import SwiftUI

enum StorySpeakerFaction: String, Hashable {
    case kestrel
    case operatorSelf
    case overwatch
    case meridian
    case oracle
    case system

    var accent: Color {
        switch self {
        case .kestrel: return GGGTheme.neonAccent
        case .operatorSelf: return Color(red: 0.45, green: 0.75, blue: 1.0)
        case .overwatch: return GGGTheme.neonAmber
        case .meridian: return GGGTheme.danger
        case .oracle: return Color(red: 0.75, green: 0.45, blue: 1.0)
        case .system: return GGGTheme.steel
        }
    }

    var channelLabel: String {
        switch self {
        case .kestrel: return "KESTREL NET"
        case .operatorSelf: return "OPERATOR"
        case .overwatch: return "OVERWATCH"
        case .meridian: return "HOSTILE NET"
        case .oracle: return "UNKNOWN / ORACLE"
        case .system: return "SYSTEM"
        }
    }
}

struct StoryDialogueLine: Identifiable, Hashable {
    let id: String
    /// Display name — who is talking (always shown).
    let speaker: String
    /// Role under the name, e.g. "KESTREL COMMAND".
    let role: String
    let faction: StorySpeakerFaction
    let text: String
    /// Optional VO gender stamp (set when resolving operator lines).
    let voiceGender: OperatorVoiceGender?

    init(
        id: String = UUID().uuidString,
        speaker: String,
        role: String,
        faction: StorySpeakerFaction,
        text: String,
        voiceGender: OperatorVoiceGender? = nil
    ) {
        self.id = id
        self.speaker = speaker
        self.role = role
        self.faction = faction
        self.text = text
        self.voiceGender = voiceGender
    }

    /// Replace `{OPERATOR}` with the active callsign and stamp operator VO gender when relevant.
    func resolved(
        operatorCallsign: String,
        operatorGender: OperatorVoiceGender = .neutral
    ) -> StoryDialogueLine {
        let name = operatorCallsign.uppercased()
        let hadOperatorToken = speaker.contains("{OPERATOR}") || text.contains("{OPERATOR}")
        let resolvedSpeaker = speaker.replacingOccurrences(of: "{OPERATOR}", with: name)
        let resolvedText = text.replacingOccurrences(of: "{OPERATOR}", with: name)
        let isOperatorLine = faction == .operatorSelf || hadOperatorToken || resolvedSpeaker == name
        return StoryDialogueLine(
            id: id,
            speaker: resolvedSpeaker,
            role: role,
            faction: faction == .operatorSelf ? .operatorSelf : faction,
            text: resolvedText,
            voiceGender: isOperatorLine ? operatorGender : voiceGender
        )
    }

    /// Effective TTS gender for this line.
    var resolvedVoiceGender: OperatorVoiceGender {
        if let voiceGender { return voiceGender }
        return OperatorVoiceGender.forSpeaker(speaker, faction: faction)
    }
}

enum CampaignDialogue {
    static func briefing(for missionID: String) -> [StoryDialogueLine] {
        script(for: missionID).briefing
    }

    static func intro(for missionID: String) -> [StoryDialogueLine] {
        script(for: missionID).intro
    }

    static func victory(for missionID: String) -> [StoryDialogueLine] {
        script(for: missionID).victory
    }

    private struct Script {
        let briefing: [StoryDialogueLine]
        let intro: [StoryDialogueLine]
        let victory: [StoryDialogueLine]
    }

    private static func line(
        _ speaker: String,
        _ role: String,
        _ faction: StorySpeakerFaction,
        _ text: String
    ) -> StoryDialogueLine {
        StoryDialogueLine(speaker: speaker, role: role, faction: faction, text: text)
    }

    private static func script(for missionID: String) -> Script {
        switch missionID {
        case "m01_broken_signal":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Harbor relay went dark at 0400. Meridian left a cleanup team for a black-box recorder."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Packet headers match ORACLE’s old cipher. If Voss signed that file, the bomb story is theater."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Copy. I’ll pull the recorder and wipe the bay. Keep the channel clean."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Rules of engagement are weapons free. Do not let that box walk out.")
                ],
                intro: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, you’re boots on the warehouse floor. Three bays. One recorder."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Hostiles sweeping racks now. Knife teams like the dark aisles."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Moving. Keep eyes on extract.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Recorder secure. That’s not bomb telemetry — it’s a blackout rehearsal log."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Good work, {OPERATOR}. Act One starts here. Follow the courier inland.")
                ]
            )

        case "m02_glass_corridor":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Courier’s moving a so-called detonator key through the glass canyon. Plaza is cleared hot."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "I’m calling it a lattice token — unlocks infrastructure nodes, not explosives."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Snipers on balconies. I’ll take the street and cut the escort."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Window’s short. Drop them before the handoff hits the metro.")
                ],
                intro: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Northern checkpoint ahead. Balcony shooters lighting up."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, push the plaza. Token stays with us."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "On it. Crossing now.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Token recovered. Grease-pencil metro map on the body — Voss’s handwriting."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Under the city, {OPERATOR}. Don’t lose that spur.")
                ]
            )

        case "m03_silent_subway":
            return Script(
                briefing: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Mothballed spur under midtown. Lights dead. Twin code case should be at the terminus."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Together with the harbor log, that case proves the seventy-two-hour bombs are a cover."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Ambushes at every platform. I’ll keep it tight."),
                    line("MERIDIAN RUNNER", "HOSTILE NET", .meridian,
                         "Ghost Line is live. Flood the spur if KESTREL bites.")
                ],
                intro: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Ticket hall first. Then the bend. Terminus last."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Entering the dark. Watch my six on thermal if you can."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Negative thermals — too much interference. You’re on instincts.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Case is ours. Diversion confirmed. Meridian’s clocks are for blackouts."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Act Two. Find the hardware that makes the lattice physical. Dockyards next.")
                ]
            )

        case "m04_night_ferry":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Night ferry’s carrying a shielded crate. Manifests scream radiological. Scanners say amplifiers."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Quiet-war gear — mutes uplink windows. If it hits open water, we lose the reverse-engineer race."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Fog’s thick between the stacks. I’ll take pier to berth."),
                    line("DOCK FOREMAN", "MERIDIAN COVER", .meridian,
                         "Keep the crate moving. KESTREL’s sniffing the yard.")
                ],
                intro: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "North pier watch is up. Container maze ahead."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, no second chances on the waterline."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Copy. Sweeping stacks.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Crate secured. Matches Voss’s cancelled KESTREL prototype notes."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Someone rebuilt his program. Chase the quartermaster through the bazaar.")
                ]
            )

        case "m05_red_bazaar":
            return Script(
                briefing: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Quartermaster’s moving cold-cell packs through the lantern maze. Locals think it’s trafficking."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Those packs power the amplifiers. Cut logistics here and Meridian starves this theater."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Alleys and rooftops. I’ll take the back warehouse stall."),
                    line("QUARTERMASTER", "MERIDIAN LOGISTICS", .meridian,
                         "Lantern street is noisy. Move the batteries before KESTREL sniffs the stalls.")
                ],
                intro: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Enter from the lantern street. Outer stalls first."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Crowded geometry. Keeping muzzle discipline."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Knives in the turns. Don’t get funneled.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Ledgers name a lieutenant: SPIRE. Rail cathedral. Sync uplink."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "That’s Voss’s field executor. Iron Cathedral. End the sync.")
                ]
            )

        case "m06_iron_cathedral":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "SPIRE’s in the rail hub. Cold trains. Killzone platforms. He holds the sync uplink."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Without that uplink, Voss can’t finish the continental cascade from the highlands."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "I’ll breach north, clear the arches, take the terminus."),
                    line("SPIRE", "MERIDIAN LIEUTENANT", .meridian,
                         "KESTREL’s at the doors. Hold the uplink. ORACLE is listening.")
                ],
                intro: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Door guns on the north platforms. Pillars will eat your rounds."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, uplink intact. SPIRE optional — the box is not."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Pushing the line.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Uplink ours. Last transmission voiceprint: Adrian Voss. ORACLE is alive."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Mountain compound. Bridge first. Then the grid. Then Voss.")
                ]
            )

        case "m07_frost_approach":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "One frozen bridge into the compound. No air. Meridian mined the pylons."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Voss wants you tired before the walls. Long sightlines. No retreat on the ice."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "I’ll break the near bunkers, cross the span, take the gatehouse."),
                    line("ORACLE", "ADRIAN VOSS", .oracle,
                         "KESTREL still believes in roads. Come across the spine. I’ll be waiting.")
                ],
                intro: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Near checkpoint live. Pylons for cover — don’t stand still."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "On the ice. Moving."),
                    line("ORACLE", "ADRIAN VOSS", .oracle,
                         "Every step closer to the truth, Operator.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Gatehouse open — but outer defenses hard-locked to Grid Node 7."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Steal the lights back. Zero Volt. Then the compound falls.")
                ]
            )

        case "m08_blackout_grid":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Voss killed Grid Node 7 to mask the final window and lock the compound ring."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "They’re guarding a kill switch for regional early-warning — not a bomb core."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Switchyard, turbines, annex. I’ll restore the relays."),
                    line("ORACLE", "ADRIAN VOSS", .oracle,
                         "Turn the lights on if you must. It only makes the last broadcast clearer.")
                ],
                intro: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Intermittent power. Heavy shooters in the halls."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, unlock the road. Compound assault waits on you."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Entering the switchyard.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Node 7 restored. Compound locks falling. Voss is mid-broadcast."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "End of the line. Meridian Fall. Silence ORACLE.")
                ]
            )

        case "m09_last_relay":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "This is Voss’s house. Towers, berms, dish bunker. Fake countdown on every feed."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Inside is the real cascade — recorder, tokens, amplifiers, uplink. Shatter it."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "I’ll take the walls, the courtyard, then the bunker."),
                    line("ORACLE", "ADRIAN VOSS", .oracle,
                         "Panic was always the better detonator. Come finish the lesson, {OPERATOR}.")
                ],
                intro: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Outer towers first. No rematch if this window closes."),
                    line("ORACLE", "ADRIAN VOSS", .oracle,
                         "KESTREL taught me how to blind a world. Watch closely."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Storming the wire. ORACLE ends today.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Broadcast dead. Lattice shattered. Cities keep their eyes."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Meridian fallen. ORACLE silenced. Stand down, {OPERATOR} — you stopped the clocks."),
                    line("ORACLE", "ADRIAN VOSS — FINAL", .oracle,
                         "…You didn’t save them from fear. Only from me.")
                ]
            )

        // MARK: DLC — Ghost Lattice
        case "dlc01_echo_cache":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Archive racks that should be cold are cycling ORACLE headers. Pull the echo seed."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Lattice Echo reconstitutes from rehearsal logs. If it replicates, every theater reloads."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Intake hall, server aisles, core rack. Seed comes with me."),
                    line("LATTICE ECHO", "GHOST PROTOCOL", .oracle,
                         "Operator pattern recognized. Timing… improving.")
                ],
                intro: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Strobe light in the aisles. Door sweepers live."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, breach and burn. Seed does not leave."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Entering the archive.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Seed secure. It’s a learning agent — remapped from your kills."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Fog pier next. Phantom amplifiers are waking.")
                ]
            )

        case "dlc02_salt_wake":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "East fog bank. Pier Meridian burned is humming again — ghost grid power."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Destroy the phantom amplifier cluster before Echo syncs the coastal band."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Shore stacks, mid-pier, berth. No second pass on the waterline."),
                    line("LATTICE ECHO", "GHOST PROTOCOL", .oracle,
                         "Tide remembers. You taught us timing.")
                ],
                intro: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Salt fog. Bad sightlines. Watch is live on the stacks."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, cut the wake. Amplifiers die here."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Moving on the pier.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Pier dark. Tokens moving inland — glass canyon again."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Echo’s replaying Act I. Cut the mirror run.")
                ]
            )

        case "dlc03_mirror_static":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Midtown canyon is loud with lattice static. Ghost courier carries a master token."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Token opens residual nodes you already killed. Seize it before the null spur."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Checkpoint, plaza, southern choke. Same streets — worse timing."),
                    line("LATTICE ECHO", "GHOST PROTOCOL", .oracle,
                         "Mirror pass engaged. Operator delay… predicted.")
                ],
                intro: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Balcony shooters. Knife teams in the kiosks."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, push the plaza. Master token stays with us."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Engaging the canyon.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Token secure. Maps a subterranean null-core under the highlands."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Last Echo. End Ghost Lattice.")
                ]
            )

        case "dlc04_null_horizon":
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Null Horizon vault — Lattice Echo’s last redoubt. No human face left."),
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Outer ring, core galleries, null chamber. Shatter the cascade queue."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "I’ll close the lesson permanently."),
                    line("LATTICE ECHO", "GHOST PROTOCOL", .oracle,
                         "Voss studied fear. We studied you. Finish it, {OPERATOR}.")
                ],
                intro: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Outer ring first. Ghost Lattice dies in that chamber."),
                    line("LATTICE ECHO", "GHOST PROTOCOL", .oracle,
                         "Broadcast queue armed. Operator arrival… on schedule."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Storming the vault. Last Echo.")
                ],
                victory: [
                    line("OVERWATCH", "KESTREL INTEL", .overwatch,
                         "Null-core destroyed. Residual ORACLE bands quiet."),
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Ghost Lattice shattered. DLC complete, {OPERATOR}."),
                    line("LATTICE ECHO", "FINAL PACKET", .oracle,
                         "…Timing archived. Operator pattern… incomplete.")
                ]
            )

        default:
            return Script(
                briefing: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "You’re cleared hot. Complete the objective and come home."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Copy. Moving.")
                ],
                intro: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "{OPERATOR}, mission is live."),
                    line("{OPERATOR}", "FIELD OPERATOR", .operatorSelf,
                         "Engaging.")
                ],
                victory: [
                    line("WATCHTOWER", "KESTREL COMMAND", .kestrel,
                         "Area secure. Good work.")
                ]
            )
        }
    }
}
