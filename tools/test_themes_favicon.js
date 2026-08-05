// test_themes_favicon.js
// 运行: node tools/test_themes_favicon.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'themes.js'), 'utf-8');
const faviconCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'favicon.js'), 'utf-8');
const classifierCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'classifier.js'), 'utf-8');

const ctx = {
  window: {},
  chrome: { runtime: { id: 'test-id' } },
  URL: require('url').URL,
};
// favicon.js 拿 window.chrome (因为 IIFE 传 window)
ctx.window.chrome = ctx.chrome;
// mock document.documentElement.style.setProperty
const props = {};
ctx.document = {
  documentElement: {
    style: {
      setProperty(k, v) { props[k] = v; },
    },
  },
};
ctx._props = props;
vm.createContext(ctx);

vm.runInContext(classifierCode, ctx);
vm.runInContext(code, ctx);
vm.runInContext(faviconCode, ctx);

const Themes = ctx.window.BookmarkThemes;
const Favicon = ctx.window.BookmarkFavicon;

let pass = 0, fail = 0;
function assert(name, cond, info) {
  if (cond) { pass++; console.log(`  [PASS] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}` + (info ? ' | ' + JSON.stringify(info) : '')); }
}

console.log('===== themes.js =====\n');

// 主题列表
const list = Themes.getThemeList();
assert('has 4 themes', list.length === 4, list.map(t => t.id));
assert('midnight present', !!list.find(t => t.id === 'midnight'));
assert('minimal present', !!list.find(t => t.id === 'minimal'));
assert('cyber present', !!list.find(t => t.id === 'cyber'));
assert('warm present', !!list.find(t => t.id === 'warm'));
assert('cyber has no light support', list.find(t => t.id === 'cyber').lightSupported === false);

// 主题结构
const midnight = Themes.getTheme('midnight');
assert('midnight has vars', !!midnight.vars);
assert('midnight dark vars has --bg', !!midnight.vars.dark['--bg']);
assert('midnight light vars has --bg', !!midnight.vars.light && !!midnight.vars.light['--bg']);
assert('midnight has 18 categories', Object.keys(midnight.categories.dark).length === 18);

// 应用主题
const result = Themes.applyTheme('midnight', 'dark');
assert('applyTheme returns theme', result.id === 'midnight');
assert('applyTheme sets --bg', ctx._props['--bg'] === '#0A0A0F');
assert('applyTheme sets --accent', ctx._props['--accent'] === '#818CF8');

// 应用不存在的 theme
const fallback = Themes.applyTheme('nonexistent', 'dark');
assert('applyTheme fallback to default', fallback.id === 'midnight');

// syncCategoryColors
Themes.syncCategoryColors('midnight', 'dark');
assert('syncCategoryColors updates AI color', ctx.window.BookmarkClassifier.CATEGORIES.ai.color === '#A78BFA');
assert('syncCategoryColors updates dev color', ctx.window.BookmarkClassifier.CATEGORIES.dev.color === '#60A5FA');

Themes.syncCategoryColors('midnight', 'light');
assert('syncCategoryColors light AI', ctx.window.BookmarkClassifier.CATEGORIES.ai.color === '#7C3AED');

// 重置
Themes.syncCategoryColors('midnight', 'dark');

console.log('\n===== favicon.js =====\n');

// 主方案
const url1 = Favicon.getFaviconUrl('https://github.com/');
assert('getFaviconUrl returns extension URL', url1 && url1.startsWith('chrome-extension://test-id/_favicon/'));
assert('getFaviconUrl encodes pageUrl', url1.includes(encodeURIComponent('https://github.com/')));
assert('getFaviconUrl has size', url1.includes('size=32'));

// null
assert('getFaviconUrl null for null', Favicon.getFaviconUrl(null) === null);

// 回退
const fb = Favicon.getHostFaviconUrl('https://github.com/foo');
assert('getHostFaviconUrl returns protocol+host+path', fb === 'https://github.com/favicon.ico');
assert('getHostFaviconUrl null for invalid', Favicon.getHostFaviconUrl('not a url') === null);

// 首字母
assert('getLetter: title', Favicon.getLetter('GitHub', '') === 'G');
assert('getLetter: chinese', Favicon.getLetter('百度', '') === '百');
assert('getLetter: url fallback', Favicon.getLetter('', 'https://example.com/') === 'H');
assert('getLetter: empty', Favicon.getLetter('', '') === '?');

// letter color (hash 一致性)
const c1 = Favicon.getLetterColor('https://github.com');
const c2 = Favicon.getLetterColor('https://github.com');
assert('getLetterColor is stable', c1 === c2);
const c3 = Favicon.getLetterColor('https://gitlab.com');
assert('getLetterColor differs for different urls', c1 !== c3);
assert('getLetterColor is hsl', c1.startsWith('hsl('));

// renderFaviconHtml
const html = Favicon.renderFaviconHtml('https://github.com/', 'GitHub', { size: 20 });
assert('html has favicon-wrap', html.includes('class="favicon-wrap"'));
assert('html has img', html.includes('<img class="favicon"'));
assert('html has letter data', html.includes('data-letter="G"'));
assert('html has onerror handler', html.includes('onerror='));
assert('html has size', html.includes('width:20px'));

console.log(`\n===== 结果 =====\n通过: ${pass}, 失败: ${fail}\n`);
process.exit(fail > 0 ? 1 : 0);
