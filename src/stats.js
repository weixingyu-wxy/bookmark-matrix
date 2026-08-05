// stats.js — 统计计算 + SVG 图表 (纯离线, 零依赖)
// 1. 分类分布 (水平条形图)
// 2. 分类占比 (圆环图)
// 3. 时间线 (按月分组折线/柱状图)
// 4. 顶级 host (top N)

(function (global) {
  'use strict';

  // ===== 数据计算 =====
  function byCategory(bookmarks) {
    const counts = {};
    bookmarks.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({
        key,
        name: window.BookmarkClassifier.CATEGORIES[key].name,
        emoji: window.BookmarkClassifier.CATEGORIES[key].emoji,
        color: window.BookmarkClassifier.CATEGORIES[key].color,
        count: counts[key],
      }))
      .sort((a, b) => b.count - a.count);
  }

  function byMonth(bookmarks) {
    // 按 dateAdded 聚合到 YYYY-MM
    const counts = {};
    bookmarks.forEach(b => {
      if (!b.dateAdded) return;
      const d = new Date(b.dateAdded);
      if (isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.keys(counts).sort().map(k => ({ key: k, count: counts[k] }));
  }

  function topHosts(bookmarks, n = 10) {
    const counts = {};
    bookmarks.forEach(b => {
      const h = (b.url || '').match(/^https?:\/\/([^\/]+)/);
      const host = h ? h[1] : '(无效)';
      counts[host] = (counts[host] || 0) + 1;
    });
    return Object.keys(counts)
      .map(k => ({ host: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  // ===== SVG 图表 =====

  // 水平条形图
  function renderBarChart(items, opts = {}) {
    const W = opts.width || 400;
    const rowH = opts.rowH || 24;
    const H = items.length * rowH + 8;
    const labelW = 100;
    const barX = labelW + 8;
    const barW = W - barX - 40; // 留 40px 给数字
    const max = Math.max(...items.map(i => i.count), 1);

    const rows = items.map((it, idx) => {
      const y = idx * rowH + 4;
      const w = Math.max(2, (it.count / max) * barW);
      return `
        <g transform="translate(0, ${y})">
          <text x="${labelW}" y="${rowH / 2 + 4}" text-anchor="end" font-size="11" fill="currentColor" opacity="0.85">${escapeXml(it.emoji || '')} ${escapeXml(it.name || it.key || it.host || '')}</text>
          <rect x="${barX}" y="4" width="${w}" height="${rowH - 10}" rx="3" fill="${it.color || '#06B6D4'}" opacity="0.9"/>
          <text x="${barX + w + 6}" y="${rowH / 2 + 4}" font-size="11" fill="currentColor" font-weight="600">${it.count}</text>
        </g>
      `;
    }).join('');

    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="stat-svg">${rows}</svg>`;
  }

  // 圆环图 (donut)
  function renderDonut(items, opts = {}) {
    const W = opts.width || 240;
    const R = 80;
    const r = 50;
    const cx = W / 2;
    const cy = W / 2;
    const total = items.reduce((s, i) => s + i.count, 0);
    if (total === 0) return `<svg viewBox="0 0 ${W} ${W}" width="${W}" height="${W}"><text x="${cx}" y="${cy}" text-anchor="middle" font-size="12" fill="currentColor">无数据</text></svg>`;

    let acc = 0;
    const arcs = items.map((it) => {
      const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += it.count;
      const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const large = (end - start) > Math.PI ? 1 : 0;
      const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
      const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
      const xi1 = cx + r * Math.cos(end), yi1 = cy + r * Math.sin(end);
      const xi2 = cx + r * Math.cos(start), yi2 = cy + r * Math.sin(start);
      return `<path d="M${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} L${xi1},${yi1} A${r},${r} 0 ${large} 0 ${xi2},${yi2} Z" fill="${it.color || '#06B6D4'}" opacity="0.92"/>`;
    }).join('');

    return `
      <svg viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" class="stat-svg">
        ${arcs}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="24" font-weight="700" fill="currentColor">${total}</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.7">总计</text>
      </svg>
    `;
  }

  // 折线/柱状图 (时间线)
  function renderTimeline(items, opts = {}) {
    const W = opts.width || 600;
    const H = opts.height || 160;
    const padL = 30, padR = 10, padT = 12, padB = 24;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    if (items.length === 0) {
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.6">无日期数据</text></svg>`;
    }

    const max = Math.max(...items.map(i => i.count), 1);
    const stepX = items.length > 1 ? innerW / (items.length - 1) : innerW;

    // 网格线
    const grids = [0.25, 0.5, 0.75, 1].map(t => {
      const y = padT + innerH * (1 - t);
      return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.08"/>`;
    }).join('');

    // 折线点
    const points = items.map((it, i) => {
      const x = padL + i * stepX;
      const y = padT + innerH - (it.count / max) * innerH;
      return { x, y, ...it };
    });

    const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`).join(' ');
    const area = path + ` L${points[points.length - 1].x},${padT + innerH} L${points[0].x},${padT + innerH} Z`;

    // 折线
    const line = `<path d="${path}" fill="none" stroke="var(--accent, #06B6D4)" stroke-width="2" stroke-linejoin="round"/>`;
    const areaPath = `<path d="${area}" fill="var(--accent, #06B6D4)" opacity="0.15"/>`;
    const dots = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--accent, #06B6D4)"/>`).join('');

    // x 轴 label (只显示首/尾/中间)
    const xLabels = points.map((p, i) => {
      const show = i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2);
      if (!show) return '';
      return `<text x="${p.x}" y="${H - 6}" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.7">${escapeXml(p.key)}</text>`;
    }).join('');

    return `
      <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="stat-svg">
        ${grids}
        ${areaPath}
        ${line}
        ${dots}
        ${xLabels}
      </svg>
    `;
  }

  function escapeXml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  global.BookmarkStats = {
    byCategory,
    byMonth,
    topHosts,
    renderBarChart,
    renderDonut,
    renderTimeline,
  };
})(typeof window !== 'undefined' ? window : this);
