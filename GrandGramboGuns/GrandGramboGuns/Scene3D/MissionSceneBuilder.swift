// MissionSceneBuilder.swift
// Unique walkable maps per mission + enemies / pickups for Story Mode.

import SceneKit
import UIKit

enum MissionSceneBuilder {

    /// Axis-aligned wall/prop footprint on XZ. Built once per mission; combat uses these for movement + LOS.
    /// `topY` is the world-space top of the obstacle (default very tall = always blocks LOS).
    /// Arena elevated shooters skip boxes when both ends of a shot clear above `topY`.
    struct Collider {
        var minX: Float
        var maxX: Float
        var minZ: Float
        var maxZ: Float
        /// World Y of the top face. Default keeps Story/legacy XZ-only LOS behavior.
        var topY: Float = 99

        func contains(_ x: Float, _ z: Float, radius: Float) -> Bool {
            x + radius > minX && x - radius < maxX && z + radius > minZ && z - radius < maxZ
        }

        /// Segment–AABB intersection on XZ using the slab method. `t` in [0, 1] along (x0,z0)→(x1,z1).
        func intersectsSegment(x0: Float, z0: Float, x1: Float, z1: Float) -> Bool {
            firstIntersectionT(x0: x0, z0: z0, x1: x1, z1: z1) != nil
        }

        /// Earliest hit parameter along the segment, or nil if clear.
        func firstIntersectionT(x0: Float, z0: Float, x1: Float, z1: Float) -> Float? {
            let dx = x1 - x0
            let dz = z1 - z0
            var tMin: Float = 0
            var tMax: Float = 1

            if abs(dx) < 1e-7 {
                if x0 < minX || x0 > maxX { return nil }
            } else {
                var t1 = (minX - x0) / dx
                var t2 = (maxX - x0) / dx
                if t1 > t2 { swap(&t1, &t2) }
                tMin = max(tMin, t1)
                tMax = min(tMax, t2)
                if tMin > tMax { return nil }
            }

            if abs(dz) < 1e-7 {
                if z0 < minZ || z0 > maxZ { return nil }
            } else {
                var t1 = (minZ - z0) / dz
                var t2 = (maxZ - z0) / dz
                if t1 > t2 { swap(&t1, &t2) }
                tMin = max(tMin, t1)
                tMax = min(tMax, t2)
                if tMin > tMax { return nil }
            }

            return tMin <= tMax ? tMin : nil
        }

        /// Minimum axis push to move a circle of `radius` outside this box. Returns (0,0) if already clear.
        func pushOut(x: Float, z: Float, radius: Float) -> (Float, Float) {
            guard contains(x, z, radius: radius) else { return (0, 0) }
            let left = (x + radius) - minX
            let right = maxX - (x - radius)
            let down = (z + radius) - minZ
            let up = maxZ - (z - radius)
            let m = min(min(left, right), min(down, up))
            let eps: Float = 0.02
            if abs(m - left) < 1e-5 { return (-left - eps, 0) }
            if abs(m - right) < 1e-5 { return (right + eps, 0) }
            if abs(m - down) < 1e-5 { return (0, -down - eps) }
            return (0, up + eps)
        }

        static func fromBox(
            center: SCNVector3,
            width: Float,
            depth: Float,
            padding: Float = 0,
            topY: Float = 99
        ) -> Collider {
            let hx = width * 0.5 + padding
            let hz = depth * 0.5 + padding
            return Collider(
                minX: center.x - hx,
                maxX: center.x + hx,
                minZ: center.z - hz,
                maxZ: center.z + hz,
                topY: topY
            )
        }
    }

    struct BuiltMission {
        let scene: SCNScene
        let playerSpawn: SCNVector3
        let enemySpawns: [SCNVector3]
        let ammoSpawns: [SCNVector3]
        let medkitSpawns: [SCNVector3]
        let mapHalfExtent: Float
        let colliders: [Collider]
    }

    static func build(mission: CampaignMission) -> BuiltMission {
        let scene = SCNScene()
        let layout = layout(for: mission.mapStyle)
        scene.background.contents = skyColor(for: mission.mapStyle)
        addLighting(to: scene, style: mission.mapStyle)

        var colliders: [Collider] = []
        buildGround(in: scene, style: mission.mapStyle, size: layout.groundSize)
        buildWalls(in: scene, layout: layout, style: mission.mapStyle, colliders: &colliders)
        buildMissionMap(in: scene, style: mission.mapStyle, layout: layout, colliders: &colliders)

        return BuiltMission(
            scene: scene,
            playerSpawn: layout.playerSpawn,
            enemySpawns: Array(layout.enemySpawns.prefix(mission.enemyCount)),
            ammoSpawns: Array(layout.ammoSpawns.prefix(mission.ammoPickups)),
            medkitSpawns: Array(layout.medkitSpawns.prefix(mission.medkitPickups)),
            mapHalfExtent: layout.groundSize * 0.5 - 1.5,
            colliders: colliders
        )
    }

    // MARK: - Layouts

    private struct Layout {
        var groundSize: Float
        var playerSpawn: SCNVector3
        var enemySpawns: [SCNVector3]
        var ammoSpawns: [SCNVector3]
        var medkitSpawns: [SCNVector3]
        var wallRects: [(SCNVector3, Float, Float, Float)] // center, w, h, d
    }

    private static func layout(for style: MissionMapStyle) -> Layout {
        switch style {
        case .warehouse: // Broken Signal — denser harbor warehouse
            return Layout(
                groundSize: 44,
                playerSpawn: SCNVector3(0, 1.6, 18),
                enemySpawns: [
                    SCNVector3(-8, 0, 8), SCNVector3(8, 0, 6), SCNVector3(-10, 0, 2),
                    SCNVector3(10, 0, 0), SCNVector3(-6, 0, -4), SCNVector3(6, 0, -6),
                    SCNVector3(0, 0, -10), SCNVector3(-9, 0, -12), SCNVector3(9, 0, -14),
                    SCNVector3(-3, 0, -16), SCNVector3(4, 0, 10), SCNVector3(-5, 0, -8),
                    SCNVector3(5, 0, -2), SCNVector3(0, 0, 4)
                ],
                ammoSpawns: [
                    SCNVector3(-7, 0.4, 12), SCNVector3(7, 0.4, 8), SCNVector3(0, 0.4, 2),
                    SCNVector3(-11, 0.4, -4), SCNVector3(11, 0.4, -8), SCNVector3(-4, 0.4, -12),
                    SCNVector3(4, 0.4, -15), SCNVector3(0, 0.4, 14), SCNVector3(-8, 0.4, -1),
                    SCNVector3(8, 0.4, -11)
                ],
                medkitSpawns: [
                    SCNVector3(5, 0.4, 14), SCNVector3(-5, 0.4, 4), SCNVector3(9, 0.4, -6),
                    SCNVector3(-9, 0.4, -14), SCNVector3(0, 0.4, -7)
                ],
                wallRects: [
                    (SCNVector3(0, 2.2, -22), 44, 4.4, 0.5),
                    (SCNVector3(0, 2.2, 22), 44, 4.4, 0.5),
                    (SCNVector3(-22, 2.2, 0), 0.5, 4.4, 44),
                    (SCNVector3(22, 2.2, 0), 0.5, 4.4, 44),
                    (SCNVector3(-8, 1.6, 6), 0.5, 3.2, 14),
                    (SCNVector3(8, 1.6, -2), 0.5, 3.2, 16),
                    (SCNVector3(0, 1.6, -5), 12, 3.2, 0.5),
                    (SCNVector3(-5, 1.4, -14), 8, 2.8, 0.5),
                    (SCNVector3(5, 1.4, 10), 7, 2.8, 0.5),
                    (SCNVector3(0, 1.5, 12), 0.5, 3.0, 8),
                    (SCNVector3(-12, 1.3, -6), 4, 2.6, 2.2),
                    (SCNVector3(12, 1.3, 8), 4, 2.6, 2.2),
                    (SCNVector3(-3, 1.2, 0), 2.4, 2.4, 2.4),
                    (SCNVector3(4, 1.2, -10), 2.4, 2.4, 2.4)
                ]
            )
        case .streets: // Glass Corridor — longer canyon
            return Layout(
                groundSize: 48,
                playerSpawn: SCNVector3(0, 1.6, 20),
                enemySpawns: [
                    SCNVector3(-3, 0, 12), SCNVector3(3, 0, 10), SCNVector3(-4, 0, 4),
                    SCNVector3(4, 0, 2), SCNVector3(-3, 0, -4), SCNVector3(3, 0, -8),
                    SCNVector3(0, 0, -12), SCNVector3(-5, 0, -14), SCNVector3(5, 0, -16),
                    SCNVector3(-2, 0, -20), SCNVector3(2, 0, 16), SCNVector3(4, 0, -2),
                    SCNVector3(-4, 0, -10), SCNVector3(0, 0, 6)
                ],
                ammoSpawns: [
                    SCNVector3(-2, 0.4, 14), SCNVector3(2, 0.4, 6), SCNVector3(-3, 0.4, -2),
                    SCNVector3(3, 0.4, -10), SCNVector3(0, 0.4, -16), SCNVector3(-2, 0.4, 0),
                    SCNVector3(2, 0.4, -14), SCNVector3(0, 0.4, 18), SCNVector3(-3, 0.4, 8)
                ],
                medkitSpawns: [
                    SCNVector3(1, 0.4, 16), SCNVector3(-3, 0.4, 2), SCNVector3(0, 0.4, -18),
                    SCNVector3(3, 0.4, -6), SCNVector3(-1, 0.4, 10)
                ],
                wallRects: [
                    (SCNVector3(-8, 5, 0), 5.5, 10, 48),
                    (SCNVector3(8, 5, 0), 5.5, 10, 48),
                    (SCNVector3(0, 2, -24), 22, 4, 0.6),
                    (SCNVector3(0, 2, 24), 22, 4, 0.6),
                    (SCNVector3(-2.6, 1.1, 10), 1.6, 2.2, 1.6),
                    (SCNVector3(2.6, 1.1, 2), 1.6, 2.2, 1.6),
                    (SCNVector3(-2.6, 1.1, -6), 1.6, 2.2, 1.6),
                    (SCNVector3(2.6, 1.1, -14), 1.6, 2.2, 1.6),
                    (SCNVector3(-2.6, 1.1, 16), 1.6, 2.2, 1.6),
                    (SCNVector3(2.6, 1.1, -20), 1.6, 2.2, 1.6),
                    (SCNVector3(0, 1.2, 4), 3.2, 2.4, 1.4),
                    (SCNVector3(0, 1.2, -10), 3.2, 2.4, 1.4),
                    (SCNVector3(-2.4, 1.0, -18), 1.8, 2.0, 1.8),
                    (SCNVector3(2.4, 1.0, 8), 1.8, 2.0, 1.8)
                ]
            )
        case .metro: // Silent Subway
            return Layout(
                groundSize: 46,
                playerSpawn: SCNVector3(0, 1.6, 19),
                enemySpawns: [
                    SCNVector3(-4, 0, 10), SCNVector3(4, 0, 8), SCNVector3(-5, 0, 2),
                    SCNVector3(5, 0, 0), SCNVector3(0, 0, -4), SCNVector3(-4, 0, -8),
                    SCNVector3(4, 0, -10), SCNVector3(-5, 0, -14), SCNVector3(5, 0, -16),
                    SCNVector3(0, 0, -18), SCNVector3(-3, 0, 14), SCNVector3(3, 0, -6),
                    SCNVector3(0, 0, 4)
                ],
                ammoSpawns: [
                    SCNVector3(-3, 0.4, 14), SCNVector3(3, 0.4, 6), SCNVector3(0, 0.4, 0),
                    SCNVector3(-4, 0.4, -8), SCNVector3(4, 0.4, -12), SCNVector3(0, 0.4, -16),
                    SCNVector3(-3, 0.4, 8), SCNVector3(3, 0.4, -4), SCNVector3(0, 0.4, 16)
                ],
                medkitSpawns: [
                    SCNVector3(2, 0.4, 12), SCNVector3(-2, 0.4, 2), SCNVector3(0, 0.4, -10),
                    SCNVector3(-4, 0.4, -18), SCNVector3(4, 0.4, 14)
                ],
                wallRects: [
                    (SCNVector3(0, 2.4, -23), 20, 4.8, 0.6),
                    (SCNVector3(0, 2.4, 23), 20, 4.8, 0.6),
                    (SCNVector3(-8, 2.8, 0), 0.7, 5.6, 46),
                    (SCNVector3(8, 2.8, 0), 0.7, 5.6, 46),
                    (SCNVector3(-3.5, 1.4, 6), 4, 2.8, 0.5),
                    (SCNVector3(3.5, 1.4, -2), 4, 2.8, 0.5),
                    (SCNVector3(-3.5, 1.4, -10), 4, 2.8, 0.5),
                    (SCNVector3(3.5, 1.4, -16), 4, 2.8, 0.5),
                    (SCNVector3(0, 1.5, 12), 6, 3.0, 0.5),
                    (SCNVector3(-5, 1.5, -6), 0.6, 3.0, 6),
                    (SCNVector3(5, 1.5, 8), 0.6, 3.0, 6),
                    (SCNVector3(0, 1.3, -14), 4.5, 2.6, 0.5)
                ]
            )
        case .docks: // Night Ferry — denser piers
            return Layout(
                groundSize: 46,
                playerSpawn: SCNVector3(0, 1.6, 19),
                enemySpawns: [
                    SCNVector3(-9, 0, 10), SCNVector3(9, 0, 8), SCNVector3(-8, 0, 2),
                    SCNVector3(8, 0, 0), SCNVector3(-7, 0, -6), SCNVector3(7, 0, -8),
                    SCNVector3(0, 0, -12), SCNVector3(-11, 0, -12), SCNVector3(11, 0, -14),
                    SCNVector3(2, 0, -18), SCNVector3(-4, 0, 14), SCNVector3(4, 0, -4),
                    SCNVector3(-10, 0, -2), SCNVector3(10, 0, 4)
                ],
                ammoSpawns: [
                    SCNVector3(-8, 0.4, 14), SCNVector3(8, 0.4, 10), SCNVector3(0, 0.4, 4),
                    SCNVector3(-10, 0.4, -4), SCNVector3(10, 0.4, -10), SCNVector3(-4, 0.4, -14),
                    SCNVector3(4, 0.4, -17), SCNVector3(0, 0.4, 16), SCNVector3(-6, 0.4, 6)
                ],
                medkitSpawns: [
                    SCNVector3(6, 0.4, 15), SCNVector3(-6, 0.4, 2), SCNVector3(5, 0.4, -12),
                    SCNVector3(-9, 0.4, -16), SCNVector3(0, 0.4, -6)
                ],
                wallRects: [
                    (SCNVector3(0, 1.6, -23), 46, 3.2, 0.5),
                    (SCNVector3(-23, 1.6, 0), 0.5, 3.2, 46),
                    (SCNVector3(23, 1.6, 0), 0.5, 3.2, 46),
                    (SCNVector3(-7, 1.5, 4), 3.5, 3, 9),
                    (SCNVector3(7, 1.5, -2), 3.5, 3, 11),
                    (SCNVector3(-7, 1.5, -10), 3.5, 3, 8),
                    (SCNVector3(7, 1.5, 12), 3.5, 3, 7),
                    (SCNVector3(0, 1.4, -6), 8, 2.8, 0.5),
                    (SCNVector3(-3, 1.2, 10), 2.8, 2.4, 2.8),
                    (SCNVector3(3, 1.2, -14), 2.8, 2.4, 2.8),
                    (SCNVector3(0, 1.3, 2), 5, 2.6, 0.5)
                ]
            )
        case .bazaar: // Red Bazaar — alley maze
            return Layout(
                groundSize: 44,
                playerSpawn: SCNVector3(0, 1.6, 18),
                enemySpawns: [
                    SCNVector3(-6, 0, 10), SCNVector3(6, 0, 8), SCNVector3(-8, 0, 2),
                    SCNVector3(8, 0, 0), SCNVector3(-4, 0, -4), SCNVector3(4, 0, -6),
                    SCNVector3(-8, 0, -10), SCNVector3(8, 0, -12), SCNVector3(0, 0, -14),
                    SCNVector3(-5, 0, 14), SCNVector3(5, 0, -2), SCNVector3(-2, 0, -16),
                    SCNVector3(2, 0, 4), SCNVector3(0, 0, -8)
                ],
                ammoSpawns: [
                    SCNVector3(-5, 0.4, 12), SCNVector3(5, 0.4, 6), SCNVector3(0, 0.4, 2),
                    SCNVector3(-7, 0.4, -4), SCNVector3(7, 0.4, -8), SCNVector3(-3, 0.4, -12),
                    SCNVector3(3, 0.4, -15), SCNVector3(0, 0.4, 14), SCNVector3(-6, 0.4, 0)
                ],
                medkitSpawns: [
                    SCNVector3(4, 0.4, 14), SCNVector3(-4, 0.4, 4), SCNVector3(6, 0.4, -6),
                    SCNVector3(-6, 0.4, -14), SCNVector3(0, 0.4, -10)
                ],
                wallRects: [
                    (SCNVector3(0, 2.0, -22), 44, 4.0, 0.5),
                    (SCNVector3(0, 2.0, 22), 44, 4.0, 0.5),
                    (SCNVector3(-22, 2.0, 0), 0.5, 4.0, 44),
                    (SCNVector3(22, 2.0, 0), 0.5, 4.0, 44),
                    (SCNVector3(-6, 1.4, 6), 0.5, 2.8, 10),
                    (SCNVector3(6, 1.4, 2), 0.5, 2.8, 12),
                    (SCNVector3(-6, 1.4, -8), 0.5, 2.8, 10),
                    (SCNVector3(6, 1.4, -12), 0.5, 2.8, 8),
                    (SCNVector3(0, 1.4, 8), 8, 2.8, 0.5),
                    (SCNVector3(0, 1.4, -4), 8, 2.8, 0.5),
                    (SCNVector3(0, 1.4, -14), 10, 2.8, 0.5),
                    (SCNVector3(-10, 1.3, 0), 0.5, 2.6, 8),
                    (SCNVector3(10, 1.3, -4), 0.5, 2.6, 8),
                    (SCNVector3(-3, 1.1, 12), 2.2, 2.2, 2.0)
                ]
            )
        case .station: // Iron Cathedral — denser rail hub
            return Layout(
                groundSize: 50,
                playerSpawn: SCNVector3(0, 1.6, 21),
                enemySpawns: [
                    SCNVector3(-10, 0, 12), SCNVector3(10, 0, 12), SCNVector3(-8, 0, 4),
                    SCNVector3(8, 0, 4), SCNVector3(-10, 0, -2), SCNVector3(10, 0, -2),
                    SCNVector3(0, 0, -8), SCNVector3(-12, 0, -12), SCNVector3(12, 0, -12),
                    SCNVector3(-5, 0, -18), SCNVector3(5, 0, -18), SCNVector3(0, 0, 8),
                    SCNVector3(-7, 0, -14), SCNVector3(7, 0, 0), SCNVector3(0, 0, -20)
                ],
                ammoSpawns: [
                    SCNVector3(-9, 0.4, 16), SCNVector3(9, 0.4, 10), SCNVector3(0, 0.4, 2),
                    SCNVector3(-11, 0.4, -6), SCNVector3(11, 0.4, -10), SCNVector3(-4, 0.4, -14),
                    SCNVector3(4, 0.4, -18), SCNVector3(0, 0.4, 18), SCNVector3(-8, 0.4, -16),
                    SCNVector3(8, 0.4, -4)
                ],
                medkitSpawns: [
                    SCNVector3(0, 0.4, 14), SCNVector3(-6, 0.4, 0), SCNVector3(6, 0.4, -8),
                    SCNVector3(-10, 0.4, -18), SCNVector3(10, 0.4, 6)
                ],
                wallRects: [
                    (SCNVector3(0, 4, -25), 50, 8, 0.7),
                    (SCNVector3(-25, 4, 0), 0.7, 8, 50),
                    (SCNVector3(25, 4, 0), 0.7, 8, 50),
                    (SCNVector3(-12, 2.5, 0), 0.6, 5, 28),
                    (SCNVector3(12, 2.5, 0), 0.6, 5, 28),
                    (SCNVector3(0, 1.8, -6), 16, 3.6, 0.6),
                    (SCNVector3(0, 1.8, 8), 12, 3.6, 0.6),
                    (SCNVector3(0, 1.5, -20), 20, 3, 0.6),
                    (SCNVector3(0, 1.5, 16), 14, 3, 0.6),
                    (SCNVector3(-6, 1.4, -12), 3.0, 2.8, 4),
                    (SCNVector3(6, 1.4, 4), 3.0, 2.8, 4),
                    (SCNVector3(0, 1.6, -2), 4, 3.2, 0.6)
                ]
            )
        case .alpine: // Frost Approach — bridge span
            return Layout(
                groundSize: 48,
                playerSpawn: SCNVector3(0, 1.6, 20),
                enemySpawns: [
                    SCNVector3(-5, 0, 12), SCNVector3(5, 0, 10), SCNVector3(-6, 0, 4),
                    SCNVector3(6, 0, 2), SCNVector3(-4, 0, -4), SCNVector3(4, 0, -6),
                    SCNVector3(0, 0, -10), SCNVector3(-5, 0, -14), SCNVector3(5, 0, -16),
                    SCNVector3(-3, 0, -20), SCNVector3(3, 0, 16), SCNVector3(0, 0, 6),
                    SCNVector3(-6, 0, -8), SCNVector3(6, 0, -12)
                ],
                ammoSpawns: [
                    SCNVector3(-4, 0.4, 14), SCNVector3(4, 0.4, 8), SCNVector3(0, 0.4, 2),
                    SCNVector3(-5, 0.4, -6), SCNVector3(5, 0.4, -10), SCNVector3(0, 0.4, -16),
                    SCNVector3(-3, 0.4, 10), SCNVector3(3, 0.4, -18), SCNVector3(0, 0.4, 18)
                ],
                medkitSpawns: [
                    SCNVector3(3, 0.4, 16), SCNVector3(-3, 0.4, 4), SCNVector3(0, 0.4, -8),
                    SCNVector3(-5, 0.4, -18), SCNVector3(5, 0.4, 12)
                ],
                wallRects: [
                    (SCNVector3(0, 2.2, -24), 18, 4.4, 0.6),
                    (SCNVector3(0, 2.2, 24), 18, 4.4, 0.6),
                    (SCNVector3(-9, 2.0, 0), 0.6, 4.0, 48),
                    (SCNVector3(9, 2.0, 0), 0.6, 4.0, 48),
                    (SCNVector3(-4, 1.6, 8), 3.5, 3.2, 3.5),
                    (SCNVector3(4, 1.6, 0), 3.5, 3.2, 3.5),
                    (SCNVector3(-4, 1.6, -10), 3.5, 3.2, 3.5),
                    (SCNVector3(4, 1.6, -18), 3.5, 3.2, 3.5),
                    (SCNVector3(0, 1.8, 14), 6, 3.6, 0.6),
                    (SCNVector3(0, 1.8, -14), 6, 3.6, 0.6),
                    (SCNVector3(-5.5, 1.3, -4), 2.4, 2.6, 2.4),
                    (SCNVector3(5.5, 1.3, 10), 2.4, 2.6, 2.4),
                    (SCNVector3(0, 1.4, -2), 3.0, 2.8, 1.5)
                ]
            )
        case .reactor: // Blackout Grid — power complex
            return Layout(
                groundSize: 48,
                playerSpawn: SCNVector3(0, 1.6, 20),
                enemySpawns: [
                    SCNVector3(-10, 0, 10), SCNVector3(10, 0, 8), SCNVector3(-8, 0, 2),
                    SCNVector3(8, 0, 0), SCNVector3(-10, 0, -6), SCNVector3(10, 0, -8),
                    SCNVector3(0, 0, -4), SCNVector3(-6, 0, -12), SCNVector3(6, 0, -14),
                    SCNVector3(0, 0, -18), SCNVector3(-8, 0, 14), SCNVector3(8, 0, -2),
                    SCNVector3(-4, 0, -16), SCNVector3(4, 0, 6), SCNVector3(0, 0, 12)
                ],
                ammoSpawns: [
                    SCNVector3(-8, 0.4, 14), SCNVector3(8, 0.4, 10), SCNVector3(0, 0.4, 4),
                    SCNVector3(-10, 0.4, -2), SCNVector3(10, 0.4, -8), SCNVector3(-5, 0.4, -12),
                    SCNVector3(5, 0.4, -16), SCNVector3(0, 0.4, 16), SCNVector3(-7, 0.4, 6),
                    SCNVector3(7, 0.4, -14)
                ],
                medkitSpawns: [
                    SCNVector3(4, 0.4, 15), SCNVector3(-4, 0.4, 2), SCNVector3(8, 0.4, -6),
                    SCNVector3(-8, 0.4, -16), SCNVector3(0, 0.4, -10)
                ],
                wallRects: [
                    (SCNVector3(0, 2.6, -24), 48, 5.2, 0.7),
                    (SCNVector3(0, 2.6, 24), 48, 5.2, 0.7),
                    (SCNVector3(-24, 2.6, 0), 0.7, 5.2, 48),
                    (SCNVector3(24, 2.6, 0), 0.7, 5.2, 48),
                    (SCNVector3(-10, 2.0, 4), 0.6, 4.0, 14),
                    (SCNVector3(10, 2.0, -4), 0.6, 4.0, 16),
                    (SCNVector3(0, 2.0, -8), 14, 4.0, 0.6),
                    (SCNVector3(0, 2.0, 8), 12, 4.0, 0.6),
                    (SCNVector3(-6, 1.8, -16), 8, 3.6, 0.6),
                    (SCNVector3(6, 1.8, 14), 8, 3.6, 0.6),
                    (SCNVector3(-5, 1.4, 0), 3.2, 2.8, 3.2),
                    (SCNVector3(5, 1.4, -12), 3.2, 2.8, 3.2),
                    (SCNVector3(0, 1.5, 16), 4, 3.0, 0.6)
                ]
            )
        case .compound: // Last Relay — denser finale
            return Layout(
                groundSize: 52,
                playerSpawn: SCNVector3(0, 1.6, 22),
                enemySpawns: [
                    SCNVector3(-10, 0, 14), SCNVector3(10, 0, 14), SCNVector3(-12, 0, 6),
                    SCNVector3(12, 0, 6), SCNVector3(-10, 0, -2), SCNVector3(10, 0, -2),
                    SCNVector3(-8, 0, -8), SCNVector3(8, 0, -8), SCNVector3(0, 0, -12),
                    SCNVector3(-14, 0, -16), SCNVector3(14, 0, -16), SCNVector3(-6, 0, 10),
                    SCNVector3(6, 0, 2), SCNVector3(0, 0, -20), SCNVector3(-10, 0, -20),
                    SCNVector3(10, 0, -20), SCNVector3(0, 0, 8), SCNVector3(-4, 0, -14)
                ],
                ammoSpawns: [
                    SCNVector3(-8, 0.4, 18), SCNVector3(8, 0.4, 12), SCNVector3(0, 0.4, 6),
                    SCNVector3(-12, 0.4, -2), SCNVector3(12, 0.4, -6), SCNVector3(0, 0.4, -10),
                    SCNVector3(-6, 0.4, -16), SCNVector3(6, 0.4, -20), SCNVector3(-14, 0.4, 10),
                    SCNVector3(14, 0.4, -14)
                ],
                medkitSpawns: [
                    SCNVector3(4, 0.4, 18), SCNVector3(-4, 0.4, 4), SCNVector3(10, 0.4, -4),
                    SCNVector3(-10, 0.4, -12), SCNVector3(0, 0.4, 12), SCNVector3(0, 0.4, -18)
                ],
                wallRects: [
                    (SCNVector3(0, 2.8, -26), 52, 5.6, 0.8),
                    (SCNVector3(0, 2.8, 26), 52, 5.6, 0.8),
                    (SCNVector3(-26, 2.8, 0), 0.8, 5.6, 52),
                    (SCNVector3(26, 2.8, 0), 0.8, 5.6, 52),
                    (SCNVector3(-10, 2.2, 6), 0.7, 4.4, 18),
                    (SCNVector3(10, 2.2, -2), 0.7, 4.4, 18),
                    (SCNVector3(0, 2.2, -6), 18, 4.4, 0.7),
                    (SCNVector3(0, 3, -18), 12, 6, 12),
                    (SCNVector3(0, 2.0, 12), 14, 4.0, 0.7),
                    (SCNVector3(-6, 1.5, 0), 3.5, 3.0, 3.5),
                    (SCNVector3(6, 1.5, 8), 3.5, 3.0, 3.5),
                    (SCNVector3(-14, 1.4, -8), 3.0, 2.8, 3.0),
                    (SCNVector3(14, 1.4, -10), 3.0, 2.8, 3.0)
                ]
            )

        // MARK: DLC maps
        case .archive: // Echo Cache — server farm aisles
            return Layout(
                groundSize: 46,
                playerSpawn: SCNVector3(0, 1.6, 19),
                enemySpawns: [
                    SCNVector3(-7, 0, 10), SCNVector3(7, 0, 8), SCNVector3(-9, 0, 2),
                    SCNVector3(9, 0, 0), SCNVector3(-6, 0, -6), SCNVector3(6, 0, -8),
                    SCNVector3(0, 0, -12), SCNVector3(-10, 0, -14), SCNVector3(10, 0, -16),
                    SCNVector3(-4, 0, -18), SCNVector3(4, 0, 12), SCNVector3(-5, 0, -2),
                    SCNVector3(5, 0, -10), SCNVector3(0, 0, 4), SCNVector3(8, 0, -4)
                ],
                ammoSpawns: [
                    SCNVector3(-6, 0.4, 14), SCNVector3(6, 0.4, 10), SCNVector3(0, 0.4, 4),
                    SCNVector3(-10, 0.4, -4), SCNVector3(10, 0.4, -8), SCNVector3(-4, 0.4, -14),
                    SCNVector3(4, 0.4, -17), SCNVector3(0, 0.4, 16), SCNVector3(-8, 0.4, 0),
                    SCNVector3(8, 0.4, -12)
                ],
                medkitSpawns: [
                    SCNVector3(5, 0.4, 16), SCNVector3(-5, 0.4, 6), SCNVector3(9, 0.4, -6),
                    SCNVector3(-9, 0.4, -16), SCNVector3(0, 0.4, -8)
                ],
                wallRects: [
                    (SCNVector3(0, 2.2, -23), 46, 4.4, 0.5),
                    (SCNVector3(0, 2.2, 23), 46, 4.4, 0.5),
                    (SCNVector3(-23, 2.2, 0), 0.5, 4.4, 46),
                    (SCNVector3(23, 2.2, 0), 0.5, 4.4, 46),
                    (SCNVector3(-7, 1.8, 4), 0.5, 3.6, 16),
                    (SCNVector3(7, 1.8, -4), 0.5, 3.6, 16),
                    (SCNVector3(0, 1.8, -8), 10, 3.6, 0.5),
                    (SCNVector3(-4, 1.6, -16), 8, 3.2, 0.5),
                    (SCNVector3(4, 1.6, 12), 8, 3.2, 0.5),
                    (SCNVector3(0, 1.7, 8), 0.5, 3.4, 10),
                    (SCNVector3(-11, 1.4, -8), 2.4, 2.8, 4),
                    (SCNVector3(11, 1.4, 4), 2.4, 2.8, 4),
                    (SCNVector3(0, 1.3, 0), 3.0, 2.6, 2.0)
                ]
            )
        case .fogPier: // Salt Wake — denser fog pier
            return Layout(
                groundSize: 50,
                playerSpawn: SCNVector3(0, 1.6, 21),
                enemySpawns: [
                    SCNVector3(-9, 0, 12), SCNVector3(9, 0, 10), SCNVector3(-11, 0, 4),
                    SCNVector3(11, 0, 2), SCNVector3(-8, 0, -4), SCNVector3(8, 0, -6),
                    SCNVector3(0, 0, -10), SCNVector3(-10, 0, -14), SCNVector3(10, 0, -16),
                    SCNVector3(-5, 0, -18), SCNVector3(5, 0, 14), SCNVector3(-6, 0, 0),
                    SCNVector3(6, 0, -8), SCNVector3(0, 0, 6), SCNVector3(0, 0, -20),
                    SCNVector3(-12, 0, -8)
                ],
                ammoSpawns: [
                    SCNVector3(-8, 0.4, 16), SCNVector3(8, 0.4, 12), SCNVector3(0, 0.4, 6),
                    SCNVector3(-12, 0.4, -2), SCNVector3(12, 0.4, -6), SCNVector3(-4, 0.4, -12),
                    SCNVector3(4, 0.4, -16), SCNVector3(0, 0.4, 18), SCNVector3(-10, 0.4, 8),
                    SCNVector3(10, 0.4, -14)
                ],
                medkitSpawns: [
                    SCNVector3(5, 0.4, 18), SCNVector3(-5, 0.4, 8), SCNVector3(11, 0.4, -4),
                    SCNVector3(-11, 0.4, -12), SCNVector3(0, 0.4, -8)
                ],
                wallRects: [
                    (SCNVector3(0, 2.2, -25), 50, 4.4, 0.6),
                    (SCNVector3(0, 2.2, 25), 50, 4.4, 0.6),
                    (SCNVector3(-25, 2.2, 0), 0.6, 4.4, 50),
                    (SCNVector3(25, 2.2, 0), 0.6, 4.4, 50),
                    (SCNVector3(-10, 1.8, 6), 0.6, 3.6, 14),
                    (SCNVector3(10, 1.8, -4), 0.6, 3.6, 16),
                    (SCNVector3(0, 1.8, -6), 14, 3.6, 0.6),
                    (SCNVector3(-6, 1.6, -16), 10, 3.2, 0.6),
                    (SCNVector3(6, 1.6, 14), 10, 3.2, 0.6),
                    (SCNVector3(-4, 1.3, 2), 3.0, 2.6, 3.0),
                    (SCNVector3(4, 1.3, -12), 3.0, 2.6, 3.0),
                    (SCNVector3(0, 1.4, 10), 5, 2.8, 0.5)
                ]
            )
        case .ghostCanyon: // Mirror Static — haunted glass corridor
            return Layout(
                groundSize: 50,
                playerSpawn: SCNVector3(0, 1.6, 21),
                enemySpawns: [
                    SCNVector3(-3, 0, 14), SCNVector3(3, 0, 12), SCNVector3(-4, 0, 6),
                    SCNVector3(4, 0, 4), SCNVector3(-3, 0, -2), SCNVector3(3, 0, -6),
                    SCNVector3(0, 0, -10), SCNVector3(-5, 0, -14), SCNVector3(5, 0, -16),
                    SCNVector3(-2, 0, -20), SCNVector3(2, 0, 18), SCNVector3(4, 0, 0),
                    SCNVector3(-4, 0, -8), SCNVector3(0, 0, 8), SCNVector3(0, 0, -18),
                    SCNVector3(-5, 0, 10)
                ],
                ammoSpawns: [
                    SCNVector3(-4, 0.4, 16), SCNVector3(4, 0.4, 12), SCNVector3(0, 0.4, 6),
                    SCNVector3(-5, 0.4, 0), SCNVector3(5, 0.4, -4), SCNVector3(0, 0.4, -10),
                    SCNVector3(-3, 0.4, -16), SCNVector3(3, 0.4, -20), SCNVector3(0, 0.4, 18),
                    SCNVector3(-4, 0.4, -12)
                ],
                medkitSpawns: [
                    SCNVector3(3, 0.4, 18), SCNVector3(-3, 0.4, 8), SCNVector3(4, 0.4, -2),
                    SCNVector3(-4, 0.4, -10), SCNVector3(0, 0.4, -6), SCNVector3(0, 0.4, 12)
                ],
                wallRects: [
                    (SCNVector3(0, 2.4, -25), 18, 4.8, 0.6),
                    (SCNVector3(0, 2.4, 25), 18, 4.8, 0.6),
                    (SCNVector3(-9, 2.4, 0), 0.6, 4.8, 50),
                    (SCNVector3(9, 2.4, 0), 0.6, 4.8, 50),
                    (SCNVector3(-4, 1.6, 8), 4, 3.2, 0.5),
                    (SCNVector3(4, 1.6, -4), 4, 3.2, 0.5),
                    (SCNVector3(0, 1.6, -12), 8, 3.2, 0.5),
                    (SCNVector3(-3, 1.4, 16), 3, 2.8, 0.5),
                    (SCNVector3(3, 1.4, -16), 3, 2.8, 0.5),
                    (SCNVector3(0, 1.3, 2), 3.5, 2.6, 1.5),
                    (SCNVector3(-3.5, 1.2, -8), 2.0, 2.4, 2.0),
                    (SCNVector3(3.5, 1.2, 12), 2.0, 2.4, 2.0)
                ]
            )
        case .nullVault: // Null Horizon — subterranean finale
            return Layout(
                groundSize: 54,
                playerSpawn: SCNVector3(0, 1.6, 23),
                enemySpawns: [
                    SCNVector3(-11, 0, 14), SCNVector3(11, 0, 14), SCNVector3(-13, 0, 6),
                    SCNVector3(13, 0, 6), SCNVector3(-10, 0, -2), SCNVector3(10, 0, -2),
                    SCNVector3(-8, 0, -8), SCNVector3(8, 0, -8), SCNVector3(0, 0, -12),
                    SCNVector3(-14, 0, -16), SCNVector3(14, 0, -16), SCNVector3(-6, 0, 10),
                    SCNVector3(6, 0, 2), SCNVector3(0, 0, -20), SCNVector3(-10, 0, -20),
                    SCNVector3(10, 0, -20), SCNVector3(0, 0, 8), SCNVector3(-4, 0, -14)
                ],
                ammoSpawns: [
                    SCNVector3(-8, 0.4, 18), SCNVector3(8, 0.4, 12), SCNVector3(0, 0.4, 6),
                    SCNVector3(-12, 0.4, -2), SCNVector3(12, 0.4, -6), SCNVector3(0, 0.4, -10),
                    SCNVector3(-6, 0.4, -16), SCNVector3(6, 0.4, -20), SCNVector3(-14, 0.4, 10),
                    SCNVector3(14, 0.4, -14), SCNVector3(0, 0.4, 16)
                ],
                medkitSpawns: [
                    SCNVector3(4, 0.4, 18), SCNVector3(-4, 0.4, 4), SCNVector3(10, 0.4, -4),
                    SCNVector3(-10, 0.4, -12), SCNVector3(0, 0.4, 12), SCNVector3(0, 0.4, -18)
                ],
                wallRects: [
                    (SCNVector3(0, 2.8, -27), 54, 5.6, 0.8),
                    (SCNVector3(0, 2.8, 27), 54, 5.6, 0.8),
                    (SCNVector3(-27, 2.8, 0), 0.8, 5.6, 54),
                    (SCNVector3(27, 2.8, 0), 0.8, 5.6, 54),
                    (SCNVector3(-11, 2.2, 6), 0.7, 4.4, 18),
                    (SCNVector3(11, 2.2, -2), 0.7, 4.4, 18),
                    (SCNVector3(0, 2.2, -6), 18, 4.4, 0.7),
                    (SCNVector3(0, 3.2, -18), 14, 6.4, 14),
                    (SCNVector3(0, 2.0, 12), 14, 4.0, 0.7),
                    (SCNVector3(-8, 1.8, -14), 0.6, 3.6, 8),
                    (SCNVector3(8, 1.8, -14), 0.6, 3.6, 8),
                    (SCNVector3(-6, 1.5, 2), 3.2, 3.0, 3.2),
                    (SCNVector3(6, 1.5, 8), 3.2, 3.0, 3.2),
                    (SCNVector3(0, 1.6, -10), 4, 3.2, 0.6)
                ]
            )
        }
    }

    // MARK: - Atmosphere

    private static func skyColor(for style: MissionMapStyle) -> UIColor {
        switch style {
        case .warehouse: return UIColor(red: 0.08, green: 0.09, blue: 0.1, alpha: 1)
        case .streets: return UIColor(red: 0.45, green: 0.55, blue: 0.68, alpha: 1)
        case .metro: return UIColor(red: 0.04, green: 0.05, blue: 0.06, alpha: 1)
        case .docks: return UIColor(red: 0.1, green: 0.14, blue: 0.2, alpha: 1)
        case .bazaar: return UIColor(red: 0.12, green: 0.08, blue: 0.14, alpha: 1)
        case .station: return UIColor(red: 0.16, green: 0.14, blue: 0.12, alpha: 1)
        case .alpine: return UIColor(red: 0.62, green: 0.72, blue: 0.82, alpha: 1)
        case .reactor: return UIColor(red: 0.1, green: 0.12, blue: 0.1, alpha: 1)
        case .compound: return UIColor(red: 0.55, green: 0.62, blue: 0.7, alpha: 1)
        case .archive: return UIColor(red: 0.04, green: 0.08, blue: 0.1, alpha: 1)
        case .fogPier: return UIColor(red: 0.14, green: 0.18, blue: 0.24, alpha: 1)
        case .ghostCanyon: return UIColor(red: 0.28, green: 0.22, blue: 0.4, alpha: 1)
        case .nullVault: return UIColor(red: 0.08, green: 0.04, blue: 0.08, alpha: 1)
        }
    }

    private static func addLighting(to scene: SCNScene, style: MissionMapStyle) {
        let ambient = SCNNode()
        ambient.light = SCNLight()
        ambient.light?.type = .ambient
        ambient.light?.intensity = {
            switch style {
            case .warehouse, .metro, .archive, .nullVault: return 240
            case .streets, .ghostCanyon: return 500
            case .docks, .fogPier: return 300
            case .bazaar: return 320
            case .station: return 360
            case .alpine: return 620
            case .reactor: return 280
            case .compound: return 560
            }
        }()
        ambient.light?.color = {
            switch style {
            case .warehouse: return UIColor(red: 1, green: 0.72, blue: 0.55, alpha: 1)
            case .streets: return UIColor(white: 0.9, alpha: 1)
            case .metro: return UIColor(red: 0.55, green: 0.7, blue: 0.85, alpha: 1)
            case .docks: return UIColor(red: 0.7, green: 0.8, blue: 1, alpha: 1)
            case .bazaar: return UIColor(red: 1, green: 0.65, blue: 0.45, alpha: 1)
            case .station: return UIColor(red: 1, green: 0.85, blue: 0.7, alpha: 1)
            case .alpine: return UIColor(red: 0.9, green: 0.95, blue: 1, alpha: 1)
            case .reactor: return UIColor(red: 0.55, green: 1, blue: 0.6, alpha: 1)
            case .compound: return UIColor(red: 0.9, green: 0.95, blue: 1, alpha: 1)
            case .archive: return UIColor(red: 0.45, green: 0.9, blue: 1, alpha: 1)
            case .fogPier: return UIColor(red: 0.75, green: 0.85, blue: 1, alpha: 1)
            case .ghostCanyon: return UIColor(red: 0.75, green: 0.55, blue: 1, alpha: 1)
            case .nullVault: return UIColor(red: 1, green: 0.35, blue: 0.55, alpha: 1)
            }
        }()
        scene.rootNode.addChildNode(ambient)

        let key = SCNNode()
        key.light = SCNLight()
        key.light?.type = .directional
        key.light?.intensity = (style == .warehouse || style == .docks || style == .metro || style == .reactor
            || style == .archive || style == .fogPier || style == .nullVault) ? 720 : 980
        key.light?.castsShadow = false
        key.eulerAngles = SCNVector3(-0.95, 0.45, 0)
        scene.rootNode.addChildNode(key)

        // Cap: one accent omni per map for biome mood (no shadows).
        let accent: (UIColor, Float, SCNVector3)? = {
            switch style {
            case .warehouse: return (UIColor(red: 1, green: 0.55, blue: 0.25, alpha: 1), 380, SCNVector3(0, 5.5, 0))
            case .streets: return (UIColor(red: 0.85, green: 0.9, blue: 1, alpha: 1), 280, SCNVector3(0, 8, 0))
            case .metro: return (UIColor(red: 0.55, green: 0.8, blue: 1, alpha: 1), 420, SCNVector3(0, 3.8, 4))
            case .docks: return (UIColor(red: 0.6, green: 0.75, blue: 1, alpha: 1), 360, SCNVector3(0, 6, -8))
            case .bazaar: return (UIColor(red: 1, green: 0.55, blue: 0.2, alpha: 1), 400, SCNVector3(0, 4.5, 0))
            case .station: return (UIColor(red: 1, green: 0.8, blue: 0.5, alpha: 1), 340, SCNVector3(0, 7, -4))
            case .alpine: return (UIColor(red: 0.85, green: 0.92, blue: 1, alpha: 1), 260, SCNVector3(0, 9, 0))
            case .reactor: return (UIColor(red: 0.4, green: 1, blue: 0.45, alpha: 1), 400, SCNVector3(0, 5, -6))
            case .compound: return (UIColor(red: 0.9, green: 0.95, blue: 1, alpha: 1), 300, SCNVector3(0, 8, -10))
            case .archive: return (UIColor(red: 0.3, green: 0.9, blue: 1, alpha: 1), 440, SCNVector3(0, 4, -8))
            case .fogPier: return (UIColor(red: 0.7, green: 0.85, blue: 1, alpha: 1), 320, SCNVector3(0, 5, -6))
            case .ghostCanyon: return (UIColor(red: 0.7, green: 0.4, blue: 1, alpha: 1), 380, SCNVector3(0, 6, 0))
            case .nullVault: return (UIColor(red: 1, green: 0.2, blue: 0.5, alpha: 1), 460, SCNVector3(0, 5.5, -12))
            }
        }()
        if let (color, intensity, pos) = accent {
            let omni = SCNNode()
            omni.light = SCNLight()
            omni.light?.type = .omni
            omni.light?.intensity = CGFloat(intensity)
            omni.light?.color = color
            omni.light?.attenuationStartDistance = 3
            omni.light?.attenuationEndDistance = 22
            omni.light?.castsShadow = false
            omni.position = pos
            omni.name = "accentLight"
            scene.rootNode.addChildNode(omni)
        }
    }

    private static func buildGround(in scene: SCNScene, style: MissionMapStyle, size: Float) {
        let color: UIColor = {
            switch style {
            case .warehouse: return UIColor(red: 0.18, green: 0.17, blue: 0.15, alpha: 1)
            case .streets: return UIColor(red: 0.2, green: 0.2, blue: 0.22, alpha: 1)
            case .metro: return UIColor(red: 0.14, green: 0.14, blue: 0.16, alpha: 1)
            case .docks: return UIColor(red: 0.25, green: 0.22, blue: 0.18, alpha: 1)
            case .bazaar: return UIColor(red: 0.28, green: 0.2, blue: 0.16, alpha: 1)
            case .station: return UIColor(red: 0.28, green: 0.26, blue: 0.24, alpha: 1)
            case .alpine: return UIColor(red: 0.72, green: 0.78, blue: 0.84, alpha: 1)
            case .reactor: return UIColor(red: 0.16, green: 0.18, blue: 0.15, alpha: 1)
            case .compound: return UIColor(red: 0.32, green: 0.34, blue: 0.3, alpha: 1)
            case .archive: return UIColor(red: 0.12, green: 0.14, blue: 0.16, alpha: 1)
            case .fogPier: return UIColor(red: 0.22, green: 0.2, blue: 0.18, alpha: 1)
            case .ghostCanyon: return UIColor(red: 0.16, green: 0.14, blue: 0.2, alpha: 1)
            case .nullVault: return UIColor(red: 0.14, green: 0.1, blue: 0.14, alpha: 1)
            }
        }()
        let ground = SCNPlane(width: CGFloat(size + 4), height: CGFloat(size + 4))
        ground.firstMaterial?.diffuse.contents = color
        ground.firstMaterial?.lightingModel = .constant
        ground.firstMaterial?.isDoubleSided = true
        let node = SCNNode(geometry: ground)
        node.name = "ground"
        node.eulerAngles.x = -.pi / 2
        scene.rootNode.addChildNode(node)

        if style == .docks || style == .fogPier {
            let water = SCNPlane(width: CGFloat(size + 8), height: CGFloat(size * 0.45))
            water.firstMaterial?.diffuse.contents = UIColor(red: 0.07, green: 0.16, blue: 0.26, alpha: 1)
            water.firstMaterial?.lightingModel = .constant
            water.firstMaterial?.isDoubleSided = true
            let waterNode = SCNNode(geometry: water)
            waterNode.eulerAngles.x = -.pi / 2
            waterNode.position = SCNVector3(0, -0.12, -size * 0.35)
            waterNode.name = "deco_water"
            scene.rootNode.addChildNode(waterNode)
            // Pier plank stripes
            let plank = SCNBox(width: CGFloat(size * 0.7), height: 0.03, length: 0.55, chamferRadius: 0)
            plank.firstMaterial?.diffuse.contents = UIColor(red: 0.32, green: 0.26, blue: 0.18, alpha: 1)
            plank.firstMaterial?.lightingModel = .constant
            for (i, zOff) in [Float(-2), 2, 6].enumerated() {
                let p = SCNNode(geometry: plank)
                p.position = SCNVector3(0, 0.02, zOff)
                p.name = "deco_plank_\(i)"
                scene.rootNode.addChildNode(p)
            }
        }

        if style == .streets || style == .ghostCanyon {
            let stripe = SCNBox(width: 0.28, height: 0.02, length: CGFloat(size * 0.85), chamferRadius: 0)
            stripe.firstMaterial?.diffuse.contents = style == .ghostCanyon
                ? UIColor(red: 0.7, green: 0.5, blue: 1, alpha: 1)
                : UIColor(white: 0.85, alpha: 1)
            stripe.firstMaterial?.lightingModel = .constant
            if style == .ghostCanyon {
                stripe.firstMaterial?.emission.contents = UIColor(red: 0.4, green: 0.25, blue: 0.7, alpha: 0.35)
            }
            let n = SCNNode(geometry: stripe)
            n.position = SCNVector3(0, 0.02, 0)
            n.name = "deco_stripe"
            scene.rootNode.addChildNode(n)
            // Sidewalk edges
            for x: Float in [-3.4, 3.4] {
                let curb = SCNBox(width: 0.35, height: 0.08, length: CGFloat(size * 0.8), chamferRadius: 0)
                curb.firstMaterial?.diffuse.contents = UIColor(white: 0.45, alpha: 1)
                curb.firstMaterial?.lightingModel = .constant
                let c = SCNNode(geometry: curb)
                c.position = SCNVector3(x, 0.04, 0)
                c.name = "deco_curb"
                scene.rootNode.addChildNode(c)
            }
        }

        if style == .metro {
            let rail = SCNBox(width: 0.12, height: 0.05, length: CGFloat(size * 0.9), chamferRadius: 0)
            rail.firstMaterial?.diffuse.contents = UIColor(white: 0.35, alpha: 1)
            rail.firstMaterial?.lightingModel = .constant
            for x: Float in [-1.4, 1.4] {
                let n = SCNNode(geometry: rail)
                n.position = SCNVector3(x, 0.03, 0)
                n.name = "deco_rail"
                scene.rootNode.addChildNode(n)
            }
            // Platform edge yellow line
            for x: Float in [-5.2, 5.2] {
                let edge = SCNBox(width: 0.2, height: 0.03, length: CGFloat(size * 0.75), chamferRadius: 0)
                edge.firstMaterial?.diffuse.contents = UIColor(red: 0.9, green: 0.75, blue: 0.15, alpha: 1)
                edge.firstMaterial?.lightingModel = .constant
                let e = SCNNode(geometry: edge)
                e.position = SCNVector3(x, 0.03, 0)
                e.name = "deco_platform_edge"
                scene.rootNode.addChildNode(e)
            }
        }

        if style == .reactor || style == .archive {
            // Grid floor lines
            let line = SCNBox(width: CGFloat(size * 0.7), height: 0.02, length: 0.08, chamferRadius: 0)
            let lineColor = style == .archive
                ? UIColor(red: 0.2, green: 0.7, blue: 0.9, alpha: 1)
                : UIColor(red: 0.3, green: 0.7, blue: 0.35, alpha: 1)
            line.firstMaterial?.diffuse.contents = lineColor
            line.firstMaterial?.emission.contents = lineColor.withAlphaComponent(0.25)
            line.firstMaterial?.lightingModel = .constant
            for (i, z) in [Float(-10), 0, 10].enumerated() {
                let n = SCNNode(geometry: line)
                n.position = SCNVector3(0, 0.02, z)
                n.name = "deco_grid_\(i)"
                scene.rootNode.addChildNode(n)
            }
        }

        if style == .alpine {
            // Packed ice patches
            let ice = SCNBox(width: 4.5, height: 0.03, length: 3.2, chamferRadius: 0)
            ice.firstMaterial?.diffuse.contents = UIColor(red: 0.82, green: 0.88, blue: 0.95, alpha: 1)
            ice.firstMaterial?.lightingModel = .constant
            for (i, pos) in [SCNVector3(-3, 0.02, 6), SCNVector3(3, 0.02, -8), SCNVector3(0, 0.02, -2)].enumerated() {
                let n = SCNNode(geometry: ice)
                n.position = pos
                n.name = "deco_ice_\(i)"
                scene.rootNode.addChildNode(n)
            }
        }

        if style == .bazaar {
            // Carpet runners down alleys
            let carpet = SCNBox(width: 1.8, height: 0.025, length: CGFloat(size * 0.35), chamferRadius: 0)
            carpet.firstMaterial?.diffuse.contents = UIColor(red: 0.55, green: 0.18, blue: 0.22, alpha: 1)
            carpet.firstMaterial?.lightingModel = .constant
            for (i, x) in [Float(-3), 3].enumerated() {
                let n = SCNNode(geometry: carpet)
                n.position = SCNVector3(x, 0.02, -2)
                n.name = "deco_carpet_\(i)"
                scene.rootNode.addChildNode(n)
            }
        }

        if style == .nullVault {
            let ring = SCNTorus(ringRadius: CGFloat(size * 0.18), pipeRadius: 0.08)
            ring.firstMaterial?.diffuse.contents = UIColor(red: 1, green: 0.25, blue: 0.5, alpha: 1)
            ring.firstMaterial?.emission.contents = UIColor(red: 0.6, green: 0.1, blue: 0.3, alpha: 0.5)
            ring.firstMaterial?.lightingModel = .constant
            let r = SCNNode(geometry: ring)
            r.eulerAngles.x = .pi / 2
            r.position = SCNVector3(0, 0.06, 0)
            r.name = "deco_null_floor_ring"
            scene.rootNode.addChildNode(r)
        }
    }

    private static func buildWalls(
        in scene: SCNScene,
        layout: Layout,
        style: MissionMapStyle,
        colliders: inout [Collider]
    ) {
        let wallColor: UIColor = {
            switch style {
            case .warehouse: return UIColor(red: 0.32, green: 0.3, blue: 0.26, alpha: 1)
            case .streets: return UIColor(red: 0.4, green: 0.5, blue: 0.6, alpha: 1)
            case .metro: return UIColor(red: 0.22, green: 0.24, blue: 0.28, alpha: 1)
            case .docks: return UIColor(red: 0.35, green: 0.32, blue: 0.28, alpha: 1)
            case .bazaar: return UIColor(red: 0.45, green: 0.28, blue: 0.2, alpha: 1)
            case .station: return UIColor(red: 0.4, green: 0.28, blue: 0.2, alpha: 1)
            case .alpine: return UIColor(red: 0.55, green: 0.6, blue: 0.65, alpha: 1)
            case .reactor: return UIColor(red: 0.3, green: 0.35, blue: 0.3, alpha: 1)
            case .compound: return UIColor(red: 0.38, green: 0.4, blue: 0.35, alpha: 1)
            case .archive: return UIColor(red: 0.2, green: 0.28, blue: 0.32, alpha: 1)
            case .fogPier: return UIColor(red: 0.32, green: 0.3, blue: 0.28, alpha: 1)
            case .ghostCanyon: return UIColor(red: 0.35, green: 0.3, blue: 0.5, alpha: 1)
            case .nullVault: return UIColor(red: 0.32, green: 0.18, blue: 0.28, alpha: 1)
            }
        }()

        for (i, wall) in layout.wallRects.enumerated() {
            let (center, w, h, d) = wall
            let box = SCNBox(width: CGFloat(w), height: CGFloat(h), length: CGFloat(d), chamferRadius: 0)
            box.firstMaterial?.diffuse.contents = wallColor
            box.firstMaterial?.lightingModel = .constant
            let node = SCNNode(geometry: box)
            node.name = "wall_\(i)"
            node.position = center
            scene.rootNode.addChildNode(node)
            colliders.append(.fromBox(center: center, width: w, depth: d))
        }
    }

    // MARK: - Mission-specific set dressing

    private static func buildMissionMap(
        in scene: SCNScene,
        style: MissionMapStyle,
        layout: Layout,
        colliders: inout [Collider]
    ) {
        switch style {
        case .warehouse: buildBrokenSignal(in: scene, colliders: &colliders)
        case .streets: buildGlassCorridor(in: scene, colliders: &colliders)
        case .metro: buildSilentSubway(in: scene, colliders: &colliders)
        case .docks: buildNightFerry(in: scene, colliders: &colliders)
        case .bazaar: buildRedBazaar(in: scene, colliders: &colliders)
        case .station: buildIronCathedral(in: scene, colliders: &colliders)
        case .alpine: buildFrostApproach(in: scene, colliders: &colliders)
        case .reactor: buildBlackoutGrid(in: scene, colliders: &colliders)
        case .compound: buildLastRelay(in: scene, colliders: &colliders)
        case .archive: buildEchoCache(in: scene, colliders: &colliders)
        case .fogPier: buildSaltWake(in: scene, colliders: &colliders)
        case .ghostCanyon: buildMirrorStatic(in: scene, colliders: &colliders)
        case .nullVault: buildNullHorizon(in: scene, colliders: &colliders)
        }
        _ = layout
    }

    /// Broken Signal — relay warehouse (lean node count)
    private static func buildBrokenSignal(in scene: SCNScene, colliders: inout [Collider]) {
        let rust = UIColor(red: 0.45, green: 0.28, blue: 0.12, alpha: 1)
        let metal = UIColor(white: 0.22, alpha: 1)

        for (i, x) in [Float(-14), 14].enumerated() {
            let mast = SCNCylinder(radius: 0.18, height: 11)
            mast.firstMaterial?.diffuse.contents = metal
            mast.firstMaterial?.lightingModel = .constant
            let m = SCNNode(geometry: mast)
            m.position = SCNVector3(x, 5.5, -16)
            m.name = "deco_mast_\(i)"
            scene.rootNode.addChildNode(m)
            // Antenna dish
            let dish = SCNCylinder(radius: 1.2, height: 0.15)
            dish.firstMaterial?.diffuse.contents = UIColor(white: 0.4, alpha: 1)
            dish.firstMaterial?.lightingModel = .constant
            let d = SCNNode(geometry: dish)
            d.eulerAngles.x = 0.7
            d.position = SCNVector3(x, 10.5, -16)
            d.name = "deco_dish_\(i)"
            scene.rootNode.addChildNode(d)
        }

        let rack = SCNBox(width: 7.5, height: 2.2, length: 0.8, chamferRadius: 0)
        rack.firstMaterial?.diffuse.contents = UIColor(white: 0.12, alpha: 1)
        rack.firstMaterial?.lightingModel = .constant
        let n = SCNNode(geometry: rack)
        n.position = SCNVector3(-10, 1.1, 10)
        n.name = "prop_racks"
        scene.rootNode.addChildNode(n)
        colliders.append(.fromBox(center: n.position, width: 7.5, depth: 0.8))

        let rack2 = SCNBox(width: 6.0, height: 2.0, length: 0.8, chamferRadius: 0)
        rack2.firstMaterial?.diffuse.contents = UIColor(white: 0.14, alpha: 1)
        rack2.firstMaterial?.lightingModel = .constant
        let n2 = SCNNode(geometry: rack2)
        n2.position = SCNVector3(10, 1.0, -8)
        n2.name = "prop_racks2"
        scene.rootNode.addChildNode(n2)
        colliders.append(.fromBox(center: n2.position, width: 6.0, depth: 0.8))

        // Forklift landmark (clear of player spawn at z≈18)
        let body = SCNBox(width: 1.6, height: 1.4, length: 2.4, chamferRadius: 0)
        body.firstMaterial?.diffuse.contents = UIColor(red: 0.75, green: 0.55, blue: 0.12, alpha: 1)
        body.firstMaterial?.lightingModel = .constant
        let fl = SCNNode(geometry: body)
        fl.position = SCNVector3(-4, 0.7, 15)
        fl.name = "deco_forklift"
        scene.rootNode.addChildNode(fl)
        colliders.append(.fromBox(center: fl.position, width: 1.6, depth: 2.4))

        for (i, pos) in [
            SCNVector3(-3, 0.55, 12), SCNVector3(4, 0.55, -2), SCNVector3(-2, 0.55, -13),
            SCNVector3(6, 0.55, 6), SCNVector3(-14, 0.55, 2), SCNVector3(14, 0.55, -12)
        ].enumerated() {
            addCrate(in: scene, at: pos, color: rust, name: "prop_sigcrate_\(i)", colliders: &colliders)
        }

        // Stacked crate tower (vertical interest)
        for (i, y) in [Float(0.55), 1.65].enumerated() {
            addCrate(in: scene, at: SCNVector3( -6, y, -10), color: rust, name: "prop_stack_\(i)", colliders: &colliders)
        }

        let beam = SCNBox(width: 32, height: 0.25, length: 0.25, chamferRadius: 0)
        beam.firstMaterial?.diffuse.contents = metal
        beam.firstMaterial?.lightingModel = .constant
        for (i, z) in [Float(-8), 8].enumerated() {
            let b = SCNNode(geometry: beam)
            b.position = SCNVector3(0, 4.8, z)
            b.name = "deco_beam_\(i)"
            scene.rootNode.addChildNode(b)
        }

        // Amber hanging lamp visual
        let lamp = SCNBox(width: 2.4, height: 0.12, length: 0.4, chamferRadius: 0)
        lamp.firstMaterial?.diffuse.contents = UIColor(red: 1, green: 0.7, blue: 0.3, alpha: 1)
        lamp.firstMaterial?.emission.contents = UIColor(red: 0.5, green: 0.25, blue: 0.05, alpha: 1)
        lamp.firstMaterial?.lightingModel = .constant
        let l = SCNNode(geometry: lamp)
        l.position = SCNVector3(0, 4.2, 4)
        l.name = "deco_hang_lamp"
        scene.rootNode.addChildNode(l)
    }

    /// Glass Corridor — midtown avenue
    private static func buildGlassCorridor(in scene: SCNScene, colliders: inout [Collider]) {
        let dark = UIColor(white: 0.15, alpha: 1)
        for (i, z) in [Float(14), 4, -6, -16].enumerated() {
            for x: Float in [-4.6, 4.6] {
                let pole = SCNCylinder(radius: 0.08, height: 3.6)
                pole.firstMaterial?.diffuse.contents = dark
                pole.firstMaterial?.lightingModel = .constant
                let p = SCNNode(geometry: pole)
                p.position = SCNVector3(x, 1.8, z)
                p.name = "deco_lamp_\(i)_\(Int(x))"
                scene.rootNode.addChildNode(p)
                let glow = SCNSphere(radius: 0.16)
                glow.firstMaterial?.diffuse.contents = UIColor(red: 0.9, green: 0.92, blue: 1, alpha: 1)
                glow.firstMaterial?.emission.contents = UIColor(red: 0.5, green: 0.55, blue: 0.7, alpha: 0.4)
                glow.firstMaterial?.lightingModel = .constant
                let g = SCNNode(geometry: glow)
                g.position = SCNVector3(x, 3.5, z)
                g.name = "deco_lamp_glow"
                scene.rootNode.addChildNode(g)
            }
        }

        // Glass facade slabs (visual landmark)
        for (i, x) in [Float(-6.2), 6.2].enumerated() {
            let facade = SCNBox(width: 0.4, height: 8, length: 14, chamferRadius: 0)
            facade.firstMaterial?.diffuse.contents = UIColor(red: 0.45, green: 0.55, blue: 0.65, alpha: 0.9)
            facade.firstMaterial?.lightingModel = .constant
            let f = SCNNode(geometry: facade)
            f.position = SCNVector3(x, 4, -4)
            f.name = "deco_facade_\(i)"
            scene.rootNode.addChildNode(f)
        }

        for (i, pos) in [
            SCNVector3(-2.5, 0.7, 6), SCNVector3(2.5, 0.7, -4), SCNVector3(-2.5, 0.7, -12),
            SCNVector3(2.5, 0.7, 14), SCNVector3(0, 0.7, -18)
        ].enumerated() {
            let cube = SCNBox(width: 1.4, height: 1.4, length: 1.4, chamferRadius: 0)
            cube.firstMaterial?.diffuse.contents = UIColor(red: 0.35, green: 0.45, blue: 0.55, alpha: 1)
            cube.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: cube)
            n.position = pos
            n.name = "prop_plaza_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 1.4, depth: 1.4))
        }

        // Bus stop shelter
        let shelter = SCNBox(width: 3.2, height: 2.4, length: 1.2, chamferRadius: 0)
        shelter.firstMaterial?.diffuse.contents = UIColor(red: 0.3, green: 0.35, blue: 0.42, alpha: 1)
        shelter.firstMaterial?.lightingModel = .constant
        let sh = SCNNode(geometry: shelter)
        sh.position = SCNVector3(-2.8, 1.2, 18)
        sh.name = "prop_shelter"
        scene.rootNode.addChildNode(sh)
        colliders.append(.fromBox(center: sh.position, width: 3.2, depth: 1.2))

        let xwalk = SCNBox(width: 4.5, height: 0.02, length: 2.8, chamferRadius: 0)
        xwalk.firstMaterial?.diffuse.contents = UIColor(white: 0.88, alpha: 1)
        xwalk.firstMaterial?.lightingModel = .constant
        for (i, z) in [Float(16), -8].enumerated() {
            let xw = SCNNode(geometry: xwalk)
            xw.position = SCNVector3(0, 0.02, z)
            xw.name = "deco_xwalk_\(i)"
            scene.rootNode.addChildNode(xw)
        }
    }

    /// Silent Subway — platforms + tunnel props
    private static func buildSilentSubway(in scene: SCNScene, colliders: inout [Collider]) {
        let tile = UIColor(red: 0.2, green: 0.22, blue: 0.26, alpha: 1)
        let rust = UIColor(red: 0.4, green: 0.25, blue: 0.15, alpha: 1)

        for (i, z) in [Float(10), 0, -6, -16].enumerated() {
            let bench = SCNBox(width: 3.2, height: 0.55, length: 0.7, chamferRadius: 0)
            bench.firstMaterial?.diffuse.contents = tile
            bench.firstMaterial?.lightingModel = .constant
            let b = SCNNode(geometry: bench)
            let x: Float = i % 2 == 0 ? -4.2 : 4.2
            b.position = SCNVector3(x, 0.3, z)
            b.name = "prop_bench_\(i)"
            scene.rootNode.addChildNode(b)
            colliders.append(.fromBox(center: b.position, width: 3.2, depth: 0.7))
        }

        let car = SCNBox(width: 3.4, height: 2.8, length: 9, chamferRadius: 0)
        car.firstMaterial?.diffuse.contents = UIColor(white: 0.18, alpha: 1)
        car.firstMaterial?.lightingModel = .constant
        let c = SCNNode(geometry: car)
        c.position = SCNVector3(0, 1.4, -2)
        c.name = "prop_metrocar"
        scene.rootNode.addChildNode(c)
        colliders.append(.fromBox(center: c.position, width: 3.4, depth: 9))

        // Second car further down tunnel (offset so z=-18 spawn stays free)
        let car2 = SCNBox(width: 3.4, height: 2.8, length: 6, chamferRadius: 0)
        car2.firstMaterial?.diffuse.contents = UIColor(white: 0.16, alpha: 1)
        car2.firstMaterial?.lightingModel = .constant
        let c2 = SCNNode(geometry: car2)
        c2.position = SCNVector3(0, 1.4, -20.5)
        c2.name = "prop_metrocar2"
        scene.rootNode.addChildNode(c2)
        colliders.append(.fromBox(center: c2.position, width: 3.4, depth: 6))

        // Support columns
        for (i, z) in [Float(8), -8].enumerated() {
            for x: Float in [-6, 6] {
                let col = SCNCylinder(radius: 0.45, height: 5)
                col.firstMaterial?.diffuse.contents = tile
                col.firstMaterial?.lightingModel = .constant
                let n = SCNNode(geometry: col)
                n.position = SCNVector3(x, 2.5, z)
                n.name = "prop_column_\(i)_\(Int(x))"
                scene.rootNode.addChildNode(n)
                colliders.append(.fromBox(center: n.position, width: 1.0, depth: 1.0))
            }
        }

        for (i, pos) in [SCNVector3(-3, 0.5, 14), SCNVector3(3, 0.5, -12), SCNVector3(-3, 0.5, -4)].enumerated() {
            addCrate(in: scene, at: pos, color: rust, name: "prop_metcrate_\(i)", colliders: &colliders)
        }

        let lamp = SCNBox(width: 8, height: 0.15, length: 0.4, chamferRadius: 0)
        lamp.firstMaterial?.diffuse.contents = UIColor(red: 0.7, green: 0.85, blue: 1.0, alpha: 1)
        lamp.firstMaterial?.emission.contents = UIColor(red: 0.2, green: 0.35, blue: 0.5, alpha: 1)
        lamp.firstMaterial?.lightingModel = .constant
        for (i, z) in [Float(8), -4, -14].enumerated() {
            let l = SCNNode(geometry: lamp)
            l.position = SCNVector3(0, 4.2, z)
            l.name = "deco_fluorescent_\(i)"
            scene.rootNode.addChildNode(l)
        }
    }

    /// Night Ferry — containers + ferry
    private static func buildNightFerry(in scene: SCNScene, colliders: inout [Collider]) {
        let colors: [UIColor] = [
            UIColor(red: 0.7, green: 0.2, blue: 0.15, alpha: 1),
            UIColor(red: 0.15, green: 0.35, blue: 0.65, alpha: 1),
            UIColor(red: 0.75, green: 0.6, blue: 0.15, alpha: 1),
            UIColor(white: 0.85, alpha: 1)
        ]
        let spots: [SCNVector3] = [
            SCNVector3(-9, 1.3, 4), SCNVector3(-9, 1.3, -6), SCNVector3(-9, 1.3, -14),
            SCNVector3(9, 1.3, 6), SCNVector3(9, 1.3, -4), SCNVector3(9, 1.3, -12),
            SCNVector3(-12, 1.3, 10), SCNVector3(12, 1.3, -16)
        ]
        for (i, pos) in spots.enumerated() {
            let box = SCNBox(width: 2.4, height: 2.6, length: 2.4, chamferRadius: 0)
            box.firstMaterial?.diffuse.contents = colors[i % colors.count]
            box.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: box)
            n.position = pos
            n.name = "prop_container_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 2.4, depth: 2.4))
        }

        // Stacked containers (vertical)
        let stack = SCNBox(width: 2.4, height: 2.4, length: 2.4, chamferRadius: 0)
        stack.firstMaterial?.diffuse.contents = colors[1]
        stack.firstMaterial?.lightingModel = .constant
        let st = SCNNode(geometry: stack)
        st.position = SCNVector3(-9, 3.9, 4)
        st.name = "prop_container_stack"
        scene.rootNode.addChildNode(st)

        let hull = SCNBox(width: 16, height: 3.5, length: 4.5, chamferRadius: 0)
        hull.firstMaterial?.diffuse.contents = UIColor(white: 0.2, alpha: 1)
        hull.firstMaterial?.lightingModel = .constant
        let ferry = SCNNode(geometry: hull)
        ferry.position = SCNVector3(0, 1.5, -20)
        ferry.name = "deco_ferry"
        scene.rootNode.addChildNode(ferry)

        // Crane mast
        let crane = SCNBox(width: 1.0, height: 10, length: 1.0, chamferRadius: 0)
        crane.firstMaterial?.diffuse.contents = UIColor(red: 0.7, green: 0.55, blue: 0.15, alpha: 1)
        crane.firstMaterial?.lightingModel = .constant
        let cr = SCNNode(geometry: crane)
        cr.position = SCNVector3(16, 5, 0)
        cr.name = "deco_crane"
        scene.rootNode.addChildNode(cr)
        let arm = SCNBox(width: 12, height: 0.4, length: 0.4, chamferRadius: 0)
        arm.firstMaterial?.diffuse.contents = UIColor(red: 0.7, green: 0.55, blue: 0.15, alpha: 1)
        arm.firstMaterial?.lightingModel = .constant
        let a = SCNNode(geometry: arm)
        a.position = SCNVector3(10, 9.5, 0)
        a.name = "deco_crane_arm"
        scene.rootNode.addChildNode(a)

        // Bollards
        for (i, x) in [Float(-4), 0, 4].enumerated() {
            let bollard = SCNCylinder(radius: 0.25, height: 1.0)
            bollard.firstMaterial?.diffuse.contents = UIColor(white: 0.3, alpha: 1)
            bollard.firstMaterial?.lightingModel = .constant
            let b = SCNNode(geometry: bollard)
            b.position = SCNVector3(x, 0.5, 18)
            b.name = "prop_bollard_\(i)"
            scene.rootNode.addChildNode(b)
            colliders.append(.fromBox(center: b.position, width: 0.6, depth: 0.6))
        }
    }

    /// Red Bazaar — stalls + lantern poles
    private static func buildRedBazaar(in scene: SCNScene, colliders: inout [Collider]) {
        let cloth: [UIColor] = [
            UIColor(red: 0.75, green: 0.2, blue: 0.15, alpha: 1),
            UIColor(red: 0.85, green: 0.55, blue: 0.15, alpha: 1),
            UIColor(red: 0.25, green: 0.45, blue: 0.35, alpha: 1),
            UIColor(red: 0.45, green: 0.2, blue: 0.5, alpha: 1)
        ]
        let stalls: [SCNVector3] = [
            SCNVector3(-5, 0.9, 8), SCNVector3(5, 0.9, 4), SCNVector3(-5, 0.9, -2),
            SCNVector3(5, 0.9, -8), SCNVector3(-5, 0.9, -14), SCNVector3(5, 0.9, 12),
            SCNVector3(-10, 0.9, 6), SCNVector3(10, 0.9, -6)
        ]
        for (i, pos) in stalls.enumerated() {
            let stall = SCNBox(width: 2.2, height: 1.8, length: 1.6, chamferRadius: 0)
            stall.firstMaterial?.diffuse.contents = cloth[i % cloth.count]
            stall.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: stall)
            n.position = pos
            n.name = "prop_stall_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 2.2, depth: 1.6))
            // Awning
            let awn = SCNBox(width: 2.4, height: 0.08, length: 1.8, chamferRadius: 0)
            awn.firstMaterial?.diffuse.contents = cloth[(i + 1) % cloth.count]
            awn.firstMaterial?.lightingModel = .constant
            let aw = SCNNode(geometry: awn)
            aw.position = SCNVector3(pos.x, 1.95, pos.z)
            aw.name = "deco_awning_\(i)"
            scene.rootNode.addChildNode(aw)
        }

        // Central fountain landmark
        let fountain = SCNCylinder(radius: 1.6, height: 0.8)
        fountain.firstMaterial?.diffuse.contents = UIColor(red: 0.55, green: 0.5, blue: 0.42, alpha: 1)
        fountain.firstMaterial?.lightingModel = .constant
        let f = SCNNode(geometry: fountain)
        f.position = SCNVector3(0, 0.4, -10)
        f.name = "prop_fountain"
        scene.rootNode.addChildNode(f)
        colliders.append(.fromBox(center: f.position, width: 3.2, depth: 3.2))

        for (i, z) in [Float(10), 0, -4, -14].enumerated() {
            let pole = SCNCylinder(radius: 0.07, height: 3.4)
            pole.firstMaterial?.diffuse.contents = UIColor(white: 0.18, alpha: 1)
            pole.firstMaterial?.lightingModel = .constant
            let p = SCNNode(geometry: pole)
            p.position = SCNVector3(0, 1.7, z)
            p.name = "deco_lantern_\(i)"
            scene.rootNode.addChildNode(p)

            let glow = SCNSphere(radius: 0.18)
            glow.firstMaterial?.diffuse.contents = UIColor(red: 1, green: 0.7, blue: 0.3, alpha: 1)
            glow.firstMaterial?.emission.contents = UIColor(red: 0.6, green: 0.3, blue: 0.05, alpha: 1)
            glow.firstMaterial?.lightingModel = .constant
            let g = SCNNode(geometry: glow)
            g.position = SCNVector3(0, 3.3, z)
            g.name = "deco_lantern_glow_\(i)"
            scene.rootNode.addChildNode(g)
        }
    }

    /// Iron Cathedral — trains + pillar
    private static func buildIronCathedral(in scene: SCNScene, colliders: inout [Collider]) {
        let iron = UIColor(red: 0.35, green: 0.22, blue: 0.14, alpha: 1)
        let steel = UIColor(white: 0.25, alpha: 1)

        for i in 0..<5 {
            let beam = SCNBox(width: 22, height: 0.4, length: 0.4, chamferRadius: 0)
            beam.firstMaterial?.diffuse.contents = iron
            beam.firstMaterial?.lightingModel = .constant
            let a = SCNNode(geometry: beam)
            a.position = SCNVector3(0, 7.5, 14 - Float(i) * 8)
            a.name = "deco_arch_\(i)"
            scene.rootNode.addChildNode(a)
        }

        for (side, x): (Int, Float) in [(0, -16), (1, 16)] {
            for i in 0..<3 {
                let car = SCNBox(width: 3.2, height: 3.0, length: 8, chamferRadius: 0)
                car.firstMaterial?.diffuse.contents = side == 0 ? iron : steel
                car.firstMaterial?.lightingModel = .constant
                let n = SCNNode(geometry: car)
                let pos = SCNVector3(x, 1.5, 10 - Float(i) * 12)
                n.position = pos
                n.name = "prop_train_\(side)_\(i)"
                scene.rootNode.addChildNode(n)
                colliders.append(.fromBox(center: pos, width: 3.2, depth: 8))
            }
        }

        addCrate(in: scene, at: SCNVector3(-3, 0.5, 14), color: iron, name: "prop_platform_0", colliders: &colliders)
        addCrate(in: scene, at: SCNVector3(3, 0.5, -4), color: iron, name: "prop_platform_1", colliders: &colliders)
        addCrate(in: scene, at: SCNVector3(0, 0.5, -16), color: steel, name: "prop_platform_2", colliders: &colliders)
        addCrate(in: scene, at: SCNVector3(-8, 0.5, 6), color: steel, name: "prop_platform_3", colliders: &colliders)

        let pillar = SCNCylinder(radius: 0.9, height: 9)
        pillar.firstMaterial?.diffuse.contents = steel
        pillar.firstMaterial?.lightingModel = .constant
        let p = SCNNode(geometry: pillar)
        p.position = SCNVector3(0, 4.5, -12)
        p.name = "prop_spire"
        scene.rootNode.addChildNode(p)
        colliders.append(.fromBox(center: p.position, width: 2.0, depth: 2.0))

        // Clock face landmark on end wall
        let clock = SCNCylinder(radius: 1.8, height: 0.2)
        clock.firstMaterial?.diffuse.contents = UIColor(red: 0.9, green: 0.85, blue: 0.7, alpha: 1)
        clock.firstMaterial?.emission.contents = UIColor(red: 0.4, green: 0.3, blue: 0.15, alpha: 0.3)
        clock.firstMaterial?.lightingModel = .constant
        let cl = SCNNode(geometry: clock)
        cl.eulerAngles.x = .pi / 2
        cl.position = SCNVector3(0, 6, -24)
        cl.name = "deco_clock"
        scene.rootNode.addChildNode(cl)
    }

    /// Frost Approach — pylons + bunkers
    private static func buildFrostApproach(in scene: SCNScene, colliders: inout [Collider]) {
        let ice = UIColor(red: 0.65, green: 0.72, blue: 0.8, alpha: 1)
        let concrete = UIColor(white: 0.5, alpha: 1)

        for (i, z) in [Float(10), -2, -14].enumerated() {
            let pylon = SCNBox(width: 1.4, height: 5.5, length: 1.4, chamferRadius: 0)
            pylon.firstMaterial?.diffuse.contents = concrete
            pylon.firstMaterial?.lightingModel = .constant
            let p = SCNNode(geometry: pylon)
            p.position = SCNVector3(0, 2.75, z)
            p.name = "prop_pylon_\(i)"
            scene.rootNode.addChildNode(p)
            colliders.append(.fromBox(center: p.position, width: 1.4, depth: 1.4))
            // Cable
            let cable = SCNBox(width: 0.08, height: 0.08, length: 12, chamferRadius: 0)
            cable.firstMaterial?.diffuse.contents = UIColor(white: 0.3, alpha: 1)
            cable.firstMaterial?.lightingModel = .constant
            let c = SCNNode(geometry: cable)
            c.position = SCNVector3(0, 5.2, z - 6)
            c.name = "deco_cable_\(i)"
            scene.rootNode.addChildNode(c)
        }

        for (i, pos) in [SCNVector3(-5, 1.2, 14), SCNVector3(5, 1.2, -16), SCNVector3(-5, 1.2, -6)].enumerated() {
            let bunker = SCNBox(width: 3.8, height: 2.4, length: 3.2, chamferRadius: 0)
            bunker.firstMaterial?.diffuse.contents = concrete
            bunker.firstMaterial?.lightingModel = .constant
            let b = SCNNode(geometry: bunker)
            b.position = pos
            b.name = "prop_gatehouse_\(i)"
            scene.rootNode.addChildNode(b)
            colliders.append(.fromBox(center: pos, width: 3.8, depth: 3.2))
        }

        // Bridge railing segments
        let rail = SCNBox(width: 12, height: 0.25, length: 0.35, chamferRadius: 0)
        rail.firstMaterial?.diffuse.contents = ice
        rail.firstMaterial?.lightingModel = .constant
        let r = SCNNode(geometry: rail)
        r.position = SCNVector3(0, 0.2, 0)
        r.name = "deco_icerail"
        scene.rootNode.addChildNode(r)

        // Snow berms
        for (i, pos) in [SCNVector3(-6.5, 0.7, 16), SCNVector3(6.5, 0.7, -8)].enumerated() {
            let berm = SCNBox(width: 2.8, height: 1.4, length: 2.0, chamferRadius: 0.2)
            berm.firstMaterial?.diffuse.contents = UIColor(red: 0.85, green: 0.9, blue: 0.95, alpha: 1)
            berm.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: berm)
            n.position = pos
            n.name = "prop_snow_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 2.8, depth: 2.0))
        }
    }

    /// Blackout Grid — transformers + turbine hall blocks
    private static func buildBlackoutGrid(in scene: SCNScene, colliders: inout [Collider]) {
        let metal = UIColor(white: 0.28, alpha: 1)
        let hazard = UIColor(red: 0.85, green: 0.7, blue: 0.15, alpha: 1)

        for (i, pos) in [
            SCNVector3(-8, 1.4, 8), SCNVector3(8, 1.4, -2), SCNVector3(-8, 1.4, -12),
            SCNVector3(8, 1.4, 12), SCNVector3(-14, 1.4, 0), SCNVector3(14, 1.4, -10)
        ].enumerated() {
            let xfmr = SCNBox(width: 3.0, height: 2.8, length: 2.4, chamferRadius: 0)
            xfmr.firstMaterial?.diffuse.contents = metal
            xfmr.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: xfmr)
            n.position = pos
            n.name = "prop_xfmr_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 3.0, depth: 2.4))
        }

        let hall = SCNBox(width: 10, height: 4.5, length: 6, chamferRadius: 0)
        hall.firstMaterial?.diffuse.contents = UIColor(red: 0.22, green: 0.26, blue: 0.22, alpha: 1)
        hall.firstMaterial?.lightingModel = .constant
        let h = SCNNode(geometry: hall)
        h.position = SCNVector3(0, 2.25, -10)
        h.name = "prop_turbinehall"
        scene.rootNode.addChildNode(h)
        colliders.append(.fromBox(center: h.position, width: 10, depth: 6))

        for (i, z) in [Float(6), -6, 14].enumerated() {
            let stripe = SCNBox(width: 4, height: 0.08, length: 0.5, chamferRadius: 0)
            stripe.firstMaterial?.diffuse.contents = hazard
            stripe.firstMaterial?.lightingModel = .constant
            let s = SCNNode(geometry: stripe)
            s.position = SCNVector3(0, 0.05, z)
            s.name = "deco_hazard_\(i)"
            scene.rootNode.addChildNode(s)
        }

        let stack = SCNCylinder(radius: 1.1, height: 9)
        stack.firstMaterial?.diffuse.contents = UIColor(white: 0.35, alpha: 1)
        stack.firstMaterial?.lightingModel = .constant
        let st = SCNNode(geometry: stack)
        st.position = SCNVector3(0, 4.5, 14)
        st.name = "deco_stack"
        scene.rootNode.addChildNode(st)
        colliders.append(.fromBox(center: st.position, width: 2.4, depth: 2.4))

        // Cooling pipe runs (visual)
        let pipe = SCNCylinder(radius: 0.2, height: 16)
        pipe.firstMaterial?.diffuse.contents = UIColor(red: 0.3, green: 0.55, blue: 0.35, alpha: 1)
        pipe.firstMaterial?.lightingModel = .constant
        let pi = SCNNode(geometry: pipe)
        pi.eulerAngles.z = .pi / 2
        pi.position = SCNVector3(0, 3.5, 4)
        pi.name = "deco_pipe"
        scene.rootNode.addChildNode(pi)

        // Green status lights on hall
        let status = SCNBox(width: 1.2, height: 0.15, length: 0.15, chamferRadius: 0)
        status.firstMaterial?.diffuse.contents = UIColor(red: 0.3, green: 1, blue: 0.4, alpha: 1)
        status.firstMaterial?.emission.contents = UIColor(red: 0.1, green: 0.5, blue: 0.15, alpha: 1)
        status.firstMaterial?.lightingModel = .constant
        let sg = SCNNode(geometry: status)
        sg.position = SCNVector3(0, 4.6, -7)
        sg.name = "deco_status"
        scene.rootNode.addChildNode(sg)
    }

    /// Last Relay — compound landmarks
    private static func buildLastRelay(in scene: SCNScene, colliders: inout [Collider]) {
        let concrete = UIColor(white: 0.45, alpha: 1)

        for (i, x) in [Float(-18), 18].enumerated() {
            let tower = SCNBox(width: 2.6, height: 8.0, length: 2.6, chamferRadius: 0)
            tower.firstMaterial?.diffuse.contents = concrete
            tower.firstMaterial?.lightingModel = .constant
            let t = SCNNode(geometry: tower)
            let pos = SCNVector3(x, 4.0, 16)
            t.position = pos
            t.name = "prop_tower_\(i)"
            scene.rootNode.addChildNode(t)
            colliders.append(.fromBox(center: pos, width: 2.6, depth: 2.6))
        }

        let bunker = SCNBox(width: 10, height: 4.5, length: 10, chamferRadius: 0)
        bunker.firstMaterial?.diffuse.contents = concrete
        bunker.firstMaterial?.lightingModel = .constant
        let b = SCNNode(geometry: bunker)
        b.position = SCNVector3(0, 2.25, -18)
        b.name = "prop_bunker"
        scene.rootNode.addChildNode(b)

        let dish = SCNCylinder(radius: 2.4, height: 0.25)
        dish.firstMaterial?.diffuse.contents = UIColor(white: 0.7, alpha: 1)
        dish.firstMaterial?.lightingModel = .constant
        let d = SCNNode(geometry: dish)
        d.eulerAngles.x = 0.9
        d.position = SCNVector3(0, 5.6, -18)
        d.name = "deco_relay"
        scene.rootNode.addChildNode(d)

        for (i, pos) in [
            SCNVector3(-14, 0.9, -4), SCNVector3(14, 0.9, 4), SCNVector3(-12, 0.9, 10),
            SCNVector3(12, 0.9, -12), SCNVector3(-8, 0.9, 16)
        ].enumerated() {
            let berm = SCNBox(width: 3.4, height: 1.6, length: 2.6, chamferRadius: 0)
            berm.firstMaterial?.diffuse.contents = UIColor(red: 0.4, green: 0.42, blue: 0.38, alpha: 1)
            berm.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: berm)
            n.position = pos
            n.name = "prop_rock_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 3.4, depth: 2.6))
        }

        // Helipad marking
        let pad = SCNBox(width: 6, height: 0.04, length: 6, chamferRadius: 0)
        pad.firstMaterial?.diffuse.contents = UIColor(red: 0.35, green: 0.38, blue: 0.32, alpha: 1)
        pad.firstMaterial?.lightingModel = .constant
        let hp = SCNNode(geometry: pad)
        hp.position = SCNVector3(0, 0.03, 4)
        hp.name = "deco_helipad"
        scene.rootNode.addChildNode(hp)
        let hmark = SCNBox(width: 2.5, height: 0.05, length: 0.4, chamferRadius: 0)
        hmark.firstMaterial?.diffuse.contents = UIColor(white: 0.9, alpha: 1)
        hmark.firstMaterial?.lightingModel = .constant
        let hm = SCNNode(geometry: hmark)
        hm.position = SCNVector3(0, 0.06, 4)
        hm.name = "deco_h_mark"
        scene.rootNode.addChildNode(hm)
    }

    /// Echo Cache — server racks / archive aisles
    private static func buildEchoCache(in scene: SCNScene, colliders: inout [Collider]) {
        let rack = UIColor(red: 0.18, green: 0.22, blue: 0.28, alpha: 1)
        let glow = UIColor(red: 0.2, green: 0.85, blue: 1.0, alpha: 1)

        for (i, x) in [Float(-10), -4, 4, 10].enumerated() {
            let box = SCNBox(width: 1.4, height: 3.6, length: 8, chamferRadius: 0)
            box.firstMaterial?.diffuse.contents = rack
            box.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: box)
            let pos = SCNVector3(x, 1.8, -2 + Float(i % 2) * 4)
            n.position = pos
            n.name = "prop_rack_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 1.4, depth: 8))
            // LED strip on rack
            let led = SCNBox(width: 0.08, height: 2.8, length: 0.08, chamferRadius: 0)
            led.firstMaterial?.diffuse.contents = glow
            led.firstMaterial?.emission.contents = glow.withAlphaComponent(0.6)
            led.firstMaterial?.lightingModel = .constant
            let l = SCNNode(geometry: led)
            l.position = SCNVector3(x + 0.75, 1.8, pos.z)
            l.name = "deco_rack_led_\(i)"
            scene.rootNode.addChildNode(l)
        }

        let core = SCNBox(width: 4.5, height: 3.2, length: 4.5, chamferRadius: 0)
        core.firstMaterial?.diffuse.contents = UIColor(red: 0.12, green: 0.2, blue: 0.24, alpha: 1)
        core.firstMaterial?.emission.contents = glow.withAlphaComponent(0.35)
        core.firstMaterial?.lightingModel = .constant
        let c = SCNNode(geometry: core)
        c.position = SCNVector3(0, 1.6, -16)
        c.name = "prop_echo_core"
        scene.rootNode.addChildNode(c)
        colliders.append(.fromBox(center: c.position, width: 4.5, depth: 4.5))

        // Holo pedestal
        let ped = SCNCylinder(radius: 0.8, height: 1.2)
        ped.firstMaterial?.diffuse.contents = UIColor(red: 0.15, green: 0.25, blue: 0.3, alpha: 1)
        ped.firstMaterial?.emission.contents = glow.withAlphaComponent(0.2)
        ped.firstMaterial?.lightingModel = .constant
        let p = SCNNode(geometry: ped)
        p.position = SCNVector3(0, 0.6, 14)
        p.name = "prop_holo"
        scene.rootNode.addChildNode(p)
        colliders.append(.fromBox(center: p.position, width: 1.8, depth: 1.8))

        for (i, pos) in [SCNVector3(-8, 0.5, 12), SCNVector3(8, 0.5, 8), SCNVector3(0, 0.5, 2), SCNVector3(-12, 0.5, -12)].enumerated() {
            addCrate(in: scene, at: pos, color: UIColor(red: 0.25, green: 0.35, blue: 0.4, alpha: 1),
                     name: "prop_drive_\(i)", colliders: &colliders)
        }
    }

    /// Salt Wake — fog pier amplifiers
    private static func buildSaltWake(in scene: SCNScene, colliders: inout [Collider]) {
        let steel = UIColor(red: 0.4, green: 0.42, blue: 0.45, alpha: 1)

        for (i, pos) in [
            SCNVector3(-12, 1.4, 10), SCNVector3(12, 1.4, 6),
            SCNVector3(-10, 1.4, -6), SCNVector3(10, 1.4, -10),
            SCNVector3(-14, 1.4, -14), SCNVector3(14, 1.4, 14)
        ].enumerated() {
            let crate = SCNBox(width: 3.2, height: 2.8, length: 2.4, chamferRadius: 0)
            crate.firstMaterial?.diffuse.contents = steel
            crate.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: crate)
            n.position = pos
            n.name = "prop_container_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 3.2, depth: 2.4))
        }

        for (i, x) in [Float(-6), 0, 6].enumerated() {
            let amp = SCNCylinder(radius: 0.9, height: 3.4)
            amp.firstMaterial?.diffuse.contents = UIColor(red: 0.2, green: 0.35, blue: 0.5, alpha: 1)
            amp.firstMaterial?.emission.contents = UIColor(red: 0.3, green: 0.7, blue: 1, alpha: 0.4)
            amp.firstMaterial?.lightingModel = .constant
            let a = SCNNode(geometry: amp)
            a.position = SCNVector3(x, 1.7, -16)
            a.name = "prop_phantom_amp_\(i)"
            scene.rootNode.addChildNode(a)
            colliders.append(.fromBox(center: a.position, width: 1.8, depth: 1.8))
        }

        let crane = SCNBox(width: 1.2, height: 8, length: 1.2, chamferRadius: 0)
        crane.firstMaterial?.diffuse.contents = steel
        crane.firstMaterial?.lightingModel = .constant
        let cr = SCNNode(geometry: crane)
        cr.position = SCNVector3(14, 4, -2)
        cr.name = "deco_crane"
        scene.rootNode.addChildNode(cr)

        // Fog posts / lamp pillars along pier
        for (i, z) in [Float(12), 0, -12].enumerated() {
            let post = SCNCylinder(radius: 0.15, height: 4)
            post.firstMaterial?.diffuse.contents = UIColor(white: 0.25, alpha: 1)
            post.firstMaterial?.lightingModel = .constant
            let p = SCNNode(geometry: post)
            p.position = SCNVector3(-16, 2, z)
            p.name = "deco_fogpost_\(i)"
            scene.rootNode.addChildNode(p)
            let glow = SCNSphere(radius: 0.22)
            glow.firstMaterial?.diffuse.contents = UIColor(red: 0.7, green: 0.85, blue: 1, alpha: 1)
            glow.firstMaterial?.emission.contents = UIColor(red: 0.3, green: 0.5, blue: 0.7, alpha: 0.5)
            glow.firstMaterial?.lightingModel = .constant
            let g = SCNNode(geometry: glow)
            g.position = SCNVector3(-16, 4.1, z)
            g.name = "deco_fogglow_\(i)"
            scene.rootNode.addChildNode(g)
        }
    }

    /// Mirror Static — haunted glass canyon props
    private static func buildMirrorStatic(in scene: SCNScene, colliders: inout [Collider]) {
        let glass = UIColor(red: 0.45, green: 0.5, blue: 0.7, alpha: 0.85)
        let kiosk = UIColor(red: 0.25, green: 0.2, blue: 0.35, alpha: 1)

        for (i, x) in [Float(-7), 7].enumerated() {
            let facade = SCNBox(width: 1.2, height: 10, length: 22, chamferRadius: 0)
            facade.firstMaterial?.diffuse.contents = glass
            facade.firstMaterial?.lightingModel = .constant
            let f = SCNNode(geometry: facade)
            f.position = SCNVector3(x, 5, 0)
            f.name = "deco_glass_\(i)"
            scene.rootNode.addChildNode(f)
        }

        for (i, pos) in [
            SCNVector3(-3, 0.9, 10), SCNVector3(3, 0.9, 4),
            SCNVector3(-3, 0.9, -6), SCNVector3(3, 0.9, -14),
            SCNVector3(0, 0.9, -20)
        ].enumerated() {
            let k = SCNBox(width: 2.2, height: 1.8, length: 2.0, chamferRadius: 0)
            k.firstMaterial?.diffuse.contents = kiosk
            k.firstMaterial?.emission.contents = UIColor(red: 0.6, green: 0.4, blue: 1, alpha: 0.25)
            k.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: k)
            n.position = pos
            n.name = "prop_kiosk_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 2.2, depth: 2.0))
        }

        let token = SCNBox(width: 1.6, height: 0.4, length: 1.6, chamferRadius: 0.05)
        token.firstMaterial?.diffuse.contents = UIColor(red: 0.7, green: 0.5, blue: 1, alpha: 1)
        token.firstMaterial?.emission.contents = UIColor(red: 0.7, green: 0.5, blue: 1, alpha: 0.5)
        token.firstMaterial?.lightingModel = .constant
        let t = SCNNode(geometry: token)
        t.position = SCNVector3(0, 0.3, -18)
        t.name = "deco_master_token"
        scene.rootNode.addChildNode(t)

        // Floating mirror shards (visual, high up)
        for (i, pos) in [SCNVector3(-2, 4.5, 6), SCNVector3(2, 5.0, -8), SCNVector3(0, 4.2, 14)].enumerated() {
            let shard = SCNBox(width: 1.2, height: 1.8, length: 0.08, chamferRadius: 0)
            shard.firstMaterial?.diffuse.contents = UIColor(red: 0.6, green: 0.5, blue: 0.9, alpha: 0.7)
            shard.firstMaterial?.emission.contents = UIColor(red: 0.4, green: 0.3, blue: 0.7, alpha: 0.3)
            shard.firstMaterial?.lightingModel = .constant
            let s = SCNNode(geometry: shard)
            s.position = pos
            s.eulerAngles.y = Float(i) * 0.7
            s.name = "deco_shard_\(i)"
            scene.rootNode.addChildNode(s)
        }
    }

    /// Null Horizon — subterranean lattice vault
    private static func buildNullHorizon(in scene: SCNScene, colliders: inout [Collider]) {
        let obsidian = UIColor(red: 0.18, green: 0.1, blue: 0.16, alpha: 1)
        let pulse = UIColor(red: 1.0, green: 0.25, blue: 0.55, alpha: 1)

        for (i, x) in [Float(-18), 18].enumerated() {
            let pillar = SCNBox(width: 2.8, height: 9.0, length: 2.8, chamferRadius: 0)
            pillar.firstMaterial?.diffuse.contents = obsidian
            pillar.firstMaterial?.lightingModel = .constant
            let p = SCNNode(geometry: pillar)
            let pos = SCNVector3(x, 4.5, 14)
            p.position = pos
            p.name = "prop_null_pillar_\(i)"
            scene.rootNode.addChildNode(p)
            colliders.append(.fromBox(center: pos, width: 2.8, depth: 2.8))
        }

        let core = SCNBox(width: 12, height: 5.5, length: 12, chamferRadius: 0)
        core.firstMaterial?.diffuse.contents = obsidian
        core.firstMaterial?.emission.contents = pulse.withAlphaComponent(0.3)
        core.firstMaterial?.lightingModel = .constant
        let c = SCNNode(geometry: core)
        c.position = SCNVector3(0, 2.75, -18)
        c.name = "prop_null_core"
        scene.rootNode.addChildNode(c)

        let ring = SCNTorus(ringRadius: 3.2, pipeRadius: 0.22)
        ring.firstMaterial?.diffuse.contents = pulse
        ring.firstMaterial?.emission.contents = pulse
        ring.firstMaterial?.lightingModel = .constant
        let r = SCNNode(geometry: ring)
        r.eulerAngles.x = .pi / 2
        r.position = SCNVector3(0, 6.2, -18)
        r.name = "deco_null_ring"
        scene.rootNode.addChildNode(r)

        for (i, pos) in [
            SCNVector3(-12, 1.0, -4), SCNVector3(12, 1.0, 2),
            SCNVector3(-10, 1.0, 10), SCNVector3(10, 1.0, -10),
            SCNVector3(-14, 1.0, -12), SCNVector3(14, 1.0, 12)
        ].enumerated() {
            let berm = SCNBox(width: 3.6, height: 2.0, length: 2.8, chamferRadius: 0)
            berm.firstMaterial?.diffuse.contents = UIColor(red: 0.28, green: 0.16, blue: 0.24, alpha: 1)
            berm.firstMaterial?.lightingModel = .constant
            let n = SCNNode(geometry: berm)
            n.position = pos
            n.name = "prop_null_berm_\(i)"
            scene.rootNode.addChildNode(n)
            colliders.append(.fromBox(center: pos, width: 3.6, depth: 2.8))
        }

        // Lattice beams overhead
        for (i, z) in [Float(8), -4].enumerated() {
            let beam = SCNBox(width: 36, height: 0.3, length: 0.3, chamferRadius: 0)
            beam.firstMaterial?.diffuse.contents = pulse.withAlphaComponent(0.8)
            beam.firstMaterial?.emission.contents = pulse.withAlphaComponent(0.35)
            beam.firstMaterial?.lightingModel = .constant
            let b = SCNNode(geometry: beam)
            b.position = SCNVector3(0, 7.5, z)
            b.name = "deco_lattice_\(i)"
            scene.rootNode.addChildNode(b)
        }
    }

    private static func addCrate(
        in scene: SCNScene,
        at pos: SCNVector3,
        color: UIColor,
        name: String,
        colliders: inout [Collider]
    ) {
        let crate = SCNBox(width: 1.2, height: 1.1, length: 1.2, chamferRadius: 0)
        crate.firstMaterial?.diffuse.contents = color
        crate.firstMaterial?.lightingModel = .constant
        let node = SCNNode(geometry: crate)
        node.name = name
        node.position = pos
        scene.rootNode.addChildNode(node)
        colliders.append(.fromBox(center: pos, width: 1.2, depth: 1.2))
    }

    // MARK: - Player body (third person)
    // Mesh detail lives in OperatorMeshBuilder so map edits here stay merge-safe.

    static func makePlayerBodyNode(look: OperatorAppearance = OperatorLook.grambo.appearance) -> SCNNode {
        let root = OperatorMeshBuilder.makeBodyNode(look: look)
        root.name = "playerBody"
        return root
    }

    // MARK: - Entities

    enum EnemyWeapon {
        case rifle
        case knife
    }

    /// Friendly KESTREL AI companion — keeps operator kit colors; teal stripe marks ally.
    static func makeTeammateNode(callsign: String, look: OperatorAppearance, at position: SCNVector3) -> SCNNode {
        let root = SCNNode()
        root.name = "teammate"
        root.position = position

        root.addChildNode(OperatorMeshBuilder.makeTeammateBody(look: look))

        let rifle = makeEnemyRifle()
        rifle.name = "teammateGun"
        // Recolor ally rifle slightly lighter / cyan tip so muzzle flash reads friendly.
        if let tip = rifle.childNodes.last {
            tip.geometry?.firstMaterial?.emission.contents = UIColor(red: 0.1, green: 0.6, blue: 0.55, alpha: 0.4)
        }
        root.addChildNode(rifle)

        _ = callsign
        let bar = makeFriendlyHealthBar()
        root.addChildNode(bar)

        return root
    }

    /// Cyan-tinted HP bar for the AI teammate (same fill update path as enemies).
    static func makeFriendlyHealthBar() -> SCNNode {
        let root = makeEnemyHealthBar()
        if let fill = root.childNode(withName: "healthBarFill", recursively: true) {
            let cyan = UIColor(red: 0.15, green: 0.95, blue: 0.88, alpha: 1)
            fill.geometry?.firstMaterial?.diffuse.contents = cyan
            fill.geometry?.firstMaterial?.emission.contents = cyan.withAlphaComponent(0.4)
        }
        return root
    }

    static func makeEnemyNode(id: Int, at position: SCNVector3, weapon: EnemyWeapon = .rifle) -> SCNNode {
        let root = SCNNode()
        root.name = "enemy_\(id)"
        root.position = position

        // Meridian hostile kit (not OperatorMeshBuilder — keeps KESTREL teal friendlies distinct).
        // Names enemyTorso / enemyHead / enemyBody are contract for hit-flash + headshot agents.
        let kit: EnemyMeshBuilder.Kit = weapon == .knife ? .knife : .rifle
        EnemyMeshBuilder.attachBody(to: root, kit: kit)

        root.addChildNode(makeEnemyHealthBar())

        switch weapon {
        case .rifle: root.addChildNode(makeEnemyRifle())
        case .knife: root.addChildNode(makeEnemyKnife())
        }

        return root
    }

    /// Billboard HP bar above the helmet — fill node scales with remaining health.
    static func makeEnemyHealthBar() -> SCNNode {
        let root = SCNNode()
        root.name = "healthBar"
        root.position = SCNVector3(0, 2.2, 0)
        // Face the shooter: enemies yaw toward the player, so a local XY bar reads head-on.

        let bg = SCNBox(width: 0.72, height: 0.1, length: 0.02, chamferRadius: 0.01)
        bg.firstMaterial?.diffuse.contents = UIColor(white: 0.05, alpha: 0.85)
        bg.firstMaterial?.lightingModel = .constant
        let bgNode = SCNNode(geometry: bg)
        bgNode.name = "healthBarBG"

        let fill = SCNBox(width: 0.66, height: 0.07, length: 0.025, chamferRadius: 0.008)
        fill.firstMaterial?.diffuse.contents = UIColor(red: 0.25, green: 0.9, blue: 0.35, alpha: 1)
        fill.firstMaterial?.emission.contents = UIColor(red: 0.1, green: 0.4, blue: 0.15, alpha: 1)
        fill.firstMaterial?.lightingModel = .constant
        let fillNode = SCNNode(geometry: fill)
        fillNode.name = "healthBarFill"
        fillNode.position = SCNVector3(0, 0, 0.01)

        root.addChildNode(bgNode)
        root.addChildNode(fillNode)
        return root
    }

    /// Updates bar fill + color. `ratio` is 0…1 remaining HP.
    static func updateEnemyHealthBar(on enemy: SCNNode, ratio: Float) {
        guard let fill = enemy.childNode(withName: "healthBarFill", recursively: true) else { return }
        let clamped = max(0, min(1, ratio))
        fill.scale.x = max(0.02, clamped)
        // Shrink from the left so empty space sits on the right.
        fill.position.x = -0.33 * (1 - clamped)

        let color: UIColor
        if clamped > 0.55 {
            color = UIColor(red: 0.25, green: 0.9, blue: 0.35, alpha: 1)
        } else if clamped > 0.28 {
            color = UIColor(red: 0.95, green: 0.75, blue: 0.15, alpha: 1)
        } else {
            color = UIColor(red: 0.95, green: 0.2, blue: 0.18, alpha: 1)
        }
        fill.geometry?.firstMaterial?.diffuse.contents = color
        fill.geometry?.firstMaterial?.emission.contents = color.withAlphaComponent(0.35)

        if let bar = enemy.childNode(withName: "healthBar", recursively: false) {
            bar.isHidden = clamped <= 0
        }
    }

    private static func makeEnemyRifle() -> SCNNode {
        let root = SCNNode()
        root.name = "enemyGun"
        root.position = SCNVector3(0.32, 1.05, -0.15)

        let receiverMat = SCNMaterial()
        receiverMat.diffuse.contents = UIColor(white: 0.14, alpha: 1)
        receiverMat.lightingModel = .physicallyBased
        receiverMat.metalness.contents = 0.45
        receiverMat.roughness.contents = 0.42

        let receiver = SCNBox(width: 0.08, height: 0.12, length: 0.28, chamferRadius: 0.01)
        receiver.firstMaterial = receiverMat
        root.addChildNode(SCNNode(geometry: receiver))

        let handguard = SCNBox(width: 0.07, height: 0.09, length: 0.18, chamferRadius: 0.008)
        handguard.firstMaterial = receiverMat
        let hg = SCNNode(geometry: handguard)
        hg.position = SCNVector3(0, 0.01, -0.20)
        root.addChildNode(hg)

        let barrel = SCNCylinder(radius: 0.016, height: 0.40)
        barrel.firstMaterial = receiverMat
        let bar = SCNNode(geometry: barrel)
        bar.eulerAngles.x = .pi / 2
        bar.position = SCNVector3(0, 0.02, -0.38)
        root.addChildNode(bar)

        // Muzzle tip — faint hostile IR so teammate cyan tip stays distinct
        let tip = SCNSphere(radius: 0.022)
        tip.segmentCount = 8
        let tipMat = SCNMaterial()
        tipMat.diffuse.contents = UIColor(red: 0.7, green: 0.15, blue: 0.05, alpha: 1)
        tipMat.emission.contents = UIColor(red: 0.45, green: 0.08, blue: 0.02, alpha: 0.35)
        tipMat.lightingModel = .constant
        tip.firstMaterial = tipMat
        let tipNode = SCNNode(geometry: tip)
        tipNode.position = SCNVector3(0, 0.02, -0.58)
        root.addChildNode(tipNode)

        let stock = SCNBox(width: 0.06, height: 0.1, length: 0.2, chamferRadius: 0.01)
        stock.firstMaterial = receiverMat
        let st = SCNNode(geometry: stock)
        st.position = SCNVector3(0, 0, 0.2)
        root.addChildNode(st)

        let mag = SCNBox(width: 0.05, height: 0.16, length: 0.06, chamferRadius: 0.008)
        mag.firstMaterial?.diffuse.contents = UIColor(white: 0.08, alpha: 1)
        let m = SCNNode(geometry: mag)
        m.position = SCNVector3(0, -0.12, 0.02)
        root.addChildNode(m)

        // Optic bump
        let optic = SCNBox(width: 0.045, height: 0.05, length: 0.08, chamferRadius: 0.006)
        optic.firstMaterial = receiverMat
        let op = SCNNode(geometry: optic)
        op.position = SCNVector3(0, 0.09, -0.04)
        root.addChildNode(op)

        return root
    }

    private static func makeEnemyKnife() -> SCNNode {
        let root = SCNNode()
        root.name = "enemyKnife"
        root.position = SCNVector3(0.35, 1.0, -0.1)
        root.eulerAngles.z = -0.4

        let handleMat = SCNMaterial()
        handleMat.diffuse.contents = UIColor(red: 0.12, green: 0.10, blue: 0.09, alpha: 1)
        handleMat.lightingModel = .blinn
        handleMat.specular.contents = UIColor.white.withAlphaComponent(0.15)

        let handle = SCNCylinder(radius: 0.025, height: 0.14)
        handle.firstMaterial = handleMat
        let h = SCNNode(geometry: handle)
        h.position = SCNVector3(0, -0.05, 0)
        root.addChildNode(h)

        let bladeMat = SCNMaterial()
        bladeMat.diffuse.contents = UIColor(red: 0.78, green: 0.80, blue: 0.82, alpha: 1)
        bladeMat.lightingModel = .physicallyBased
        bladeMat.metalness.contents = 0.92
        bladeMat.roughness.contents = 0.22

        let blade = SCNBox(width: 0.04, height: 0.018, length: 0.30, chamferRadius: 0.002)
        blade.firstMaterial = bladeMat
        let b = SCNNode(geometry: blade)
        b.position = SCNVector3(0, 0.02, -0.19)
        root.addChildNode(b)

        let guardBar = SCNBox(width: 0.11, height: 0.03, length: 0.03, chamferRadius: 0.005)
        guardBar.firstMaterial?.diffuse.contents = UIColor(white: 0.16, alpha: 1)
        let g = SCNNode(geometry: guardBar)
        g.position = SCNVector3(0, 0.0, -0.02)
        root.addChildNode(g)

        // Amber accent ring on pommel — matches knife-kit IR
        let pommel = SCNSphere(radius: 0.028)
        pommel.segmentCount = 8
        let pomMat = SCNMaterial()
        pomMat.diffuse.contents = UIColor(red: 0.95, green: 0.42, blue: 0.08, alpha: 1)
        pomMat.emission.contents = UIColor(red: 0.5, green: 0.2, blue: 0.02, alpha: 0.3)
        pomMat.lightingModel = .constant
        pommel.firstMaterial = pomMat
        let p = SCNNode(geometry: pommel)
        p.position = SCNVector3(0, -0.12, 0)
        root.addChildNode(p)

        return root
    }

    static func makeAmmoPickup(id: Int, at position: SCNVector3) -> SCNNode {
        let root = SCNNode()
        root.name = "ammo_\(id)"
        root.position = position

        // Olive/amber ammo crate
        let box = SCNBox(width: 0.5, height: 0.38, length: 0.6, chamferRadius: 0.02)
        box.firstMaterial?.diffuse.contents = UIColor(red: 0.72, green: 0.52, blue: 0.12, alpha: 1)
        box.firstMaterial?.lightingModel = .constant
        let body = SCNNode(geometry: box)

        // Dark band so it reads as "ammo" at a glance
        let band = SCNBox(width: 0.52, height: 0.1, length: 0.62, chamferRadius: 0)
        band.firstMaterial?.diffuse.contents = UIColor(white: 0.12, alpha: 1)
        band.firstMaterial?.lightingModel = .constant
        let bandNode = SCNNode(geometry: band)
        bandNode.position = SCNVector3(0, 0.02, 0)

        // Bright lid stripe
        let stripe = SCNBox(width: 0.18, height: 0.04, length: 0.62, chamferRadius: 0)
        stripe.firstMaterial?.diffuse.contents = UIColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 1)
        stripe.firstMaterial?.emission.contents = UIColor(red: 0.4, green: 0.3, blue: 0.05, alpha: 1)
        stripe.firstMaterial?.lightingModel = .constant
        let stripeNode = SCNNode(geometry: stripe)
        stripeNode.position = SCNVector3(0, 0.2, 0)

        root.addChildNode(body)
        root.addChildNode(bandNode)
        root.addChildNode(stripeNode)
        // No forever bob — SceneKit action spam across 10+ pickups tanks FPS.
        return root
    }

    static func makeMedkitPickup(id: Int, at position: SCNVector3) -> SCNNode {
        let root = SCNNode()
        root.name = "medkit_\(id)"
        root.position = position

        let box = SCNBox(width: 0.52, height: 0.36, length: 0.42, chamferRadius: 0.02)
        box.firstMaterial?.diffuse.contents = UIColor(red: 0.82, green: 0.12, blue: 0.12, alpha: 1)
        box.firstMaterial?.lightingModel = .constant
        let body = SCNNode(geometry: box)

        // White medical cross
        let crossV = SCNBox(width: 0.08, height: 0.28, length: 0.06, chamferRadius: 0.01)
        crossV.firstMaterial?.diffuse.contents = UIColor.white
        crossV.firstMaterial?.lightingModel = .constant
        let cv = SCNNode(geometry: crossV)
        cv.position = SCNVector3(0, 0.02, 0.22)

        let crossH = SCNBox(width: 0.24, height: 0.08, length: 0.06, chamferRadius: 0.01)
        crossH.firstMaterial?.diffuse.contents = UIColor.white
        crossH.firstMaterial?.lightingModel = .constant
        let ch = SCNNode(geometry: crossH)
        ch.position = SCNVector3(0, 0.02, 0.22)

        root.addChildNode(body)
        root.addChildNode(cv)
        root.addChildNode(ch)
        return root
    }
}
