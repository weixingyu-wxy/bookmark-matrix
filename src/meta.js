// meta.js — 标签/备注/收藏 元数据管理
// 数据存储: chrome.storage.local
// 格式: { [bookmarkId]: { tags: [string], note: string, starred: bool, color: string, updatedAt: ISO } }

(function (global) {
  'use strict';

  const KEY = 'bookmark_meta';

  async function getAll() {
    const data = await chrome.storage.local.get([KEY]);
    return data[KEY] || {};
  }

  async function get(bookmarkId) {
    const all = await getAll();
    return all[bookmarkId] || { tags: [], note: '', starred: false, color: '' };
  }

  async function set(bookmarkId, patch) {
    const all = await getAll();
    const prev = all[bookmarkId] || { tags: [], note: '', starred: false, color: '' };
    all[bookmarkId] = Object.assign({}, prev, patch, { updatedAt: new Date().toISOString() });
    await chrome.storage.local.set({ [KEY]: all });
    return all[bookmarkId];
  }

  async function remove(bookmarkId) {
    const all = await getAll();
    delete all[bookmarkId];
    await chrome.storage.local.set({ [KEY]: all });
  }

  // 提取所有出现过的标签 (for tag filter chips)
  async function listAllTags() {
    const all = await getAll();
    const set = new Set();
    Object.values(all).forEach(m => {
      (m.tags || []).forEach(t => set.add(t));
    });
    return Array.from(set).sort();
  }

  // 给书签打标
  function applyMeta(bookmark, meta) {
    if (!meta) return bookmark;
    return Object.assign({}, bookmark, {
      tags: meta.tags || [],
      note: meta.note || '',
      starred: !!meta.starred,
      color: meta.color || '',
    });
  }

  global.BookmarkMeta = {
    getAll, get, set, remove, listAllTags, applyMeta,
    KEY,
  };
})(typeof window !== 'undefined' ? window : this);
