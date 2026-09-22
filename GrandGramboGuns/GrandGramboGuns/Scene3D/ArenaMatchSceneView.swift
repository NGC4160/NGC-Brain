// ArenaMatchSceneView.swift
// Shared combat for Battle Royale + Multiplayer practice matches.
// Reuses MissionSceneBuilder helpers; throttles AI for SceneKit stability.

import SwiftUI
import SceneKit
import UIKit

struct ArenaMatchSceneView: UIViewRepresentable {
    let config: ArenaMatchConfig
    let blueprint: GunBlueprint
    let teammateCallsigns: [String]

    @Binding var health: Double
    @Binding var ammo: Int
    @Binding var statusMessage: String
    @Binding var isFiring: Bool
    @Binding var moveAxis: CGPoint
    @Binding var outcome: ArenaMatchOutcome?
    @Binding var livingEnemies: Int
    @Binding var livingSquads: Int
    @Binding var playerKills: Int
    @Binding var teamKills: Int
    /// Team B elim score (TDM). Unused / zero in Battle Royale.
    @Binding var enemyTeamKills: Int
    @Binding var zoneRadius: Float
    @Binding var matchTimeRemaining: Int
    @Binding var squadHP: [Double]
    @Binding var squadAlive: [Bool]

    var combatEnabled: Bool
    var hapticsEnabled: Bool
    var soundVolume: Double
    var magSize: Int
    var thirdPersonMode: Bool
    var operatorProfile: OperatorProfile
    var difficulty: StoryDifficulty
    /// Fired on main when the local player scores an elim (XP grant hook).
    var onPlayerKill: (() -> Void)? = nil
    var onCombatJuice: ((CombatJuiceKind) -> Void)? = nil

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.antialiasingMode = .none
        view.allowsCameraControl = false
        view.preferredFramesPerSecond = 30
        view.isPlaying = false
        view.backgroundColor = .black
        view.isMultipleTouchEnabled = true
        view.autoenablesDefaultLighting = false
        view.contentScaleFactor = min(UIScreen.main.scale, 2.0)

        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handlePan(_:)))
        pan.maximumNumberOfTouches = 1
        view.addGestureRecognizer(pan)

        context.coordinator.configure(
            view: view,
            config: config,
            blueprint: blueprint,
            magSize: magSize,
            thirdPersonMode: thirdPersonMode,
            operatorProfile: operatorProfile,
            difficulty: difficulty,
            teammateCallsigns: teammateCallsigns
        )
        view.delegate = context.coordinator
        view.isPlaying = false
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        let c = context.coordinator
        c.healthBinding = $health
        c.ammoBinding = $ammo
        c.statusBinding = $statusMessage
        c.outcomeBinding = $outcome
        c.livingEnemiesBinding = $livingEnemies
        c.livingSquadsBinding = $livingSquads
        c.playerKillsBinding = $playerKills
        c.teamKillsBinding = $teamKills
        c.enemyTeamKillsBinding = $enemyTeamKills
        c.zoneRadiusBinding = $zoneRadius
        c.matchTimeBinding = $matchTimeRemaining
        c.squadHPBinding = $squadHP
        c.squadAliveBinding = $squadAlive
        c.hapticsEnabled = hapticsEnabled
        c.soundVolume = soundVolume
        c.magSize = magSize
        c.moveAxis = moveAxis
        c.operatorProfile = operatorProfile
        c.difficulty = difficulty
        c.moveSpeed = 5.8 * operatorProfile.moveSpeedMultiplier
        c.aiProfile = EnemyCombatAI.profile(difficulty: difficulty, mode: .arena)
        c.enemyHitChance = c.aiProfile.hitChance
        c.onPlayerKill = onPlayerKill
        c.onCombatJuice = onCombatJuice

        c.setCombatEnabled(combatEnabled)

        if c.thirdPersonMode != thirdPersonMode {
            c.thirdPersonMode = thirdPersonMode
            c.applyCameraMode()
        }

        if c.blueprint?.id != blueprint.id {
            let wasFiring = c.wantsFiring
            if wasFiring { c.stopFiring() }
            c.applyWeapon(blueprint)
            c.magSize = magSize
            c.syncAmmo(ammo)
            if wasFiring, combatEnabled { c.startFiring() }
        } else {
            c.magSize = magSize
            if !isFiring {
                c.syncAmmo(ammo)
            }
        }

        let wantFire = isFiring && combatEnabled
        if wantFire != c.wantsFiring {
            c.wantsFiring = wantFire
            if wantFire { c.startFiring() } else { c.stopFiring() }
        }
    }

    static func dismantleUIView(_ uiView: SCNView, coordinator: Coordinator) {
        coordinator.teardown()
        uiView.delegate = nil
        uiView.isPlaying = false
        uiView.scene = nil
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator: NSObject, SCNSceneRendererDelegate {
        weak var scnView: SCNView?
        var config: ArenaMatchConfig?
        var blueprint: GunBlueprint?
        var magSize = 30

        var healthBinding: Binding<Double>?
        var ammoBinding: Binding<Int>?
        var statusBinding: Binding<String>?
        var outcomeBinding: Binding<ArenaMatchOutcome?>?
        var livingEnemiesBinding: Binding<Int>?
        var livingSquadsBinding: Binding<Int>?
        var playerKillsBinding: Binding<Int>?
        var teamKillsBinding: Binding<Int>?
        var enemyTeamKillsBinding: Binding<Int>?
        var zoneRadiusBinding: Binding<Float>?
        var matchTimeBinding: Binding<Int>?
        var squadHPBinding: Binding<[Double]>?
        var squadAliveBinding: Binding<[Bool]>?
        var onPlayerKill: (() -> Void)?
        var onCombatJuice: ((CombatJuiceKind) -> Void)?

        var hapticsEnabled = true
        var soundVolume = 0.9
        var moveAxis: CGPoint = .zero
        var thirdPersonMode = true
        var operatorProfile = OperatorProfile.all[0]
        var difficulty: StoryDifficulty = .medium
        var enemyHitChance: Float = 0.17
        var aiProfile = EnemyCombatAI.profile(difficulty: .medium, mode: .arena)
        var moveSpeed: Float = 5.2
        var wantsFiring = false

        private var yaw: Float = .pi
        private var pitch: Float = 0
        private var fireTimer: Timer?
        private var enemyHP: [String: Int] = [:]
        private var enemyMaxHP: [String: Int] = [:]
        private var enemyWeapon: [String: MissionSceneBuilder.EnemyWeapon] = [:]
        private var enemyNextAttack: [String: Date] = [:]
        private var enemyBurstLeft: [String: Int] = [:]
        private var enemySeekCoverUntil: [String: Date] = [:]
        private var enemySquadID: [String: Int] = [:]
        private var lastPlayerEye = SCNVector3(0, 0, 0)
        private var playerSpeedXZ: Float = 0
        private var hasPlayerEyeSample = false
        private var finished = false
        private var sceneConfigured = false
        private var combatEnabled = false
        private var combatGraceUntil = Date.distantPast
        private var playerHurtCooldown = Date.distantPast
        private var lastUpdateTime: TimeInterval = 0
        private var lastEnemySoundTime: CFTimeInterval = 0
        private var ammoCache: Int = 30
        private var healthCache: Double = 100
        private var mapHalfExtent: Float = 18
        private var colliders: [MissionSceneBuilder.Collider] = []
        private var walkSurfaces: [ArenaSceneBuilder.WalkSurface] = []
        /// Arena hostile damage to player / mates (Story stays at 10 in MissionSceneView).
        private let arenaEnemyDamage: Double = 16
        private var enemyNodes: [SCNNode] = []
        private var enemyWeaponNode: [ObjectIdentifier: SCNNode] = [:]
        private var pickupNodes: [SCNNode] = []
        private var enemyAITick = 0
        private var teammateAITick = 0
        private var activeFXCount = 0
        private let maxActiveFX = 6
        private var lastStatusAt: CFTimeInterval = 0
        private var lastStatusText = ""
        private var lookPanEnabled = false
        private var playerKillsCache = 0
        private var teamKillsCache = 0
        private var enemyTeamKillsCache = 0
        private var matchEndTime = Date.distantFuture
        private var lastPublishedTime = -1
        private var combatPausedAt: Date?
        private var lastPublishedLivingEnemies = Int.max
        private var lastPublishedLivingSquads = Int.max

        // Storm (BR)
        private var zoneRadiusCache: Float = 34
        private var zoneMinRadius: Float = 6
        private var zoneShrinkPerSec: Float = 0.55
        private var stormDamageCooldown = Date.distantPast
        private weak var stormRing: SCNNode?

        // Teammates
        private struct MateState {
            weak var node: SCNNode?
            weak var gun: SCNNode?
            var callsign: String
            var hp: Double
            var maxHP: Double
            var alive: Bool
            var nextFire: Date
            var hurtCooldown: Date
        }
        private var mates: [MateState] = []
        private var cachedNearestEnemy: SCNNode?
        private weak var playerFocusEnemy: SCNNode?
        private var playerUnderFireUntil = Date.distantPast
        private var teammateAIProfile = TeammateCombatAI.profile(mode: .arena)

        private let playerRadius: Float = 0.34

        private weak var playerAnchor: SCNNode?
        private weak var playerBody: SCNNode?
        private weak var playerCamera: SCNNode?
        private weak var fpGun: SCNNode?
        private weak var tpGun: SCNNode?

        func teardown() {
            stopFiring()
            wantsFiring = false
            combatEnabled = false
            sceneConfigured = false
            finished = true
            scnView?.isPlaying = false
            scnView?.delegate = nil
            scnView = nil
            enemyNodes.removeAll()
            enemyWeaponNode.removeAll()
            pickupNodes.removeAll()
            mates.removeAll()
            playerAnchor = nil
            playerBody = nil
            playerCamera = nil
            fpGun = nil
            tpGun = nil
            stormRing = nil
            cachedNearestEnemy = nil
        }

        func setCombatEnabled(_ enabled: Bool) {
            let was = combatEnabled
            combatEnabled = enabled && sceneConfigured && !finished
            if combatEnabled {
                scnView?.preferredFramesPerSecond = 30
                scnView?.isPlaying = true
                if !was {
                    let now = Date()
                    lastUpdateTime = 0
                    combatGraceUntil = now.addingTimeInterval(1.2)
                    playerHurtCooldown = combatGraceUntil
                    let arm = now.addingTimeInterval(0.85)
                    for key in enemyNextAttack.keys { enemyNextAttack[key] = arm }
                    for i in mates.indices {
                        mates[i].hurtCooldown = combatGraceUntil
                        mates[i].nextFire = now.addingTimeInterval(0.7)
                    }
                    if let cfg = config, cfg.kind != .battleRoyale, cfg.matchDurationSeconds > 0 {
                        if let pausedAt = combatPausedAt, matchEndTime != .distantFuture {
                            matchEndTime = matchEndTime.addingTimeInterval(now.timeIntervalSince(pausedAt))
                        } else if matchEndTime == .distantFuture {
                            matchEndTime = now.addingTimeInterval(TimeInterval(cfg.matchDurationSeconds))
                        }
                    }
                    combatPausedAt = nil
                    if let ammoBinding {
                        ammoCache = ammoBinding.wrappedValue
                    }
                }
            } else {
                if was {
                    combatPausedAt = Date()
                }
                scnView?.preferredFramesPerSecond = 15
                scnView?.isPlaying = false
                if wantsFiring { stopFiring(); wantsFiring = false }
            }
        }

        func configure(
            view: SCNView,
            config: ArenaMatchConfig,
            blueprint: GunBlueprint,
            magSize: Int,
            thirdPersonMode: Bool,
            operatorProfile: OperatorProfile,
            difficulty: StoryDifficulty,
            teammateCallsigns: [String]
        ) {
            scnView = view
            self.config = config
            self.blueprint = blueprint
            self.magSize = magSize
            self.thirdPersonMode = thirdPersonMode
            self.operatorProfile = operatorProfile
            self.difficulty = difficulty
            self.aiProfile = EnemyCombatAI.profile(difficulty: difficulty, mode: .arena)
            self.teammateAIProfile = TeammateCombatAI.profile(mode: .arena, difficulty: difficulty)
            self.enemyHitChance = aiProfile.hitChance
            self.moveSpeed = 5.8 * operatorProfile.moveSpeedMultiplier
            finished = false
            sceneConfigured = false
            combatEnabled = false
            lastUpdateTime = 0
            enemyAITick = 0
            teammateAITick = 0
            activeFXCount = 0
            ammoCache = magSize
            healthCache = operatorProfile.maxHealth
            playerKillsCache = 0
            teamKillsCache = 0
            enemyTeamKillsCache = 0
            matchEndTime = .distantFuture
            lastPublishedTime = -1
            combatPausedAt = nil
            lastPublishedLivingEnemies = Int.max
            lastPublishedLivingSquads = Int.max
            lookPanEnabled = false
            stopFiring()
            wantsFiring = false
            cachedNearestEnemy = nil
            playerFocusEnemy = nil
            playerUnderFireUntil = Date.distantPast
            mates.removeAll()
            enemyBurstLeft.removeAll()
            enemySeekCoverUntil.removeAll()
            hasPlayerEyeSample = false
            playerSpeedXZ = 0
            yaw = .pi

            let built = ArenaSceneBuilder.build(config: config)
            view.scene = built.scene
            mapHalfExtent = built.mapHalfExtent
            colliders = built.colliders
            walkSurfaces = built.walkSurfaces
            zoneRadiusCache = built.zoneInitialRadius
            zoneMinRadius = 6
            zoneShrinkPerSec = config.totalCombatants > 18 ? 0.65 : 0.5
            stormRing = built.scene.rootNode.childNode(withName: "stormRing", recursively: false)

            let spawnXZ = resolveFreePosition(x: built.playerSpawn.x, z: built.playerSpawn.z, atY: 0, radius: playerRadius)
            let anchor = SCNNode()
            anchor.name = "playerAnchor"
            anchor.position = SCNVector3(spawnXZ.x, floorY(atX: spawnXZ.x, z: spawnXZ.z), spawnXZ.z)
            built.scene.rootNode.addChildNode(anchor)
            playerAnchor = anchor

            let body = MissionSceneBuilder.makePlayerBodyNode(look: operatorProfile.look)
            anchor.addChildNode(body)
            playerBody = body

            let camera = SCNNode()
            camera.name = "playerCamera"
            camera.camera = SCNCamera()
            camera.camera?.zFar = config.kind == .battleRoyale ? 90 : 60
            camera.camera?.wantsHDR = false
            camera.camera?.bloomIntensity = 0
            anchor.addChildNode(camera)
            playerCamera = camera
            attachGuns(blueprint: blueprint, toCamera: camera, toBody: body)

            // Explicit POV — same black-screen guard as Range.
            view.pointOfView = camera

            // AI teammates
            let needed = config.squadSize.teammateCount
            let looks = OperatorProfile.all
            for i in 0..<needed {
                let callsign = i < teammateCallsigns.count ? teammateCallsigns[i] : "BOT-\(i + 1)"
                let look = looks[(i + 1) % looks.count].look
                let spawn: SCNVector3
                if i < built.teammateSpawns.count {
                    spawn = built.teammateSpawns[i]
                } else {
                    spawn = SCNVector3(spawnXZ.x + Float(i + 1) * 1.6, 0, spawnXZ.z + 1)
                }
                let free = resolveFreePosition(x: spawn.x, z: spawn.z, atY: 0, radius: playerRadius)
                let node = MissionSceneBuilder.makeTeammateNode(
                    callsign: callsign,
                    look: look,
                    at: SCNVector3(free.x, floorY(atX: free.x, z: free.z), free.z)
                )
                built.scene.rootNode.addChildNode(node)
                let maxHP = 90.0
                mates.append(MateState(
                    node: node,
                    gun: node.childNode(withName: "teammateGun", recursively: true),
                    callsign: callsign,
                    hp: maxHP,
                    maxHP: maxHP,
                    alive: true,
                    nextFire: Date.distantFuture,
                    hurtCooldown: Date.distantPast
                ))
            }
            publishSquad()

            // Enemies in squads
            enemyHP.removeAll()
            enemyMaxHP.removeAll()
            enemyWeapon.removeAll()
            enemyNextAttack.removeAll()
            enemyBurstLeft.removeAll()
            enemySeekCoverUntil.removeAll()
            enemySquadID.removeAll()
            enemyNodes.removeAll()
            enemyWeaponNode.removeAll()

            let squadSize = max(1, config.squadSize.rawValue)
            let tdmSingleTeam = config.kind != .battleRoyale
            for (i, spawn) in built.enemySpawns.enumerated() {
                let weapon: MissionSceneBuilder.EnemyWeapon = (i % 4 == 0) ? .knife : .rifle
                let free = resolveFreePosition(x: spawn.x, z: spawn.z, atY: 0, radius: playerRadius)
                let enemy = MissionSceneBuilder.makeEnemyNode(
                    id: i,
                    at: SCNVector3(free.x, floorY(atX: free.x, z: free.z), free.z),
                    weapon: weapon
                )
                let name = enemy.name ?? "enemy_\(i)"
                // Arena hostiles: ~60% more HP than prior (knife 3→5, rifle 5→8).
                let maxHP = weapon == .knife ? 5 : 8
                enemyHP[name] = maxHP
                enemyMaxHP[name] = maxHP
                enemyWeapon[name] = weapon
                enemyNextAttack[name] = Date.distantFuture
                enemyBurstLeft[name] = aiProfile.burstSize
                // TDM NxN: one opposing Team B. BR: group into squads.
                enemySquadID[name] = tdmSingleTeam ? 0 : (i / squadSize)
                MissionSceneBuilder.updateEnemyHealthBar(on: enemy, ratio: 1)
                built.scene.rootNode.addChildNode(enemy)
                enemyNodes.append(enemy)
                if let gun = enemy.childNode(withName: "enemyGun", recursively: false)
                    ?? enemy.childNode(withName: "enemyKnife", recursively: false) {
                    enemyWeaponNode[ObjectIdentifier(enemy)] = gun
                }
            }

            pickupNodes.removeAll()
            for (i, spawn) in built.ammoSpawns.enumerated() {
                let n = MissionSceneBuilder.makeAmmoPickup(id: i, at: spawn)
                built.scene.rootNode.addChildNode(n)
                pickupNodes.append(n)
            }
            for (i, spawn) in built.medkitSpawns.enumerated() {
                let n = MissionSceneBuilder.makeMedkitPickup(id: i, at: spawn)
                built.scene.rootNode.addChildNode(n)
                pickupNodes.append(n)
            }

            let alive = built.enemySpawns.count
            let squads = Set(enemySquadID.values).count
            DispatchQueue.main.async { [weak self] in
                self?.livingEnemiesBinding?.wrappedValue = alive
                self?.livingSquadsBinding?.wrappedValue = squads
                self?.zoneRadiusBinding?.wrappedValue = self?.zoneRadiusCache ?? 0
                self?.playerKillsBinding?.wrappedValue = 0
                self?.teamKillsBinding?.wrappedValue = 0
                self?.enemyTeamKillsBinding?.wrappedValue = 0
                self?.statusBinding?.wrappedValue = config.kind == .battleRoyale
                    ? "Drop hot — storm inbound"
                    : "\(config.squadSize.teamModeLabel) — climb lookout ramps · wipe Team B or first to \(config.killGoal)"
            }
            applyCameraMode()
            sceneConfigured = true
            combatEnabled = false
        }

        func syncAmmo(_ value: Int) { ammoCache = value }

        func applyWeapon(_ blueprint: GunBlueprint) {
            self.blueprint = blueprint
            guard let camera = playerCamera
                    ?? playerAnchor?.childNode(withName: "playerCamera", recursively: false) else { return }
            playerCamera = camera
            attachGuns(blueprint: blueprint, toCamera: camera, toBody: playerBody)
            applyCameraMode()
        }

        private func attachGuns(blueprint: GunBlueprint, toCamera camera: SCNNode, toBody body: SCNNode?) {
            let guns = PlayCameraHelper.attachGuns(
                blueprint: blueprint,
                toCamera: camera,
                toBody: body,
                previousFP: fpGun,
                previousTP: tpGun
            )
            fpGun = guns.fp
            tpGun = guns.tp
        }

        func applyCameraMode() {
            guard let cam = playerCamera
                    ?? playerAnchor?.childNode(withName: "playerCamera", recursively: false) else { return }
            playerCamera = cam
            PlayCameraHelper.applyMode(
                thirdPerson: thirdPersonMode,
                camera: cam,
                playerBody: playerBody,
                fpGun: fpGun,
                tpGun: tpGun,
                playerAnchor: playerAnchor,
                yaw: yaw,
                pitch: pitch
            )
            if scnView?.pointOfView !== cam {
                scnView?.pointOfView = cam
            }
        }

        @objc func handlePan(_ g: UIPanGestureRecognizer) {
            guard let view = g.view else { return }
            let loc = g.location(in: view)
            let moveZoneMaxX = view.bounds.width * 0.42
            switch g.state {
            case .began:
                lookPanEnabled = loc.x >= moveZoneMaxX
                guard lookPanEnabled else { return }
            case .changed:
                guard lookPanEnabled else { return }
            case .ended, .cancelled, .failed:
                lookPanEnabled = false
                return
            default:
                return
            }
            let t = g.translation(in: view)
            g.setTranslation(.zero, in: view)
            yaw += Float(t.x) * 0.0052
            pitch -= Float(t.y) * 0.0036
            pitch = max(-1.05, min(0.95, pitch))
            applyCameraMode()
        }

        private func eyeWorldPosition() -> SCNVector3 {
            PlayCameraHelper.eyeWorldPosition(anchor: playerAnchor)
        }

        // MARK: - Frame

        func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
            guard sceneConfigured, !finished, let scene = scnView?.scene,
                  let anchor = playerAnchor else { return }
            guard combatEnabled else {
                lastUpdateTime = 0
                return
            }

            let dt: Float
            if lastUpdateTime == 0 {
                dt = 1.0 / 60.0
            } else {
                dt = min(0.05, Float(time - lastUpdateTime))
            }
            lastUpdateTime = time

            anchor.eulerAngles.y = yaw
            let footY = floorY(atX: anchor.position.x, z: anchor.position.z)
            if isBlocked(x: anchor.position.x, z: anchor.position.z, atY: footY) {
                let free = resolveFreePosition(x: anchor.position.x, z: anchor.position.z, atY: footY, radius: playerRadius)
                anchor.position = SCNVector3(free.x, floorY(atX: free.x, z: free.z), free.z)
            }

            let ax = Float(moveAxis.x)
            let ay = Float(moveAxis.y)
            let mag = min(1, sqrt(ax * ax + ay * ay))
            if mag > 0.001 {
                let forwardX = -sin(yaw)
                let forwardZ = -cos(yaw)
                let rightX = cos(yaw)
                let rightZ = -sin(yaw)
                let worldX = rightX * ax + forwardX * ay
                let worldZ = rightZ * ax + forwardZ * ay
                let dirLen = max(0.001, sqrt(worldX * worldX + worldZ * worldZ))
                let dx = worldX / dirLen
                let dz = worldZ / dirLen
                let speed = moveSpeed * (0.45 + 0.55 * mag) * 1.15
                let step = speed * dt
                let current = eyeWorldPosition()
                let fromY = floorY(atX: current.x, z: current.z)
                let moved = tryMove(fromX: current.x, fromZ: current.z, fromY: fromY, dx: dx, dz: dz, step: step, in: scene)
                anchor.position = SCNVector3(moved.x, floorY(atX: moved.x, z: moved.z), moved.z)
            } else {
                anchor.position.y = floorY(atX: anchor.position.x, z: anchor.position.z)
            }

            if thirdPersonMode, let cam = playerCamera {
                PlayCameraHelper.syncThirdPersonPitch(camera: cam, pitch: pitch)
            }

            let eye = eyeWorldPosition()
            if hasPlayerEyeSample {
                let pdx = eye.x - lastPlayerEye.x
                let pdz = eye.z - lastPlayerEye.z
                playerSpeedXZ = sqrt(pdx * pdx + pdz * pdz) / max(dt, 0.001)
            } else {
                hasPlayerEyeSample = true
            }
            lastPlayerEye = eye
            if enemyAITick & 1 == 0 { collectPickups(near: eye) }
            updateStorm(playerEye: eye, dt: dt)
            updateTeammates(playerEye: eye, in: scene, dt: dt)
            updateEnemies(playerEye: eye, in: scene, dt: dt)
            updateMatchTimer()
            checkEndConditions()
        }

        private func updateStorm(playerEye: SCNVector3, dt: Float) {
            guard let cfg = config, cfg.kind == .battleRoyale else { return }
            if zoneRadiusCache > zoneMinRadius {
                zoneRadiusCache = max(zoneMinRadius, zoneRadiusCache - zoneShrinkPerSec * dt)
                if enemyAITick % 6 == 0 {
                    DispatchQueue.main.async { [weak self] in
                        guard let self else { return }
                        self.zoneRadiusBinding?.wrappedValue = self.zoneRadiusCache
                    }
                    if let ring = stormRing, let tube = ring.geometry as? SCNTube {
                        let r = CGFloat(zoneRadiusCache)
                        tube.innerRadius = max(0.5, r - 0.6)
                        tube.outerRadius = r + 0.4
                    }
                }
            }
            let dist = sqrt(playerEye.x * playerEye.x + playerEye.z * playerEye.z)
            if dist > zoneRadiusCache, Date() >= combatGraceUntil,
               Date().timeIntervalSince(stormDamageCooldown) > 0.9 {
                stormDamageCooldown = Date()
                damagePlayer(amount: 6, reason: "Storm damage!")
            }
            // Soft storm on enemies / mates (less frequent)
            if enemyAITick % 8 == 0 {
                for node in enemyNodes {
                    guard let name = node.name, (enemyHP[name] ?? 0) > 0 else { continue }
                    let d = sqrt(node.position.x * node.position.x + node.position.z * node.position.z)
                    if d > zoneRadiusCache {
                        applyDamage(to: node, amount: 1, fromPlayer: false)
                    }
                }
                for i in mates.indices where mates[i].alive {
                    guard let n = mates[i].node else { continue }
                    let d = sqrt(n.position.x * n.position.x + n.position.z * n.position.z)
                    if d > zoneRadiusCache {
                        damageMate(index: i, amount: 5, reason: "\(mates[i].callsign) in the storm!")
                    }
                }
            }
        }

        private func updateMatchTimer() {
            guard let cfg = config, cfg.kind != .battleRoyale else { return }
            let remaining = max(0, Int(ceil(matchEndTime.timeIntervalSinceNow)))
            if remaining != lastPublishedTime {
                lastPublishedTime = remaining
                DispatchQueue.main.async { [weak self] in
                    self?.matchTimeBinding?.wrappedValue = remaining
                }
            }
        }

        private func floorY(atX x: Float, z: Float) -> Float {
            var best: Float = 0
            for surface in walkSurfaces {
                if let y = surface.heightIfContains(x, z) {
                    best = max(best, y)
                }
            }
            return best
        }

        private func isBlocked(x: Float, z: Float, atY: Float = 0) -> Bool {
            if abs(x) > mapHalfExtent || abs(z) > mapHalfExtent { return true }
            for box in colliders {
                // Standing above an obstacle (e.g. deck over base pad) — no XZ block.
                if atY > box.topY + 0.12 { continue }
                if box.contains(x, z, radius: playerRadius) { return true }
            }
            return false
        }

        private func resolveFreePosition(x: Float, z: Float, atY: Float = 0, radius: Float) -> (x: Float, z: Float) {
            var px = max(-mapHalfExtent, min(mapHalfExtent, x))
            var pz = max(-mapHalfExtent, min(mapHalfExtent, z))
            for _ in 0..<6 {
                var moved = false
                for box in colliders {
                    if atY > box.topY + 0.12 { continue }
                    let push = box.pushOut(x: px, z: pz, radius: radius)
                    if push.0 != 0 || push.1 != 0 {
                        px += push.0; pz += push.1; moved = true
                    }
                }
                px = max(-mapHalfExtent, min(mapHalfExtent, px))
                pz = max(-mapHalfExtent, min(mapHalfExtent, pz))
                if !moved { break }
            }
            if !isBlocked(x: px, z: pz, atY: atY) { return (px, pz) }
            let step: Float = 0.55
            for ring in 1...12 {
                let count = ring * 6
                for i in 0..<count {
                    let a = Float(i) / Float(count) * (.pi * 2)
                    let sx = x + cos(a) * step * Float(ring)
                    let sz = z + sin(a) * step * Float(ring)
                    let cx = max(-mapHalfExtent, min(mapHalfExtent, sx))
                    let cz = max(-mapHalfExtent, min(mapHalfExtent, sz))
                    if !isBlocked(x: cx, z: cz, atY: atY) { return (cx, cz) }
                }
            }
            return (px, pz)
        }

        private func hasLineOfSight(
            fromX: Float, fromZ: Float, fromY: Float,
            toX: Float, toZ: Float, toY: Float
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
            let clearance = min(fromY, toY)
            for box in colliders {
                // Elevated shooters clear low cover (sandbags / short crates).
                if clearance > box.topY + 0.25 { continue }
                if box.intersectsSegment(x0: x0, z0: z0, x1: x1, z1: z1) {
                    return false
                }
            }
            return true
        }

        private func wallDistanceAlongRay(
            originX: Float, originZ: Float, originY: Float,
            dirX: Float, dirZ: Float, dirY: Float,
            maxDist: Float
        ) -> Float {
            let lenXZ = sqrt(dirX * dirX + dirZ * dirZ)
            guard lenXZ > 1e-5 else { return maxDist }
            let nx = dirX / lenXZ
            let nz = dirZ / lenXZ
            let endX = originX + nx * maxDist
            let endZ = originZ + nz * maxDist
            var best = maxDist
            for box in colliders {
                if let t = box.firstIntersectionT(x0: originX, z0: originZ, x1: endX, z1: endZ) {
                    let d = t * maxDist
                    guard d > 0.12, d < best else { continue }
                    // 3D height at hit — shots over low cover from towers clear.
                    let hitY = originY + dirY * d
                    if hitY > box.topY + 0.2 { continue }
                    best = d
                }
            }
            return best
        }

        private func tryMove(
            fromX: Float, fromZ: Float, fromY: Float,
            dx: Float, dz: Float, step: Float, in scene: SCNScene
        ) -> (x: Float, z: Float) {
            _ = scene
            let tryFullX = fromX + dx * step
            let tryFullZ = fromZ + dz * step
            let fullY = floorY(atX: tryFullX, z: tryFullZ)
            // Allow stepping onto a ramp/deck; block only if the destination is solid at that height.
            if !isBlocked(x: tryFullX, z: tryFullZ, atY: max(fromY, fullY)) {
                return (tryFullX, tryFullZ)
            }
            let tryX = fromX + dx * step
            let tryZOnly = fromZ + dz * step
            var nx = fromX
            var nz = fromZ
            let yX = floorY(atX: tryX, z: fromZ)
            if !isBlocked(x: tryX, z: fromZ, atY: max(fromY, yX)) { nx = tryX }
            let yZ = floorY(atX: fromX, z: tryZOnly)
            if !isBlocked(x: fromX, z: tryZOnly, atY: max(fromY, yZ)) { nz = tryZOnly }
            return (nx, nz)
        }

        private func collectPickups(near position: SCNVector3) {
            var i = 0
            while i < pickupNodes.count {
                let node = pickupNodes[i]
                guard let name = node.name, node.parent != nil else {
                    pickupNodes.remove(at: i); continue
                }
                let dx = node.position.x - position.x
                let dz = node.position.z - position.z
                if dx * dx + dz * dz < 1.8 {
                    node.removeFromParentNode()
                    pickupNodes.remove(at: i)
                    if name.hasPrefix("ammo_") {
                        let add = max(6, magSize / 2)
                        setAmmo(min(magSize * 3, ammoCache + add))
                        setStatus("Ammo +\(add)")
                        SoundService.shared.playAttach(volume: soundVolume)
                    } else if name.hasPrefix("medkit_") {
                        let heal = 35 + operatorProfile.medkitBonus
                        setHealth(min(operatorProfile.maxHealth, healthCache + heal))
                        setStatus("Medkit +\(Int(heal)) HP")
                        SoundService.shared.playReload(volume: soundVolume)
                    }
                    continue
                }
                i += 1
            }
        }

        // MARK: - Teammates

        private func updateTeammates(playerEye: SCNVector3, in scene: SCNScene, dt: Float) {
            let profile = teammateAIProfile
            teammateAITick &+= 1
            if teammateAITick % 5 == 0 {
                cachedNearestEnemy = nearestAliveEnemy(to: playerEye)
                if let focus = playerFocusEnemy,
                   let name = focus.name,
                   (enemyHP[name] ?? 0) <= 0 || focus.parent == nil {
                    playerFocusEnemy = nil
                }
            }
            let shouldMove = teammateAITick % 2 == 0
            let now = Date()
            let aiTime = CACurrentMediaTime()
            let bodyguard = TeammateCombatAI.isBodyguard(
                playerHP: healthCache,
                playerMaxHP: operatorProfile.maxHealth,
                profile: profile
            )
            let underFire = now < playerUnderFireUntil
            let focus = aliveEnemy(playerFocusEnemy)
            let peel = nearestAliveEnemy(to: playerEye)
            let nearest = cachedNearestEnemy

            for i in mates.indices where mates[i].alive {
                guard let mate = mates[i].node, mate.parent != nil else { continue }
                let pick = TeammateCombatAI.pickTarget(
                    focusDistFromMate: focus.map { distXZ(mate.position, $0.position) },
                    peelDistFromMate: peel.map { distXZ(mate.position, $0.position) },
                    nearestDistFromMate: nearest.map { distXZ(mate.position, $0.position) },
                    playerUnderFire: underFire,
                    bodyguard: bodyguard,
                    profile: profile
                )
                let target: SCNNode?
                switch pick {
                case .focus: target = focus
                case .peel: target = peel ?? nearest
                case .nearest: target = nearest ?? peel
                case .none: target = nil
                }

                if let target {
                    let tp = target.position
                    let dx = tp.x - mate.position.x
                    let dz = tp.z - mate.position.z
                    let dist = max(0.01, sqrt(dx * dx + dz * dz))
                    mate.eulerAngles.y = atan2(dx, dz)
                    let los = hasLineOfSight(
                        fromX: mate.position.x, fromZ: mate.position.z, fromY: mate.position.y + 1.4,
                        toX: tp.x, toZ: tp.z, toY: tp.y + 1.4
                    )
                    let betweenShots = now < mates[i].nextFire
                    if shouldMove {
                        let intent = TeammateCombatAI.combatMoveIntent(
                            mateX: mate.position.x,
                            mateZ: mate.position.z,
                            targetX: tp.x,
                            targetZ: tp.z,
                            playerX: playerEye.x,
                            playerZ: playerEye.z,
                            dist: dist,
                            hasLOS: los,
                            betweenShots: betweenShots,
                            bodyguard: bodyguard,
                            mateIndex: i,
                            time: aiTime,
                            colliders: colliders,
                            profile: profile
                        )
                        if intent.shouldMove {
                            moveActor(
                                mate,
                                towardX: intent.dirX,
                                towardZ: intent.dirZ,
                                speed: intent.speed,
                                dt: dt * 2,
                                in: scene
                            )
                        }
                    }
                    if dist < profile.engageRange, dist > 1.55, now >= mates[i].nextFire {
                        mates[i].nextFire = TeammateCombatAI.scheduleNextFire(now: now, profile: profile)
                        muzzleFlash(on: mates[i].gun, color: UIColor(red: 0.3, green: 1, blue: 0.9, alpha: 1))
                        SoundService.shared.playFire(bodyType: .rifle, volume: soundVolume * 0.28)
                        let chance = TeammateCombatAI.hitChance(profile: profile, hasLOS: los, dist: dist)
                        if Float.random(in: 0...1) < chance {
                            applyDamage(to: target, amount: profile.shotDamage, fromPlayer: false)
                        }
                    }
                } else if shouldMove {
                    let intent = TeammateCombatAI.followMoveIntent(
                        mateX: mate.position.x,
                        mateZ: mate.position.z,
                        playerX: playerEye.x,
                        playerZ: playerEye.z,
                        yaw: yaw,
                        bodyguard: bodyguard,
                        mateIndex: i,
                        profile: profile
                    )
                    if intent.shouldMove {
                        mate.eulerAngles.y = atan2(intent.dirX, intent.dirZ)
                        moveActor(
                            mate,
                            towardX: intent.dirX,
                            towardZ: intent.dirZ,
                            speed: intent.speed,
                            dt: dt * 2,
                            in: scene
                        )
                    }
                }
            }
        }

        private func aliveEnemy(_ node: SCNNode?) -> SCNNode? {
            guard let node, let name = node.name, (enemyHP[name] ?? 0) > 0, node.parent != nil else {
                return nil
            }
            return node
        }

        private func moveActor(_ node: SCNNode, towardX: Float, towardZ: Float, speed: Float, dt: Float, in scene: SCNScene) {
            let fromY = floorY(atX: node.position.x, z: node.position.z)
            let moved = tryMove(
                fromX: node.position.x, fromZ: node.position.z, fromY: fromY,
                dx: towardX, dz: towardZ, step: speed * dt, in: scene
            )
            let y = floorY(atX: moved.x, z: moved.z)
            node.position = SCNVector3(moved.x, y, moved.z)
            if isBlocked(x: node.position.x, z: node.position.z, atY: y) {
                let free = resolveFreePosition(x: node.position.x, z: node.position.z, atY: y, radius: playerRadius)
                node.position = SCNVector3(free.x, floorY(atX: free.x, z: free.z), free.z)
            }
        }

        private func nearestAliveEnemy(to position: SCNVector3) -> SCNNode? {
            var best: SCNNode?
            var bestDist = Float.greatestFiniteMagnitude
            for enemy in enemyNodes {
                guard let name = enemy.name, let hp = enemyHP[name], hp > 0, enemy.parent != nil else { continue }
                let d = distXZ(position, enemy.position)
                if d < bestDist { bestDist = d; best = enemy }
            }
            return best
        }

        private func distXZ(_ a: SCNVector3, _ b: SCNVector3) -> Float {
            let dx = a.x - b.x; let dz = a.z - b.z
            return sqrt(dx * dx + dz * dz)
        }

        private func damageMate(index: Int, amount: Double, reason: String) {
            guard combatEnabled, !finished, mates.indices.contains(index), mates[index].alive else { return }
            guard Date() >= combatGraceUntil else { return }
            guard Date().timeIntervalSince(mates[index].hurtCooldown) > 0.75 else { return }
            mates[index].hurtCooldown = Date()
            let newHP = max(0, mates[index].hp - amount)
            mates[index].hp = newHP
            if let mate = mates[index].node {
                MissionSceneBuilder.updateEnemyHealthBar(on: mate, ratio: Float(newHP / max(1, mates[index].maxHP)))
            }
            publishSquad()
            if newHP <= 0 {
                downMate(index: index, reason: reason)
            }
        }

        private func downMate(index: Int, reason: String) {
            guard mates.indices.contains(index), mates[index].alive else { return }
            mates[index].alive = false
            mates[index].hp = 0
            setStatus("\(mates[index].callsign) DOWN")
            _ = reason
            registerEnemyTeamKill()
            if let mate = mates[index].node {
                mate.childNode(withName: "healthBar", recursively: false)?.isHidden = true
                let victim = mate
                DispatchQueue.main.async {
                    victim.runAction(.sequence([.fadeOut(duration: 0.3), .removeFromParentNode()]))
                }
            }
            mates[index].node = nil
            mates[index].gun = nil
            publishSquad()
        }

        private func publishSquad() {
            let hp = mates.map(\.hp)
            let alive = mates.map(\.alive)
            DispatchQueue.main.async { [weak self] in
                self?.squadHPBinding?.wrappedValue = hp
                self?.squadAliveBinding?.wrappedValue = alive
            }
        }

        // MARK: - Enemies

        private func updateEnemies(playerEye: SCNVector3, in scene: SCNScene, dt: Float) {
            let allyPositions: [(index: Int, position: SCNVector3)] = mates.indices.compactMap { index in
                let m = mates[index]
                guard m.alive, let n = m.node, n.parent != nil else { return nil }
                return (index, SCNVector3(n.position.x, n.position.y + 1.6, n.position.z))
            }
            var alive = 0
            var livingSquads = Set<Int>()
            enemyAITick &+= 1
            let now = Date()
            let canHurt = now >= combatGraceUntil
            // Throttle harder with denser lobbies
            let buckets = (config?.totalCombatants ?? 12) > 18 ? 4 : 3
            let bucket = enemyAITick % buckets
            let aiTime = CACurrentMediaTime()
            let profile = aiProfile

            if enemyAITick % 50 == 0 {
                enemyNodes.removeAll { node in
                    let dead = node.parent == nil || (node.name.flatMap { enemyHP[$0] } ?? 0) <= 0
                    if dead {
                        enemyWeaponNode.removeValue(forKey: ObjectIdentifier(node))
                        if let name = node.name {
                            enemyBurstLeft.removeValue(forKey: name)
                            enemySeekCoverUntil.removeValue(forKey: name)
                        }
                    }
                    return dead
                }
            }

            for (idx, node) in enemyNodes.enumerated() {
                guard let name = node.name, let hp = enemyHP[name], hp > 0, node.parent != nil else { continue }
                alive += 1
                if let sid = enemySquadID[name] { livingSquads.insert(sid) }
                guard idx % buckets == bucket else { continue }

                let weapon = enemyWeapon[name] ?? .rifle
                var targetPos = playerEye
                var targetingMate: Int? = nil
                var bestD = distXZ(node.position, playerEye)
                for ally in allyPositions {
                    let d = distXZ(node.position, ally.position)
                    if d + profile.allyBias < bestD {
                        bestD = d
                        targetPos = ally.position
                        targetingMate = ally.index
                    }
                }

                let dx = targetPos.x - node.position.x
                let dz = targetPos.z - node.position.z
                let dist = sqrt(dx * dx + dz * dz)
                node.eulerAngles.y = atan2(dx, dz)

                let los = hasLineOfSight(
                    fromX: node.position.x, fromZ: node.position.z, fromY: node.position.y + 1.4,
                    toX: targetPos.x, toZ: targetPos.z, toY: targetPos.y
                )
                let seekCover = now < (enemySeekCoverUntil[name] ?? .distantPast)
                let betweenBursts = weapon == .rifle
                    && (enemyBurstLeft[name] ?? 0) <= 0
                    && now < (enemyNextAttack[name] ?? .distantPast)

                let intent = EnemyCombatAI.moveIntent(
                    weapon: weapon,
                    enemyX: node.position.x,
                    enemyZ: node.position.z,
                    targetX: targetPos.x,
                    targetZ: targetPos.z,
                    dist: dist,
                    hasLOS: los,
                    seekCover: seekCover,
                    betweenBursts: betweenBursts,
                    enemyIndex: idx,
                    time: aiTime,
                    colliders: colliders,
                    profile: profile
                )
                let stepScale = dt * Float(buckets)
                if intent.shouldMove {
                    moveActor(
                        node,
                        towardX: intent.dirX,
                        towardZ: intent.dirZ,
                        speed: intent.speed,
                        dt: stepScale,
                        in: scene
                    )
                }

                guard canHurt else { continue }

                if weapon == .knife {
                    if los, dist < profile.knifeSlashRange, now >= (enemyNextAttack[name] ?? .distantPast) {
                        enemyNextAttack[name] = now.addingTimeInterval(profile.knifeCooldown)
                        if let mi = targetingMate {
                            damageMate(index: mi, amount: arenaEnemyDamage, reason: "Teammate knifed!")
                        } else {
                            damagePlayer(amount: arenaEnemyDamage, reason: "Knife hit!")
                        }
                    }
                } else if dist < profile.rifleEngageMax, dist > 2.0, now >= (enemyNextAttack[name] ?? .distantPast) {
                    var burst = enemyBurstLeft[name] ?? profile.burstSize
                    enemyNextAttack[name] = EnemyCombatAI.scheduleAfterRifleShot(
                        now: now,
                        burstRemaining: &burst,
                        profile: profile
                    )
                    enemyBurstLeft[name] = burst
                    if burst <= 0 {
                        enemySeekCoverUntil[name] = now.addingTimeInterval(profile.coverSeekSeconds * 0.55)
                    }
                    muzzleFlash(on: enemyWeaponNode[ObjectIdentifier(node)], color: .yellow)
                    let t = CACurrentMediaTime()
                    if t - lastEnemySoundTime > 0.18 {
                        lastEnemySoundTime = t
                        SoundService.shared.playFire(bodyType: .rifle, volume: soundVolume * 0.35)
                    }
                    let chance = EnemyCombatAI.adjustedHitChance(
                        profile: profile,
                        playerSpeedXZ: targetingMate != nil ? 0 : playerSpeedXZ
                    )
                    if los, Float.random(in: 0...1) < chance {
                        if let mi = targetingMate {
                            damageMate(index: mi, amount: arenaEnemyDamage, reason: "Teammate under fire!")
                        } else {
                            damagePlayer(amount: arenaEnemyDamage, reason: "Taking fire!")
                        }
                    }
                }
            }

            let squadCount = livingSquads.count
            guard alive != lastPublishedLivingEnemies || squadCount != lastPublishedLivingSquads else {
                return
            }
            lastPublishedLivingEnemies = alive
            lastPublishedLivingSquads = squadCount
            DispatchQueue.main.async { [weak self] in
                self?.livingEnemiesBinding?.wrappedValue = alive
                self?.livingSquadsBinding?.wrappedValue = squadCount
            }
        }

        private func muzzleFlash(on gun: SCNNode?, color: UIColor) {
            guard let gun else { return }
            spawnTransientFX(parent: gun, radius: 0.05, color: color, position: SCNVector3(0, 0, -0.4), life: 0.09)
        }

        // MARK: - End / damage / fire

        private func checkEndConditions() {
            guard combatEnabled, sceneConfigured, !finished, Date() >= combatGraceUntil else { return }
            guard let cfg = config else { return }

            if cfg.kind == .battleRoyale {
                let alive = enemyNodes.filter { node in
                    guard let name = node.name else { return false }
                    return (enemyHP[name] ?? 0) > 0 && node.parent != nil
                }.count
                if alive <= 0 {
                    finish(victory: true)
                }
                return
            }

            // TDM / Quick Match — Team A vs Team B
            let livingHostiles = enemyNodes.filter { node in
                guard let name = node.name else { return false }
                return (enemyHP[name] ?? 0) > 0 && node.parent != nil
            }.count

            // Team wipe wins immediately.
            if livingHostiles <= 0 {
                finish(victory: true)
                return
            }
            if teamKillsCache >= cfg.killGoal {
                finish(victory: true)
                return
            }
            if enemyTeamKillsCache >= cfg.killGoal {
                finish(victory: false)
                return
            }
            // Timer expired — higher elim score wins.
            if lastPublishedTime == 0 {
                finish(victory: teamKillsCache > enemyTeamKillsCache)
            }
        }

        private func finish(victory: Bool) {
            guard !finished else { return }
            finished = true
            combatEnabled = false
            stopFiring()
            wantsFiring = false
            scnView?.preferredFramesPerSecond = 15
            scnView?.isPlaying = false
            DispatchQueue.main.async { [weak self] in
                self?.outcomeBinding?.wrappedValue = victory ? .victory : .defeat
            }
            setStatus(victory ? "VICTORY" : "DEFEATED")
        }

        private func damagePlayer(amount: Double, reason: String) {
            guard combatEnabled, !finished else { return }
            guard Date() >= combatGraceUntil else { return }
            guard Date().timeIntervalSince(playerHurtCooldown) > 0.9 else { return }
            playerHurtCooldown = Date()
            playerUnderFireUntil = Date().addingTimeInterval(teammateAIProfile.peelSeconds)
            let scaled = amount * operatorProfile.damageTakenMultiplier
            let newHP = max(0, healthCache - scaled)
            setHealth(newHP)
            setStatus(reason)
            HapticsService.fire(enabled: hapticsEnabled, bodyType: .shotgun)
            if newHP <= 0 {
                registerEnemyTeamKill()
                finish(victory: false)
            }
        }

        private func registerEnemyTeamKill() {
            guard config?.kind != .battleRoyale else { return }
            enemyTeamKillsCache += 1
            let score = enemyTeamKillsCache
            DispatchQueue.main.async { [weak self] in
                self?.enemyTeamKillsBinding?.wrappedValue = score
            }
        }

        private func setStatus(_ text: String) {
            let t = CACurrentMediaTime()
            if text == lastStatusText, t - lastStatusAt < 0.45 { return }
            if t - lastStatusAt < 0.12 { return }
            lastStatusAt = t
            lastStatusText = text
            DispatchQueue.main.async { [weak self] in
                self?.statusBinding?.wrappedValue = text
            }
        }

        private func setAmmo(_ value: Int) {
            ammoCache = value
            DispatchQueue.main.async { [weak self] in self?.ammoBinding?.wrappedValue = value }
        }

        private func setHealth(_ value: Double) {
            healthCache = value
            DispatchQueue.main.async { [weak self] in self?.healthBinding?.wrappedValue = value }
        }

        func startFiring() {
            guard fireTimer == nil, !finished, combatEnabled else { return }
            let interval = blueprint?.fireInterval ?? 0.14
            let timer = Timer(timeInterval: interval, repeats: true) { [weak self] _ in self?.fireOnce() }
            RunLoop.main.add(timer, forMode: .common)
            fireTimer = timer
            fireOnce()
        }

        func stopFiring() {
            fireTimer?.invalidate()
            fireTimer = nil
        }

        private func fireOnce() {
            guard combatEnabled, !finished else { return }
            guard ammoCache > 0 else {
                SoundService.shared.playEmpty(volume: soundVolume)
                stopFiring(); wantsFiring = false
                return
            }
            setAmmo(ammoCache - 1)
            let body = blueprint?.bodyType ?? .rifle
            HapticsService.fire(enabled: hapticsEnabled, bodyType: body)
            SoundService.shared.playFire(bodyType: body, volume: soundVolume)
            let kick = body.combatRecoilKick
            let gun = thirdPersonMode ? tpGun : fpGun
            gun?.removeAction(forKey: "recoil")
            gun?.runAction(.group([
                .sequence([
                    .moveBy(x: 0, y: kick.y, z: kick.z, duration: kick.duration),
                    .moveBy(x: 0, y: -kick.y, z: -kick.z, duration: kick.duration * 2.0)
                ]),
                .sequence([
                    .rotateBy(x: -kick.rot, y: 0, z: CGFloat.random(in: -0.02...0.02), duration: kick.duration),
                    .rotateBy(x: kick.rot, y: 0, z: 0, duration: kick.duration * 2.1)
                ])
            ]), forKey: "recoil")
            if let hit = raycastEnemy(body: body) {
                let base = blueprint?.shotDamage ?? shotDamage(for: body)
                let dmg = body.damageWithHeadshot(base, isHeadshot: hit.isHeadshot)
                playerFocusEnemy = hit.node
                applyDamage(to: hit.node, amount: dmg, fromPlayer: true, isHeadshot: hit.isHeadshot)
            }
        }

        private func shotDamage(for body: GunBodyType) -> Int {
            switch body {
            case .pistol, .smg, .machineGun: return 1
            case .rifle: return 2
            case .shotgun: return 3
            case .sniper: return 4
            }
        }

        private struct EnemyRayHit {
            let node: SCNNode
            let isHeadshot: Bool
        }

        /// Snipers: long range + thicker capsule + generous head sphere. Wall LOS still blocks.
        private func raycastEnemy(body: GunBodyType) -> EnemyRayHit? {
            let eye = eyeWorldPosition()
            let bloom = blueprint?.accuracyBloom ?? body.accuracyBloom
            let ox = bloom > 0 ? Float.random(in: -bloom...bloom) : 0
            let oy = bloom > 0 ? Float.random(in: -bloom...bloom) : 0
            var lookX = -sin(yaw) * cos(pitch) + ox
            var lookY = sin(pitch) + oy
            var lookZ = -cos(yaw) * cos(pitch)
            let lookLen = max(0.001, sqrt(lookX * lookX + lookY * lookY + lookZ * lookZ))
            lookX /= lookLen; lookY /= lookLen; lookZ /= lookLen
            let maxRange = body.maxEngagementRange
            let hitR2 = body.hitRadiusSquared
            let headR2 = body.headHitRadiusSquared
            let headLocalY = body.headHitCenterY
            let wallCap = wallDistanceAlongRay(
                originX: eye.x, originZ: eye.z, originY: eye.y,
                dirX: lookX, dirZ: lookZ, dirY: lookY,
                maxDist: maxRange
            )
            var bestDist: Float = min(maxRange, wallCap)
            var best: EnemyRayHit?
            for enemy in enemyNodes {
                guard let name = enemy.name, let hp = enemyHP[name], hp > 0, enemy.parent != nil else { continue }
                let ex = enemy.position.x
                let ez = enemy.position.z
                let ey = enemy.position.y
                guard hasLineOfSight(
                    fromX: eye.x, fromZ: eye.z, fromY: eye.y,
                    toX: ex, toZ: ez, toY: ey + 1.4
                ) else { continue }

                let headY = ey + headLocalY
                do {
                    let toX = ex - eye.x
                    let toY = headY - eye.y
                    let toZ = ez - eye.z
                    let along = toX * lookX + toY * lookY + toZ * lookZ
                    if along > 0.4, along < bestDist {
                        let cx = eye.x + lookX * along
                        let cy = eye.y + lookY * along
                        let cz = eye.z + lookZ * along
                        let dx = cx - ex; let dy = cy - headY; let dz = cz - ez
                        if dx * dx + dy * dy + dz * dz < headR2 {
                            bestDist = along
                            best = EnemyRayHit(node: enemy, isHeadshot: true)
                            continue
                        }
                    }
                }

                for bodyLocalY in body.hitSampleHeights {
                    let bodyY = ey + bodyLocalY
                    let toX = ex - eye.x
                    let toY = bodyY - eye.y
                    let toZ = ez - eye.z
                    let along = toX * lookX + toY * lookY + toZ * lookZ
                    guard along > 0.4, along < bestDist else { continue }
                    let cx = eye.x + lookX * along
                    let cy = eye.y + lookY * along
                    let cz = eye.z + lookZ * along
                    let dx = cx - ex; let dy = cy - bodyY; let dz = cz - ez
                    if dx * dx + dy * dy + dz * dz < hitR2 {
                        bestDist = along
                        best = EnemyRayHit(node: enemy, isHeadshot: false)
                        break
                    }
                }
            }
            return best
        }

        private func applyDamage(to enemy: SCNNode, amount: Int, fromPlayer: Bool, isHeadshot: Bool = false) {
            guard combatEnabled, !finished else { return }
            guard let name = enemy.name, let hp = enemyHP[name], hp > 0 else { return }
            let maxHP = max(1, enemyMaxHP[name] ?? hp)
            let newHP = max(0, hp - max(1, amount))
            enemyHP[name] = newHP
            MissionSceneBuilder.updateEnemyHealthBar(on: enemy, ratio: Float(newHP) / Float(maxHP))
            let sparkY: Float = isHeadshot ? 1.78 : 1.3
            spawnTransientFX(
                parent: enemy,
                radius: isHeadshot ? 0.09 : 0.06,
                color: isHeadshot ? .red : .orange,
                position: SCNVector3(0, sparkY, 0),
                life: isHeadshot ? 0.14 : 0.1
            )
            if fromPlayer {
                if isHeadshot {
                    SoundService.shared.playHeadshot(volume: soundVolume)
                } else {
                    SoundService.shared.playHit(volume: soundVolume)
                }
            }
            if newHP > 0 {
                if fromPlayer {
                    enemySeekCoverUntil[name] = Date().addingTimeInterval(aiProfile.coverSeekSeconds)
                    setStatus(isHeadshot ? "HEADSHOT — \(newHP) HP" : "Hit — \(newHP) HP")
                    let juice = onCombatJuice
                    let kind: CombatJuiceKind = isHeadshot ? .headshot : .hit
                    DispatchQueue.main.async { juice?(kind) }
                }
            } else {
                if fromPlayer {
                    playerKillsCache += 1
                    teamKillsCache += 1
                    setAmmo(min(magSize * 4, ammoCache + 12))
                    setStatus(isHeadshot ? "HEADSHOT KO — +\(12) AMMO" : "Eliminated — +\(12) AMMO")
                    SoundService.shared.playKillConfirm(volume: soundVolume)
                    let juice = onCombatJuice
                    let kind: CombatJuiceKind = isHeadshot ? .headshotKill : .kill
                    DispatchQueue.main.async { [weak self] in
                        guard let self else { return }
                        juice?(kind)
                        self.playerKillsBinding?.wrappedValue = self.playerKillsCache
                        self.teamKillsBinding?.wrappedValue = self.teamKillsCache
                        self.onPlayerKill?()
                    }
                } else {
                    teamKillsCache += 1
                    DispatchQueue.main.async { [weak self] in
                        guard let self else { return }
                        self.teamKillsBinding?.wrappedValue = self.teamKillsCache
                    }
                }
                if cachedNearestEnemy === enemy { cachedNearestEnemy = nil }
                if playerFocusEnemy === enemy { playerFocusEnemy = nil }
                enemyWeaponNode.removeValue(forKey: ObjectIdentifier(enemy))
                enemy.childNode(withName: "healthBar", recursively: false)?.isHidden = true
                let victim = enemy
                DispatchQueue.main.async {
                    victim.runAction(.sequence([.fadeOut(duration: 0.16), .removeFromParentNode()]))
                }
            }
        }

        private func spawnTransientFX(parent: SCNNode, radius: CGFloat, color: UIColor, position: SCNVector3, life: TimeInterval) {
            guard activeFXCount < maxActiveFX else { return }
            activeFXCount += 1
            let flash = SCNNode(geometry: SCNSphere(radius: radius))
            flash.geometry?.firstMaterial?.emission.contents = color
            flash.geometry?.firstMaterial?.lightingModel = .constant
            flash.position = position
            parent.addChildNode(flash)
            flash.runAction(.sequence([
                .wait(duration: life * 0.45),
                .fadeOut(duration: life * 0.55),
                .removeFromParentNode(),
                .run { [weak self] _ in
                    self?.activeFXCount = max(0, (self?.activeFXCount ?? 1) - 1)
                }
            ]))
        }
    }
}
