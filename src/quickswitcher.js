// Bookmark Matrix — Quick Switcher
// v1.4.0 — instant search any bookmark from any tab via Ctrl+Shift+B

(function () {
  'use strict';

  const input = document.getElementById('qs-input');
  const results = document.getElementById('qs-results');
  const empty = document.getElementById('qs-empty');
  const hint = document.getElementById('qs-hint');

  let allBookmarks = [];
  let activeIdx = 0;
  let renderedList = [];
  let userOverride = new Set();  // user-added tags/notes/star (from chrome.storage)

  // ----- data loading -----

  async function loadBookmarks() {
    // 1. Load raw Edge bookmarks
    const tree = await chrome.bookmarks.getRecent(10000);
    const flat = flattenTree(tree);

    // 2. Load user overrides (tags/notes/star)
    const data = await chrome.storage.local.get(['bookmark_meta', 'bookmark_order']);
    userOverride = new Set(Object.keys(data.bookmark_meta || {}));

    // 3. Merge
    return flat.map(b => ({
      ...b,
      meta: (data.bookmark_meta || {})[b.id] || {}
    }));
  }

  function flattenTree(nodes) {
    const out = [];
    function walk(arr) {
      for (const n of arr) {
        if (n.url) out.push(n);
        if (n.children) walk(n.children);
      }
    }
    walk(nodes);
    return out;
  }

  // ----- search algorithm -----

  function scoreBookmark(b, query) {
    const q = query.toLowerCase().trim();
    if (!q) return 0;

    const title = (b.title || '').toLowerCase();
    const url = (b.url || '').toLowerCase();
    const domain = extractDomain(b.url || '').toLowerCase();
    const meta = b.meta || {};
    const tags = (meta.tags || []).join(' ').toLowerCase();
    const notes = (meta.notes || '').toLowerCase();

    let score = 0;

    // Exact title match — top
    if (title === q) score += 1000;
    // Title starts with query — very high
    else if (title.startsWith(q)) score += 500;
    // Title contains query
    else if (title.includes(q)) score += 200;

    // URL / domain contains
    if (url.includes(q)) score += 100;
    if (domain === q) score += 150;
    if (domain.includes(q)) score += 50;

    // Tags / notes
    if (tags && tags.includes(q)) score += 80;
    if (notes && notes.includes(q)) score += 40;

    // Fuzzy subsequence (every char in q appears in title in order)
    if (score === 0 && fuzzyMatch(title, q)) score += 30;
    if (score === 0 && fuzzyMatch(domain, q)) score += 20;

    // Star boost
    if (meta.starred) score += 5;

    return score;
  }

  function extractDomain(url) {
    try { return new URL(url).hostname; } catch (_) { return ''; }
  }

  function fuzzyMatch(text, q) {
    let i = 0;
    for (const c of text) {
      if (c === q[i]) i++;
      if (i === q.length) return true;
    }
    return i === q.length;
  }

  function search(query, books) {
    if (!query.trim()) return [];
    const list = books || allBookmarks;
    const scored = [];
    for (const b of list) {
      const s = scoreBookmark(b, query);
      if (s > 0) scored.push({ b, s });
    }
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, 50).map(x => x.b);
  }

  // ----- rendering -----

  function render(list) {
    renderedList = list;
    activeIdx = 0;
    if (list.length === 0) {
      results.innerHTML = '<div class="qs-empty">No bookmarks match.</div>';
      return;
    }
    const html = list.map((b, i) => {
      const title = highlight(b.title || extractDomain(b.url) || '(no title)', input.value);
      const url = highlight(b.url || '', input.value);
      const cat = b.meta.category || '';
      const star = b.meta.starred ? '<span class="qs-item-star">★</span>' : '';
      const letter = (b.title || b.url || '?').charAt(0).toUpperCase();
      return `
        <div class="qs-item${i === 0 ? ' active' : ''}" data-idx="${i}">
          <div class="qs-item-favicon">${escapeHtml(letter)}</div>
          <div class="qs-item-content">
            <div class="qs-item-title">${title}${star}</div>
            <div class="qs-item-url">${url}</div>
          </div>
          ${cat ? `<span class="qs-item-cat">${escapeHtml(cat)}</span>` : ''}
        </div>
      `;
    }).join('');
    results.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query.trim()) return safe;
    const q = query.trim();
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return safe.replace(re, '<span class="qs-mark">$1</span>');
  }

  // ----- keyboard -----

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { window.close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      openActive(e.ctrlKey || e.metaKey);
    }
  });

  function moveActive(delta) {
    if (renderedList.length === 0) return;
    const items = results.querySelectorAll('.qs-item');
    if (items.length === 0) return;
    activeIdx = (activeIdx + delta + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
    items[activeIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function openActive(inBackground) {
    if (renderedList.length === 0) return;
    const b = renderedList[activeIdx];
    if (!b || !b.url) return;
    chrome.tabs.create({ url: b.url, active: !inBackground });
    window.close();
  }

  // ----- mouse -----

  results.addEventListener('click', (e) => {
    const item = e.target.closest('.qs-item');
    if (!item) return;
    activeIdx = parseInt(item.dataset.idx, 10);
    openActive(e.ctrlKey || e.metaKey);
  });

  results.addEventListener('mousemove', (e) => {
    const item = e.target.closest('.qs-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx, 10);
    if (idx !== activeIdx) {
      activeIdx = idx;
      results.querySelectorAll('.qs-item').forEach((el, i) => {
        el.classList.toggle('active', i === activeIdx);
      });
    }
  });

  // ----- input -----

  let lastQuery = '';
  input.addEventListener('input', () => {
    const q = input.value;
    if (q === lastQuery) return;
    lastQuery = q;
    if (!q.trim()) {
      results.innerHTML = '<div class="qs-empty">Start typing to search your bookmarks...</div>';
      renderedList = [];
      return;
    }
    const matches = search(q);
    render(matches);
  });

  // ----- init -----

  loadBookmarks().then(books => {
    allBookmarks = books;
    input.focus();
  });

  // ----- exports for testing (Node test environment) -----
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      scoreBookmark,
      fuzzyMatch,
      extractDomain,
      search,
      highlight,
      flattenTree
    };
  }
})();
