"""Google Drive API client — stdlib only, reads credentials from .env.

Cloud agents use this instead of the Mac Google Drive Desktop symlink.
Supports search, download, upload, folder create, and move.
"""

from __future__ import annotations

import json
import mimetypes
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = ROOT / ".env"
TOKEN_URL = "https://oauth2.googleapis.com/token"
DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files"
UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files"

# Full Drive access so cloud agents can file counseling PDFs and move audio.
SCOPE_DRIVE = "https://www.googleapis.com/auth/drive"
SCOPE_READONLY = "https://www.googleapis.com/auth/drive.readonly"  # legacy docs / MCP

EXPORT_MIME = {
    "application/vnd.google-apps.document": "application/pdf",
    "application/vnd.google-apps.spreadsheet": (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ),
    "application/vnd.google-apps.presentation": "application/pdf",
}

FOLDER_MIME = "application/vnd.google-apps.folder"


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
        if lines and lines[-1] != "":
            pass
        lines.append(f"{key}={value}")
    path.write_text("\n".join(lines) + "\n")


def get_credentials() -> tuple[str, str, str]:
    load_dotenv()
    # Also accept Cursor / CI secret names without GOOGLE_DRIVE_ prefix if set
    client_id = os.environ.get("GOOGLE_DRIVE_CLIENT_ID") or os.environ.get("GDRIVE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_DRIVE_CLIENT_SECRET") or os.environ.get(
        "GDRIVE_CLIENT_SECRET", ""
    )
    refresh_token = os.environ.get("GOOGLE_DRIVE_REFRESH_TOKEN") or os.environ.get(
        "GDRIVE_REFRESH_TOKEN", ""
    )
    return client_id, client_secret, refresh_token


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
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read().decode())
    except urllib.error.HTTPError as err:
        body = err.read().decode(errors="replace")
        raise RuntimeError(f"Token refresh failed ({err.code}): {body}") from err
    token = payload.get("access_token")
    if not token:
        raise RuntimeError(f"No access_token in response: {payload}")
    return token


def get_client() -> tuple[str, str, str, str]:
    client_id, client_secret, refresh_token = get_credentials()
    if not all((client_id, client_secret, refresh_token)):
        raise RuntimeError(
            "Google Drive not configured. Paste GOOGLE_DRIVE_CLIENT_ID, "
            "GOOGLE_DRIVE_CLIENT_SECRET, and GOOGLE_DRIVE_REFRESH_TOKEN "
            "(see knowledge/10_automation/google_drive_setup.md)."
        )
    return client_id, client_secret, refresh_token, get_access_token(
        client_id, client_secret, refresh_token
    )


def _request_json(
    url: str,
    access_token: str,
    method: str = "GET",
    data: bytes | None = None,
    content_type: str | None = None,
) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    if content_type:
        headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        body = err.read().decode(errors="replace")
        raise RuntimeError(f"Drive API {method} {url} failed ({err.code}): {body}") from err


def list_files(
    access_token: str,
    query: str | None = None,
    page_size: int = 100,
    fields: str = "files(id,name,mimeType,modifiedTime,size,parents,webViewLink)",
) -> list[dict]:
    files: list[dict] = []
    page_token = ""
    while True:
        params: dict[str, str] = {
            "pageSize": str(min(page_size, 100)),
            "fields": f"nextPageToken,{fields}",
            "supportsAllDrives": "true",
            "includeItemsFromAllDrives": "true",
        }
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


def find_first(access_token: str, query: str) -> dict | None:
    matches = list_files(access_token, query=query, page_size=1)
    return matches[0] if matches else None


def search_by_name(
    access_token: str,
    name_contains: str,
    *,
    mime_type: str | None = None,
    page_size: int = 25,
) -> list[dict]:
    """Case-insensitive name contains search (Drive 'contains' is case-insensitive)."""
    escaped = name_contains.replace("\\", "\\\\").replace("'", "\\'")
    query = f"name contains '{escaped}' and trashed = false"
    if mime_type:
        query += f" and mimeType = '{mime_type}'"
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
    with urllib.request.urlopen(req, timeout=300) as resp:
        dest.write_bytes(resp.read())
    return dest


def create_folder(access_token: str, name: str, parent_id: str | None = None) -> dict:
    meta: dict = {"name": name, "mimeType": FOLDER_MIME}
    if parent_id:
        meta["parents"] = [parent_id]
    return _request_json(
        f"{DRIVE_FILES_URL}?supportsAllDrives=true",
        access_token,
        method="POST",
        data=json.dumps(meta).encode(),
        content_type="application/json",
    )


def ensure_folder(access_token: str, name: str, parent_id: str | None = None) -> dict:
    q = f"name = '{name.replace(chr(39), chr(92)+chr(39))}' and mimeType = '{FOLDER_MIME}' and trashed = false"
    if parent_id:
        q += f" and '{parent_id}' in parents"
    else:
        q += " and 'root' in parents"
    existing = find_first(access_token, q)
    if existing:
        return existing
    return create_folder(access_token, name, parent_id)


def ensure_path(access_token: str, parts: list[str], parent_id: str | None = None) -> dict:
    """Ensure nested folders exist under parent (or My Drive root). Returns leaf folder."""
    current_parent = parent_id
    leaf: dict = {}
    for part in parts:
        leaf = ensure_folder(access_token, part, current_parent)
        current_parent = leaf["id"]
    if not leaf:
        raise RuntimeError("ensure_path requires at least one folder name")
    return leaf


def upload_file(
    access_token: str,
    local_path: Path,
    *,
    parent_id: str | None = None,
    name: str | None = None,
    mime_type: str | None = None,
) -> dict:
    """Multipart upload of a local file into Drive."""
    local_path = Path(local_path)
    if not local_path.is_file():
        raise FileNotFoundError(local_path)
    file_name = name or local_path.name
    guessed, _ = mimetypes.guess_type(str(local_path))
    content_type = mime_type or guessed or "application/octet-stream"
    metadata: dict = {"name": file_name}
    if parent_id:
        metadata["parents"] = [parent_id]

    boundary = "ngc_drive_boundary"
    meta_json = json.dumps(metadata)
    body = (
        f"--{boundary}\r\n"
        f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
        f"{meta_json}\r\n"
        f"--{boundary}\r\n"
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode() + local_path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()

    url = f"{UPLOAD_URL}?uploadType=multipart&supportsAllDrives=true"
    return _request_json(
        url,
        access_token,
        method="POST",
        data=body,
        content_type=f"multipart/related; boundary={boundary}",
    )


def move_file(
    access_token: str,
    file_id: str,
    new_parent_id: str,
    *,
    remove_from_parents: list[str] | None = None,
) -> dict:
    """Move a file into new_parent_id. Removes prior parents when known."""
    if remove_from_parents is None:
        meta = _request_json(
            f"{DRIVE_FILES_URL}/{file_id}?fields=parents&supportsAllDrives=true",
            access_token,
        )
        remove_from_parents = meta.get("parents") or []
    params = {
        "addParents": new_parent_id,
        "supportsAllDrives": "true",
        "fields": "id,name,parents,webViewLink",
    }
    if remove_from_parents:
        params["removeParents"] = ",".join(remove_from_parents)
    url = f"{DRIVE_FILES_URL}/{file_id}?{urllib.parse.urlencode(params)}"
    return _request_json(url, access_token, method="PATCH", data=b"{}", content_type="application/json")


def about_user(access_token: str) -> dict:
    url = "https://www.googleapis.com/drive/v3/about?fields=user,storageQuota"
    return _request_json(url, access_token)
