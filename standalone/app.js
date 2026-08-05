// app.js — Standalone PWA 主控制器
// Author: Xingyu Wei

(function () {
  'use strict';

  // ===== State =====
  const state = {
    bookmarks: [],
    overrides: {},
    meta: {},
    categoryOrder: null,
    viewMode: 'category',
    cardSize: 'normal',
    activeFilter: null,
    activeTag: null,
    searchQuery: '',
    theme: 'dark',
    themeId: 'midnight',
    contextBookmark: null,
  };

  // ===== DOM =====
  const $ = (id) => document.getElementById(id);
  const dom = {
    search: $('search'),
    clearSearch: $('clear-search'),
    viewMode: $('view-mode'),
    cardSize: $('card-size'),
    themeToggle: $('theme-toggle'),
    healthBtn: $('health-btn'),
    reviewBtn: $('review-btn'),
    addBtn: $('add-btn'),
    ioBtn: $('io-btn'),
    sidebar: $('sidebar'),
    main: $('main'),
    statusText: $('status-text'),
    filterInfo: $('filter-info'),
    tagChips: $('tag-chips'),
    ctxMenu: $('context-menu'),
    ctxCategories: $('ctx-categories'),
    toast: $('toast'),
    modal: $('modal'),
    modalTitle: $('modal-title'),
    modalBody: $('modal-body'),
    modalSave: $('modal-save'),
    statsModal: $('stats-modal'),
    statsBody: $('stats-body'),
    healthModal: $('health-modal'),
    healthBody: $('health-body'),
    healthProgress: $('health-progress'),
    healthActions: $('health-actions'),
    healthSummary: $('health-summary'),
    reviewModal: $('review-modal'),
    reviewBody: $('review-body'),
    ioModal: $('io-modal'),
    exportBtn: $('export-btn'),
    importBtn: $('import-btn'),
    importReplaceBtn: $('import-replace-btn'),
    importFile: $('import-file'),
    importHtmlBtn: $('import-html-btn'),
    importHtmlFile: $('import-html-file'),
    importResult: $('import-result'),
    installPrompt: $('install-prompt'),
    installYes: $('install-yes'),
    installNo: $('install-no'),
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
    const stored = await chrome.storage.local.get(['theme', 'themeId', 'viewMode', 'overrides', 'category_order']);
    state.theme = stored.theme || 'dark';
    state.themeId = stored.themeId || 'midnight';
    state.viewMode = stored.viewMode || 'category';
    state.overrides = stored.overrides || {};
    state.categoryOrder = stored.category_order || null;
    applyAppearance();
    dom.viewMode.value = state.viewMode;

    bindEvents();
    await loadAndRender();
    setupInstallPrompt();
  }

  function bindEvents() {
    dom.search.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      dom.clearSearch.classList.toggle('hidden', !state.searchQuery);
      render();
    });
    dom.clearSearch.addEventListener('click', () => {
      dom.search.value = ''; state.searchQuery = '';
      dom.clearSearch.classList.add('hidden'); render();
    });

    dom.viewMode.addEventListener('change', (e) => {
      state.viewMode = e.target.value;
      state.activeFilter = null; state.activeTag = null;
      chrome.storage.local.set({ viewMode: state.viewMode });
      render();
    });

    dom.cardSize.addEventListener('change', (e) => {
      state.cardSize = e.target.value;
      dom.main.dataset.size = state.cardSize;
    });
    dom.main.dataset.size = state.cardSize;

    dom.themeToggle.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyAppearance();
      chrome.storage.local.set({ theme: state.theme });
    });

    // 主题预设
    dom.themesBtn.addEventListener('click', openThemesModal);
    document.querySelectorAll('[data-themes-close]').forEach(el => el.addEventListener('click', () => dom.themesModal.classList.add('hidden')));
    dom.themesModal.addEventListener('click', (e) => { if (e.target === dom.themesModal) dom.themesModal.classList.add('hidden'); });
    if (dom.themeModeDark) dom.themeModeDark.addEventListener('click', () => setAppearance('dark'));
    if (dom.themeModeLight) dom.themeModeLight.addEventListener('click', () => setAppearance('light'));
    if (dom.themeModeAuto) dom.themeModeAuto.addEventListener('click', () => setAppearance('auto'));

    dom.healthBtn.addEventListener('click', () => openHealthModal());
    dom.reviewBtn.addEventListener('click', () => openReviewModal());
    dom.addBtn.addEventListener('click', () => openAddBookmarkModal());
    dom.ioBtn.addEventListener('click', () => showIOModal());

    document.addEventListener('click', (e) => {
      if (!dom.ctxMenu.contains(e.target) && !e.target.closest('.card') && !e.target.closest('.flat-item') && !e.target.closest('.board-card')) {
        dom.ctxMenu.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); dom.search.focus(); dom.search.select(); }
      if (e.key === 'Escape') {
        if (!dom.ctxMenu.classList.contains('hidden')) dom.ctxMenu.classList.add('hidden');
        else if (!dom.modal.classList.contains('hidden')) closeModal();
        else if (!dom.statsModal.classList.contains('hidden')) dom.statsModal.classList.add('hidden');
        else if (!dom.healthModal.classList.contains('hidden')) dom.healthModal.classList.add('hidden');
        else if (!dom.reviewModal.classList.contains('hidden')) dom.reviewModal.classList.add('hidden');
        else if (!dom.ioModal.classList.contains('hidden')) dom.ioModal.classList.add('hidden');
        else if (state.searchQuery) {
          dom.search.value = ''; state.searchQuery = '';
          dom.clearSearch.classList.add('hidden'); render();
        }
      }
    });

    dom.ctxMenu.addEventListener('click', handleContextAction);
    document.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', closeModal));
    document.querySelectorAll('[data-stats-close]').forEach(el => el.addEventListener('click', () => dom.statsModal.classList.add('hidden')));
    document.querySelectorAll('[data-health-close]').forEach(el => el.addEventListener('click', () => dom.healthModal.classList.add('hidden')));
    document.querySelectorAll('[data-review-close]').forEach(el => el.addEventListener('click', () => dom.reviewModal.classList.add('hidden')));
    document.querySelectorAll('[data-io-close]').forEach(el => el.addEventListener('click', () => dom.ioModal.classList.add('hidden')));
    [dom.modal, dom.statsModal, dom.healthModal, dom.reviewModal, dom.ioModal].forEach(m => {
      m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
    });

    dom.exportBtn.addEventListener('click', async () => {
      try { await BookmarkIO.downloadJson(); showToast('已下载备份', 'success'); }
      catch (err) { showToast('导出失败: ' + err.message, 'error'); }
    });
    dom.importBtn.addEventListener('click', () => { dom.importFile.dataset.mode = 'merge'; dom.importFile.click(); });
    dom.importReplaceBtn.addEventListener('click', () => {
      if (confirm('覆盖导入将完全替换当前数据。继续？')) {
        dom.importFile.dataset.mode = 'replace'; dom.importFile.click();
      }
    });
    dom.importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const mode = e.target.dataset.mode || 'merge';
      try {
        const r = await BookmarkIO.importAll(file, mode);
        dom.importResult.className = 'io-result success';
        dom.importResult.textContent = `导入成功 (${r.mode})`;
        showToast('导入完成', 'success');
        await loadAndRender();
      } catch (err) {
        dom.importResult.className = 'io-result error';
        dom.importResult.textContent = '导入失败: ' + err.message;
      }
      dom.importFile.value = '';
    });

    dom.importHtmlBtn.addEventListener('click', () => dom.importHtmlFile.click());
    dom.importHtmlFile.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const text = await file.text();
        const imported = parseNetscapeBookmarks(text);
        if (imported.length === 0) {
          dom.importResult.className = 'io-result error';
          dom.importResult.textContent = '未解析到任何书签';
          return;
        }
        // 合并到 bookmarks
        for (const b of imported) {
          const id = 'imp-' + Math.random().toString(36).slice(2, 10);
          state.bookmarks.push(Object.assign({ id }, b, { category: 'other' }));
        }
        await persistBookmarks();
        dom.importResult.className = 'io-result success';
        dom.importResult.textContent = `成功导入 ${imported.length} 个书签`;
        showToast('导入完成', 'success');
        await loadAndRender();
      } catch (err) {
        dom.importResult.className = 'io-result error';
        dom.importResult.textContent = '解析失败: ' + err.message;
      }
      dom.importHtmlFile.value = '';
    });

    // PWA 安装
    dom.installYes.addEventListener('click', () => {
      if (window.__deferredPrompt) {
        window.__deferredPrompt.prompt();
        window.__deferredPrompt.userChoice.then(() => {
          dom.installPrompt.classList.add('hidden');
          window.__deferredPrompt = null;
        });
      }
    });
    dom.installNo.addEventListener('click', () => {
      dom.installPrompt.classList.add('hidden');
    });
  }

  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.__deferredPrompt = e;
      dom.installPrompt.classList.remove('hidden');
    });
  }

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    dom.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function resolveAppearance() {
    if (state.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.theme;
  }

  function applyAppearance() {
    const mode = resolveAppearance();
    document.body.dataset.theme = mode;
    dom.themeToggle.textContent = mode === 'dark' ? '☀️' : '🌙';
    if (window.BookmarkThemes) {
      BookmarkThemes.applyTheme(state.themeId, mode);
      BookmarkThemes.syncCategoryColors(state.themeId, mode);
    }
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

  function openThemesModal() {
    if (!dom.themesModal || !window.BookmarkThemes) return;
    dom.themesModal.classList.remove('hidden');
    const list = BookmarkThemes.getThemeList();
    dom.themeGrid.innerHTML = list.map(t => `
      <div class="theme-card${t.id === state.themeId ? ' active' : ''}${!t.lightSupported ? ' theme-disabled' : ''}" data-theme="${t.id}">
        <div class="theme-swatch" style="--swatch-dark: ${BookmarkThemes.getTheme(t.id).vars.dark['--bg']}; --swatch-light: ${BookmarkThemes.getTheme(t.id).vars.light ? BookmarkThemes.getTheme(t.id).vars.light['--bg'] : '#fff'};"></div>
        <div class="theme-card-info">
          <div class="theme-card-name">${t.emoji} ${t.name}</div>
          <div class="theme-card-desc">${t.desc}</div>
        </div>
      </div>
    `).join('');
    dom.themeGrid.querySelectorAll('.theme-card:not(.theme-disabled)').forEach(el => {
      el.addEventListener('click', () => {
        setThemeId(el.getAttribute('data-theme'));
        openThemesModal();
      });
    });
    [dom.themeModeDark, dom.themeModeLight, dom.themeModeAuto].filter(Boolean).forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-secondary'); });
    const modeBtn = state.theme === 'dark' ? dom.themeModeDark : state.theme === 'light' ? dom.themeModeLight : dom.themeModeAuto;
    if (modeBtn) { modeBtn.classList.remove('btn-secondary'); modeBtn.classList.add('btn-primary'); }
  }

  // ===== Load =====
  async function loadAndRender() {
    try {
      // 读 localStorage (或 chrome.storage)
      const data = await chrome.storage.local.get(['bookmarks_list']);
      let flat = data.bookmarks_list || [];
      // 兼容: 如果没存过, 看是否有 io 导入
      if (flat.length === 0) {
        const seedData = await chrome.storage.local.get(['bookmark_meta']);
        if (!seedData.bookmark_meta) {
          // 第一次启动，加演示数据
          flat = getSeedData();
          await chrome.storage.local.set({ bookmarks_list: flat });
        }
      }
      state.meta = await BookmarkMeta.getAll();
      const classified = BookmarkClassifier.classifyAll(flat, state.overrides);
      state.bookmarks = classified.map(b => BookmarkMeta.applyMeta(b, state.meta[b.id])).map(b => BookmarkBoard.applyBoardMeta(b, state.meta[b.id]));
      // 缓存给 alarm
      BookmarkNotify.cacheForReview(state.bookmarks);
      render();
    } catch (err) {
      console.error(err);
      showToast('读取失败: ' + err.message, 'error');
    }
  }

  // 演示种子数据 (首次启动)
  function getSeedData() {
    return [
      { id: 'demo-1', title: 'ChatGPT', url: 'https://chatgpt.com/', dateAdded: Date.now() - 86400000 * 2 },
      { id: 'demo-2', title: 'GitHub', url: 'https://github.com/', dateAdded: Date.now() - 86400000 * 5 },
      { id: 'demo-3', title: 'YouTube', url: 'https://www.youtube.com/', dateAdded: Date.now() - 86400000 * 10 },
      { id: 'demo-4', title: 'MDN', url: 'https://developer.mozilla.org/', dateAdded: Date.now() - 86400000 * 30 },
      { id: 'demo-5', title: 'Notion', url: 'https://www.notion.so/', dateAdded: Date.now() - 86400000 * 60 },
      { id: 'demo-6', title: 'B站', url: 'https://www.bilibili.com/', dateAdded: Date.now() - 86400000 * 90 },
      { id: 'demo-7', title: 'Figma', url: 'https://www.figma.com/', dateAdded: Date.now() - 86400000 * 120 },
    ];
  }

  async function persistBookmarks() {
    const slim = state.bookmarks.map(b => ({
      id: b.id, title: b.title, url: b.url, dateAdded: b.dateAdded,
    }));
    await chrome.storage.local.set({ bookmarks_list: slim });
  }

  // ===== Netscape Bookmark HTML 解析 =====
  function parseNetscapeBookmarks(html) {
    const out = [];
    const re = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const addDateRe = /add_date="(\d+)"/i;
    let m;
    while ((m = re.exec(html)) !== null) {
      const url = m[1];
      const title = m[2].replace(/<[^>]+>/g, '').trim();
      const am = addDateRe.exec(m[0]);
      const dateAdded = am ? parseInt(am[1]) * 1000 : Date.now();
      if (url && /^https?:\/\//i.test(url)) {
        out.push({ title: title || url, url, dateAdded });
      }
    }
    return out;
  }

  // ===== Render =====
  function render() {
    const filtered = filterBookmarks();
    updateStatus(filtered);
    renderSidebar(filtered);
    renderTagChips(filtered);
    renderMain(filtered);
  }

  function filterBookmarks() {
    let list = state.bookmarks;
    if (state.viewMode === 'uncategorized') list = list.filter(b => b.category === 'other');
    if (state.activeFilter === '__starred') list = list.filter(b => b.starred);
    else if (state.activeFilter) list = list.filter(b => b.category === state.activeFilter);
    if (state.activeTag) list = list.filter(b => (b.tags || []).includes(state.activeTag));
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

  function getOrderedCategoryKeys() {
    const all = Object.keys(BookmarkClassifier.CATEGORIES);
    if (!state.categoryOrder || !Array.isArray(state.categoryOrder)) return all;
    const inOrder = state.categoryOrder.filter(k => all.includes(k));
    const rest = all.filter(k => !inOrder.includes(k));
    return [...inOrder, ...rest];
  }

  function renderSidebar(filtered) {
    const counts = {};
    filtered.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
    const order = getOrderedCategoryKeys();
    const total = state.bookmarks.length;
    const items = [];
    // 总览 (filtered/total 格式)
    const overviewText = total === filtered.length
      ? `全部 <small style="opacity:0.6;">(${total})</small>`
      : `全部 <small style="opacity:0.6;">(${filtered.length}/${total})</small>`;
    items.push(`<div class="sidebar-item${!state.activeFilter ? ' active' : ''}" data-cat=""><span class="sidebar-emoji">▦</span><span class="sidebar-name">${overviewText}</span><span class="sidebar-count">${filtered.length}</span></div>`);
    const starredCount = filtered.filter(b => b.starred).length;
    if (starredCount > 0 || state.activeFilter === '__starred') {
      items.push(`<div class="sidebar-item${state.activeFilter === '__starred' ? ' active' : ''}" data-cat="__starred"><span class="sidebar-emoji">★</span><span class="sidebar-name">收藏</span><span class="sidebar-count">${starredCount}</span></div>`);
    }
    items.push('<div class="sidebar-section"><div class="sidebar-title">分类 (可拖动排序)</div></div>');
    // 按数量降序, 0 项不显示 (除非 activeFilter 指向它)
    const sorted = order
      .filter(k => k !== 'other')
      .map(k => ({ key: k, count: counts[k] || 0 }))
      .filter(o => o.count > 0 || state.activeFilter === o.key)
      .sort((a, b) => b.count - a.count);
    sorted.forEach(o => {
      const c = BookmarkClassifier.CATEGORIES[o.key];
      items.push(`<div class="sidebar-item${state.activeFilter === o.key ? ' active' : ''}${o.count === 0 ? ' empty' : ''}" data-cat="${o.key}" draggable="true"><span class="sidebar-emoji">${c.emoji}</span><span class="sidebar-name">${escapeHtml(c.name)}</span><span class="sidebar-count">${o.count}</span></div>`);
    });
    const otherCnt = counts.other || 0;
    if (otherCnt > 0 || state.activeFilter === 'other') {
      const c = BookmarkClassifier.CATEGORIES.other;
      items.push(`<div class="sidebar-item${state.activeFilter === 'other' ? ' active' : ''}" data-cat="other" draggable="true"><span class="sidebar-emoji">${c.emoji}</span><span class="sidebar-name">${escapeHtml(c.name)}</span><span class="sidebar-count">${otherCnt}</span></div>`);
    }
    dom.sidebar.innerHTML = items.join('');
    dom.sidebar.querySelectorAll('.sidebar-item').forEach(el => {
      el.addEventListener('click', () => {
        const cat = el.getAttribute('data-cat');
        state.activeFilter = cat || null;
        render();
      });
    });
    bindSidebarDrag();
  }

  function bindSidebarDrag() {
    const items = dom.sidebar.querySelectorAll('.sidebar-item[draggable="true"]');
    let draggedKey = null;
    items.forEach(el => {
      el.addEventListener('dragstart', (e) => {
        draggedKey = el.getAttribute('data-cat');
        el.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedKey);
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        el.classList.add('drag-over');
      });
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        const targetKey = el.getAttribute('data-cat');
        if (draggedKey && targetKey && draggedKey !== targetKey) reorderCategory(draggedKey, targetKey);
      });
    });
  }

  function reorderCategory(src, dst) {
    const order = getOrderedCategoryKeys();
    const srcIdx = order.indexOf(src);
    const dstIdx = order.indexOf(dst);
    if (srcIdx === -1 || dstIdx === -1) return;
    order.splice(srcIdx, 1);
    order.splice(dstIdx, 0, src);
    state.categoryOrder = order;
    chrome.storage.local.set({ category_order: order });
    render();
  }

  function renderTagChips(filtered) {
    const tagCounts = {};
    filtered.forEach(b => (b.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const tags = Object.keys(tagCounts).sort();
    if (tags.length === 0) { dom.tagChips.classList.add('hidden'); return; }
    const html = [`<span class="tag-chip${!state.activeTag ? ' active' : ''}" data-tag="">全部</span>`];
    tags.forEach(t => html.push(`<span class="tag-chip${state.activeTag === t ? ' active' : ''}" data-tag="${escapeAttr(t)}"># ${escapeHtml(t)} <small>${tagCounts[t]}</small></span>`));
    dom.tagChips.innerHTML = html.join('');
    dom.tagChips.classList.remove('hidden');
    dom.tagChips.querySelectorAll('.tag-chip').forEach(el => {
      el.addEventListener('click', () => { state.activeTag = el.getAttribute('data-tag') || null; render(); });
    });
  }

  function renderMain(filtered) {
    if (state.viewMode === 'board-status') {
      renderBoard(filtered, 'status');
    } else if (state.viewMode === 'board-priority') {
      renderBoard(filtered, 'priority');
    } else if (state.activeFilter === '__starred') {
      renderStarred(filtered);
    } else if (state.viewMode === 'flat') {
      renderFlat(filtered);
    } else {
      renderByCategory(filtered);
    }
  }

  function renderBoard(filtered, mode) {
    const field = mode === 'priority' ? 'priority' : 'status';
    dom.main.innerHTML = BookmarkBoard.renderBoard(filtered, mode, async (id, targetKey) => {
      await BookmarkMeta.set(id, { [field]: targetKey });
      const b = state.bookmarks.find(x => x.id === id);
      if (b) b[field] = targetKey;
      showToast(`已移至「${targetKey}」`, 'success');
      render();
    });
    BookmarkBoard.bindBoardDrag(dom.main, (id, targetKey) => {
      BookmarkMeta.set(id, { [field]: targetKey }).then(() => {
        const b = state.bookmarks.find(x => x.id === id);
        if (b) b[field] = targetKey;
        showToast(`已移至「${targetKey}」`, 'success');
        render();
      });
    });
    dom.main.querySelectorAll('.board-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const b = state.bookmarks.find(x => x.id === id);
        if (b) openBookmark(b.id, b.url, false);
      });
      el.addEventListener('contextmenu', (e) => handleContextMenu(e, el.dataset.id));
    });
  }

  function renderStarred(list) {
    const sorted = list.slice().sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    dom.main.innerHTML = `<section class="category-section"><div class="category-header" style="--cat-color: #F59E0B"><span class="category-emoji" style="--cat-color: #F59E0B">★</span><span class="category-title">收藏</span><span class="category-count" style="--cat-color: #F59E0B">${sorted.length}</span></div><div class="card-grid">${sorted.map(b => renderCard(b, BookmarkClassifier.CATEGORIES[b.category])).join('')}</div></section>`;
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
      return `<section class="category-section"><div class="category-header" style="--cat-color: ${c.color}"><span class="category-emoji" style="--cat-color: ${c.color}">${c.emoji}</span><span class="category-title">${escapeHtml(c.name)}</span><span class="category-count" style="--cat-color: ${c.color}">${items.length}</span></div><div class="card-grid">${items.map(b => renderCard(b, c)).join('')}</div></section>`;
    }).join('');
    dom.main.innerHTML = html;
    bindCardEvents();
  }

  function renderFlat(list) {
    const groups = {};
    list.forEach(b => {
      const host = extractHost(b.url) || '(无效)';
      (groups[host] = groups[host] || []).push(b);
    });
    const sortedHosts = Object.keys(groups).sort();
    const html = sortedHosts.map(host => {
      const items = groups[host];
      const c = BookmarkClassifier.CATEGORIES[items[0].category];
      return `<div class="flat-group"><div class="flat-host"><span class="flat-item-dot" style="--cat-color: ${c.color}"></span><span>${escapeHtml(host)}</span><span style="color:var(--text-faint);font-weight:400;">${items.length}</span></div><ul class="flat-list">${items.map(b => `<li class="flat-item" data-id="${b.id}" data-url="${escapeAttr(b.url)}" data-title="${escapeAttr(b.title)}">${b.starred ? '<span class="flat-item-star">★</span>' : '<span class="flat-item-dot" style="--cat-color: ' + BookmarkClassifier.CATEGORIES[b.category].color + '"></span>'}<span class="flat-item-title">${highlight(b.title || b.url, state.searchQuery)}</span>${(b.tags || []).slice(0, 3).map(t => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')}</li>`).join('')}</ul></div>`;
    }).join('');
    dom.main.innerHTML = html;
    dom.main.querySelectorAll('.flat-item').forEach(el => {
      el.addEventListener('click', () => openBookmark(el.dataset.id, el.dataset.url, false));
      el.addEventListener('contextmenu', (e) => handleContextMenu(e, el.dataset.id));
    });
  }

  function renderCard(b, cat) {
    const host = extractHost(b.url);
    const confClass = b.confidence >= 0.9 ? 'high' : b.confidence >= 0.6 ? 'medium' : 'low';
    const hasStar = b.starred;
    const tags = (b.tags || []).slice(0, 3);
    const badges = BookmarkHealth.badgeOf(b);
    const noteIndicator = b.note ? `<span class="card-note-indicator" title="${escapeAttr(b.note)}">📝</span>` : '';
    const badgeHtml = badges.map(bg => `<span class="card-badge card-badge-${bg.kind}" title="${escapeAttr(bg.tip)}">${bg.icon}</span>`).join('');
    const favicon = BookmarkFavicon.renderFaviconHtml(b.url, b.title, { size: 20 });
    return `<a class="card${hasStar ? ' has-star' : ''}${badges.length ? ' has-badge' : ''}" data-id="${b.id}" data-url="${escapeAttr(b.url)}" data-title="${escapeAttr(b.title)}" style="--cat-color: ${cat.color}" title="${escapeAttr(b.title || b.url)}\n${escapeAttr(b.url)}${b.note ? '\n\n📝 ' + b.note : ''}">${hasStar ? '<span class="card-star">★</span>' : `<div class="card-confidence ${confClass}"></div>`}${badgeHtml}<div class="card-head">${favicon}<div class="card-title">${highlight(b.title || b.url, state.searchQuery)}</div></div><div class="card-domain">${escapeHtml(host)}</div>${tags.length > 0 ? `<div class="card-tags">${tags.map(t => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')}</div>` : ''}${noteIndicator}</a>`;
  }

  function bindCardEvents() {
    dom.main.querySelectorAll('.card').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); openBookmark(el.dataset.id, el.dataset.url, e.ctrlKey || e.metaKey); });
      el.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); openBookmark(el.dataset.id, el.dataset.url, true); } });
      el.addEventListener('contextmenu', (e) => handleContextMenu(e, el.dataset.id));
    });
  }

  function openBookmark(id, url, background) {
    chrome.tabs.create({ url, active: !background });
  }

  // ===== Right-click =====
  function handleContextMenu(e, bookmarkId) {
    e.preventDefault(); e.stopPropagation();
    state.contextBookmark = state.bookmarks.find(b => b.id === bookmarkId);
    if (!state.contextBookmark) return;
    const cats = BookmarkClassifier.CATEGORIES;
    const html = Object.keys(cats).map(k => {
      const c = cats[k];
      return `<div class="ctx-cat${k === state.contextBookmark.category ? ' current' : ''}" data-cat="${k}" style="--cat-color: ${c.color}"><span class="ctx-cat-dot"></span><span>${c.emoji} ${escapeHtml(c.name)}</span></div>`;
    }).join('');
    dom.ctxCategories.innerHTML = html;
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 350);
    dom.ctxMenu.style.left = x + 'px';
    dom.ctxMenu.style.top = y + 'px';
    dom.ctxMenu.classList.remove('hidden');
    dom.ctxCategories.querySelectorAll('.ctx-cat').forEach(el => {
      el.addEventListener('click', () => {
        assignCategory(state.contextBookmark.id, el.getAttribute('data-cat'));
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
      case 'copy': navigator.clipboard.writeText(b.url).then(() => showToast('已复制', 'success'), () => showToast('复制失败', 'error')); break;
      case 'tag': openTagModal(b); break;
      case 'note': openNoteModal(b); break;
      case 'star': toggleStar(b); break;
      case 'status': openStatusModal(b); break;
      case 'priority': openPriorityModal(b); break;
      case 'delete':
        if (confirm(`删除「${b.title || b.url}」？`)) {
          state.bookmarks = state.bookmarks.filter(x => x.id !== b.id);
          BookmarkMeta.remove(b.id);
          persistBookmarks().then(() => { showToast('已删除', 'success'); render(); });
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
    dom.modalBody.innerHTML = `<div class="modal-field"><label>标签 (用逗号或回车分隔)</label><input id="tag-input" type="text" value="${escapeAttr((b.tags || []).join(', '))}" placeholder="work, react, 重要" /></div>`;
    dom.modalSave.onclick = () => {
      const val = $('tag-input').value.trim();
      const tags = val ? val.split(/[,，;；\n]/).map(s => s.trim()).filter(Boolean) : [];
      BookmarkMeta.set(b.id, { tags }).then(() => { b.tags = tags; showToast('标签已保存', 'success'); closeModal(); render(); });
    };
    showModal(); setTimeout(() => $('tag-input').focus(), 50);
  }

  function openNoteModal(b) {
    state.contextBookmark = b;
    dom.modalTitle.textContent = '📝 编辑备注 — ' + (b.title || b.url);
    dom.modalBody.innerHTML = `<div class="modal-field"><label>备注</label><textarea id="note-input" placeholder="添加备注…">${escapeHtml(b.note || '')}</textarea></div>`;
    dom.modalSave.onclick = () => {
      const val = $('note-input').value;
      BookmarkMeta.set(b.id, { note: val }).then(() => { b.note = val; showToast('备注已保存', 'success'); closeModal(); render(); });
    };
    showModal(); setTimeout(() => $('note-input').focus(), 50);
  }

  function openStatusModal(b) {
    state.contextBookmark = b;
    const html = BookmarkBoard.DEFAULT_STATUSES.map(s =>
      `<label class="radio-row${b.status === s.key ? ' checked' : ''}" data-val="${s.key}">
        <input type="radio" name="status" value="${s.key}"${b.status === s.key ? ' checked' : ''} />
        <span class="radio-dot" style="background:${s.color}"></span>
        <span>${s.emoji} ${escapeHtml(s.name)}</span>
      </label>`
    ).join('');
    dom.modalTitle.textContent = '📊 改状态 — ' + (b.title || b.url);
    dom.modalBody.innerHTML = `<div class="modal-field"><label>状态</label><div class="radio-group">${html}</div></div>`;
    dom.modalSave.onclick = () => {
      const checked = dom.modalBody.querySelector('input[name="status"]:checked');
      if (checked) {
        const val = checked.value;
        BookmarkMeta.set(b.id, { status: val }).then(() => { b.status = val; showToast('状态已更新', 'success'); closeModal(); render(); });
      }
    };
    showModal();
  }

  function openPriorityModal(b) {
    state.contextBookmark = b;
    const html = BookmarkBoard.DEFAULT_PRIORITIES.map(p =>
      `<label class="radio-row${b.priority === p.key ? ' checked' : ''}" data-val="${p.key}">
        <input type="radio" name="priority" value="${p.key}"${b.priority === p.key ? ' checked' : ''} />
        <span class="radio-dot" style="background:${p.color}"></span>
        <span>${p.emoji} ${escapeHtml(p.name)}</span>
      </label>`
    ).join('');
    dom.modalTitle.textContent = '🔥 改优先级 — ' + (b.title || b.url);
    dom.modalBody.innerHTML = `<div class="modal-field"><label>优先级</label><div class="radio-group">${html}</div></div>`;
    dom.modalSave.onclick = () => {
      const checked = dom.modalBody.querySelector('input[name="priority"]:checked');
      if (checked) {
        const val = checked.value;
        BookmarkMeta.set(b.id, { priority: val }).then(() => { b.priority = val; showToast('优先级已更新', 'success'); closeModal(); render(); });
      }
    };
    showModal();
  }

  function openAddBookmarkModal() {
    dom.modalTitle.textContent = '+ 添加书签';
    dom.modalBody.innerHTML = `
      <div class="modal-field"><label>标题</label><input id="add-title" type="text" placeholder="网站标题" /></div>
      <div class="modal-field"><label>URL</label><input id="add-url" type="text" placeholder="https://" /></div>
      <div class="modal-field"><label>标签 (可选, 逗号分隔)</label><input id="add-tags" type="text" placeholder="work, 重要" /></div>
    `;
    dom.modalSave.onclick = async () => {
      const title = $('add-title').value.trim();
      const url = $('add-url').value.trim();
      const tags = $('add-tags').value.split(/[,，]/).map(s => s.trim()).filter(Boolean);
      if (!url || !/^https?:\/\//i.test(url)) {
        showToast('请输入有效 URL', 'error'); return;
      }
      const id = 'manual-' + Date.now();
      const newBookmark = { id, title: title || url, url, dateAdded: Date.now() };
      state.bookmarks.push(newBookmark);
      if (tags.length) await BookmarkMeta.set(id, { tags });
      await persistBookmarks();
      showToast('已添加', 'success');
      closeModal();
      await loadAndRender();
    };
    showModal(); setTimeout(() => $('add-title').focus(), 50);
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
      const health = BookmarkHealth.summary(state.bookmarks);
      dom.statsBody.innerHTML = `
        <div class="stat-section">
          <div class="stat-section-title">健康度 (${health.healthy}/${health.total})</div>
          <div style="font-size:12px;line-height:1.7;">
            <div>✅ 健康: <b>${health.healthy}</b></div>
            <div>💀 死链: <b style="color:var(--danger);">${health.dead}</b></div>
            <div>📡 RSS 失效: <b style="color:#F59E0B;">${health.rssBad}</b></div>
            <div>❓ 未检测: <b style="color:var(--text-faint);">${health.unchecked}</b></div>
          </div>
        </div>
        <div class="stat-section">
          <div class="stat-section-title">分类分布</div>
          <div style="overflow-x:auto;">${BookmarkStats.renderBarChart(byCat, { width: 600 })}</div>
        </div>
        <div class="stat-section">
          <div class="stat-section-title">分类占比</div>
          <div class="stat-row">
            <div class="stat-half" style="display:flex;justify-content:center;">${BookmarkStats.renderDonut(byCat)}</div>
            <div class="stat-half">${byCat.slice(0, 6).map(it => `<div style="display:flex;align-items:center;gap:6px;font-size:11px;line-height:1.8;"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${it.color};"></span><span>${it.emoji} ${escapeHtml(it.name)}</span><span style="margin-left:auto;color:var(--text-faint);">${it.count}</span></div>`).join('')}</div>
          </div>
        </div>
        <div class="stat-section">
          <div class="stat-section-title">添加时间线</div>
          ${byMonth.length > 0 ? BookmarkStats.renderTimeline(byMonth) : '<div style="text-align:center;color:var(--text-faint);padding:16px;">无日期数据</div>'}
        </div>
        <div class="stat-section">
          <div class="stat-section-title">收藏 TOP 10 域名</div>
          <ol style="font-size:11px;line-height:1.7;padding-left:20px;">${topHosts.map(h => `<li><code style="background:var(--bg-elev-2);padding:1px 5px;border-radius:3px;font-size:10px;">${escapeHtml(h.host)}</code> <span style="color:var(--text-faint);">× ${h.count}</span></li>`).join('') || '<li style="color:var(--text-faint);">无数据</li>'}</ol>
        </div>
      `;
    }, 50);
  }

  // ===== Health =====
  function openHealthModal() {
    dom.healthModal.classList.remove('hidden');
    const s = BookmarkHealth.summary(state.bookmarks);
    dom.healthSummary.innerHTML = `
      <div style="font-size:11px;line-height:1.6;">
        总计: <b>${s.total}</b> ·
        健康: <b style="color:var(--success);">${s.healthy}</b> ·
        死链: <b style="color:var(--danger);">${s.dead}</b> ·
        RSS 失效: <b style="color:#F59E0B;">${s.rssBad}</b> ·
        未检测: <b style="color:var(--text-faint);">${s.unchecked}</b>
      </div>
    `;
  }

  // 暴露给按钮
  window.__runHealthCheck = async function (type) {
    dom.healthActions.style.display = 'none';
    dom.healthProgress.innerHTML = '<div class="health-progress-text">准备…</div><div class="health-bar"><div class="health-bar-fill" id="hp-fill"></div></div>';
    let done = 0;
    const total = state.bookmarks.length;
    const onResult = async (id, type, result) => {
      const prev = state.meta[id] || {};
      const field = type === 'rss' ? 'rssStatus' : 'deadStatus';
      const tsField = type === 'rss' ? 'rssCheckedAt' : 'deadCheckedAt';
      const errField = type === 'rss' ? 'rssError' : 'deadError';
      const feedField = 'rssFeedUrl';
      const health = Object.assign({}, prev.health || {}, { [field]: result.status, [tsField]: result.checkedAt });
      if (result.error) health[errField] = result.error;
      if (result.code) health[(type === 'rss' ? 'rssCode' : 'deadCode')] = result.code;
      if (result.feedUrl) health[feedField] = result.feedUrl;
      if (result.title) health.rssTitle = result.title;
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
      await BookmarkHealth.checkAll(state.bookmarks, type, { onResult, onProgress, delay: 100, skipFresh: 0 });
      showToast('检测完成', 'success');
    } catch (err) {
      showToast('检测出错: ' + err.message, 'error');
    } finally {
      dom.healthActions.style.display = '';
      const s2 = BookmarkHealth.summary(state.bookmarks);
      dom.healthSummary.innerHTML = `
        <div style="font-size:11px;line-height:1.6;">
          总计: <b>${s2.total}</b> ·
          健康: <b style="color:var(--success);">${s2.healthy}</b> ·
          死链: <b style="color:var(--danger);">${s2.dead}</b> ·
          RSS 失效: <b style="color:#F59E0B;">${s2.rssBad}</b> ·
          未检测: <b style="color:var(--text-faint);">${s2.unchecked}</b>
        </div>
      `;
      render();
    }
  };

  // 绑定健康按钮
  $('health-check-dead').addEventListener('click', () => window.__runHealthCheck('dead'));
  $('health-check-rss').addEventListener('click', () => window.__runHealthCheck('rss'));
  $('health-check-all').addEventListener('click', async () => {
    await window.__runHealthCheck('dead');
    await window.__runHealthCheck('rss');
  });

  // ===== Review =====
  async function openReviewModal() {
    dom.reviewModal.classList.remove('hidden');
    const data = await BookmarkNotify.reviewSummary(state.bookmarks);
    const s = data.settings;
    dom.reviewBody.innerHTML = `
      <div class="review-section">
        <div class="review-section-title">设置</div>
        <div class="modal-field">
          <label><input type="checkbox" id="review-enabled" ${s.enabled ? 'checked' : ''} /> 启用定期提醒 (浏览器通知)</label>
        </div>
        <div class="modal-field">
          <label>间隔 (天)</label>
          <input type="number" id="review-interval" min="1" max="365" value="${s.intervalDays}" />
        </div>
        <div class="modal-field">
          <label>沉睡判定 (多少天未访问)</label>
          <input type="number" id="review-inactive" min="7" max="3650" value="${s.inactiveDays}" />
        </div>
        <div class="modal-field">
          <label>每次最多通知</label>
          <input type="number" id="review-max" min="1" max="20" value="${s.maxNotifications}" />
        </div>
        <button id="review-save" class="btn btn-primary">保存设置</button>
      </div>
      <div class="review-divider"></div>
      <div class="review-section">
        <div class="review-section-title">沉睡书签 (${data.inactiveCount} 个超过 ${s.inactiveDays} 天)</div>
        ${data.inactive.length > 0 ? `<ol class="review-list">${data.inactive.map(b => `<li><a href="${escapeAttr(b.url)}" target="_blank">${escapeHtml(b.title || b.url)}</a> <span style="color:var(--text-faint);">${Math.round((Date.now() - (b.dateAdded || 0)) / 86400000)} 天前添加</span></li>`).join('')}</ol>` : '<div style="color:var(--text-faint);">无</div>'}
      </div>
      <div class="review-divider"></div>
      <div class="review-section">
        <div class="review-section-title">未分类 / 分类不准 (前 10)</div>
        ${data.uncategorized.length > 0 ? `<ol class="review-list">${data.uncategorized.map(b => `<li><a href="${escapeAttr(b.url)}" target="_blank">${escapeHtml(b.title || b.url)}</a></li>`).join('')}</ol>` : '<div style="color:var(--text-faint);">无</div>'}
      </div>
      <div class="review-divider"></div>
      <div class="review-section">
        <div class="review-section-title">最老的 5 个 (可作"重读"推荐)</div>
        <ol class="review-list">${data.oldest.map(b => `<li><a href="${escapeAttr(b.url)}" target="_blank">${escapeHtml(b.title || b.url)}</a></li>`).join('')}</ol>
      </div>
    `;
    $('review-save').addEventListener('click', async () => {
      await BookmarkNotify.setSettings({
        enabled: $('review-enabled').checked,
        intervalDays: parseInt($('review-interval').value) || 7,
        inactiveDays: parseInt($('review-inactive').value) || 60,
        maxNotifications: parseInt($('review-max').value) || 3,
      });
      await BookmarkNotify.schedule();
      showToast('已保存', 'success');
    });
  }

  function showIOModal() {
    dom.ioModal.classList.remove('hidden');
    dom.importResult.textContent = '';
    dom.importResult.className = 'io-result';
  }

  // ===== Utils =====
  function extractHost(url) { return BookmarkClassifier.extractHost(url || ''); }
  function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function escapeAttr(s) { return escapeHtml(s); }
  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    const lower = text.toLowerCase(); const q = query.toLowerCase();
    let out = ''; let i = 0;
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
})();
