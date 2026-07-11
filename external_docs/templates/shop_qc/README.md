# NGC Shop QC Completion Form

**Interactive app:** [NGC_Shop_QC_App.html](NGC_Shop_QC_App.html) — photos, videos, and save  
**Print PDF:** [NGC_Shop_QC_Form.pdf](NGC_Shop_QC_Form.pdf)  
**Print-only HTML:** [NGC_Shop_QC_Form.html](NGC_Shop_QC_Form.html)

## Purpose

Technicians complete this form **after every cart** is finished in the shop. The interactive app lets techs upload unlimited photos and videos, then saves one file per job in the **`QC forms`** folder named `{job #}_{customer last name}.zip`.

## Start the app (shop computer)

```bash
pip install -r scripts/requirements-shop-qc.txt
python3 scripts/shop_qc_server.py
```

Open **http://127.0.0.1:8765** in Chrome or Edge.

## Save workflow

1. Enter **HCP invoice / job #** and **customer last name** (required for file naming)
2. Complete the checklist and upload photos/videos (no limit)
3. Click **Save QC Form**
4. One file is created: `QC forms/{job#}_{LastName}.zip` containing:
   - `form.json` — full form data
   - `summary.txt` — quick summary
   - `media/` — all uploaded photos and videos
5. Turn in printed copy or confirm save with Ryan/Christine; move whiteboard card to **READY**

If the same job # and last name are saved twice, a timestamp is appended to the filename (e.g. `12345_Smith_20260711T181600Z.zip`) to avoid overwriting.

## When to use

1. All authorized repair work is complete
2. Required photos are uploaded to Housecall Pro **and** attached in this app for local archive
3. 7-point safety inspection is done
4. Test drive is complete
5. Cart is ready to move from **QC** → **READY** on the whiteboard

## Required photos

| Set | Count | When |
|-----|------:|------|
| Before-work baseline | **7** | Before starting repair |
| Notable inspection findings | As needed | During diagnosis / 7-point inspection |
| Work performed | As needed | After repairs (before & after on repaired areas) |

Use the upload section for **as many additional photos and videos as needed** — test drive clips, fault codes, lithium install, etc.

## Regenerate print PDF

```bash
python3 scripts/generate_shop_qc_pdf.py
```

## Privacy

Completed saves live in `QC forms/` and are **gitignored** — they contain customer last names and job media. Do not commit them to the repo.
