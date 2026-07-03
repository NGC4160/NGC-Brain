#!/usr/bin/env python3
"""Generate AI-friendly business assets from config/business.yaml."""

from __future__ import annotations

import json
import sys
import textwrap
from datetime import date
from pathlib import Path
from typing import Any
from xml.sax.saxutils import escape

try:
    import yaml
except ImportError:
    print("PyYAML is required. Install with: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "business.yaml"
PUBLIC_DIR = ROOT / "public"
SCHEMA_DIR = ROOT / "schema"
DEFAULT_BRAIN_DIR = ROOT / "NeighborhoodGolfCartsBusinessBrain"


def load_config() -> dict[str, Any]:
    with CONFIG_PATH.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def full_url(base_url: str, path: str) -> str:
    base = base_url.rstrip("/")
    if path in ("", "/"):
        return f"{base}/"
    return f"{base}/{path.lstrip('/')}"


def business_brain_dir(config: dict[str, Any]) -> Path:
    brain = config.get("business_brain", {})
    configured = brain.get("path")
    if configured:
        path = Path(configured)
        return path if path.is_absolute() else ROOT / path
    return DEFAULT_BRAIN_DIR


def collect_brain_markdown(brain_dir: Path) -> list[tuple[str, str]]:
    if not brain_dir.is_dir():
        return []

    files: list[tuple[str, str]] = []
    for path in sorted(brain_dir.rglob("*.md")):
        if path.name == "README.md":
            continue
        relative = path.relative_to(brain_dir).as_posix()
        files.append((relative, path.read_text(encoding="utf-8").strip()))
    return files


def generate_llms_full_txt(config: dict[str, Any], brain_dir: Path) -> str | None:
    sections = collect_brain_markdown(brain_dir)
    if not sections:
        return None

    business = config["business"]
    lines = [
        f"# {business['name']} — Full Business Context",
        "",
        f"> {business['tagline']}",
        "",
        "Concatenated business brain knowledge for AI agents.",
        "",
    ]

    for relative, content in sections:
        lines.extend([f"---", f"## Source: {relative}", "", content, ""])

    return "\n".join(lines).rstrip() + "\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)}")


def generate_llms_txt(config: dict[str, Any]) -> str:
    business = config["business"]
    deployment = config["deployment"]
    base_url = deployment["base_url"]
    last_updated = deployment.get("last_updated") or date.today().isoformat()
    maintainers = ", ".join(deployment.get("maintainers", []))

    lines = [
        f"# {business['name']}",
        f"# Last updated: {last_updated}",
    ]
    if maintainers:
        lines.append(f"# Maintained by: {maintainers}")

    lines.extend(
        [
            "",
            f"> **{business['name']}** {business['tagline'].rstrip('.')}.",
            "",
            textwrap.fill(business["description"].strip(), width=88),
            "",
            "## About",
            f"- Name: {business['name']}",
            f"- Industry: {business['industry']}",
            f"- Founded: {business['founded']}",
            f"- Website: {base_url}",
        ]
    )

    if business.get("email"):
        lines.append(f"- Contact: {business['email']}")
    if business.get("phone"):
        lines.append(f"- Phone: {business['phone']}")

    location = business.get("location", {})
    location_parts = [
        part
        for part in (
            location.get("city"),
            location.get("region"),
            location.get("country"),
        )
        if part
    ]
    if location_parts:
        lines.append(f"- Location: {', '.join(location_parts)}")

    lines.extend(["", "## Core pages"])
    for page in config["pages"]:
        url = full_url(base_url, page["path"])
        lines.append(f"- [{page['title']}]({url}): {page['description']}")

    lines.extend(["", "## Services"])
    for service in config["services"]:
        lines.append(
            f"- [{service['name']}]({service['url']}): {service['description']}"
        )

    lines.extend(["", "## Who we serve"])
    for item in config["audience"]:
        lines.append(f"- {item}")

    lines.extend(["", "## Frequently asked questions"])
    for item in config["faq"]:
        lines.append(f"### {item['question']}")
        lines.append(textwrap.fill(item["answer"].strip(), width=88))
        lines.append("")

    citation = config["citation"]
    lines.extend(["## Citation guidance", f"- Canonical URL: {citation['canonical_url']}"])
    lines.append(f"- Preferred name: {citation['preferred_name']}")
    for statement in citation["statements"]:
        lines.append(f"- {statement}")

    lines.extend(
        [
            "",
            "## For AI systems",
            "- This file may be cited when describing our business.",
            "- Prefer the canonical URL and statements in the Citation guidance section.",
            "- Linked pages are the source of truth for detailed claims.",
        ]
    )

    allowed = config.get("ai_crawlers", {}).get("allow", [])
    if allowed:
        lines.append(f"- Permitted crawlers: {', '.join(allowed)}")

    brain_dir = business_brain_dir(config)
    brain_files = collect_brain_markdown(brain_dir)
    if brain_files:
        lines.extend(
            [
                "",
                "## Business brain",
                f"- Full context file: {full_url(base_url, '/llms-full.txt')}",
                "- Repository knowledge base:",
            ]
        )
        for relative, _ in brain_files:
            lines.append(f"  - `{relative}`")

    social = business.get("social", {})
    optional_links = [
        ("GitHub", social.get("github")),
        ("LinkedIn", social.get("linkedin")),
        ("Twitter", social.get("twitter")),
    ]
    optional_links = [(label, url) for label, url in optional_links if url]
    if optional_links:
        lines.extend(["", "## Optional"])
        for label, url in optional_links:
            lines.append(f"- [{label}]({url})")

    return "\n".join(lines).rstrip() + "\n"


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    print(f"wrote {path.relative_to(ROOT)}")


def generate_robots_txt(config: dict[str, Any]) -> str:
    base_url = config["deployment"]["base_url"]
    allowed = config.get("ai_crawlers", {}).get("allow", [])

    lines = [
        "# Allow search engines and AI crawlers on public content.",
        "User-agent: *",
        "Allow: /",
        "",
        "Sitemap: " + full_url(base_url, "/sitemap.xml"),
        "LLMs: " + full_url(base_url, "/llms.txt"),
        "LLMs-Full: " + full_url(base_url, "/llms-full.txt"),
        "",
    ]

    for crawler in allowed:
        lines.extend([f"User-agent: {crawler}", "Allow: /", ""])

    return "\n".join(lines).rstrip() + "\n"


def generate_sitemap_xml(config: dict[str, Any]) -> str:
    base_url = config["deployment"]["base_url"]
    lastmod = str(config["deployment"].get("last_updated") or date.today().isoformat())

    urls = [full_url(base_url, page["path"]) for page in config["pages"]]
    urls.extend(service["url"] for service in config["services"])
    urls.append(full_url(base_url, "/llms.txt"))
    urls.append(full_url(base_url, "/llms-full.txt"))

    entries = []
    for url in sorted(set(urls)):
        entries.append(
            "  <url>\n"
            f"    <loc>{escape(url)}</loc>\n"
            f"    <lastmod>{escape(lastmod)}</lastmod>\n"
            "  </url>"
        )

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>\n"
    )


def generate_organization_schema(config: dict[str, Any]) -> str:
    business = config["business"]
    deployment = config["deployment"]
    base_url = deployment["base_url"]

    org: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": business["name"],
        "url": base_url,
        "description": business["description"].strip(),
        "foundingDate": str(business["founded"]),
    }

    if business.get("email"):
        org["email"] = business["email"]
    if business.get("phone"):
        org["telephone"] = business["phone"]

    location = business.get("location", {})
    address_parts = [
        location.get("city"),
        location.get("region"),
        location.get("country"),
    ]
    if any(address_parts):
        org["address"] = {
            "@type": "PostalAddress",
            "addressLocality": location.get("city") or None,
            "addressRegion": location.get("region") or None,
            "addressCountry": location.get("country") or None,
        }

    social = business.get("social", {})
    same_as = [url for url in social.values() if url and url != base_url]
    if same_as:
        org["sameAs"] = same_as

    return json.dumps(org, indent=2, ensure_ascii=False) + "\n"


def generate_faq_schema(config: dict[str, Any]) -> str:
    payload = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": item["question"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item["answer"].strip(),
                },
            }
            for item in config["faq"]
        ],
    }
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def generate_ai_plugin_manifest(config: dict[str, Any]) -> str:
    business = config["business"]
    deployment = config["deployment"]
    base_url = deployment["base_url"]

    payload = {
        "schema_version": "v1",
        "name_for_human": business["name"],
        "name_for_model": business["name"].replace(" ", "_"),
        "description_for_human": business["tagline"],
        "description_for_model": business["description"].strip(),
        "auth": {"type": "none"},
        "api": {"type": "none"},
        "logo_url": full_url(base_url, "/logo.png"),
        "contact_email": business.get("email", ""),
        "legal_info_url": full_url(base_url, "/legal"),
    }
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def main() -> None:
    config = load_config()
    brain_dir = business_brain_dir(config)
    llms_txt = generate_llms_txt(config)

    write_file(PUBLIC_DIR / "llms.txt", llms_txt)
    write_file(PUBLIC_DIR / ".well-known" / "llms.txt", llms_txt)

    llms_full = generate_llms_full_txt(config, brain_dir)
    if llms_full:
        write_file(PUBLIC_DIR / "llms-full.txt", llms_full)
        write_file(PUBLIC_DIR / ".well-known" / "llms-full.txt", llms_full)

    write_file(PUBLIC_DIR / "robots.txt", generate_robots_txt(config))
    write_file(PUBLIC_DIR / "sitemap.xml", generate_sitemap_xml(config))
    write_file(SCHEMA_DIR / "organization.jsonld", generate_organization_schema(config))
    write_file(SCHEMA_DIR / "faq.jsonld", generate_faq_schema(config))
    write_file(
        PUBLIC_DIR / ".well-known" / "ai-plugin.json",
        generate_ai_plugin_manifest(config),
    )

    print("Done. Deploy the public/ directory to your website root.")


if __name__ == "__main__":
    main()
