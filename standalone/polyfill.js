// polyfill.js — 在 standalone PWA 模式下模拟 chrome.* API
// 所有持久化用 localStorage

(function () {
  'use strict';

  const NS = 'bmx::';
  function readAll() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NS)) {
        try { out[k.slice(NS.length)] = JSON.parse(localStorage.getItem(k)); }
        catch (e) {}
      }
    }
    return out;
  }

  const storage = {
    get: (keys) => new Promise(resolve => {
      const all = readAll();
      if (keys === null || keys === undefined) {
        resolve(all);
        return;
      }
      if (typeof keys === 'string') keys = [keys];
      const out = {};
      keys.forEach(k => { if (k in all) out[k] = all[k]; });
      resolve(out);
    }),
    set: (data) => new Promise(resolve => {
      Object.keys(data).forEach(k => {
        try { localStorage.setItem(NS + k, JSON.stringify(data[k])); }
        catch (e) { console.error('storage.set failed', e); }
      });
      resolve();
    }),
    remove: (keys) => new Promise(resolve => {
      (Array.isArray(keys) ? keys : [keys]).forEach(k => localStorage.removeItem(NS + k));
      resolve();
    }),
  };

  // chrome.runtime
  const runtime = {
    getURL: (path) => path,  // 相对路径即可
    onInstalled: { addListener: () => {} },
    id: 'standalone',
  };

  // chrome.tabs
  const tabs = {
    create: ({ url, active = true }) => {
      if (active) window.open(url, '_blank');
      else { const a = document.createElement('a'); a.href = url; a.target = '_blank'; document.body.appendChild(a); a.click(); a.remove(); }
    },
  };

  // chrome.notifications
  const notifications = {
    create: (id, opts) => {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        new Notification(opts.title, { body: opts.message, icon: opts.iconUrl });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') new Notification(opts.title, { body: opts.message, icon: opts.iconUrl });
        });
      }
    },
  };

  // chrome.alarms (用 setTimeout 简化)
  const alarms = (() => {
    const handlers = {};
    return {
      create: (name, info) => {
        if (handlers[name]) clearTimeout(handlers[name].timer);
        const ms = (info.delayInMinutes || info.periodInMinutes || 60) * 60 * 1000;
        const fire = () => {
          (handlers[name] && handlers[name].listener) && handlers[name].listener({ name });
          if (info.periodInMinutes) {
            handlers[name].timer = setTimeout(fire, ms);
          }
        };
        handlers[name] = { listener: null, timer: setTimeout(fire, ms) };
      },
      clear: (name) => {
        if (handlers[name]) { clearTimeout(handlers[name].timer); delete handlers[name]; }
      },
      onAlarm: { addListener: (cb) => { Object.keys(handlers).forEach(k => handlers[k].listener = cb); } },
    };
  })();

  // chrome.bookmarks (standalone 模式下用户自己管理，无浏览器 API)
  // 我们暴露 addBookmarks 入口给 app.js 使用
  const bookmarks = {
    getTree: () => Promise.resolve([]),
    get: (id) => Promise.resolve([]),
    remove: (id) => Promise.resolve(),
    update: (id, changes) => Promise.resolve(),
    create: (details) => Promise.resolve({ id: 'local-' + Date.now(), ...details }),
    // 新增: 用户手动管理
    addLocal: null,  // 由 app.js 注入
  };

  // chrome.contextMenus (no-op)
  const contextMenus = {
    create: () => {},
    onClicked: { addListener: () => {} },
  };

  // 暴露
  window.chrome = {
    storage: { local: storage },
    runtime,
    tabs,
    notifications,
    alarms,
    bookmarks,
    contextMenus,
  };
})();
