// ArenaSceneBuilder.swift
// Battle Royale open arena + small Multiplayer deathmatch map + Training yard.

import SceneKit
import UIKit

enum ArenaSceneBuilder {

    typealias Collider = MissionSceneBuilder.Collider

    /// Elevated / ramped floor patches. Movement stays XZ; Y is sampled from these each frame.
    struct WalkSurface {
        enum RampAxis {
            case x
            case z
        }

        var minX: Float
        var maxX: Float
        var minZ: Float
        var maxZ: Float
        /// Floor Y at the min edge of `rampAxis` (or flat height when `rampAxis` is nil).
        var yStart: Float
        /// Floor Y at the max edge of `rampAxis` (ignored when flat).
        var yEnd: Float
        var rampAxis: RampAxis?

        static func flat(minX: Float, maxX: Float, minZ: Float, maxZ: Float, y: Float) -> WalkSurface {
            WalkSurface(minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ, yStart: y, yEnd: y, rampAxis: nil)
        }

        static func ramp(
            minX: Float, maxX: Float, minZ: Float, maxZ: Float,
            yStart: Float, yEnd: Float, axis: RampAxis
        ) -> WalkSurface {
            WalkSurface(minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ, yStart: yStart, yEnd: yEnd, rampAxis: axis)
        }

        func heightIfContains(_ x: Float, _ z: Float) -> Float? {
            guard x >= minX, x <= maxX, z >= minZ, z <= maxZ else { return nil }
            guard let axis = rampAxis else { return yStart }
            switch axis {
            case .x:
                let span = max(0.001, maxX - minX)
                let t = (x - minX) / span
                return yStart + (yEnd - yStart) * t
            case .z:
                let span = max(0.001, maxZ - minZ)
                let t = (z - minZ) / span
                return yStart + (yEnd - yStart) * t
            }
        }
    }

    struct BuiltArena {
        let scene: SCNScene
        let playerSpawn: SCNVector3
        let teammateSpawns: [SCNVector3]
        let enemySpawns: [SCNVector3]
        let ammoSpawns: [SCNVector3]
        let medkitSpawns: [SCNVector3]
        let mapHalfExtent: Float
        let colliders: [Collider]
        /// Ramps / decks that lift actors above y=0 (deathmatch lookouts).
        let walkSurfaces: [WalkSurface]
        /// Initial storm radius (BR only). Center is origin.
        let zoneInitialRadius: Float
    }

    static func build(config: ArenaMatchConfig) -> BuiltArena {
        switch config.kind {
        case .battleRoyale:
            return buildBattleRoyale(config: config)
        case .teamDeathmatch, .quickMatch:
            return buildDeathmatch(config: config)
        }
    }

    // MARK: - Training yard

    /// Calm open yard for Training — lanes, berms, light cover, pickups. No storm.
    static func buildTraining(dummyCount: Int = 4) -> BuiltArena {
        let scene = SCNScene()
        scene.background.contents = UIColor(red: 0.48, green: 0.62, blue: 0.78, alpha: 1)
        addLighting(to: scene, warm: false, accent: UIColor(red: 1, green: 0.95, blue: 0.8, alpha: 1), accentY: 6)

        var colliders: [Collider] = []
        let groundSize: Float = 34
        addGround(to: scene, size: groundSize, color: UIColor(red: 0.30, green: 0.40, blue: 0.26, alpha: 1))

        // Gravel lane stripe (visual only)
        addDecoBox(scene: scene, w: 3.2, h: 0.03, d: 28, color: UIColor(red: 0.42, green: 0.40, blue: 0.34, alpha: 1), at: SCNVector3(0, 0.02, -1), name: "deco_lane")

        let wallH: Float = 3.6
        let half = groundSize * 0.5
        let wallTint = UIColor(red: 0.38, green: 0.40, blue: 0.34, alpha: 1)
        addBoxWall(scene: scene, center: SCNVector3(0, wallH * 0.5, -half), w: groundSize, h: wallH, d: 0.45, colliders: &colliders, tint: wallTint)
        addBoxWall(scene: scene, center: SCNVector3(0, wallH * 0.5, half), w: groundSize, h: wallH, d: 0.45, colliders: &colliders, tint: wallTint)
        addBoxWall(scene: scene, center: SCNVector3(-half, wallH * 0.5, 0), w: 0.45, h: wallH, d: groundSize, colliders: &colliders, tint: wallTint)
        addBoxWall(scene: scene, center: SCNVector3(half, wallH * 0.5, 0), w: 0.45, h: wallH, d: groundSize, colliders: &colliders, tint: wallTint)

        let sand = UIColor(red: 0.52, green: 0.44, blue: 0.32, alpha: 1)
        let concrete = UIColor(red: 0.48, green: 0.46, blue: 0.40, alpha: 1)

        // Cover layout — side berms, mid lane wall, corner crates (clear of spawn z=10)
        let covers: [(SCNVector3, Float, Float, Float, UIColor)] = [
            (SCNVector3(-6, 0.95, 2), 4.0, 1.9, 1.5, sand),
            (SCNVector3(6, 0.95, -1), 4.0, 1.9, 1.5, sand),
            (SCNVector3(0, 1.05, -7), 2.4, 2.1, 5.0, concrete),
            (SCNVector3(-9, 0.85, -9), 2.0, 1.7, 2.0, sand),
            (SCNVector3(9, 0.85, 5), 2.0, 1.7, 2.0, sand),
            (SCNVector3(-5, 0.8, -12), 3.2, 1.6, 1.4, concrete),
            (SCNVector3(5, 0.8, 8), 2.6, 1.6, 1.4, concrete),
            (SCNVector3(-8, 0.9, 8), 1.8, 1.8, 1.8, sand),
            (SCNVector3(8, 0.9, -11), 1.8, 1.8, 1.8, sand),
        ]
        for (c, w, h, d, tint) in covers {
            addCover(scene: scene, center: c, w: w, h: h, d: d, colliders: &colliders, tint: tint)
        }

        // Far berm landmark + watchtower (tower base collides)
        addCover(scene: scene, center: SCNVector3(0, 1.2, -14.5), w: 14, h: 2.4, d: 2.2, colliders: &colliders, tint: UIColor(red: 0.40, green: 0.34, blue: 0.24, alpha: 1))
        addCover(scene: scene, center: SCNVector3(-11, 2.4, -13), w: 1.6, h: 4.8, d: 1.6, colliders: &colliders, tint: concrete)
        addDecoBox(scene: scene, w: 2.4, h: 0.12, d: 2.4, color: UIColor(white: 0.55, alpha: 1), at: SCNVector3(-11, 4.9, -13), name: "deco_tower_roof")

        // Lane posts (visual)
        for z: Float in [4, -2, -8] {
            for x: Float in [-3.2, 3.2] {
                addDecoBox(scene: scene, w: 0.12, h: 0.9, d: 0.12, color: UIColor(red: 0.75, green: 0.6, blue: 0.15, alpha: 1), at: SCNVector3(x, 0.45, z), name: "deco_post")
            }
        }

        let playerSpawn = SCNVector3(0, 0, 11)
        let dummyCountClamped = max(0, min(6, dummyCount))
        let enemySpawns = scatterSpawns(
            count: dummyCountClamped,
            radiusMin: 5,
            radiusMax: 12,
            avoidNear: playerSpawn,
            avoidRadius: 6,
            avoidBoxes: colliders
        )

        let ammoSpawns = [
            SCNVector3(-4, 0.4, 6), SCNVector3(4, 0.4, -4), SCNVector3(-7, 0.4, -2), SCNVector3(7, 0.4, 2)
        ]
        let medkitSpawns = [
            SCNVector3(3, 0.4, 5), SCNVector3(-3, 0.4, -5), SCNVector3(0, 0.4, -10)
        ]

        return BuiltArena(
            scene: scene,
            playerSpawn: playerSpawn,
            teammateSpawns: [],
            enemySpawns: enemySpawns,
            ammoSpawns: ammoSpawns,
            medkitSpawns: medkitSpawns,
            mapHalfExtent: half - 1.2,
            colliders: colliders,
            walkSurfaces: [],
            zoneInitialRadius: 0
        )
    }

    // MARK: - Battle Royale

    private static func buildBattleRoyale(config: ArenaMatchConfig) -> BuiltArena {
        let scene = SCNScene()
        scene.background.contents = UIColor(red: 0.38, green: 0.55, blue: 0.70, alpha: 1)
        addLighting(to: scene, warm: false, accent: UIColor(red: 0.95, green: 0.9, blue: 0.75, alpha: 1), accentY: 10)

        var colliders: [Collider] = []
        let groundSize: Float = 74
        addGround(to: scene, size: groundSize, color: UIColor(red: 0.26, green: 0.34, blue: 0.20, alpha: 1))

        // Dirt roads (visual lanes between POIs)
        addDecoBox(scene: scene, w: 3.0, h: 0.025, d: 58, color: UIColor(red: 0.38, green: 0.34, blue: 0.26, alpha: 1), at: SCNVector3(0, 0.02, 0), name: "deco_road_ns")
        addDecoBox(scene: scene, w: 52, h: 0.025, d: 3.0, color: UIColor(red: 0.38, green: 0.34, blue: 0.26, alpha: 1), at: SCNVector3(0, 0.02, 0), name: "deco_road_ew")

        let wallH: Float = 3.4
        let half = groundSize * 0.5
        let fence = UIColor(red: 0.32, green: 0.34, blue: 0.28, alpha: 1)
        addBoxWall(scene: scene, center: SCNVector3(0, wallH * 0.5, -half), w: groundSize, h: wallH, d: 0.6, colliders: &colliders, tint: fence)
        addBoxWall(scene: scene, center: SCNVector3(0, wallH * 0.5, half), w: groundSize, h: wallH, d: 0.6, colliders: &colliders, tint: fence)
        addBoxWall(scene: scene, center: SCNVector3(-half, wallH * 0.5, 0), w: 0.6, h: wallH, d: groundSize, colliders: &colliders, tint: fence)
        addBoxWall(scene: scene, center: SCNVector3(half, wallH * 0.5, 0), w: 0.6, h: wallH, d: groundSize, colliders: &colliders, tint: fence)

        let wood = UIColor(red: 0.42, green: 0.36, blue: 0.28, alpha: 1)
        let metal = UIColor(red: 0.40, green: 0.42, blue: 0.45, alpha: 1)
        let stone = UIColor(red: 0.48, green: 0.46, blue: 0.40, alpha: 1)
        let rust = UIColor(red: 0.50, green: 0.32, blue: 0.18, alpha: 1)

        // POI clusters — Warehouse NW, Plaza center, Bunker SE, Dock NE, Ridge SW
        let covers: [(SCNVector3, Float, Float, Float, UIColor)] = [
            // Warehouse NW
            (SCNVector3(-18, 1.4, 16), 8, 2.8, 3.2, metal),
            (SCNVector3(-14, 1.1, 12), 4, 2.2, 5, wood),
            (SCNVector3(-22, 1.0, 10), 3, 2.0, 6, rust),
            // Plaza / mid
            (SCNVector3(-4, 1.0, 4), 5, 2.0, 2.2, stone),
            (SCNVector3(5, 1.0, -3), 4.5, 2.0, 2.2, stone),
            (SCNVector3(0, 1.15, 0), 3.2, 2.3, 3.2, wood),
            (SCNVector3(-6, 0.9, -6), 2.5, 1.8, 2.5, wood),
            (SCNVector3(7, 0.9, 7), 2.5, 1.8, 2.5, wood),
            // Bunker SE
            (SCNVector3(16, 1.3, -14), 7, 2.6, 4, stone),
            (SCNVector3(12, 1.0, -18), 3, 2.0, 8, metal),
            (SCNVector3(20, 0.95, -10), 4, 1.9, 3, rust),
            // Dock NE crates
            (SCNVector3(18, 1.2, 18), 5, 2.4, 3, metal),
            (SCNVector3(14, 1.0, 14), 3.5, 2.0, 3.5, rust),
            (SCNVector3(22, 0.9, 12), 2.5, 1.8, 6, wood),
            // Ridge SW
            (SCNVector3(-16, 1.1, -16), 6, 2.2, 2.8, stone),
            (SCNVector3(-20, 1.0, -12), 2.4, 2.0, 9, wood),
            (SCNVector3(-10, 0.9, -20), 7, 1.8, 2.2, rust),
            // Lane blockers / sightlines
            (SCNVector3(-8, 1.0, 22), 8, 2.0, 1.8, wood),
            (SCNVector3(8, 1.0, -24), 2.5, 2.0, 8, stone),
            (SCNVector3(-24, 1.0, 2), 2.2, 2.0, 10, metal),
            (SCNVector3(24, 1.0, -6), 2.2, 2.0, 8, metal),
            (SCNVector3(4, 0.85, 14), 3.5, 1.7, 3.5, wood),
            (SCNVector3(-12, 0.85, -4), 3.5, 1.7, 3.5, wood),
        ]
        for (c, w, h, d, tint) in covers {
            addCover(scene: scene, center: c, w: w, h: h, d: d, colliders: &colliders, tint: tint)
        }

        // Vertical landmarks (radio mast, crane boom, water tower)
        addCover(scene: scene, center: SCNVector3(-22, 4.0, 20), w: 1.4, h: 8.0, d: 1.4, colliders: &colliders, tint: metal)
        addDecoBox(scene: scene, w: 10, h: 0.35, d: 0.35, color: rust, at: SCNVector3(20, 6.5, 16), name: "deco_crane_arm")
        addCover(scene: scene, center: SCNVector3(20, 3.2, 16), w: 1.2, h: 6.4, d: 1.2, colliders: &colliders, tint: metal)
        addCover(scene: scene, center: SCNVector3(-18, 3.5, -20), w: 3.5, h: 3.5, d: 3.5, colliders: &colliders, tint: stone)
        addDecoCylinder(scene: scene, radius: 1.6, height: 0.5, color: UIColor(white: 0.55, alpha: 1), at: SCNVector3(-18, 5.5, -20), name: "deco_watertower")

        // Player spawn north road — keep clear
        let playerSpawn = SCNVector3(0, 0, 28)
        let teammateOffsets: [SCNVector3] = [
            SCNVector3(-2.2, 0, 1.2),
            SCNVector3(2.2, 0, 1.0),
            SCNVector3(0, 0, 2.4)
        ]
        let teammateSpawns = teammateOffsets.prefix(config.squadSize.teammateCount).map {
            SCNVector3(playerSpawn.x + $0.x, 0, playerSpawn.z + $0.z)
        }

        let enemySpawns = scatterSpawns(
            count: config.enemyCount,
            radiusMin: 10,
            radiusMax: 30,
            avoidNear: playerSpawn,
            avoidRadius: 12,
            avoidBoxes: colliders
        )

        let ammoSpawns = scatterSpawns(count: 10, radiusMin: 4, radiusMax: 28, avoidNear: playerSpawn, avoidRadius: 3, avoidBoxes: colliders)
            .map { SCNVector3($0.x, 0.4, $0.z) }
        let medkitSpawns = scatterSpawns(count: 6, radiusMin: 6, radiusMax: 26, avoidNear: playerSpawn, avoidRadius: 4, avoidBoxes: colliders)
            .map { SCNVector3($0.x, 0.4, $0.z) }

        let ring = SCNNode(geometry: SCNTube(innerRadius: 34.5, outerRadius: 35.5, height: 0.08))
        ring.name = "stormRing"
        ring.geometry?.firstMaterial?.diffuse.contents = UIColor(red: 0.55, green: 0.2, blue: 0.95, alpha: 0.55)
        ring.geometry?.firstMaterial?.emission.contents = UIColor(red: 0.45, green: 0.15, blue: 0.9, alpha: 0.4)
        ring.geometry?.firstMaterial?.lightingModel = .constant
        ring.position = SCNVector3(0, 0.05, 0)
        scene.rootNode.addChildNode(ring)

        return BuiltArena(
            scene: scene,
            playerSpawn: playerSpawn,
            teammateSpawns: Array(teammateSpawns),
            enemySpawns: enemySpawns,
            ammoSpawns: ammoSpawns,
            medkitSpawns: medkitSpawns,
            mapHalfExtent: half - 1.5,
            colliders: colliders,
            walkSurfaces: [],
            zoneInitialRadius: 34
        )
    }

    // MARK: - Deathmatch (NxN team arena — dense cover + opposite lookouts)

    private static func buildDeathmatch(config: ArenaMatchConfig) -> BuiltArena {
        let scene = SCNScene()
        scene.background.contents = UIColor(red: 0.10, green: 0.12, blue: 0.16, alpha: 1)
        addLighting(to: scene, warm: true, accent: UIColor(red: 1.0, green: 0.7, blue: 0.4, alpha: 1), accentY: 6)

        var colliders: [Collider] = []
        let groundSize: Float = 40
        addGround(to: scene, size: groundSize, color: UIColor(red: 0.20, green: 0.22, blue: 0.26, alpha: 1))

        // Mid-lane hazard stripe (visual)
        addDecoBox(scene: scene, w: 1.6, h: 0.02, d: 32, color: UIColor(red: 0.55, green: 0.45, blue: 0.12, alpha: 1), at: SCNVector3(0, 0.02, 0), name: "deco_hazard")

        let wallH: Float = 4.4
        let half = groundSize * 0.5
        let wallTint = UIColor(red: 0.28, green: 0.30, blue: 0.34, alpha: 1)
        addBoxWall(scene: scene, center: SCNVector3(0, wallH * 0.5, -half), w: groundSize, h: wallH, d: 0.5, colliders: &colliders, tint: wallTint)
        addBoxWall(scene: scene, center: SCNVector3(0, wallH * 0.5, half), w: groundSize, h: wallH, d: 0.5, colliders: &colliders, tint: wallTint)
        addBoxWall(scene: scene, center: SCNVector3(-half, wallH * 0.5, 0), w: 0.5, h: wallH, d: groundSize, colliders: &colliders, tint: wallTint)
        addBoxWall(scene: scene, center: SCNVector3(half, wallH * 0.5, 0), w: 0.5, h: wallH, d: groundSize, colliders: &colliders, tint: wallTint)

        let blue = UIColor(red: 0.32, green: 0.38, blue: 0.48, alpha: 1)
        let rust = UIColor(red: 0.48, green: 0.30, blue: 0.18, alpha: 1)
        let gray = UIColor(red: 0.36, green: 0.38, blue: 0.42, alpha: 1)
        let sand = UIColor(red: 0.55, green: 0.48, blue: 0.34, alpha: 1)
        let wood = UIColor(red: 0.42, green: 0.34, blue: 0.24, alpha: 1)
        let concrete = UIColor(red: 0.40, green: 0.41, blue: 0.43, alpha: 1)

        // Opposite lookout towers — south (Team A side) vs north (Team B side)
        var walkSurfaces: [WalkSurface] = []
        addLookoutTower(
            scene: scene,
            base: SCNVector3(0, 0, 13.0),
            colliders: &colliders,
            walkSurfaces: &walkSurfaces,
            shaftTint: blue,
            accent: UIColor(red: 0.2, green: 0.85, blue: 0.8, alpha: 1),
            namePrefix: "tower_a",
            rampSignX: 1
        )
        addLookoutTower(
            scene: scene,
            base: SCNVector3(0, 0, -13.0),
            colliders: &colliders,
            walkSurfaces: &walkSurfaces,
            shaftTint: rust,
            accent: UIColor(red: 0.95, green: 0.35, blue: 0.25, alpha: 1),
            namePrefix: "tower_b",
            rampSignX: -1
        )

        // Dense mid-field + flank cover (crates, barriers, sandbags, short walls)
        let covers: [(SCNVector3, Float, Float, Float, UIColor)] = [
            // Mid cluster
            (SCNVector3(0, 1.05, 0), 3.0, 2.1, 3.0, gray),
            (SCNVector3(-2.4, 0.7, 1.8), 1.6, 1.4, 1.4, wood),
            (SCNVector3(2.4, 0.7, -1.8), 1.6, 1.4, 1.4, wood),
            (SCNVector3(-1.2, 0.55, -2.2), 2.2, 1.1, 0.7, sand),
            (SCNVector3(1.2, 0.55, 2.2), 2.2, 1.1, 0.7, sand),
            // Lane blockers
            (SCNVector3(-5.5, 0.95, 0), 1.4, 1.9, 5.5, concrete),
            (SCNVector3(5.5, 0.95, 0), 1.4, 1.9, 5.5, concrete),
            (SCNVector3(0, 0.85, 5.5), 5.0, 1.7, 1.3, gray),
            (SCNVector3(0, 0.85, -5.5), 5.0, 1.7, 1.3, gray),
            // West flank rooms
            (SCNVector3(-10, 1.15, 4), 4.2, 2.3, 1.5, blue),
            (SCNVector3(-10, 1.15, -4), 4.2, 2.3, 1.5, blue),
            (SCNVector3(-12.5, 1.0, 0), 1.5, 2.0, 6.0, blue),
            (SCNVector3(-8, 0.6, 8), 2.4, 1.2, 0.8, sand),
            (SCNVector3(-8, 0.6, -8), 2.4, 1.2, 0.8, sand),
            (SCNVector3(-14, 0.85, 8), 1.8, 1.7, 1.8, wood),
            (SCNVector3(-14, 0.85, -8), 1.8, 1.7, 1.8, wood),
            // East flank rooms
            (SCNVector3(10, 1.15, 4), 4.2, 2.3, 1.5, rust),
            (SCNVector3(10, 1.15, -4), 4.2, 2.3, 1.5, rust),
            (SCNVector3(12.5, 1.0, 0), 1.5, 2.0, 6.0, rust),
            (SCNVector3(8, 0.6, 8), 2.4, 1.2, 0.8, sand),
            (SCNVector3(8, 0.6, -8), 2.4, 1.2, 0.8, sand),
            (SCNVector3(14, 0.85, 8), 1.8, 1.7, 1.8, wood),
            (SCNVector3(14, 0.85, -8), 1.8, 1.7, 1.8, wood),
            // South (Team A) spawn cover rings
            (SCNVector3(-4.5, 0.75, 16.0), 2.0, 1.5, 1.4, sand),
            (SCNVector3(4.5, 0.75, 16.0), 2.0, 1.5, 1.4, sand),
            // Keep clear of tower_a east ramp (+X at z≈13)
            (SCNVector3(-9.5, 0.95, 10.0), 1.5, 1.9, 2.0, gray),
            (SCNVector3(9.5, 0.95, 10.0), 1.5, 1.9, 2.0, gray),
            (SCNVector3(0, 0.55, 15.2), 3.2, 1.1, 0.7, sand),
            // North (Team B) spawn cover rings
            (SCNVector3(-4.5, 0.75, -16.0), 2.0, 1.5, 1.4, sand),
            (SCNVector3(4.5, 0.75, -16.0), 2.0, 1.5, 1.4, sand),
            // Keep clear of tower_b west ramp (−X at z≈−13)
            (SCNVector3(-9.5, 0.95, -10.0), 1.5, 1.9, 2.0, gray),
            (SCNVector3(9.5, 0.95, -10.0), 1.5, 1.9, 2.0, gray),
            (SCNVector3(0, 0.55, -15.2), 3.2, 1.1, 0.7, sand),
            // Diagonal crate stacks
            (SCNVector3(-4, 1.2, 4), 1.8, 2.4, 1.8, wood),
            (SCNVector3(4, 1.2, -4), 1.8, 2.4, 1.8, wood),
            (SCNVector3(-4, 1.2, -4), 1.8, 2.4, 1.8, concrete),
            (SCNVector3(4, 1.2, 4), 1.8, 2.4, 1.8, concrete),
            // Corner barriers
            (SCNVector3(-15, 1.1, 15), 2.2, 2.2, 2.2, gray),
            (SCNVector3(15, 1.1, 15), 2.2, 2.2, 2.2, gray),
            (SCNVector3(-15, 1.1, -15), 2.2, 2.2, 2.2, gray),
            (SCNVector3(15, 1.1, -15), 2.2, 2.2, 2.2, gray),
            // Extra sandbag lines
            (SCNVector3(-3, 0.5, 7), 2.8, 1.0, 0.65, sand),
            (SCNVector3(3, 0.5, -7), 2.8, 1.0, 0.65, sand),
            (SCNVector3(-11, 0.5, 11), 2.0, 1.0, 0.65, sand),
            (SCNVector3(11, 0.5, -11), 2.0, 1.0, 0.65, sand),
        ]
        for (c, w, h, d, tint) in covers {
            addCover(scene: scene, center: c, w: w, h: h, d: d, colliders: &colliders, tint: tint)
        }

        // Light visual accents only (no collider cost)
        for z: Float in [8, -8] {
            addDecoBox(scene: scene, w: 10, h: 0.08, d: 0.18, color: UIColor(red: 1, green: 0.55, blue: 0.2, alpha: 1), at: SCNVector3(0, 3.5, z), name: "deco_glow", emission: UIColor(red: 0.5, green: 0.2, blue: 0.05, alpha: 1))
        }

        // Fair opposite spawns: Team A south, Team B north
        let playerSpawn = SCNVector3(0, 0, 17.8)
        let teammateOffsets: [SCNVector3] = [
            SCNVector3(-2.0, 0, 0.4),
            SCNVector3(2.0, 0, 0.4),
            SCNVector3(0, 0, 1.2)
        ]
        let teammateSpawns = teammateOffsets.prefix(config.squadSize.teammateCount).map {
            SCNVector3(playerSpawn.x + $0.x, 0, playerSpawn.z + $0.z)
        }

        let enemyOffsets: [SCNVector3] = [
            SCNVector3(0, 0, 0),
            SCNVector3(-2.0, 0, -0.4),
            SCNVector3(2.0, 0, -0.4),
            SCNVector3(0, 0, -1.2)
        ]
        let enemyAnchor = SCNVector3(0, 0, -17.8)
        let enemySpawns = Array(enemyOffsets.prefix(max(0, config.enemyCount))).map {
            SCNVector3(enemyAnchor.x + $0.x, 0, enemyAnchor.z + $0.z)
        }

        let ammoSpawns = [
            SCNVector3(-6, 0.4, 3), SCNVector3(6, 0.4, -3), SCNVector3(-3, 0.4, -6),
            SCNVector3(3, 0.4, 6), SCNVector3(-12, 0.4, 0), SCNVector3(12, 0.4, 0)
        ]
        let medkitSpawns = [
            SCNVector3(5, 0.4, 10), SCNVector3(-5, 0.4, -10), SCNVector3(0, 0.4, 3)
        ]

        return BuiltArena(
            scene: scene,
            playerSpawn: playerSpawn,
            teammateSpawns: Array(teammateSpawns),
            enemySpawns: enemySpawns,
            ammoSpawns: Array(ammoSpawns.prefix(6)),
            medkitSpawns: Array(medkitSpawns.prefix(3)),
            mapHalfExtent: half - 1.2,
            colliders: colliders,
            walkSurfaces: walkSurfaces,
            zoneInitialRadius: 0
        )
    }

    /// Climbable lookout: thin shaft pillar, solid deck, east/west ramp walkway.
    /// Players and AI walk the ramp onto the deck and shoot from elevated Y.
    private static func addLookoutTower(
        scene: SCNScene,
        base: SCNVector3,
        colliders: inout [Collider],
        walkSurfaces: inout [WalkSurface],
        shaftTint: UIColor,
        accent: UIColor,
        namePrefix: String,
        rampSignX: Float
    ) {
        let shaftH: Float = 4.8
        let pillarW: Float = 1.05
        let deckHalf: Float = 2.05
        let deckY: Float = shaftH + 0.06
        let sand = UIColor(red: 0.55, green: 0.48, blue: 0.34, alpha: 1)
        let deckTint = UIColor(white: 0.22, alpha: 1)
        let railTint = UIColor(white: 0.18, alpha: 1)
        let wood = UIColor(red: 0.42, green: 0.34, blue: 0.24, alpha: 1)

        // Thin central pillar — blocks path through center; deck perimeter stays walkable for LOS.
        addCover(
            scene: scene,
            center: SCNVector3(base.x, shaftH * 0.5, base.z),
            w: pillarW, h: shaftH, d: pillarW,
            colliders: &colliders,
            tint: shaftTint
        )
        // Visual wider shaft sleeves (no collider) so the tower still reads tall/solid.
        addDecoBox(
            scene: scene,
            w: 1.7, h: shaftH * 0.92, d: 0.14,
            color: shaftTint.withAlphaComponent(0.92),
            at: SCNVector3(base.x, shaftH * 0.46, base.z + 0.78),
            name: "\(namePrefix)_sleeve"
        )
        addDecoBox(
            scene: scene,
            w: 1.7, h: shaftH * 0.92, d: 0.14,
            color: shaftTint.withAlphaComponent(0.92),
            at: SCNVector3(base.x, shaftH * 0.46, base.z - 0.78),
            name: "\(namePrefix)_sleeve"
        )
        // Closed flank opposite the ramp (solid wall panel + collider)
        let closedX = base.x - rampSignX * 0.88
        addCover(
            scene: scene,
            center: SCNVector3(closedX, shaftH * 0.45, base.z),
            w: 0.18, h: shaftH * 0.9, d: 1.7,
            colliders: &colliders,
            tint: shaftTint
        )

        // Base pad — open on ramp side
        addCover(
            scene: scene,
            center: SCNVector3(base.x - rampSignX * 0.35, 0.4, base.z),
            w: 3.4, h: 0.8, d: 3.6,
            colliders: &colliders,
            tint: UIColor(red: 0.30, green: 0.32, blue: 0.35, alpha: 1)
        )

        // Sandbag ring — skip ramp approach side
        addCover(scene: scene, center: SCNVector3(base.x, 0.5, base.z - 2.35), w: 2.4, h: 1.0, d: 0.7, colliders: &colliders, tint: sand)
        addCover(scene: scene, center: SCNVector3(base.x, 0.5, base.z + 2.35), w: 2.4, h: 1.0, d: 0.7, colliders: &colliders, tint: sand)
        addCover(
            scene: scene,
            center: SCNVector3(base.x - rampSignX * 2.35, 0.5, base.z),
            w: 0.7, h: 1.0, d: 2.0,
            colliders: &colliders,
            tint: sand
        )

        // Deck floor (visual + walk surface). Railings open toward ramp.
        addDecoBox(
            scene: scene,
            w: deckHalf * 2, h: 0.16, d: deckHalf * 2,
            color: deckTint,
            at: SCNVector3(base.x, deckY, base.z),
            name: "\(namePrefix)_deck"
        )
        walkSurfaces.append(.flat(
            minX: base.x - deckHalf,
            maxX: base.x + deckHalf,
            minZ: base.z - deckHalf,
            maxZ: base.z + deckHalf,
            y: deckY
        ))

        let railH: Float = 0.85
        let railY = deckY + railH * 0.5 + 0.08
        addDecoBox(scene: scene, w: deckHalf * 2, h: railH, d: 0.1, color: railTint, at: SCNVector3(base.x, railY, base.z + deckHalf - 0.08), name: "\(namePrefix)_rail")
        addDecoBox(scene: scene, w: deckHalf * 2, h: railH, d: 0.1, color: railTint, at: SCNVector3(base.x, railY, base.z - deckHalf + 0.08), name: "\(namePrefix)_rail")
        // Closed-side railing only (ramp side open)
        addDecoBox(
            scene: scene,
            w: 0.1, h: railH, d: deckHalf * 2 - 0.2,
            color: railTint,
            at: SCNVector3(base.x - rampSignX * (deckHalf - 0.08), railY, base.z),
            name: "\(namePrefix)_rail"
        )

        // Ramp: walkable (no XZ blocker on the path), rises along ±X toward the deck.
        let rampLen: Float = 7.2
        let rampW: Float = 2.15
        let rampInner = base.x + rampSignX * (deckHalf - 0.15)
        let rampOuter = rampInner + rampSignX * rampLen
        let rampMinX = min(rampInner, rampOuter)
        let rampMaxX = max(rampInner, rampOuter)
        let rampMinZ = base.z - rampW * 0.5
        let rampMaxZ = base.z + rampW * 0.5

        // Visual ramp plank (tilted box)
        let rampMidX = (rampMinX + rampMaxX) * 0.5
        let rampMidY = deckY * 0.5
        let rampBox = SCNBox(width: CGFloat(rampLen), height: 0.14, length: CGFloat(rampW), chamferRadius: 0)
        rampBox.firstMaterial?.diffuse.contents = wood
        rampBox.firstMaterial?.lightingModel = .constant
        let rampNode = SCNNode(geometry: rampBox)
        rampNode.position = SCNVector3(rampMidX, rampMidY, base.z)
        // Pitch so the +local-X end is higher when rampSignX > 0.
        let slope = atan2(deckY, rampLen)
        rampNode.eulerAngles.z = rampSignX > 0 ? -slope : slope
        rampNode.name = "\(namePrefix)_ramp"
        scene.rootNode.addChildNode(rampNode)

        // Side rails along ramp (thin colliders keep you on the walkway)
        let railPad: Float = 0.16
        addCover(
            scene: scene,
            center: SCNVector3(rampMidX, 0.55, rampMaxZ + railPad),
            w: rampLen * 0.95, h: 1.1, d: 0.22,
            colliders: &colliders,
            tint: wood
        )
        addCover(
            scene: scene,
            center: SCNVector3(rampMidX, 0.55, rampMinZ - railPad),
            w: rampLen * 0.95, h: 1.1, d: 0.22,
            colliders: &colliders,
            tint: wood
        )

        // Walk surface: y rises from ground at outer end → deck at inner end.
        let yAtMinX: Float = rampSignX > 0 ? 0 : deckY
        let yAtMaxX: Float = rampSignX > 0 ? deckY : 0
        walkSurfaces.append(.ramp(
            minX: rampMinX, maxX: rampMaxX,
            minZ: rampMinZ, maxZ: rampMaxZ,
            yStart: yAtMinX, yEnd: yAtMaxX,
            axis: .x
        ))

        // Accent beacon
        addDecoBox(
            scene: scene,
            w: 0.35, h: 0.35, d: 0.35,
            color: accent,
            at: SCNVector3(base.x, deckY + 1.15, base.z),
            name: "\(namePrefix)_beacon",
            emission: accent
        )
    }

    // MARK: - Helpers

    private static func addLighting(to scene: SCNScene, warm: Bool, accent: UIColor? = nil, accentY: Float = 6) {
        let ambient = SCNNode()
        ambient.light = SCNLight()
        ambient.light?.type = .ambient
        ambient.light?.intensity = warm ? 380 : 500
        ambient.light?.color = warm
            ? UIColor(red: 0.85, green: 0.78, blue: 0.7, alpha: 1)
            : UIColor(red: 0.72, green: 0.80, blue: 0.90, alpha: 1)
        scene.rootNode.addChildNode(ambient)

        let sun = SCNNode()
        sun.light = SCNLight()
        sun.light?.type = .directional
        sun.light?.intensity = warm ? 750 : 920
        sun.light?.castsShadow = false
        sun.eulerAngles = SCNVector3(-0.9, 0.4, 0)
        scene.rootNode.addChildNode(sun)

        // At most one accent omni — cheap atmosphere
        if let accent {
            let omni = SCNNode()
            omni.light = SCNLight()
            omni.light?.type = .omni
            omni.light?.intensity = warm ? 420 : 320
            omni.light?.color = accent
            omni.light?.attenuationStartDistance = 4
            omni.light?.attenuationEndDistance = 28
            omni.light?.castsShadow = false
            omni.position = SCNVector3(0, accentY, 0)
            scene.rootNode.addChildNode(omni)
        }
    }

    private static func addGround(to scene: SCNScene, size: Float, color: UIColor) {
        let plane = SCNNode(geometry: SCNPlane(width: CGFloat(size), height: CGFloat(size)))
        plane.geometry?.firstMaterial?.diffuse.contents = color
        plane.geometry?.firstMaterial?.lightingModel = .constant
        plane.geometry?.firstMaterial?.isDoubleSided = true
        plane.eulerAngles.x = -.pi / 2
        plane.position = SCNVector3(0, 0.01, 0)
        plane.name = "ground"
        scene.rootNode.addChildNode(plane)
    }

    private static func addBoxWall(
        scene: SCNScene,
        center: SCNVector3,
        w: Float, h: Float, d: Float,
        colliders: inout [Collider],
        tint: UIColor = UIColor(white: 0.25, alpha: 1)
    ) {
        let node = SCNNode(geometry: SCNBox(width: CGFloat(w), height: CGFloat(h), length: CGFloat(d), chamferRadius: 0))
        node.geometry?.firstMaterial?.diffuse.contents = tint
        node.geometry?.firstMaterial?.lightingModel = .constant
        node.position = center
        scene.rootNode.addChildNode(node)
        let topY = center.y + h * 0.5
        colliders.append(.fromBox(center: center, width: w, depth: d, padding: 0.05, topY: topY))
    }

    private static func addCover(
        scene: SCNScene,
        center: SCNVector3,
        w: Float, h: Float, d: Float,
        colliders: inout [Collider],
        tint: UIColor = UIColor(red: 0.4, green: 0.38, blue: 0.32, alpha: 1)
    ) {
        let node = SCNNode(geometry: SCNBox(width: CGFloat(w), height: CGFloat(h), length: CGFloat(d), chamferRadius: 0.04))
        node.geometry?.firstMaterial?.diffuse.contents = tint
        node.geometry?.firstMaterial?.lightingModel = .constant
        node.position = center
        scene.rootNode.addChildNode(node)
        let topY = center.y + h * 0.5
        colliders.append(.fromBox(center: SCNVector3(center.x, 0, center.z), width: w, depth: d, padding: 0.08, topY: topY))
    }

    private static func addDecoBox(
        scene: SCNScene,
        w: Float, h: Float, d: Float,
        color: UIColor,
        at: SCNVector3,
        name: String,
        emission: UIColor? = nil
    ) {
        let box = SCNBox(width: CGFloat(w), height: CGFloat(h), length: CGFloat(d), chamferRadius: 0)
        box.firstMaterial?.diffuse.contents = color
        box.firstMaterial?.lightingModel = .constant
        if let emission {
            box.firstMaterial?.emission.contents = emission
        }
        let n = SCNNode(geometry: box)
        n.position = at
        n.name = name
        scene.rootNode.addChildNode(n)
    }

    private static func addDecoCylinder(
        scene: SCNScene,
        radius: CGFloat,
        height: CGFloat,
        color: UIColor,
        at: SCNVector3,
        name: String
    ) {
        let cyl = SCNCylinder(radius: radius, height: height)
        cyl.firstMaterial?.diffuse.contents = color
        cyl.firstMaterial?.lightingModel = .constant
        let n = SCNNode(geometry: cyl)
        n.position = at
        n.name = name
        scene.rootNode.addChildNode(n)
    }

    private static func scatterSpawns(
        count: Int,
        radiusMin: Float,
        radiusMax: Float,
        avoidNear: SCNVector3,
        avoidRadius: Float,
        avoidBoxes: [Collider] = []
    ) -> [SCNVector3] {
        var result: [SCNVector3] = []
        var attempts = 0
        let agentR: Float = 0.55
        while result.count < count && attempts < count * 50 {
            attempts += 1
            let angle = Float.random(in: 0...(Float.pi * 2))
            let r = Float.random(in: radiusMin...radiusMax)
            let x = cos(angle) * r
            let z = sin(angle) * r
            let dx = x - avoidNear.x
            let dz = z - avoidNear.z
            if dx * dx + dz * dz < avoidRadius * avoidRadius { continue }
            if avoidBoxes.contains(where: { $0.contains(x, z, radius: agentR) }) { continue }
            var ok = true
            for existing in result {
                let ex = x - existing.x
                let ez = z - existing.z
                if ex * ex + ez * ez < 9 { ok = false; break }
            }
            if ok {
                result.append(SCNVector3(x, 0, z))
            }
        }
        while result.count < count {
            let i = result.count
            let a = Float(i) / Float(max(1, count)) * Float.pi * 2
            let r = (radiusMin + radiusMax) * 0.5
            let x = cos(a) * r
            let z = sin(a) * r
            if avoidBoxes.contains(where: { $0.contains(x, z, radius: agentR) }) {
                result.append(SCNVector3(x * 0.7, 0, z * 0.7))
            } else {
                result.append(SCNVector3(x, 0, z))
            }
        }
        return result
    }
}
