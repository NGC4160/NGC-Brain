const BASE = document.querySelector('meta[name="ngc-base"]')?.content || "./";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAlertList(items, emptyMsg) {
  if (!items?.length) return `<li style="color:var(--muted)">${escapeHtml(emptyMsg)}</li>`;
  return items
    .map(
      (r) => `
    <li>
      <span class="inv">#${escapeHtml(r.invoice)}</span>
      · ${escapeHtml(r.description)}
      · <span class="days">${r.days}d</span>
      ${r.lithium ? '<span class="badge warn">Li</span>' : ""}
    </li>`
    )
    .join("");
}

function renderSyncPanel(sync) {
  if (!sync?.exists && !sync?.pricebook) {
    return `<p style="color:var(--muted)">Run <code>./scripts/sync/run_ingest.sh</code> to populate sync data.</p>`;
  }

  const pb = sync.pricebook || {};
  const items = [
    { label: "Pricebook", value: pb.exists ? `${pb.total_items || "?"} items` : "Missing", ok: pb.exists },
    { label: "Legacy flags", value: pb.legacy_item_count ?? "—", ok: (pb.legacy_item_count || 0) === 0 },
    { label: "Lithium SKUs", value: (pb.lithium_professional_skus || []).length, ok: true },
    { label: "QBO P&L", value: sync.qbo_pl?.exists ? "Fresh" : "Missing", ok: sync.qbo_pl?.exists },
  ];

  return `<div class="sync-grid">${items
    .map(
      (i) => `
    <div class="sync-item">
      <strong>${escapeHtml(i.label)}</strong>
      <span style="color:${i.ok ? "var(--green)" : "var(--amber)"}">${escapeHtml(String(i.value))}</span>
    </div>`
    )
    .join("")}</div>`;
}

async function initDashboard() {
  document.getElementById("logout-btn")?.addEventListener("click", () => window.NGCAuth?.logout());

  try {
    const res = await fetch(`${BASE}live/ops.json`);
    const ops = await res.json();
    const m = ops.metrics || {};

    const wipEl = document.getElementById("wip-gauge");
    if (wipEl) {
      const over = m.wip_over > 0;
      wipEl.innerHTML = `
        <div class="wip-ring ${over ? "over" : ""}">
          <span class="num">${m.in_progress ?? 0}</span>
          <span class="cap">/ ${m.wip_target ?? 6} target</span>
        </div>`;
    }

    document.getElementById("metric-scheduled").textContent = m.scheduled ?? 0;
    document.getElementById("metric-needs-sched").textContent = m.needs_scheduling ?? 0;
    document.getElementById("metric-deposits").textContent = m.deposit_alerts ?? 0;

    const liList = document.getElementById("lithium-alerts");
    if (liList) liList.innerHTML = renderAlertList(ops.alerts?.lithium_at_risk, "No lithium jobs over 3 days ✓");

    const staleList = document.getElementById("stale-alerts");
    if (staleList) staleList.innerHTML = renderAlertList(ops.alerts?.stale_wip, "No stale WIP ✓");

    const syncPanel = document.getElementById("sync-panel");
    if (syncPanel) syncPanel.innerHTML = renderSyncPanel(ops.sync);

    const synced = document.getElementById("jobs-synced");
    if (synced) {
      synced.textContent = ops.jobs_synced_at
        ? `HCP jobs synced: ${ops.jobs_synced_at.slice(0, 16).replace("T", " ")} UTC`
        : ops.has_live_data
          ? "Live HCP data loaded"
          : "No HCP jobs export — run ./scripts/sync/run_hcp_sync.sh";
    }

    const links = ops.live_files || {};
    const linkHtml = [
      links.shop_board && `<a href="view.html?path=live/shop_board.md">Shop Board →</a>`,
      links.deposit_alerts && `<a href="view.html?path=live/deposit_alerts.md">Deposit Alerts →</a>`,
      links.sync_manifest && `<a href="view.html?path=live/sync_manifest.json">Sync Manifest →</a>`,
    ]
      .filter(Boolean)
      .join(" · ");

    const liveLinks = document.getElementById("live-links");
    if (liveLinks) liveLinks.innerHTML = linkHtml || "Generate live data with HCP sync.";
  } catch (err) {
    document.getElementById("dashboard-error").textContent = err.message;
  }
}

window.onAuthSuccess = initDashboard;

document.addEventListener("DOMContentLoaded", () => {
  if (window.NGCAuth?.isAuthed()) initDashboard();
});
