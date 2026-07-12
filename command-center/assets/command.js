const BASE = document.querySelector('meta[name="ngc-base"]')?.content || "./";

let ccData = null;
let activeSection = "overview";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardLinkAttrs(card) {
  const isExternal = card.external || /^https?:\/\//i.test(card.href || "");
  return isExternal ? ' target="_blank" rel="noopener"' : "";
}

function renderCard(card, zoneColor) {
  return `
    <a class="zone-card ${card.primary ? "primary" : ""}" href="${card.href}" style="--zone-color:${zoneColor}"${cardLinkAttrs(card)}>
      <h3>
        ${escapeHtml(card.title)}
        ${card.badge ? `<span class="badge ${card.badge.includes("Sync") ? "warn" : ""}">${escapeHtml(card.badge)}</span>` : ""}
      </h3>
      <p>${escapeHtml(card.desc)}</p>
    </a>`;
}

function updateClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  el.textContent = new Date().toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

async function loadCommandCenter() {
  const res = await fetch(`${BASE}command-center.json`);
  if (!res.ok) throw new Error(`Failed to load command center (${res.status})`);
  return res.json();
}

function renderMetrics(ops) {
  const row = document.getElementById("metrics-row");
  if (!row || !ops?.metrics) return;

  const m = ops.metrics;
  const tiles = [
    { value: m.in_progress, label: "In Progress", cls: m.wip_over > 0 ? "warn" : "" },
    { value: m.active_pipeline, label: "Pipeline", cls: "" },
    { value: m.lithium_at_risk, label: "Li Risk", cls: m.lithium_at_risk > 0 ? "alert" : "" },
    { value: m.stale_15_plus, label: "Stale 15d+", cls: m.stale_15_plus > 0 ? "warn" : "" },
    { value: m.deposit_alerts, label: "Deposits", cls: m.deposit_alerts > 0 ? "warn" : "" },
    { value: m.scheduled, label: "Scheduled", cls: "" },
  ];

  row.innerHTML = tiles
    .map(
      (t) => `
    <div class="metric-compact ${t.cls}">
      <span class="val">${t.value}</span>
      <span class="lbl">${escapeHtml(t.label)}</span>
    </div>`
    )
    .join("");
}

function renderStatusBar(ops) {
  const bar = document.getElementById("status-bar");
  if (!bar) return;

  const syncOk = ops?.sync?.exists !== false && ops?.has_live_data;
  const wipWarn = (ops?.metrics?.wip_over || 0) > 0;

  bar.innerHTML = `
    <span class="status-pill"><span class="status-dot ${syncOk ? "" : "warn"}"></span> HCP</span>
    <span class="status-pill"><span class="status-dot"></span> QBO</span>
    <span class="status-pill"><span class="status-dot ${wipWarn ? "warn" : ""}"></span> WIP ${ops?.metrics?.in_progress ?? "—"}/${ops?.metrics?.wip_target ?? 6}</span>
  `;
}

function pipelineCounts(pipeline) {
  const counts = { P1: 0, P2: 0, P3: 0 };
  pipeline.forEach((p) => {
    if (counts[p.priority] !== undefined) counts[p.priority]++;
  });
  return counts;
}

function renderOverviewPipeline(pipeline) {
  const el = document.getElementById("overview-pipeline");
  if (!el || !pipeline?.length) return;

  const counts = pipelineCounts(pipeline);
  const total = counts.P1 + counts.P2 + counts.P3 || 1;

  el.innerHTML = `
    <div class="pipeline-compact">
      <span class="pipeline-title">Build Pipeline</span>
      <div class="pipeline-bar">
        <span class="p1" style="width:${(counts.P1 / total) * 100}%"></span>
        <span class="p2" style="width:${(counts.P2 / total) * 100}%"></span>
        <span class="p3" style="width:${(counts.P3 / total) * 100}%"></span>
      </div>
      <span class="pipeline-legend"><em>${counts.P1}</em> P1 · <em>${counts.P2}</em> P2 · <em>${counts.P3}</em> P3</span>
    </div>`;
}

function zoneSummary(zone, ops) {
  const primary = zone.cards.find((c) => c.primary) || zone.cards[0];
  const count = zone.cards.length;
  let stat = `${count} links`;

  if (zone.id === "live-ops" && ops?.metrics) {
    stat = `${ops.metrics.in_progress} in shop · ${ops.metrics.lithium_at_risk} Li risk`;
  } else if (zone.id === "pipeline") {
    const c = pipelineCounts(ccData?.pipeline || []);
    stat = `${c.P1} P1 · ${c.P2} P2 · ${c.P3} P3`;
  } else if (zone.id === "apps") {
    stat = `${count} apps`;
  }

  return { primary, stat, count };
}

function renderOverviewGrid(zones, ops) {
  const grid = document.getElementById("overview-grid");
  if (!grid) return;

  grid.innerHTML = zones
    .map((zone) => {
      const { primary, stat } = zoneSummary(zone, ops);
      return `
      <button type="button" class="overview-tile" data-section="${zone.id}" style="--zone-color:${zone.color}">
        <div class="ot-head">
          <span class="ot-icon">${zone.icon}</span>
          <span class="ot-title">${escapeHtml(zone.title)}</span>
        </div>
        <p class="ot-stat">${escapeHtml(stat)}</p>
        <p class="ot-primary">${primary ? escapeHtml(primary.title) : ""}</p>
      </button>`;
    })
    .join("");

  grid.querySelectorAll(".overview-tile").forEach((btn) => {
    btn.addEventListener("click", () => selectSection(btn.dataset.section));
  });
}

function renderNav(zones) {
  const list = document.getElementById("nav-list");
  if (!list) return;

  const items = [
    { id: "overview", icon: "◎", title: "Overview", color: "#00f0ff" },
    ...zones.map((z) => ({ id: z.id, icon: z.icon, title: z.title, color: z.color })),
  ];

  list.innerHTML = items
    .map(
      (item) => `
    <li>
      <button type="button" class="nav-item ${item.id === activeSection ? "active" : ""}" data-section="${item.id}" style="--zone-color:${item.color}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-text">${escapeHtml(item.title)}</span>
      </button>
    </li>`
    )
    .join("");

  list.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => selectSection(btn.dataset.section));
  });
}

function renderSection(zone, pipeline) {
  const header = document.getElementById("section-header");
  const cards = document.getElementById("section-cards");
  if (!header || !cards || !zone) return;

  header.innerHTML = `
    <span class="section-icon" style="color:${zone.color}">${zone.icon}</span>
    <div>
      <h2>${escapeHtml(zone.title)}</h2>
      <p>${escapeHtml(zone.description)}</p>
    </div>`;

  let extra = "";
  if (zone.id === "pipeline" && pipeline?.length) {
    const counts = pipelineCounts(pipeline);
    const total = counts.P1 + counts.P2 + counts.P3 || 1;
    extra = `
      <div class="pipeline-viz">
        <div class="pipeline-bar">
          <span class="p1" style="width:${(counts.P1 / total) * 100}%"></span>
          <span class="p2" style="width:${(counts.P2 / total) * 100}%"></span>
          <span class="p3" style="width:${(counts.P3 / total) * 100}%"></span>
        </div>
        <div class="pipeline-legend">
          <span class="p1"><em>${counts.P1}</em> P1 Now</span>
          <span class="p2"><em>${counts.P2}</em> P2 Month</span>
          <span class="p3"><em>${counts.P3}</em> P3 Quarter</span>
        </div>
      </div>`;
  }

  cards.innerHTML =
    extra +
    zone.cards.map((card) => renderCard(card, zone.color)).join("");
}

function selectSection(sectionId) {
  activeSection = sectionId;

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === sectionId);
  });

  const overview = document.getElementById("overview-view");
  const section = document.getElementById("section-view");
  if (!overview || !section || !ccData) return;

  if (sectionId === "overview") {
    overview.classList.remove("hidden");
    section.classList.add("hidden");
  } else {
    overview.classList.add("hidden");
    section.classList.remove("hidden");
    const zone = ccData.zones.find((z) => z.id === sectionId);
    renderSection(zone, ccData.pipeline);
  }
}

function bindLogout() {
  document.getElementById("logout-btn")?.addEventListener("click", () => window.NGCAuth?.logout());
}

async function initCommandCenter() {
  updateClock();
  setInterval(updateClock, 30000);
  bindLogout();

  const session = window.NGCAuth?.getSession();
  const userEl = document.getElementById("session-user");
  if (userEl && session) userEl.textContent = session.user;

  try {
    ccData = await loadCommandCenter();
    renderMetrics(ccData.ops);
    renderStatusBar(ccData.ops);
    renderNav(ccData.zones);
    renderOverviewGrid(ccData.zones, ccData.ops);
    renderOverviewPipeline(ccData.pipeline);
    selectSection("overview");

    const gen = document.getElementById("generated-at");
    if (gen) gen.textContent = ccData.generated_at?.slice(0, 10) || "—";
  } catch (err) {
    const grid = document.getElementById("overview-grid");
    if (grid) grid.innerHTML = `<p style="color:var(--red)">${escapeHtml(err.message)}</p>`;
  }
}

window.onAuthSuccess = initCommandCenter;

document.addEventListener("DOMContentLoaded", () => {
  if (window.NGCAuth?.isAuthed()) initCommandCenter();
});
