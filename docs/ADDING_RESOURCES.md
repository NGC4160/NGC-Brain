# Adding Service Manuals & Files

Manuals and reference documents are **config-driven**. You can add, edit, or remove entries without changing application code.

## Where to edit

**File:** `src/data/resources.json`

After saving, restart the dev server (or hot-reload will pick it up automatically in most cases).

## Entry format

```json
{
  "id": "unique-slug",
  "title": "Display title",
  "category": "service-manual",
  "description": "Optional short description",
  "url": "https://your-link-or-path",
  "make": "Club Car",
  "model": "Precedent",
  "yearRange": "2015-2020",
  "tags": ["electrical", "battery"],
  "pinned": true
}
```

### Required fields

| Field | Description |
|-------|-------------|
| `id` | Unique slug (lowercase, hyphens) |
| `title` | Shown on cards and search results |
| `category` | One of the category IDs below |
| `url` | Full URL or site-relative path |
| `tags` | Array of search keywords |

### Optional fields

| Field | Description |
|-------|-------------|
| `description` | Longer blurb on the resource card |
| `make` | Brand filter (Club Car, EZGO, Yamaha, …) |
| `model` | Model name |
| `yearRange` | e.g. `"2017-2024"` |
| `pinned` | `true` to show on the dashboard home |

## Categories

Defined in `src/config/app.config.ts` → `resourceCategories`:

| ID | Label |
|----|-------|
| `service-manual` | Service Manuals |
| `wiring-diagram` | Wiring Diagrams |
| `parts-catalog` | Parts Catalogs |
| `vendor-doc` | Vendor Docs |
| `sop` | SOPs & Checklists |
| `warranty` | Warranty Info |

To add a new category, update `resourceCategories` in config and use the new `id` in your JSON entries.

## Link types

- **External URLs** — Google Drive share links, manufacturer sites, vendor PDFs hosted online. Opens in a new tab.
- **Local files** — place files in `public/` and use paths like `/manuals/club-car-precedent.pdf`.

Example for a Drive link:
```json
{
  "id": "club-car-onward-manual",
  "title": "Club Car Onward Manual (Google Drive)",
  "category": "service-manual",
  "url": "https://drive.google.com/file/d/YOUR_FILE_ID/view",
  "make": "Club Car",
  "model": "Onward",
  "tags": ["manual", "drive"],
  "pinned": false
}
```

## Pinning favorites

Set `"pinned": true` on up to 10 resources (configurable via `featureFlags.maxPinnedResources`). Users can also toggle pins from the Manuals & Files page; pin state is saved in localStorage.

## Tips

- Use **tags** generously — they power search (e.g. `"controller"`, `"48v"`, `"brakes"`).
- Include **make/model** when the doc is brand-specific so filters work.
- Keep `id` stable; changing it resets any user pin preferences tied to the old id.
