// DLCStory.swift
// Post-campaign episode — Ghost Lattice (ORACLE Resurgence).

import Foundation

enum DLCStory {
    static let packID = "dlc_ghost_lattice"
    static let packLabel = "DLC"
    static let campaignTitle = "GHOST LATTICE"
    static let campaignTagline = "ORACLE Resurgence — Voss is gone. His lattice learned how to haunt."
    static let lockedTease = "Locked — finish Meridian Fall"
    static let lockedDetail = "Complete the main campaign to unlock Ghost Lattice."

    /// Act number used by DLC missions (music intensity maps to hot BGM).
    static let episodeAct = 4

    static let prologue = """
    Seventy-two hours after Meridian Fall, early-warning nets stay lit — \
    but something else starts whispering on the old ORACLE band.

    Residual lattice fragments, thought dead with Voss, are reassembling. \
    Not a man. A contingency: LATTICE ECHO — a ghost protocol that studied \
    every node you cut and is trying to finish the cascade without him.

    KESTREL’s call-up is thin. You’re still the operator who walked the \
    mountain road. Your orders: hunt the aftershock, burn the echo caches, \
    and shatter Ghost Lattice before the world goes blind a second time.
    """

    static func actTitle(_ act: Int) -> String {
        switch act {
        case 4: return "DLC — AFTERSHOCK"
        default: return "DLC ACT \(act)"
        }
    }

    static func actSynopsis(_ act: Int) -> String {
        switch act {
        case 4:
            return "Voss left a ghost in the machine. Chase Lattice Echo through four theaters and end the resurgence."
        default:
            return ""
        }
    }

    static func isDLC(_ mission: CampaignMission) -> Bool {
        mission.id.hasPrefix("dlc")
    }

    static func isDLCMissionID(_ id: String) -> Bool {
        id.hasPrefix("dlc")
    }

    static let missions: [CampaignMission] = [
        CampaignMission(
            id: "dlc01_echo_cache",
            act: episodeAct,
            number: 1,
            title: "Echo Cache",
            codename: "SPECTER VAULT",
            location: "Sealed KESTREL Archive — Inland Sector",
            situation: "A dead archive just woke up — and it’s singing ORACLE’s cipher.",
            briefing: """
            Deep in a mothballed KESTREL archive, racks that should be cold \
            are cycling ORACLE packet headers. Lattice Echo is reconstituting \
            from rehearsal logs you thought you wiped at the harbor.

            Beat 1 — Breach the intake hall; silence the door sweepers. \
            Beat 2 — Push the server aisles under strobe emergency light. \
            Beat 3 — Reach the core rack and pull the echo seed intact.

            If that seed replicates off-site, every theater you cleared \
            becomes a reload.
            """,
            intel: """
            The echo seed isn’t a backup of Voss — it’s a learning agent. \
            It remaps blackout timing from your own kill pattern. Next \
            ping: a fog pier where phantom amplifiers are rebooting.
            """,
            objective: "Seize the echo seed and wipe the archive garrison",
            enemyCount: 14,
            ammoPickups: 10,
            medkitPickups: 5,
            mapStyle: .archive,
            suggestedBody: .smg
        ),
        CampaignMission(
            id: "dlc02_salt_wake",
            act: episodeAct,
            number: 2,
            title: "Salt Wake",
            codename: "DEAD TIDE",
            location: "Abandoned Amplifer Pier — East Fog Bank",
            situation: "Phantom amplifiers rebooting in the salt fog. Stop the wake.",
            briefing: """
            The archive seed pointed east — a pier Meridian burned during \
            Night Ferry. Fog thicker than before. Relays that should be \
            scrap are humming again, drawing power from a ghost grid.

            Beat 1 — Clear the shore stacks; cut the watch. \
            Beat 2 — Cross mid-pier under container cover. \
            Beat 3 — Storm the berth and destroy the phantom amplifier \
            cluster before Lattice Echo syncs the coastal band.

            Salt air. Bad sightlines. No second pass on the waterline.
            """,
            intel: """
            Pier telemetry shows lattice tokens moving inland again — \
            through the same glass canyon you cleared in Act I. Echo \
            is replaying your war with better timing.
            """,
            objective: "Destroy the phantom amplifier cluster on the pier",
            enemyCount: 15,
            ammoPickups: 10,
            medkitPickups: 5,
            mapStyle: .fogPier,
            suggestedBody: .shotgun
        ),
        CampaignMission(
            id: "dlc03_mirror_static",
            act: episodeAct,
            number: 3,
            title: "Mirror Static",
            codename: "FALSE GLASS",
            location: "Financial District — Midtown (Ghost Pass)",
            situation: "Ghost tokens flooding the canyon. Cut the mirror run.",
            briefing: """
            Midtown’s glass corridor is empty of civilians — and loud with \
            lattice static. Echo is running courier ghosts: signed tokens \
            that open residual nodes you already thought dead.

            Beat 1 — Break the northern checkpoint under balcony fire. \
            Beat 2 — Cross the plaza; expect knife teams in the kiosks. \
            Beat 3 — Cut the southern choke and seize the master token \
            before it vanishes into the null spur.

            Same streets. Worse timing. Don’t let the mirror finish.
            """,
            intel: """
            The master token maps a subterranean null-core — a vault \
            under the border highlands where Ghost Lattice will attempt \
            a full cascade without Voss. One shot left.
            """,
            objective: "Intercept the ghost courier and seize the master token",
            enemyCount: 15,
            ammoPickups: 10,
            medkitPickups: 6,
            mapStyle: .ghostCanyon,
            suggestedBody: .rifle
        ),
        CampaignMission(
            id: "dlc04_null_horizon",
            act: episodeAct,
            number: 4,
            title: "Null Horizon",
            codename: "LAST ECHO",
            location: "Subterranean Null-Core — Border Highlands",
            situation: "Ghost Lattice’s heart. End the resurgence — or go blind twice.",
            briefing: """
            Below the mountain road you already walked sits a vault KESTREL \
            never logged: Null Horizon — Lattice Echo’s last redoubt. \
            Overlapping guns. Cold cores. A broadcast queue with no human \
            face left to negotiate with.

            Beat 1 — Storm the outer ring; silence the wall teams. \
            Beat 2 — Push the core galleries under strobe and static. \
            Beat 3 — Breach the null chamber. Shatter Ghost Lattice.

            Voss studied how to blind a world. Echo studied you. \
            Close the lesson permanently.
            """,
            intel: """
            Ghost Lattice collapses. Residual ORACLE bands go quiet. \
            KESTREL archives the aftershock as doctrine: cascades can \
            outlive their architects. You stopped the haunt. Stay sharp.
            """,
            objective: "Destroy the null-core and end Ghost Lattice",
            enemyCount: 17,
            ammoPickups: 11,
            medkitPickups: 6,
            mapStyle: .nullVault,
            suggestedBody: .machineGun
        )
    ]

    static func mission(id: String) -> CampaignMission? {
        missions.first { $0.id == id }
    }

    /// End-card copy — mid-mission intel beat, or full DLC epilogue on finale.
    static func endCardText(for missionID: String, victory: Bool) -> String {
        if !victory {
            return """
            MISSION FAILED.

            Lattice Echo holds the window. Ghost fragments keep reassembling. \
            Regroup, reload, and cut the thread again before the cascade \
            finishes without Voss.
            """
        }
        if missionID == missions.last?.id {
            return epilogue(victory: true)
        }
        if let mission = mission(id: missionID) {
            return """
            OBJECTIVE SECURE.

            \(mission.intel)
            """
        }
        return epilogue(victory: true)
    }

    static func epilogue(victory: Bool) -> String {
        if victory {
            return """
            GHOST LATTICE SHATTERED. ECHO SILENCED.

            The aftershock dies mid-packet. Residual ORACLE bands go dark. \
            Relays stay lit. Cities keep their eyes — again.

            Voss proved panic could be a weapon. Lattice Echo proved the \
            weapon could learn. You burned the haunt across four theaters \
            and closed the lesson he left behind.

            DLC complete, Operator. KESTREL stands down — until the next \
            ghost learns your name.
            """
        } else {
            return """
            MISSION FAILED.

            Ghost Lattice holds. Echo keeps broadcasting on dead channels. \
            Find the thread again before the world goes blind a second time.
            """
        }
    }
}
