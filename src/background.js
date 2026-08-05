// background.js — service worker (MV3)
// 监听书签变化 / 闹钟 / 通知

// ===== Imports =====
// service worker 里需要 IIFE 暴露到 global
// 加载方式: 用 importScripts 加载
try {
  importScripts('classifier.js', 'meta.js', 'notify.js');
} catch (e) {
  console.error('[Bookmark Matrix] importScripts failed', e);
}

const ALARM_REVIEW = 'bookmark-review';

// ===== 安装 =====
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Bookmark Matrix] installed:', details.reason);
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      overrides: {},
      category_order: null,
      bookmark_meta: {},
      theme: 'dark',
      viewMode: 'category',
    });
  }
  if (self.BookmarkNotify) {
    await self.BookmarkNotify.schedule();
  }
});

// ===== 启动 =====
chrome.runtime.onStartup.addListener(async () => {
  if (self.BookmarkNotify) {
    await self.BookmarkNotify.schedule();
    // 缓存当前 bookmarks 供 alarm 使用
    try {
      const tree = await chrome.bookmarks.getTree();
      const flat = flattenBookmarks(tree);
      await self.BookmarkNotify.cacheForReview(flat);
    } catch (e) {
      console.warn('[Bookmark Matrix] cacheForReview failed', e);
    }
  }
});

// ===== 闹钟 =====
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (self.BookmarkNotify) {
    await self.BookmarkNotify.onAlarm(alarm.name);
  }
});

// ===== 书签变化 =====
chrome.bookmarks.onRemoved.addListener(async (id) => {
  const data = await chrome.storage.local.get(['overrides', 'bookmark_meta']);
  if (data.overrides && data.overrides[id]) {
    delete data.overrides[id];
    await chrome.storage.local.set({ overrides: data.overrides });
  }
  if (data.bookmark_meta && data.bookmark_meta[id]) {
    delete data.bookmark_meta[id];
    await chrome.storage.local.set({ bookmark_meta: data.bookmark_meta });
  }
});

chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  // 新书签加入缓存
  try {
    const tree = await chrome.bookmarks.getTree();
    const flat = flattenBookmarks(tree);
    if (self.BookmarkNotify) {
      await self.BookmarkNotify.cacheForReview(flat);
    }
  } catch (e) {}
});

function flattenBookmarks(trees) {
  const out = [];
  function walk(node) {
    if (node.url) {
      out.push({ id: node.id, title: node.title || node.url, url: node.url, dateAdded: node.dateAdded });
    } else if (node.children) {
      node.children.forEach(walk);
    }
  }
  trees.forEach(t => walk(t));
  return out;
}

// 消息总线: 让 popup / newtab 主动缓存 bookmarks
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'cache-for-review' && Array.isArray(msg.bookmarks)) {
    if (self.BookmarkNotify) {
      self.BookmarkNotify.cacheForReview(msg.bookmarks).then(() => sendResponse({ ok: true }));
      return true;
    }
  }
  return false;
});
