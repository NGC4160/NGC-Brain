"""Local embeddings via Ollama + ChromaDB for vault semantic search."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

import httpx

from omi_brain.config import Settings


class EmbeddingIndex:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._collection = None

    def _get_collection(self):
        if self._collection is not None:
            return self._collection
        import chromadb
        from chromadb.config import Settings as ChromaSettings

        client = chromadb.PersistentClient(
            path=str(self.settings.chroma_persist_dir),
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = client.get_or_create_collection(
            name=self.settings.chroma_collection,
            metadata={"hnsw:space": "cosine"},
        )
        return self._collection

    def embed(self, text: str) -> list[float]:
        with httpx.Client(base_url=self.settings.ollama_base_url, timeout=120.0) as client:
            r = client.post(
                "/api/embeddings",
                json={"model": self.settings.embed_model, "prompt": text},
            )
            r.raise_for_status()
            data = r.json()
            vec = data.get("embedding")
            if not vec:
                raise RuntimeError(f"No embedding returned: {data}")
            return list(vec)

    def upsert_file(self, path: Path, vault_root: Path) -> str:
        text = path.read_text(encoding="utf-8", errors="ignore")
        # Cap for embedding context
        chunk = text[:6000]
        rel = path.relative_to(vault_root).as_posix()
        doc_id = hashlib.sha256(rel.encode()).hexdigest()[:32]
        embedding = self.embed(chunk)
        col = self._get_collection()
        col.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[chunk],
            metadatas=[{"path": rel, "mtime": path.stat().st_mtime}],
        )
        return doc_id

    def index_vault(
        self,
        vault_root: Path,
        *,
        globs: tuple[str, ...] = ("**/*.md",),
        skip_dirs: tuple[str, ...] = (".obsidian", ".trash", ".git"),
    ) -> dict[str, Any]:
        files: list[Path] = []
        for pattern in globs:
            for p in vault_root.glob(pattern):
                if not p.is_file():
                    continue
                if any(part in skip_dirs for part in p.parts):
                    continue
                files.append(p)

        indexed = 0
        errors: list[str] = []
        for path in files:
            try:
                self.upsert_file(path, vault_root)
                indexed += 1
            except Exception as exc:  # noqa: BLE001 — collect and continue
                errors.append(f"{path}: {exc}")
        return {"indexed": indexed, "errors": errors, "total_candidates": len(files)}

    def search(self, query: str, *, n_results: int = 8) -> list[dict[str, Any]]:
        embedding = self.embed(query)
        col = self._get_collection()
        result = col.query(query_embeddings=[embedding], n_results=n_results)
        out: list[dict[str, Any]] = []
        ids = (result.get("ids") or [[]])[0]
        docs = (result.get("documents") or [[]])[0]
        metas = (result.get("metadatas") or [[]])[0]
        dists = (result.get("distances") or [[]])[0]
        for i, doc_id in enumerate(ids):
            out.append(
                {
                    "id": doc_id,
                    "path": (metas[i] or {}).get("path"),
                    "distance": dists[i] if i < len(dists) else None,
                    "snippet": (docs[i] or "")[:400],
                }
            )
        return out
