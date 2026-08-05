// test_classifier.js — 离线测试分类算法
// 用 mock 书签验证分类准确度
// 运行: node tools/test_classifier.js

// 在 Node 中模拟 window
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'classifier.js'), 'utf-8');
// 把 URL/URLSearchParams 注入到 vm context（浏览器/Edge 里有，但 Node vm 沙箱没有）
const ctx = {
  window: {},
  URL: require('url').URL,
  URLSearchParams: require('url').URLSearchParams,
};
vm.createContext(ctx);
vm.runInContext(code, ctx);
const Classifier = ctx.window.BookmarkClassifier;

// ===== Mock 书签 =====
const mockBookmarks = [
  // AI
  { id: '1', title: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: '2', title: 'Claude AI', url: 'https://claude.ai/' },
  { id: '3', title: '通义千问', url: 'https://tongyi.aliyun.com/' },
  { id: '4', title: 'DeepSeek', url: 'https://chat.deepseek.com/' },
  { id: '5', title: 'Cursor Editor', url: 'https://cursor.sh/' },
  { id: '6', title: 'Hugging Face', url: 'https://huggingface.co/' },
  { id: '7', title: 'LLM API 接入指南', url: 'https://example.com/docs/llm-api' },

  // 开发
  { id: '10', title: 'GitHub', url: 'https://github.com/' },
  { id: '11', title: 'Stack Overflow', url: 'https://stackoverflow.com/' },
  { id: '12', title: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
  { id: '13', title: 'LeetCode', url: 'https://leetcode.cn/' },
  { id: '14', title: 'V2EX', url: 'https://v2ex.com/' },
  { id: '15', title: 'npm', url: 'https://www.npmjs.com/package/react' },
  { id: '16', title: '某开发博客', url: 'https://myblog.com/posts/typescript-cheatsheet' },

  // 学习
  { id: '20', title: 'Coursera', url: 'https://www.coursera.org/' },
  { id: '21', title: '菜鸟教程', url: 'https://www.runoob.com/' },
  { id: '22', title: '中国大学MOOC', url: 'https://www.icourse163.org/' },
  { id: '23', title: 'Kaggle Learn', url: 'https://www.kaggle.com/learn' },
  { id: '24', title: '机器学习教程', url: 'https://example.com/ml-tutorial' },

  // 视频
  { id: '30', title: 'Bilibili', url: 'https://www.bilibili.com/' },
  { id: '31', title: 'YouTube', url: 'https://www.youtube.com/' },
  { id: '32', title: '抖音', url: 'https://www.douyin.com/' },
  { id: '33', title: '腾讯视频', url: 'https://v.qq.com/' },

  // 音乐
  { id: '40', title: '网易云音乐', url: 'https://music.163.com/' },
  { id: '41', title: 'QQ 音乐', url: 'https://y.qq.com/' },
  { id: '42', title: 'Spotify', url: 'https://open.spotify.com/' },

  // 购物
  { id: '50', title: '淘宝', url: 'https://www.taobao.com/' },
  { id: '51', title: '京东', url: 'https://www.jd.com/' },
  { id: '52', title: '拼多多', url: 'https://www.pinduoduo.com/' },
  { id: '53', title: 'Amazon', url: 'https://www.amazon.com/' },

  // 社交
  { id: '60', title: '微博', url: 'https://weibo.com/' },
  { id: '61', title: 'Twitter', url: 'https://twitter.com/' },
  { id: '62', title: '知乎', url: 'https://www.zhihu.com/' },
  { id: '63', title: 'Telegram', url: 'https://t.me/' },
  { id: '64', title: '小红书', url: 'https://www.xiaohongshu.com/' },

  // 新闻
  { id: '70', title: '新浪新闻', url: 'https://news.sina.com.cn/' },
  { id: '71', title: '36氪', url: 'https://36kr.com/' },
  { id: '72', title: 'BBC News', url: 'https://www.bbc.com/news' },
  { id: '73', title: 'TechCrunch', url: 'https://techcrunch.com/' },

  // 游戏
  { id: '80', title: 'Steam', url: 'https://store.steampowered.com/' },
  { id: '81', title: 'Epic Games', url: 'https://www.epicgames.com/' },
  { id: '82', title: '原神', url: 'https://genshin.hoyoverse.com/' },
  { id: '83', title: 'Switch 官网', url: 'https://www.nintendo.com/switch' },

  // 云盘
  { id: '90', title: '百度网盘', url: 'https://pan.baidu.com/' },
  { id: '91', title: '阿里云盘', url: 'https://www.alipan.com/' },
  { id: '92', title: 'Google Drive', url: 'https://drive.google.com/' },

  // 邮箱
  { id: '100', title: 'Gmail', url: 'https://mail.google.com/' },
  { id: '101', title: 'QQ 邮箱', url: 'https://mail.qq.com/' },
  { id: '102', title: 'Outlook', url: 'https://outlook.live.com/' },

  // 金融
  { id: '110', title: '支付宝', url: 'https://www.alipay.com/' },
  { id: '111', title: '工商银行', url: 'https://www.icbc.com.cn/' },
  { id: '112', title: '东方财富', url: 'https://www.eastmoney.com/' },
  { id: '113', title: 'Coinbase', url: 'https://www.coinbase.com/' },

  // 设计
  { id: '120', title: 'Figma', url: 'https://www.figma.com/' },
  { id: '121', title: 'Dribbble', url: 'https://dribbble.com/' },
  { id: '122', title: 'Behance', url: 'https://www.behance.net/' },
  { id: '123', title: 'Unsplash', url: 'https://unsplash.com/' },

  // 地图
  { id: '130', title: '百度地图', url: 'https://map.baidu.com/' },
  { id: '131', title: '高德地图', url: 'https://www.amap.com/' },
  { id: '132', title: 'Google Maps', url: 'https://maps.google.com/' },

  // 阅读
  { id: '140', title: '起点中文网', url: 'https://www.qidian.com/' },
  { id: '141', title: '番茄小说', url: 'https://fanqienovel.com/' },
  { id: '142', title: 'Z-Library', url: 'https://z-lib.org/' },
  { id: '143', title: 'Goodreads', url: 'https://www.goodreads.com/' },

  // 工具
  { id: '150', title: 'Google 翻译', url: 'https://translate.google.com/' },
  { id: '151', title: 'DeepL', url: 'https://www.deepl.com/' },
  { id: '152', title: 'TinyPNG', url: 'https://tinypng.com/' },
  { id: '153', title: 'Notion', url: 'https://www.notion.so/' },
  { id: '154', title: 'Wolfram Alpha', url: 'https://www.wolframalpha.com/' },

  // 归档
  { id: '160', title: 'Wayback Machine', url: 'https://web.archive.org/' },

  // 未分类 (边界)
  { id: '200', title: '示例网站', url: 'https://example.com/' },
  { id: '201', title: '某企业内部站', url: 'https://intranet.company.local/' },
  { id: '202', title: '', url: 'https://weird-site-12345.xyz/' },
];

// ===== 期望分类 (用于验证) =====
const expected = {
  '1': 'ai', '2': 'ai', '3': 'ai', '4': 'ai', '5': 'ai', '6': 'ai', '7': 'ai',
  '10': 'dev', '11': 'dev', '12': 'dev', '13': 'dev', '14': 'dev', '15': 'dev', '16': 'dev',
  '20': 'learning', '21': 'learning', '22': 'learning', '23': 'learning', '24': 'learning',
  '30': 'video', '31': 'video', '32': 'video', '33': 'video',
  '40': 'music', '41': 'music', '42': 'music',
  '50': 'shopping', '51': 'shopping', '52': 'shopping', '53': 'shopping',
  '60': 'social', '61': 'social', '62': 'social', '63': 'social', '64': 'social',
  '70': 'news', '71': 'news', '72': 'news', '73': 'news',
  '80': 'game', '81': 'game', '82': 'game', '83': 'game',
  '90': 'cloud', '91': 'cloud', '92': 'cloud',
  '100': 'mail', '101': 'mail', '102': 'mail',
  '110': 'finance', '111': 'finance', '112': 'finance', '113': 'finance',
  '120': 'design', '121': 'design', '122': 'design', '123': 'design',
  '130': 'map', '131': 'map', '132': 'map',
  '140': 'reading', '141': 'reading', '142': 'reading', '143': 'reading',
  '150': 'tools', '151': 'tools', '152': 'tools', '153': 'tools', '154': 'tools',
  '160': 'archive',
  '200': 'other', '201': 'other', '202': 'other',
};

// ===== 运行 =====
const results = Classifier.classifyAll(mockBookmarks);
let pass = 0, fail = 0;
const fails = [];

console.log('========================================');
console.log('分类准确度测试');
console.log('========================================\n');

results.forEach(b => {
  const exp = expected[b.id];
  const got = b.category;
  if (exp === got) {
    pass++;
  } else {
    fail++;
    fails.push({
      title: b.title,
      url: b.url,
      expected: exp,
      got: got,
      source: b.source,
    });
  }
});

const total = results.length;
const acc = (pass / total * 100).toFixed(1);
console.log(`总计: ${total} 条`);
console.log(`通过: ${pass} 条`);
console.log(`失败: ${fail} 条`);
console.log(`准确度: ${acc}%\n`);

if (fails.length > 0) {
  console.log('--- 失败详情 ---');
  fails.forEach(f => {
    console.log(`  ✗ ${f.title} (${f.url})`);
    console.log(`     期望: ${f.expected}, 实际: ${f.got} (${f.source})`);
  });
  console.log('');
}

// ===== 测试 host 提取 =====
console.log('--- host 提取测试 ---');
const hostTests = [
  ['https://www.github.com/foo', 'www.github.com', 'github.com'],
  ['https://chat.openai.com/', 'chat.openai.com', 'openai.com'],
  ['https://pan.baidu.com/s/abc', 'pan.baidu.com', 'baidu.com'],
  ['https://notion.so/abc', 'notion.so', 'notion.so'],
];
hostTests.forEach(([url, expHost, expRoot]) => {
  const h = Classifier.extractHost(url);
  const r = Classifier.extractRootDomain(h);
  const ok = h === expHost && r === expRoot;
  console.log(`  ${ok ? '✓' : '✗'} ${url} → host=${h}, root=${r} (期望 ${expHost}, ${expRoot})`);
});

console.log('\n========================================');
console.log(fail === 0 ? '✅ 全部通过' : `⚠ ${fail} 个失败`);
console.log('========================================');

process.exit(fail > 0 ? 1 : 0);
