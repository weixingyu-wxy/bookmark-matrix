# Bookmark Matrix — 书签矩阵 v1.2.0

> 把 Edge 收藏夹自动整理成扁平现代化的分类矩阵，离线运行，秒级检索。

![Author](https://img.shields.io/badge/Author-Xingyu%20Wei-blue)
![Version](https://img.shields.io/badge/Version-1.2.0-green)
![Offline](https://img.shields.io/badge/Offline-100%25-brightgreen)
![License](https://img.shields.io/badge/License-MIT-orange)

## ✨ 核心特性

- 🔒 **完全离线** (默认) — 主动检测 RSS / 死链时才联网
- 🎯 **18 个分类** — AI、开发、学习、视频、音乐、购物、社交、新闻、游戏、云盘、邮箱、金融、设计、地图、阅读、工具、归档、其他
- 🎨 **扁平现代化 UI** — 暗色/亮色双主题，卡片矩阵，悬浮动效
- ⚡ **秒级检索** — 输入即过滤，关键词高亮

## 🆕 v1.2.0 新增 (相比 v1.1.0)

| 功能 | 描述 | 文件 |
|------|------|------|
| 🩺 **健康检查** | 一键检测死链 + RSS feed 失效 | `health.js` |
| ⏰ **定期回顾** | chrome.alarms + 通知 + 沉睡书签列表 | `notify.js` |
| 📊 **看板视图** | 按状态/优先级拖拽分组 | `board.js` |
| 📱 **PWA 离线安装** | 独立 HTML，可安装到桌面 | `standalone/` |
| 📥 **Edge 书签导入** | HTML 格式导入 (Netscape Bookmark File) | `standalone/app.js` |

## 🆕 v1.1.0 已有功能

- 🏷 **标签** / 📝 **备注** / ⭐ **收藏** (chrome.storage)
- 🖥 **全屏矩阵页** (新标签页)
- 🖱 **拖拽排序分类**
- 📊 **统计图表** (条形/圆环/时间线/Top 域名)
- ↕ **导入/导出** JSON (跨设备同步)

## 📂 项目结构

```
edge-bookmark-matrix/
├── src/                          # Edge 扩展 (manifest v3)
│   ├── manifest.json             v1.2.0
│   ├── popup.html/css/js         弹窗 (800x600)
│   ├── newtab.html/css/js        全屏矩阵页
│   ├── classifier.js             18 分类离线引擎
│   ├── meta.js                   标签/备注/收藏
│   ├── io.js                     导入/导出
│   ├── stats.js                  SVG 统计图
│   ├── health.js                 死链 + RSS 检测
│   ├── board.js                  看板视图
│   ├── notify.js                 定期提醒
│   ├── background.js             service worker
│   └── icons/                    16/48/128 图标
│
├── standalone/                   # PWA 独立部署版
│   ├── index.html                全功能 PWA 入口
│   ├── manifest.webmanifest      PWA 清单
│   ├── sw.js                     PWA service worker
│   ├── app.js                    PWA 主逻辑
│   ├── polyfill.js               chrome.* API polyfill
│   ├── styles.css                全屏样式
│   └── icon-192/512.png          PWA 图标
│
├── tools/                        # 测试 + 图标生成
│   ├── test_classifier.js        73 用例
│   ├── test_io_meta.js           23 用例
│   ├── test_stats.js             25 用例
│   ├── test_health_board_notify.js  55 用例
│   ├── gen_icons.py              扩展图标
│   └── gen_pwa_icons.py          PWA 图标
│
├── README.md
├── DEVELOPER_GUIDE.md     # 傻瓜式全流程操作说明书 (建库到上线)
├── INSTALL.md
├── STORE_GUIDE.md         # Edge 商店提交指南
├── DEPLOY.md              # 部署文档
├── push.ps1               # 一键推 GitHub
├── release.ps1            # 一键打 Release
└── BEGINNER.md            # 新手零基础教程
```

## 🧪 测试

| 测试文件 | 用例 | 状态 |
|---------|------|------|
| `test_classifier.js` | 73 | ✅ 100% |
| `test_io_meta.js` | 23 | ✅ 100% |
| `test_stats.js` | 25 | ✅ 100% |
| `test_health_board_notify.js` | 55 | ✅ 100% |
| **合计** | **176** | **100%** |

## 🖥️ 部署方式

### 方式 A：Edge 扩展 (推荐)
1. `edge://extensions/` → 开启开发人员模式
2. 拖入 `src/` 文件夹
3. 工具栏点击 **▦** 图标
4. 升级 v1.1.0 → v1.2.0: 重新加载即可，配置自动保留

### 方式 B：PWA 独立部署
1. 把 `standalone/` 部署到任意 HTTPS 静态托管 (Netlify / GitHub Pages / Vercel)
2. 浏览器打开 → 自动提示 "添加到主屏幕"
3. 桌面图标启动，跟原生 App 一样
4. 首次启动有 7 条演示数据，可导入 Edge 书签 HTML 替换

**PWA 部署例子**:
```bash
# Netlify
netlify deploy --dir=standalone --prod

# GitHub Pages
# 把 standalone/ 内容 push 到 gh-pages 分支
```

## 🛠️ 分类规则

`classifier.js` 内置 18 个分类。匹配优先级：

```
用户手动覆盖  >  精确域名  >  URL 关键词  >  标题关键词  >  fallback
```

## 🆕 v1.2.0 详解

### 🩺 健康检查
- **死链检测**: HEAD 请求 (fallback GET) 检查 HTTP 状态码
- **RSS 检测**: URL 启发式 + HTML link 发现 + XML 格式验证
- **状态**: ok / dead / unreachable / timeout / expired / invalid
- **缓存**: 24h 内复查跳过，结果存 bookmark_meta.health
- **UI**: 卡片右上角 💀 (死) / 📡 (RSS 失效) 角标

### ⏰ 定期回顾
- **chrome.alarms**: 按设置间隔触发 (默认 7 天)
- **chrome.notifications**: 系统通知，列出 N 条沉睡书签
- **回避时段**: 默认 9-13 点，避免半夜打扰
- **手动回顾**: 弹窗/全屏/PWA 都有 ⏰ 按钮
- **缓存机制**: background.js 定期缓存最新书签供 alarm 使用

### 📊 看板视图
- **状态列**: 收件箱 → 在读 → 待办 → 完成 → 归档 (5 列)
- **优先级列**: 高 / 中 / 低 (3 列)
- **拖拽**: HTML5 DnD，跨列移动即改状态
- **持久化**: bookmark_meta.{status, priority}

### 📱 PWA 独立版
- **localStorage** 替代 chrome.storage
- **Notification API** 替代 chrome.notifications
- **setTimeout** 替代 chrome.alarms
- **手写 chrome.* polyfill** (standalone/polyfill.js)
- **Netscape Bookmark 解析** — 可导入 Edge 导出的 HTML
- **离线可用** — service worker 缓存所有静态资源

## 🛡️ 隐私

- 默认 100% 离线运行
- 主动健康检查才发起网络请求
- 零遥测，零外部 API，零 LLM 调用
- 最小权限：`bookmarks` + `storage` + `alarms` + `notifications`
- host_permissions 仅用于用户主动触发时

## 📦 安装与文档

- **新手 (没装过扩展)** → [BEGINNER.md](./BEGINNER.md) (从零开始, 步步详解)
- **快速参考** → [INSTALL.md](./INSTALL.md) (有经验用户)
- **想自己做扩展上架** → [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) (傻瓜式全流程:建库到上线到维护)
- **Edge 商店提交** → [STORE_GUIDE.md](./STORE_GUIDE.md)
- **功能介绍** → 本 README

两种部署方式: **Edge 扩展** (推荐) 或 **PWA 桌面版**。

---

**Author**: Xingyu Wei
**AI Use Statement**: 本项目由 Mavis (MiniMax Code AI 助理) 协助生成代码与文档，最终由 Xingyu Wei 审核与发布。
