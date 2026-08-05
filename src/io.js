// io.js — 导入/导出 (分类规则 + 标签 + 备注 + 收藏)
// 跨设备同步用

(function (global) {
  'use strict';

  const EXPORT_VERSION = 1;
  const APP = 'bookmark-matrix';

  // 导出全部用户数据为 JSON 对象
  async function exportAll() {
    const data = await chrome.storage.local.get(null);
    return {
      app: APP,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        overrides: data.overrides || {},
        category_order: data.category_order || [],
        bookmark_meta: data.bookmark_meta || {},
        theme: data.theme || 'dark',
        viewMode: data.viewMode || 'category',
      },
    };
  }

  // 触发浏览器下载
  async function downloadJson() {
    const obj = await exportAll();
    const json = JSON.stringify(obj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmark-matrix-backup-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return obj;
  }

  // 从文件读取并解析
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result);
          resolve(obj);
        } catch (e) {
          reject(new Error('JSON 解析失败: ' + e.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  // 导入 — 合并策略: 现有 > 导入 (用户不丢数据)
  // mode: 'merge' (合并) | 'replace' (覆盖)
  async function importAll(file, mode = 'merge') {
    const obj = await readFile(file);
    if (obj.app !== APP) {
      throw new Error(`不是 ${APP} 的备份文件 (app=${obj.app})`);
    }
    if (!obj.data) throw new Error('备份文件格式错误');

    const current = await chrome.storage.local.get(null);
    const incoming = obj.data;
    const result = {
      overrides: 0,
      category_order: 0,
      bookmark_meta: 0,
      theme: 0,
      viewMode: 0,
    };

    // overrides
    if (incoming.overrides) {
      const merged = mode === 'replace' ? incoming.overrides : Object.assign({}, incoming.overrides, current.overrides || {});
      await chrome.storage.local.set({ overrides: merged });
      result.overrides = Object.keys(merged).length;
    }

    // category_order
    if (incoming.category_order) {
      await chrome.storage.local.set({ category_order: incoming.category_order });
      result.category_order = incoming.category_order.length;
    }

    // bookmark_meta
    if (incoming.bookmark_meta) {
      const mergedMeta = mode === 'replace'
        ? incoming.bookmark_meta
        : mergeMeta(current.bookmark_meta || {}, incoming.bookmark_meta);
      await chrome.storage.local.set({ bookmark_meta: mergedMeta });
      result.bookmark_meta = Object.keys(mergedMeta).length;
    }

    if (incoming.theme) {
      await chrome.storage.local.set({ theme: incoming.theme });
      result.theme = 1;
    }
    if (incoming.viewMode) {
      await chrome.storage.local.set({ viewMode: incoming.viewMode });
      result.viewMode = 1;
    }

    return { mode, version: obj.version, exportedAt: obj.exportedAt, stats: result };
  }

  // meta 合并: 标签并集, note/starred/color 以新为准, updatedAt 较新者胜
  function mergeMeta(current, incoming) {
    const out = Object.assign({}, current);
    Object.keys(incoming).forEach(id => {
      const inc = incoming[id];
      const cur = current[id] || { tags: [], note: '', starred: false, color: '' };
      const mergedTags = Array.from(new Set([...(cur.tags || []), ...(inc.tags || [])]));
      const incTime = new Date(inc.updatedAt || 0).getTime();
      const curTime = new Date(cur.updatedAt || 0).getTime();
      const winner = incTime >= curTime ? inc : cur;
      out[id] = {
        tags: mergedTags,
        note: winner.note || '',
        starred: !!(inc.starred || cur.starred),
        color: inc.color || cur.color || '',
        updatedAt: new Date().toISOString(),
      };
    });
    return out;
  }

  global.BookmarkIO = {
    exportAll,
    downloadJson,
    readFile,
    importAll,
  };
})(typeof window !== 'undefined' ? window : this);
