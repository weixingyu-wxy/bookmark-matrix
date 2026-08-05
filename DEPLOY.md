# 🚀 部署到 GitHub + Edge 商店 — 完整工作流

> 我准备了两个一键 PowerShell 脚本,运行它们会自动推送到 GitHub 并创建 Release。

## 📋 前置准备 (5 分钟)

### 1. 安装 GitHub CLI (如果没有)

```powershell
winget install GitHub.cli
```
重启 PowerShell 让 `gh` 命令可用。

### 2. 生成 GitHub Personal Access Token (备选, SSH 失败时用)

1. 打开 https://github.com/settings/tokens/new
2. **Note**: `Bookmark Matrix Push`
3. **Expiration**: 90 days
4. **Scopes**: ✅ 勾选 `repo`
5. 点 **Generate token**
6. **复制 token** (类似 `ghp_xxxxxxxxxxxxx`,**只显示一次**)

> SSH 优先尝试, 失败再 fallback 到 HTTPS + token。

---

## 🎯 一键运行

### 步骤 1: 推送代码 + 启用 Pages 准备

在 PowerShell:
```powershell
cd D:\AI_Agents\workspace\projects\edge-bookmark-matrix
.\push.ps1
```

脚本会自动:
1. ✅ 配 git 用户 (Xingyu Wei / weixingyu.cq@gmail.com)
2. ✅ 准备 docs/privacy.md
3. ✅ 创建 .gitignore
4. ✅ 检测 SSH key
5. ✅ 测 SSH 连接, 失败自动 fallback HTTPS
6. ✅ 提示输入 Personal Access Token (如果需要)
7. ✅ git add / commit / push

**预期输出**:
```
▶ 检查 git...
✓ git 已安装
▶ 配置 git 用户...
✓ user.name = Xingyu Wei
▶ 准备 docs/privacy.md...
▶ 配 git remote...
✓ origin 已存在
▶ 测试 SSH 连接...
✓ SSH 连接成功!
▶ git push (网络可能慢)...
✓ 推送成功!

访问: https://github.com/weixingyu-wxy/bookmark-matrix
启用 Pages: Settings → Pages → main / docs → Save
```

### 步骤 2: 启用 GitHub Pages (1 分钟)

1. 浏览器打开 https://github.com/weixingyu-wxy/bookmark-matrix/settings/pages
2. **Source**: `Deploy from a branch`
3. **Branch**: `main` + `/docs` 文件夹
4. 点 **Save**
5. 等 1-3 分钟,顶部出现 "Your site is live at https://weixingyu-wxy.github.io/bookmark-matrix/"
6. 测试访问: https://weixingyu-wxy.github.io/bookmark-matrix/privacy.html

### 步骤 3: 配 About 主题

1. 仓库主页 → 右上角 ⚙ (About 旁的齿轮)
2. **Description**: `Bookmark Matrix — Smart bookmark manager for Microsoft Edge. 18 auto-categories, tags, kanban, themes, 100% offline.`
3. **Website**: 留空 (上架后再填)
4. **Topics**:
   ```
   edge-extension, chrome-extension, manifest-v3, bookmarks, productivity, offline-first, javascript
   ```
5. ✅ Include in the home page
6. 点 **Save changes**

### 步骤 4: 创建 v1.3.0 Release

```powershell
.\release.ps1
```

脚本自动:
1. 检查 `gh` CLI 已登录
2. 创建 v1.3.0 release
3. 上传 `edge-bookmark-matrix-v1.3.0-src.zip` 作为附件
4. 标记为 latest

完成后访问: https://github.com/weixingyu-wxy/bookmark-matrix/releases

### 步骤 5: 回 Edge 商店填 URL

| 字段 | 值 |
|------|-----|
| **Privacy policy URL** | `https://weixingyu-wxy.github.io/bookmark-matrix/privacy.html` |
| **Support URL** | `https://github.com/weixingyu-wxy/bookmark-matrix/issues` |
| **Homepage URL** (可选) | `https://github.com/weixingyu-wxy/bookmark-matrix` |

---

## 🆘 故障排除

### push.ps1 报"无法加载,因为在此系统上禁止运行脚本"

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### SSH 还是认证失败 (没要 token)

说明 SSH key 没配或没加载。绕开 SSH:
```powershell
# 强制 HTTPS 模式
git remote set-url origin https://github.com/weixingyu-wxy/bookmark-matrix.git
git push -u origin main
```

### Token 错误 (HTTP 401)

重新生成 token,确保勾了 `repo` 权限。

### Pages 显示 404

1. 确认 Source 是 `main` + `/docs` (不是 / (root))
2. 确认 `docs/privacy.md` 存在
3. 等 5 分钟重新加载 (GitHub Pages 缓存)

---

## ✅ 全部完成

所有文件都在 `D:\AI_Agents\workspace\projects\edge-bookmark-matrix\`:
- `push.ps1` — 一键推送
- `release.ps1` — 一键 Release
- `docs/privacy.md` — 隐私政策 (Pages 根)
- 完整项目源码 + 文档 + 测试

去跑 `.\push.ps1` 看看。报错就贴出来 🎉
