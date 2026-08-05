# release.ps1 — Create GitHub Release + upload zip
# Usage: .\release.ps1 -Version "1.4.0"
# Requires: GitHub CLI (winget install GitHub.cli)

param(
  [string]$Version = "1.4.0"
)

$ErrorActionPreference = 'Stop'

function Write-Step($text) { Write-Host ">> $text" -ForegroundColor Cyan }
function Write-OK($text) { Write-Host "[OK] $text" -ForegroundColor Green }
function Write-Err($text) { Write-Host "[ERR] $text" -ForegroundColor Red }
function Write-Warn($text) { Write-Host "[!] $text" -ForegroundColor Yellow }

Write-Host "`n=== Bookmark Matrix Release Script ===`n" -ForegroundColor Magenta

# Check gh CLI
Write-Step "Checking GitHub CLI..."
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Err "GitHub CLI not installed"
  Write-Host "`nInstall (one of):" -ForegroundColor Yellow
  Write-Host "  winget install GitHub.cli" -ForegroundColor Yellow
  Write-Host "  or: https://cli.github.com/" -ForegroundColor Yellow
  exit 1
}
Write-OK "gh installed: $(gh --version | Select-Object -First 1)"

# Check zip
Write-Step "Checking zip package..."
$zipPath = "D:\AI_Agents\deliverables\edge-bookmark-matrix-v$Version-src.zip"
if (-not (Test-Path $zipPath)) {
  Write-Err "Zip not found: $zipPath"
  Write-Host "Build it:" -ForegroundColor Yellow
  Write-Host "  Compress-Archive -Path 'src\*' -DestinationPath '$zipPath' -Force" -ForegroundColor Yellow
  exit 1
}
$zipInfo = Get-Item $zipPath
Write-OK "Found: $zipPath ($($zipInfo.Length) bytes)"

# Build release notes (shared)
$notes = @"
## Bookmark Matrix v$Version

### What's new in v$Version

- **Quick Switcher** (`Ctrl+Shift+B` / `Cmd+Shift+B` on Mac)
  - Open from any tab, fuzzy search across title / URL / domain / tags / notes
  - Smart ranking: exact (1000) > starts (500) > contains (200) > URL (100) > domain exact (150) > tags (80) > fuzzy (30) > star (+5)
  - Keyboard nav: Up/Down move, Enter open, Ctrl+Enter background open, Esc close
  - Window reuse: focuses existing window instead of opening duplicate

### Features

- 18 auto-categories (100% test accuracy)
- Tags / Notes / Starred per bookmark
- Full-screen matrix page + drag-to-sort categories
- Statistics: bar chart, donut, timeline, top domains
- Health check: dead link + RSS feed detection
- Periodic review via browser notifications
- Kanban view: status + priority columns
- 4 theme presets + smart favicons
- Cross-device JSON sync
- Full-text search
- Optional PWA standalone version

### Privacy

100% offline by default. Zero telemetry. Zero dependencies.
All data stays in your browser's local storage.

### Tech

- Manifest V3 (Chrome 88+ / Edge 88+)
- Pure JavaScript, no frameworks
- 228 unit tests, 100% passing
- Open source on GitHub

### Links

- Source: https://github.com/weixingyu-wxy/bookmark-matrix
- Privacy Policy: https://weixingyu-wxy.github.io/bookmark-matrix/privacy.html
- Issues: https://github.com/weixingyu-wxy/bookmark-matrix/issues

---

Author: Xingyu Wei
AI Use Statement: Code and docs assisted by Mavis (MiniMax Code).
"@

# Create release
Write-Step "Creating v$Version release..."
gh release create "v$Version" `
  --title "Bookmark Matrix v$Version" `
  --notes $notes `
  --target main `
  $zipPath

if ($LASTEXITCODE -eq 0) {
  Write-OK "`nRelease created successfully`n"
  Write-Host "Visit: https://github.com/weixingyu-wxy/bookmark-matrix/releases/tag/v$Version" -ForegroundColor Cyan
} else {
  Write-Err "Release creation failed"
  exit 1
}
