# NGC GitHub Pages projects

Source for **per-project** open links on GitHub Pages.

## URL rule

Every openable project gets its **own** link:

`https://ngc4160.github.io/NGC-Brain/projects/<slug>/`

Hub: `https://ngc4160.github.io/NGC-Brain/projects/`

## Publish

```bash
./scripts/pages/publish_projects.sh
```

Copies `pages/projects/` → `gh-pages` branch at `/projects/` (does not wipe the ops dashboard).

## Add a project

1. Create `pages/projects/<slug>/index.html` (and assets if needed)
2. Add it to `pages/projects/index.html` and `projects.json`
3. Run `./scripts/pages/publish_projects.sh`
4. Update `knowledge/06_systems/github_pages_projects.md`
5. Give Ryan the new `/projects/<slug>/` URL
