// test_health_board_notify.js
// 测试 health.js + board.js + notify.js
// 运行: node tools/test_health_board_notify.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ===== Mock chrome API =====
const store = {};
const timers = [];
const alarmHandlers = [];

const mockChrome = {
  storage: {
    local: {
      get: (keys) => new Promise(resolve => {
        if (keys === null || keys === undefined) { resolve(JSON.parse(JSON.stringify(store))); return; }
        if (typeof keys === 'string') keys = [keys];
        const out = {};
        keys.forEach(k => { if (k in store) out[k] = JSON.parse(JSON.stringify(store[k])); });
        resolve(out);
      }),
      set: (data) => new Promise(resolve => {
        Object.keys(data).forEach(k => { store[k] = JSON.parse(JSON.stringify(data[k])); });
        resolve();
      }),
    },
  },
  runtime: { getURL: (p) => p, id: 'test', onInstalled: { addListener: () => {} } },
  tabs: { create: () => {} },
  notifications: { create: () => {} },
  alarms: {
    _handlers: {},
    create: (name, info) => { mockChrome.alarms._handlers[name] = info; },
    clear: (name) => { delete mockChrome.alarms._handlers[name]; },
    onAlarm: { addListener: (cb) => { alarmHandlers.push(cb); } },
  },
};

const ctx = {
  window: {},
  chrome: mockChrome,
  URL: require('url').URL,
  URLSearchParams: require('url').URLSearchParams,
  setTimeout,
  clearTimeout,
  fetch: global.fetch,  // 真实 fetch (测试时可用, 不可用会失败)
};
vm.createContext(ctx);

// 加载分类器
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'classifier.js'), 'utf-8'), ctx);
// meta
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'meta.js'), 'utf-8'), ctx);
// health
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'health.js'), 'utf-8'), ctx);
// board
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'board.js'), 'utf-8'), ctx);
// notify
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'notify.js'), 'utf-8'), ctx);

const Health = ctx.window.BookmarkHealth;
const Board = ctx.window.BookmarkBoard;
const Notify = ctx.window.BookmarkNotify;

let pass = 0, fail = 0;
function assert(name, cond, info) {
  if (cond) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}` + (info ? ' | ' + JSON.stringify(info) : '')); }
}

async function run() {
  // ===== Health 单元测试 =====
  console.log('===== health.js 单元测试 =====\n');

  // isLikelyRSSUrl
  assert('isLikelyRSSUrl: /feed', Health.isLikelyRSSUrl('https://example.com/feed'));
  assert('isLikelyRSSUrl: /rss', Health.isLikelyRSSUrl('https://example.com/rss'));
  assert('isLikelyRSSUrl: .xml', Health.isLikelyRSSUrl('https://example.com/feed.xml'));
  assert('isLikelyRSSUrl: type=atom', Health.isLikelyRSSUrl('https://example.com/?type=atom'));
  assert('isLikelyRSSUrl: false for blog', !Health.isLikelyRSSUrl('https://blog.example.com/post/123'));
  assert('isLikelyRSSUrl: false for null', !Health.isLikelyRSSUrl(null));

  // discoverFeedUrl (需网络, 测试时跳过或 mock)
  // 这里只测试 fallback 行为: 无效 URL 返回 null
  const discovered = await Health.discoverFeedUrl('https://invalid-domain-that-does-not-exist-9999.example.com/');
  assert('discoverFeedUrl returns null for invalid', discovered === null);

  // healthOf / badgeOf / isHealthy
  const cleanB = { id: '1', title: 'x', url: 'http://x' };
  const deadB = { id: '2', title: 'y', url: 'http://y', health: { deadStatus: 'dead', deadCode: 404, deadCheckedAt: '2024-01-01' } };
  const rssBadB = { id: '3', title: 'z', url: 'http://z', health: { rssStatus: 'expired', rssCheckedAt: '2024-01-01' } };
  const mixedB = { id: '4', title: 'w', url: 'http://w', health: { deadStatus: 'ok', rssStatus: 'ok', deadCheckedAt: '2024-01-01', rssCheckedAt: '2024-01-01' } };

  assert('isHealthy clean', Health.isHealthy(cleanB));
  assert('isHealthy dead', !Health.isHealthy(deadB));
  assert('isHealthy rss bad', !Health.isHealthy(rssBadB));
  assert('isHealthy both ok', Health.isHealthy(mixedB));

  // badgeOf
  const cleanBadges = Health.badgeOf(cleanB);
  const deadBadges = Health.badgeOf(deadB);
  const rssBadBadges = Health.badgeOf(rssBadB);
  assert('clean has no badges', cleanBadges.length === 0);
  assert('dead has 1 badge', deadBadges.length === 1 && deadBadges[0].kind === 'dead');
  assert('rss bad has 1 badge', rssBadBadges.length === 1 && rssBadBadges[0].kind === 'rss');
  assert('badges have icon', deadBadges[0].icon.length > 0);

  // summary
  const summary = Health.summary([cleanB, deadB, rssBadB, mixedB]);
  assert('summary total = 4', summary.total === 4);
  assert('summary dead = 1', summary.dead === 1);
  assert('summary rss bad = 1', summary.rssBad === 1);
  assert('summary healthy = 1', summary.healthy === 1);  // only mixedB
  assert('summary unchecked = 1', summary.unchecked === 1);  // cleanB has no health

  // ===== Board 单元测试 =====
  console.log('\n===== board.js 单元测试 =====\n');

  const sample = [
    { id: '1', title: 'Task 1', url: 'http://1', category: 'dev', tags: ['work'] },
    { id: '2', title: 'Task 2', url: 'http://2', category: 'ai', tags: [] },
    { id: '3', title: 'Task 3', url: 'http://3', category: 'dev' },
  ];
  const enriched = sample.map(b => Board.applyBoardMeta(b, { status: 'reading', priority: 'high' }));
  assert('applyBoardMeta sets status', enriched[0].status === 'reading');
  assert('applyBoardMeta sets priority', enriched[0].priority === 'high');

  const defaultBook = Board.applyBoardMeta({ id: 'x' }, {});
  assert('default status = inbox', defaultBook.status === 'inbox');
  assert('default priority = normal', defaultBook.priority === 'normal');

  // renderBoard
  const boardHtml = Board.renderBoard(enriched, 'status');
  assert('renderBoard returns html', boardHtml.includes('<div class="board">'));
  assert('renderBoard has 5 columns', (boardHtml.match(/class="board-col"/g) || []).length === 5);
  assert('renderBoard has 3 cards', (boardHtml.match(/class="board-card"/g) || []).length === 3);
  assert('renderBoard has inbox column', boardHtml.includes('收件箱'));
  assert('renderBoard has reading column', boardHtml.includes('在读'));

  const boardHtmlPrio = Board.renderBoard(enriched, 'priority');
  assert('priority mode has high column', boardHtmlPrio.includes('>高<'));

  // escapeHtml
  assert('escapeHtml: <', Board.escapeHtml('<') === '&lt;');
  assert('escapeHtml: &', Board.escapeHtml('&') === '&amp;');
  assert('escapeHtml: undefined', Board.escapeHtml(undefined) === '');

  // ===== Notify 单元测试 =====
  console.log('\n===== notify.js 单元测试 =====\n');

  const def = await Notify.getSettings();
  assert('default enabled = false', def.enabled === false);
  assert('default intervalDays = 7', def.intervalDays === 7);
  assert('default inactiveDays = 60', def.inactiveDays === 60);
  assert('default maxNotifications = 3', def.maxNotifications === 3);

  await Notify.setSettings({ enabled: true, intervalDays: 14 });
  const updated = await Notify.getSettings();
  assert('setSettings updates enabled', updated.enabled === true);
  assert('setSettings updates interval', updated.intervalDays === 14);
  assert('setSettings preserves inactiveDays', updated.inactiveDays === 60);

  await Notify.setSettings({ intervalDays: 7, enabled: false, inactiveDays: 60, maxNotifications: 3 });

  // findInactive
  const now = Date.now();
  const day = 86400000;
  const bm = [
    { id: '1', title: 'old', url: 'http://1', dateAdded: now - 100 * day },  // 100 天前
    { id: '2', title: 'new', url: 'http://2', dateAdded: now - 10 * day },   // 10 天前
    { id: '3', title: 'no date', url: 'http://3' },
    { id: '4', title: 'oldest', url: 'http://4', dateAdded: now - 200 * day },
  ];
  const inactive = Notify.findInactive(bm, 60, 10);
  assert('findInactive returns 2', inactive.length === 2);
  assert('findInactive oldest first', inactive[0].id === '4' || inactive[0].id === '1');
  assert('findInactive skips recent', !inactive.find(b => b.id === '2'));
  assert('findInactive skips no-date', !inactive.find(b => b.id === '3'));

  // findUncategorizedLong
  const bmWithCat = [
    { id: '1', title: 'a', url: 'http://1', source: 'fallback' },
    { id: '2', title: 'b', url: 'http://2', category: 'other' },
    { id: '3', title: 'c', url: 'http://3', category: 'dev' },
  ];
  const unc = Notify.findUncategorizedLong(bmWithCat, 10);
  assert('uncategorized returns 2', unc.length === 2);

  // sampleOldest
  const oldest = Notify.sampleOldest(bm, 2);
  assert('sampleOldest returns 2', oldest.length === 2);
  assert('sampleOldest oldest first', oldest[0].dateAdded < oldest[1].dateAdded, { first: oldest[0], second: oldest[1] });

  // schedule
  await Notify.setSettings({ enabled: true, intervalDays: 1 });
  await Notify.schedule();
  assert('schedule creates alarm', !!mockChrome.alarms._handlers['bookmark-review']);

  await Notify.setSettings({ enabled: false });
  await Notify.schedule();
  assert('schedule clears alarm when disabled', !mockChrome.alarms._handlers['bookmark-review']);

  // cacheForReview
  await Notify.cacheForReview(bm);
  const cached = await mockChrome.storage.local.get(['review_cache']);
  assert('cacheForReview stores', cached.review_cache && cached.review_cache.length === 4);

  // reviewSummary
  const summary2 = await Notify.reviewSummary(bm);
  assert('reviewSummary has settings', !!summary2.settings);
  assert('reviewSummary has inactive', Array.isArray(summary2.inactive));
  assert('reviewSummary has uncategorized', Array.isArray(summary2.uncategorized));
  assert('reviewSummary has oldest', Array.isArray(summary2.oldest));
  assert('reviewSummary inactiveCount >= 2', summary2.inactiveCount >= 2);

  console.log(`\n===== 结果 =====\n通过: ${pass}, 失败: ${fail}\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
