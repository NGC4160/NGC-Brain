"""Windows/macOS desktop entrypoint for Birdhouse Print Shop."""

from __future__ import annotations

import socket
import sys
import threading
import time
import webbrowser
from contextlib import closing

import uvicorn

from app.main import app


HOST = "127.0.0.1"
PREFERRED_PORT = 8787


def _free_port(preferred: int) -> int:
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        try:
            s.bind((HOST, preferred))
            return preferred
        except OSError:
            s.bind((HOST, 0))
            return int(s.getsockname()[1])


def _wait_ready(port: int, timeout: float = 15.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            s.settimeout(0.5)
            try:
                s.connect((HOST, port))
                return True
            except OSError:
                time.sleep(0.1)
    return False


def _run_server(port: int) -> None:
    uvicorn.run(app, host=HOST, port=port, log_level="warning")


def main() -> int:
    port = _free_port(PREFERRED_PORT)
    url = f"http://{HOST}:{port}"

    thread = threading.Thread(target=_run_server, args=(port,), daemon=True)
    thread.start()

    if not _wait_ready(port):
        print("Birdhouse Print Shop failed to start.", file=sys.stderr)
        return 1

    # Prefer a real desktop window; fall back to the default browser.
    try:
        import webview

        webview.create_window(
            "Birdhouse Print Shop",
            url,
            width=1280,
            height=840,
            min_size=(900, 600),
        )
        webview.start()
    except Exception:
        webbrowser.open(url)
        print(f"Birdhouse Print Shop is running at {url}")
        print("Close this window to quit.")
        try:
            while thread.is_alive():
                time.sleep(0.5)
        except KeyboardInterrupt:
            pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
