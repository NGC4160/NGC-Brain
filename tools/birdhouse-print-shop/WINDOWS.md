# Birdhouse Print Shop — Windows desktop product

> **Moved:** see **[DESKTOP.md](DESKTOP.md)** for Mac + Windows.  
> The `.exe` is **Windows-only**. On a Mac it fails (error -10661).

Give your friend a **`.exe` they double-click forever**.  
No Render account. No Python install. Data stays on their PC.

## What they get

- App name: **Birdhouse Print Shop**
- File: `BirdhousePrintShop.exe`
- Their shop database lives in:  
  `%LOCALAPPDATA%\BirdhousePrintShop\birdhouse.db`  
  (survives app updates if you send a newer exe later)

## How you get the exe (once)

### Option A — GitHub builds it for you (recommended)

1. Open the repo on GitHub → **Actions**
2. Select workflow **Build Birdhouse Windows App**
3. Click **Run workflow** (branch `cursor/birdhouse-print-shop-mvp-838f` or `main`)
4. When it finishes → open the run → download artifact **BirdhousePrintShop-Windows**
5. Unzip → you’ll have `BirdhousePrintShop.exe`
6. Also creates a GitHub Release download link you can text

Direct Actions page after push:  
https://github.com/NGC4160/NGC-Brain/actions/workflows/birdhouse-windows.yml

### Option B — Build on a Windows PC

```bat
cd tools\birdhouse-print-shop
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-desktop.txt
pyinstaller --noconfirm birdhouse.spec
```

Exe output: `dist\BirdhousePrintShop.exe`

## How to send it to your friend

### Text / email
> Here’s Birdhouse Print Shop for Windows.  
> Download: YOUR_RELEASE_OR_DRIVE_LINK  
> Unzip if needed → double-click BirdhousePrintShop.exe  
> Windows may say “Windows protected your PC” → More info → Run anyway  
> (unsigned app — normal for a small tool)  
> Your data stays on this computer. Use it as long as you want.

### Or Dropbox / Google Drive
Upload `BirdhousePrintShop.exe` (or a zip) → share link → same instructions.

## Friend checklist

1. Windows 10/11 PC  
2. Double-click exe  
3. If SmartScreen blocks it → **More info → Run anyway**  
4. First launch seeds sample birdhouses — they can replace with their products  
5. Bookmark isn’t needed; the exe is the product  

## Updates later

Send a new exe. Their database in AppData is left alone, so orders/inventory remain.

## Not included yet

- Code signing certificate (removes SmartScreen warning; paid yearly)
- Auto-updater
- Multi-user login

Those can come after the first friend is happily using it.
