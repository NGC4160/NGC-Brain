const BASE = document.querySelector('meta[name="ngc-base"]')?.content || "./";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function updateClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleString("en-US", {
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
    { value: m.active_pipeline, label: "Active Pipeline", cls: "" },
    { value: m.lithium_at_risk, label: "Li At Risk", cls: m.lithium_at_risk > 0 ? "alert" : "" },
    { value: m.stale_15_plus, label: "Stale 15+ Days", cls: m.stale_15_plus > 0 ? "warn" : "" },
    { value: m.deposit_alerts, label: "Deposit Alerts", cls: m.deposit_alerts > 0 ? "warn" : "" },
    { value: m.scheduled, label: "Scheduled", cls: "" },
  ];

  row.innerHTML = tiles
    .map(
      (t) => `
    <div class="metric-tile">
      <div class="value ${t.cls}">${t.value}</div>
      <div class="label">${escapeHtml(t.label)}</div>
    </div>`
    )
    .join("");
}

function renderStatusBar(ops, systems) {
  const bar = document.getElementById("status-bar");
  if (!bar) return;

  const syncOk = ops?.sync?.exists !== false && ops?.has_live_data;
  const wipWarn = (ops?.metrics?.wip_over || 0) > 0;

  bar.innerHTML = `
    <span class="status-pill"><span class="status-dot ${syncOk ? "" : "warn"}"></span> HCP ${syncOk ? "Synced" : "Stale"}</span>
    <span class="status-pill"><span class="status-dot"></span> QBO Online</span>
    <span class="status-pill"><span class="status-dot ${wipWarn ? "warn" : ""}"></span> WIP ${ops?.metrics?.in_progress ?? "—"}/${ops?.metrics?.wip_target ?? 6}</span>
    <span class="status-pill"><span class="status-dot ${(ops?.metrics?.lithium_at_risk || 0) > 0 ? "alert" : ""}"></span> Li Risk ${ops?.metrics?.lithium_at_risk ?? 0}</span>
  `;
}

function renderPipelineBar(pipeline) {
  const counts = { P1: 0, P2: 0, P3: 0 };
  pipeline.forEach((p) => {
    if (counts[p.priority] !== undefined) counts[p.priority]++;
  });
  const total = counts.P1 + counts.P2 + counts.P3 || 1;

  const bar = document.getElementById("pipeline-bar");
  const legend = document.getElementById("pipeline-legend");
  if (bar) {
    bar.innerHTML = `
      <span class="p1" style="width:${(counts.P1 / total) * 100}%"></span>
      <span class="p2" style="width:${(counts.P2 / total) * 100}%"></span>
      <span class="p3" style="width:${(counts.P3 / total) * 100}%"></span>
    `;
  }
  if (legend) {
    legend.innerHTML = `
      <span class="p1"><em>${counts.P1}</em> P1 Now</span>
      <span class="p2"><em>${counts.P2}</em> P2 Month</span>
      <span class="p3"><em>${counts.P3}</em> P3 Quarter</span>
    `;
  }
}

function renderZones(zones, pipeline) {
  const container = document.getElementById("zones");
  if (!container) return;

  container.innerHTML = zones
    .map((zone) => {
      const pipelineBlock =
        zone.id === "pipeline"
          ? `
        <div class="pipeline-viz">
          <div class="pipeline-bar" id="pipeline-bar"></div>
          <div class="pipeline-legend" id="pipeline-legend"></div>
        </div>`
          : "";

      return `
      <section class="zone" style="--zone-color: ${zone.color}">
        <div class="zone-header">
          <span class="zone-icon">${zone.icon}</span>
          <div>
            <h2>${escapeHtml(zone.title)}</h2>
            <p>${escapeHtml(zone.description)}</p>
          </div>
        </div>
        <div class="zone-cards">
          ${zone.cards
            .map(
              (card) => {
                const isExternal = card.external || /^https?:\/\//i.test(card.href || "");
                return `
            <a class="zone-card ${card.primary ? "primary" : ""}" href="${card.href}" ${isExternal ? 'target="_blank" rel="noopener"' : ""}>
              <h3>
                ${escapeHtml(card.title)}
                ${card.badge ? `<span class="badge ${card.badge.includes("Sync") ? "warn" : ""}">${escapeHtml(card.badge)}</span>` : ""}
              </h3>
              <p>${escapeHtml(card.desc)}</p>
            </a>`;
              }
            )
            .join("")}
        </div>
        ${pipelineBlock}
      </section>`;
    })
    .join("");

  if (pipeline?.length) renderPipelineBar(pipeline);
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
    const data = await loadCommandCenter();
    renderMetrics(data.ops);
    renderStatusBar(data.ops, data.systems);
    renderZones(data.zones, data.pipeline);

    const gen = document.getElementById("generated-at");
    if (gen) gen.textContent = data.generated_at?.slice(0, 16).replace("T", " ") + " UTC";
  } catch (err) {
    const zones = document.getElementById("zones");
    if (zones) zones.innerHTML = `<p style="color:var(--red)">${escapeHtml(err.message)}</p>`;
  }
}

window.onAuthSuccess = initCommandCenter;

document.addEventListener("DOMContentLoaded", () => {
  if (window.NGCAuth?.isAuthed()) initCommandCenter();
});
