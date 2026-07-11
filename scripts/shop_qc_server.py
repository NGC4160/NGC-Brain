#!/usr/bin/env python3
"""Local server for the NGC Shop QC form — serves the app and saves submissions."""

from __future__ import annotations

import json
import mimetypes
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    from flask import Flask, jsonify, request, send_from_directory
except ImportError:
    print("Flask is required. Install with: pip install flask", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = ROOT / "external_docs/templates/shop_qc"
QC_FORMS_DIR = ROOT / "QC forms"

app = Flask(__name__, static_folder=str(TEMPLATE_DIR), static_url_path="/static")
app.config["MAX_CONTENT_LENGTH"] = 512 * 1024 * 1024  # 512 MB total upload

MEDIA_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif",
    ".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v",
}


def sanitize_segment(value: str) -> str:
    cleaned = re.sub(r"[^\w\-]+", "_", value.strip())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned or "unknown"


def folder_name(job_number: str, last_name: str) -> str:
    return f"{sanitize_segment(job_number)}_{sanitize_segment(last_name)}"


def unique_destination(base: Path) -> Path:
    if not base.exists():
        return base
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return base.parent / f"{base.name}_{stamp}"


@app.get("/")
def index():
    return send_from_directory(TEMPLATE_DIR, "NGC_Shop_QC_App.html")


@app.get("/assets/<path:filename>")
def assets(filename: str):
    return send_from_directory(TEMPLATE_DIR / "assets", filename)


@app.post("/api/save")
def save_qc_form():
    payload_raw = request.form.get("payload")
    if not payload_raw:
        return jsonify({"ok": False, "error": "Missing form payload."}), 400

    try:
        payload = json.loads(payload_raw)
    except json.JSONDecodeError:
        return jsonify({"ok": False, "error": "Invalid form payload."}), 400

    job_number = (payload.get("jobNumber") or "").strip()
    last_name = (payload.get("customerLastName") or "").strip()

    if not job_number:
        return jsonify({"ok": False, "error": "HCP invoice / job # is required."}), 400
    if not last_name:
        return jsonify({"ok": False, "error": "Customer last name is required to save."}), 400

    name = folder_name(job_number, last_name)
    dest = unique_destination(QC_FORMS_DIR / name)
    media_dir = dest / "media"
    dest.mkdir(parents=True, exist_ok=True)
    media_dir.mkdir(parents=True, exist_ok=True)

    saved_media: list[dict[str, str]] = []
    files = request.files.getlist("media")

    for index, upload in enumerate(files, start=1):
        if not upload or not upload.filename:
            continue

        original = Path(upload.filename)
        ext = original.suffix.lower()
        if ext and ext not in MEDIA_EXTENSIONS:
            return jsonify({
                "ok": False,
                "error": f"Unsupported file type: {ext}. Upload photos or videos only.",
            }), 400

        stem = sanitize_segment(original.stem) or "file"
        filename = f"{index:03d}_{stem}{ext or ''}"
        target = media_dir / filename

        upload.save(target)
        saved_media.append({
            "filename": filename,
            "originalName": original.name,
            "mimeType": upload.mimetype or mimetypes.guess_type(filename)[0] or "application/octet-stream",
            "sizeBytes": target.stat().st_size,
        })

    record = {
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "folderName": dest.name,
        "jobNumber": job_number,
        "customerLastName": last_name,
        "form": payload,
        "media": saved_media,
    }

    (dest / "form.json").write_text(json.dumps(record, indent=2), encoding="utf-8")

    summary_name = f"{dest.name}.txt"
    summary_lines = [
        "NGC Shop QC Completion Form",
        f"Saved: {record['savedAt']}",
        f"Job #: {job_number}",
        f"Customer last name: {last_name}",
        f"Technician: {payload.get('technician', '')}",
        f"Cart: {payload.get('cartMakeModel', '')}",
        f"Media files: {len(saved_media)}",
        "",
        "Certification:",
        "YES" if payload.get("certification") else "NO",
    ]
    (dest / summary_name).write_text("\n".join(summary_lines), encoding="utf-8")

    return jsonify({
        "ok": True,
        "folder": str(dest.relative_to(ROOT)),
        "folderName": dest.name,
        "mediaCount": len(saved_media),
        "message": f"Saved to QC forms/{dest.name}/",
    })


def main() -> None:
    QC_FORMS_DIR.mkdir(parents=True, exist_ok=True)
    host = "127.0.0.1"
    port = 8765
    print(f"NGC Shop QC form: http://{host}:{port}")
    print(f"Saved submissions: {QC_FORMS_DIR}")
    app.run(host=host, port=port, debug=False)


if __name__ == "__main__":
    main()
