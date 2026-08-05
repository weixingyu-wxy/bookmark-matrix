# Bookmark Matrix — 书签矩阵 v1.4.0

> 把 Edge 收藏夹自动整理成扁平现代化的分类矩阵，离线运行，秒级检索。

![Author](https://img.shields.io/badge/Author-Xingyu%20Wei-blue)
![Version](https://img.shields.io/badge/Version-1.4.0-green)
![Offline](https://img.shields.io/badge/Offline-100%25-brightgreen)
![License](https://img.shields.io/badge/License-MIT-orange)
![Tests](https://img.shields.io/badge/Tests-228%20passed-brightgreen)

## ✨ 核心特性

- 🔒 **完全离线** (默认) — 主动检测 RSS / 死链时才联网
- 🎯 **18 个分类** — AI、开发、学习、视频、音乐、购物、社交、新闻、游戏、云盘、邮箱、金融、设计、地图、阅读、工具、归档、其他
- 🎨 **扁平现代化 UI** — 暗色/亮色双主题，卡片矩阵，悬浮动效
- ⚡ **秒级检索** — 输入即过滤，关键词高亮
- ⌨️ **Quick Switcher** (v1.4.0 新增) — `Ctrl+Shift+B` 任意位置秒开搜任何书签

## 🆕 v1.4.0 新增 (本次升级)

| 功能 | 描述 | 文件 |
|------|------|------|
| ⌨️ **Quick Switcher** | `Ctrl+Shift+B` 唤起，全键盘操作，模糊匹配标题/URL/标签/域名 | `src/quickswitcher.{html,css,js}` |
| ⭐ **Star 高亮显示** | 收藏的书签在结果里带 ★ 标记 | `src/quickswitcher.js` |
| 🎯 **智能排序算法** | 标题精确=1000 / 起始=500 / 包含=200 / URL=100 / 域名=150 / 标签=80 / 模糊=30 / Star=+5 | `src/quickswitcher.js` |
| 🖱 **Ctrl+Click 后台打开** | Enter 直接打开，Ctrl+Enter / Ctrl+Click 后台开新标签 | `src/quickswitcher.js` |
| 🪟 **窗口复用** | 已开则聚焦当前窗口，不开新窗 | `src/background.js` |
| 🧪 **17 个新测试** | fuzzyMatch / scoreBookmark / search / highlight 全覆盖 | `tools/test_quickswitcher.js` |

## 🆕 v1.3.0 (上一个发布)

| 功能 | 描述 |
|------|------|
| 🎨 **智能 favicon** | 离线 LRU 缓存 + 多源 fallback + base64 inline |
| 🌈 **4 套主题** | Dark / Light / Solarized / Nord |
| 📌 **侧栏统计常驻** | 统计卡固定显示，不再切换 |
| 🐛 **多 bug 修复** | manifest 默认 locale、URL 转义、并发读写 |

## 📂 项目结构

```
edge-bookmark-matrix/
├── src/                          # Edge 扩展 (manifest v3, v1.4.0)
│   ├── manifest.json             v1.4.0
│   ├── popup.html/css/js         弹窗 (800x600)
│   ├── newtab.html/css/js        全屏矩阵页
│   ├── quickswitcher.html/css/js Quick Switcher (Ctrl+Shift+B)
│   ├── classifier.js             18 分类离线引擎
│   ├── meta.js                   标签/备注/收藏
│   ├── io.js                     导入/导出
│   ├── stats.js                  SVG 统计图
│   ├── health.js                 死链 + RSS 检测
│   ├── board.js                  看板视图
│   ├── notify.js                 定期提醒
│   ├── favicon.js                智能 favicon (LRU + base64)
│   ├── themes.js                 4 套主题
│   ├── background.js             service worker + commands
│   └── icons/                    16/48/128 图标
│
├── standalone/                   # PWA 独立部署版
│   └── ... (与扩展版功能相同)
│
├── tools/                        # 测试 + 图标生成
│   ├── test_classifier.js              73 用例
│   ├── test_io_meta.js                 23 用例
│   ├── test_stats.js                   25 用例
│   ├── test_health_board_notify.js     55 用例
│   ├── test_themes_favicon.js          35 用例
│   ├── test_quickswitcher.js           17 用例
│   ├── gen_icons.py
│   ├── gen_pwa_icons.py
│   ├── gen_store_promo.py              商店宣传图
│   └── gen_screenshots_placeholders.py
│
├── store/                        # Edge 商店素材
│   ├── listing-zh-CN.txt
│   ├── listing-en.txt
│   ├── privacy-policy.md
│   ├── promo/
│   └── screenshots-needed.md
│
├── CHANGELOG.md                  版本变更日志
├── README.md
├── DEVELOPER_GUIDE.md            傻瓜式全流程操作说明书
├── INSTALL.md
├── STORE_GUIDE.md                Edge 商店提交指南
├── DEPLOY.md                     部署文档
├── push.ps1                      一键推 GitHub
├── release.ps1                   一键打 Release
└── BEGINNER.md                   新手零基础教程
```

## 🧪 测试

| 测试文件 | 用例 | 状态 |
|---------|------|------|
| `test_classifier.js` | 73 | ✅ 100% |
| `test_io_meta.js` | 23 | ✅ 100% |
| `test_stats.js` | 25 | ✅ 100% |
| `test_health_board_notify.js` | 55 | ✅ 100% |
| `test_themes_favicon.js` | 35 | ✅ 100% |
| `test_quickswitcher.js` | 17 | ✅ 100% |
| **合计** | **228** | **100%** |

## ⌨️ Quick Switcher 使用

按 `Ctrl+Shift+B` (Mac: `Command+Shift+B`) 唤起：

```
┌────────────────────────────────────────────┐
│  🔍  github                                │
├────────────────────────────────────────────┤
│  G  GitHub                    github.com   │  ← 方向键上下移动
│  G  GitHub profile            github.com   │     Enter 直接打开
│  G  My git stuff              example.com  │     Esc 关闭
│  ...                                        │     Ctrl+Enter 后台开
└────────────────────────────────────────────┘
```

**算法权重**：
- 标题精确匹配：+1000
- 标题起始：+500
- 标题包含：+200
- URL 包含：+100
- 域名精确：+150
- 域名包含：+50
- 标签包含：+80
- 备注包含：+40
- 标题模糊：+30 (仅当以上全 0)
- 域名模糊：+20 (仅当以上全 0)
- 收藏：+5

## 🖥️ 部署方式

### 方式 A：Edge 扩展 (推荐)
1. `edge://extensions/` → 开启开发人员模式
2. 拖入 `src/` 文件夹
3. 工具栏点击 **▦** 图标
4. 升级 v1.3.0 → v1.4.0: 重新加载即可，配置自动保留
5. 按 `Ctrl+Shift+B` 体验 Quick Switcher

### 方式 B：PWA 独立部署
1. 把 `standalone/` 部署到任意 HTTPS 静态托管
2. 浏览器打开 → 自动提示 "添加到主屏幕"
3. 桌面图标启动，跟原生 App 一样

## 🛡️ 隐私

- 默认 100% 离线运行
- 主动健康检查才发起网络请求
- 零遥测，零外部 API，零 LLM 调用
- 最小权限：`bookmarks` + `storage` + `alarms` + `notifications` + `favicon`
- host_permissions 仅用于用户主动触发时

## 📦 安装与文档

- **新手 (没装过扩展)** → [BEGINNER.md](./BEGINNER.md)
- **快速参考** → [INSTALL.md](./INSTALL.md)
- **想自己做扩展上架** → [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Edge 商店提交** → [STORE_GUIDE.md](./STORE_GUIDE.md)
- **版本变更** → [CHANGELOG.md](./CHANGELOG.md)

---

**Author**: Xingyu Wei
**AI Use Statement**: 本项目由 Mavis (MiniMax Code AI 助理) 协助生成代码与文档，最终由 Xingyu Wei 审核与发布。
