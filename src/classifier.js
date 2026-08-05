// classifier.js — 离线自动分类引擎
// 策略: 用户覆盖 > 精确域名 > 域名子串 > URL关键词 > 标题关键词 > 其他
// 完全离线，无外部依赖

(function (global) {
  'use strict';

  // ===== 分类规则 =====
  // domains: 精确匹配（含子域）| keywords: 标题/URL 包含任一即命中
  const CATEGORIES = {
    ai: {
      name: 'AI', emoji: '🤖', color: '#7C3AED',
      domains: [
        'chatgpt.com', 'chat.openai.com', 'openai.com', 'claude.ai', 'anthropic.com',
        'gemini.google.com', 'bard.google.com', 'kimi.moonshot.cn', 'kimi.com', 'kimi.ai',
        'moonshot.cn', 'deepseek.com', 'chat.deepseek.com', 'yiyan.baidu.com',
        'qianwen.aliyun.com', 'tongyi.aliyun.com', 'zhipuai.cn', 'zhipu.cn', 'chatglm.cn',
        'wenxin.baidu.com', 'doubao.com', 'doubao-pro.com', 'coze.com', 'coze.cn',
        'yuanbao.tencent.com', 'hunyuan.tencent.com', 'perplexity.ai', 'mistral.ai',
        'groq.com', 'huggingface.co', 'replicate.com', 'midjourney.com', 'runwayml.com',
        'suno.ai', 'cursor.sh', 'cursor.com', 'poe.com', 'you.com', 'phind.com',
        'cerebras.ai', 'together.ai', 'fireworks.ai', 'anyscale.com', 'lepton.ai',
        'ollama.com', 'lmstudio.ai', 'jan.ai', 'gpt4all.io', 'private-gpt.com',
        'fastapi.ai', 'langchain.com', 'llamaindex.ai', 'pinecone.io', 'weaviate.io',
        'chroma.ai', 'qdrant.tech', 'milvus.io', 'arize.com', 'comet.com',
        'weights.gg', 'civitai.com', 'lexica.art', 'promptbase.com', 'flowgpt.com',
      ],
      keywords: ['gpt-4', 'gpt-3', 'llm', '大模型', '提示词', 'prompt', 'llama', 'qwen', 'gemma', 'claude', 'gemini', '智能助手', 'ai 生成', 'aigc', 'embedding', '向量数据库']
    },
    dev: {
      name: '开发', emoji: '💻', color: '#06B6D4',
      domains: [
        'github.com', 'gitlab.com', 'bitbucket.org', 'gitee.com', 'coding.net',
        'stackoverflow.com', 'stackexchange.com', 'csdn.net', 'juejin.cn', 'jianshu.com',
        'segmentfault.com', 'oschina.net', 'cnblogs.com', 'v2ex.com', 'dev.to',
        'medium.com', 'hashnode.com', 'devdocs.io', 'mdn.mozilla.org',
        'developer.mozilla.org', 'developer.android.com', 'developer.apple.com',
        'docs.microsoft.com', 'learn.microsoft.com', 'cloud.google.com', 'aws.amazon.com',
        'console.cloud.google.com', 'portal.azure.com', 'vercel.com', 'netlify.com',
        'render.com', 'railway.app', 'fly.io', 'heroku.com', 'docker.com',
        'hub.docker.com', 'npmjs.com', 'pypi.org', 'crates.io', 'pkg.go.dev',
        'rust-lang.org', 'python.org', 'golang.org', 'nodejs.org', 'typescriptlang.org',
        'reactjs.org', 'vuejs.org', 'angular.io', 'svelte.dev', 'nextjs.org', 'nuxt.com',
        'vitejs.dev', 'webpack.js.org', 'eslint.org', 'prettier.io', 'jestjs.io',
        'cypress.io', 'playwright.dev', 'postman.com', 'insomnia.rest', 'swagger.io',
        'graphql.org', 'hasura.io', 'prisma.io', 'supabase.com', 'firebase.google.com',
        'appwrite.io', 'planetscale.com', 'neon.tech', 'cockroachlabs.com',
        'mongodb.com', 'redis.io', 'postgresql.org', 'mysql.com', 'mariadb.org',
        'elastic.co', 'grafana.com', 'prometheus.io', 'datadoghq.com', 'sentry.io',
        'git-scm.com', 'w3.org', 'caniuse.com', 'regex101.com', 'jsfiddle.net',
        'codepen.io', 'codesandbox.io', 'replit.com', 'stackblitz.com', 'glitch.com',
        'leetcode.com', 'leetcode.cn', 'lintcode.com', 'nowcoder.com', 'acwing.com',
        'codeforces.com', 'luogu.com.cn', 'loj.ac', 'hdu.edu.cn', 'poj.org',
        'vscode.dev', 'code.visualstudio.com', 'jetbrains.com', 'sublimetext.com',
        'atom.io', 'neovim.io', 'vim.org', 'emacswiki.org',
      ],
      keywords: ['代码', '编程', '开发', 'sdk', '前端', '后端', '算法', '数据结构', '面试', 'leetcode', '源码', 'repository', 'api 文档', 'framework', 'library', 'ide', 'debug', 'devops', 'ci/cd']
    },
    learning: {
      name: '学习', emoji: '📚', color: '#10B981',
      domains: [
        'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'udacity.com',
        'pluralsight.com', 'lynda.com', 'imooc.com', 'icourse163.org',
        'xuetangx.com', '51cto.com', 'runoob.com', 'w3school.com.cn', 'w3schools.com',
        'liaoxuefeng.com', 'hackerrank.com', 'codewars.com', 'educative.io',
        'frontendmentor.io', 'freecodecamp.org', 'codecademy.com', 'datacamp.com',
        'kaggle.com', 'kaggle.com/learn', 'openai.com/research', 'arxiv.org',
        'paperswithcode.com', 'distill.pub', 'scholar.google.com', 'semanticscholar.org',
        'pubmed.ncbi.nlm.nih.gov', 'researchgate.net', 'academia.edu', 'jstor.org',
        'scihub', 'cnki.net', 'wanfangdata.com.cn', 'cqvip.com',
        'wikipedia.org', 'wiki.org', 'baike.baidu.com', 'hudong.com',
      ],
      keywords: ['教程', '文档', '学习', 'tutorial', 'course', 'lesson', 'guide', '入门', '基础', '进阶', '手册', 'docs', 'wiki', '百科', '知识', '课程', 'paper', 'thesis', '研究', '学术']
    },
    video: {
      name: '视频', emoji: '🎬', color: '#EF4444',
      domains: [
        'youtube.com', 'youtu.be', 'bilibili.com', 'b23.tv', 'tiktok.com', 'douyin.com',
        'kuaishou.com', 'youku.com', 'v.qq.com', 'iqiyi.com', 'iq.com', 'mgtv.com',
        'tv.sohu.com', 'le.com', 'pptv.com', 'acfun.cn', 'nicovideo.jp', 'vimeo.com',
        'dailymotion.com', 'twitch.tv', 'netflix.com', 'disneyplus.com', 'hbomax.com',
        'primevideo.com', 'paramountplus.com', 'crunchyroll.com', 'tv.cctv.com',
        'm.youtube.com', 'rumble.com', 'odysee.com', 'peertube.org',
      ],
      keywords: ['视频', 'movie', '剧', '动画', 'anime', '综艺', 'tv show', '电影', '短剧', '短片', 'clip', '剧集']
    },
    music: {
      name: '音乐', emoji: '🎵', color: '#F59E0B',
      domains: [
        'music.163.com', 'y.qq.com', 'kugou.com', 'kuwo.cn', 'ximalaya.com',
        'music.apple.com', 'open.spotify.com', 'spotify.com', 'soundcloud.com',
        'bandcamp.com', 'deezer.com', 'tidal.com', 'pandora.com', 'last.fm',
        'mixcloud.com', 'genius.com', 'gaana.com', 'music.youtube.com',
        'yinyue.qq.com', 'ximalaya.cn', 'lizhi.fm', 'qingting.fm',
      ],
      keywords: ['音乐', '歌曲', '专辑', '歌单', 'mv', 'music', 'song', 'album', 'playlist', 'podcast', '广播', '电台', '有声书', '主播']
    },
    shopping: {
      name: '购物', emoji: '🛒', color: '#FB923C',
      domains: [
        'taobao.com', 'tmall.com', 'jd.com', 'pinduoduo.com', 'suning.com',
        'gome.com.cn', 'amazon.com', 'amazon.cn', 'amazon.co.jp', 'ebay.com',
        'aliexpress.com', 'alibaba.com', '1688.com', 'shopify.com', 'etsy.com',
        'walmart.com', 'target.com', 'bestbuy.com', 'ikea.com', 'wayfair.com',
        'asos.com', 'zara.com', 'hm.com', 'uniqlo.com', 'nike.com', 'adidas.com',
        'apple.com/shop', 'mi.com', 'huawei.com', 'vip.com', 'kaola.com',
        'yamibuy.com', 'tmall.hk', 'sasa.com',
      ],
      keywords: ['购物', '商城', '店铺', '商品', '订单', '购物车', 'shop', 'store', 'mall', 'buy', 'sale', '折扣', '优惠券', 'deal', 'price', '拼单', '秒杀']
    },
    social: {
      name: '社交', emoji: '💬', color: '#3B82F6',
      domains: [
        'weibo.com', 'weibo.cn', 'twitter.com', 'x.com', 'facebook.com', 'fb.com',
        'instagram.com', 'linkedin.com', 'reddit.com', 'discord.com', 'discord.gg',
        'telegram.org', 'web.telegram.org', 'whatsapp.com', 'web.whatsapp.com',
        'signal.org', 'messenger.com', 'snapchat.com', 'pinterest.com', 'tumblr.com',
        'mastodon.social', 'threads.net', 'qzone.qq.com', 'renren.com', 'douban.com',
        'xiaohongshu.com', 'xhslink.com', 'taptap.com', 'mastodon.online',
        'bsky.app', 'lobste.rs', 'lemmy.world', 'raddle.me', 'matrix.org',
        'zhihu.com', 't.me',
      ],
      keywords: ['微博', '朋友圈', '动态', 'tweet', '社区', 'community', 'forum', '讨论', '评论', '留言']
    },
    news: {
      name: '新闻', emoji: '📰', color: '#64748B',
      domains: [
        'news.sina.com.cn', 'news.qq.com', 'news.163.com', 'news.sohu.com',
        'news.baidu.com', 'news.cctv.com', 'people.com.cn', 'xinhuanet.com',
        'chinadaily.com.cn', 'huanqiu.com', 'thepaper.cn', 'guancha.cn',
        'ifeng.com', '36kr.com', 'huxiu.com', 'geekpark.net', 'pingwest.com',
        'tmtpost.com', 'sspai.com', 'ithome.com', 'leiphone.com', 'cnbeta.com',
        'solidot.org', 'bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com',
        'washingtonpost.com', 'theguardian.com', 'reuters.com', 'bloomberg.com',
        'wsj.com', 'ft.com', 'economist.com', 'wired.com', 'theverge.com',
        'arstechnica.com', 'techcrunch.com', 'engadget.com', 'cnet.com',
        'rfi.fr', 'dw.com', 'voachinese.com', 'bbcchinese.com',
      ],
      keywords: ['新闻', '资讯', '报道', 'news', 'headline', 'journal', 'press', '媒体', 'rss', '订阅']
    },
    game: {
      name: '游戏', emoji: '🎮', color: '#A855F7',
      domains: [
        'steampowered.com', 'steam.com', 'epicgames.com', 'playstation.com',
        'xbox.com', 'nintendo.com', 'riot.com', 'leagueoflegends.com',
        'minecraft.net', 'roblox.com', 'ea.com', 'ubisoft.com', 'blizzard.com',
        'battle.net', 'ign.com', 'gamespot.com', 'metacritic.com', 'nexon.com',
        'netmarble.com', 'hoyoverse.com', 'mihoyo.com', 'genshin.hoyoverse.com',
        'honkaistarrail.com', 'zenlesszonezero.com', 'wutheringwaves.com',
        'toweroffantasy.com', 'taptap.cn', 'ourplay.net', '3dm.com',
        'gamersky.com', 'pcgames.com.cn', 'a9vg.com', 'yxdown.com',
        'nexusmods.com', 'curseforge.com', 'mod.io', 'speedrun.com',
      ],
      keywords: ['游戏', '电竞', '攻略', 'game', 'gaming', 'esports', 'steam', 'switch', 'ps5', 'xbox', 'mmo', 'rpg', 'fps', '英雄', '副本', 'mod']
    },
    cloud: {
      name: '云盘', emoji: '☁️', color: '#0EA5E9',
      domains: [
        'pan.baidu.com', 'yun.baidu.com', 'cloud.189.cn', 'lanzou.com',
        'lanzoux.com', 'cowtransfer.com', 'wenshushu.cn', 'weiyun.com',
        'pan.quark.cn', 'aliyundrive.com', 'alipan.com', 'drive.google.com',
        'docs.google.com', 'onedrive.com', 'onedrive.live.com', '1drv.ms',
        'dropbox.com', 'mega.nz', 'box.com', 'icloud.com', 'wetransfer.com',
        'mediafire.com', '4shared.com', 'pcloud.com', 'sync.com', 'icedrive.net',
        'terabox.com', 'disk.yandex.com',
      ],
      keywords: ['网盘', '云盘', '云存储', 'cloud', 'drive', 'storage', '网盘下载', '文件分享']
    },
    mail: {
      name: '邮箱', emoji: '📧', color: '#DC2626',
      domains: [
        'mail.google.com', 'gmail.com', 'outlook.live.com', 'outlook.com',
        'hotmail.com', 'live.com', 'mail.qq.com', 'mail.163.com', 'mail.126.com',
        'mail.sina.com', 'mail.yahoo.com', 'mail.ru', 'mail.aol.com',
        'mail.proton.me', 'proton.me', 'tutanota.com', 'zoho.com', 'fastmail.com',
        'yandex.com/mail', 'naver.com', 'qq.com', '126.com', '163.com',
      ],
      keywords: ['邮箱', 'mail', 'email', 'inbox', '收件箱', '邮件']
    },
    finance: {
      name: '金融', emoji: '🏦', color: '#16A34A',
      domains: [
        'alipay.com', 'pay.weixin.qq.com', 'tenpay.com', 'icbc.com.cn', 'ccb.com',
        'abc.com.cn', 'boc.cn', 'bosc.cn', 'pingan.com.cn', 'cmbchina.com',
        'cib.com.cn', 'spdb.com.cn', 'ceb.com.cn', 'cmschina.com', 'bankcomm.com',
        'hxb.com.cn', 'citicbank.com', 'paypal.com', 'wise.com', 'westernunion.com',
        'stripe.com', 'squareup.com', 'venmo.com', 'coinbase.com', 'binance.com',
        'okx.com', 'huobi.com', 'bybit.com', 'kraken.com', 'crypto.com',
        'metamask.io', 'etherscan.io', 'bitcoin.org', 'kucoin.com', 'gate.io',
        'mexc.com', 'bitget.com', 'coinmarketcap.com', 'coingecko.com',
        'coindesk.com', 'cointelegraph.com', 'eastmoney.com', '10jqka.com.cn',
        'hexun.com', 'xueqiu.com', 'tonghuashun.com', 'ths.com.cn',
        'finance.sina.com', 'money.sohu.com', 'wallstreetcn.com',
        'jiemian.com', 'yicai.com', 'stcn.com', 'cnstock.com',
      ],
      keywords: ['银行', '支付', '股票', '基金', '理财', '保险', 'bank', 'pay', 'stock', 'finance', 'investment', 'trading', '钱包', 'wallet', '区块链', 'blockchain', '比特币', '以太坊', '量化']
    },
    design: {
      name: '设计', emoji: '🎨', color: '#EC4899',
      domains: [
        'figma.com', 'sketch.com', 'invisionapp.com', 'adobe.com', 'xd.adobe.com',
        'photoshop.com', 'illustrator.com', 'dribbble.com', 'behance.net',
        'pinterest.com', 'awwwards.com', 'land-book.com', 'onepagelove.com',
        'siteinspire.com', 'typewolf.com', 'myfonts.com', 'fonts.google.com',
        'typekit.com', 'iconfont.cn', 'iconfinder.com', 'flaticon.com',
        'icons8.com', 'undraw.co', 'blush.design', 'coolors.co', 'colorhunt.co',
        'khroma.co', 'color.adobe.com', 'htmlcolorcodes.com', 'pexels.com',
        'unsplash.com', 'pixabay.com', 'stocksnap.io', 'thenounproject.com',
        'lottiefiles.com', 'rive.app', 'framer.com', 'sketch.com',
        'mobbin.com', 'screenshots.pro', 'lapa.ninja', 'saaslandingpage.com',
        'reallygoodemails.com', 'goodemailcopy.com', 'mailchimp.com',
      ],
      keywords: ['设计', '素材', '配色', '字体', '图标', 'design', 'ui', 'ux', 'figma', 'sketch', 'photoshop', 'illustration', 'icon', 'font', 'color', 'palette', 'mockup', '海报', 'banner']
    },
    map: {
      name: '地图', emoji: '🗺️', color: '#22C55E',
      domains: [
        'map.baidu.com', 'maps.baidu.com', 'amap.com', 'gaode.com',
        'maps.google.com', 'google.com/maps', 'map.qq.com', 'map.51ditu.com',
        'openstreetmap.org', 'mapbox.com', 'here.com', 'bing.com/maps',
        'mapquest.com', 'tomtom.com', 'maps.apple.com', 'kakaomap.com',
        'map.kakao.com', 'maps.yandex.com', '2gis.com', 'map.sogou.com',
        'map.bar.com', 'citymapper.com', 'moovit.com', 'uber.com',
      ],
      keywords: ['地图', '导航', '路线', 'map', 'maps', 'navigation', 'route', '坐标', 'gis', '路况', '打车']
    },
    reading: {
      name: '阅读', emoji: '📖', color: '#8B5CF6',
      domains: [
        'qidian.com', 'zongheng.com', '17k.com', 'faloo.com', 'xxsy.net',
        'hongxiu.com', 'jjwxc.net', 'lcread.com', 'yuewen.com', 'fanqienovel.com',
        'fanqie.com', 'qimao.com', 'shuqi.com', 'chaoxs.com', 'xiaoshuo.com',
        'wuxiaworld.com', 'royalroad.com', 'lightnovel.com', 'syosetu.com',
        'kakuyomu.jp', 'wenku.baidu.com', 'docin.com', 'doc88.com',
        'max.book118.com', 'pdfdrive.com', 'zlibrary.com', 'z-lib.org',
        'annas-archive.org', 'gutenberg.org', 'standardebooks.org',
        'goodreads.com', 'douban.com', 'weread.qq.com', 'kindle.cn',
        'amazon.com/kindle', 'h5.read.qq.com', 'reader.yourdou.com',
      ],
      keywords: ['小说', '阅读', '书籍', '电子书', '连载', '章节', 'novel', 'ebook', 'book', 'reading', 'chapter', '轻小说', '网文']
    },
    tools: {
      name: '工具', emoji: '🛠️', color: '#0891B2',
      domains: [
        'translate.google.com', 'fanyi.baidu.com', 'fanyi.youdao.com', 'deepl.com',
        'iciba.com', 'dict.cn', 'youdao.com', 'convertio.co', 'cloudconvert.com',
        'ilovepdf.com', 'smallpdf.com', 'pdfescape.com', 'sejda.com', 'tinyjpg.com',
        'tinypng.com', 'squoosh.app', 'compressor.io', 'base64.guru',
        'jwt.io', 'json.cn', 'jsoneditoronline.org', 'jsonformatter.org',
        'urldecoder.org', 'uuidgenerator.com', 'hashgenerator.com',
        'gtmetrix.com', 'pagespeed.web.dev', 'pingdom.com',
        'who.is', 'ipinfo.io', 'ip-api.com', 'speedtest.net',
        'fast.com', 'processon.com', 'draw.io', 'app.diagrams.net',
        'lucidchart.com', 'mindmeister.com', 'miro.com', 'whimsical.com',
        'notion.so', 'obsidian.md', 'typora.io', 'yuque.com', 'feishu.cn',
        'larksuite.com', 'trello.com', 'asana.com', 'clickup.com', 'monday.com',
        'jira.atlassian.com', 'confluence.atlassian.com', 'slack.com',
        'airtable.com', 'wolframalpha.com', 'mathway.com', 'geogebra.org',
        'desmos.com', 'symbolab.com', 'calculator.net', 'rapidtables.com',
        'unitconverters.net', 'timeanddate.com', 'calendar.google.com',
        'outlook.live.com/calendar', 'raycast.com', 'alfredapp.com',
        'it-tools.tech', 'devutils.com', 'crxjs.com',
      ],
      keywords: ['工具', '转换', '压缩', '加密', '解码', 'tool', 'convert', 'compress', 'encode', 'decode', 'utility', '计算', '查询', '在线', '生成器', 'generator', 'ocr', '翻译']
    },
    archive: {
      name: '归档', emoji: '🗄️', color: '#475569',
      domains: ['archive.org', 'web.archive.org'],
      keywords: ['归档', 'archive', '备份', 'backup', '历史快照', 'wayback', 'snapshot']
    },
    other: {
      name: '其他', emoji: '❓', color: '#94A3B8',
      domains: [], keywords: []
    }
  };

  // 提取 host (e.g. "https://www.github.com/foo" -> "www.github.com")
  function extractHost(url) {
    try {
      const u = new URL(url);
      return u.hostname.toLowerCase();
    } catch (e) {
      return '';
    }
  }

  // 提取根域 (e.g. "www.github.com" -> "github.com")
  function extractRootDomain(host) {
    if (!host) return '';
    const parts = host.split('.');
    if (parts.length <= 2) return host;
    // 简单启发式: 末尾两段是根域，除非最后是 ccTLD/2段 TLD
    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    const ccTLDs = ['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'mil', 'int'];
    if (ccTLDs.includes(secondLast) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
  }

  // 分类入口
  // bookmark: { id, title, url, dateAdded }
  // overrides: { [bookmarkId]: categoryKey } — 用户手动覆盖
  // 返回 { category: 'dev', confidence: 0.95, source: 'domain' | 'override' | 'url' | 'title' | 'fallback' }
  function classify(bookmark, overrides) {
    overrides = overrides || {};
    const id = bookmark.id;

    // 1. 用户覆盖
    if (overrides[id]) {
      const key = overrides[id];
      if (CATEGORIES[key]) {
        return { category: key, confidence: 1.0, source: 'override' };
      }
    }

    const host = extractHost(bookmark.url || '');
    const rootDomain = extractRootDomain(host);
    const urlLower = (bookmark.url || '').toLowerCase();
    const titleLower = (bookmark.title || '').toLowerCase();

    // 2. 精确域名匹配 (含子域)
    // 按 rootDomain 匹配，因为 CATEGORIES 中大多是无 www. 的根域
    if (rootDomain) {
      for (const key of Object.keys(CATEGORIES)) {
        if (key === 'other') continue;
        const cat = CATEGORIES[key];
        if (cat.domains && cat.domains.includes(rootDomain)) {
          return { category: key, confidence: 0.95, source: 'domain' };
        }
        // 也尝试 host 全名
        if (cat.domains && cat.domains.includes(host)) {
          return { category: key, confidence: 0.95, source: 'domain' };
        }
      }
    }

    // 3. URL 关键词
    for (const key of Object.keys(CATEGORIES)) {
      if (key === 'other') continue;
      const cat = CATEGORIES[key];
      if (cat.keywords) {
        for (const kw of cat.keywords) {
          if (urlLower.includes(kw.toLowerCase())) {
            return { category: key, confidence: 0.7, source: 'url' };
          }
        }
      }
    }

    // 4. 标题关键词
    for (const key of Object.keys(CATEGORIES)) {
      if (key === 'other') continue;
      const cat = CATEGORIES[key];
      if (cat.keywords) {
        for (const kw of cat.keywords) {
          if (titleLower.includes(kw.toLowerCase())) {
            return { category: key, confidence: 0.6, source: 'title' };
          }
        }
      }
    }

    // 5. fallback
    return { category: 'other', confidence: 0.0, source: 'fallback' };
  }

  // 批量分类 — 返回扁平结构: [{ ...bookmark, category, confidence, source }]
  function classifyAll(bookmarks, overrides) {
    return bookmarks.map(b => {
      const r = classify(b, overrides);
      return Object.assign({}, b, {
        category: r.category,
        confidence: r.confidence,
        source: r.source
      });
    });
  }

  // 暴露 API
  global.BookmarkClassifier = {
    classify,
    classifyAll,
    CATEGORIES,
    extractHost,
    extractRootDomain
  };
})(typeof window !== 'undefined' ? window : this);
