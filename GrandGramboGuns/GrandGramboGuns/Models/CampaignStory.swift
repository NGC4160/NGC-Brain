// CampaignStory.swift
// Original campaign — thriller tempo (global chase), not COD IP.

import Foundation

struct CampaignMission: Identifiable, Hashable {
    let id: String
    let act: Int
    let number: Int
    let title: String
    let codename: String
    let location: String
    /// One-line hook shown on the mission list.
    let situation: String
    let briefing: String
    /// Revelation / stakes unlocked by this strike.
    let intel: String
    let objective: String
    let enemyCount: Int
    let ammoPickups: Int
    let medkitPickups: Int
    let mapStyle: MissionMapStyle
    /// Suggested body type for flavor (player still uses equipped gun).
    let suggestedBody: GunBodyType
}

enum MissionMapStyle: String, Codable {
    case warehouse
    case streets
    case metro
    case docks
    case bazaar
    case station
    case alpine
    case reactor
    case compound
    // DLC — Ghost Lattice map themes
    case archive
    case fogPier
    case ghostCanyon
    case nullVault
}

enum StoryDifficulty: String, CaseIterable, Identifiable, Codable {
    case easy
    case medium
    case hard

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .easy: return "Easy"
        case .medium: return "Medium"
        case .hard: return "Hard"
        }
    }

    /// Base chance each enemy rifle shot hits when the player is moving normally.
    /// Still / strafe modifiers live in `EnemyCombatAI` (capped per difficulty).
    var enemyHitChance: Float {
        switch self {
        case .easy: return 1.0 / 20.0
        case .medium: return 20.0 / 100.0
        case .hard: return 45.0 / 100.0
        }
    }

    var blurb: String {
        switch self {
        case .easy: return "Hostiles land about 1 in 20 shots — slower bursts, light cover use."
        case .medium: return "Hostiles land about 20 in 100 shots — flanking, bursts, cover."
        case .hard: return "Hostiles land about 45 in 100 shots — aggressive flanking and cover."
        }
    }
}

enum CampaignStory {
    static let campaignTitle = "OPERATION IRON MERIDIAN"
    static let campaignTagline = "The bombs are a lie. The blackout is real."

    static let prologue = """
    At 0400, coastal early-warning relays go dark. Newsfeeds scream \
    dirty bombs — three continents, seventy-two hours. Governments \
    scramble. Markets panic. Meridian claims credit.

    Task Force KESTREL knows better than to trust a press release. \
    Buried in the first outage is a signature only one person ever used \
    in training sims: former KESTREL architect ADRIAN VOSS — callsign \
    ORACLE — declared KIA two years ago after a failed deep-cover run.

    If Voss is alive, Meridian isn’t a terror cell. It’s a machine he \
    designed: a cascade that can mute global early-warning, GPS overlays, \
    and civilian comms in a single synchronized command.

    Your orders: chase the “detonator codes,” cut Meridian’s chain, and \
    find out what the clocks are really counting down to — before Voss \
    turns the world’s eyes off for good.
    """

    static func actTitle(_ act: Int) -> String {
        switch act {
        case 1: return "ACT I — SHADOW LEDGER"
        case 2: return "ACT II — FALSE FLAGS"
        case 3: return "ACT III — IRON TRUTH"
        default: return "ACT \(act)"
        }
    }

    static func actSynopsis(_ act: Int) -> String {
        switch act {
        case 1:
            return "Follow the first outage inland. Prove the bombs are theater — and that someone inside KESTREL’s past built the stage."
        case 2:
            return "Meridian moves hardware under cover of panic. Steal their components and map the lattice before the next blackout window."
        case 3:
            return "The mountain road opens. Voss is broadcasting. End the cascade — or the world goes blind on schedule."
        default:
            return ""
        }
    }

    static let missions: [CampaignMission] = [
        // MARK: Act 1 — Shadow Ledger
        CampaignMission(
            id: "m01_broken_signal",
            act: 1,
            number: 1,
            title: "Broken Signal",
            codename: "KESTREL DAWN",
            location: "North Harbor Relay — Atlantic Coast",
            situation: "First outage. A black-box recorder that shouldn’t exist.",
            briefing: """
            Meridian hit the harbor relay at 0400 and left a cleanup team \
            sweeping warehouse bays for a black-box recorder. Officially \
            it’s “launch telemetry” for a dirty device. Unofficially, \
            KESTREL’s analysts say the packet headers match ORACLE’s old \
            encryption — the one Voss swore he’d burned.

            Beat 1 — Breach the outer racks. Silence the door team before \
            they torch the drives. \
            Beat 2 — Push the center aisle. Knife fighters like the dark. \
            Beat 3 — Clear the far bay and pull the recorder intact.

            If that box walks out, Meridian keeps the narrative — and we \
            keep chasing ghosts.
            """,
            intel: """
            The recorder isn’t bomb telemetry. It’s a rehearsal log: \
            timed blackouts across three relay families. Someone practiced \
            turning cities blind — and signed the file with ORACLE’s cipher.
            """,
            objective: "Recover the black-box recorder and wipe Meridian’s cleanup team",
            enemyCount: 10,
            ammoPickups: 8,
            medkitPickups: 4,
            mapStyle: .warehouse,
            suggestedBody: .smg
        ),
        CampaignMission(
            id: "m02_glass_corridor",
            act: 1,
            number: 2,
            title: "Glass Corridor",
            codename: "MIRROR RUN",
            location: "Financial District — Midtown",
            situation: "A courier carrying a ‘detonator key’ through a glass canyon.",
            briefing: """
            The harbor drive names a courier moving through midtown’s glass \
            canyon — public panic as cover. Snipers on balconies. Kiosks and \
            plaza concrete for hard cover. Civilians are already evacuated; \
            you’re cleared hot.

            Intel says the courier carries a “primary detonator key.” \
            KESTREL’s new theory: it’s a lattice token — a handoff key that \
            arms infrastructure nodes, not explosives.

            Beat 1 — Break the northern checkpoint. \
            Beat 2 — Cross the plaza under balcony fire. \
            Beat 3 — Cut the southern choke and drop the escort before \
            the handoff vanishes into the metro.
            """,
            intel: """
            The courier’s key isn’t explosive. It’s a signed token that \
            unlocks Meridian’s next node. On the body: a metro map with \
            one spur circled in grease pencil — and Voss’s handwriting.
            """,
            objective: "Intercept the courier’s escort and seize the lattice token",
            enemyCount: 12,
            ammoPickups: 8,
            medkitPickups: 4,
            mapStyle: .streets,
            suggestedBody: .rifle
        ),
        CampaignMission(
            id: "m03_silent_subway",
            act: 1,
            number: 3,
            title: "Silent Subway",
            codename: "GHOST LINE",
            location: "Abandoned Metro Spur — Under Midtown",
            situation: "A mothballed spur. Ambush dark. A secondary code case.",
            briefing: """
            The courier’s map leads under the city — a mothballed metro \
            spur KESTREL sealed years ago after a training accident. Lights \
            dead. Platforms echo. Meridian flooded the tunnels with ambush \
            teams the moment the glass canyon went loud.

            Inside the terminus should be a secondary code case — the twin \
            to the harbor log. Together they prove the “72-hour bombs” are \
            a cover story sold to every news desk on the planet.

            Beat 1 — Clear the ticket hall and entry platform. \
            Beat 2 — Survive the curved tunnel bend — CQB, no sightlines. \
            Beat 3 — Take the terminus and extract the case before Meridian \
            floods the spur for real.
            """,
            intel: """
            Act I closes: the twin case confirms a diversion. Meridian’s \
            clocks aren’t for detonations — they’re for synchronized \
            blackouts. Next: find who’s shipping the hardware that makes \
            the lattice physical.
            """,
            objective: "Fight through the spur and seize the secondary code case",
            enemyCount: 11,
            ammoPickups: 8,
            medkitPickups: 4,
            mapStyle: .metro,
            suggestedBody: .shotgun
        ),

        // MARK: Act 2 — False Flags
        CampaignMission(
            id: "m04_night_ferry",
            act: 2,
            number: 4,
            title: "Night Ferry",
            codename: "BLACK TIDE",
            location: "Industrial Docks — East River",
            situation: "A fog-bound ferry. A crate that must never leave the pier.",
            briefing: """
            Meridian labels the cargo “device components.” Manifests say \
            radiological. Dock scanners say shielded relays and phased \
            amplifiers — the kind that mute satellite uplink windows, \
            not cities.

            Fog between containers. Flicker lights. If that crate hits \
            open water, Meridian’s next blackout window gets a hardware \
            upgrade we can’t reverse-engineer in time.

            Beat 1 — Sweep the north pier stacks. Silence the watch. \
            Beat 2 — Cross mid-yard under container cover — expect knives. \
            Beat 3 — Storm the ferry berth. Stop the crate. No second \
            chances on the waterline.
            """,
            intel: """
            The crate’s contents match Voss’s old KESTREL prototype notes: \
            “quiet war” amplifiers. Someone is rebuilding his cancelled \
            program under Meridian’s flag — and funding it with bomb panic.
            """,
            objective: "Clear pier-to-berth and seize Meridian’s amplifier crate",
            enemyCount: 12,
            ammoPickups: 9,
            medkitPickups: 5,
            mapStyle: .docks,
            suggestedBody: .shotgun
        ),
        CampaignMission(
            id: "m05_red_bazaar",
            act: 2,
            number: 5,
            title: "Red Bazaar",
            codename: "LANTERN CUT",
            location: "Night Market District — Southern Port City",
            situation: "A quartermaster in a lantern maze. Detonator batteries — or worse.",
            briefing: """
            A Meridian quartermaster moves “detonator batteries” through a \
            packed night bazaar — stalls, alleys, rooftop runners. Local \
            police think they’re chasing traffickers. They’re wrong.

            Those packs are cold-cell power for the amplifiers: silent, \
            long-burn, and hard to track once they leave the lantern street. \
            Take the quartermaster’s warehouse stall and you cut Meridian’s \
            logistics spine in this theater.

            Beat 1 — Enter from the lantern street; clear outer stalls. \
            Beat 2 — Push the maze alleys — SMGs and knives in the turns. \
            Beat 3 — Hit the back warehouse stall and seize the crates \
            before they vanish into shipping lanes.
            """,
            intel: """
            Captured ledgers name a European lieutenant: “SPIRE.” He’s \
            staging an uplink in a shuttered rail cathedral — the node \
            that syncs Voss’s blackout lattice across continents.
            """,
            objective: "Clear the bazaar maze and seize Meridian’s power crates",
            enemyCount: 13,
            ammoPickups: 9,
            medkitPickups: 5,
            mapStyle: .bazaar,
            suggestedBody: .smg
        ),
        CampaignMission(
            id: "m06_iron_cathedral",
            act: 2,
            number: 6,
            title: "Iron Cathedral",
            codename: "ECHO SPIRE",
            location: "Central Rail Hub — Northern Europe",
            situation: "Lieutenant SPIRE. A cold rail cathedral. The sync uplink.",
            briefing: """
            SPIRE is Meridian’s European face — and, according to the \
            bazaar ledgers, Voss’s field executor. He’s staging in a \
            shuttered rail hub: cold trains, killzone platforms, iron \
            arches that eat radio.

            The uplink he guards doesn’t arm bombs. It syncs the three \
            continental blackout clusters into one command. Kill the escort. \
            Take the uplink. Without it, Voss can’t finish the cascade \
            from the highland compound.

            Beat 1 — Breach the north platforms; cut the door guns. \
            Beat 2 — Cross under the arches; clear both rail lines. \
            Beat 3 — Drop SPIRE’s escort at the south terminus and \
            extract the uplink intact.
            """,
            intel: """
            SPIRE’s last transmission to Meridian high command is a \
            voiceprint match: Adrian Voss. ORACLE isn’t a rumor. He’s \
            alive — and calling the clocks from a mountain compound \
            above the border highlands.
            """,
            objective: "Neutralize SPIRE’s hub and recover the sync uplink",
            enemyCount: 14,
            ammoPickups: 9,
            medkitPickups: 5,
            mapStyle: .station,
            suggestedBody: .rifle
        ),

        // MARK: Act 3 — Iron Truth
        CampaignMission(
            id: "m07_frost_approach",
            act: 3,
            number: 7,
            title: "Frost Approach",
            codename: "WHITE SPINE",
            location: "Alpine Bridge Span — Border Highlands",
            situation: "One frozen bridge. No retreat once you’re on the ice.",
            briefing: """
            The compound’s only road in is a bridge span over a gorge — \
            ice, wind, long sightlines. Meridian mined the pylons and \
            stacked bunkers on both ends. Voss knows KESTREL is coming; \
            he wants you tired before the walls.

            Command won’t authorize air. You take the span on foot, or \
            the final assault never starts.

            Beat 1 — Break the near checkpoint bunkers. \
            Beat 2 — Cross the open span — pylons for cover, no mistakes. \
            Beat 3 — Clear the far gatehouse and open the mountain road.
            """,
            intel: """
            Gatehouse servers show the compound’s outer defenses are \
            hard-locked to Grid Node 7. Until that power complex falls, \
            the walls won’t open — even if you’re standing at the gate.
            """,
            objective: "Seize the alpine bridge and open the compound approach",
            enemyCount: 13,
            ammoPickups: 9,
            medkitPickups: 5,
            mapStyle: .alpine,
            suggestedBody: .sniper
        ),
        CampaignMission(
            id: "m08_blackout_grid",
            act: 3,
            number: 8,
            title: "Blackout Grid",
            codename: "ZERO VOLT",
            location: "Border Power Complex — Grid Node 7",
            situation: "Voss cut the highland grid. Steal the lights back.",
            briefing: """
            Meridian killed Grid Node 7 to mask the final arming window — \
            and to keep the compound’s outer ring in lockdown. The yards \
            are dark, loud with transformers, crawling with heavy shooters \
            who think they’re guarding a “device core.”

            They’re guarding a kill switch for the region’s early-warning \
            net. Restore local relays, clear the annex, and unlock the \
            road into Voss’s fortress.

            Beat 1 — Clear the switchyard; restore lighting relays. \
            Beat 2 — Push turbine halls under intermittent power. \
            Beat 3 — Secure the control annex and wipe Meridian’s grid team.
            """,
            intel: """
            With Node 7 restored, compound locks fall. Final intercept: \
            Voss is mid-broadcast from the relay bunker, selling the world \
            a bomb countdown while he queues the real cascade. End him \
            before the clocks hit the sync mark.
            """,
            objective: "Retake Grid Node 7 and unlock the final assault",
            enemyCount: 14,
            ammoPickups: 10,
            medkitPickups: 5,
            mapStyle: .reactor,
            suggestedBody: .machineGun
        ),
        CampaignMission(
            id: "m09_last_relay",
            act: 3,
            number: 9,
            title: "Last Relay",
            codename: "MERIDIAN FALL",
            location: "Mountain Compound — Border Highlands",
            situation: "ORACLE’s bunker. End the broadcast — or the world goes blind.",
            briefing: """
            This is Voss’s house. Towers, berms, overlapping guns, and a \
            dish bunker screaming a fake countdown to every feed on Earth.

            Inside, the real command is queued: a synchronized blackout \
            lattice built from everything you chased — recorder, tokens, \
            amplifiers, batteries, uplink. Kill the broadcast. Shatter \
            the lattice. Leave Meridian without a voice or a switch.

            Beat 1 — Storm the outer towers; silence the wall guns. \
            Beat 2 — Push the courtyard under overlapping fire. \
            Beat 3 — Breach the relay bunker. End ORACLE’s cascade.

            KESTREL doesn’t get a rematch if this window closes.
            """,
            intel: """
            Ending Meridian doesn’t erase what Voss proved: early-warning \
            can be turned into a weapon. KESTREL stands down — but the \
            doctrine changes forever. You stopped the clocks. The next \
            ORACLE will study how.
            """,
            objective: "Destroy the relay bunker and end Meridian’s cascade",
            enemyCount: 16,
            ammoPickups: 10,
            medkitPickups: 6,
            mapStyle: .compound,
            suggestedBody: .machineGun
        )
    ]

    static func mission(id: String) -> CampaignMission? {
        missions.first { $0.id == id } ?? DLCStory.mission(id: id)
    }

    /// End-card blurb. DLC missions route to `DLCStory`; main campaign keeps full epilogue text.
    static func endCardText(for missionID: String, victory: Bool) -> String {
        if DLCStory.isDLCMissionID(missionID) {
            return DLCStory.endCardText(for: missionID, victory: victory)
        }
        return epilogue(victory: victory)
    }

    static func epilogue(victory: Bool) -> String {
        if victory {
            return """
            MERIDIAN FALLEN. ORACLE SILENCED.

            The bomb countdown dies mid-sentence. The real cascade never \
            fires. Relays stay lit. Cities keep their eyes.

            Voss built Meridian to prove a point — that panic is a better \
            detonator than uranium. You cut his lattice across nine \
            theaters and made the clocks meaningless.

            KESTREL stands down. The world doesn’t know how close it came \
            to going blind. That’s the job.

            Campaign complete, Operator. Stay sharp for the next call-up —
            residual ORACLE bands may yet wake. When they do, Ghost Lattice awaits.
            """
        } else {
            return """
            MISSION FAILED.

            Meridian holds the window. Voss keeps broadcasting. The \
            lattice stays intact — and the clocks keep counting toward \
            a blackout the world will blame on bombs.

            Regroup. Reload. Find the thread again before ORACLE finishes \
            what he started.
            """
        }
    }
}
