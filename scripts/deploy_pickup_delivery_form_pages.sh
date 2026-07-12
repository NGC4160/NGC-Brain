#!/usr/bin/env bash
# Publish pickup/delivery inspection form to GitHub Pages (gh-pages branch).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/external_docs/templates/pickup_delivery/NGC_Cart_Pickup_Delivery_Visual_Inspection_Form.html"
DEST_REL="docs/pickup-delivery-inspection.html"
WORKTREE="/tmp/gh-pages-pickup-form"

if [[ ! -f "$SRC" ]]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

git fetch origin gh-pages

if [[ -d "$WORKTREE/.git" ]]; then
  git -C "$WORKTREE" checkout gh-pages
  git -C "$WORKTREE" pull origin gh-pages
else
  git worktree add "$WORKTREE" gh-pages
fi

cp "$SRC" "$WORKTREE/$DEST_REL"

# Re-apply GitHub Pages screen wrapper if missing
if ! grep -q 'class="toolbar"' "$WORKTREE/$DEST_REL"; then
  python3 - "$WORKTREE/$DEST_REL" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
html = path.read_text()

if 'viewport' not in html:
    html = html.replace(
        '<meta charset="UTF-8" />',
        '<meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        1,
    )

screen_css = """
    @media screen {
      body { background: #e8edf2; padding: 1rem 0 2rem; }
      .toolbar {
        max-width: 8.5in; margin: 0 auto 1rem; padding: 0 1rem;
        display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;
        justify-content: space-between; font-family: "Segoe UI", system-ui, sans-serif; font-size: 14px;
      }
      .toolbar a, .toolbar button {
        color: #1a4d7a; text-decoration: none; background: #fff; border: 1px solid #b8c9d9;
        border-radius: 8px; padding: 0.45rem 0.85rem; cursor: pointer; font-size: 14px;
      }
      .toolbar button { background: #1a4d7a; color: #fff; border-color: #1a4d7a; font-weight: 600; }
      .toolbar .hint { color: #64748b; font-size: 13px; }
      .pages-wrap {
        max-width: 8.5in; margin: 0 auto; padding: 0 1rem;
        display: flex; flex-direction: column; gap: 1.5rem;
      }
      .page {
        background: #fff; box-shadow: 0 4px 24px rgba(26, 77, 122, 0.12);
        border-radius: 6px; padding: 0.35in 0.38in; min-height: 11in;
      }
    }
    @media print {
      .toolbar { display: none !important; }
      body { background: #fff; padding: 0; }
      .pages-wrap { padding: 0; gap: 0; }
      .page { box-shadow: none; border-radius: 0; padding: 0; }
    }
"""

toolbar = """
  <div class="toolbar">
    <div>
      <a href="/NGC-Brain/">← NGC Dashboard</a>
      <a href="/NGC-Brain/docs/intake-checklist.html">Intake Checklist</a>
    </div>
    <span class="hint">Page 1: Pickup · Page 2: Drop-off</span>
    <button type="button" onclick="window.print()">Print Form</button>
  </div>
  <div class="pages-wrap">
"""

if '@media screen' not in html:
    html = html.replace('  </style>\n</head>', screen_css + '  </style>\n</head>', 1)

if 'class="toolbar"' not in html:
    html = html.replace('<body>\n', '<body>\n' + toolbar, 1)
    html = html.replace('</body>', '  </div>\n</body>', 1)

path.write_text(html)
PY
fi

cd "$WORKTREE"
git add "$DEST_REL"
if git diff --cached --quiet; then
  echo "No changes to publish."
else
  git commit -m "Update pickup/delivery visual inspection form on GitHub Pages"
  git push origin gh-pages
  echo "Published: https://ngc4160.github.io/NGC-Brain/docs/pickup-delivery-inspection.html"
fi
