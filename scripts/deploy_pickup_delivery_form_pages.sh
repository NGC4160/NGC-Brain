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

if git worktree list | grep -q "$WORKTREE"; then
  git -C "$WORKTREE" checkout gh-pages
  git -C "$WORKTREE" pull origin gh-pages
elif [[ -d "$WORKTREE" ]]; then
  rm -rf "$WORKTREE"
  git worktree add "$WORKTREE" gh-pages
else
  git worktree add "$WORKTREE" gh-pages
fi

mkdir -p "$WORKTREE/docs"
cp "$SRC" "$WORKTREE/$DEST_REL"

cd "$WORKTREE"
git add "$DEST_REL"
if git diff --cached --quiet; then
  echo "No changes to publish."
else
  git commit -m "Update pickup/delivery visual inspection form on GitHub Pages"
  git push origin gh-pages
  echo "Published: https://ngc4160.github.io/NGC-Brain/docs/pickup-delivery-inspection.html"
fi
