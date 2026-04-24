const http = require('http');
const fs = require('fs');
const path = require('path');

let matter, marked;
try {
  matter = require('gray-matter');
  const m = require('marked');
  marked = m.marked || m;
} catch {
  console.error('Missing dependencies. Run: npm install');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const TYPE_CONFIG = {
  books:      { label: 'Book',      emoji: '📚', color: '#4f46e5' },
  articles:   { label: 'Article',   emoji: '📰', color: '#0891b2' },
  papers:    { label: 'Paper',     emoji: '📄', color: '#be123c' },
  podcasts:   { label: 'Podcast',   emoji: '🎙️', color: '#7c3aed' },
  audiobooks: { label: 'Audiobook', emoji: '🎧', color: '#059669' },
  other:      { label: 'Other',     emoji: '📌', color: '#d97706' },
};

// ── Data ──────────────────────────────────────────────────────────────────────

function getAllEntries() {
  const entries = [];
  for (const [type, config] of Object.entries(TYPE_CONFIG)) {
    const dir = path.join(ROOT, 'entries', type);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
      try {
        const fp = path.join(dir, file);
        const raw = fs.readFileSync(fp, 'utf-8');
        const { data, content: body } = matter(raw);
        const mtime = fs.statSync(fp).mtimeMs;
        entries.push({ ...data, body, filename: file, type_folder: type, config, _mtime: mtime });
      } catch {}
    }
  }
  return entries.sort((a, b) => {
    const dateDiff = new Date(b.date_added || 0) - new Date(a.date_added || 0);
    return dateDiff !== 0 ? dateDiff : (b._mtime || 0) - (a._mtime || 0);
  });
}

function findEntryHref(nameWithoutExt) {
  for (const type of Object.keys(TYPE_CONFIG)) {
    const fp = path.join(ROOT, 'entries', type, nameWithoutExt + '.md');
    if (fs.existsSync(fp)) return `/entry/${type}/${nameWithoutExt}.md`;
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '';
  try {
    const d = str instanceof Date ? str : new Date(str + 'T12:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return String(str); }
}

function safeHostname(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

function lastNotesDate(body) {
  const matches = [...body.matchAll(/\*(\d{4}-\d{2}-\d{2})\*/g)];
  return matches.length ? matches[matches.length - 1][1] : null;
}

// Convert [[filename]] wiki-links to real <a> tags
function processWikiLinks(body) {
  return body.replace(/\[\[([^\]]+)\]\]/g, (_, name) => {
    const href = findEntryHref(name);
    return href ? `[${name}](${href})` : name;
  });
}

// Strip the repeated header block (# Title … ---) that's already shown in the hero
function stripBodyHeader(body) {
  return body.replace(/^[\s\S]*?\n---\n/, '\n');
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f7f6f2;
  color: #1c1917;
  min-height: 100vh;
  line-height: 1.6;
}
a { color: inherit; text-decoration: none; }

/* ── Header ── */
.site-header {
  background: #fff;
  border-bottom: 1.5px solid #e7e5e4;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.site-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  height: 60px;
}
.site-logo { font-size: 1.1rem; font-weight: 800; white-space: nowrap; letter-spacing: -0.02em; }
.site-logo span { color: #4f46e5; }
.search-wrap { flex: 1; max-width: 380px; }
.search-input {
  width: 100%;
  padding: 0.45rem 1rem;
  border: 1.5px solid #e7e5e4;
  border-radius: 8px;
  font-size: 0.88rem;
  background: #fafaf9;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}
.search-input:focus { border-color: #4f46e5; background: #fff; }
.entry-count { font-size: 0.82rem; color: #a8a29e; white-space: nowrap; margin-left: auto; }

/* ── Page wrapper ── */
.page { max-width: 1200px; margin: 0 auto; padding: 2rem; }

/* ── Filter bar ── */
.filter-bar {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.75rem;
}
.filter-label { font-size: 0.78rem; font-weight: 600; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 0.15rem; }
.filter-btn {
  padding: 0.28rem 0.85rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  border: 1.5px solid #e7e5e4;
  background: #fff;
  color: #57534e;
  transition: all 0.15s;
}
.filter-btn:hover { border-color: #4f46e5; color: #4f46e5; }
.filter-btn.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
.filter-sep { width: 1px; height: 20px; background: #e7e5e4; margin: 0 0.2rem; align-self: center; }
.tag-select {
  padding: 0.28rem 0.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  border: 1.5px solid #e7e5e4;
  background: #fff;
  color: #57534e;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}
.tag-select:focus { border-color: #4f46e5; }

/* ── Cards grid ── */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 1.1rem;
}

/* ── Card ── */
.card {
  background: #fff;
  border-radius: 12px;
  border: 1.5px solid #e7e5e4;
  padding: 1.2rem 1.35rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: box-shadow 0.15s, border-color 0.15s, transform 0.15s;
  cursor: pointer;
}
.card:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.09); border-color: #c7c0bb; transform: translateY(-2px); }
.card-top { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.73rem;
  font-weight: 600;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.card-date { font-size: 0.76rem; color: #a8a29e; white-space: nowrap; }
.card-title { font-size: 1rem; font-weight: 700; color: #1c1917; line-height: 1.3; }
.card-title a:hover { color: #4f46e5; }
.card-author { font-size: 0.82rem; color: #78716c; }
.card-preview { font-size: 0.83rem; color: #57534e; line-height: 1.55; flex: 1; }
.card-footer { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.15rem; }
.tag {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
.pdf-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: #fee2e2;
  color: #be123c;
  border: 1px solid #fca5a5;
}
.pdf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #be123c;
  border: 1.5px solid #fca5a5;
  background: #fff5f5;
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  margin-top: 0.75rem;
  width: 100%;
  transition: background 0.15s, border-color 0.15s;
}
.pdf-btn:hover { background: #fee2e2; border-color: #be123c; }
.img-btn { color: #0369a1; border-color: #7dd3fc; background: #f0f9ff; }
.img-btn:hover { background: #e0f2fe; border-color: #0369a1; }

/* ── Empty state ── */
.empty-state { text-align: center; padding: 4rem 2rem; color: #78716c; grid-column: 1/-1; }
.empty-state h3 { font-size: 1.1rem; margin-bottom: 0.5rem; color: #44403c; }
.empty-state p { font-size: 0.88rem; }
.empty-state code { background: #f5f4f0; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }

/* ── Entry detail ── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #78716c;
  margin-bottom: 1.5rem;
  transition: color 0.15s;
  padding: 0.3rem 0;
}
.back-link:hover { color: #4f46e5; }

.entry-detail { display: flex; gap: 1.5rem; align-items: flex-start; }

.entry-hero {
  background: #fff;
  border-radius: 14px;
  border: 1.5px solid #e7e5e4;
  padding: 1.75rem 2rem;
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
}
.entry-type-row { margin-bottom: 0.85rem; }
.entry-title { font-size: 1.45rem; font-weight: 800; line-height: 1.25; margin-bottom: 0.35rem; letter-spacing: -0.02em; }
.entry-author { font-size: 0.9rem; color: #78716c; margin-bottom: 1.1rem; font-style: italic; }

.meta-grid { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem 0; border-top: 1.5px solid #f5f4f0; border-bottom: 1.5px solid #f5f4f0; margin-bottom: 1rem; }
.meta-item { display: flex; flex-direction: column; gap: 0.1rem; }
.meta-label { font-size: 0.68rem; font-weight: 700; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.07em; }
.meta-value { font-size: 0.88rem; font-weight: 500; color: #292524; }
.meta-value a { color: #4f46e5; }
.meta-value a:hover { text-decoration: underline; }

.entry-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }

.entry-body {
  background: #fff;
  border-radius: 14px;
  border: 1.5px solid #e7e5e4;
  padding: 1.75rem 2.25rem;
  flex: 1;
  min-width: 0;
}
.entry-body h1, .entry-body h2, .entry-body h3 { margin-top: 1.6rem; margin-bottom: 0.6rem; line-height: 1.3; }
.entry-body h1:first-child, .entry-body h2:first-child, .entry-body h3:first-child { margin-top: 0; }
.entry-body h1 { font-size: 1.3rem; font-weight: 800; }
.entry-body h2 {
  font-size: 1rem;
  font-weight: 700;
  color: #1c1917;
  border-bottom: 1.5px solid #f5f4f0;
  padding-bottom: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.78rem;
}
.entry-body h3 { font-size: 0.95rem; font-weight: 600; }
.entry-body p { margin-bottom: 0.85rem; color: #44403c; line-height: 1.75; font-size: 0.95rem; }
.entry-body ul, .entry-body ol { padding-left: 1.4rem; margin-bottom: 0.85rem; }
.entry-body li { margin-bottom: 0.35rem; color: #44403c; line-height: 1.65; font-size: 0.95rem; }
.entry-body blockquote {
  border-left: 3px solid #4f46e5;
  padding: 0.65rem 1.1rem;
  margin: 1.1rem 0;
  background: #f5f3ff;
  border-radius: 0 8px 8px 0;
  color: #3730a3;
  font-style: italic;
}
.entry-body blockquote p { color: inherit; margin: 0; font-size: 0.95rem; }
.entry-body hr { border: none; border-top: 1.5px solid #f5f4f0; margin: 1.5rem 0; }
.entry-body a { color: #4f46e5; }
.entry-body a:hover { text-decoration: underline; }

/* Hide repeated title/meta block that's already in the sidebar */
.entry-body > h1:first-child { display: none; }

/* ── Section headers ── */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.cards-grid + .section-header { margin-top: 2.75rem; }
.section-title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #78716c;
  white-space: nowrap;
}
.section-count {
  font-size: 0.7rem;
  font-weight: 600;
  background: #f5f4f0;
  color: #78716c;
  padding: 0.13rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #e7e5e4;
}
.section-divider { flex: 1; height: 1px; background: #e7e5e4; }
.section-completed .section-title { color: #059669; }
.section-completed .section-count { background: #f0fdf4; color: #059669; border-color: #bbf7d0; }
.section-waiting .section-title { color: #0369a1; }
.section-waiting .section-count { background: #f0f9ff; color: #0369a1; border-color: #7dd3fc; }

/* ── Category hero ── */
.category-hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
  background: #fff;
  border-radius: 12px;
  border: 1.5px solid #e7e5e4;
  border-left: 4px solid var(--accent, #4f46e5);
  margin-bottom: 1.75rem;
}
.category-hero-emoji { font-size: 1.75rem; line-height: 1; }
.category-hero-title { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em; color: #1c1917; }
.category-hero-sub { font-size: 0.82rem; color: #78716c; margin-top: 0.15rem; }

/* ── Responsive ── */
@media (max-width: 780px) {
  .entry-detail { flex-direction: column; }
  .entry-hero { width: 100%; position: static; }
  .entry-body { padding: 1.35rem; }
}
@media (max-width: 580px) {
  .page { padding: 1rem; }
  .site-header-inner { gap: 0.75rem; }
  .entry-count { display: none; }
}
`;

// ── HTML renderers ─────────────────────────────────────────────────────────────

function renderIndexPage(entries, filterType, filterTag, filterTag2, search) {
  const allTags = [...new Set(entries.flatMap(e => e.tags || []))].sort();

  let filtered = entries;
  if (filterType !== 'all') filtered = filtered.filter(e => e.type_folder === filterType);
  if (filterTag)  filtered = filtered.filter(e => (e.tags || []).includes(filterTag));
  if (filterTag2) filtered = filtered.filter(e => (e.tags || []).includes(filterTag2));
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.author || '').toLowerCase().includes(q) ||
      (e.tags || []).some(t => t.includes(q))
    );
  }

  const typeButtons = [
    { key: 'all', label: 'All' },
    ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label + 's' })),
  ].map(b => `<button class="filter-btn ${filterType === b.key ? 'active' : ''}" onclick="setType('${b.key}')">${b.label}</button>`).join('');

  const tagOptions  = allTags.map(t => `<option value="${t}"${filterTag  === t ? ' selected' : ''}>${t}</option>`).join('');
  const tag2Options = allTags.map(t => `<option value="${t}"${filterTag2 === t ? ' selected' : ''}>${t}</option>`).join('');

  const waiting    = filtered.filter(e => e.status === 'waiting');
  const inProgress = filtered.filter(e => !e.date_ended && e.status !== 'waiting');
  const completed  = filtered.filter(e =>  e.date_ended);

  const makeCard = (e, isCompleted) => {
    const cfg = e.config || TYPE_CONFIG.other;
    const lastDate = lastNotesDate(e.body) || e.date_added;
    const displayDate = isCompleted ? e.date_ended : (e.date_started || e.date_added);
    const tags = (e.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
    return `<div class="card" onclick="location.href='/entry/${e.type_folder}/${e.filename}'">
      <div class="card-top">
        <span class="type-badge">${cfg.emoji} ${cfg.label}</span>
        <div style="display:flex;gap:0.35rem;align-items:center;">
          ${e.pdf_path ? '<span class="pdf-badge">PDF</span>' : ''}
          <span class="card-date" style="${isCompleted ? 'color:#059669;' : ''}">${isCompleted ? '✓ ' : ''}${formatDate(displayDate)}</span>
        </div>
      </div>
      <div class="card-title"><a href="/entry/${e.type_folder}/${e.filename}">${e.title || 'Untitled'}</a></div>
      ${e.author ? `<div class="card-author">${e.author}</div>` : ''}
      ${lastDate ? `<div class="card-preview" style="font-size:0.78rem;color:#a8a29e;">Last updated: ${formatDate(lastDate)}</div>` : ''}
      ${tags ? `<div class="card-footer">${tags}</div>` : ''}
    </div>`;
  };

  const makeSection = (title, entries, mode) => {
    if (!entries.length) return '';
    const isCompleted = mode === 'completed';
    const isWaiting   = mode === 'waiting';
    const prefix = isCompleted ? '✓ ' : isWaiting ? '◦ ' : '';
    const cls    = isCompleted ? ' section-completed' : isWaiting ? ' section-waiting' : '';
    return `<div class="section-header${cls}">
      <span class="section-title">${prefix}${title}</span>
      <span class="section-count">${entries.length}</span>
      <div class="section-divider"></div>
    </div>
    <div class="cards-grid">${entries.map(e => makeCard(e, isCompleted)).join('')}</div>`;
  };

  const categoryHero = filterType !== 'all' ? (() => {
    const cfg = TYPE_CONFIG[filterType];
    return `<div class="category-hero" style="--accent:${cfg.color}">
      <span class="category-hero-emoji">${cfg.emoji}</span>
      <div>
        <div class="category-hero-title">${cfg.label}s</div>
        <div class="category-hero-sub">${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}</div>
      </div>
    </div>`;
  })() : '';

  const mainContent = filtered.length === 0
    ? `<div class="cards-grid"><div class="empty-state">
        <h3>No entries found</h3>
        <p>Try a different filter, or add your first entry with <code>/add</code> in Claude Code.</p>
       </div></div>`
    : makeSection('In Progress', inProgress, 'progress') + makeSection('Waiting List', waiting, 'waiting') + makeSection('Completed', completed, 'completed');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Knowledge Base</title>
  <style>${CSS}</style>
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <div class="site-logo">Knowledge <span>Base</span></div>
      <div class="search-wrap">
        <input class="search-input" type="search" placeholder="Search titles, authors, tags…"
          value="${search.replace(/"/g, '&quot;')}" oninput="doSearch(this.value)">
      </div>
      <div class="entry-count">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</div>
    </div>
  </header>
  <div class="page">
    <div class="filter-bar">
      <span class="filter-label">Type</span>
      ${typeButtons}
      <div class="filter-sep"></div>
      <span class="filter-label">Theme</span>
      <select class="tag-select" onchange="setTag(this.value)">
        <option value="">All</option>
        ${tagOptions}
      </select>
      <div class="filter-sep"></div>
      <span class="filter-label">Topic</span>
      <select class="tag-select" onchange="setTag2(this.value)">
        <option value="">All</option>
        ${tag2Options}
      </select>
    </div>
    ${categoryHero}${mainContent}
  </div>
  <script>
    const p = new URLSearchParams(location.search);
    function setType(t) { p.set('type', t); p.delete('tag'); p.delete('tag2'); p.delete('q'); location.search = p; }
    function setTag(t)  { t ? p.set('tag',  t) : p.delete('tag');  location.search = p; }
    function setTag2(t) { t ? p.set('tag2', t) : p.delete('tag2'); location.search = p; }
    let timer;
    function doSearch(q) {
      clearTimeout(timer);
      timer = setTimeout(() => { q ? p.set('q', q) : p.delete('q'); location.search = p; }, 400);
    }
  </script>
</body>
</html>`;
}

function renderEntryPage(entry) {
  const cfg = entry.config || TYPE_CONFIG.other;

  let body = processWikiLinks(entry.body || '');
  body = stripBodyHeader(body);
  const html = marked(body);

  const tags = (entry.tags || []).map(t =>
    `<a href="/?tag=${encodeURIComponent(t)}" class="tag">${t}</a>`
  ).join('');

  const metaItems = [
    { label: 'Author',     value: entry.author },
    { label: 'Type',       value: `${cfg.emoji} ${cfg.label}` },
    { label: 'Published',  value: formatDate(entry.date_published) },
    { label: 'Started',    value: formatDate(entry.date_started) },
    { label: 'Finished',   value: formatDate(entry.date_ended) },
    entry.isbn ? { label: 'ISBN',   value: entry.isbn } : null,
    entry.url  ? { label: 'Source', value: `<a href="${entry.url}" target="_blank" rel="noopener">${safeHostname(entry.url)}</a>` } : null,
  ].filter(Boolean).filter(m => m.value);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${entry.title || 'Entry'} — Knowledge Base</title>
  <style>${CSS}</style>
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="site-logo" href="/" style="text-decoration:none;color:inherit;">Knowledge <span>Base</span></a>
    </div>
  </header>
  <div class="page">
    <a class="back-link" href="/">← All Entries</a>
    <div class="entry-detail">
      <aside class="entry-hero">
        <div class="entry-type-row"><span class="type-badge">${cfg.emoji} ${cfg.label}</span></div>
        <h1 class="entry-title">${entry.title || 'Untitled'}</h1>
        ${entry.author ? `<div class="entry-author">by ${entry.author}</div>` : ''}
        <div class="meta-grid">
          ${metaItems.map(m => `<div class="meta-item">
            <span class="meta-label">${m.label}</span>
            <span class="meta-value">${m.value}</span>
          </div>`).join('')}
        </div>
        ${tags ? `<div class="entry-tags">${tags}</div>` : ''}
        ${entry.pdf_path ? `<a class="pdf-btn" href="${entry.type_folder === 'books' ? '/book-pdfs/' : '/pdfs/'}${encodeURIComponent(entry.pdf_path)}" target="_blank" rel="noopener">📄 Open PDF</a>` : ''}
        ${(entry.note_images || []).map(img => `<a class="pdf-btn img-btn" href="/notes/${encodeURIComponent(img)}" target="_blank" rel="noopener">🖼 ${img}</a>`).join('')}
      </aside>
      <div class="entry-body">${html}</div>
    </div>
  </div>
</body>
</html>`;
}

// ── Router ────────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname, searchParams } = url;

  if (pathname === '/' || pathname === '/index.html') {
    const entries = getAllEntries();
    const html = renderIndexPage(
      entries,
      searchParams.get('type') || 'all',
      searchParams.get('tag')  || '',
      searchParams.get('tag2') || '',
      searchParams.get('q')   || ''
    );
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  const m = pathname.match(/^\/entry\/([^/]+)\/([^/]+\.md)$/);
  if (m) {
    const [, type, filename] = m;
    const fp = path.join(ROOT, 'entries', type, filename);
    if (fs.existsSync(fp)) {
      const { data, content: body } = matter(fs.readFileSync(fp, 'utf-8'));
      const entry = { ...data, body, filename, type_folder: type, config: TYPE_CONFIG[type] };
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderEntryPage(entry));
    }
    res.writeHead(404); return res.end('Entry not found');
  }

  const pdfM = pathname.match(/^\/pdfs\/([^/]+\.pdf)$/i);
  if (pdfM) {
    const fname = path.basename(pdfM[1]);
    const fp = path.join(ROOT, 'papers_scientific', fname);
    if (fs.existsSync(fp)) {
      res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${fname}"` });
      return res.end(fs.readFileSync(fp));
    }
    res.writeHead(404); return res.end('PDF not found');
  }

  const bookPdfM = pathname.match(/^\/book-pdfs\/([^/]+\.pdf)$/i);
  if (bookPdfM) {
    const fname = path.basename(decodeURIComponent(bookPdfM[1]));
    const fp = path.join(ROOT, 'books', fname);
    if (fs.existsSync(fp)) {
      res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${fname}"` });
      return res.end(fs.readFileSync(fp));
    }
    res.writeHead(404); return res.end('PDF not found');
  }

  const noteM = pathname.match(/^\/notes\/([^/]+)$/i);
  if (noteM) {
    const fname = path.basename(noteM[1]);
    const fp = path.join(ROOT, 'notes_handwritten', fname);
    if (fs.existsSync(fp)) {
      const ext = path.extname(fname).toLowerCase();
      const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      return res.end(fs.readFileSync(fp));
    }
    res.writeHead(404); return res.end('Image not found');
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\nKnowledge Base → http://localhost:${PORT}\n`);
});
