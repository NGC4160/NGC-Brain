# Grand Grambo Guns

Offline iPhone gun simulator inspired by shake-to-shoot utility apps — plus gun customization (skins, paint, attachments) and a 3D shooting range.

**No ads. No tracking. Fully offline.**

Requires **iOS 17+**, Xcode 15+.

## Play modes

| Mode | What it does |
|---|---|
| **Story Mode** | Campaign **Operation Iron Meridian** — walkable missions, ammo/medkits, enemies, MW3-style briefing tone (original story, not COD IP). |
| **Shake to Shoot** | Hold the phone like a gun, shake to fire. Sound, haptics, screen flash, and rear torch muzzle flash. Reload when empty. |
| **Shooting Range** | FPS-style outdoor range — drag aim, hold fire, static targets with bullet holes. |

## Customize (kept extras)

| Screen | What it does |
|---|---|
| **Armory** | Category-filtered gun grid, inspect, equip → Shake or Range |
| **Build Gun** | Body types + modular attachments with live 3D preview |
| **Paint Shop** | Region layers, spray / fill / camo |
| **Skins** | Premade finishes (matte, desert, camo, gold, chrome, neon…) |
| **Settings** | Volume, haptics, flashlight, shake sensitivity — **no ads** |

## Gun categories

Pistol · SMG · Rifle · Shotgun · Machine Gun · Sniper — each with distinct fire rate, sound, recoil, and mag size.

## Open in Xcode

1. Open `GrandGramboGuns.xcodeproj`
2. Select an **iPhone** simulator or device
3. Set Development Team under Signing if needed
4. Run (⌘R)

**Simulator note:** Shake detection is weak in Simulator — use the on-screen **FIRE** button. Torch flashlight only works on a real iPhone.

## Tech

- SwiftUI + SceneKit procedural guns
- CoreMotion shake detection
- AVFoundation torch flash + procedural audio
- FileManager + Codable persistence

## Notes

- Guns are procedural game-style meshes (not imported real firearm CAD).
- Arcade toy / prank simulator — not a training tool.
- Share card uses SceneKit snapshot + `ImageRenderer`.
