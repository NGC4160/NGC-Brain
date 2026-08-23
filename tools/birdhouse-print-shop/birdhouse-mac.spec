# -*- mode: python ; coding: utf-8 -*-
# Build on macOS:
#   pyinstaller --noconfirm birdhouse-mac.spec

block_cipher = None

a = Analysis(
    ['app/desktop.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('schema.sql', '.'),
        ('app/templates', 'app/templates'),
        ('app/static', 'app/static'),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'multipart',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='BlakesBirdhouses',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=True,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='BlakesBirdhouses',
)

app = BUNDLE(
    coll,
    name='BlakesBirdhouses.app',
    icon=None,
    bundle_identifier='com.blakesbirdhouses.app',
    info_plist={
        'CFBundleName': "Blake's Birdhouses",
        'CFBundleDisplayName': "Blake's Birdhouses",
        'CFBundleShortVersionString': '0.2.0',
        'NSHighResolutionCapable': True,
    },
)
