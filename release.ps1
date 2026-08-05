# release.ps1 — 一键创建 v1.3.0 GitHub Release + 上传 zip
# 用法: .\release.ps1 (需要先安装 GitHub CLI: winget install GitHub.cli)

$ErrorActionPreference = 'Stop'

function Write-Step($text) { Write-Host "▶ $text" -ForegroundColor Cyan }
function Write-OK($text) { Write-Host "✓ $text" -ForegroundColor Green }
function Write-Err($text) { Write-Host "✗ $text" -ForegroundColor Red }
function Write-Warn($text) { Write-Host "⚠ $text" -ForegroundColor Yellow }

Write-Host "`n=== Bookmark Matrix Release 脚本 ===`n" -ForegroundColor Magenta

# 检查 gh CLI
Write-Step "检查 GitHub CLI..."
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Err "GitHub CLI 未安装"
  Write-Host "`n安装方法 (任选一):" -ForegroundColor Yellow
  Write-Host "  winget install GitHub.cli" -ForegroundColor Yellow
  Write-Host "  或: https://cli.github.com/" -ForegroundColor Yellow
  Write-Host "`n装完后重新运行此脚本" -ForegroundColor Yellow
  exit 1
}
Write-OK "gh 已安装: $(gh --version | Select-Object -First 1)"

# 检查登录
Write-Step "检查 GitHub 登录..."
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Warn "未登录,开始登录..."
  gh auth login --web
}

# 检查 zip 文件
Write-Step "检查 zip 包..."
$zipPath = "D:\AI_Agents\deliverables\edge-bookmark-matrix-v1.3.0-src.zip"
if (-not (Test-Path $zipPath)) {
  Write-Err "找不到 $zipPath"
  Write-Host "先打包: Compress-Archive -Path 'src\*' -DestinationPath '$zipPath' -Force" -ForegroundColor Yellow
  exit 1
}
Write-OK "找到: $zipPath"

# Release notes
$notes = @"
## 🎉 v1.3.0 — Initial release

### ✨ Features
- **18 auto-categories** (100% test accuracy) — AI, Dev, Learning, Video, Music, Shopping, Social, News, Games, Cloud, Mail, Finance, Design, Maps, Reading, Tools, Archive, Other
- **Tags / Notes / Starred** — Right-click any bookmark to add tags, notes, or favorite
- **Full-screen matrix page** — Click ⛶ for sidebar + matrix view
- **Drag-to-sort categories** — Customize category order
- **Statistics** — Bar chart, donut chart, timeline, top 10 domains
- **Health check** — Detect dead links and broken RSS feeds
- **Periodic review** — Browser notifications for dormant bookmarks
- **Kanban view** — Status (inbox/reading/todo/done/archive) or priority columns
- **4 theme presets** — Midnight / Minimal / Cyber / Warm
- **Smart favicons** — Auto-fallback to letter placeholders
- **Cross-device JSON sync** — Backup/restore all your data
- **Full-text search** — Title, URL, domain, tags, notes
- **Optional PWA** — Standalone HTML version, deploy anywhere

### 🛡️ Privacy
100% offline by default. Zero telemetry. Zero dependencies.
All data stays in your browser's local storage.

### 📦 Tech
- Manifest V3 (Chrome 88+ / Edge 88+)
- Pure JavaScript, no frameworks
- 211 unit tests, 100% passing
- Open source on GitHub

### 🔗 Links
- **Source**: https://github.com/weixingyu-wxy/bookmark-matrix
- **Privacy Policy**: https://weixingyu-wxy.github.io/bookmark-matrix/privacy.html
- **Issues**: https://github.com/weixingyu-wxy/bookmark-matrix/issues

---

**Author**: Xingyu Wei  
**AI Use Statement**: Code and docs assisted by Mavis (MiniMax Code).
"@

# 创建 release
Write-Step "创建 v1.3.0 release..."
gh release create v1.3.0 `
  --title "Bookmark Matrix v1.3.0 — Initial release" `
  --notes $notes `
  --target main `
  --latest `
  $zipPath

if ($LASTEXITCODE -eq 0) {
  Write-OK "`n✓ Release 创建成功!`n"
  Write-Host "访问: https://github.com/weixingyu-wxy/bookmark-matrix/releases/tag/v1.3.0" -ForegroundColor Cyan
} else {
  Write-Err "Release 创建失败"
  exit 1
}
