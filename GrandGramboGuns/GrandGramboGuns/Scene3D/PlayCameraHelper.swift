// PlayCameraHelper.swift
// Shared first-/third-person camera rig for Story, Range, Multiplayer, and Battle Royale.

import SceneKit

enum PlayCameraHelper {
    /// Over-shoulder chase offset in player-anchor local space (open maps).
    static let thirdPersonLocalOffset = SCNVector3(0.55, 2.15, 4.1)
    /// Compact over-shoulder for the covered range bay (avoids stall-back wall).
    static let rangeThirdPersonLocalOffset = SCNVector3(0.48, 1.78, 1.45)
    /// Eye height for first-person (missions / arena).
    static let firstPersonEyeHeight: Float = 1.6
    /// Slightly lower eye for the seated range bay.
    static let rangeEyeHeight: Float = 1.4

    static let thirdPersonFOV: CGFloat = 58
    static let rangeThirdPersonFOV: CGFloat = 62
    static let firstPersonFOV: CGFloat = 70
    /// Extra downward pitch so the chase cam looks at the character / aim point.
    static let thirdPersonPitchBias: Float = -0.18
    /// Gentler bias for the range so LOS clears the stall shelf toward targets.
    static let rangeThirdPersonPitchBias: Float = -0.05
    /// How much look-pitch contributes in third person (damped vs FP).
    static let thirdPersonPitchScale: Float = 0.35
    /// More responsive pitch on the short range bay.
    static let rangeThirdPersonPitchScale: Float = 0.55

    static let fpGunLocalPosition = SCNVector3(0.22, -0.28, -0.55)
    static let fpGunLocalEuler = SCNVector3(-0.05, 0.1, 0)
    static let fpGunScale = SCNVector3(0.55, 0.55, 0.55)

    static let tpGunLocalPosition = SCNVector3(0.28, 1.05, -0.18)
    static let tpGunLocalEuler = SCNVector3(0.05, 0.05, 0)
    static let tpGunScale = SCNVector3(0.45, 0.45, 0.45)

    /// Range FP gun pose (toy FPS hold).
    static let rangeFPGunPosition = SCNVector3(0.18, -0.22, -0.55)
    static let rangeFPGunEuler = SCNVector3(-0.08, 0.08, 0)

    /// Apply FP or TP layout: camera offset/FOV, body/gun visibility, anchor yaw.
    static func applyMode(
        thirdPerson: Bool,
        camera: SCNNode,
        playerBody: SCNNode?,
        fpGun: SCNNode?,
        tpGun: SCNNode?,
        playerAnchor: SCNNode?,
        yaw: Float,
        pitch: Float,
        eyeHeight: Float = firstPersonEyeHeight,
        firstPersonFOV: CGFloat = PlayCameraHelper.firstPersonFOV,
        thirdPersonOffset: SCNVector3 = thirdPersonLocalOffset,
        thirdPersonPitchBias: Float = PlayCameraHelper.thirdPersonPitchBias,
        thirdPersonPitchScale: Float = PlayCameraHelper.thirdPersonPitchScale,
        thirdPersonFOV: CGFloat = PlayCameraHelper.thirdPersonFOV
    ) {
        if thirdPerson {
            camera.position = thirdPersonOffset
            camera.eulerAngles = SCNVector3(
                thirdPersonPitchBias + pitch * thirdPersonPitchScale,
                0,
                0
            )
            camera.camera?.fieldOfView = thirdPersonFOV
            playerBody?.isHidden = false
            fpGun?.isHidden = true
            tpGun?.isHidden = false
        } else {
            camera.position = SCNVector3(0, eyeHeight, 0)
            camera.eulerAngles = SCNVector3(pitch, 0, 0)
            camera.camera?.fieldOfView = firstPersonFOV
            playerBody?.isHidden = true
            fpGun?.isHidden = false
            tpGun?.isHidden = true
        }
        playerAnchor?.eulerAngles.y = yaw
    }

    /// Per-frame third-person pitch sync (yaw stays on the anchor).
    static func syncThirdPersonPitch(
        camera: SCNNode,
        pitch: Float,
        pitchBias: Float = thirdPersonPitchBias,
        pitchScale: Float = thirdPersonPitchScale
    ) {
        camera.eulerAngles.x = pitchBias + pitch * pitchScale
    }

    /// World-space eye used for collision / LOS (independent of chase-cam offset).
    static func eyeWorldPosition(anchor: SCNNode?, height: Float = firstPersonEyeHeight) -> SCNVector3 {
        guard let anchor else { return SCNVector3(0, height, 0) }
        return anchor.convertPosition(SCNVector3(0, height, 0), to: nil)
    }

    /// Attach FP gun on camera + optional TP gun on body. Returns (fp, tp).
    @discardableResult
    static func attachGuns(
        blueprint: GunBlueprint,
        toCamera camera: SCNNode,
        toBody body: SCNNode?,
        previousFP: SCNNode?,
        previousTP: SCNNode?,
        lightweight: Bool = true,
        rangeStyleFP: Bool = false
    ) -> (fp: SCNNode, tp: SCNNode?) {
        previousFP?.removeFromParentNode()
        previousTP?.removeFromParentNode()

        let gunFP: SCNNode = lightweight
            ? GunSceneBuilder.buildLightweightGunNode(blueprint: blueprint)
            : GunSceneBuilder.buildGunNode(blueprint: blueprint)
        gunFP.name = "gunRoot"
        if rangeStyleFP {
            gunFP.position = rangeFPGunPosition
            gunFP.eulerAngles = rangeFPGunEuler
            gunFP.scale = fpGunScale
        } else {
            gunFP.position = fpGunLocalPosition
            gunFP.eulerAngles = fpGunLocalEuler
            gunFP.scale = fpGunScale
        }
        camera.addChildNode(gunFP)

        var gunTP: SCNNode?
        if let body {
            let tp = lightweight
                ? GunSceneBuilder.buildLightweightGunNode(blueprint: blueprint)
                : GunSceneBuilder.buildGunNode(blueprint: blueprint)
            tp.name = "gunRootTP"
            tp.position = tpGunLocalPosition
            tp.eulerAngles = tpGunLocalEuler
            tp.scale = tpGunScale
            body.addChildNode(tp)
            gunTP = tp
        }
        return (gunFP, gunTP)
    }
}
