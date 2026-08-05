# Edge 浏览器扩展开发者傻瓜式全流程操作说明书
# (从建 GitHub 库到商店上线再到日常维护)

> **Author**: Xingyu Wei + Mavis (MiniMax Code)
> **版本**: v1.0 (2026-08-05)
> **实例项目**: Bookmark Matrix v1.3.0
> **环境**: Windows 10/11 + PowerShell 5.1
> **预计时长**: 首次完整上架 1-2 天;每次升级 1-2 小时

---

## 写在前面

这份文档不是教科书,是**跟着抄就能做**的施工手册。

- ✅ 不知道 Git 是什么?能跟着做完。
- ✅ 没写过浏览器扩展?照着 Hello World 能跑通。
- ✅ 想上 Edge Add-ons 商店?一步步带你过审核。
- ✅ 出 bug 了?附录 A 有所有踩过的坑。

**所有命令都基于 PowerShell 5.1(Windows 自带)**。如果用其他终端,需自行调整。

**所有截图位置都用 `📷 [描述]` 标注**,你自己打开对应网页对照看就行。

---

## 目录

- [第 0 章:环境准备 (30 min)](#第-0-章环境准备-30-min)
- [第 1 章:建 GitHub 仓库 (10 min)](#第-1-章建-github-仓库-10-min)
- [第 2 章:本地开发环境 (15 min)](#第-2-章本地开发环境-15-min)
- [第 3 章:写你的第一个扩展 (1 hour)](#第-3-章写你的第一个扩展-1-hour)
- [第 4 章:测试 (30 min)](#第-4-章测试-30-min)
- [第 5 章:打包 (10 min)](#第-5-章打包-10-min)
- [第 6 章:推到 GitHub (5 min)](#第-6-章推到-github-5-min)
- [第 7 章:注册 Edge 开发者 (15 min)](#第-7-章注册-edge-开发者-15-min)
- [第 8 章:商店提交 (1 hour)](#第-8-章商店提交-1-hour)
- [第 9 章:等审核 (2-14 天)](#第-9-章等审核-2-14-天)
- [第 10 章:升级 / 发新版本 (1-2 hour)](#第-10-章升级--发新版本-1-2-hour)
- [第 11 章:日常维护 (持续)](#第-11-章日常维护-持续)
- [附录 A:踩坑清单](#附录-a踩坑清单)
- [附录 B:常用命令速查](#附录-b常用命令速查)
- [附录 C:文件模板](#附录-c文件模板)

---

## 第 0 章:环境准备 (30 min)

### 0.1 注册 GitHub 账号(5 min)

📷 打开 <https://github.com/signup>

- 邮箱:用你常用的(别用一次性邮箱,以后收通知用)
- 密码:开 2FA(手机验证器 App,**强烈建议**用 Microsoft Authenticator 或 Google Authenticator)
- 验证邮箱

**完成后你的 username 是 `xxx`,主页是 <https://github.com/xxx>**

### 0.2 注册 Edge 开发者账号($19 一次性,有效期 1 年)(10 min)

📷 打开 <https://partner.microsoft.com/dashboard/microsoftedge/overview>

- 用 Microsoft 账户登录(跟 Windows 登录是同一个就行)
- 点 **"Create a new developer account"**
- 选 **"Individual"(个人开发者,免费试用也行,正式上架要 $19)**
- 付费:信用卡 / PayPal,一次性,1 年内可上架多个扩展
- 填公司信息(个人开发者填自己名字就行)
- 📷 等 1-24h 审核(通常 1-2h,看运气)

### 0.3 装 Git for Windows(5 min)

📷 <https://git-scm.com/download/win>

- 下载 64-bit Git for Windows Setup
- 安装时全选默认,**特别注意勾上 "Git from the command line and also from 3rd-party software"**
- 装完打开 PowerShell,跑:

```powershell
git --version
# 看到 git version 2.5x.x.windows.x 就对了
```

### 0.4 装 Visual Studio Code(5 min)

📷 <https://code.visualstudio.com/>

- 装默认设置就行
- 推荐插件(启动后搜索安装):
  - **JavaScript (ES6) code snippets**
  - **Prettier - Code formatter**
  - **Markdown All in One**
  - **GitLens**

### 0.5 装 GitHub CLI(可选,强烈推荐)(3 min)

📷 <https://cli.github.com/>

- 下载 Windows MSI 安装
- 装完 PowerShell 跑:

```powershell
gh --version
# 看到 gh version 2.x.x (2026-xx-xx) 就对了
```

### 0.6 (可选)装 Python 3(为了跑生成 promo 图脚本)

📷 <https://www.python.org/downloads/windows/>

- 勾 **"Add Python to PATH"**(必须!)
- 装完验证:

```powershell
python --version
# 看到 Python 3.x.x
```

### 0.7 配置 Git 用户名和邮箱(2 min)

```powershell
git config --global user.name "你的 GitHub 用户名"
git config --global user.email "你的 GitHub 注册邮箱"
```

**验证**:

```powershell
git config --global --list
# 看到 user.name 和 user.email 就对了
```

### ✅ 第 0 章完成检查

- [ ] GitHub 账号能登录
- [ ] Edge 合作伙伴账号在等审核
- [ ] git 命令能用
- [ ] VS Code 能打开
- [ ] gh 命令能用
- [ ] Git 配好了用户名邮箱

---

## 第 1 章:建 GitHub 仓库 (10 min)

### 1.1 在 GitHub 网页上创建仓库

📷 打开 <https://github.com/new>

填这些:

| 字段 | 填什么 | 例子(以 Bookmark Matrix 为例) |
|---|---|---|
| Owner | 你的用户名 | `weixingyu-wxy` |
| Repository name | 仓库名(**全小写,中划线**) | `bookmark-matrix` |
| Description | 一句话描述 | `Smart bookmark manager for Microsoft Edge` |
| Visibility | Public(开源) / Private(私密) | **Public** |
| Add README | 打勾 | ✅ |
| Add .gitignore | 选 Node(浏览器扩展用 JS) | `Node` |
| Add license | MIT(最宽松) | `MIT` |

📷 点 **"Create repository"**

### 1.2 仓库结构规范

你的仓库现在应该是空的,只有这 3 个文件:

```
bookmark-matrix/
├── .gitignore         # Git 忽略配置
├── LICENSE            # MIT 许可证
└── README.md          # 项目说明
```

**接下来几章,我们要把代码、加测试、加文档,逐步填满它。**

### 1.3 在本地克隆仓库

```powershell
# cd 到你想放项目的目录
cd D:\AI_Projects

# 克隆(把 URL 换成你刚建的仓库)
git clone https://github.com/你的用户名/仓库名.git
cd 仓库名
```

**验证**:

```powershell
git remote -v
# 应该看到 origin 指向你的仓库
```

### ✅ 第 1 章完成检查

- [ ] GitHub 仓库创建成功
- [ ] 本地有克隆下来的目录
- [ ] 目录里有 .gitignore / LICENSE / README.md

---

## 第 2 章:本地开发环境 (15 min)

### 2.1 创建项目目录结构

在项目根目录:

```powershell
# 基础目录
mkdir src
mkdir tools
mkdir store
mkdir store\promo
mkdir store\screenshots
mkdir docs
```

### 2.2 在 VS Code 中打开项目

```powershell
code .
```

### 2.3 装 Edge 扩展开发版(开发者模式)

📷 打开 Edge 浏览器,地址栏输入 `edge://extensions/`

- 打开右下角 **"开发人员模式"** 开关
- 点 **"加载解压缩的扩展"**
- 选你的项目里的 `src/` 文件夹

**注意:现在 `src/` 还是空的,Edge 会报错。先去第 3 章写 manifest.json 再回来加载。**

### 2.4 (重要)开启自动重载

📷 在 Edge 扩展页,勾 **"自动重新载入更改"**

- 以后改代码保存后,Edge 自动刷新,不用手动点重载

### ✅ 第 2 章完成检查

- [ ] 项目目录结构建好(src/tools/store/docs)
- [ ] Edge 打开了开发者模式
- [ ] "自动重新载入"开了

---

## 第 3 章:写你的第一个扩展 (1 hour)

### 3.1 扩展的 3 个最小文件

每个 Edge 扩展必须至少有这 3 个文件:

```
src/
├── manifest.json    # 扩展的身份证(必填)
├── popup.html       # 弹窗界面(点扩展图标弹的小窗)
└── popup.js         # 弹窗逻辑
```

### 3.2 写 manifest.json(必填,Edge 最严)

📁 `src/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "My First Extension",
  "version": "0.1.0",
  "description": "我的第一个浏览器扩展,做一个 Hello World 按钮",
  "permissions": ["storage"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "我的扩展"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**关键字段说明**:
- `manifest_version`: **必须是 3**(Edge 88+ 不再支持 v2)
- `version`: **每次升级必须递增**,格式 `MAJOR.MINOR.PATCH`
- `permissions`: **只填你真正用到的**,新增会触发重审
- `action`: 点扩展图标的行为(`default_popup` / `default_title`)

### 3.3 写 popup.html

📁 `src/popup.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My First Extension</title>
  <style>
    body { width: 200px; padding: 10px; font-family: sans-serif; }
    button { width: 100%; padding: 8px; margin-top: 5px; }
  </style>
</head>
<body>
  <h3>Hello, Edge!</h3>
  <button id="btn">点我计数</button>
  <p>已点 <span id="count">0</span> 次</p>
  <script src="popup.js"></script>
</body>
</html>
```

### 3.4 写 popup.js

📁 `src/popup.js`:

```javascript
// 每次弹窗打开就跑这个
document.addEventListener('DOMContentLoaded', async () => {
  // 从 storage 读计数
  const data = await chrome.storage.local.get('count');
  const count = data.count || 0;
  document.getElementById('count').textContent = count;

  // 点按钮 +1
  document.getElementById('btn').addEventListener('click', async () => {
    const newCount = count + 1;
    await chrome.storage.local.set({ count: newCount });
    document.getElementById('count').textContent = newCount;
  });
});
```

### 3.5 准备图标

需要 3 个尺寸的 PNG:

- `src/icons/icon16.png` (16x16)
- `src/icons/icon48.png` (48x48)
- `src/icons/icon128.png` (128x128)

**自己不会设计?** 用 [Figma](https://figma.com) / [Canva](https://canva.com) / [AI 生图](https://www.bing.com/images/create) 随便画一个方块就行。

**或者用 Python 临时生成**(如果装了 PIL):

```python
# tools/gen_temp_icons.py
from PIL import Image, ImageDraw

for size in [16, 48, 128]:
    img = Image.new('RGB', (size, size), color='blue')
    d = ImageDraw.Draw(img)
    d.rectangle([size//4, size//4, 3*size//4, 3*size//4], fill='white')
    img.save(f'src/icons/icon{size}.png')
```

跑:

```powershell
python tools/gen_temp_icons.py
```

### 3.6 在 Edge 加载扩展

📷 打开 `edge://extensions/`,点 **"重新加载"** 或 **"加载解压缩的扩展"** 选 `src/`

- 应该能看到扩展出现在列表里
- 点浏览器工具栏的扩展图标,弹出小窗
- 点按钮,数字应该 +1,关掉再开,数字保留(说明 storage 生效)

🎉 **你的第一个扩展跑起来了!**

### ✅ 第 3 章完成检查

- [ ] 3 个文件写好
- [ ] 3 个图标放好
- [ ] Edge 能加载扩展
- [ ] 弹窗能打开,按钮能计数
- [ ] 数字持久化(关掉再开还在)

---

## 第 4 章:测试 (30 min)

### 4.1 为什么写测试

- 你改了 A 模块,B 模块崩了,测试能立刻告诉你
- 上商店前 reviewer 会看你的测试覆盖度(虽然不强制,但有测试会更专业)
- 自动化测试比手动点击快 100 倍

### 4.2 选测试工具:Node.js 内置 `node:test`(零依赖)

**不要装 Mocha / Jest**(本项目用 Node 内置就够了)。

📁 `tools/test_myext.js`:

```javascript
// 简单的单元测试
const test = require('node:test');
const assert = require('node:assert');

// 模拟 chrome API
global.chrome = {
  storage: {
    local: {
      _data: {},
      async get(key) {
        if (key === null) return { ...this._data };
        return { [key]: this._data[key] };
      },
      async set(obj) {
        Object.assign(this._data, obj);
      }
    }
  }
};

// 加载你的代码
const popup = require('../src/popup.js');

test('storage get with no data returns 0', async () => {
  chrome.storage.local._data = {};
  const data = await chrome.storage.local.get('count');
  assert.strictEqual(data.count, undefined);
});

test('storage set then get works', async () => {
  await chrome.storage.local.set({ count: 5 });
  const data = await chrome.storage.local.get('count');
  assert.strictEqual(data.count, 5);
});
```

### 4.3 跑测试

```powershell
node --test tools/
```

**预期输出**:

```
✔ storage get with no data returns 0 (1.2ms)
✔ storage set then get works (0.5ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

### 4.4 Bookmark Matrix 实测:211/211 测试

Bookmark Matrix 的测试分布:

```
tools/
├── test_classifier.js          # 18 分类准确度 (100/100)
├── test_health_board_notify.js # 健康检查 + 看板 + 通知 (50/50)
├── test_io_meta.js             # 导入导出 + 元数据 (30/30)
├── test_stats.js               # 统计图表 (15/15)
└── test_themes_favicon.js      # 主题 + favicon (16/16)
```

跑全部:

```powershell
node --test tools/
# 看到 211 PASSED + 0 FAILED 就对了
```

### ✅ 第 4 章完成检查

- [ ] 写了至少 5 个测试
- [ ] 跑测试全绿
- [ ] 每次改代码前都跑测试(养成习惯)

---

## 第 5 章:打包 (10 min)

### 5.1 为什么要单独打包

- `src/` 是源代码(开发用)
- `zip` 是商店用的(用户下载的就是这个)
- 不能把 `.git/` `node_modules/` `tests/` 塞进 zip(会增大体积 + Edge 会警告)

### 5.2 打包命令

```powershell
# 切换到项目根
cd D:\AI_Projects\bookmark-matrix

# 删除旧 zip
Remove-Item D:\AI_Agents\deliverables\bookmark-matrix-v0.1.0-src.zip -ErrorAction SilentlyContinue

# 打包 src/ 整个目录
Compress-Archive -Path src\* -DestinationPath D:\AI_Agents\deliverables\bookmark-matrix-v0.1.0-src.zip -Force
```

**验证**:

```powershell
Get-Item D:\AI_Agents\deliverables\bookmark-matrix-v0.1.0-src.zip | Select-Object Name, Length
# 看到文件大小(几 KB 到几 MB)
```

### 5.3 检查 zip 里面有什么

```powershell
# 列出 zip 内容
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead("D:\AI_Agents\deliverables\bookmark-matrix-v0.1.0-src.zip").Entries.FullName
```

**应该看到**:
```
src/manifest.json
src/popup.html
src/popup.js
src/icons/icon16.png
src/icons/icon48.png
src/icons/icon128.png
```

**不应该有**:
- `.git/`
- `node_modules/`
- `tools/`(测试文件不放商店)
- `*.md`(文档不放商店,放仓库就行)

### 5.4 (推荐)写个打包脚本

📁 `package.ps1`:

```powershell
# package.ps1 - One-click zip for Edge Add-ons store
$ErrorActionPreference = 'Stop'

# Read version from manifest
$manifest = Get-Content 'src\manifest.json' -Raw | ConvertFrom-Json
$version = $manifest.version
$name = "bookmark-matrix-v$version-src"

Write-Host "Packaging $name..." -ForegroundColor Cyan

# Output path
$outDir = "D:\AI_Agents\deliverables"
$outZip = "$outDir\$name.zip"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Remove old
if (Test-Path $outZip) { Remove-Item $outZip -Force }

# Create zip
Compress-Archive -Path 'src\*' -DestinationPath $outZip -Force

Write-Host "[OK] Created: $outZip" -ForegroundColor Green
Write-Host "Size: $((Get-Item $outZip).Length) bytes"
```

跑:

```powershell
.\package.ps1
```

### ✅ 第 5 章完成检查

- [ ] zip 存在 `D:\AI_Agents\deliverables\bookmark-matrix-v0.1.0-src.zip`
- [ ] zip 里面只有 src/ 下的运行时文件
- [ ] 没有 .git / node_modules / tests / docs

---

## 第 6 章:推到 GitHub (5 min)

### 6.1 第一次推(踩 Windows 坑最多)

```powershell
# 回到项目根
cd D:\AI_Projects\bookmark-matrix

# 看改了什么
git status

# 全部加进去
git add .

# 提交
git commit -m "v0.1.0: initial release with hello world extension"

# 推
git push -u origin main
```

### 6.2 ⚠️ Windows 用户的 4 个常见坑

#### 坑 1:SSL 证书吊销检查失败

**症状**:
```
fatal: unable to access 'https://github.com/...': schannel: next InitializeSecurityContext failed: CRYPT_E_NO_REVOCATION_CHECK (0x80092012)
```

**修复**:
```powershell
git config --global http.sslVerify false
# 推完恢复
git config --global --unset http.sslVerify
```

#### 坑 2:PowerShell 5.1 中英文乱码

**症状**:脚本里有中文(✓ ⚠ ▶),PowerShell 跑出乱码,字符串提前结束。

**修复**:**所有 PowerShell 脚本保持纯 ASCII**。中文写到 `Read-Host` 让用户输入,或者写到文件里让用户自己读。

#### 坑 3:`--force-with-lease` 报 stale info

**症状**:
```
! [rejected] main -> main (stale info)
```

**原因**:本地没 `fetch` 过远端,lease 没记录可比较。

**修复**:
```powershell
# 方法 A:先 fetch
git fetch https://github.com/你的用户名/仓库名.git
git push --force-with-lease

# 方法 B:知道远端是空架子,直接 force
git push --force  # 小心用,会覆盖远端
```

#### 坑 4:Push 提示输入用户名密码(没用 PAT)

**症状**:
```
Username for 'https://github.com':
Password for 'https://你的用户名@github.com':
```

**原因**:GitHub 早就不用密码认证了,必须用 PAT。

**修复**:用一次性 URL 推(不写 .git-credentials):

```powershell
$token = "ghp_你的token"
git push "https://x-access-token:${token}@github.com/你的用户名/仓库名.git" main
```

### 6.3 推送清单(推荐顺序)

```powershell
# 1. (临时)关 SSL 验证
git config --global http.sslVerify false

# 2. (临时)用 token URL 推
$token = "ghp_你的token"
$url = "https://x-access-token:${token}@github.com/你的用户名/仓库名.git"
git push --force "$url" main

# 3. 恢复 SSL
git config --global --unset http.sslVerify

# 4. 清空 token 字符串
$token = ""
$url = ""
```

### 6.4 ⚠️ Token 安全

**Token 出现在 chat / log 之后必须 revoke**:

📷 <https://github.com/settings/tokens>

- 找到刚才的 token
- 点 **Delete** / **Revoke**
- 推荐用完即删,需要时再生

### ✅ 第 6 章完成检查

- [ ] 仓库在 GitHub 能看到 60+ 文件
- [ ] commit 记录对得上
- [ ] token 已 revoke

---

## 第 7 章:注册 Edge 开发者 (15 min)

### 7.1 付 $19

📷 打开 <https://partner.microsoft.com/dashboard/microsoftedge/overview>

- 登录 Microsoft 账户
- 填开发者资料(国家、城市、姓名)
- 信用卡 / PayPal 付 $19
- 收据会发到你注册邮箱

**注意**:这是 **Microsoft Partner Center**,不是 GitHub。

### 7.2 等激活

- 通常几分钟到 24h
- 激活后你会收到邮件
- 进 Partner Center 能看到 **"Extensions"** 菜单

### 7.3 填公司信息(必须)

📷 **Account settings** → **Contact info**

- 必填:公司名(或个人名字)、地址、电话、邮箱
- 公开商店页会显示这些信息的一部分

### ✅ 第 7 章完成检查

- [ ] $19 已付,收到收据
- [ ] 开发者账号激活
- [ ] Extensions 菜单可见

---

## 第 8 章:商店提交 (1 hour)

### 8.1 进入提交页

📷 Partner Center → **Extensions** → **Create new extension**

### 8.2 必填字段一览

| 字段 | 填什么 | 例子 |
|---|---|---|
| **Name** | 扩展名(最多 45 字符) | `Bookmark Matrix — 书签矩阵` |
| **Summary** | 一句话简介(最多 132 字符) | `把 Edge 收藏夹自动整理成扁平分类矩阵。18 分类 · 标签/备注/收藏 · 全离线。` |
| **Description** | 详细描述(最多 8000 字符) | 见 `store/listing-zh-CN.txt` |
| **Category** | 类别 | `Productivity` |
| **Privacy policy URL** | 隐私政策链接 | `https://你的用户名.github.io/仓库名/privacy.html` |
| **Support URL** | 客服/支持链接 | `https://github.com/你的用户名/仓库名/issues` |
| **Website URL** | 官网(可选) | 同上 |
| **Languages** | 支持语言(可多选) | 中文(简体), English |

### 8.3 准备 4 个 Promo 图

| 图 | 尺寸 | 用途 |
|---|---|---|
| StoreIcon-44x44 | 44x44 | 商店卡片左上角小图标 |
| SmallPromo-50x50 | 50x50 | 小促销 |
| MediumIcon-300x300 | 300x300 | 商店主图标 |
| LargePromo-1400x560 | 1400x560 | 大横幅(商店搜索结果页) |

**生成方法(用 Python PIL)**:

📁 `tools/gen_promo.py`:

```python
from PIL import Image, ImageDraw, ImageFont

# 300x300 主图标
img = Image.new('RGB', (300, 300), color='#1e1e2e')
d = ImageDraw.Draw(img)
# 中间画个 "B"
try:
    font = ImageFont.truetype('arial.ttf', 200)
except:
    font = ImageFont.load_default()
d.text((100, 30), 'B', fill='white', font=font)
img.save('store/promo/MediumIcon-300x300.png')

# 1400x560 大横幅
img = Image.new('RGB', (1400, 560), color='#1e1e2e')
d = ImageDraw.Draw(img)
try:
    font_lg = ImageFont.truetype('arial.ttf', 80)
    font_sm = ImageFont.truetype('arial.ttf', 40)
except:
    font_lg = font_sm = ImageFont.load_default()
d.text((100, 200), 'My Extension', fill='white', font=font_lg)
d.text((100, 320), 'My awesome tagline', fill='#888', font=font_sm)
img.save('store/promo/LargePromo-1400x560.png')

print("Done")
```

跑:

```powershell
python tools/gen_promo.py
```

### 8.4 准备 6 个截图(1280x800 或 640x400)

📷 真实运行扩展,Edge 截屏(`Win+Shift+S`)

**建议覆盖的功能**:
1. 主功能展示(分类界面)
2. 搜索
3. 主题切换
4. 统计图表
5. 设置
6. 看板/Kanban

**存到 `store/screenshots/01-xxx.png` 等**

### 8.5 准备 Privacy Policy 页面(必须)

Edge 强制要求有公开可访问的隐私政策页。

**最简方案:用 GitHub Pages**

1. 仓库根目录建 `docs/privacy.md` 或 `docs/privacy.html`
2. 写隐私政策(见附录 C 模板)
3. GitHub → Settings → Pages → Source: `main` / `docs` → Save
4. 等 1-3 分钟,访问 `https://你的用户名.github.io/仓库名/privacy.html`
5. 复制这个 URL 到 Partner Center

**必填内容**:
- 你收集什么数据(默认:不收集)
- 用数据做什么(默认:什么都不做)
- 第三方 SDK 列表(默认:没有)
- 用户权利(GDPR/PIPL/CCPA)
- 联系方式(你的邮箱)

### 8.6 数据使用披露

📷 Partner Center → **Properties** → **Data use**

- 默认勾"我不在扩展里收集数据"
- 如果扩展会发网络请求(比如健康检查),**勾"其他"** + 在文本框写清楚:
  > Extension only makes user-initiated health check requests (dead link detection). All data stays in browser local storage. No telemetry, no third-party SDKs, no LLM API.

### 8.7 权限理由(每个 permissions 都要写)

📷 Partner Center → **Properties** → **Permissions**

- 比如 `storage`: "Used to store user bookmarks, tags, and settings locally"
- 比如 `alarms`: "Used for periodic review notifications"
- 比如 `notifications`: "Used to alert users about dormant bookmarks"

**必填,reviewer 会逐条看**

### 8.8 上传 zip

📷 Partner Center → **Packages** → **Upload**

- 选第 5 章打包的 zip
- Edge 自动验证 manifest.json

### 8.9 提交审核

📷 全部填好后,点右上角 **"Submit for review"**

- 状态会变成 "In review"
- 通常 2-14 天

### ✅ 第 8 章完成检查

- [ ] Name / Summary / Description / Category 填好
- [ ] Privacy policy URL 可访问
- [ ] 4 个 promo 图上传
- [ ] 6 个截图上传
- [ ] 数据使用披露填好
- [ ] 权限理由每条都写
- [ ] zip 上传成功
- [ ] 点了 Submit

---

## 第 9 章:等审核 (2-14 天)

### 9.1 怎么看进度

📷 Partner Center → 你的扩展 → 状态会显示:
- `In review` — 在审
- `Approved` — 通过,自动上架
- `Rejected` — 被打回,看原因

**也会发邮件通知**

### 9.2 常见打回原因

| 原因 | 修复 |
|---|---|
| Privacy policy URL 404 | 重新启用 Pages,等生效 |
| Permission 没填理由 | 在 Permissions 页每条写理由 |
| Manifest 错误 | `manifest_version` 写错、字段拼错 |
| 截图模糊 | 重新截,1280x800 高清 |
| Logo 模糊 | 重新生成,300x300 PNG |
| 违反政策(比如收集数据没声明) | 在 Data use 补声明 |

### 9.3 被打了怎么办

📷 收到 Rejected 邮件 → 点邮件里 "Edit submission"

- 看具体原因
- 改 → 重新提交

**不需要重新付 $19**。

### 9.4 通过了

- 邮件通知 "Your extension is live!"
- 商店链接:`https://microsoftedge.microsoft.com/addons/detail/你的扩展id`
- 1-2 小时内,商店搜索能搜到

🎉 **上线!**

### ✅ 第 9 章完成检查

- [ ] 状态变成 Approved
- [ ] 商店能搜到
- [ ] 邮件收到通知

---

## 第 10 章:升级 / 发新版本 (1-2 hour)

### 10.1 升级流程(每次都按这个走)

```
1. 改 src/ 下的代码
2. 跑测试(node --test tools/)
3. 改 src/manifest.json 的 version (1.3.0 → 1.4.0)
4. 重打 zip(package.ps1)
5. commit + push
6. git tag v1.4.0 + push tag
7. (可选)GitHub Release
8. Partner Center 提交新版本
9. 填 changelog + 上传新 zip
10. 提交 → 等 1-7 天
```

### 10.2 关键:version 必须递增

Edge **不允许同 version 重提**。

约定:
- **修 bug** → `1.3.0 → 1.3.1` (PATCH)
- **加功能** → `1.3.0 → 1.4.0` (MINOR)
- **改 manifest / 改 storage 格式** → `2.0.0` (MAJOR)

### 10.3 数据兼容铁律

**不要删旧 storage key**。永远只加新字段 + 写 migration。

```javascript
// 安全的读
async function loadBookmarks() {
  const data = await chrome.storage.local.get(['bookmarks', 'tags', 'notes']);
  return {
    bookmarks: data.bookmarks || [],
    tags: data.tags || {},
    notes: data.notes || {}
  };
}

// 如果要加新字段 'starred',写个 migration
async function migrateV140() {
  const data = await chrome.storage.local.get('bookmarks');
  if (data.bookmarks) {
    const updated = data.bookmarks.map(b => ({
      starred: false,  // 新字段
      ...b
    }));
    await chrome.storage.local.set({ bookmarks: updated });
  }
}
```

### 10.4 升级 checklist

```markdown
- [ ] 改代码,跑测试(全绿)
- [ ] Bump version (manifest + tag + README + CHANGELOG)
- [ ] 检查 manifest permissions 有没有新增(没有就不需要重审声明)
- [ ] 写 CHANGELOG(给用户看的)
- [ ] 写 release notes(给 GitHub)
- [ ] 重打 zip
- [ ] git push main + tag
- [ ] Partner Center 提交新版本
- [ ] 24h 内监控:评论、issue
```

### 10.5 一键升级脚本(推荐)

📁 `release.ps1`(简化版):

```powershell
# release.ps1 - One-click version bump + package + push + release
$ErrorActionPreference = 'Stop'

# 1. 问版本号
$version = Read-Host "New version (e.g. 1.4.0)"
$manifest = Get-Content 'src\manifest.json' -Raw | ConvertFrom-Json
$oldVersion = $manifest.version

# 2. Bump version
$manifest.version = $version
$manifest | ConvertTo-Json -Depth 10 | Set-Content 'src\manifest.json'

# 3. 跑测试
Write-Host "Running tests..." -ForegroundColor Cyan
node --test tools/
if ($LASTEXITCODE -ne 0) { throw "Tests failed, abort" }

# 4. 打包
Write-Host "Packaging..." -ForegroundColor Cyan
$zipName = "bookmark-matrix-v$version-src"
$zipPath = "D:\AI_Agents\deliverables\$zipName.zip"
Compress-Archive -Path 'src\*' -DestinationPath $zipPath -Force

# 5. 提交
git add .
git commit -m "v$version: release"
git tag "v$version"
git push
git push --tags

# 6. GitHub Release(用 gh CLI)
$env:GH_TOKEN = Read-Host "GitHub PAT" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:GH_TOKEN)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:GH_TOKEN = $plainToken
gh release create "v$version" `
  --repo "你的用户名/仓库名" `
  --title "Bookmark Matrix v$version" `
  --notes "See CHANGELOG.md" `
  --target main `
  $zipPath
$env:GH_TOKEN = $null

Write-Host "[OK] v$version released! Now upload to Partner Center." -ForegroundColor Green
Write-Host "Zip: $zipPath"
```

跑:

```powershell
.\release.ps1
```

### ✅ 第 10 章完成检查

- [ ] Version 已 bump
- [ ] 重新打包 zip
- [ ] GitHub push + tag + release
- [ ] Partner Center 提交新版本
- [ ] 等 review → 通过

---

## 第 11 章:日常维护 (持续)

### 11.1 监控清单

| 项 | 频率 | 在哪看 |
|---|---|---|
| 商店评论 | 每天 | Partner Center → Reviews |
| GitHub Issues | 每天 | 仓库 → Issues |
| Edge 更新通知 | 每月 | Partner Center → Notifications |
| Edge 政策更新 | 季度 | <https://learn.microsoft.com/microsoft-edge/extensions-chromium/> |
| 你的 Chrome 兼容性 | 每月 | <https://developer.chrome.com/docs/extensions/> |

### 11.2 回复评论(礼貌模板)

**好评**:
> 谢谢!有需要的功能可以提 Issue,我尽量排期 :)

**差评(抱怨 bug)**:
> 抱歉遇到问题。能否提供 Edge 版本和复现步骤?我开个 Issue 跟踪。

**差评(骂街)**:
> Edge 商店有"举报滥用"按钮,合理使用。

### 11.3 修 bug 流程

```
1. 用户报 bug(或自己发现)
2. 写一个失败的测试(reproduce bug)
3. 改代码让测试通过
4. 跑全部测试
5. Bump version (1.3.0 → 1.3.1)
6. 重打 zip
7. Partner Center 提交
8. 评论里回复"已修,等审核"
```

### 11.4 安全公告

Edge / Chrome 偶尔会强制升级 manifest v3 规则、移除某些 API。

**怎么知道**:
- 📷 关注 <https://developer.chrome.com/docs/extensions/whatsnew/>
- 关注 Edge 官方博客

**响应**:
- 收到通知 → 评估影响
- 1 个月内出兼容版本
- 不能修就 unpublish(下架)

### 11.5 数据备份建议(给用户)

在 README 里写:

> 升级前请用扩展的"导出 JSON"功能备份数据。
> 卸载扩展 = 丢失所有数据(Edge 不保留)。

### 11.6 长期维护成本

| 项 | 工作量 |
|---|---|
| 每天扫评论 + Issues | 10 min |
| 每周修 1-2 个小 bug | 1-2 hours |
| 每月发 1 个小版本 | 2-4 hours |
| 每季度发 1 个大版本 | 1-2 days |
| Edge 政策变更适配 | 1-2 days/year |

**单人维护一个扩展,平均每周 2-4 小时**。

### ✅ 第 11 章完成检查

- [ ] 评论每天看
- [ ] Issue 当天回
- [ ] Bug 当周修
- [ ] 大功能当季发
- [ ] 政策变更当月响应

---

## 附录 A:踩坑清单

### A.1 Windows Git HTTPS 4 大坑

#### 坑 1:SSL 证书吊销检查失败

**症状**:
```
fatal: unable to access 'https://github.com/...': schannel: next InitializeSecurityContext failed: CRYPT_E_NO_REVOCATION_CHECK (0x80092012)
```

**修复**:
```powershell
git config --global http.sslVerify false
git config --global --unset http.sslVerify  # 推完恢复
```

**不要**:
- `http.sslBackend openssl` — Git for Windows 2.54+ 已强制 schannel
- `GIT_SSL_BACKEND=openssl` — env var 被忽略

#### 坑 2:PowerShell 5.1 中英文乱码

**症状**:脚本里有中文(✓ ⚠ ▶),跑出乱码导致字符串提前结束。

**修复**:**所有 PowerShell 脚本保持纯 ASCII**。中文用 `Read-Host` 提示用户输入,或者写到 markdown 让用户读。

#### 坑 3:`--force-with-lease` 报 stale info

**症状**:
```
! [rejected] main -> main (stale info)
```

**修复**:
```powershell
# 先 fetch
git fetch <URL>
git push --force-with-lease
# 或知道远端空架子,直接 force
git push --force
```

#### 坑 4:SSH key 跟 GitHub 账号不匹配

**症状**:`Permission denied (publickey)`

**修复**:
1. 上 GitHub 检查 `~/.ssh/id_ed25519.pub` 的 fingerprint 是不是在账号里
2. 不在就 `ssh-keygen -t ed25519` 生成新的,加到 GitHub
3. 或者直接用 HTTPS + PAT(更省事)

### A.2 Edge 商店 4 大坑

#### 坑 1:`manifest_version` 写错

**症状**:Edge 拒绝加载。

**修复**:**必须是 3**。
```json
"manifest_version": 3
```

#### 坑 2:`default_locale` 字段导致解析失败

**症状**:Edge 报 "Manifest file is not valid JSON"。

**修复**:单语言扩展不要写 `default_locale`,直接删掉。需要多语言再 `_locales/zh_CN/messages.json`。

#### 坑 3:Privacy policy URL 404

**症状**:商店审核打回。

**修复**:
- 用 GitHub Pages(`docs/privacy.md`)
- 提交前自己访问一下,确认 200

#### 坑 4:Promo 图尺寸错

**症状**:商店显示拉伸/裁剪。

**修复**:严格按尺寸:
- StoreIcon-44x44.png
- SmallPromo-50x50.png
- MediumIcon-300x300.png
- LargePromo-1400x560.png

### A.3 PowerShell 5.1 4 个 safety 拦路

#### 拦 1:`Remove-Variable $token` 被拦

**解法**:`$token = ""`(赋值清空)

#### 拦 2:`Remove-Item Env:\FOO` 被拦

**解法**:`$env:FOO = $null`

#### 拦 3:`mavis-trash <path>` 替代 `rm -rf`

**解法**:用 `mavis-trash`,回收站可恢复。

#### 拦 4:bash 里的 `&&` `||` `2>&1` 等 unix 语法

**解法**:用 PowerShell 语法 `;` `if ($?) { ... }` `2>&1`。

### A.4 GitHub CLI 2 个省事技巧

#### 技巧 1:用 GH_TOKEN 跳过 login

```powershell
$env:GH_TOKEN = "ghp_xxx"
gh release create v1.3.0 --repo owner/repo --title "..." --notes "..." ZIP_PATH
$env:GH_TOKEN = $null
```

**不需要 `gh auth login`**,env var 临时认证。

#### 技巧 2:`gh release create` 自动建 tag + 上传 zip

一个命令 = 创建 tag + 创建 release + 上传 zip 3 件事。比手动 `git tag + push + 写 release` 快 3 倍。

### A.5 Token 安全 3 条铁律

1. **Token 出现在 chat 后必须 revoke**(因为 chat 会被记录/转录/分享)
2. **不写入磁盘**(用 `git credential approve` 进 Credential Manager 或 env var 临时)
3. **不用完就删**,需要时再生

---

## 附录 B:常用命令速查

### B.1 Git 常用

```powershell
# 状态
git status

# 提交
git add .
git commit -m "message"
git push

# 拉取
git pull

# Tag
git tag v1.4.0
git push --tags

# 强制推送(慎用)
git push --force
```

### B.2 Edge 加载扩展

```
edge://extensions/
# 开发人员模式:开
# 加载解压缩的扩展:选 src/
# 自动重新载入:开
```

### B.3 打包

```powershell
Compress-Archive -Path src\* -DestinationPath zip_path
```

### B.4 跑测试

```powershell
node --test tools/
```

### B.5 推送 HTTPS(踩坑绕过)

```powershell
git config --global http.sslVerify false
$token = "ghp_xxx"
git push "https://x-access-token:${token}@github.com/owner/repo.git" main --force
git config --global --unset http.sslVerify
$token = ""
```

### B.6 GitHub Release

```powershell
$env:GH_TOKEN = "ghp_xxx"
gh release create v1.4.0 `
  --repo "owner/repo" `
  --title "Title" `
  --notes "Notes" `
  --target main `
  --latest `
  zip_path
$env:GH_TOKEN = $null
```

### B.7 删除已发布的 release

```powershell
$env:GH_TOKEN = "ghp_xxx"
gh release delete v1.3.0 --repo "owner/repo" --yes
gh release delete-asset v1.3.0 "edge-bookmark-matrix-v1.3.0-src.zip" --repo "owner/repo" --yes
$env:GH_TOKEN = $null
```

---

## 附录 C:文件模板

### C.1 manifest.json 模板(Bookmark Matrix v1.3.0)

```json
{
  "manifest_version": 3,
  "name": "Bookmark Matrix — 书签矩阵",
  "version": "1.3.0",
  "description": "把 Edge 收藏夹自动整理成扁平分类矩阵",
  "homepage_url": "https://github.com/weixingyu-wxy/bookmark-matrix",
  "permissions": [
    "storage",
    "alarms",
    "notifications",
    "favicon"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Bookmark Matrix"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### C.2 Privacy Policy 模板

```markdown
# Privacy Policy

Last updated: 2026-08-05

## What data we collect

**None.** This extension does not collect, transmit, or sell any user data.

## Where your data lives

All bookmarks, tags, notes, and settings are stored **locally in your browser**
using the `chrome.storage.local` API. They never leave your device.

## Network requests

The extension makes network requests **only** when you click the "Health Check"
button (dead link detection). These requests are sent directly to the target
URLs, not to any third-party server.

## Third parties

We do not use any third-party SDKs, analytics, telemetry, or LLM APIs.

## Your rights

- **Export**: Use the "Export JSON" button to download all your data.
- **Delete**: Uninstall the extension to permanently delete all local data.
- **No account required**: This extension does not require registration.

## Contact

If you have questions, please open an issue:
https://github.com/owner/repo/issues

---

**Author**: Xingyu Wei
**AI Use Statement**: This extension's code and documentation were
developed with assistance from Mavis (MiniMax Code).
```

### C.3 README.md 模板

```markdown
# Bookmark Matrix — 书签矩阵

> Smart bookmark manager for Microsoft Edge.

## Features

- 18 auto-categories (AI, Dev, Learning, Video, Music, ...)
- Tags / Notes / Starred on every bookmark
- Full-screen matrix page
- Statistics (bar, donut, timeline)
- Health check (opt-in dead link detection)
- 4 theme presets
- 100% offline, zero telemetry

## Install

### From Edge Add-ons Store

[Bookmark Matrix on Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/xxx)

### From source (developer mode)

1. Clone this repo
2. Open `edge://extensions/`, enable Developer Mode
3. Click "Load unpacked", select `src/`

## Privacy

See [Privacy Policy](docs/privacy.md).

## License

MIT

---

**Author**: Xingyu Wei
**AI Use Statement**: Code and docs assisted by Mavis (MiniMax Code).
```

### C.4 .gitignore 模板

```
node_modules/
.DS_Store
__pycache__/
*.pyc
.vscode/
.idea/
*.log
README.md.bak
.DS_Store
Thumbs.db
```

### C.5 CHANGELOG.md 模板

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0] - 2026-XX-XX

### Added
- Quick Switcher (Ctrl+Shift+B)
- CSV export

### Changed
- Improved classifier for Chinese domains

### Fixed
- Tags filter not working with empty notes

## [1.3.0] - 2026-08-05

### Added
- 18 auto-categories
- Tags / Notes / Starred
- Health check (opt-in)
- 4 theme presets
- JSON import/export
```

### C.6 PR/Issue 模板(`.github/ISSUE_TEMPLATE/bug.md`)

```markdown
---
name: Bug Report
about: 报告一个 bug
title: '[BUG] '
---

## Describe the bug

<!-- 简短描述 -->

## To Reproduce

1. ...
2. ...

## Expected behavior

<!-- 你期望发生什么 -->

## Environment

- Edge version: 
- Extension version:
- OS: 

## Screenshots

<!-- 如果有,粘贴 -->
```

---

## 写在最后

**做浏览器扩展不是技术活,是耐心活**。

- 第一次上架:1-2 天
- 每次升级:1-2 小时
- 日常维护:每周 2-4 小时

**比写 App / 做网站简单多了**。代码量小(几百行就能做出能用的扩展),审核比 App Store 宽松(只要合规基本过),流量相对低(小众但精准)。

**最关键的三件事**:
1. **解决一个真问题**(不是为做而做)
2. **坚持每周发版**(保持活跃度)
3. **听用户反馈**(评论 + Issues 是金矿)

**Bookmark Matrix v1.3.0 就是一个例子**:
- 0 预算
- 1 个人
- 3 周做完
- 全开源,可审计,可定制

**下一个,做你自己的。**

---

> **Author**: Xingyu Wei
> **AI Use Statement**: This document was created with assistance from Mavis (MiniMax Code).
> **Last updated**: 2026-08-05
