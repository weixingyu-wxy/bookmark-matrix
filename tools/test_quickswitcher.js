// test_quickswitcher.js — Unit tests for Quick Switcher search algorithm
// v1.4.0

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Load quickswitcher.js source in an isolated VM context so we can
// extract the testable functions (scoreBookmark / fuzzyMatch / etc.)
// without triggering the DOM-bound IIFE.
const srcPath = path.resolve(__dirname, '..', 'src', 'quickswitcher.js');
const srcCode = fs.readFileSync(srcPath, 'utf8');

// Build a fake "module" sandbox
const fakeEl = {
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  dataset: {},
  innerHTML: '',
  style: {},
  focus: () => {},
  scrollIntoView: () => {},
  value: ''
};
const sandbox = {
  module: { exports: {} },
  exports: {},
  URL: URL,
  RegExp: RegExp,
  chrome: {
    storage: { local: { _data: {}, async get() { return {}; }, async set() {} } },
    bookmarks: { async getRecent() { return []; } },
    tabs: { create: () => {} }
  },
  document: {
    getElementById: () => fakeEl,
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null
  },
  window: { close: () => {} },
  console: console
};
sandbox.module.exports = sandbox.exports;

vm.createContext(sandbox);
vm.runInContext(srcCode, sandbox);

const QS = sandbox.module.exports;
console.log('Exported keys:', Object.keys(QS));
const { scoreBookmark, fuzzyMatch, extractDomain, search, highlight } = QS;

// ===== fuzzyMatch =====

test('fuzzyMatch: simple subsequence', () => {
  assert.strictEqual(fuzzyMatch('github', 'gth'), true);
  assert.strictEqual(fuzzyMatch('github', 'gih'), true);
  assert.strictEqual(fuzzyMatch('github', 'xyz'), false);
  // 'githb' IS a valid subsequence of 'github' (g-i-t-h-u-b contains g-i-t-h-b in order)
  assert.strictEqual(fuzzyMatch('github', 'githb'), true);
  assert.strictEqual(fuzzyMatch('github', 'zzzzz'), false);
});

test('fuzzyMatch: empty query matches anything', () => {
  assert.strictEqual(fuzzyMatch('github', ''), true);
  assert.strictEqual(fuzzyMatch('', ''), true);
});

// ===== extractDomain =====

test('extractDomain: standard URL', () => {
  assert.strictEqual(extractDomain('https://github.com/foo/bar'), 'github.com');
  assert.strictEqual(extractDomain('http://www.example.com:8080/path'), 'www.example.com');
  assert.strictEqual(extractDomain('https://docs.microsoft.com/en-us/'), 'docs.microsoft.com');
});

test('extractDomain: invalid URL returns empty', () => {
  assert.strictEqual(extractDomain('not a url'), '');
  assert.strictEqual(extractDomain(''), '');
});

// ===== scoreBookmark =====

test('scoreBookmark: exact title match scores highest', () => {
  const b = { title: 'GitHub', url: 'https://github.com' };
  const exact = scoreBookmark(b, 'GitHub');
  const partial = scoreBookmark({ title: 'My GitHub repo', url: 'https://github.com' }, 'GitHub');
  assert.ok(exact > partial);
  assert.ok(exact > 0);
});

test('scoreBookmark: title starts with query scores higher than contains', () => {
  const starts = scoreBookmark({ title: 'GitHub - all your code', url: 'https://github.com' }, 'GitHub');
  const contains = scoreBookmark({ title: 'My GitHub profile', url: 'https://github.com' }, 'GitHub');
  assert.ok(starts > contains);
});

test('scoreBookmark: domain match boosts score', () => {
  // Both titles are neutral so the only signal is URL/domain.
  // withDomain: url has 'github' (+100) + domain 'github.com' contains 'github' (+50) = 150
  // withoutDomain: no match anywhere = 0
  const withDomain = scoreBookmark({ title: 'X', url: 'https://github.com/foo' }, 'github');
  const withoutDomain = scoreBookmark({ title: 'X', url: 'https://example.com/foo' }, 'github');
  assert.ok(withDomain > withoutDomain, `withDomain=${withDomain} should beat withoutDomain=${withoutDomain}`);
});

test('scoreBookmark: tag match scores', () => {
  const b = { title: 'X', url: 'https://x.com', meta: { tags: ['react', 'docs'] } };
  assert.ok(scoreBookmark(b, 'react') > 0);
  assert.ok(scoreBookmark(b, 'docs') > 0);
});

test('scoreBookmark: starred bookmark gets boost', () => {
  const starred = scoreBookmark({ title: 'X', url: 'https://x.com', meta: { starred: true } }, 'x');
  const unstarred = scoreBookmark({ title: 'X', url: 'https://x.com', meta: {} }, 'x');
  assert.ok(starred > unstarred);
});

test('scoreBookmark: no match returns 0', () => {
  assert.strictEqual(scoreBookmark({ title: 'Hello', url: 'https://x.com' }, 'zzz'), 0);
  assert.strictEqual(scoreBookmark({ title: '', url: '' }, 'anything'), 0);
});

test('scoreBookmark: empty query returns 0', () => {
  assert.strictEqual(scoreBookmark({ title: 'A', url: 'https://a.com' }, ''), 0);
});

// ===== search (sorting) =====

test('search: ranks exact match first', () => {
  const books = [
    { id: '1', title: 'GitHub profile', url: 'https://github.com/me' },
    { id: '2', title: 'GitHub', url: 'https://github.com' },
    { id: '3', title: 'My git stuff', url: 'https://example.com' }  // no 'github' — correctly filtered out
  ];
  const results = search('GitHub', books);
  // 'My git stuff' has no 'github' substring and no fuzzy subsequence, so it should be filtered out
  assert.strictEqual(results.length, 2);
  // Exact title match (id='2') must outrank partial title match (id='1')
  assert.strictEqual(results[0].id, '2');
  assert.strictEqual(results[1].id, '1');
});

test('search: limits to 50 results', () => {
  const books = [];
  for (let i = 0; i < 100; i++) books.push({ id: String(i), title: `github ${i}`, url: `https://x.com/${i}` });
  const results = search('github', books);
  assert.strictEqual(results.length, 50);
});

test('search: returns empty for empty query', () => {
  const books = [{ id: '1', title: 'A', url: 'https://a.com' }];
  const results = search('', books);
  assert.strictEqual(results.length, 0);
});

// ===== highlight =====

test('highlight: wraps query in <span class="qs-mark">', () => {
  const out = highlight('Hello World', 'world');
  assert.ok(out.includes('<span class="qs-mark">World</span>'));
});

test('highlight: empty query returns escaped text unchanged', () => {
  assert.strictEqual(highlight('Hello <b>World</b>', ''), 'Hello &lt;b&gt;World&lt;/b&gt;');
});

test('highlight: escapes HTML in text', () => {
  // After escape, raw < and > become &lt; &gt; but the inner text 'script' is still matchable
  const out = highlight('<script>alert(1)</script>', 'script');
  // The literal '<script>' is gone (escaped)
  assert.ok(!out.includes('<script>'));
  // The 'script' substring is wrapped in a mark span
  assert.ok(out.includes('<span class="qs-mark">script</span>'));
  // The escaped version is present (split by the mark span)
  assert.ok(out.includes('&lt;') && out.includes('&gt;'));
});
