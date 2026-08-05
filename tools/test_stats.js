// test_stats.js — 验证 stats.js 统计计算
// 运行: node tools/test_stats.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'stats.js'), 'utf-8');
// classifier 必须先加载 (stats 引用了 window.BookmarkClassifier)
const classifierCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'classifier.js'), 'utf-8');

const ctx = {
  window: {},
  URL: require('url').URL,
  URLSearchParams: require('url').URLSearchParams,
};
vm.createContext(ctx);
vm.runInContext(classifierCode, ctx);
vm.runInContext(code, ctx);
const Stats = ctx.window.BookmarkStats;

// ===== Tests =====
let pass = 0, fail = 0;
function assert(name, cond, info) {
  if (cond) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}` + (info ? ' | ' + JSON.stringify(info) : '')); }
}

const sample = [
  { id: '1', category: 'ai', url: 'https://chatgpt.com/', dateAdded: '2024-01-15T00:00:00Z' },
  { id: '2', category: 'ai', url: 'https://claude.ai/', dateAdded: '2024-02-20T00:00:00Z' },
  { id: '3', category: 'ai', url: 'https://kimi.com/', dateAdded: '2024-03-10T00:00:00Z' },
  { id: '4', category: 'dev', url: 'https://github.com/', dateAdded: '2024-02-05T00:00:00Z' },
  { id: '5', category: 'dev', url: 'https://github.com/user1', dateAdded: '2024-04-01T00:00:00Z' },
  { id: '6', category: 'dev', url: 'https://github.com/user2', dateAdded: '2024-05-01T00:00:00Z' },
  { id: '7', category: 'video', url: 'https://youtube.com/', dateAdded: '2023-12-01T00:00:00Z' },
  { id: '8', category: 'video', url: 'https://bilibili.com/', dateAdded: '2024-04-15T00:00:00Z' },
  { id: '9', category: 'other', url: 'https://example.com/' },
];

// ===== byCategory =====
console.log('===== byCategory =====\n');
const byCat = Stats.byCategory(sample);
assert('returns 4 categories', byCat.length === 4, byCat.map(x => x.key));
assert('sorted by count desc', byCat[0].count >= byCat[byCat.length - 1].count);
const aiItem = byCat.find(x => x.key === 'ai');
assert('ai category has 3', aiItem && aiItem.count === 3);
assert('ai has emoji', aiItem && aiItem.emoji === '🤖');
assert('ai has color', aiItem && aiItem.color === '#7C3AED');

// ===== byMonth =====
console.log('\n===== byMonth =====\n');
const byMonth = Stats.byMonth(sample);
assert('returns 6 months', byMonth.length === 6, byMonth.map(x => x.key));
assert('sorted chronologically', byMonth[0].key === '2023-12' && byMonth[byMonth.length - 1].key === '2024-05');
assert('count correct', byMonth.find(x => x.key === '2024-02').count === 2);
assert('skips entries without date', byMonth.find(x => x.key === '2024-02').count === 2, 'should not include #9');

// ===== topHosts =====
console.log('\n===== topHosts =====\n');
const top = Stats.topHosts(sample, 3);
assert('returns top 3', top.length === 3);
assert('github.com is #1', top[0].host === 'github.com' && top[0].count === 3);
assert('orders by count desc', top[0].count >= top[1].count && top[1].count >= top[2].count);

// ===== renderBarChart =====
console.log('\n===== renderBarChart =====\n');
const barSvg = Stats.renderBarChart(byCat, { width: 400 });
assert('is svg', barSvg.includes('<svg'));
assert('has rect elements', (barSvg.match(/<rect/g) || []).length === 4);
assert('has text labels', (barSvg.match(/<text/g) || []).length >= 4);
assert('uses category color', barSvg.includes('#7C3AED')); // AI color

// ===== renderDonut =====
console.log('\n===== renderDonut =====\n');
const donutSvg = Stats.renderDonut(byCat, { width: 200 });
assert('is svg', donutSvg.includes('<svg'));
assert('has path elements', (donutSvg.match(/<path/g) || []).length === 4);
assert('shows total in center', donutSvg.includes('>9<'));

// empty data
const emptyDonut = Stats.renderDonut([]);
assert('empty data shows no data', emptyDonut.includes('无数据'));

// ===== renderTimeline =====
console.log('\n===== renderTimeline =====\n');
const tlSvg = Stats.renderTimeline(byMonth, { width: 600, height: 160 });
assert('is svg', tlSvg.includes('<svg'));
assert('has line', (tlSvg.match(/<line/g) || []).length >= 1);
assert('has circle dots', (tlSvg.match(/<circle/g) || []).length === 6);
assert('has path', tlSvg.includes('<path'));

// empty timeline
const emptyTl = Stats.renderTimeline([]);
assert('empty timeline shows message', emptyTl.includes('无日期数据'));

// ===== Result =====
console.log(`\n===== 结果 =====\n通过: ${pass}, 失败: ${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
