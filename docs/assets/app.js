const BASE = document.querySelector('meta[name="ngc-base"]')?.content || '';

async function loadManifest() {
  const res = await fetch(`${BASE}deliverables.json`);
  if (!res.ok) throw new Error(`Failed to load manifest (${res.status})`);
  return res.json();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTags(tags = []) {
  if (!tags.length) return '';
  return tags
    .slice(0, 3)
    .map((t) => {
      const cls = t === 'interactive' ? 'tag tag-interactive' : 'tag';
      return `<span class="${cls}">${escapeHtml(t)}</span>`;
    })
    .join('');
}

function primaryAction(item) {
  if (item.type === 'markdown') {
    return `<a class="btn btn-primary" href="${BASE}${item.view}">Read</a>`;
  }
  if (item.type === 'html') {
    return `<a class="btn btn-primary" href="${BASE}${item.view}">Open</a>`;
  }
  return `<a class="btn btn-primary" href="${item.github}" target="_blank" rel="noopener">View on GitHub</a>`;
}

function renderItem(item) {
  const secondary =
    item.type === 'markdown'
      ? `<a class="btn btn-secondary" href="${item.github}" target="_blank" rel="noopener">GitHub</a>`
      : item.type !== 'html'
        ? `<a class="btn btn-secondary" href="${item.github}" target="_blank" rel="noopener">GitHub</a>`
        : `<a class="btn btn-secondary" href="${item.github}" target="_blank" rel="noopener">Source</a>`;

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

  const generated = document.getElementById('generated-at');
  if (generated) {
    generated.textContent = manifest.generated_at.slice(0, 10);
  }

  setupSearch();
  setupNavHighlight();
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
    if (main) {
      main.innerHTML = `<div class="viewer-error"><p>Could not load deliverables: ${escapeHtml(err.message)}</p></div>`;
    }
  }
}

async function initViewer() {
  const params = new URLSearchParams(window.location.search);
  const path = params.get('path');
  const titleEl = document.getElementById('doc-title');
  const pathEl = document.getElementById('doc-path');
  const contentEl = document.getElementById('markdown-content');

  if (!path || !contentEl) return;

  titleEl.textContent = path.split('/').pop();
  pathEl.textContent = path;

  try {
    let fetchUrl = `${BASE}${path}`;
    let title = path.split('/').pop();

    if (!path.startsWith('live/')) {
      const manifest = await loadManifest();
      fetchUrl = `https://raw.githubusercontent.com/${manifest.repo}/${manifest.branch}/${path}`;
      for (const section of manifest.sections) {
        const match = section.items.find((i) => i.path === path);
        if (match?.raw) {
          fetchUrl = match.raw;
          if (match.title) title = match.title;
          break;
        }
      }
    }

    titleEl.textContent = title;
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    if (path.endsWith('.json')) {
      contentEl.innerHTML = `<pre><code>${escapeHtml(JSON.stringify(JSON.parse(text), null, 2))}</code></pre>`;
    } else if (typeof marked !== 'undefined') {
      contentEl.innerHTML = marked.parse(text, { gfm: true, breaks: false });
    } else {
      contentEl.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
    }
  } catch (err) {
    contentEl.innerHTML = `<div class="viewer-error"><p>Failed to load document: ${escapeHtml(err.message)}</p><p><a href="${BASE}index.html">Back to Command Center</a></p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page === 'viewer') return;
  if (!document.getElementById('login-gate')) initHub();
});

window.initHub = initHub;
window.initViewer = initViewer;
