// favicon.js — 网站图标获取
// 主方案: chrome-extension://<id>/_favicon/?pageUrl=...&size=32
// 回退 1: https://<host>/favicon.ico
// 回退 2: 字母占位

(function (global) {
  'use strict';

  const FAVICON_SIZE = 32;

  // 主 URL — Chrome / Edge 110+ 支持 chrome-extension://<id>/_favicon/
  function getFaviconUrl(pageUrl, size) {
    if (!pageUrl) return null;
    try {
      const extId = (global.chrome && chrome.runtime && chrome.runtime.id) || 'unknown';
      return `chrome-extension://${extId}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=${size || FAVICON_SIZE}`;
    } catch (e) {
      return null;
    }
  }

  // 回退 URL — 直接读 host 的 /favicon.ico
  function getHostFaviconUrl(pageUrl) {
    try {
      const u = new URL(pageUrl);
      return `${u.protocol}//${u.host}/favicon.ico`;
    } catch (e) {
      return null;
    }
  }

  // 首字母 (用于失败回退)
  function getLetter(title, url) {
    const source = (title || url || '').trim();
    if (!source) return '?';
    // 优先中文首字
    const first = source[0];
    return first.toUpperCase();
  }

  // 字母颜色 (从字符串 hash)
  function getLetterColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 55%)`;
  }

  // 渲染 favicon HTML (img + 回退 letter)
  // pageUrl / title / host 用于回退
  function renderFaviconHtml(pageUrl, title, opts = {}) {
    const size = opts.size || 18;
    const main = getFaviconUrl(pageUrl, size);
    const fallback = getHostFaviconUrl(pageUrl);
    const letter = getLetter(title, pageUrl);
    const letterColor = getLetterColor(pageUrl || title || 'x');
    // 用 data-favicon 标记, JS 加载失败时回退
    return `<span class="favicon-wrap" style="width:${size}px;height:${size}px;background:${letterColor};" data-letter="${escapeAttr(letter)}">
      <img class="favicon" src="${main}" data-fallback="${fallback || ''}" alt="" loading="lazy" onload="if(this.naturalWidth===0||this.naturalHeight===0){this._fail=true;this.dispatchEvent(new Event('error'))}" onerror="if(this._fallbackTried){this.style.display='none';this.parentNode.classList.add('letter-shown')}else if(this.dataset.fallback){this._fallbackTried=true;this.src=this.dataset.fallback}else{this.style.display='none';this.parentNode.classList.add('letter-shown')}" />
    </span>`;
  }

  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  global.BookmarkFavicon = {
    getFaviconUrl,
    getHostFaviconUrl,
    getLetter,
    getLetterColor,
    renderFaviconHtml,
  };
})(typeof window !== 'undefined' ? window : this);
