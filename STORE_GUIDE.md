# 📦 上架 Microsoft Edge Add-ons 商店 — 完整指南

> 把 Bookmark Matrix 发布到 Microsoft Edge 扩展商店，让全世界用户安装。

---

## 💰 准备工作

### 1. 注册开发者账号

1. 打开 https://partner.microsoft.com/dashboard/microsoftedge/public/login
2. 用 **Microsoft 账号** 登录（Outlook / Hotmail 邮箱）
3. 选择账户类型:
   - **Individual** (个人) — $19 USD 一次性
   - **Company** (公司) — $99 USD (有 D-U-N-S 编号)
4. 填写:
   - 姓名 (拼音或中文)
   - 联系方式 (邮箱 + 电话)
   - 付款方式: Visa / Mastercard / PayPal
5. **支付 $19**
6. 邮箱会收到确认 → 进入 Partner Center

> 💡 **$19 是永久性的**, 之后所有扩展上架都不再收费。

### 2. 准备扩展包

Edge 商店只接受 **.zip 文件**, 必须符合:

- ✅ 直接打包 `src/` 目录的内容
- ✅ 不含父目录
- ✅ 不含 `.DS_Store` / `__MACOSX` / `.git` 等
- ✅ 必须是干净 zip (PowerShell 的 `Compress-Archive` 即可)
- ✅ **zip 内第一层就是 manifest.json + 所有 src 文件**, 不允许有额外目录

**重要区分**:
- ✅ **`edge-bookmark-matrix-v1.3.0-src.zip`** (63 KB) — 正确, 商店上传用
- ❌ `edge-bookmark-matrix-v1.3.0-full.zip` (348 KB) — 错误! 包含 standalone/store/tools, 会被拒

**打包命令** (必须在仓库根目录运行):
```powershell
Compress-Archive -Path "src\*" -DestinationPath "edge-bookmark-matrix-v1.3.0.zip" -Force
```

**验证 zip 结构** (在文件资源管理器打开 zip, 应该看到):
```
edge-bookmark-matrix-v1.3.0.zip
├── manifest.json     ← 在根!
├── popup.html
├── popup.js
├── newtab.html
├── newtab.js
├── classifier.js
├── ... (其他 src 文件)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

**不能做**:
- ❌ 上传 full.zip (会报"包含 manifest.json src 的目录之外不允许有文件或目录")
- ❌ 把 src 文件夹整个打包 (会嵌套一层 src/)
- ❌ 包含 .git / .DS_Store / __pycache__ 等
- ❌ 包含 standalone/ (PWA, 不是扩展)
- ❌ 包含 tools/ (开发脚本)
- ❌ 包含 store/ (上架资料)
- ❌ 包含 README.md / INSTALL.md (开发文档)
- ❌ 引用未声明的 CDN / 外部资源
- ❌ 混淆代码
- ❌ 自动更新代码

### 3. 准备商店资料

需要准备 (中英双份):
- 名称 (45 字符内)
- 简短总结 (132 字符内)
- 详细描述 (8000 字符内)
- 类别
- 图标 4 套
- 截图 1-10 张
- 隐私政策 URL
- 支持 URL / 邮箱

**所有文案已写在 `store/` 文件夹**:
- `listing-zh-CN.txt` — 中文
- `listing-en.txt` — 英文
- `privacy-policy.md` — 隐私政策
- `screenshots-needed.md` — 截图清单

---

## 🚀 上架步骤

### 步骤 1: 登录 Partner Center

1. https://partner.microsoft.com/dashboard/microsoftedge/public/login
2. 登录后, 左侧菜单 → **"Extension"** (扩展)

### 步骤 2: 创建新扩展

1. 点 **"Create new extension"** (右上角)
2. 选 **"Extension"** (不是 "Add-on theme" 等)
3. 选 **"Self-hosted"** or **"Microsoft hosted"**?  
   - **Self-hosted**: 你自己上传 zip, 直接从你的 src 部署
   - **Microsoft hosted**: 上传 zip, Microsoft 审完发布到他们的服务器
4. 选 **Microsoft hosted** (推荐, 简单)

### 步骤 3: 上传扩展包

1. 点 "Upload your package" 或拖拽
2. 选择 `edge-bookmark-matrix-v1.3.0-src.zip`
3. 等待几秒, Edge 会自动验证:
   - manifest 格式
   - icon 是否齐全
   - 权限是否声明
4. 显示 ✅ 后, 进入下一步

### 步骤 4: 填写商店资料 (中文)

按 `store/listing-zh-CN.txt` 填:

#### 4.1 名称 (Name)
```
Bookmark Matrix — 书签矩阵
```

#### 4.2 简短总结 (Summary, 132字符)
```
把 Edge 收藏夹自动整理成扁平分类矩阵。18 分类 · 标签/备注/收藏 · 死链检测 · RSS 检查 · 看板拖拽 · 4 套主题 · 全离线。
```

#### 4.3 详细描述 (Description, 8000字符)
直接复制 `listing-zh-CN.txt` 的 Description 部分。

#### 4.4 类别 (Category)
选 **"Productivity"** (生产力)

#### 4.5 图标
上传 3 个尺寸的图标 (从 `store/promo/` 取):
- `StoreIcon-44x44.png`
- `MediumIcon-300x300.png`  
- `SmallPromo-50x50.png`

#### 4.6 截图 (Screenshots)
上传 4-6 张 (从 `store/screenshots/` 取, 1280x800 PNG):
- `01-classification.png` — 分类视图
- `02-fullscreen.png` — 全屏矩阵页
- `03-search.png` — 搜索 + 标签过滤
- `04-themes.png` — 主题切换
- `05-board.png` — 看板视图
- `06-stats.png` — 统计图表

#### 4.7 隐私政策 URL
- **如果你有网站**: 填 `https://yoursite.com/privacy`
- **没网站**: 用 GitHub Pages 托管 `store/privacy-policy.md`:
  1. 把 `privacy-policy.md` 提交到 `github.com/<user>/<repo>/privacy.md`
  2. 开启 GitHub Pages (Settings → Pages → main branch)
  3. URL: `https://<user>.github.io/<repo>/privacy.html`

#### 4.8 支持联系
- 邮箱: `weixingyu.cq@gmail.com` (你的)
- 或者 GitHub Issues 链接: `https://github.com/weixingyu-wxy/xiuxian-world/issues`

### 步骤 5: 隐私声明 (重要!)

针对"是否收集数据"问题:
- **收集的书签数据**: 不发送到任何服务器, 全部本地存储 ✅
- **用户输入**: 标签/备注/分类覆盖, 全部本地 ✅
- **网络请求**: 仅用户主动触发健康检查 (RSS / 死链) 时发起, 不记录不存储
- **分析 / 追踪**: 无
- **第三方 SDK**: 无

所以勾选:
- ☐ 不收集个人数据
- ☐ 不收集位置数据
- ☐ 不收集浏览历史
- ☑ **其他数据** (选这个)
  - 说明: "Extension uses bookmarks API to read user's local bookmarks. All data (tags, notes, categories, health check results) is stored locally via chrome.storage. No data is sent to any server. Network requests only occur when user explicitly triggers health check (dead link / RSS validation)."

### 步骤 6: 内容分级 (Mature Content)

- 选 **"General"** (通用)
- 不包含 18+ 内容
- 不包含暴力 / 歧视

### 步骤 7: 定价

- **Free** (免费)

### 步骤 8: 提交审核

1. 检查所有字段都填了
2. 点 **"Submit for review"** (右上角)
3. 显示 "Submitted" → 进入审核

---

## ⏳ 审核流程

| 阶段 | 预计时间 | 状态 |
|------|---------|------|
| 自动验证 (manifest) | 1 分钟 | ✅ |
| 队列等待 | 1-7 天 | ⏳ |
| 人工审核 | 1-3 天 | 👀 |
| 修改 (如需要) | - | 🔄 |
| **通过** | **总计 2-14 天** | 🎉 |

审核员会检查:
- ✅ manifest 合法
- ✅ 权限合理
- ✅ 描述与功能一致
- ✅ 不收集数据 (或合法声明)
- ✅ UI 不违反政策
- ✅ 截图清晰真实

---

## ❌ 常见拒绝原因 + 修复

### 0. "包含 manifest.json src 的目录之外不允许有文件或目录"

**原因**: 上传了 `full.zip` 或类似包含 standalone/store/tools 的包。

**修复**:
1. 重新打包: `Compress-Archive -Path "src\*" -DestinationPath "edge-bookmark-matrix-v1.3.0.zip"`
2. 用 `src.zip` (63 KB), 不是 `full.zip` (348 KB)
3. 验证 zip 内只有 src 的内容, 没有其他目录

### 1. "权限过大"

**原因**: 你声明了 `host_permissions: ["<all_urls>"]` 但只用于健康检查。

**修复**: 修改描述, 说明清楚使用场景:
> "Required for user's manual health check feature (dead link / RSS validation). No data is sent to any server."

### 2. "截图与功能不符"

**原因**: 用了占位图或者 PWA 的截图, 不是 Edge 扩展实际样子。

**修复**: 必须在 Edge 扩展里实际运行, 用 Edge 浏览器截图, 真实界面。

### 3. "未提供隐私政策"

**原因**: 任何声明了 `host_permissions` 的扩展必填。

**修复**: 必须上传 `privacy-policy.md` 到公网可访问的 URL (GitHub Pages 免费)。

### 4. "图标不够清晰"

**原因**: 图标像素不足或有文字。

**修复**: 
- 44x44: 必须清晰可辨
- 300x300: 不能用 emoji
- 不含公司名 / 商标

### 5. "扩展描述含糊"

**原因**: 没解释清楚做什么。

**修复**: 详细描述必须包括:
- 这是什么
- 谁会用
- 解决什么问题
- 主要功能列表

### 6. "含有不必要权限"

**审查重点**:
- `alarms`: 必须有实际定时任务
- `notifications`: 必须有实际通知
- `favicon`: Chrome 110+ 默认开, 但显式声明更安全

我们扩展的 `alarms` 用于"定期回顾", `notifications` 用于推送沉睡书签, `favicon` 用于显示网站图标 — 都合理。

### 7. "无障碍 / i18n 问题"

**说明**: 暂不要求 (单语 ok), 但有 `_locales/` 更专业。

---

## 📈 上架后

### 更新版本

1. Partner Center → 你的扩展
2. 左侧 "Package" → 上传新 zip
3. 修改版本号 (从 1.3.0 → 1.4.0)
4. 重新填写"更新说明" (Release notes)
5. 提交 → 重新审核 (1-3 天)

### 收集用户反馈

- 关注 "Reviews" 标签
- 回应差评 (友善专业)
- 定期更新 (3-6 个月一次)

### 推广

- 提交到 https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/addons-gallery
- 写博客 / 推特 / V2EX
- 加 README badge: `[Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/...)`

---

## 💡 提交流程速查

```
注册账号 ($19) → 创建扩展 → 上传 zip → 填资料 → 提交审核 → 等待 → 上线
   30 分钟       10 分钟      2 分钟      30 分钟    1 分钟    2-14 天   🎉
```

总计 ~1-2 小时 + 等待时间。

---

## 📁 资料文件夹结构

```
store/
├── STORE_GUIDE.md              ← 本文件
├── listing-zh-CN.txt            ← 中文商店资料
├── listing-en.txt               ← 英文商店资料
├── privacy-policy.md           ← 隐私政策 (托管到 GitHub Pages)
├── screenshots-needed.md        ← 截图清单
├── promo/                       ← 上传用图片
│   ├── StoreIcon-44x44.png
│   ├── MediumIcon-300x300.png
│   └── SmallPromo-50x50.png
└── screenshots/                 ← 截图占位 (需要重新截真实图)
    ├── 01-classification.png
    ├── 02-fullscreen.png
    ├── 03-search.png
    ├── 04-themes.png
    ├── 05-board.png
    └── 06-stats.png
```

---

**Author**: Xingyu Wei
**AI 协助**: Mavis (MiniMax Code)
