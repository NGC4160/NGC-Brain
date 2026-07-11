#!/usr/bin/env bash
# Publish pages/projects/ to the gh-pages branch under /projects/
# without replacing the ops dashboard at site root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/pages/projects"
REMOTE="${REMOTE:-origin}"
BRANCH="gh-pages"
WORKTREE="${WORKTREE:-/tmp/ngc-gh-pages-publish}"

if [[ ! -d "$SRC" ]]; then
  echo "Missing $SRC" >&2
  exit 1
fi

cd "$ROOT"
git fetch "$REMOTE" "$BRANCH"

if git worktree list | grep -q "$WORKTREE"; then
  git worktree remove --force "$WORKTREE" 2>/dev/null || true
fi
rm -rf "$WORKTREE"
git worktree add -B "$BRANCH" "$WORKTREE" "$REMOTE/$BRANCH"

rm -rf "$WORKTREE/projects"
mkdir -p "$WORKTREE/projects"
cp -a "$SRC"/. "$WORKTREE/projects/"

cd "$WORKTREE"
git add projects
if git diff --cached --quiet; then
  echo "No project page changes to publish."
else
  git commit -m "Publish per-project GitHub Pages under /projects/"
  git push "$REMOTE" "$BRANCH"
  echo "Published: https://ngc4160.github.io/NGC-Brain/projects/"
fi

cd "$ROOT"
git worktree remove "$WORKTREE"
