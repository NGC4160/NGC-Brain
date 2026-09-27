// TeammateCombatAI.swift
// Friendly AI tactics shared by Story/DLC (KESTREL wingman) and Arena squad-fill bots.
// Campaign wingman personality + smarts live in `.story`; `.arena` is lighter squad AI only.

import Foundation
import SceneKit

enum TeammateCombatAI {

    enum Mode {
        case story
        case arena
    }

    enum TargetPick {
        case focus
        case peel
        case nearest
        case none
    }

    struct Profile {
        var engageRange: Float
        var preferFightDist: Float
        var followDist: Float
        var bodyguardFollowDist: Float
        var moveSpeed: Float
        var hitChance: Float
        var maxHitChance: Float
        var shotDamage: Int
        var fireInterval: ClosedRange<TimeInterval>
        var burstSize: Int
        var shotGap: ClosedRange<TimeInterval>
        var burstPause: ClosedRange<TimeInterval>
        var coverSeekSeconds: TimeInterval
        var coverTendency: Float
        var coverSearchRadius: Float
        var playerClearance: Float
        var peelSeconds: TimeInterval
        var bodyguardHPRatio: Float
        /// Half-angle (radians) of player forward cone where wingman holds fire / flanks.
        var crosshairAvoidHalfAngle: Float
        var crosshairAvoidRange: Float
        /// Prefer focus targets within this distance of the mate.
        var focusMaxDist: Float
        var peelBias: Float
        /// Story wingman gets full smarts; arena squad fill stays lighter.
        var smartWingman: Bool
    }

    struct MoveIntent {
        var dirX: Float
        var dirZ: Float
        var speed: Float
        var shouldMove: Bool
    }

    static func profile(mode: Mode, difficulty: StoryDifficulty = .medium) -> Profile {
        switch mode {
        case .story:
            return storyProfile(difficulty: difficulty)
        case .arena:
            return arenaProfile(difficulty: difficulty)
        }
    }

    private static func storyProfile(difficulty: StoryDifficulty) -> Profile {
        switch difficulty {
        case .easy:
            return Profile(
                engageRange: 17,
                preferFightDist: 7.2,
                followDist: 2.65,
                bodyguardFollowDist: 1.85,
                moveSpeed: 4.15,
                hitChance: 0.58,
                maxHitChance: 0.74,
                shotDamage: 1,
                fireInterval: 0.95...1.25,
                burstSize: 2,
                shotGap: 0.28...0.42,
                burstPause: 1.0...1.45,
                coverSeekSeconds: 1.05,
                coverTendency: 0.45,
                coverSearchRadius: 10,
                playerClearance: 1.35,
                peelSeconds: 2.4,
                bodyguardHPRatio: 0.38,
                crosshairAvoidHalfAngle: 0.32,
                crosshairAvoidRange: 11,
                focusMaxDist: 16,
                peelBias: 1.15,
                smartWingman: true
            )
        case .medium:
            return Profile(
                engageRange: 18,
                preferFightDist: 7.0,
                followDist: 2.5,
                bodyguardFollowDist: 1.7,
                moveSpeed: 4.45,
                hitChance: 0.66,
                maxHitChance: 0.84,
                shotDamage: 1,
                fireInterval: 0.85...1.15,
                burstSize: 3,
                shotGap: 0.22...0.34,
                burstPause: 0.78...1.2,
                coverSeekSeconds: 1.35,
                coverTendency: 0.58,
                coverSearchRadius: 11.5,
                playerClearance: 1.4,
                peelSeconds: 2.8,
                bodyguardHPRatio: 0.40,
                crosshairAvoidHalfAngle: 0.30,
                crosshairAvoidRange: 12,
                focusMaxDist: 17,
                peelBias: 1.35,
                smartWingman: true
            )
        case .hard:
            return Profile(
                engageRange: 19,
                preferFightDist: 6.7,
                followDist: 2.35,
                bodyguardFollowDist: 1.55,
                moveSpeed: 4.75,
                hitChance: 0.74,
                maxHitChance: 0.92,
                shotDamage: 1,
                fireInterval: 0.72...1.0,
                burstSize: 3,
                shotGap: 0.18...0.28,
                burstPause: 0.62...1.0,
                coverSeekSeconds: 1.55,
                coverTendency: 0.7,
                coverSearchRadius: 13,
                playerClearance: 1.45,
                peelSeconds: 3.2,
                bodyguardHPRatio: 0.42,
                crosshairAvoidHalfAngle: 0.28,
                crosshairAvoidRange: 13,
                focusMaxDist: 18,
                peelBias: 1.55,
                smartWingman: true
            )
        }
    }

    /// Lighter squad-fill AI for MP/BR — not the campaign KESTREL wingman.
    private static func arenaProfile(difficulty: StoryDifficulty) -> Profile {
        let soft: Float
        switch difficulty {
        case .easy: soft = 0.48
        case .medium: soft = 0.55
        case .hard: soft = 0.62
        }
        return Profile(
            engageRange: 16,
            preferFightDist: 7.0,
            followDist: 2.4,
            bodyguardFollowDist: 1.9,
            moveSpeed: 4.2,
            hitChance: soft,
            maxHitChance: soft + 0.12,
            shotDamage: 1,
            fireInterval: 1.0...1.35,
            burstSize: 2,
            shotGap: 0.30...0.45,
            burstPause: 1.05...1.5,
            coverSeekSeconds: 0.95,
            coverTendency: 0.35,
            coverSearchRadius: 10,
            playerClearance: 1.25,
            peelSeconds: 2.0,
            bodyguardHPRatio: 0.35,
            crosshairAvoidHalfAngle: 0.36,
            crosshairAvoidRange: 10,
            focusMaxDist: 14,
            peelBias: 1.0,
            smartWingman: false
        )
    }

    static func isBodyguard(playerHP: Double, playerMaxHP: Double, profile: Profile) -> Bool {
        guard playerMaxHP > 0 else { return false }
        return (playerHP / playerMaxHP) < Double(profile.bodyguardHPRatio)
    }

    /// Priority: threats near a hurt/suppressed player → player's current focus → nearest to mate.
    static func pickTarget(
        focusDistFromMate: Float?,
        peelDistFromMate: Float?,
        nearestDistFromMate: Float?,
        playerUnderFire: Bool,
        bodyguard: Bool,
        profile: Profile
    ) -> TargetPick {
        let engage = profile.engageRange
        let peelUrgent = playerUnderFire || bodyguard

        if peelUrgent, let d = peelDistFromMate, d < engage * profile.peelBias {
            return .peel
        }
        if let d = focusDistFromMate, d < profile.focusMaxDist {
            // Don't tunnel on focus if a closer peel threat is chewing the player.
            if peelUrgent, let pd = peelDistFromMate, pd + 2.5 < d {
                return .peel
            }
            return .focus
        }
        if let d = nearestDistFromMate, d < engage {
            return .nearest
        }
        if let d = peelDistFromMate, d < engage {
            return .peel
        }
        return .none
    }

    /// True when hostile sits in the player's forward cone (story wingman holds / flanks).
    static func isInPlayerCrosshair(
        playerX: Float, playerZ: Float,
        playerYaw: Float,
        targetX: Float, targetZ: Float,
        profile: Profile
    ) -> Bool {
        guard profile.smartWingman else { return false }
        let dx = targetX - playerX
        let dz = targetZ - playerZ
        let dist = sqrt(dx * dx + dz * dz)
        guard dist > 1.2, dist < profile.crosshairAvoidRange else { return false }
        let lookX = -sin(playerYaw)
        let lookZ = -cos(playerYaw)
        let inv = 1 / dist
        let dot = lookX * (dx * inv) + lookZ * (dz * inv)
        return dot > cos(profile.crosshairAvoidHalfAngle)
    }

    /// Wall LOS required by caller; dampens steal-kills in the player's bead.
    static func hitChance(
        profile: Profile,
        hasLOS: Bool,
        dist: Float,
        inPlayerCrosshair: Bool = false
    ) -> Float {
        guard hasLOS, dist > 1.4, dist < profile.engageRange else { return 0 }
        var chance = profile.hitChance
        // Slight falloff at long range; slight bump mid-ring.
        if dist > profile.preferFightDist + 3 {
            chance *= 0.82
        } else if abs(dist - profile.preferFightDist) < 1.5 {
            chance *= 1.08
        }
        if inPlayerCrosshair {
            chance *= profile.smartWingman ? 0.22 : 0.55
        }
        return min(profile.maxHitChance, max(0.04, chance))
    }

    /// Hold most shots when the kill is clearly the player's — flank instead.
    static func shouldHoldFireForCrosshair(
        inPlayerCrosshair: Bool,
        dist: Float,
        mateIndex: Int,
        time: TimeInterval,
        profile: Profile
    ) -> Bool {
        guard profile.smartWingman, inPlayerCrosshair, dist < profile.crosshairAvoidRange else {
            return false
        }
        let slot = Int((time * 7.0 + Double(mateIndex) * 3.1).truncatingRemainder(dividingBy: 10))
        return slot < 7
    }

    /// Simple cadence (arena / fallback). Prefer `scheduleAfterRifleShot` for story bursts.
    static func scheduleNextFire(now: Date, profile: Profile) -> Date {
        now.addingTimeInterval(Double.random(in: profile.fireInterval))
    }

    static func scheduleAfterRifleShot(
        now: Date,
        burstRemaining: inout Int,
        profile: Profile
    ) -> Date {
        if !profile.smartWingman {
            return scheduleNextFire(now: now, profile: profile)
        }
        if burstRemaining <= 0 {
            burstRemaining = max(1, profile.burstSize)
        }
        burstRemaining -= 1
        if burstRemaining > 0 {
            return now.addingTimeInterval(Double.random(in: profile.shotGap))
        }
        burstRemaining = 0
        return now.addingTimeInterval(Double.random(in: profile.burstPause))
    }

    static func combatMoveIntent(
        mateX: Float, mateZ: Float,
        targetX: Float, targetZ: Float,
        playerX: Float, playerZ: Float,
        dist: Float,
        hasLOS: Bool,
        betweenShots: Bool,
        bodyguard: Bool,
        mateIndex: Int,
        time: TimeInterval,
        colliders: [MissionSceneBuilder.Collider],
        profile: Profile,
        seekCover: Bool = false,
        playerYaw: Float = 0,
        inPlayerCrosshair: Bool = false
    ) -> MoveIntent {
        let side: Float = (mateIndex & 1) == 0 ? 1 : -1
        let orbit = sin(Float(time) * 1.25 + Float(mateIndex) * 1.9)
        let prefer = profile.preferFightDist + Float(mateIndex % 3) * 0.35 - 0.35

        // Never body-block the player.
        let pdx = mateX - playerX
        let pdz = mateZ - playerZ
        let pDist = sqrt(pdx * pdx + pdz * pdz)
        if pDist < profile.playerClearance {
            let lookX = -sin(playerYaw)
            let lookZ = -cos(playerYaw)
            let px = -lookZ
            let pz = lookX
            let inv = 1 / max(pDist, 0.08)
            let wx = pdx * inv * 0.4 + px * side
            let wz = pdz * inv * 0.4 + pz * side
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: profile.moveSpeed * 1.15, shouldMove: true)
        }

        let dx = targetX - mateX
        let dz = targetZ - mateZ
        let inv = 1 / max(dist, 0.01)
        let fx = dx * inv
        let fz = dz * inv
        let px = -fz
        let pz = fx

        // Cover when suppressed / between bursts / broken LOS (story wingman leans harder).
        let coverSlot = (mateIndex * 19) % 100
        let tendency = profile.smartWingman ? profile.coverTendency : profile.coverTendency * 0.55
        let wantCover = seekCover
            || (!hasLOS && dist > 3.5)
            || (betweenShots && Float(coverSlot) < tendency * 100)
        if wantCover,
           let cover = EnemyCombatAI.bestCoverPoint(
                enemyX: mateX, enemyZ: mateZ,
                targetX: targetX, targetZ: targetZ,
                colliders: colliders,
                searchRadius: profile.coverSearchRadius
           ) {
            let cdx = cover.x - playerX
            let cdz = cover.z - playerZ
            if sqrt(cdx * cdx + cdz * cdz) > profile.playerClearance + 0.35 {
                let cx = cover.x - mateX
                let cz = cover.z - mateZ
                let cDist = sqrt(cx * cx + cz * cz)
                if cDist > 0.35 {
                    return MoveIntent(
                        dirX: cx / cDist,
                        dirZ: cz / cDist,
                        speed: profile.moveSpeed * (seekCover || bodyguard ? 1.2 : 0.95),
                        shouldMove: true
                    )
                }
            }
        }

        // Low-HP player: close toward player while still pressuring the threat.
        if bodyguard {
            let toPX = playerX - mateX
            let toPZ = playerZ - mateZ
            let pd = sqrt(toPX * toPX + toPZ * toPZ)
            if pd > profile.bodyguardFollowDist + 0.45 {
                let wx = toPX / max(pd, 0.01) * 0.55 + fx * 0.4 + px * side * 0.35
                let wz = toPZ / max(pd, 0.01) * 0.55 + fz * 0.4 + pz * side * 0.35
                let len = max(0.01, sqrt(wx * wx + wz * wz))
                return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: profile.moveSpeed * 1.2, shouldMove: true)
            }
        }

        if dist > prefer + 0.55 {
            let lateralBase: Float = inPlayerCrosshair && profile.smartWingman ? 0.95 : 0.48
            let lateral = side * lateralBase + orbit * 0.4 * side
            var wx = fx + px * lateral
            var wz = fz + pz * lateral
            // Soft push off the player so we don't cut their LOS.
            if pDist < profile.playerClearance + 1.15, pDist > 0.15 {
                wx += pdx / pDist * 0.3
                wz += pdz / pDist * 0.3
            }
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: profile.moveSpeed, shouldMove: true)
        }

        if dist < prefer - 1.55 {
            let wx = -fx + px * orbit * side * 0.9
            let wz = -fz + pz * orbit * side * 0.9
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: profile.moveSpeed * 0.6, shouldMove: true)
        }

        if !hasLOS {
            let wx = px * side + fx * 0.2
            let wz = pz * side + fz * 0.2
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: profile.moveSpeed * 0.85, shouldMove: true)
        }

        if inPlayerCrosshair, profile.smartWingman {
            let wx = px * side * (1.1 + 0.25 * orbit) - fx * 0.12
            let wz = pz * side * (1.1 + 0.25 * orbit) - fz * 0.12
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: profile.moveSpeed * 0.72, shouldMove: true)
        }

        // Mid-range strafe / circle — not a still turret.
        let wx = px * side * (0.8 + 0.25 * orbit) + fx * 0.06
        let wz = pz * side * (0.8 + 0.25 * orbit) + fz * 0.06
        let len = max(0.01, sqrt(wx * wx + wz * wz))
        return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: profile.moveSpeed * 0.55, shouldMove: true)
    }

    static func followMoveIntent(
        mateX: Float, mateZ: Float,
        playerX: Float, playerZ: Float,
        yaw: Float,
        bodyguard: Bool,
        mateIndex: Int,
        profile: Profile
    ) -> MoveIntent {
        let side: Float = (mateIndex & 1) == 0 ? 1 : -1
        let follow = bodyguard ? profile.bodyguardFollowDist : profile.followDist
        let lookX = -sin(yaw)
        let lookZ = -cos(yaw)
        let px = -lookZ
        let pz = lookX
        let slot = Float(mateIndex % 3) - 1
        let lateral = (1.1 + slot * 0.5) * side
        let back = follow + abs(slot) * 0.2
        let followX = playerX - lookX * back + px * lateral
        let followZ = playerZ - lookZ * back + pz * lateral

        // Clearance peel if overlapping player.
        let pdx = mateX - playerX
        let pdz = mateZ - playerZ
        let pDist = sqrt(pdx * pdx + pdz * pdz)
        if pDist < profile.playerClearance {
            let wx = pdx / max(pDist, 0.08) * 0.35 + px * side
            let wz = pdz / max(pDist, 0.08) * 0.35 + pz * side
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: profile.moveSpeed * 1.1, shouldMove: true)
        }

        let dx = followX - mateX
        let dz = followZ - mateZ
        let dist = sqrt(dx * dx + dz * dz)
        if dist > 0.65 {
            return MoveIntent(
                dirX: dx / max(dist, 0.01),
                dirZ: dz / max(dist, 0.01),
                speed: profile.moveSpeed * (bodyguard ? 1.15 : 1.05),
                shouldMove: true
            )
        }
        return MoveIntent(dirX: 0, dirZ: 0, speed: 0, shouldMove: false)
    }
}
