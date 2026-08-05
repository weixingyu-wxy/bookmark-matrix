# Store Submission Package — Bookmark Matrix

> 一切上架 Microsoft Edge Add-ons 商店所需的资料。

---

## 📁 目录结构

```
store/
├── README.md                      ← 本文件
├── STORE_GUIDE.md                  ← 完整上架教程 (一步步)
├── listing-zh-CN.txt               ← 中文商店文案 (复制用)
├── listing-en.txt                  ← 英文商店文案 (复制用)
├── privacy-policy.md               ← 隐私政策 (托管到公网)
├── screenshots-needed.md            ← 截图清单 (尺寸/工具)
│
├── promo/                          ← 商店宣传图 (已生成)
│   ├── StoreIcon-44x44.png         ← 44x44 商店图标
│   ├── MediumIcon-300x300.png      ← 300x300 中等图标
│   ├── SmallPromo-50x50.png        ← 50x50 小推广图
│   └── LargePromo-1400x560.png     ← 1400x560 大推广图 (可选)
│
└── screenshots/                    ← 6 张截图占位 (需替换为真实图)
    ├── 01-classification.png        ← 分类视图主界面
    ├── 02-fullscreen.png           ← 全屏矩阵页
    ├── 03-search.png               ← 搜索 + 标签过滤
    ├── 04-themes.png               ← 主题切换器
    ├── 05-board.png                ← 看板视图
    └── 06-stats.png                ← 统计图表
```

---

## 🚀 快速流程

1. **注册开发者账号** (见 STORE_GUIDE.md)
   - https://partner.microsoft.com/dashboard/microsoftedge/public/login
   - 支付 $19 USD

2. **准备扩展包** (从仓库根目录)
   ```bash
   # zip 直接打包 src/ 内容
   Compress-Archive -Path "src\*" -DestinationPath "edge-bookmark-matrix-v1.3.0.zip"
   ```
   ⚠️ 不要包含父目录!

3. **填资料** (Partner Center)
   - 复制 `listing-zh-CN.txt` 的 Name / Summary / Description
   - 上传 `promo/` 里 4 个图标
   - 上传 `screenshots/` 里 4-6 张图
   - 粘贴 Privacy Policy URL (从 `privacy-policy.md` 托管)

4. **提交审核** → 等 2-14 天

---

## ✅ 资料自检清单

- [x] 名称 (45 字符内) — 已写
- [x] 简短总结 (132 字符内) — 已写
- [x] 详细描述 (8000 字符内) — 已写
- [x] 类别 — Productivity
- [x] StoreIcon-44x44.png — 已生成
- [x] MediumIcon-300x300.png — 已生成
- [x] SmallPromo-50x50.png — 已生成
- [x] LargePromo-1400x560.png — 已生成 (可选)
- [x] 隐私政策 — 已写 (需要托管)
- [x] 支持联系 — GitHub / Email
- [x] 内容分级 — General
- [x] 数据使用声明 — 已写
- [ ] **截图** — 占位图已生成,**必须替换为真实运行截图** ⚠️
- [ ] **隐私政策 URL** — 需自己托管到公网

---

## ⚠️ 上架前必做

### 1. 隐私政策托管

Edge 商店要求公网可访问的 URL。最简单方法:

**GitHub Pages** (免费):
```bash
# 在仓库根目录创建 docs/ 目录
mkdir docs
cp store/privacy-policy.md docs/privacy.md

# 提交
git add docs/
git commit -m "Add privacy policy"
git push

# 仓库 Settings → Pages → Source: main / docs → Save
# 几分钟后: https://<user>.github.io/<repo>/privacy.html
```

把生成的 URL 填到 Partner Center。

### 2. 替换截图 (必须!)

Edge 商店审核员会看截图。如果用占位图会被判"截图与实际不符"。

**怎么截真实图**:
1. 装 v1.3.0 到 Edge
2. 打开 ▦ 图标, 等书签加载
3. Windows 截图工具: `Win + Shift + S` 选区域
4. 或者 Edge 内置: `Ctrl + Shift + S` 网页截图
5. 保存为 PNG → 重命名替换 `store/screenshots/0X-*.png`

### 3. 测试 zip 包

- 用 Edge 加载看是否能正常打开
- 不含 parent folder (zip 内第一层就是 manifest.json 等文件)
- 不含 .DS_Store / .git / 调试文件

---

## 📊 描述统计

| 项目 | 字符数 | 限制 | 状态 |
|------|-------|------|------|
| Name (中文) | 16 | 45 | ✅ |
| Name (英文) | 38 | 45 | ✅ |
| Summary (中文) | 86 | 132 | ✅ |
| Summary (英文) | 130 | 132 | ✅ |
| Description (中文) | ~1500 | 8000 | ✅ |
| Description (英文) | ~1500 | 8000 | ✅ |

---

## 💡 提示

- 第一次提交可能因 "权限过大" 被拒, 修改 `permissions` 描述就行
- Privacy Policy 写详细点比简短更安全
- 截图越真实越好, 包含真实数据 (注意 PII)
- 商店名"Bookmark Matrix" 可能跟其他重名 → 加 — 书签矩阵 / Smart Bookmark Manager 后缀

---

**Author**: Xingyu Wei
**AI 协助**: Mavis (MiniMax Code)
