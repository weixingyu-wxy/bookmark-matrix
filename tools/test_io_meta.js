// test_io_meta.js — 测试 meta.js + io.js
// 用 mock chrome.storage.local
// 运行: node tools/test_io_meta.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ===== Mock chrome API =====
const store = {};
const mockChrome = {
  storage: {
    local: {
      get: (keys) => {
        return new Promise((resolve) => {
          if (keys === null || keys === undefined) {
            resolve(JSON.parse(JSON.stringify(store)));
            return;
          }
          if (typeof keys === 'string') keys = [keys];
          const out = {};
          keys.forEach(k => { if (k in store) out[k] = JSON.parse(JSON.stringify(store[k])); });
          resolve(out);
        });
      },
      set: (data) => {
        return new Promise((resolve) => {
          Object.keys(data).forEach(k => { store[k] = JSON.parse(JSON.stringify(data[k])); });
          resolve();
        });
      },
    },
  },
};

// ===== 加载 =====
const ctx = {
  window: {},
  chrome: mockChrome,
  URL: require('url').URL,
  URLSearchParams: require('url').URLSearchParams,
  Blob: global.Blob,
  FileReader: class FileReader {
    readAsText(file) { this.result = file.content; this.onload && this.onload(); }
  },
  document: {
    createElement: () => ({
      click: () => {}, set href(v){}, set download(v){},
    }),
    body: { appendChild: () => {}, removeChild: () => {} },
  },
  URL_createObjectURL: global.URL && global.URL.createObjectURL ? global.URL.createObjectURL : (() => 'blob:test'),
  setTimeout: setTimeout,
};
ctx.URL.createObjectURL = () => 'blob:test';
ctx.URL.revokeObjectURL = () => {};
vm.createContext(ctx);

// meta.js
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'meta.js'), 'utf-8'), ctx);
const Meta = ctx.window.BookmarkMeta;

// io.js
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'io.js'), 'utf-8'), ctx);
const IO = ctx.window.BookmarkIO;

// ===== Tests =====
let pass = 0, fail = 0;
function assert(name, cond, info) {
  if (cond) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}` + (info ? ' | ' + JSON.stringify(info) : '')); }
}

async function run() {
  console.log('===== meta.js 测试 =====\n');

  // 1. set/get
  await Meta.set('1', { tags: ['work', 'react'], note: 'important', starred: true });
  let m = await Meta.get('1');
  assert('set + get tags', JSON.stringify(m.tags) === '["work","react"]', m);
  assert('set + get note', m.note === 'important', m);
  assert('set + get starred', m.starred === true, m);
  assert('updatedAt set', !!m.updatedAt);

  // 2. 合并更新 (tags 追加)
  await Meta.set('1', { tags: ['work', 'react', 'urgent'] });
  m = await Meta.get('1');
  assert('partial update preserves note', m.note === 'important');
  assert('tags merged', m.tags.length === 3 && m.tags.includes('urgent'));

  // 3. getAll / listAllTags
  await Meta.set('2', { tags: ['personal', 'finance'] });
  let all = await Meta.getAll();
  assert('getAll returns 2 entries', Object.keys(all).length === 2, Object.keys(all));
  let tags = await Meta.listAllTags();
  assert('listAllTags includes all', tags.includes('work') && tags.includes('personal') && tags.includes('finance'), tags);

  // 4. applyMeta
  const bookmark = { id: '1', title: 'x', url: 'http://x' };
  const enriched = Meta.applyMeta(bookmark, all['1']);
  assert('applyMeta injects tags', Array.isArray(enriched.tags));
  assert('applyMeta injects starred', enriched.starred === true);

  // 5. remove
  await Meta.remove('2');
  all = await Meta.getAll();
  assert('remove works', !('2' in all));

  console.log('\n===== io.js 测试 =====\n');

  // 6. exportAll
  store.overrides = { '100': 'dev', '101': 'ai' };
  store.category_order = ['ai', 'dev', 'video'];
  store.theme = 'dark';
  store.viewMode = 'category';

  const exported = await IO.exportAll();
  assert('export has app', exported.app === 'bookmark-matrix');
  assert('export has version', exported.version === 1);
  assert('export has exportedAt', !!exported.exportedAt);
  assert('export includes overrides', exported.data.overrides['100'] === 'dev');
  assert('export includes category_order', exported.data.category_order.length === 3);

  // 7. importAll (merge mode, 现有优先)
  store.overrides = { '100': 'social', '200': 'game' }; // 现有 100=social
  const file = { content: JSON.stringify(exported) };
  const result = await IO.importAll(file, 'merge');
  assert('import merge preserves current', store.overrides['100'] === 'social');
  assert('import merge adds new', store.overrides['200'] === 'game');
  assert('import merge keeps imported only', store.overrides['101'] === 'ai', store.overrides);

  // 8. importAll (replace mode)
  store.overrides = { '999': 'other' };
  await IO.importAll(file, 'replace');
  assert('import replace overrides existing', store.overrides['100'] === 'dev' && !('999' in store.overrides), store.overrides);

  // 9. 错误处理
  let err = null;
  try { await IO.importAll({ content: '{"app":"wrong","data":{}}' }, 'merge'); }
  catch (e) { err = e; }
  assert('rejects non-bookmark-matrix file', err && /不是/.test(err.message));

  err = null;
  try { await IO.importAll({ content: 'not json' }, 'merge'); }
  catch (e) { err = e; }
  assert('rejects invalid json', err && /JSON/.test(err.message));

  err = null;
  try { await IO.importAll({ content: '{"app":"bookmark-matrix"}' }, 'merge'); }
  catch (e) { err = e; }
  assert('rejects missing data', err && /格式/.test(err.message));

  console.log(`\n===== 结果 =====\n通过: ${pass}, 失败: ${fail}\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(2); });
