// notify.js — 定期提醒 (chrome.alarms + chrome.notifications) + 回顾数据计算

(function (global) {
  'use strict';

  const SETTINGS_KEY = 'reminder_settings';
  const LAST_REVIEW_KEY = 'last_review_at';

  // 默认设置
  const DEFAULT_SETTINGS = {
    enabled: false,                  // 总开关
    intervalDays: 7,                 // 提醒间隔 (天)
    inactiveDays: 60,                // 多少天没访问算"沉睡"
    maxNotifications: 3,             // 每次最多提醒几条
    startHour: 9,                    // 几点提醒 (避免半夜)
    lastNotifiedAt: null,
  };

  async function getSettings() {
    const data = await chrome.storage.local.get([SETTINGS_KEY]);
    return Object.assign({}, DEFAULT_SETTINGS, data[SETTINGS_KEY] || {});
  }

  async function setSettings(patch) {
    const cur = await getSettings();
    const next = Object.assign({}, cur, patch);
    await chrome.storage.local.set({ [SETTINGS_KEY]: next });
    return next;
  }

  // 安排定时提醒
  async function schedule() {
    if (!chrome.alarms) return;
    const s = await getSettings();
    await chrome.alarms.clear('bookmark-review');
    if (s.enabled) {
      chrome.alarms.create('bookmark-review', {
        delayInMinutes: s.intervalDays * 24 * 60,
        periodInMinutes: s.intervalDays * 24 * 60,
      });
    }
  }

  // 计算"沉睡"书签
  // 没有访问时间，用 dateAdded (添加时间) 兜底
  function findInactive(bookmarks, inactiveDays, max) {
    const cutoff = Date.now() - inactiveDays * 24 * 3600 * 1000;
    return bookmarks
      .filter(b => {
        const t = b.dateAdded || b.lastVisitTime || 0;
        return t && t < cutoff;
      })
      .sort((a, b) => (a.dateAdded || 0) - (b.dateAdded || 0))
      .slice(0, max);
  }

  // 计算"长时间未分类"的书签
  function findUncategorizedLong(bookmarks, max) {
    return bookmarks
      .filter(b => b.source === 'fallback' || b.category === 'other')
      .sort((a, b) => (a.dateAdded || 0) - (b.dateAdded || 0))
      .slice(0, max);
  }

  // 随机抽样 N 条 (可作"重读旧书签"推荐)
  function sampleOldest(bookmarks, max) {
    return bookmarks
      .filter(b => b.dateAdded)
      .slice()
      .sort((a, b) => a.dateAdded - b.dateAdded)
      .slice(0, max);
  }

  // 触发通知
  async function notify(inactive) {
    if (!chrome.notifications) return;
    if (inactive.length === 0) return;
    const sample = inactive.slice(0, 3);
    const list = sample.map(b, i => `${i + 1}. ${b.title || b.url}`).join('\n');
    const total = inactive.length;

    try {
      chrome.notifications.create('bookmark-review-' + Date.now(), {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: total > 3 ? `${total} 个沉睡书签等待回顾` : '回顾一下旧书签',
        message: list + (total > 3 ? `\n…还有 ${total - 3} 个` : ''),
        priority: 0,
      });
    } catch (e) {
      console.warn('通知失败:', e);
    }
  }

  // 触发逻辑 (alarm 回调)
  async function onAlarm(alarmName) {
    if (alarmName !== 'bookmark-review') return;
    const s = await getSettings();
    if (!s.enabled) return;
    // 检查时段 (避免凌晨)
    const hour = new Date().getHours();
    if (hour < s.startHour || hour > s.startHour + 4) return;

    // 拉取所有书签 (这里我们没有 bookmarks 缓存, 用 storage 兜底)
    const cached = await chrome.storage.local.get(['review_cache']);
    const bookmarks = cached.review_cache || [];
    if (bookmarks.length === 0) return;

    const inactive = findInactive(bookmarks, s.inactiveDays, s.maxNotifications);
    await notify(inactive);
    await setSettings({ lastNotifiedAt: new Date().toISOString() });
  }

  // 用户主动回顾 (从弹窗/全屏触发)
  // 缓存最新 bookmarks 供 alarm 使用
  async function cacheForReview(bookmarks) {
    // 只保留必要字段
    const slim = bookmarks.map(b => ({
      id: b.id,
      title: b.title,
      url: b.url,
      dateAdded: b.dateAdded,
      category: b.category,
    }));
    await chrome.storage.local.set({ review_cache: slim, [LAST_REVIEW_KEY]: new Date().toISOString() });
  }

  // 弹窗内手动显示回顾数据
  async function reviewSummary(bookmarks) {
    const s = await getSettings();
    const inactive = findInactive(bookmarks, s.inactiveDays, 10);
    const uncategorized = findUncategorizedLong(bookmarks, 10);
    const oldest = sampleOldest(bookmarks, 5);
    return {
      settings: s,
      inactive,
      uncategorized,
      oldest,
      inactiveCount: findInactive(bookmarks, s.inactiveDays, 9999).length,
    };
  }

  global.BookmarkNotify = {
    getSettings,
    setSettings,
    schedule,
    findInactive,
    findUncategorizedLong,
    sampleOldest,
    notify,
    onAlarm,
    cacheForReview,
    reviewSummary,
  };
})(typeof window !== 'undefined' ? window : this);
