// health.js — RSS 失效 + 死链检测
// 默认不主动检测，需用户手动触发 (离线插件原则)
// 存储: bookmark_meta[id].health = { deadStatus, deadAt, deadError, rssStatus, rssAt, rssError, rssFeedUrl }

(function (global) {
  'use strict';

  // ===== URL 启发式 =====
  // 是否像是 RSS / Atom feed 链接
  function isLikelyRSSUrl(url) {
    if (!url) return false;
    const u = url.toLowerCase();
    return /(\/|\.)(rss|atom|feed)(\.xml)?([\/?#]|$)/.test(u) ||
           /\/feed\/?$/.test(u) ||
           /\/rss\/?$/.test(u) ||
           /\/atom\/?$/.test(u) ||
           /type=atom|type=rss|format=rss|format=atom/.test(u) ||
           /\.xml(\?|$)/.test(u);
  }

  // 从 HTML 页面中猜 feed URL
  async function discoverFeedUrl(pageUrl) {
    try {
      const resp = await fetch(pageUrl, { method: 'GET', redirect: 'follow' });
      if (!resp.ok) return null;
      const text = await resp.text();
      // 找 <link rel="alternate" type="application/rss+xml" href="...">
      const m = text.match(/<link[^>]+rel=["']alternate["'][^>]+type=["'](application\/(rss|atom)\+xml|application\/xml)["'][^>]+href=["']([^"']+)["']/i)
              || text.match(/<link[^>]+type=["'](application\/(rss|atom)\+xml|application\/xml)["'][^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i);
      if (m) {
        let feedHref = m[3] || m[2];
        if (feedHref) {
          try { return new URL(feedHref, pageUrl).toString(); } catch (e) { return feedHref; }
        }
      }
    } catch (e) {}
    return null;
  }

  // ===== 通用 fetch =====
  async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, Object.assign({}, opts, { signal: controller.signal }));
    } finally {
      clearTimeout(timer);
    }
  }

  // ===== 死链检测 =====
  // status: 'ok' (2xx/3xx) | 'dead' (4xx/5xx) | 'unreachable' (network error) | 'timeout'
  async function checkDeadLink(url, opts = {}) {
    const timeout = opts.timeout || 6000;
    const method = opts.method || 'HEAD';
    try {
      const resp = await fetchWithTimeout(url, { method, redirect: 'follow' }, timeout);
      if (resp.status >= 200 && resp.status < 400) {
        return { status: 'ok', code: resp.status, checkedAt: new Date().toISOString() };
      }
      // HEAD 有些服务器返回 405/501, 用 GET 重试
      if (resp.status === 405 || resp.status === 501) {
        try {
          const resp2 = await fetchWithTimeout(url, { method: 'GET', redirect: 'follow' }, timeout);
          if (resp2.status >= 200 && resp2.status < 400) {
            return { status: 'ok', code: resp2.status, checkedAt: new Date().toISOString(), note: 'fallback GET' };
          }
          return { status: 'dead', code: resp2.status, checkedAt: new Date().toISOString() };
        } catch (e) {
          return { status: 'dead', code: resp.status, error: String(e.message), checkedAt: new Date().toISOString() };
        }
      }
      return { status: 'dead', code: resp.status, checkedAt: new Date().toISOString() };
    } catch (e) {
      if (e.name === 'AbortError') {
        return { status: 'timeout', checkedAt: new Date().toISOString() };
      }
      return { status: 'unreachable', error: String(e.message || e), checkedAt: new Date().toISOString() };
    }
  }

  // ===== RSS 失效检测 =====
  // 返回 { status: 'ok'|'expired'|'invalid'|'unreachable'|'timeout'|'unknown', feedUrl, title, itemCount, error }
  async function checkRSS(bookmarkUrl, opts = {}) {
    const timeout = opts.timeout || 8000;
    let feedUrl = bookmarkUrl;
    if (!isLikelyRSSUrl(bookmarkUrl)) {
      // 尝试从 HTML 发现
      const discovered = await discoverFeedUrl(bookmarkUrl);
      if (!discovered) {
        return { status: 'unknown', feedUrl: null, error: '未找到 feed' };
      }
      feedUrl = discovered;
    }

    try {
      const resp = await fetchWithTimeout(feedUrl, { method: 'GET', redirect: 'follow' }, timeout);
      if (!resp.ok) {
        return { status: 'expired', feedUrl, code: resp.status, error: 'HTTP ' + resp.status, checkedAt: new Date().toISOString() };
      }
      const text = await resp.text();
      // 简单格式验证
      if (!/<(rss|feed)\b/i.test(text)) {
        return { status: 'invalid', feedUrl, error: '不是有效的 RSS/Atom 文档', checkedAt: new Date().toISOString() };
      }
      // 提取 title 和 item count
      const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
      const itemCount = (text.match(/<item[\s>]/gi) || []).length
                      + (text.match(/<entry[\s>]/gi) || []).length;
      // 提取 lastBuildDate 或最新 pubDate
      const lastDateMatch = text.match(/<(lastBuildDate|updated|published)>([\s\S]*?)<\/\1>/i);
      const lastDate = lastDateMatch ? lastDateMatch[2].trim() : null;
      // 检查 item 日期，看是否过老 (1 年以上 = 失效)
      let stale = false;
      if (lastDate) {
        try {
          const d = new Date(lastDate);
          if (!isNaN(d.getTime())) {
            const ageMs = Date.now() - d.getTime();
            if (ageMs > 365 * 24 * 3600 * 1000) stale = true;
          }
        } catch (e) {}
      }

      return {
        status: stale ? 'expired' : 'ok',
        feedUrl,
        title,
        itemCount,
        lastDate,
        error: stale ? '超过 1 年未更新' : null,
        checkedAt: new Date().toISOString(),
      };
    } catch (e) {
      if (e.name === 'AbortError') {
        return { status: 'timeout', feedUrl, checkedAt: new Date().toISOString() };
      }
      return { status: 'unreachable', feedUrl, error: String(e.message || e), checkedAt: new Date().toISOString() };
    }
  }

  // ===== 批量检测 =====
  // 顺序: 一个一个 (避免瞬时高并发)
  // progress: (done, total, current) => void
  // opts: { skipFresh: 24h 内查过跳过, delay: 每条间隔 ms, onResult: (id, result) => void }
  async function checkAll(bookmarks, type, opts = {}) {
    const { skipFresh = 24, delay = 200, onResult, onProgress } = opts;
    const skipMs = skipFresh * 3600 * 1000;
    const total = bookmarks.length;
    let done = 0;
    const results = [];

    for (const b of bookmarks) {
      const prev = (b.health || {});
      const field = type === 'rss' ? 'rssCheckedAt' : 'deadCheckedAt';
      if (skipFresh && prev[field]) {
        const last = new Date(prev[field]).getTime();
        if (Date.now() - last < skipMs) {
          done++;
          results.push({ id: b.id, skipped: true });
          if (onProgress) onProgress(done, total, b);
          continue;
        }
      }
      let result;
      if (type === 'rss') {
        result = await checkRSS(b.url);
      } else {
        result = await checkDeadLink(b.url);
      }
      done++;
      results.push({ id: b.id, result });
      if (onResult) onResult(b.id, type, result);
      if (onProgress) onProgress(done, total, b);
      if (delay) await new Promise(r => setTimeout(r, delay));
    }
    return results;
  }

  // 健康数据 (显示用)
  function healthOf(bookmark) {
    return bookmark.health || {};
  }

  function badgeOf(bookmark) {
    const h = bookmark.health || {};
    const badges = [];
    if (h.deadStatus && h.deadStatus !== 'ok') {
      const map = { dead: '💀', unreachable: '⚠️', timeout: '⏱' };
      badges.push({ icon: map[h.deadStatus] || '⚠️', kind: 'dead', text: '死链', tip: '死链: ' + (h.deadCode || h.deadError || h.deadStatus) });
    }
    if (h.rssStatus && h.rssStatus !== 'ok' && h.rssStatus !== 'unknown') {
      const map = { expired: '📡', invalid: '❌', unreachable: '⚠️', timeout: '⏱' };
      badges.push({ icon: map[h.rssStatus] || '❓', kind: 'rss', text: 'RSS', tip: 'RSS: ' + (h.rssError || h.rssStatus) });
    }
    return badges;
  }

  // 是否健康
  function isHealthy(bookmark) {
    const h = bookmark.health || {};
    if (h.deadStatus && h.deadStatus !== 'ok') return false;
    if (h.rssStatus && h.rssStatus !== 'ok' && h.rssStatus !== 'unknown') return false;
    return true;
  }

  // 统计健康度
  function summary(bookmarks) {
    let total = bookmarks.length, dead = 0, rssBad = 0, healthy = 0, unchecked = 0;
    bookmarks.forEach(b => {
      const h = b.health || {};
      if (!h.deadCheckedAt && !h.rssCheckedAt) {
        unchecked++;
        return;
      }
      const isDead = h.deadStatus && h.deadStatus !== 'ok';
      const isRssBad = h.rssStatus && h.rssStatus !== 'ok' && h.rssStatus !== 'unknown';
      if (isDead) dead++;
      if (isRssBad) rssBad++;
      if (!isDead && !isRssBad) healthy++;
    });
    return { total, dead, rssBad, healthy, unchecked };
  }

  global.BookmarkHealth = {
    isLikelyRSSUrl,
    discoverFeedUrl,
    checkDeadLink,
    checkRSS,
    checkAll,
    healthOf,
    badgeOf,
    isHealthy,
    summary,
  };
})(typeof window !== 'undefined' ? window : this);
