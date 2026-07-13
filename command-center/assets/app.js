const BASE = document.querySelector('meta[name="ngc-base"]')?.content || './';

async function loadManifest() {
  return NGCDoc.loadManifest();
}

function escapeHtml(str) {
  return NGCDoc.escapeHtml(str);
}

function renderTags(tags = []) {
  if (!tags.length) return '';
  return tags
    .slice(0, 3)
    .map((t) => `<span class="badge">${escapeHtml(t)}</span>`)
    .join('');
}

function primaryAction(item) {
  if (item.type === 'markdown') {
    const path = item.path || NGCDoc.parseDocPath(item.view);
    return `<button type="button" class="btn-primary doc-read-btn" data-doc="${escapeHtml(path)}">Read</button>`;
  }
  if (item.type === 'html') {
    return `<a class="btn-primary" href="${BASE}${item.view}">Open</a>`;
  }
  return `<a class="btn-primary" href="${item.github}" target="_blank" rel="noopener">GitHub</a>`;
}

function renderItem(item) {
  const secondary =
    item.type === 'markdown' || item.type === 'html'
      ? `<a class="btn-secondary" href="${item.github}" target="_blank" rel="noopener">Source</a>`
      : `<a class="btn-secondary" href="${item.github}" target="_blank" rel="noopener">GitHub</a>`;

  return `
    <article class="item-card" data-title="${escapeHtml(item.title.toLowerCase())}" data-desc="${escapeHtml((item.description || '').toLowerCase())}" data-tags="${escapeHtml((item.tags || []).join(' ').toLowerCase())}">
      <h3>${escapeHtml(item.title)} ${renderTags(item.tags)}</h3>
      <p>${escapeHtml(item.description || '')}</p>
      <div class="item-actions">
        ${primaryAction(item)}
        ${secondary}
      </div>
    </article>
  `;
}

function renderSections(manifest) {
  const main = document.getElementById('sections');
  if (!main) return;

  main.innerHTML = manifest.sections
    .map(
      (section) => `
      <section id="${section.id}">
        <div class="section-head">
          <span class="section-icon" aria-hidden="true">${section.icon}</span>
          <h2>${escapeHtml(section.title)}</h2>
        </div>
        <p class="section-desc">${escapeHtml(section.description || '')}</p>
        <div class="item-grid">
          ${section.items.map(renderItem).join('')}
        </div>
      </section>
    `
    )
    .join('');

  const nav = document.getElementById('nav-sections');
  if (nav) {
    nav.innerHTML = manifest.sections
      .map(
        (s) =>
          `<li><a href="#${s.id}">${s.icon} ${escapeHtml(s.title)} <small>(${s.items.length})</small></a></li>`
      )
      .join('');
  }

  const stats = document.getElementById('stats');
  if (stats) {
    stats.textContent = `${manifest.total_items} deliverables · Updated ${manifest.generated_at.slice(0, 10)}`;
  }

  main.querySelectorAll('.doc-read-btn[data-doc]').forEach((btn) => {
    btn.addEventListener('click', () => openExploreDoc(btn.dataset.doc));
  });

  setupSearch();
  setupNavHighlight();
}

async function openExploreDoc(path) {
  let overlay = document.getElementById('explore-doc-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'explore-doc-overlay';
    overlay.className = 'doc-view';
    overlay.innerHTML = `
      <div class="doc-toolbar">
        <button type="button" class="doc-back" id="explore-doc-back">← Back</button>
        <h2 id="explore-doc-title">Document</h2>
      </div>
      <div class="doc-body" id="explore-doc-content"></div>`;
    document.body.appendChild(overlay);
    document.getElementById('explore-doc-back').addEventListener('click', () => overlay.classList.add('hidden'));
  }
  overlay.classList.remove('hidden');
  const manifest = await loadManifest();
  await NGCDoc.renderInto(path, document.getElementById('explore-doc-title'), document.getElementById('explore-doc-content'), manifest);
  NGCDoc.bindInlineLinks(document.getElementById('explore-doc-content'), openExploreDoc);
}

function setupSearch() {
  const input = document.getElementById('search');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll('.item-card').forEach((card) => {
      const hay = `${card.dataset.title} ${card.dataset.desc} ${card.dataset.tags}`;
      card.classList.toggle('hidden', q.length > 0 && !hay.includes(q));
    });
    document.querySelectorAll('#sections > section').forEach((section) => {
      const visible = section.querySelectorAll('.item-card:not(.hidden)').length;
      section.classList.toggle('hidden', q.length > 0 && visible === 0);
    });
  });
}

function setupNavHighlight() {
  const links = document.querySelectorAll('.nav-sections a');
  const sections = [...document.querySelectorAll('#sections > section')];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
  );
  sections.forEach((s) => observer.observe(s));
}

async function initHub() {
  try {
    const manifest = await loadManifest();
    renderSections(manifest);
  } catch (err) {
    const main = document.getElementById('sections');
    if (main) main.innerHTML = `<p style="color:var(--red)">${escapeHtml(err.message)}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page === 'viewer') return;
  if (!document.getElementById('login-gate')) initHub();
});

window.initHub = initHub;
