// popup.js — 主控制器 (集成: 搜索/分类/标签/备注/收藏/统计/导入导出/全屏)
// Author: Xingyu Wei

(function () {
  'use strict';

  // ===== State =====
  const state = {
    bookmarks: [],
    overrides: {},
    meta: {},
    viewMode: 'category',
    activeFilter: null,
    activeTag: null,
    searchQuery: '',
    theme: 'dark',        // 'dark' | 'light' | 'auto'
    themeId: 'midnight',  // 主题预设 id
    contextBookmark: null,
  };

  // ===== DOM =====
  const $ = (id) => document.getElementById(id);
  const dom = {
    search: $('search'),
    clearSearch: $('clear-search'),
    viewMode: $('view-mode'),
    openNewtab: $('open-newtab'),
    themeToggle: $('theme-toggle'),
    refresh: $('refresh'),
    statsBtn: $('stats-btn'),
    ioBtn: $('io-btn'),
    statusText: $('status-text'),
    filterInfo: $('filter-info'),
    chips: $('category-chips'),
    tagChips: $('tag-chips'),
    main: $('main'),
    loading: $('loading'),
    empty: $('empty'),
    content: $('content'),
    ctxMenu: $('context-menu'),
    ctxCategories: $('ctx-categories'),
    toast: $('toast'),
    modal: $('modal'),
    modalTitle: $('modal-title'),
    modalBody: $('modal-body'),
    modalSave: $('modal-save'),
    statsModal: $('stats-modal'),
    statsBody: $('stats-body'),
    ioModal: $('io-modal'),
    exportBtn: $('export-btn'),
    importBtn: $('import-btn'),
    importReplaceBtn: $('import-replace-btn'),
    importFile: $('import-file'),
    importResult: $('import-result'),
    healthBtn: $('health-btn'),
    reviewBtn: $('review-btn'),
    healthModal: $('health-modal'),
    healthProgress: $('health-progress'),
    healthActions: $('health-actions'),
    healthSummary: $('health-summary'),
    reviewModal: $('review-modal'),
    reviewBody: $('review-body'),
    themesBtn: $('themes-btn'),
    themesModal: $('themes-modal'),
    themeGrid: $('theme-grid'),
    themeModeDark: $('theme-mode-dark'),
    themeModeLight: $('theme-mode-light'),
    themeModeAuto: $('theme-mode-auto'),
  };

  // ===== Init =====
  init().catch(err => {
    console.error(err);
    showToast('初始化失败: ' + err.message, 'error');
  });

  async function init() {
    const stored = await chrome.storage.local.get(['theme', 'themeId', 'viewMode', 'overrides']);
    state.theme = stored.theme || 'dark';
    state.themeId = stored.themeId || 'midnight';
    state.viewMode = stored.viewMode || 'category';
    state.overrides = stored.overrides || {};
    applyAppearance();
    dom.viewMode.value = state.viewMode;

    bindEvents();
    await loadAndRender();
  }

  function bindEvents() {
    dom.search.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      dom.clearSearch.classList.toggle('hidden', !state.searchQuery);
      render();
    });

    dom.clearSearch.addEventListener('click', () => {
      dom.search.value = '';
      state.searchQuery = '';
      dom.clearSearch.classList.add('hidden');
      render();
    });

    dom.viewMode.addEventListener('change', (e) => {
      state.viewMode = e.target.value;
      state.activeFilter = null;
      state.activeTag = null;
      chrome.storage.local.set({ viewMode: state.viewMode });
      render();
    });

    dom.openNewtab.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
    });

    dom.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyAppearance();
      chrome.storage.local.set({ theme: state.theme });
    });

    // 主题预设
    dom.themesBtn.addEventListener('click', openThemesModal);
    document.querySelectorAll('[data-themes-close]').forEach(el => el.addEventListener('click', () => dom.themesModal.classList.add('hidden')));
    dom.themesModal.addEventListener('click', (e) => { if (e.target === dom.themesModal) dom.themesModal.classList.add('hidden'); });
    dom.themeModeDark.addEventListener('click', () => setAppearance('dark'));
    dom.themeModeLight.addEventListener('click', () => setAppearance('light'));
    dom.themeModeAuto.addEventListener('click', () => setAppearance('auto'));

    dom.refresh.addEventListener('click', () => loadAndRender());
    dom.statsBtn.addEventListener('click', () => showStatsModal());
    dom.ioBtn.addEventListener('click', () => showIOModal());
    dom.healthBtn.addEventListener('click', () => openHealthModal());
    dom.reviewBtn.addEventListener('click', () => openReviewModal());

    document.addEventListener('click', (e) => {
      if (!dom.ctxMenu.contains(e.target) && !e.target.closest('.card') && !e.target.closest('.flat-item')) {
        dom.ctxMenu.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        dom.search.focus();
        dom.search.select();
      }
      if (e.key === 'Escape') {
        if (!dom.ctxMenu.classList.contains('hidden')) {
          dom.ctxMenu.classList.add('hidden');
        } else if (!dom.modal.classList.contains('hidden')) {
          closeModal();
        } else if (!dom.statsModal.classList.contains('hidden')) {
          dom.statsModal.classList.add('hidden');
        } else if (!dom.ioModal.classList.contains('hidden')) {
          dom.ioModal.classList.add('hidden');
        } else if (state.searchQuery) {
          dom.search.value = '';
          state.searchQuery = '';
          dom.clearSearch.classList.add('hidden');
          render();
        }
      }
    });

    dom.ctxMenu.addEventListener('click', handleContextAction);

    document.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', closeModal));
    document.querySelectorAll('[data-stats-close]').forEach(el => el.addEventListener('click', () => dom.statsModal.classList.add('hidden')));
    document.querySelectorAll('[data-io-close]').forEach(el => el.addEventListener('click', () => dom.ioModal.classList.add('hidden')));
    dom.modal.addEventListener('click', (e) => { if (e.target === dom.modal) closeModal(); });
    dom.statsModal.addEventListener('click', (e) => { if (e.target === dom.statsModal) dom.statsModal.classList.add('hidden'); });
    dom.ioModal.addEventListener('click', (e) => { if (e.target === dom.ioModal) dom.ioModal.classList.add('hidden'); });

    dom.exportBtn.addEventListener('click', async () => {
      try {
        await BookmarkIO.downloadJson();
        showToast('已下载备份', 'success');
      } catch (err) {
        showToast('导出失败: ' + err.message, 'error');
      }
    });

    dom.importBtn.addEventListener('click', () => {
      dom.importFile.dataset.mode = 'merge';
      dom.importFile.click();
    });
    dom.importReplaceBtn.addEventListener('click', () => {
      if (confirm('覆盖导入将完全替换当前数据，无法撤销。继续？')) {
        dom.importFile.dataset.mode = 'replace';
        dom.importFile.click();
      }
    });
    dom.importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const mode = e.target.dataset.mode || 'merge';
      try {
        const result = await BookmarkIO.importAll(file, mode);
        dom.importResult.className = 'io-result success';
        dom.importResult.innerHTML = `<b>导入成功 (${result.mode})</b><br>` +
          Object.keys(result.stats).map(k => `${k}: ${result.stats[k]}`).join(' · ');
        showToast('导入完成', 'success');
        await loadAndRender();
      } catch (err) {
        dom.importResult.className = 'io-result error';
        dom.importResult.textContent = '导入失败: ' + err.message;
        showToast('导入失败: ' + err.message, 'error');
      }
      dom.importFile.value = '';
    });
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    dom.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // 解析 appearance (dark/light/auto → 实际 dark/light)
  function resolveAppearance() {
    if (state.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.theme;
  }

  // 应用外观 + 主题预设
  function applyAppearance() {
    const mode = resolveAppearance();
    document.body.dataset.theme = mode;
    dom.themeToggle.textContent = mode === 'dark' ? '☀️' : '🌙';
    // 应用主题预设 (覆盖 CSS 变量)
    const t = BookmarkThemes.applyTheme(state.themeId, mode);
    BookmarkThemes.syncCategoryColors(state.themeId, mode);
  }

  function setAppearance(value) {
    state.theme = value;
    applyAppearance();
    chrome.storage.local.set({ theme: state.theme });
  }

  function setThemeId(id) {
    state.themeId = id;
    applyAppearance();
    chrome.storage.local.set({ themeId: state.themeId });
  }

  // 主题选择模态
  function openThemesModal() {
    dom.themesModal.classList.remove('hidden');
    const list = BookmarkThemes.getThemeList();
    dom.themeGrid.innerHTML = list.map(t => `
      <div class="theme-card${t.id === state.themeId ? ' active' : ''}" data-theme="${t.id}">
        <div class="theme-swatch" style="--swatch-dark: ${BookmarkThemes.getTheme(t.id).vars.dark['--bg']}; --swatch-light: ${BookmarkThemes.getTheme(t.id).vars.light ? BookmarkThemes.getTheme(t.id).vars.light['--bg'] : '#fff'};"></div>
        <div class="theme-card-info">
          <div class="theme-card-name">${t.emoji} ${t.name}</div>
          <div class="theme-card-desc">${t.desc}</div>
        </div>
      </div>
    `).join('');
    dom.themeGrid.querySelectorAll('.theme-card').forEach(el => {
      el.addEventListener('click', () => {
        setThemeId(el.getAttribute('data-theme'));
        openThemesModal(); // 重新打开刷新 active
      });
    });
    // 高亮当前 mode
    [dom.themeModeDark, dom.themeModeLight, dom.themeModeAuto].forEach(b => b.classList.remove('btn-primary'));
    [dom.themeModeDark, dom.themeModeLight, dom.themeModeAuto].forEach(b => b.classList.add('btn-secondary'));
    const modeBtn = state.theme === 'dark' ? dom.themeModeDark : state.theme === 'light' ? dom.themeModeLight : dom.themeModeAuto;
    modeBtn.classList.remove('btn-secondary');
    modeBtn.classList.add('btn-primary');
  }

  // ===== Load =====
  async function loadAndRender() {
    dom.loading.classList.remove('hidden');
    dom.content.innerHTML = '';
    dom.empty.classList.add('hidden');

    try {
      const tree = await chrome.bookmarks.getTree();
      const flat = flattenBookmarks(tree);
      state.meta = await BookmarkMeta.getAll();
      const classified = BookmarkClassifier.classifyAll(flat, state.overrides);
      state.bookmarks = classified.map(b => BookmarkMeta.applyMeta(b, state.meta[b.id]));
      dom.loading.classList.add('hidden');
      render();
    } catch (err) {
      dom.loading.classList.add('hidden');
      dom.empty.classList.remove('hidden');
      showToast('读取书签失败: ' + err.message, 'error');
    }
  }

  function flattenBookmarks(trees) {
    const out = [];
    function walk(node, parents) {
      if (node.url) {
        out.push({
          id: node.id, title: node.title || node.url, url: node.url,
          dateAdded: node.dateAdded, parents: parents.slice(), parentId: node.parentId,
        });
      } else {
        const newParents = parents.concat(node.title || '');
        if (node.children) node.children.forEach(child => walk(child, newParents));
      }
    }
    trees.forEach(t => walk(t, []));
    return out;
  }

  // ===== Render =====
  function render() {
    if (state.bookmarks.length === 0) {
      dom.empty.classList.remove('hidden');
      dom.content.innerHTML = '';
      dom.chips.classList.add('hidden');
      dom.tagChips.classList.add('hidden');
      dom.statusText.textContent = '无书签';
      return;
    }

    const filtered = filterBookmarks();
    updateStatus(filtered);
    renderChips(filtered);
    renderTagChips(filtered);
    renderContent(filtered);
  }

  function filterBookmarks() {
    let list = state.bookmarks;
    if (state.viewMode === 'uncategorized') {
      list = list.filter(b => b.category === 'other');
    }
    if (state.activeFilter === '__starred') {
      list = list.filter(b => b.starred);
    } else if (state.activeFilter) {
      list = list.filter(b => b.category === state.activeFilter);
    }
    if (state.activeTag) {
      list = list.filter(b => (b.tags || []).includes(state.activeTag));
    }
    if (state.searchQuery) {
      const q = state.searchQuery;
      list = list.filter(b => {
        return (b.title || '').toLowerCase().includes(q) ||
               (b.url || '').toLowerCase().includes(q) ||
               extractHost(b.url).includes(q) ||
               (b.note || '').toLowerCase().includes(q) ||
               (b.tags || []).some(t => t.toLowerCase().includes(q));
      });
    }
    return list;
  }

  function updateStatus(filtered) {
    const total = state.bookmarks.length;
    if (filtered.length === total) {
      dom.statusText.textContent = `共 ${total} 条书签`;
      dom.filterInfo.textContent = '';
    } else {
      dom.statusText.textContent = `共 ${total} 条`;
      dom.filterInfo.textContent = `显示 ${filtered.length}`;
    }
  }

  function renderChips(filtered) {
    if (state.viewMode !== 'category' || state.searchQuery) {
      dom.chips.classList.add('hidden');
      return;
    }
    const counts = {};
    filtered.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
    const starredCount = filtered.filter(b => b.starred).length;

    const html = [];
    if (starredCount > 0) {
      html.push(`<span class="chip${state.activeFilter === '__starred' ? ' active' : ''}" data-cat="__starred" style="--chip-color: #F59E0B"><span>★ 收藏</span><span class="chip-count">${starredCount}</span></span>`);
    }
    html.push(`<span class="chip${!state.activeFilter ? ' active' : ''}" data-cat="">全部</span>`);

    const order = Object.keys(BookmarkClassifier.CATEGORIES);
    const keys = order.filter(k => counts[k]).sort((a, b) => {
      if (a === 'other') return 1;
      if (b === 'other') return -1;
      return counts[b] - counts[a];
    });
    keys.forEach(k => {
      const c = BookmarkClassifier.CATEGORIES[k];
      html.push(
        `<span class="chip${state.activeFilter === k ? ' active' : ''}" data-cat="${k}" style="--chip-color: ${c.color}">` +
        `<span>${c.emoji} ${escapeHtml(c.name)}</span>` +
        `<span class="chip-count">${counts[k]}</span></span>`
      );
    });

    dom.chips.innerHTML = html.join('');
    dom.chips.classList.remove('hidden');
    dom.chips.querySelectorAll('.chip').forEach(el => {
      el.addEventListener('click', () => {
        const cat = el.getAttribute('data-cat') || null;
        state.activeFilter = cat;
        render();
      });
    });
  }

  function renderTagChips(filtered) {
    const tagCounts = {};
    filtered.forEach(b => {
      (b.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });
    const tags = Object.keys(tagCounts).sort();
    if (tags.length === 0) {
      dom.tagChips.classList.add('hidden');
      return;
    }
    const html = [`<span class="tag-chip${!state.activeTag ? ' active' : ''}" data-tag="">全部</span>`];
    tags.slice(0, 30).forEach(t => {
      html.push(`<span class="tag-chip${state.activeTag === t ? ' active' : ''}" data-tag="${escapeAttr(t)}"># ${escapeHtml(t)} <small>${tagCounts[t]}</small></span>`);
    });
    if (tags.length > 30) {
      html.push(`<span class="tag-chip" style="opacity:0.5;">+ ${tags.length - 30} 更多…</span>`);
    }
    dom.tagChips.innerHTML = html.join('');
    dom.tagChips.classList.remove('hidden');
    dom.tagChips.querySelectorAll('.tag-chip').forEach(el => {
      el.addEventListener('click', () => {
        const t = el.getAttribute('data-tag');
        state.activeTag = t || null;
        render();
      });
    });
  }

  function renderContent(filtered) {
    if (filtered.length === 0) {
      dom.content.innerHTML = '';
      dom.empty.classList.remove('hidden');
      dom.empty.querySelector('.empty-title').textContent = state.searchQuery || state.activeTag ? '没有匹配的书签' : '此分类下没有书签';
      dom.empty.querySelector('.empty-desc').textContent = state.searchQuery || state.activeTag ? '试试其他关键词或清空筛选' : '右键可调整分类';
      return;
    }
    dom.empty.classList.add('hidden');

    if (state.activeFilter === '__starred') {
      renderStarred(filtered);
    } else if (state.viewMode === 'flat') {
      renderFlat(filtered);
    } else {
      renderByCategory(filtered);
    }
  }

  function renderStarred(list) {
    const sorted = list.slice().sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    dom.content.innerHTML = `
      <section class="category-section">
        <div class="category-header" style="--cat-color: #F59E0B">
          <div class="category-title">
            <span class="category-emoji" style="--cat-color: #F59E0B">★</span>
            <span class="category-name">收藏</span>
            <span class="category-count" style="--cat-color: #F59E0B">${sorted.length}</span>
          </div>
          <div class="category-line"></div>
        </div>
        <div class="card-grid">${sorted.map(b => renderCard(b, BookmarkClassifier.CATEGORIES[b.category])).join('')}</div>
      </section>
    `;
    bindCardEvents();
  }

  function renderByCategory(list) {
    const groups = {};
    list.forEach(b => { (groups[b.category] = groups[b.category] || []).push(b); });
    const order = Object.keys(BookmarkClassifier.CATEGORIES);
    const sortedKeys = order.filter(k => groups[k]);
    sortedKeys.forEach(k => groups[k].sort((a, b) => (a.title || '').localeCompare(b.title || '')));

    const html = sortedKeys.map(key => {
      const items = groups[key];
      const c = BookmarkClassifier.CATEGORIES[key];
      const cards = items.map(b => renderCard(b, c)).join('');
      return `
        <section class="category-section">
          <div class="category-header" style="--cat-color: ${c.color}">
            <div class="category-title">
              <span class="category-emoji" style="--cat-color: ${c.color}">${c.emoji}</span>
              <span class="category-name">${escapeHtml(c.name)}</span>
              <span class="category-count" style="--cat-color: ${c.color}">${items.length}</span>
            </div>
            <div class="category-line"></div>
          </div>
          <div class="card-grid">${cards}</div>
        </section>
      `;
    }).join('');

    dom.content.innerHTML = html;
    bindCardEvents();
  }

  function renderFlat(list) {
    const groups = {};
    list.forEach(b => {
      const host = extractHost(b.url) || '(无效 URL)';
      (groups[host] = groups[host] || []).push(b);
    });
    const sortedHosts = Object.keys(groups).sort();

    const html = ['<div class="flat-section">'];
    sortedHosts.forEach(host => {
      const items = groups[host];
      const dominantCat = items[0].category;
      const c = BookmarkClassifier.CATEGORIES[dominantCat];
      html.push(`
        <div class="flat-group" style="--cat-color: ${c.color}">
          <div class="flat-host">
            <span class="flat-item-dot" style="--cat-color: ${c.color}"></span>
            <span>${escapeHtml(host)}</span>
            <span class="flat-host-count">${items.length}</span>
          </div>
          <ul class="flat-list">
            ${items.map(b => `
              <li class="flat-item" data-id="${b.id}" data-url="${escapeAttr(b.url)}" data-title="${escapeAttr(b.title)}">
                ${b.starred ? '<span class="flat-item-star">★</span>' : '<span class="flat-item-dot" style="--cat-color: ' + BookmarkClassifier.CATEGORIES[b.category].color + '"></span>'}
                <span class="flat-item-title">${highlight(b.title || b.url, state.searchQuery)}</span>
                ${(b.tags || []).slice(0, 3).map(t => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')}
              </li>
            `).join('')}
          </ul>
        </div>
      `);
    });
    html.push('</div>');
    dom.content.innerHTML = html;

    dom.content.querySelectorAll('.flat-item').forEach(el => {
      el.addEventListener('click', () => openBookmark(el.dataset.id, el.dataset.url, false));
      el.addEventListener('contextmenu', (e) => handleContextMenu(e, el.dataset.id));
    });
  }

  function renderCard(b, cat) {
    const host = extractHost(b.url);
    const confClass = b.confidence >= 0.9 ? 'high' : b.confidence >= 0.6 ? 'medium' : 'low';
    const hasStar = b.starred;
    const tags = (b.tags || []).slice(0, 3);
    const noteIndicator = b.note ? `<span class="card-note-indicator" title="${escapeAttr(b.note)}">📝</span>` : '';
    const badges = BookmarkHealth.badgeOf(b);
    const badgeHtml = badges.map(bg => `<span class="card-badge card-badge-${bg.kind}" title="${escapeAttr(bg.tip)}">${bg.icon}</span>`).join('');
    const favicon = BookmarkFavicon.renderFaviconHtml(b.url, b.title, { size: 16 });

    return `
      <a class="card${hasStar ? ' has-star' : ''}${badges.length ? ' has-badge' : ''}" data-id="${b.id}" data-url="${escapeAttr(b.url)}" data-title="${escapeAttr(b.title)}" style="--cat-color: ${cat.color}" title="${escapeAttr(b.title || b.url)}\n${escapeAttr(b.url)}${b.note ? '\n\n📝 ' + b.note : ''}">
        ${hasStar ? '<span class="card-star">★</span>' : `<div class="card-confidence ${confClass}"></div>`}
        ${badgeHtml}
        <div class="card-head">
          ${favicon}
          <div class="card-title">${highlight(b.title || b.url, state.searchQuery)}</div>
        </div>
        <div class="card-domain">${escapeHtml(host)}</div>
        ${tags.length > 0 ? `<div class="card-tags">${tags.map(t => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        ${noteIndicator}
      </a>
    `;
  }

  function bindCardEvents() {
    dom.content.querySelectorAll('.card').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openBookmark(el.dataset.id, el.dataset.url, e.ctrlKey || e.metaKey);
      });
      el.addEventListener('auxclick', (e) => {
        if (e.button === 1) { e.preventDefault(); openBookmark(el.dataset.id, el.dataset.url, true); }
      });
      el.addEventListener('contextmenu', (e) => handleContextMenu(e, el.dataset.id));
    });
  }

  function openBookmark(id, url, background) {
    chrome.tabs.create({ url, active: !background });
  }

  // ===== Right-click =====
  function handleContextMenu(e, bookmarkId) {
    e.preventDefault();
    e.stopPropagation();
    state.contextBookmark = state.bookmarks.find(b => b.id === bookmarkId);
    if (!state.contextBookmark) return;

    const cats = BookmarkClassifier.CATEGORIES;
    const currentCat = state.contextBookmark.category;
    const html = Object.keys(cats).map(k => {
      const c = cats[k];
      return `<div class="ctx-cat${k === currentCat ? ' current' : ''}" data-cat="${k}" style="--cat-color: ${c.color}"><span class="ctx-cat-dot"></span><span>${c.emoji} ${escapeHtml(c.name)}</span></div>`;
    }).join('');
    dom.ctxCategories.innerHTML = html;

    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - 350);
    dom.ctxMenu.style.left = x + 'px';
    dom.ctxMenu.style.top = y + 'px';
    dom.ctxMenu.classList.remove('hidden');

    dom.ctxCategories.querySelectorAll('.ctx-cat').forEach(el => {
      el.addEventListener('click', () => {
        const cat = el.getAttribute('data-cat');
        assignCategory(state.contextBookmark.id, cat);
        dom.ctxMenu.classList.add('hidden');
      });
    });
  }

  function handleContextAction(e) {
    const action = e.target.getAttribute('data-action');
    if (!action || !state.contextBookmark) return;
    const b = state.contextBookmark;

    switch (action) {
      case 'open': openBookmark(b.id, b.url, false); break;
      case 'open-bg': openBookmark(b.id, b.url, true); break;
      case 'edit': chrome.tabs.create({ url: 'edge://bookmarks/?id=' + b.id }); break;
      case 'copy':
        navigator.clipboard.writeText(b.url).then(
          () => showToast('链接已复制', 'success'),
          () => showToast('复制失败', 'error')
        );
        break;
      case 'tag': openTagModal(b); break;
      case 'note': openNoteModal(b); break;
      case 'star': toggleStar(b); break;
      case 'delete':
        if (confirm(`删除书签「${b.title || b.url}」？`)) {
          chrome.bookmarks.remove(b.id, async () => {
            showToast('已删除', 'success');
            await loadAndRender();
          });
        }
        break;
    }
    dom.ctxMenu.classList.add('hidden');
  }

  function assignCategory(bookmarkId, categoryKey) {
    state.overrides[bookmarkId] = categoryKey;
    chrome.storage.local.set({ overrides: state.overrides }, () => {
      const b = state.bookmarks.find(x => x.id === bookmarkId);
      if (b) { b.category = categoryKey; b.confidence = 1.0; b.source = 'override'; }
      showToast(`已移至「${BookmarkClassifier.CATEGORIES[categoryKey].name}」`, 'success');
      render();
    });
  }

  function toggleStar(b) {
    const next = !b.starred;
    BookmarkMeta.set(b.id, { starred: next }).then(() => {
      b.starred = next;
      showToast(next ? '已加 ★' : '已取消 ★', 'success');
      render();
    });
  }

  // ===== Modals =====
  function openTagModal(b) {
    state.contextBookmark = b;
    dom.modalTitle.textContent = '🏷 编辑标签 — ' + (b.title || b.url);
    dom.modalBody.innerHTML = `
      <div class="modal-field">
        <label>标签 (用逗号或回车分隔)</label>
        <input id="tag-input" type="text" value="${escapeAttr((b.tags || []).join(', '))}" placeholder="例如: work, react, 重要" />
      </div>
    `;
    dom.modalSave.onclick = () => {
      const val = $('tag-input').value.trim();
      const tags = val ? val.split(/[,，;；\n]/).map(s => s.trim()).filter(Boolean) : [];
      BookmarkMeta.set(b.id, { tags }).then(() => {
        b.tags = tags;
        showToast('标签已保存', 'success');
        closeModal();
        render();
      });
    };
    showModal();
    setTimeout(() => $('tag-input').focus(), 50);
  }

  function openNoteModal(b) {
    state.contextBookmark = b;
    dom.modalTitle.textContent = '📝 编辑备注 — ' + (b.title || b.url);
    dom.modalBody.innerHTML = `
      <div class="modal-field">
        <label>备注</label>
        <textarea id="note-input" placeholder="添加备注…">${escapeHtml(b.note || '')}</textarea>
      </div>
    `;
    dom.modalSave.onclick = () => {
      const val = $('note-input').value;
      BookmarkMeta.set(b.id, { note: val }).then(() => {
        b.note = val;
        showToast('备注已保存', 'success');
        closeModal();
        render();
      });
    };
    showModal();
    setTimeout(() => $('note-input').focus(), 50);
  }

  function showModal() { dom.modal.classList.remove('hidden'); }
  function closeModal() { dom.modal.classList.add('hidden'); }

  // ===== Stats =====
  function showStatsModal() {
    dom.statsModal.classList.remove('hidden');
    dom.statsBody.innerHTML = '<div class="stat-loading">计算中…</div>';
    setTimeout(() => {
      const byCat = BookmarkStats.byCategory(state.bookmarks);
      const byMonth = BookmarkStats.byMonth(state.bookmarks);
      const topHosts = BookmarkStats.topHosts(state.bookmarks, 10);

      dom.statsBody.innerHTML = `
        <div class="stat-section">
          <div class="stat-section-title">分类分布</div>
          <div style="overflow-x:auto;">${BookmarkStats.renderBarChart(byCat, { width: 540 })}</div>
        </div>
        <div class="stat-section">
          <div class="stat-section-title">分类占比</div>
          <div class="stat-row">
            <div class="stat-half" style="display:flex;justify-content:center;">${BookmarkStats.renderDonut(byCat, { width: 200 })}</div>
            <div class="stat-half">
              ${byCat.slice(0, 6).map(it => `
                <div style="display:flex;align-items:center;gap:6px;font-size:11px;line-height:1.8;">
                  <span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${it.color};"></span>
                  <span>${it.emoji} ${escapeHtml(it.name)}</span>
                  <span style="margin-left:auto;color:var(--text-faint);">${it.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="stat-section">
          <div class="stat-section-title">添加时间线</div>
          ${byMonth.length > 0 ? BookmarkStats.renderTimeline(byMonth, { width: 540, height: 140 }) : '<div style="text-align:center;color:var(--text-faint);padding:16px;font-size:11px;">无日期数据</div>'}
        </div>
        <div class="stat-section">
          <div class="stat-section-title">收藏 TOP 10 域名</div>
          <ol style="font-size:11px;line-height:1.7;padding-left:20px;">
            ${topHosts.map(h => `<li><code style="background:var(--bg-elev-2);padding:1px 5px;border-radius:3px;font-size:10px;">${escapeHtml(h.host)}</code> <span style="color:var(--text-faint);">× ${h.count}</span></li>`).join('') || '<li style="color:var(--text-faint);">无数据</li>'}
          </ol>
        </div>
      `;
    }, 50);
  }

  function showIOModal() {
    dom.ioModal.classList.remove('hidden');
    dom.importResult.textContent = '';
    dom.importResult.className = 'io-result';
  }

  // ===== Utils =====
  function extractHost(url) { return BookmarkClassifier.extractHost(url || ''); }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(s) { return escapeHtml(s); }

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    let out = '';
    let i = 0;
    while (i < text.length) {
      const idx = lower.indexOf(q, i);
      if (idx === -1) { out += escapeHtml(text.slice(i)); break; }
      out += escapeHtml(text.slice(i, idx));
      out += '<mark>' + escapeHtml(text.slice(idx, idx + q.length)) + '</mark>';
      i = idx + q.length;
    }
    return out;
  }

  function showToast(msg, type) {
    dom.toast.textContent = msg;
    dom.toast.className = 'toast' + (type ? ' ' + type : '');
    setTimeout(() => dom.toast.classList.add('hidden'), 2000);
  }

  // ===== Health =====
  function openHealthModal() {
    dom.healthModal.classList.remove('hidden');
    const s = BookmarkHealth.summary(state.bookmarks);
    dom.healthSummary.innerHTML = `<div>总计: <b>${s.total}</b> · 健康: <b style="color:var(--success);">${s.healthy}</b> · 死链: <b style="color:var(--danger);">${s.dead}</b> · RSS 失效: <b style="color:#F59E0B;">${s.rssBad}</b> · 未检测: <b style="color:var(--text-faint);">${s.unchecked}</b></div>`;
  }

  document.getElementById('health-check-dead').addEventListener('click', () => runHealthCheck('dead'));
  document.getElementById('health-check-rss').addEventListener('click', () => runHealthCheck('rss'));
  document.getElementById('health-check-all').addEventListener('click', async () => {
    await runHealthCheck('dead');
    await runHealthCheck('rss');
  });

  async function runHealthCheck(type) {
    dom.healthActions.style.display = 'none';
    dom.healthProgress.innerHTML = '<div class="health-progress-text">准备…</div><div class="health-bar"><div class="health-bar-fill" id="hp-fill"></div></div>';
    let done = 0;
    const total = state.bookmarks.length;
    const onResult = async (id, type, result) => {
      const prev = state.meta[id] || {};
      const health = Object.assign({}, prev.health || {});
      if (type === 'rss') {
        health.rssStatus = result.status;
        health.rssCheckedAt = result.checkedAt;
        if (result.error) health.rssError = result.error;
        if (result.feedUrl) health.rssFeedUrl = result.feedUrl;
        if (result.title) health.rssTitle = result.title;
        if (result.code) health.rssCode = result.code;
      } else {
        health.deadStatus = result.status;
        health.deadCheckedAt = result.checkedAt;
        if (result.error) health.deadError = result.error;
        if (result.code) health.deadCode = result.code;
      }
      await BookmarkMeta.set(id, { health });
      const b = state.bookmarks.find(x => x.id === id);
      if (b) b.health = health;
    };
    const onProgress = (d, t) => {
      const pct = Math.round(d / t * 100);
      const fill = document.getElementById('hp-fill');
      if (fill) fill.style.width = pct + '%';
      const text = dom.healthProgress.querySelector('.health-progress-text');
      if (text) text.textContent = `检测中 ${d}/${t} (${pct}%)`;
    };
    try {
      await BookmarkHealth.checkAll(state.bookmarks, type, { onResult, onProgress, delay: 80, skipFresh: 0 });
      showToast('检测完成', 'success');
    } catch (err) {
      showToast('检测出错: ' + err.message, 'error');
    } finally {
      dom.healthActions.style.display = '';
      const s2 = BookmarkHealth.summary(state.bookmarks);
      dom.healthSummary.innerHTML = `<div>总计: <b>${s2.total}</b> · 健康: <b style="color:var(--success);">${s2.healthy}</b> · 死链: <b style="color:var(--danger);">${s2.dead}</b> · RSS 失效: <b style="color:#F59E0B;">${s2.rssBad}</b> · 未检测: <b style="color:var(--text-faint);">${s2.unchecked}</b></div>`;
      render();
    }
  }

  // ===== Review =====
  async function openReviewModal() {
    dom.reviewModal.classList.remove('hidden');
    const data = await BookmarkNotify.reviewSummary(state.bookmarks);
    const s = data.settings;
    dom.reviewBody.innerHTML = `
      <div class="review-section">
        <div class="review-section-title">定期提醒设置</div>
        <div class="modal-field"><label><input type="checkbox" id="review-enabled" ${s.enabled ? 'checked' : ''} /> 启用浏览器通知</label></div>
        <div class="modal-field"><label>间隔 (天): <input type="number" id="review-interval" min="1" max="365" value="${s.intervalDays}" style="width:60px;" /></label></div>
        <div class="modal-field"><label>沉睡判定 (天): <input type="number" id="review-inactive" min="7" max="3650" value="${s.inactiveDays}" style="width:60px;" /></label></div>
        <div class="modal-field"><label>每次最多通知: <input type="number" id="review-max" min="1" max="20" value="${s.maxNotifications}" style="width:50px;" /></label></div>
        <button id="review-save" class="btn btn-primary">保存</button>
      </div>
      <div class="review-divider"></div>
      <div class="review-section">
        <div class="review-section-title">沉睡书签 (${data.inactiveCount} 个)</div>
        ${data.inactive.length > 0 ? `<ol class="review-list">${data.inactive.slice(0, 8).map(b => `<li><a href="${escapeAttr(b.url)}" target="_blank">${escapeHtml(b.title || b.url)}</a></li>`).join('')}</ol>` : '<div style="color:var(--text-faint);font-size:10px;">无</div>'}
      </div>
      <div class="review-section">
        <div class="review-section-title">未分类 (前 5)</div>
        ${data.uncategorized.length > 0 ? `<ol class="review-list">${data.uncategorized.slice(0, 5).map(b => `<li><a href="${escapeAttr(b.url)}" target="_blank">${escapeHtml(b.title || b.url)}</a></li>`).join('')}</ol>` : '<div style="color:var(--text-faint);font-size:10px;">无</div>'}
      </div>
    `;
    document.getElementById('review-save').addEventListener('click', async () => {
      await BookmarkNotify.setSettings({
        enabled: document.getElementById('review-enabled').checked,
        intervalDays: parseInt(document.getElementById('review-interval').value) || 7,
        inactiveDays: parseInt(document.getElementById('review-inactive').value) || 60,
        maxNotifications: parseInt(document.getElementById('review-max').value) || 3,
      });
      await BookmarkNotify.schedule();
      showToast('已保存', 'success');
    });
  }

  // 关闭 health/review 模态
  document.querySelectorAll('[data-health-close]').forEach(el => el.addEventListener('click', () => dom.healthModal.classList.add('hidden')));
  document.querySelectorAll('[data-review-close]').forEach(el => el.addEventListener('click', () => dom.reviewModal.classList.add('hidden')));
  dom.healthModal.addEventListener('click', (e) => { if (e.target === dom.healthModal) dom.healthModal.classList.add('hidden'); });
  dom.reviewModal.addEventListener('click', (e) => { if (e.target === dom.reviewModal) dom.reviewModal.classList.add('hidden'); });
})();
