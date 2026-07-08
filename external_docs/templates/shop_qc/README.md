# NGC Shop QC Completion Form

**PDF:** [NGC_Shop_QC_Form.pdf](NGC_Shop_QC_Form.pdf)  
**Source:** [NGC_Shop_QC_Form.html](NGC_Shop_QC_Form.html)

## Purpose

Technicians complete this form **after every cart** is finished in the shop. It adapts the legacy NGC service-call procedure checklist for in-shop work and matches the **QC / TEST DRIVE** lane in [shop throughput](../../../knowledge/04_operations/shop_throughput.md).

## When to use

1. All authorized repair work is complete
2. Required photos are uploaded to Housecall Pro
3. 7-point safety inspection is done
4. Test drive is complete
5. Cart is ready to move from **QC** → **READY** on the whiteboard

## Required photos

| Set | Count | When |
|-----|------:|------|
| Before-work baseline | **7** | Before starting repair |
| Notable inspection findings | As needed | During diagnosis / 7-point inspection |
| Work performed | As needed | After repairs (before & after on repaired areas) |

## Quick start

1. Open `NGC_Shop_QC_Form.pdf` (or print from the HTML file)
2. Fill out both pages
3. Turn in to the office tray
4. Move the job card to **READY**; Christine notifies the customer

## Regenerate PDF

```bash
python3 scripts/generate_shop_qc_pdf.py
```

Or from HTML via Chrome:

```bash
google-chrome-stable --headless --disable-gpu --no-sandbox --no-pdf-header-footer \
  --print-to-pdf=external_docs/templates/shop_qc/NGC_Shop_QC_Form.pdf \
  file://$PWD/external_docs/templates/shop_qc/NGC_Shop_QC_Form.html
```
