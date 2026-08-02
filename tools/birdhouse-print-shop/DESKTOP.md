# Birdhouse Print Shop — desktop apps

## Important

| File | Opens on |
|---|---|
| `BirdhousePrintShop.exe` | **Windows only** |
| `BirdhousePrintShop.app` (in the macOS zip) | **Mac only** |

Your MacBook Air **cannot** open the `.exe`. Error **-10661** usually means macOS rejected a Windows program.

- **You (Mac):** use the macOS build  
- **Friend (Windows):** use the `.exe`

## Download (Releases — easiest)

https://github.com/NGC4160/NGC-Brain/releases

### On your Mac
1. Download **BirdhousePrintShop-macOS.zip**
2. Unzip
3. Right-click **Birdhouse Print Shop** / `BirdhousePrintShop.app` → **Open**  
   (first time: confirm Gatekeeper warning)
4. App data: `~/.birdhouse-print-shop/`

### For your Windows friend
1. Send them **BirdhousePrintShop.exe**
2. They double-click it
3. If SmartScreen appears: **More info → Run anyway**
4. Their data: `%LOCALAPPDATA%\BirdhousePrintShop`

## Build via Actions

Workflow: **Build Birdhouse Desktop Apps**  
https://github.com/NGC4160/NGC-Brain/actions/workflows/birdhouse-desktop.yml
