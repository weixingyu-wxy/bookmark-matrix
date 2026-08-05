# 安装指南 — Bookmark Matrix v1.2.0

> 📖 **完全没装过扩展的小白**: 请先看 **[BEGINNER.md](./BEGINNER.md)** — 那个教程每一步都有详细说明。
> 本文件是有经验用户的快速参考。

两种部署方式: **Edge 扩展** 或 **PWA 独立版**。

---

## 方式 A: Edge 扩展 (推荐, 30 秒)

### 第一步: 打开 Edge 扩展管理页
```
edge://extensions/
```

### 第二步: 开启 "开发人员模式"
页面右上角开关 → 打开。

### 第三步: 加载扩展
**方式 A1** — 拖拽加载 (推荐):
1. 文件资源管理器打开 `D:\AI_Agents\workspace\projects\edge-bookmark-matrix\`
2. 把 `src/` 文件夹 **直接拖到** `edge://extensions/` 页面
3. 看到 "扩展已加载" 即成功

**方式 A2** — 按钮加载:
1. 点 "加载解压缩的扩展"
2. 选 `D:\AI_Agents\workspace\projects\edge-bookmark-matrix\src`
3. 点 "选择文件夹"

### 第四步: 固定到工具栏
1. 点 Edge 右上角 🧩 拼图图标
2. 找 Bookmark Matrix → 点 👁 眼睛图标
3. 工具栏就有 ▦ 图标了

✅ 完成！点击 **▦** 开始用。

---

## 方式 B: PWA 独立部署 (可装桌面)

适合:
- 想要桌面图标 (像原生 App)
- 想跨浏览器用 (Chrome / Firefox / Safari)
- 想脱离 Edge 扩展

### 最简部署: Netlify Drop
1. 打开 https://app.netlify.com/drop
2. 把 `standalone/` 文件夹拖进页面
3. 自动获得 HTTPS URL
4. 用 Edge 打开这个 URL
5. 浏览器地址栏右侧会出现 "安装 Bookmark Matrix" 按钮
6. 点安装 → 桌面有图标

### GitHub Pages 部署
```bash
cd D:\AI_Agents\workspace\projects\edge-bookmark-matrix\standalone
git init
git add .
git commit -m "Bookmark Matrix PWA"
gh repo create bookmark-matrix --public --source=. --remote=origin --push
# 仓库 Settings → Pages → Source: main branch / root → Save
# 几分钟内可用: https://<user>.github.io/bookmark-matrix/
```

### 本地测试
```bash
cd standalone
python -m http.server 8000
# 访问 http://localhost:8000
# 首次启动: 7 条演示数据, 可导入 HTML 替换
```

### 首次使用
- 7 条演示数据 (ChatGPT, GitHub, YouTube 等)
- 顶部 **+** 按钮可手动添加
- 顶部 **↕** → "导入 Edge 书签 HTML":
  1. Edge 地址栏 `edge://bookmarks/`
  2. 右上角 ⋯ → "导出书签" → 保存 HTML
  3. 回到 PWA → 选择 HTML 文件
  4. 自动解析并填充

---

## 🎯 首次使用 (扩展版)

1. Edge 加几个收藏 (Ctrl+D)
2. 工具栏 **▦** → 看到分类矩阵
3. **⛶** 进全屏 → 左侧拖动分类排序
4. 右键任意书签 → 编辑标签/备注/收藏
5. **🩺** 顶部按钮 → 检测死链 + RSS 状态
6. **⏰** 顶部按钮 → 设置定期提醒
7. **📊** 顶部按钮 → 看统计图表
8. **↕** 顶部按钮 → 导出/导入备份

---

## 🔧 常见问题

### Q: 弹窗空白？
A: 扩展"网站访问权限"必须为"所有站点"；`edge://extensions/` 点 ↻ 重新加载。

### Q: 分类不准？
A: 右键 → "移动到分类" 选正确分类；或编辑 `classifier.js` 改规则。

### Q: 怎么同步多设备？
A: 设备 A 点 ↕ 导出 JSON；设备 B 点 ↕ 合并导入。

### Q: 标签存在哪？
A: `chrome.storage.local`（设备本地）。卸载扩展会清空，原始书签不受影响。

### Q: PWA 模式数据会丢吗？
A: PWA 数据存浏览器 localStorage，浏览器卸载会清。换浏览器/换设备需手动导入 JSON 备份。

### Q: 健康检查要联网吗？
A: 是的。但默认不主动检测，必须用户点 **🩺** 按钮才发起请求。结果缓存 24h。

### Q: 定期提醒会打扰吗？
A: 默认关闭。开启后只在 9-13 点之间通知，默认 7 天一次，每次 3 条。

### Q: PWA 和扩展能同时用吗？
A: 可以。数据相互独立（不同 storage 后端）。可以用 ↕ 导出导入互通。

### Q: 怎么更新？
A: 修改文件 → `edge://extensions/` 点 ↻ 重新加载即可。

### Q: 完全离线？
A: 默认是。健康检查才联网，可在 ↕ 模态关闭。PWA 完全离线 (service worker 缓存)。

### Q: 跟 Chrome 兼容吗？
A: 是的，标准 MV3 扩展，Chrome 88+ / Edge 88+ / Brave / Arc 都行。

---

## 🗑️ 卸载

**扩展**: `edge://extensions/` → 找 Bookmark Matrix → 删除
**PWA**: 浏览器设置 → 应用/Application → 找到 Bookmark Matrix → 卸载

---

## ⚠️ 常见加载错误

### "Default locale was specified, but _locales subtree is missing"

**v1.2.0 早期版本问题**，已修复（删除了 `default_locale` 字段）。
如遇此错：重新下载最新 zip → 删除老 src → 用新 src 重新加载。

---

## 📁 文件路径速查

| 文件 | 用途 |
|------|------|
| `src/manifest.json` | 扩展清单 v1.2.0 |
| `src/classifier.js` | 18 分类规则 |
| `src/health.js` | 死链 + RSS 检测 |
| `src/notify.js` | 定期提醒 |
| `src/board.js` | 看板视图 |
| `src/popup.html` + `.css` + `.js` | 弹窗 (含 health/review) |
| `src/newtab.html` + `.css` + `.js` | 全屏页 (含 health/review/board) |
| `standalone/index.html` | PWA 入口 |
| `standalone/manifest.webmanifest` | PWA 清单 |
| `standalone/sw.js` | PWA service worker |
| `standalone/app.js` | PWA 主逻辑 |
| `standalone/polyfill.js` | chrome API polyfill |
| `src/icons/icon{16,48,128}.png` | 扩展图标 |
| `standalone/icon-{192,512}.png` | PWA 图标 |

---

**Author**: Xingyu Wei
**AI Use Statement**: 本文档由 Mavis 协助生成。
