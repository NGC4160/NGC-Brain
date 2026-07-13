/** Shared markdown document loader & renderer for NGC Command Center */
const NGCDoc = (() => {
  const BASE = () => document.querySelector('meta[name="ngc-base"]')?.content || "./";

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseDocPath(href) {
    if (!href) return null;
    if (href.includes("view.html?path=")) {
      try {
        return new URL(href, window.location.href).searchParams.get("path");
      } catch {
        return null;
      }
    }
    if (href.endsWith(".md") || href.endsWith(".mdc")) return href;
    return null;
  }

  function resolveDocPath(fromPath, href) {
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || /^https?:\/\//i.test(href)) {
      return null;
    }
    if (href.startsWith("view.html")) return href;

    const [pathPart, hash] = href.split("#");
    const path = pathPart.split("?")[0];
    if (!path.endsWith(".md") && !path.endsWith(".mdc")) return null;

    const fromDir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/") + 1) : "";
    const parts = (fromDir + path).split("/");
    const resolved = [];
    for (const part of parts) {
      if (!part || part === ".") continue;
      if (part === "..") {
        if (resolved.length) resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    const target = `view.html?path=${resolved.join("/")}`;
    return hash ? `${target}#${hash}` : target;
  }

  function enhanceRenderedMarkdown(html, docPath) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      const resolved = resolveDocPath(docPath, href);
      if (resolved) {
        const path = parseDocPath(resolved);
        a.setAttribute("href", "#");
        a.dataset.docPath = path;
        a.classList.add("doc-inline-link");
        return;
      }
      if (href && /github\.com\/[^/]+\/[^/]+\/blob\//.test(href)) {
        const match = href.match(/\/blob\/[^/]+\/(.+?)(?:#|$)/);
        if (match && (match[1].endsWith(".md") || match[1].endsWith(".mdc"))) {
          a.setAttribute("href", "#");
          a.dataset.docPath = decodeURIComponent(match[1]);
          a.classList.add("doc-inline-link");
        }
      }
    });
    return doc.body.innerHTML;
  }

  async function loadManifest() {
    const res = await fetch(`${BASE()}deliverables.json`);
    if (!res.ok) throw new Error(`Failed to load manifest (${res.status})`);
    return res.json();
  }

  async function fetchDocument(path, manifest) {
    const urls = [];
    if (path.startsWith("live/")) {
      urls.push(`${BASE()}${path}`);
    } else {
      urls.push(`${BASE()}content/${path}`);
      if (manifest) {
        urls.push(`https://raw.githubusercontent.com/${manifest.repo}/${manifest.branch}/${path}`);
      }
    }
    let lastError = null;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.text();
        lastError = new Error(`HTTP ${res.status}`);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error(`Could not load ${path}`);
  }

  function titleForPath(path, manifest) {
    let title = path.split("/").pop().replace(/\.mdc?$/, "").replace(/_/g, " ");
    if (!manifest) return title;
    for (const section of manifest.sections) {
      const match = section.items.find((i) => i.path === path);
      if (match?.title) return match.title;
    }
    return title;
  }

  async function renderInto(path, titleEl, contentEl, manifest) {
    if (!path || !contentEl) return;
    const title = titleForPath(path, manifest);
    if (titleEl) titleEl.textContent = title;

    contentEl.innerHTML = `<div class="doc-loading"><div class="doc-spinner"></div><p>Loading ${escapeHtml(title)}…</p></div>`;

    try {
      const text = await fetchDocument(path, manifest);
      if (path.endsWith(".json")) {
        contentEl.innerHTML = `<pre class="doc-code"><code>${escapeHtml(JSON.stringify(JSON.parse(text), null, 2))}</code></pre>`;
        return;
      }
      if (typeof marked !== "undefined") {
        const html = marked.parse(text, { gfm: true, breaks: false });
        contentEl.innerHTML = `<div class="doc-prose">${enhanceRenderedMarkdown(html, path)}</div>`;
      } else {
        contentEl.innerHTML = `<pre class="doc-code">${escapeHtml(text)}</pre>`;
      }
    } catch (err) {
      contentEl.innerHTML = `<div class="doc-error"><p>Could not load this document.</p><p class="doc-error-detail">${escapeHtml(err.message)}</p></div>`;
    }
  }

  function bindInlineLinks(container, onOpen) {
    container?.querySelectorAll(".doc-inline-link[data-doc-path]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        onOpen(a.dataset.docPath);
      });
    });
  }

  return {
    BASE,
    escapeHtml,
    parseDocPath,
    loadManifest,
    fetchDocument,
    titleForPath,
    renderInto,
    bindInlineLinks,
  };
})();

window.NGCDoc = NGCDoc;
