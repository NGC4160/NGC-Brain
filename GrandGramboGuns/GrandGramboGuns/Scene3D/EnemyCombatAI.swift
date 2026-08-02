// EnemyCombatAI.swift
// Shared hostile tactics for Story, Arena, and Training — cover, flank, bursts, aim modifiers.

import Foundation
import SceneKit

enum EnemyCombatAI {

    enum Mode {
        case story
        case arena
        case training
    }

    /// Tunables per mode / difficulty. Damage is owned by the scene (don't inflate here).
    struct Profile {
        var hitChance: Float
        var riflePreferDist: Float
        var knifePreferDist: Float
        var rifleSpeed: Float
        var knifeSpeed: Float
        var rifleEngageMax: Float
        var knifeSlashRange: Float
        var knifeCooldown: TimeInterval
        var burstSize: Int
        var shotGap: ClosedRange<TimeInterval>
        var burstPause: ClosedRange<TimeInterval>
        var coverSeekSeconds: TimeInterval
        /// Ally must be this many meters closer than the player before peel.
        var allyBias: Float
        var stillSpeedThreshold: Float
        var strafeSpeedThreshold: Float
        var stillAimBonus: Float
        var strafeAimPenalty: Float
        var spacingMeters: Float
        var coverSearchRadius: Float
        var maxHitChance: Float
        /// 0…1 — how often rifles break LOS toward cover when suppressed / between bursts.
        var coverTendency: Float
    }

    struct MoveIntent {
        var dirX: Float
        var dirZ: Float
        var speed: Float
        var shouldMove: Bool
    }

    static func profile(difficulty: StoryDifficulty, mode: Mode) -> Profile {
        let baseHit = difficulty.enemyHitChance
        switch mode {
        case .story:
            switch difficulty {
            case .easy:
                return Profile(
                    hitChance: baseHit,
                    riflePreferDist: 8.2,
                    knifePreferDist: 1.45,
                    rifleSpeed: 1.25,
                    knifeSpeed: 2.05,
                    rifleEngageMax: 15,
                    knifeSlashRange: 1.85,
                    knifeCooldown: 1.05,
                    burstSize: 2,
                    shotGap: 0.28...0.42,
                    burstPause: 1.15...1.65,
                    coverSeekSeconds: 1.1,
                    allyBias: 0.45,
                    stillSpeedThreshold: 0.55,
                    strafeSpeedThreshold: 2.4,
                    stillAimBonus: 0.22,
                    strafeAimPenalty: 0.28,
                    spacingMeters: 0.85,
                    coverSearchRadius: 9,
                    maxHitChance: 0.22,
                    coverTendency: 0.35
                )
            case .medium:
                return Profile(
                    hitChance: baseHit,
                    riflePreferDist: 7.5,
                    knifePreferDist: 1.4,
                    rifleSpeed: 1.45,
                    knifeSpeed: 2.4,
                    rifleEngageMax: 16,
                    knifeSlashRange: 1.85,
                    knifeCooldown: 0.95,
                    burstSize: 3,
                    shotGap: 0.22...0.36,
                    burstPause: 0.85...1.35,
                    coverSeekSeconds: 1.45,
                    allyBias: 0.8,
                    stillSpeedThreshold: 0.5,
                    strafeSpeedThreshold: 2.2,
                    stillAimBonus: 0.32,
                    strafeAimPenalty: 0.38,
                    spacingMeters: 1.05,
                    coverSearchRadius: 11,
                    maxHitChance: 0.42,
                    coverTendency: 0.55
                )
            case .hard:
                return Profile(
                    hitChance: baseHit,
                    riflePreferDist: 7.0,
                    knifePreferDist: 1.35,
                    rifleSpeed: 1.65,
                    knifeSpeed: 2.7,
                    rifleEngageMax: 17,
                    knifeSlashRange: 1.9,
                    knifeCooldown: 0.85,
                    burstSize: 3,
                    shotGap: 0.18...0.30,
                    burstPause: 0.65...1.05,
                    coverSeekSeconds: 1.75,
                    allyBias: 1.35,
                    stillSpeedThreshold: 0.45,
                    strafeSpeedThreshold: 2.0,
                    stillAimBonus: 0.4,
                    strafeAimPenalty: 0.45,
                    spacingMeters: 1.25,
                    coverSearchRadius: 13,
                    maxHitChance: 0.62,
                    coverTendency: 0.72
                )
            }
        case .arena:
            // Match Story medium/hard aggression (cover, flank, aim). Easy stays slightly softer.
            switch difficulty {
            case .easy:
                let softHit = baseHit * 0.95
                return Profile(
                    hitChance: softHit,
                    riflePreferDist: 8.0,
                    knifePreferDist: 1.45,
                    rifleSpeed: 1.22,
                    knifeSpeed: 2.0,
                    rifleEngageMax: 15,
                    knifeSlashRange: 1.85,
                    knifeCooldown: 1.05,
                    burstSize: 2,
                    shotGap: 0.28...0.42,
                    burstPause: 1.1...1.55,
                    coverSeekSeconds: 1.15,
                    allyBias: 0.55,
                    stillSpeedThreshold: 0.55,
                    strafeSpeedThreshold: 2.4,
                    stillAimBonus: 0.22,
                    strafeAimPenalty: 0.28,
                    spacingMeters: 1.0,
                    coverSearchRadius: 10,
                    maxHitChance: 0.24,
                    coverTendency: 0.42
                )
            case .medium:
                // Story-medium baseline + slight cover bump for arena density.
                return Profile(
                    hitChance: baseHit,
                    riflePreferDist: 7.5,
                    knifePreferDist: 1.4,
                    rifleSpeed: 1.45,
                    knifeSpeed: 2.4,
                    rifleEngageMax: 16,
                    knifeSlashRange: 1.85,
                    knifeCooldown: 0.95,
                    burstSize: 3,
                    shotGap: 0.22...0.36,
                    burstPause: 0.85...1.35,
                    coverSeekSeconds: 1.5,
                    allyBias: 0.85,
                    stillSpeedThreshold: 0.5,
                    strafeSpeedThreshold: 2.2,
                    stillAimBonus: 0.32,
                    strafeAimPenalty: 0.38,
                    spacingMeters: 1.15,
                    coverSearchRadius: 12,
                    maxHitChance: 0.44,
                    coverTendency: 0.6
                )
            case .hard:
                // Story-hard baseline.
                return Profile(
                    hitChance: baseHit,
                    riflePreferDist: 7.0,
                    knifePreferDist: 1.35,
                    rifleSpeed: 1.65,
                    knifeSpeed: 2.7,
                    rifleEngageMax: 17,
                    knifeSlashRange: 1.9,
                    knifeCooldown: 0.85,
                    burstSize: 3,
                    shotGap: 0.18...0.30,
                    burstPause: 0.65...1.05,
                    coverSeekSeconds: 1.75,
                    allyBias: 1.35,
                    stillSpeedThreshold: 0.45,
                    strafeSpeedThreshold: 2.0,
                    stillAimBonus: 0.4,
                    strafeAimPenalty: 0.45,
                    spacingMeters: 1.3,
                    coverSearchRadius: 14,
                    maxHitChance: 0.62,
                    coverTendency: 0.74
                )
            }
        case .training:
            // Softer than Easy story — practice bay, not a firefight.
            return Profile(
                hitChance: 0.12,
                riflePreferDist: 8.4,
                knifePreferDist: 1.5,
                rifleSpeed: 1.05,
                knifeSpeed: 1.65,
                rifleEngageMax: 13.5,
                knifeSlashRange: 1.85,
                knifeCooldown: 1.2,
                burstSize: 2,
                shotGap: 0.35...0.5,
                burstPause: 1.35...1.9,
                coverSeekSeconds: 0.85,
                allyBias: 99,
                stillSpeedThreshold: 0.6,
                strafeSpeedThreshold: 2.6,
                stillAimBonus: 0.15,
                strafeAimPenalty: 0.22,
                spacingMeters: 0.7,
                coverSearchRadius: 8,
                maxHitChance: 0.18,
                coverTendency: 0.28
            )
        }
    }

    /// Unique engagement standoff so rifles don't stack on the same ring.
    static func preferredDistance(
        weapon: MissionSceneBuilder.EnemyWeapon,
        enemyIndex: Int,
        profile: Profile
    ) -> Float {
        let base = weapon == .knife ? profile.knifePreferDist : profile.riflePreferDist
        guard weapon == .rifle else { return base }
        let slot = Float(enemyIndex % 5)
        return base + slot * 0.55 - 1.1
    }

    static func speed(for weapon: MissionSceneBuilder.EnemyWeapon, profile: Profile) -> Float {
        weapon == .knife ? profile.knifeSpeed : profile.rifleSpeed
    }

    /// Hit chance after still/strafe modifiers. Wall LOS must already be true.
    static func adjustedHitChance(
        profile: Profile,
        playerSpeedXZ: Float
    ) -> Float {
        var chance = profile.hitChance
        if playerSpeedXZ < profile.stillSpeedThreshold {
            chance *= (1 + profile.stillAimBonus)
        } else if playerSpeedXZ > profile.strafeSpeedThreshold {
            chance *= (1 - profile.strafeAimPenalty)
        }
        return min(profile.maxHitChance, max(0.02, chance))
    }

    /// Advances burst cadence; returns next earliest attack time.
    static func scheduleAfterRifleShot(
        now: Date,
        burstRemaining: inout Int,
        profile: Profile
    ) -> Date {
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

    /// Cover / flank / hold-range movement. `nil` dir when standing still is fine — `shouldMove` false.
    static func moveIntent(
        weapon: MissionSceneBuilder.EnemyWeapon,
        enemyX: Float,
        enemyZ: Float,
        targetX: Float,
        targetZ: Float,
        dist: Float,
        hasLOS: Bool,
        seekCover: Bool,
        betweenBursts: Bool,
        enemyIndex: Int,
        time: TimeInterval,
        colliders: [MissionSceneBuilder.Collider],
        profile: Profile
    ) -> MoveIntent {
        let prefer = preferredDistance(weapon: weapon, enemyIndex: enemyIndex, profile: profile)
        let baseSpeed = speed(for: weapon, profile: profile)
        let side: Float = (enemyIndex & 1) == 0 ? 1 : -1
        let orbit = sin(Float(time) * 1.35 + Float(enemyIndex) * 1.7)

        let dx = targetX - enemyX
        let dz = targetZ - enemyZ
        let inv = 1 / max(dist, 0.01)
        let fx = dx * inv
        let fz = dz * inv
        let px = -fz
        let pz = fx

        // Cover when suppressed, between bursts (stable flag), or broken LOS — no per-frame RNG.
        let coverSlot = (enemyIndex * 17) % 100
        let wantCover = weapon == .rifle
            && (seekCover
                || (!hasLOS && dist > 3.5)
                || (betweenBursts && Float(coverSlot) < profile.coverTendency * 100))
        if wantCover,
           let cover = bestCoverPoint(
            enemyX: enemyX, enemyZ: enemyZ,
            targetX: targetX, targetZ: targetZ,
            colliders: colliders,
            searchRadius: profile.coverSearchRadius
           ) {
            let cx = cover.x - enemyX
            let cz = cover.z - enemyZ
            let cDist = sqrt(cx * cx + cz * cz)
            if cDist > 0.35 {
                return MoveIntent(
                    dirX: cx / cDist,
                    dirZ: cz / cDist,
                    speed: baseSpeed * (seekCover ? 1.15 : 0.95),
                    shouldMove: true
                )
            }
        }

        if weapon == .knife {
            if dist > prefer + 0.25 {
                // Aggressive close with a light weave so paths aren't a straight line.
                let wx = fx + px * side * 0.28 * (0.55 + 0.45 * orbit)
                let wz = fz + pz * side * 0.28 * (0.55 + 0.45 * orbit)
                let len = max(0.01, sqrt(wx * wx + wz * wz))
                return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: baseSpeed, shouldMove: true)
            }
            if dist > profile.knifeSlashRange * 0.85 {
                return MoveIntent(dirX: fx, dirZ: fz, speed: baseSpeed * 0.7, shouldMove: true)
            }
            return MoveIntent(dirX: 0, dirZ: 0, speed: 0, shouldMove: false)
        }

        // Rifle: approach with flanking offset / circle at mid / back off when too close.
        if dist > prefer + 0.35 {
            let lateral = side * (0.42 + profile.spacingMeters * 0.12) + orbit * 0.38 * side
            let wx = fx + px * lateral
            let wz = fz + pz * lateral
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: baseSpeed, shouldMove: true)
        }

        if dist < prefer - 1.4 {
            let wx = -fx + px * orbit * side * 0.85
            let wz = -fz + pz * orbit * side * 0.85
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: baseSpeed * 0.62, shouldMove: true)
        }

        // Mid-range hold: strafe / circle to keep pressure without standing still.
        if !hasLOS {
            // Peek: lateral move to regain LOS.
            let wx = px * side + fx * 0.15
            let wz = pz * side + fz * 0.15
            let len = max(0.01, sqrt(wx * wx + wz * wz))
            return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: baseSpeed * 0.8, shouldMove: true)
        }

        let wx = px * side * (0.75 + 0.25 * orbit) + fx * 0.08
        let wz = pz * side * (0.75 + 0.25 * orbit) + fz * 0.08
        let len = max(0.01, sqrt(wx * wx + wz * wz))
        return MoveIntent(dirX: wx / len, dirZ: wz / len, speed: baseSpeed * 0.55, shouldMove: true)
    }

    /// Far-side stand point on a nearby collider relative to the target (break LOS).
    static func bestCoverPoint(
        enemyX: Float,
        enemyZ: Float,
        targetX: Float,
        targetZ: Float,
        colliders: [MissionSceneBuilder.Collider],
        searchRadius: Float
    ) -> (x: Float, z: Float)? {
        let r2 = searchRadius * searchRadius
        var best: (x: Float, z: Float)?
        var bestScore: Float = -Float.greatestFiniteMagnitude

        for box in colliders {
            let cx = (box.minX + box.maxX) * 0.5
            let cz = (box.minZ + box.maxZ) * 0.5
            let toEnemyX = cx - enemyX
            let toEnemyZ = cz - enemyZ
            let d2 = toEnemyX * toEnemyX + toEnemyZ * toEnemyZ
            guard d2 < r2 else { continue }

            let hx = max(0.4, (box.maxX - box.minX) * 0.5)
            let hz = max(0.4, (box.maxZ - box.minZ) * 0.5)

            // Direction from target through cover — stand on the far side.
            var ox = cx - targetX
            var oz = cz - targetZ
            let oLen = sqrt(ox * ox + oz * oz)
            guard oLen > 0.2 else { continue }
            ox /= oLen
            oz /= oLen

            let standPad: Float = 0.95
            let candidates: [(Float, Float)] = [
                (cx + ox * (hx + standPad), cz + oz * (hz + standPad)),
                (cx + ox * (hx + standPad), cz),
                (cx, cz + oz * (hz + standPad)),
                (cx - oz * (hx * 0.6 + 0.5), cz + ox * (hz * 0.6 + 0.5)),
                (cx + oz * (hx * 0.6 + 0.5), cz - ox * (hz * 0.6 + 0.5))
            ]

            for (sx, sz) in candidates {
                // Prefer points that block LOS to target and aren't inside the box.
                if box.contains(sx, sz, radius: 0.28) { continue }
                let blocked = !lineClear(
                    fromX: sx, fromZ: sz,
                    toX: targetX, toZ: targetZ,
                    colliders: colliders
                )
                let edx = sx - enemyX
                let edz = sz - enemyZ
                let eDist = sqrt(edx * edx + edz * edz)
                // Closer cover + LOS break scores higher; slight preference for nearer boxes.
                var score = (blocked ? 8 : 0) - eDist * 0.55 - sqrt(d2) * 0.15
                if eDist < 0.4 { score -= 4 }
                if score > bestScore {
                    bestScore = score
                    best = (sx, sz)
                }
            }
        }
        return best
    }

    static func lineClear(
        fromX: Float, fromZ: Float,
        toX: Float, toZ: Float,
        colliders: [MissionSceneBuilder.Collider]
    ) -> Bool {
        let dx = toX - fromX
        let dz = toZ - fromZ
        let len = sqrt(dx * dx + dz * dz)
        guard len > 0.05 else { return true }
        let inv = 1 / len
        let inset: Float = min(0.22, len * 0.35)
        let x0 = fromX + dx * inv * inset
        let z0 = fromZ + dz * inv * inset
        let x1 = toX - dx * inv * inset
        let z1 = toZ - dz * inv * inset
        for box in colliders {
            if box.intersectsSegment(x0: x0, z0: z0, x1: x1, z1: z1) {
                return false
            }
        }
        return true
    }
}
