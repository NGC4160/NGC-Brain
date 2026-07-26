# Grand Grambo Guns

Offline arcade-style **virtual gun simulator & customizer** for iPhone (iOS 16+).

Stylized video-game toy only — no real-world ballistics, construction details, multiplayer, or online features.

## Open in Xcode

1. Copy / clone this folder onto a Mac with Xcode 15+.
2. Open `GrandGramboGuns.xcodeproj`.
3. Select an iPhone simulator or device (iPhone only).
4. Set your Development Team under Signing if needed.
5. Run (⌘R).

## Features

| Screen | What it does |
|---|---|
| **Main Hub** | Cinematic title + navigation to all modes |
| **Armory** | Grid of starter + saved guns, 3D inspect, equip, share card |
| **Build Gun** | Modular toy attachments with live SceneKit preview |
| **Paint Shop** | Region layers, spray / fill / camo, color picker |
| **Skins** | Premade finishes (matte, desert, camo, gold, chrome, neon…) |
| **Range** | Arcade FPS-style range — hold to fire, recoil, targets, reload |
| **Settings** | Volume, haptics, reset data / onboarding |

## Tech

- **SwiftUI** navigation & UI
- **SceneKit** procedural 3D guns, attachments, range room, simple physics
- **FileManager + Codable** persistence for guns, paint jobs, skin history (iOS 16+)
- **UserDefaults** for settings + first-run onboarding flags
- Portrait + landscape, dark military theme with neon accents

## Project layout

```
GrandGramboGuns/
├── App/                 # Entry, AppState, RootView
├── Models/              # Gun types, SwiftData models, seed data
├── Scene3D/             # GunSceneBuilder, GunSceneView, RangeSceneView
├── Services/            # Haptics, sound, settings, share exporter
├── Views/
│   ├── Hub/
│   ├── Armory/
│   ├── Build/
│   ├── Paint/
│   ├── Skins/
│   ├── Range/
│   ├── Settings/
│   └── Shared/
└── Assets.xcassets/
```

## Notes

- Guns are built from **procedural block geometry** (cartoon/arcade), not imported real firearm meshes.
- Range scoring and recoil are intentionally arcade-simple.
- Share card uses a SceneKit snapshot + SwiftUI `ImageRenderer`.
