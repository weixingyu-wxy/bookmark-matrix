// board.js — 看板视图 (按状态/优先级分组 + 拖拽)
// 字段: bookmark.status, bookmark.priority

(function (global) {
  'use strict';

  // ===== 默认列 =====
  const DEFAULT_STATUSES = [
    { key: 'inbox',    name: '收件箱', emoji: '📥', color: '#64748B' },
    { key: 'reading',  name: '在读',   emoji: '📖', color: '#06B6D4' },
    { key: 'todo',     name: '待办',   emoji: '✅', color: '#10B981' },
    { key: 'done',     name: '完成',   emoji: '✨', color: '#8B5CF6' },
    { key: 'archived', name: '归档',   emoji: '🗄️', color: '#475569' },
  ];

  const DEFAULT_PRIORITIES = [
    { key: 'high',   name: '高', emoji: '🔥', color: '#EF4444' },
    { key: 'normal', name: '中', emoji: '•',  color: '#06B6D4' },
    { key: 'low',    name: '低', emoji: '▽',  color: '#64748B' },
  ];

  // 给书签打状态 / 优先级
  function applyBoardMeta(bookmark, meta) {
    if (!meta) return bookmark;
    return Object.assign({}, bookmark, {
      status: meta.status || 'inbox',
      priority: meta.priority || 'normal',
    });
  }

  // ===== 渲染 =====
  // mode: 'status' | 'priority'
  // onDrop: (id, targetKey) => void — 拖动后回调
  function renderBoard(bookmarks, mode, onDrop) {
    const columns = mode === 'priority' ? DEFAULT_PRIORITIES : DEFAULT_STATUSES;
    const field = mode === 'priority' ? 'priority' : 'status';

    // 分组
    const groups = {};
    columns.forEach(c => groups[c.key] = []);
    bookmarks.forEach(b => {
      const k = b[field] || (field === 'priority' ? 'normal' : 'inbox');
      if (!groups[k]) groups[k] = [];
      groups[k].push(b);
    });

    const html = ['<div class="board">'];
    columns.forEach(col => {
      const items = groups[col.key] || [];
      html.push(`
        <div class="board-col" data-col="${col.key}">
          <div class="board-col-header" style="--col-color: ${col.color}">
            <span class="board-col-emoji">${col.emoji}</span>
            <span class="board-col-name">${escapeHtml(col.name)}</span>
            <span class="board-col-count">${items.length}</span>
          </div>
          <div class="board-col-body" data-col="${col.key}">
            ${items.map(b => renderBoardCard(b, col)).join('')}
            ${items.length === 0 ? '<div class="board-empty">拖动到这里</div>' : ''}
          </div>
        </div>
      `);
    });
    html.push('</div>');
    return html.join('');
  }

  function renderBoardCard(b, col) {
    const cat = window.BookmarkClassifier.CATEGORIES[b.category];
    const host = window.BookmarkClassifier.extractHost(b.url);
    const hasStar = b.starred;
    return `
      <div class="board-card" draggable="true" data-id="${b.id}" style="--cat-color: ${cat.color}">
        <div class="board-card-head">
          <span class="board-card-title">${escapeHtml(b.title || b.url)}</span>
          ${hasStar ? '<span class="board-card-star">★</span>' : ''}
        </div>
        <div class="board-card-host">${escapeHtml(host)}</div>
        <div class="board-card-meta">
          <span class="board-card-cat" style="--cat-color: ${cat.color}">${cat.emoji}</span>
          ${(b.tags || []).slice(0, 2).map(t => `<span class="board-card-tag">#${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // ===== 拖拽 =====
  function bindBoardDrag(container, onDrop) {
    let draggedId = null;

    container.querySelectorAll('.board-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        container.querySelectorAll('.board-col-body').forEach(el => el.classList.remove('drag-over'));
      });
    });

    container.querySelectorAll('.board-col-body').forEach(body => {
      body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        body.classList.add('drag-over');
      });
      body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
      body.addEventListener('drop', (e) => {
        e.preventDefault();
        body.classList.remove('drag-over');
        const targetCol = body.dataset.col;
        if (draggedId && targetCol) {
          onDrop(draggedId, targetCol);
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  global.BookmarkBoard = {
    DEFAULT_STATUSES,
    DEFAULT_PRIORITIES,
    applyBoardMeta,
    renderBoard,
    bindBoardDrag,
    escapeHtml,
  };
})(typeof window !== 'undefined' ? window : this);
