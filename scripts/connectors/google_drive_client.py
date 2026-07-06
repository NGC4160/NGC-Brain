"""Google Drive API client — stdlib only, reads credentials from .env."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = ROOT / ".env"
TOKEN_URL = "https://oauth2.googleapis.com/token"
DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files"
SCOPE_READONLY = "https://www.googleapis.com/auth/drive.readonly"

EXPORT_MIME = {
    "application/vnd.google-apps.document": "application/pdf",
    "application/vnd.google-apps.spreadsheet": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.google-apps.presentation": "application/pdf",
}


def load_dotenv(path: Path | None = None) -> None:
    env_path = path or ENV_PATH
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = val


def save_env_value(path: Path, key: str, value: str) -> None:
    lines: list[str] = []
    found = False
    if path.exists():
        for line in path.read_text().splitlines():
            if line.startswith(f"{key}="):
                lines.append(f"{key}={value}")
                found = True
            else:
                lines.append(line)
    if not found:
        lines.append(f"{key}={value}")
    path.write_text("\n".join(lines) + "\n")


def get_credentials() -> tuple[str, str, str]:
    load_dotenv()
    return (
        os.environ.get("GOOGLE_DRIVE_CLIENT_ID", ""),
        os.environ.get("GOOGLE_DRIVE_CLIENT_SECRET", ""),
        os.environ.get("GOOGLE_DRIVE_REFRESH_TOKEN", ""),
    )


def credentials_configured() -> bool:
    return all(get_credentials())


def get_access_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    data = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
    ).encode()
    req = urllib.request.Request(TOKEN_URL, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode())
    token = payload.get("access_token")
    if not token:
        raise RuntimeError(f"No access_token in response: {payload}")
    return token


def get_client() -> tuple[str, str, str, str]:
    client_id, client_secret, refresh_token = get_credentials()
    if not all((client_id, client_secret, refresh_token)):
        raise RuntimeError(
            "Google Drive not configured. Run ./scripts/setup/connect_google_drive.sh "
            "or set GOOGLE_DRIVE_* in .env"
        )
    return client_id, client_secret, refresh_token, get_access_token(client_id, client_secret, refresh_token)


def _request_json(url: str, access_token: str) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access_token}"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode())


def list_files(
    access_token: str,
    query: str | None = None,
    page_size: int = 100,
    fields: str = "files(id,name,mimeType,modifiedTime,size,parents)",
) -> list[dict]:
    files: list[dict] = []
    page_token = ""
    while True:
        params: dict[str, str] = {"pageSize": str(min(page_size, 100)), "fields": f"nextPageToken,{fields}"}
        if query:
            params["q"] = query
        if page_token:
            params["pageToken"] = page_token
        url = f"{DRIVE_FILES_URL}?{urllib.parse.urlencode(params)}"
        payload = _request_json(url, access_token)
        files.extend(payload.get("files", []))
        page_token = payload.get("nextPageToken", "")
        if not page_token or len(files) >= page_size:
            break
    return files[:page_size]


def list_folder_children(access_token: str, folder_id: str, page_size: int = 100) -> list[dict]:
    query = f"'{folder_id}' in parents and trashed = false"
    return list_files(access_token, query=query, page_size=page_size)


def download_file(access_token: str, file_id: str, mime_type: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    export_mime = EXPORT_MIME.get(mime_type)
    if export_mime:
        params = urllib.parse.urlencode({"mimeType": export_mime})
        url = f"{DRIVE_FILES_URL}/{file_id}/export?{params}"
    else:
        url = f"{DRIVE_FILES_URL}/{file_id}?alt=media"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access_token}"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        dest.write_bytes(resp.read())
    return dest


def find_first(access_token: str, query: str) -> dict | None:
    matches = list_files(access_token, query=query, page_size=1)
    return matches[0] if matches else None
