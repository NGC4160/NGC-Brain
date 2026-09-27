// MissionSceneView.swift
// Story FPS: analog walk, aim/fire, armed enemies.

import SwiftUI
import SceneKit
import UIKit

struct MissionSceneView: UIViewRepresentable {
    let mission: CampaignMission
    let blueprint: GunBlueprint

    @Binding var health: Double
    @Binding var ammo: Int
    @Binding var enemiesLeft: Int
    @Binding var statusMessage: String
    @Binding var isFiring: Bool
    @Binding var moveAxis: CGPoint
    @Binding var outcome: MissionOutcome?
    @Binding var teammateName: String
    @Binding var teammateHP: Double
    @Binding var teammateMaxHP: Double
    @Binding var teammateAlive: Bool

    /// When false (cutscene / COMMS / end card), SceneKit must not run combat or end the mission.
    var combatEnabled: Bool

    var hapticsEnabled: Bool
    var soundVolume: Double
    var magSize: Int
    var thirdPersonMode: Bool
    var operatorProfile: OperatorProfile
    var difficulty: StoryDifficulty
    /// Fired on main when the player downs a hostile (XP grant hook).
    var onPlayerKill: (() -> Void)? = nil
    /// Combat juice (hit marker / kill confirm) — optional.
    var onCombatJuice: ((CombatJuiceKind) -> Void)? = nil

    enum MissionOutcome: Equatable {
        case victory
        case defeat
    }

    func makeUIView(context: Context) -> SCNView {
        let view = SCNView()
        view.antialiasingMode = .none
        view.allowsCameraControl = false
        view.preferredFramesPerSecond = 30
        view.isPlaying = false
        view.backgroundColor = .black
        view.isMultipleTouchEnabled = true
        view.autoenablesDefaultLighting = false
        // Cap pixel density — big win on Pro/Max displays
        view.contentScaleFactor = min(UIScreen.main.scale, 2.0)

        let pan = UIPanGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handlePan(_:)))
        pan.maximumNumberOfTouches = 1
        view.addGestureRecognizer(pan)

        // Configure BEFORE starting the render loop — otherwise the first
        // frame can see enemiesLeft == 0 / unready state and end the mission.
        // Keep isPlaying false until combatEnabled rises (cutscene/COMMS gate).
        context.coordinator.configure(
            view: view,
            mission: mission,
            blueprint: blueprint,
            magSize: magSize,
            thirdPersonMode: thirdPersonMode,
            operatorProfile: operatorProfile,
            difficulty: difficulty
        )
        view.delegate = context.coordinator
        // Render one static frame for the backdrop, then freeze until combat unlocks.
        view.isPlaying = false
        return view
    }

    func updateUIView(_ uiView: SCNView, context: Context) {
        let c = context.coordinator
        c.healthBinding = $health
        c.ammoBinding = $ammo
        c.enemiesLeftBinding = $enemiesLeft
        c.statusBinding = $statusMessage
        c.outcomeBinding = $outcome
        c.teammateNameBinding = $teammateName
        c.teammateHPBinding = $teammateHP
        c.teammateMaxHPBinding = $teammateMaxHP
        c.teammateAliveBinding = $teammateAlive
        c.hapticsEnabled = hapticsEnabled
        c.soundVolume = soundVolume
        c.magSize = magSize
        c.moveAxis = moveAxis
        c.operatorProfile = operatorProfile
        c.difficulty = difficulty
        c.moveSpeed = 5.8 * operatorProfile.moveSpeedMultiplier
        c.aiProfile = EnemyCombatAI.profile(difficulty: difficulty, mode: .story)
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
            // Keep SceneKit cache aligned with HUD (restart / SWAP / pickup races).
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
        var mission: CampaignMission?
        var blueprint: GunBlueprint?
        var magSize = 30

        var healthBinding: Binding<Double>?
        var ammoBinding: Binding<Int>?
        var enemiesLeftBinding: Binding<Int>?
        var statusBinding: Binding<String>?
        var outcomeBinding: Binding<MissionOutcome?>?
        var onPlayerKill: (() -> Void)?
        var onCombatJuice: ((CombatJuiceKind) -> Void)?
        var teammateNameBinding: Binding<String>?
        var teammateHPBinding: Binding<Double>?
        var teammateMaxHPBinding: Binding<Double>?
        var teammateAliveBinding: Binding<Bool>?

        var hapticsEnabled = true
        var soundVolume = 0.9
        var moveAxis: CGPoint = .zero
        var thirdPersonMode = true
        var operatorProfile = OperatorProfile.all[0]
        var difficulty: StoryDifficulty = .medium
        var enemyHitChance: Float = StoryDifficulty.medium.enemyHitChance
        var aiProfile = EnemyCombatAI.profile(difficulty: .medium, mode: .story)
        var moveSpeed: Float = 5.2

        var wantsFiring = false

        private var yaw: Float = 0
        private var pitch: Float = 0
        private var fireTimer: Timer?
        private var enemyHP: [String: Int] = [:]
        private var enemyMaxHP: [String: Int] = [:]
        private var enemyWeapon: [String: MissionSceneBuilder.EnemyWeapon] = [:]
        private var enemyNextAttack: [String: Date] = [:]
        private var enemyBurstLeft: [String: Int] = [:]
        private var enemySeekCoverUntil: [String: Date] = [:]
        private var lastPlayerEye = SCNVector3(0, 0, 0)
        private var playerSpeedXZ: Float = 0
        private var hasPlayerEyeSample = false
        private var finished = false
        /// Scene graph is built; combat still requires combatEnabled from SwiftUI.
        private var sceneConfigured = false
        private var combatEnabled = false
        private var combatGraceUntil = Date.distantPast
        private var initialEnemyCount = 0
        private var playerHurtCooldown = Date.distantPast
        private var lastUpdateTime: TimeInterval = 0
        private var lastPublishedEnemies = Int.max
        private var lastEnemySoundTime: CFTimeInterval = 0
        private var ammoCache: Int = 30
        private var healthCache: Double = 100
        private var mapHalfExtent: Float = 18
        private var colliders: [MissionSceneBuilder.Collider] = []
        private var enemyNodes: [SCNNode] = []
        /// Cached weapon meshes — avoids recursive childNode scans every shot.
        private var enemyWeaponNode: [ObjectIdentifier: SCNNode] = [:]
        private var pickupNodes: [SCNNode] = []
        private var enemyAITick = 0
        private var teammateAITick = 0
        private var activeFXCount = 0
        private let maxActiveFX = 8
        private var lastStatusAt: CFTimeInterval = 0
        private var lastStatusText = ""
        /// Look-pan only accepted if the gesture began outside the move stick zone.
        private var lookPanEnabled = false

        // AI teammate (KESTREL wingman)
        private weak var teammateNode: SCNNode?
        private weak var teammateGunNode: SCNNode?
        private var teammateCallsign = "RANGER"
        private var teammateVoiceGender: OperatorVoiceGender = .neutral
        private var teammateHPCache: Double = 100
        private var teammateMaxHPCache: Double = 100
        private var teammateIsAlive = true
        private var teammateNextFire = Date.distantPast
        private var teammateBurstLeft = 0
        private var teammateSeekCoverUntil = Date.distantPast
        private var teammateDidRadioEngage = false
        private var teammateHurtCooldown = Date.distantPast
        private var cachedNearestEnemy: SCNNode?
        private weak var playerFocusEnemy: SCNNode?
        private var playerUnderFireUntil = Date.distantPast
        private var teammateAIProfile = TeammateCombatAI.profile(mode: .story)

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
            teammateNode = nil
            teammateGunNode = nil
            playerAnchor = nil
            playerBody = nil
            playerCamera = nil
            fpGun = nil
            tpGun = nil
            cachedNearestEnemy = nil
        }

        /// Sync play gate from SwiftUI. Rising edge resets dt + short grace so intro can't one-shot you.
        func setCombatEnabled(_ enabled: Bool) {
            let was = combatEnabled
            combatEnabled = enabled && sceneConfigured && !finished
            if combatEnabled {
                scnView?.preferredFramesPerSecond = 30
                scnView?.isPlaying = true
                if !was {
                    lastUpdateTime = 0
                    combatGraceUntil = Date().addingTimeInterval(1.0)
                    playerHurtCooldown = combatGraceUntil
                    teammateHurtCooldown = combatGraceUntil
                    teammateNextFire = Date().addingTimeInterval(0.55)
                    let arm = Date().addingTimeInterval(0.7)
                    for key in enemyNextAttack.keys {
                        enemyNextAttack[key] = arm
                    }
                    // Pull live mag from SwiftUI in case loadout swapped during intro freeze.
                    if let ammoBinding {
                        ammoCache = ammoBinding.wrappedValue
                    }
                }
            } else {
                scnView?.preferredFramesPerSecond = 15
                // Freeze SceneKit under cutscenes / COMMS / end card — stops update thrash.
                scnView?.isPlaying = false
                if wantsFiring { stopFiring(); wantsFiring = false }
            }
        }

        func configure(
            view: SCNView,
            mission: CampaignMission,
            blueprint: GunBlueprint,
            magSize: Int,
            thirdPersonMode: Bool,
            operatorProfile: OperatorProfile,
            difficulty: StoryDifficulty
        ) {
            scnView = view
            self.mission = mission
            self.blueprint = blueprint
            self.magSize = magSize
            self.thirdPersonMode = thirdPersonMode
            self.operatorProfile = operatorProfile
            self.difficulty = difficulty
            self.aiProfile = EnemyCombatAI.profile(difficulty: difficulty, mode: .story)
            self.teammateAIProfile = TeammateCombatAI.profile(mode: .story, difficulty: difficulty)
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
            lastPublishedEnemies = Int.max
            initialEnemyCount = 0
            lookPanEnabled = false
            lastStatusAt = 0
            lastStatusText = ""
            stopFiring()
            wantsFiring = false
            teammateDidRadioEngage = false
            teammateNextFire = Date.distantFuture
            teammateBurstLeft = 0
            teammateSeekCoverUntil = Date.distantPast
            teammateHurtCooldown = Date.distantPast
            teammateIsAlive = true
            cachedNearestEnemy = nil
            playerFocusEnemy = nil
            playerUnderFireUntil = Date.distantPast
            enemyWeaponNode.removeAll()
            enemyBurstLeft.removeAll()
            enemySeekCoverUntil.removeAll()
            hasPlayerEyeSample = false
            playerSpeedXZ = 0
            playerCamera = nil

            let built = MissionSceneBuilder.build(mission: mission)
            view.scene = built.scene
            mapHalfExtent = built.mapHalfExtent
            colliders = built.colliders

            let spawnXZ = resolveFreePosition(
                x: built.playerSpawn.x,
                z: built.playerSpawn.z,
                radius: playerRadius
            )
            let anchor = SCNNode()
            anchor.name = "playerAnchor"
            anchor.position = SCNVector3(spawnXZ.x, 0, spawnXZ.z)
            built.scene.rootNode.addChildNode(anchor)
            playerAnchor = anchor

            let body = MissionSceneBuilder.makePlayerBodyNode(look: operatorProfile.look)
            anchor.addChildNode(body)
            playerBody = body

            let camera = SCNNode()
            camera.name = "playerCamera"
            camera.camera = SCNCamera()
            camera.camera?.zFar = 70
            camera.camera?.wantsHDR = false
            // Cheaper shadows / lighting path
            camera.camera?.bloomIntensity = 0
            anchor.addChildNode(camera)
            playerCamera = camera

            attachGuns(blueprint: blueprint, toCamera: camera, toBody: body)
            // Explicit POV — prevents black frame if SceneKit doesn't auto-pick nested camera.
            view.pointOfView = camera

            // Wingman: another KESTREL op (not the player's selected callsign).
            let ally = Self.resolveTeammate(excluding: operatorProfile.id)
            teammateCallsign = ally.callsign
            teammateMaxHPCache = ally.maxHealth
            teammateHPCache = ally.maxHealth
            teammateVoiceGender = ally.voiceGender
            let allyFree = resolveFreePosition(
                x: spawnXZ.x - 1.8,
                z: spawnXZ.z + 1.2,
                radius: playerRadius
            )
            let allySpawn = SCNVector3(allyFree.x, 0, allyFree.z)
            let allyNode = MissionSceneBuilder.makeTeammateNode(
                callsign: ally.callsign,
                look: ally.look,
                at: allySpawn
            )
            built.scene.rootNode.addChildNode(allyNode)
            teammateNode = allyNode
            teammateGunNode = allyNode.childNode(withName: "teammateGun", recursively: true)
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.teammateNameBinding?.wrappedValue = ally.callsign
                self.teammateMaxHPBinding?.wrappedValue = ally.maxHealth
                self.teammateHPBinding?.wrappedValue = ally.maxHealth
                self.teammateAliveBinding?.wrappedValue = true
            }

            enemyHP.removeAll()
            enemyMaxHP.removeAll()
            enemyWeapon.removeAll()
            enemyNextAttack.removeAll()
            enemyBurstLeft.removeAll()
            enemySeekCoverUntil.removeAll()
            enemyNodes.removeAll()
            enemyWeaponNode.removeAll()
            for (i, spawn) in built.enemySpawns.enumerated() {
                let weapon: MissionSceneBuilder.EnemyWeapon = (i % 3 == 0) ? .knife : .rifle
                let free = resolveFreePosition(x: spawn.x, z: spawn.z, radius: playerRadius)
                let enemy = MissionSceneBuilder.makeEnemyNode(
                    id: i,
                    at: SCNVector3(free.x, spawn.y, free.z),
                    weapon: weapon
                )
                let name = enemy.name ?? "enemy_\(i)"
                let maxHP = weapon == .knife ? 4 : 6
                enemyHP[name] = maxHP
                enemyMaxHP[name] = maxHP
                enemyWeapon[name] = weapon
                enemyNextAttack[name] = Date.distantFuture
                enemyBurstLeft[name] = aiProfile.burstSize
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

            initialEnemyCount = built.enemySpawns.count
            lastPublishedEnemies = initialEnemyCount
            // Defer HUD sync — bindings may not be wired until the first updateUIView.
            let published = initialEnemyCount
            let status = "\(mission.title) — \(ally.callsign) on your six"
            DispatchQueue.main.async { [weak self] in
                self?.enemiesLeftBinding?.wrappedValue = published
                self?.statusBinding?.wrappedValue = status
            }
            applyCameraMode()
            // Combat stays gated until SwiftUI combatEnabled rises after intro overlays.
            sceneConfigured = true
            combatEnabled = false
        }

        /// Pick a premade wingman that isn't the player's active operator.
        private static func resolveTeammate(excluding playerID: String) -> OperatorProfile {
            if let other = OperatorProfile.all.first(where: { $0.id != playerID }) {
                return other
            }
            // Fallback fixed KESTREL ally
            return OperatorProfile(
                id: "ranger",
                callsign: "RANGER",
                role: "Wingman",
                bio: "Fixed KESTREL AI companion.",
                accent: Color(red: 0.15, green: 0.92, blue: 0.85),
                look: OperatorLook.vesper.appearance,
                moveSpeedMultiplier: 1.05,
                maxHealth: 100,
                damageTakenMultiplier: 1.0,
                medkitBonus: 0,
                voiceGender: .female
            )
        }

        func syncAmmo(_ value: Int) {
            ammoCache = value
        }

        /// Hot-swap FP/TP gun meshes when the player switches loadout weapons.
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
            // Left ~42% is reserved for the move stick — never steal those touches for look.
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

            // Freeze gameplay under cutscenes / COMMS / end card — still draw the scene.
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

            // Keep body/camera yaw in sync every frame (look may have changed mid-move).
            anchor.eulerAngles.y = yaw

            // If somehow embedded in a wall (spawn/edge case), push out — never soft-lock.
            if collides(at: eyeWorldPosition(), in: scene) {
                let free = resolveFreePosition(
                    x: anchor.position.x,
                    z: anchor.position.z,
                    radius: playerRadius
                )
                anchor.position = SCNVector3(free.x, 0, free.z)
            }

            let ax = Float(moveAxis.x)
            let ay = Float(moveAxis.y)
            let mag = min(1, sqrt(ax * ax + ay * ay))
            if mag > 0.001 {
                // Camera-relative: +Y stick = forward along look, +X = strafe right.
                // Match look ray: forward = (-sin(yaw), -cos(yaw)) in XZ.
                let forwardX = -sin(yaw)
                let forwardZ = -cos(yaw)
                let rightX = cos(yaw)
                let rightZ = -sin(yaw)

                let worldX = rightX * ax + forwardX * ay
                let worldZ = rightZ * ax + forwardZ * ay
                let dirLen = max(0.001, sqrt(worldX * worldX + worldZ * worldZ))
                let dx = worldX / dirLen
                let dz = worldZ / dirLen

                // Walk → run curve; slightly faster base than before.
                let speed = moveSpeed * (0.45 + 0.55 * mag) * 1.15
                let step = speed * dt

                let current = eyeWorldPosition()
                let tryFull = SCNVector3(current.x + dx * step, 1.6, current.z + dz * step)
                if !collides(at: tryFull, in: scene) {
                    anchor.position = SCNVector3(tryFull.x, 0, tryFull.z)
                } else {
                    // Axis-separated slide so you glide along walls instead of sticking.
                    let tryX = SCNVector3(current.x + dx * step, 1.6, current.z)
                    let tryZ = SCNVector3(current.x, 1.6, current.z + dz * step)
                    var nx = current.x
                    var nz = current.z
                    if !collides(at: tryX, in: scene) { nx = tryX.x }
                    if !collides(at: tryZ, in: scene) { nz = tryZ.z }
                    // Half-step fallback if full axis blocked (tight corners).
                    if nx == current.x && nz == current.z {
                        let half = step * 0.5
                        let hx = SCNVector3(current.x + dx * half, 1.6, current.z)
                        let hz = SCNVector3(current.x, 1.6, current.z + dz * half)
                        if !collides(at: hx, in: scene) { nx = hx.x }
                        if !collides(at: hz, in: scene) { nz = hz.z }
                    }
                    anchor.position = SCNVector3(nx, 0, nz)
                }
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
            // Pickups every other frame — distance checks are cheap but skippable.
            if enemyAITick & 1 == 0 {
                collectPickups(near: eye)
            }
            updateTeammate(playerEye: eye, in: scene, dt: dt)
            updateEnemies(playerEye: eye, in: scene, dt: dt)
            // End check only when published count changes (handled inside setEnemiesLeft).
        }

        private func collides(at position: SCNVector3, in scene: SCNScene) -> Bool {
            _ = scene
            return isBlocked(x: position.x, z: position.z)
        }

        private func isBlocked(x: Float, z: Float) -> Bool {
            if abs(x) > mapHalfExtent || abs(z) > mapHalfExtent { return true }
            for box in colliders {
                if box.contains(x, z, radius: playerRadius) { return true }
            }
            return false
        }

        /// Push a circle out of overlapping wall AABBs; spiral-search if still stuck.
        private func resolveFreePosition(x: Float, z: Float, radius: Float) -> (x: Float, z: Float) {
            var px = x
            var pz = z
            px = max(-mapHalfExtent, min(mapHalfExtent, px))
            pz = max(-mapHalfExtent, min(mapHalfExtent, pz))

            for _ in 0..<6 {
                var moved = false
                for box in colliders {
                    let push = box.pushOut(x: px, z: pz, radius: radius)
                    if push.0 != 0 || push.1 != 0 {
                        px += push.0
                        pz += push.1
                        moved = true
                    }
                }
                px = max(-mapHalfExtent, min(mapHalfExtent, px))
                pz = max(-mapHalfExtent, min(mapHalfExtent, pz))
                if !moved { break }
            }

            if !isBlocked(x: px, z: pz) {
                return (px, pz)
            }

            // Spiral search for open ground (spawn soft-lock escape).
            let step: Float = 0.55
            for ring in 1...14 {
                let count = ring * 6
                for i in 0..<count {
                    let a = Float(i) / Float(count) * (Float.pi * 2)
                    let sx = x + cos(a) * step * Float(ring)
                    let sz = z + sin(a) * step * Float(ring)
                    let cx = max(-mapHalfExtent, min(mapHalfExtent, sx))
                    let cz = max(-mapHalfExtent, min(mapHalfExtent, sz))
                    if !isBlocked(x: cx, z: cz) {
                        return (cx, cz)
                    }
                }
            }
            return (px, pz)
        }

        /// True when no wall AABB intersects the XZ segment between two points (inset ends slightly).
        private func hasLineOfSight(
            fromX: Float, fromZ: Float,
            toX: Float, toZ: Float
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

        /// Earliest wall distance along a look ray in XZ+Y (uses XZ slab; walls are infinite in Y for LOS).
        private func wallDistanceAlongRay(
            originX: Float, originZ: Float,
            dirX: Float, dirZ: Float,
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
                    if d > 0.12, d < best { best = d }
                }
            }
            return best
        }

        /// Try full step, then X/Z slide — shared by player, enemies, teammate.
        private func tryMove(
            fromX: Float, fromZ: Float,
            dx: Float, dz: Float,
            step: Float,
            in scene: SCNScene
        ) -> (x: Float, z: Float) {
            let tryFull = SCNVector3(fromX + dx * step, 1.6, fromZ + dz * step)
            if !collides(at: tryFull, in: scene) {
                return (tryFull.x, tryFull.z)
            }
            let tryX = SCNVector3(fromX + dx * step, 1.6, fromZ)
            let tryZ = SCNVector3(fromX, 1.6, fromZ + dz * step)
            var nx = fromX
            var nz = fromZ
            if !collides(at: tryX, in: scene) { nx = tryX.x }
            if !collides(at: tryZ, in: scene) { nz = tryZ.z }
            if nx == fromX && nz == fromZ {
                let half = step * 0.5
                let hx = SCNVector3(fromX + dx * half, 1.6, fromZ)
                let hz = SCNVector3(fromX, 1.6, fromZ + dz * half)
                if !collides(at: hx, in: scene) { nx = hx.x }
                if !collides(at: hz, in: scene) { nz = hz.z }
            }
            return (nx, nz)
        }

        private func collectPickups(near position: SCNVector3) {
            guard !pickupNodes.isEmpty else { return }
            var i = 0
            while i < pickupNodes.count {
                let node = pickupNodes[i]
                guard let name = node.name, node.parent != nil else {
                    pickupNodes.remove(at: i)
                    continue
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

        // MARK: - Teammate AI (Story / DLC KESTREL wingman only)

        private func updateTeammate(playerEye: SCNVector3, in scene: SCNScene, dt: Float) {
            guard teammateIsAlive, let mate = teammateNode, mate.parent != nil else { return }

            let profile = teammateAIProfile
            teammateAITick &+= 1
            // Target scan every 5 frames; move on even ticks — keep AI cheap.
            if teammateAITick % 5 == 0 {
                refreshTeammateTargetCache(matePos: mate.position, playerEye: playerEye)
            }
            invalidateDeadFocus()
            let now = Date()
            let bodyguard = TeammateCombatAI.isBodyguard(
                playerHP: healthCache,
                playerMaxHP: operatorProfile.maxHealth,
                profile: profile
            )
            let underFire = now < playerUnderFireUntil
            let focus = aliveEnemy(playerFocusEnemy)
            let peel = nearestThreatToPlayer(playerEye: playerEye)
            let nearest = cachedNearestEnemy
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

            let shouldMove = teammateAITick % 2 == 0
            let aiTime = CACurrentMediaTime()
            let seekCover = now < teammateSeekCoverUntil
            let betweenBursts = teammateBurstLeft <= 0 && now < teammateNextFire

            if let target {
                let targetPos = target.position
                let dx = targetPos.x - mate.position.x
                let dz = targetPos.z - mate.position.z
                let dist = max(0.01, sqrt(dx * dx + dz * dz))
                mate.eulerAngles.y = atan2(dx, dz)

                if !teammateDidRadioEngage {
                    teammateDidRadioEngage = true
                    setStatus("\(teammateCallsign): Contact — engaging!")
                    speakTeammateRadio("Contact — engaging!")
                }

                let los = hasLineOfSight(
                    fromX: mate.position.x, fromZ: mate.position.z,
                    toX: targetPos.x, toZ: targetPos.z
                )
                let inCrosshair = TeammateCombatAI.isInPlayerCrosshair(
                    playerX: playerEye.x, playerZ: playerEye.z,
                    playerYaw: yaw,
                    targetX: targetPos.x, targetZ: targetPos.z,
                    profile: profile
                )

                if shouldMove {
                    let intent = TeammateCombatAI.combatMoveIntent(
                        mateX: mate.position.x,
                        mateZ: mate.position.z,
                        targetX: targetPos.x,
                        targetZ: targetPos.z,
                        playerX: playerEye.x,
                        playerZ: playerEye.z,
                        dist: dist,
                        hasLOS: los,
                        betweenShots: betweenBursts,
                        bodyguard: bodyguard,
                        mateIndex: 0,
                        time: aiTime,
                        colliders: colliders,
                        profile: profile,
                        seekCover: seekCover,
                        playerYaw: yaw,
                        inPlayerCrosshair: inCrosshair
                    )
                    if intent.shouldMove {
                        moveTeammate(
                            mate,
                            towardX: intent.dirX,
                            towardZ: intent.dirZ,
                            speed: intent.speed,
                            dt: dt * 2,
                            in: scene
                        )
                    }
                }

                if dist < profile.engageRange, dist > 1.55, now >= teammateNextFire {
                    let hold = TeammateCombatAI.shouldHoldFireForCrosshair(
                        inPlayerCrosshair: inCrosshair,
                        dist: dist,
                        mateIndex: 0,
                        time: aiTime,
                        profile: profile
                    )
                    if hold {
                        // Skip shot; schedule a short gap and keep flanking.
                        teammateNextFire = now.addingTimeInterval(0.18)
                    } else {
                        teammateNextFire = TeammateCombatAI.scheduleAfterRifleShot(
                            now: now,
                            burstRemaining: &teammateBurstLeft,
                            profile: profile
                        )
                        teammateMuzzleFlash()
                        SoundService.shared.playFire(bodyType: .rifle, volume: soundVolume * 0.32)
                        let chance = TeammateCombatAI.hitChance(
                            profile: profile,
                            hasLOS: los,
                            dist: dist,
                            inPlayerCrosshair: inCrosshair
                        )
                        if Float.random(in: 0...1) < chance {
                            applyDamage(to: target, amount: profile.shotDamage)
                        }
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
                    mateIndex: 0,
                    profile: profile
                )
                if intent.shouldMove {
                    mate.eulerAngles.y = atan2(intent.dirX, intent.dirZ)
                    moveTeammate(
                        mate,
                        towardX: intent.dirX,
                        towardZ: intent.dirZ,
                        speed: intent.speed,
                        dt: dt * 2,
                        in: scene
                    )
                } else {
                    mate.eulerAngles.y = yaw
                }
            }
        }

        private func refreshTeammateTargetCache(matePos: SCNVector3, playerEye: SCNVector3) {
            // Prefer hostiles with LOS to the mate; fall back to nearest.
            var bestLOS: SCNNode?
            var bestLOSDist = Float.greatestFiniteMagnitude
            var bestAny: SCNNode?
            var bestAnyDist = Float.greatestFiniteMagnitude
            let engage = teammateAIProfile.engageRange
            for enemy in enemyNodes {
                guard let name = enemy.name, let hp = enemyHP[name], hp > 0, enemy.parent != nil else { continue }
                let d = distXZ(matePos, enemy.position)
                if d < bestAnyDist {
                    bestAnyDist = d
                    bestAny = enemy
                }
                guard d < engage else { continue }
                if hasLineOfSight(
                    fromX: matePos.x, fromZ: matePos.z,
                    toX: enemy.position.x, toZ: enemy.position.z
                ), d < bestLOSDist {
                    bestLOSDist = d
                    bestLOS = enemy
                }
            }
            cachedNearestEnemy = bestLOS ?? bestAny
            if let focus = playerFocusEnemy,
               let name = focus.name,
               (enemyHP[name] ?? 0) <= 0 || focus.parent == nil {
                playerFocusEnemy = nil
            }
            _ = playerEye
        }

        /// Enemy closest to the player that can currently shoot them (LOS + engage).
        private func nearestThreatToPlayer(playerEye: SCNVector3) -> SCNNode? {
            var best: SCNNode?
            var bestDist = Float.greatestFiniteMagnitude
            let playerEngage = aiProfile.rifleEngageMax
            for enemy in enemyNodes {
                guard let name = enemy.name, let hp = enemyHP[name], hp > 0, enemy.parent != nil else { continue }
                let d = distXZ(playerEye, enemy.position)
                guard d < playerEngage * 1.15 else { continue }
                let los = hasLineOfSight(
                    fromX: enemy.position.x, fromZ: enemy.position.z,
                    toX: playerEye.x, toZ: playerEye.z
                )
                // Prefer LOS threats; still consider close knife-range without LOS.
                let score = d - (los ? 0 : 4)
                if score < bestDist {
                    bestDist = score
                    best = enemy
                }
            }
            return best
        }

        private func invalidateDeadFocus() {
            if let focus = playerFocusEnemy,
               let name = focus.name,
               (enemyHP[name] ?? 0) <= 0 || focus.parent == nil {
                playerFocusEnemy = nil
            }
            if let n = cachedNearestEnemy,
               let name = n.name,
               (enemyHP[name] ?? 0) <= 0 || n.parent == nil {
                cachedNearestEnemy = nil
            }
        }

        private func aliveEnemy(_ node: SCNNode?) -> SCNNode? {
            guard let node, let name = node.name, (enemyHP[name] ?? 0) > 0, node.parent != nil else {
                return nil
            }
            return node
        }

        private func moveTeammate(
            _ mate: SCNNode,
            towardX: Float,
            towardZ: Float,
            speed: Float,
            dt: Float,
            in scene: SCNScene
        ) {
            let step = speed * dt
            let moved = tryMove(
                fromX: mate.position.x,
                fromZ: mate.position.z,
                dx: towardX,
                dz: towardZ,
                step: step,
                in: scene
            )
            mate.position.x = moved.x
            mate.position.z = moved.z
            // Unstick if embedded.
            if isBlocked(x: mate.position.x, z: mate.position.z) {
                let free = resolveFreePosition(x: mate.position.x, z: mate.position.z, radius: playerRadius)
                mate.position.x = free.x
                mate.position.z = free.z
            }
        }

        private func nearestAliveEnemy(to position: SCNVector3) -> SCNNode? {
            var best: SCNNode?
            var bestDist = Float.greatestFiniteMagnitude
            for enemy in enemyNodes {
                guard let name = enemy.name, let hp = enemyHP[name], hp > 0, enemy.parent != nil else { continue }
                let d = distXZ(position, enemy.position)
                if d < bestDist {
                    bestDist = d
                    best = enemy
                }
            }
            return best
        }

        private func distXZ(_ a: SCNVector3, _ b: SCNVector3) -> Float {
            let dx = a.x - b.x
            let dz = a.z - b.z
            return sqrt(dx * dx + dz * dz)
        }

        private func teammateMuzzleFlash() {
            guard let gun = teammateGunNode ?? teammateNode?.childNode(withName: "teammateGun", recursively: true) else { return }
            spawnTransientFX(
                parent: gun,
                radius: 0.055,
                color: UIColor(red: 0.3, green: 1.0, blue: 0.9, alpha: 1),
                position: SCNVector3(0, 0, -0.4),
                life: 0.11
            )
        }

        private func damageTeammate(amount: Double, reason: String) {
            guard combatEnabled, !finished, teammateIsAlive else { return }
            guard Date() >= combatGraceUntil else { return }
            guard Date().timeIntervalSince(teammateHurtCooldown) > 0.7 else { return }
            teammateHurtCooldown = Date()
            teammateSeekCoverUntil = Date().addingTimeInterval(teammateAIProfile.coverSeekSeconds)
            let newHP = max(0, teammateHPCache - amount)
            teammateHPCache = newHP
            if let mate = teammateNode {
                MissionSceneBuilder.updateEnemyHealthBar(
                    on: mate,
                    ratio: Float(newHP / max(1, teammateMaxHPCache))
                )
            }
            DispatchQueue.main.async { [weak self] in
                self?.teammateHPBinding?.wrappedValue = newHP
            }
            if newHP <= 0 {
                downTeammate(reason: reason)
            }
        }

        private func downTeammate(reason: String) {
            guard teammateIsAlive else { return }
            teammateIsAlive = false
            teammateHPCache = 0
            cachedNearestEnemy = nil
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.teammateAliveBinding?.wrappedValue = false
                self.teammateHPBinding?.wrappedValue = 0
            }
            // Soft-lock avoid: teammate death never ends the mission — player continues solo.
            setStatus("\(teammateCallsign) DOWN — continue the mission")
            speakTeammateRadio("I'm down — continue the mission!")
            _ = reason
            if let mate = teammateNode {
                mate.childNode(withName: "healthBar", recursively: false)?.isHidden = true
                let victim = mate
                DispatchQueue.main.async {
                    victim.runAction(.sequence([
                        .fadeOut(duration: 0.35),
                        .removeFromParentNode()
                    ]))
                }
            }
            teammateNode = nil
            teammateGunNode = nil
        }

        // MARK: - Enemies

        private func updateEnemies(playerEye: SCNVector3, in scene: SCNScene, dt: Float) {
            let playerPos = playerEye
            let allyPos: SCNVector3? = (teammateIsAlive && teammateNode?.parent != nil)
                ? teammateNode.map { SCNVector3($0.position.x, 1.6, $0.position.z) }
                : nil
            var alive = 0
            enemyAITick &+= 1
            let now = Date()
            let canHurt = now >= combatGraceUntil
            // Process ~1/3 of enemies for move/attack each frame; always count alive.
            let bucket = enemyAITick % 3
            let aiTime = CACurrentMediaTime()
            let profile = aiProfile

            if enemyAITick % 45 == 0 {
                enemyNodes.removeAll { node in
                    let dead = node.parent == nil || (node.name.flatMap { enemyHP[$0] } ?? 0) <= 0
                    if dead {
                        let id = ObjectIdentifier(node)
                        enemyWeaponNode.removeValue(forKey: id)
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

                // Stagger heavy AI across frames.
                guard idx % 3 == bucket else { continue }

                let weapon = enemyWeapon[name] ?? .rifle

                var targetPos = playerPos
                var targetingTeammate = false
                if let allyPos {
                    let dPlayer = distXZ(node.position, playerPos)
                    let dAlly = distXZ(node.position, allyPos)
                    // Prefer player unless ally is clearly closer (bias scales with difficulty).
                    if dAlly + profile.allyBias < dPlayer {
                        targetPos = allyPos
                        targetingTeammate = true
                    }
                }

                let dx = targetPos.x - node.position.x
                let dz = targetPos.z - node.position.z
                let distSq = dx * dx + dz * dz
                let dist = sqrt(distSq)
                node.eulerAngles.y = atan2(dx, dz)

                let los = hasLineOfSight(
                    fromX: node.position.x, fromZ: node.position.z,
                    toX: targetPos.x, toZ: targetPos.z
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
                // dt*3 because this enemy only moves every 3rd frame.
                let stepScale = dt * 3
                if intent.shouldMove {
                    let moved = tryMove(
                        fromX: node.position.x,
                        fromZ: node.position.z,
                        dx: intent.dirX,
                        dz: intent.dirZ,
                        step: intent.speed * stepScale,
                        in: scene
                    )
                    node.position.x = moved.x
                    node.position.z = moved.z
                }

                if isBlocked(x: node.position.x, z: node.position.z) {
                    let free = resolveFreePosition(
                        x: node.position.x,
                        z: node.position.z,
                        radius: playerRadius
                    )
                    node.position.x = free.x
                    node.position.z = free.z
                }

                guard canHurt else { continue }

                if weapon == .knife {
                    if los, dist < profile.knifeSlashRange, now >= (enemyNextAttack[name] ?? .distantPast) {
                        enemyNextAttack[name] = now.addingTimeInterval(profile.knifeCooldown)
                        slashAnim(node)
                        if targetingTeammate {
                            damageTeammate(amount: 10, reason: "\(teammateCallsign) taking knife!")
                        } else {
                            damagePlayer(amount: 10, reason: "Knife hit!")
                        }
                    }
                } else {
                    if dist < profile.rifleEngageMax, dist > 2.0, now >= (enemyNextAttack[name] ?? .distantPast) {
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
                        enemyMuzzleFlash(node)
                        let t = CACurrentMediaTime()
                        if t - lastEnemySoundTime > 0.16 {
                            lastEnemySoundTime = t
                            SoundService.shared.playFire(bodyType: .rifle, volume: soundVolume * 0.4)
                        }
                        // Wall blocks damage even when they "fire" (muzzle still plays).
                        let chance = EnemyCombatAI.adjustedHitChance(
                            profile: profile,
                            playerSpeedXZ: targetingTeammate ? 0 : playerSpeedXZ
                        )
                        if los, Float.random(in: 0...1) < chance {
                            if targetingTeammate {
                                damageTeammate(amount: 10, reason: "\(teammateCallsign) under fire!")
                            } else {
                                damagePlayer(amount: 10, reason: "Taking fire!")
                            }
                        }
                    }
                }
            }
            setEnemiesLeft(alive)
        }

        private func setEnemiesLeft(_ value: Int) {
            guard value != lastPublishedEnemies else { return }
            let previous = lastPublishedEnemies
            lastPublishedEnemies = value
            DispatchQueue.main.async { [weak self] in
                self?.enemiesLeftBinding?.wrappedValue = value
            }
            // Only evaluate win when the count actually drops (never on configure publish).
            if previous != Int.max, value <= 0 {
                checkEndConditions()
            }
        }

        private func setStatus(_ text: String) {
            let t = CACurrentMediaTime()
            // Drop duplicate / rapid chatter so SwiftUI isn't flooded from the render thread.
            if text == lastStatusText, t - lastStatusAt < 0.45 { return }
            if t - lastStatusAt < 0.12 { return }
            lastStatusAt = t
            lastStatusText = text
            DispatchQueue.main.async { [weak self] in
                self?.statusBinding?.wrappedValue = text
            }
        }

        private func speakTeammateRadio(_ text: String) {
            let callsign = teammateCallsign
            let gender = teammateVoiceGender
            DispatchQueue.main.async {
                DialogueVoiceService.shared.speakRadio(
                    speaker: callsign,
                    text: text,
                    enabled: DialogueVoiceService.isDialogueSpeechAllowed,
                    gender: gender
                )
            }
        }

        private func setAmmo(_ value: Int) {
            ammoCache = value
            DispatchQueue.main.async { [weak self] in
                self?.ammoBinding?.wrappedValue = value
            }
        }

        private func setHealth(_ value: Double) {
            healthCache = value
            DispatchQueue.main.async { [weak self] in
                self?.healthBinding?.wrappedValue = value
            }
        }

        private func setOutcome(_ value: MissionOutcome) {
            DispatchQueue.main.async { [weak self] in
                self?.outcomeBinding?.wrappedValue = value
            }
        }

        private func checkEndConditions() {
            guard combatEnabled, sceneConfigured, !finished else { return }
            // Never win on empty spawn / pre-combat frames.
            guard initialEnemyCount > 0 else { return }
            guard lastPublishedEnemies != Int.max else { return }
            // Require grace to expire so a one-frame count glitch can't auto-win on unlock.
            guard Date() >= combatGraceUntil else { return }
            if lastPublishedEnemies <= 0 {
                finish(victory: true)
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
            setOutcome(victory ? .victory : .defeat)
            setStatus(victory ? "AREA SECURE" : "K.I.A.")
        }

        private func damagePlayer(amount: Double, reason: String) {
            guard combatEnabled, !finished else { return }
            guard Date() >= combatGraceUntil else { return }
            // Longer i-frames so packs of hostiles don't delete you in one burst.
            guard Date().timeIntervalSince(playerHurtCooldown) > 0.85 else { return }
            playerHurtCooldown = Date()
            playerUnderFireUntil = Date().addingTimeInterval(teammateAIProfile.peelSeconds)
            let scaled = amount * operatorProfile.damageTakenMultiplier
            let newHP = max(0, healthCache - scaled)
            setHealth(newHP)
            setStatus(reason)
            HapticsService.fire(enabled: hapticsEnabled, bodyType: .shotgun)
            if newHP <= 0 { finish(victory: false) }
        }

        private func slashAnim(_ node: SCNNode) {
            let knife = enemyWeaponNode[ObjectIdentifier(node)]
                ?? node.childNode(withName: "enemyKnife", recursively: false)
            guard let knife else { return }
            knife.runAction(.sequence([
                .rotateBy(x: 0, y: 0, z: -1.2, duration: 0.12),
                .rotateBy(x: 0, y: 0, z: 1.2, duration: 0.16)
            ]), forKey: "slash")
        }

        private func enemyMuzzleFlash(_ node: SCNNode) {
            let gun = enemyWeaponNode[ObjectIdentifier(node)]
                ?? node.childNode(withName: "enemyGun", recursively: false)
            guard let gun else { return }
            spawnTransientFX(
                parent: gun,
                radius: 0.055,
                color: .yellow,
                position: SCNVector3(0, 0, -0.4),
                life: 0.09
            )
        }

        /// Caps transient spheres so rifle packs can't allocate unbounded FX each frame.
        private func spawnTransientFX(
            parent: SCNNode,
            radius: CGFloat,
            color: UIColor,
            position: SCNVector3,
            life: TimeInterval
        ) {
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

        // MARK: - Shooting

        func startFiring() {
            guard fireTimer == nil, !finished, combatEnabled else { return }
            let interval = blueprint?.fireInterval ?? 0.14
            let timer = Timer(timeInterval: interval, repeats: true) { [weak self] _ in
                self?.fireOnce()
            }
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
            let currentAmmo = ammoCache
            guard currentAmmo > 0 else {
                SoundService.shared.playEmpty(volume: soundVolume)
                stopFiring()
                wantsFiring = false
                return
            }
            setAmmo(currentAmmo - 1)
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

            let baseDamage = blueprint?.shotDamage ?? shotDamage(for: body)
            if let hit = raycastEnemy(body: body) {
                let dmg = body.damageWithHeadshot(baseDamage, isHeadshot: hit.isHeadshot)
                playerFocusEnemy = hit.node
                applyDamage(to: hit.node, amount: dmg, isHeadshot: hit.isHeadshot)
            }
        }

        private func shotDamage(for body: GunBodyType) -> Int {
            switch body {
            case .pistol: return 1
            case .smg: return 1
            case .rifle: return 2
            case .shotgun: return 3
            case .machineGun: return 1
            case .sniper: return 4
            }
        }

        private struct EnemyRayHit {
            let node: SCNNode
            let isHeadshot: Bool
        }

        /// Camera-forward ray vs enemy body + head volumes (no SceneKit hitTest — avoids stalls/crashes).
        /// Walls from cached AABBs block the shot if they are closer than the enemy.
        /// Snipers use longer range, thicker hit radius, denser body samples, and a generous head sphere.
        private func raycastEnemy(body: GunBodyType) -> EnemyRayHit? {
            guard combatEnabled, !finished else { return nil }

            let eye: SCNVector3
            if let cam = playerCamera {
                // Prefer stable anchor eye — presentation.worldPosition can hitch under load.
                eye = SCNVector3(
                    playerAnchor?.position.x ?? cam.worldPosition.x,
                    1.6,
                    playerAnchor?.position.z ?? cam.worldPosition.z
                )
            } else {
                eye = eyeWorldPosition()
            }

            // Near-pinpoint bloom for snipers; other classes keep their catalog bloom so they
            // can't laser-snipe across the map with SMG/pistol spray.
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
            let headY = body.headHitCenterY
            let wallCap = wallDistanceAlongRay(
                originX: eye.x, originZ: eye.z,
                dirX: lookX, dirZ: lookZ,
                maxDist: maxRange
            )

            var bestDist: Float = min(maxRange, wallCap)
            var best: EnemyRayHit?
            for enemy in enemyNodes {
                guard let name = enemy.name, let hp = enemyHP[name], hp > 0, enemy.parent != nil else { continue }
                let ex = enemy.position.x
                let ez = enemy.position.z
                guard hasLineOfSight(fromX: eye.x, fromZ: eye.z, toX: ex, toZ: ez) else { continue }

                // Head sphere (tested before body so upper hits register as headshots).
                do {
                    let toX = ex - eye.x
                    let toY = headY - eye.y
                    let toZ = ez - eye.z
                    let along = toX * lookX + toY * lookY + toZ * lookZ
                    if along > 0.4, along < bestDist {
                        let cx = eye.x + lookX * along
                        let cy = eye.y + lookY * along
                        let cz = eye.z + lookZ * along
                        let dx = cx - ex
                        let dy = cy - headY
                        let dz = cz - ez
                        if dx * dx + dy * dy + dz * dz < headR2 {
                            bestDist = along
                            best = EnemyRayHit(node: enemy, isHeadshot: true)
                            continue
                        }
                    }
                }

                for bodyY in body.hitSampleHeights {
                    let toX = ex - eye.x
                    let toY = bodyY - eye.y
                    let toZ = ez - eye.z
                    let along = toX * lookX + toY * lookY + toZ * lookZ
                    guard along > 0.4, along < bestDist else { continue }
                    let cx = eye.x + lookX * along
                    let cy = eye.y + lookY * along
                    let cz = eye.z + lookZ * along
                    let dx = cx - ex
                    let dy = cy - bodyY
                    let dz = cz - ez
                    if dx * dx + dy * dy + dz * dz < hitR2 {
                        bestDist = along
                        best = EnemyRayHit(node: enemy, isHeadshot: false)
                        break
                    }
                }
            }
            return best
        }

        private func applyDamage(to enemy: SCNNode, amount: Int, isHeadshot: Bool = false) {
            guard combatEnabled, !finished else { return }
            guard let name = enemy.name, let hp = enemyHP[name], hp > 0 else { return }
            let maxHP = max(1, enemyMaxHP[name] ?? hp)
            let newHP = max(0, hp - max(1, amount))
            enemyHP[name] = newHP
            MissionSceneBuilder.updateEnemyHealthBar(on: enemy, ratio: Float(newHP) / Float(maxHP))
            flashEnemy(enemy, headshot: isHeadshot)
            spawnHitSpark(on: enemy, isHeadshot: isHeadshot)
            if isHeadshot {
                SoundService.shared.playHeadshot(volume: soundVolume)
            } else {
                SoundService.shared.playHit(volume: soundVolume)
            }
            if newHP > 0 {
                enemySeekCoverUntil[name] = Date().addingTimeInterval(aiProfile.coverSeekSeconds)
                setStatus(isHeadshot ? "HEADSHOT — \(newHP) HP" : "Hit — \(newHP) HP")
                let juice = onCombatJuice
                let kind: CombatJuiceKind = isHeadshot ? .headshot : .hit
                DispatchQueue.main.async { juice?(kind) }
            } else {
                let bonus = 15
                setAmmo(min(magSize * 4, ammoCache + bonus))
                setStatus(isHeadshot ? "HEADSHOT KO — +\(bonus) AMMO" : "Hostile down — +\(bonus) AMMO")
                SoundService.shared.playKillConfirm(volume: soundVolume)
                enemy.childNode(withName: "healthBar", recursively: false)?.isHidden = true
                if cachedNearestEnemy === enemy { cachedNearestEnemy = nil }
                if playerFocusEnemy === enemy { playerFocusEnemy = nil }
                enemyWeaponNode.removeValue(forKey: ObjectIdentifier(enemy))
                let victim = enemy
                let killHook = onPlayerKill
                let juice = onCombatJuice
                let kind: CombatJuiceKind = isHeadshot ? .headshotKill : .kill
                DispatchQueue.main.async {
                    juice?(kind)
                    killHook?()
                    victim.runAction(.sequence([
                        .fadeOut(duration: 0.18),
                        .removeFromParentNode()
                    ]))
                }
            }
        }

        private func spawnHitSpark(on enemy: SCNNode, isHeadshot: Bool = false) {
            guard enemy.parent != nil else { return }
            let sparkY: Float = isHeadshot ? 1.78 : 1.3
            spawnTransientFX(
                parent: enemy,
                radius: isHeadshot ? 0.09 : 0.06,
                color: isHeadshot ? .red : .orange,
                position: SCNVector3(0, sparkY, 0),
                life: isHeadshot ? 0.14 : 0.1
            )
        }

        private func flashEnemy(_ node: SCNNode, headshot: Bool = false) {
            guard node.parent != nil else { return }
            guard let torso = node.childNode(withName: "enemyTorso", recursively: false),
                  let mat = torso.geometry?.firstMaterial else { return }
            let original = mat.emission.contents
            mat.emission.contents = (headshot ? UIColor.red : UIColor.orange).withAlphaComponent(headshot ? 0.85 : 0.65)
            torso.runAction(.sequence([
                .wait(duration: headshot ? 0.11 : 0.07),
                .run { _ in
                    mat.emission.contents = original
                }
            ]), forKey: "hitFlash")
            if headshot, let head = node.childNode(withName: "enemyHead", recursively: true),
               let hMat = head.geometry?.firstMaterial {
                let hOrig = hMat.emission.contents
                hMat.emission.contents = UIColor.white.withAlphaComponent(0.9)
                head.runAction(.sequence([
                    .wait(duration: 0.09),
                    .run { _ in hMat.emission.contents = hOrig }
                ]), forKey: "headFlash")
            }
        }
    }
}

// Optional bezier helper (unused path kept for future)
private extension SCNAction {
    static func moveAlong(curve points: [NSValue], duration: TimeInterval) -> SCNAction {
        // SceneKit has no built-in bezier move; callers use segmented moves.
        .wait(duration: duration)
    }
}
