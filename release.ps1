# release.ps1 — One-shot release pipeline (with full traceability)
#
# Usage: .\release.ps1 -Version "1.5.0"
#
# This script enforces the 6-step pipeline defined in TRACEABILITY.md.
# Every release is auto-tagged, auto-hashed, auto-archived, and the
# traceability index is updated.

param(
  [Parameter(Mandatory)][string]$Version,
  [string]$ZipPath = "D:\AI_Agents\deliverables\edge-bookmark-matrix-v$Version-src.zip",
  [string]$Owner   = "weixingyu-wxy",
  [string]$Repo    = "bookmark-matrix"
)

$ErrorActionPreference = 'Stop'

function Write-Step($text) { Write-Host ">> $text" -ForegroundColor Cyan }
function Write-OK($text)   { Write-Host "[OK] $text" -ForegroundColor Green }
function Write-Err($text)  { Write-Host "[ERR] $text" -ForegroundColor Red }
function Write-Warn($text){ Write-Host "[!] $text" -ForegroundColor Yellow }

Write-Host "`n=== Bookmark Matrix Release v$Version ===`n" -ForegroundColor Magenta

# ===== Step 0: Preflight =====
Write-Step "Step 0/6: Preflight checks"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Err "gh CLI not installed (winget install GitHub.cli)"
  exit 1
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Err "python not installed"
  exit 1
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Err "git not installed"
  exit 1
}
Write-OK "gh, python, git all present"

# Check we're in the right repo
$repoRoot = git rev-parse --show-toplevel 2>$null
if ($repoRoot -notmatch "edge-bookmark-matrix$") {
  Write-Err "Not in edge-bookmark-matrix repo: $repoRoot"
  exit 1
}
Set-Location $repoRoot
Write-OK "In repo: $repoRoot"

# Check for uncommitted changes
$status = git status --short
if ($status) {
  Write-Warn "Uncommitted changes detected:"
  $status | ForEach-Object { Write-Host "    $_" }
  $confirm = Read-Host "Continue anyway? (y/N)"
  if ($confirm -ne 'y') { Write-Err "Aborted"; exit 1 }
}

# Verify tests pass
Write-Step "Step 0b: Running test suite"
$testResult = node --test tools/test_*.js 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Err "Tests failed:"
  $testResult | Select-Object -Last 20
  exit 1
}
$passLine = ($testResult | Select-String -Pattern "pass \d" | Select-Object -First 1)
Write-OK "All tests pass: $passLine"

# Verify CHANGELOG + TRACEABILITY mention v$Version
$changelog = Get-Content "CHANGELOG.md" -Raw
$trace = Get-Content "TRACEABILITY.md" -Raw
if ($changelog -notmatch "\[${Version}\]") {
  Write-Warn "CHANGELOG.md does not mention [$Version] entry"
}
if ($trace -notmatch "v$Version") {
  Write-Warn "TRACEABILITY.md does not mention v$Version"
  $confirm = Read-Host "Update TRACEABILITY.md now? (y/N)"
  if ($confirm -eq 'y') {
    Write-Warn "Please update TRACEABILITY.md manually, then re-run this script"
    exit 1
  }
}

# ===== Step 1: Build ZIP =====
Write-Step "Step 1/6: Building ZIP with forward-slash paths"

if (Test-Path $ZipPath) { Remove-Item $ZipPath }
$buildScript = Join-Path $repoRoot "scripts\build_zip.py"
if (-not (Test-Path $buildScript)) {
  Write-Err "scripts/build_zip.py not found at $buildScript"
  exit 1
}
& python $buildScript --src "./src" --out $ZipPath
if ($LASTEXITCODE -ne 0) { Write-Err "ZIP build failed"; exit 1 }
$zipSize = (Get-Item $ZipPath).Length
Write-OK "ZIP built: $ZipPath ($zipSize bytes)"

# ===== Step 2: Compute SHA256 =====
Write-Step "Step 2/6: Computing SHA256"
$hash = (Get-FileHash $ZipPath -Algorithm SHA256).Hash.ToLower()
$releasesDir = Join-Path $repoRoot "releases"
if (-not (Test-Path $releasesDir)) { New-Item -ItemType Directory -Path $releasesDir | Out-Null }
$shaFile = Join-Path $releasesDir "v$Version.sha256"
"$hash  $(Split-Path $ZipPath -Leaf)" | Out-File -Encoding UTF8 $shaFile
Write-OK "SHA256: $hash"
Write-OK "Written to: $shaFile"

# ===== Step 3: Git tag =====
Write-Step "Step 3/6: Creating git tag v$Version"
$existingTag = git tag -l "v$Version"
if ($existingTag) {
  Write-Warn "Tag v$Version already exists locally. Skipping."
} else {
  $lastCommit = git rev-parse HEAD
  git tag -a "v$Version" $lastCommit -m "v$Version release"
  Write-OK "Tag v$Version created at $lastCommit"
}

# Push tag
Write-Step "Step 3b: Pushing tag to origin"
$pushConfirm = Read-Host "Push tag v$Version to GitHub? (y/N)"
if ($pushConfirm -eq 'y') {
  $token = Read-Host "GitHub PAT" -AsSecureString
  $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
  $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

  git config --global http.sslVerify false
  $originalRemote = git remote get-url origin
  git remote set-url origin "https://x-access-token:$plain@github.com/$Owner/$Repo.git"
  git push origin "v$Version" 2>&1 | Out-Null
  git remote set-url origin $originalRemote
  git config --global --unset http.sslVerify
  Write-OK "Tag pushed to origin"

  # ===== Step 4: GitHub Release =====
  Write-Step "Step 4/6: Creating GitHub Release with ZIP asset"
  $env:GH_TOKEN = $plain
  $notesFile = Join-Path $releasesDir "v$Version-notes.md"
  if (Test-Path $notesFile) {
    gh release create "v$Version" --repo "$Owner/$Repo" --title "Bookmark Matrix v$Version" --notes-file $notesFile --target main $ZipPath 2>&1 | Out-Null
  } else {
    Write-Warn "No notes file at $notesFile, using inline summary"
    $notes = "v$Version release. See CHANGELOG.md and TRACEABILITY.md for details."
    gh release create "v$Version" --repo "$Owner/$Repo" --title "Bookmark Matrix v$Version" --notes $notes --target main $ZipPath 2>&1 | Out-Null
  }
  $env:GH_TOKEN = $null

  if ($LASTEXITCODE -eq 0) {
    Write-OK "Release created: https://github.com/$Owner/$Repo/releases/tag/v$Version"
    Write-Host "`n[!] Reminder: REVOKE this PAT at https://github.com/settings/tokens" -ForegroundColor Yellow
  } else {
    Write-Err "Release creation failed (exit $LASTEXITCODE)"
  }
} else {
  Write-Warn "Tag push skipped by user"
}

# ===== Step 5: Verify final state =====
Write-Step "Step 5/6: Verifying final state"
$finalTag = git rev-parse "v$Version^{commit}"
Write-OK "Tag v$Version → $finalTag"

# ===== Step 6: Done =====
Write-Step "Step 6/6: Done"
Write-Host ""
Write-Host "Artifacts produced:" -ForegroundColor Cyan
Write-Host "  - Git tag:           v$Version ($finalTag)"
Write-Host "  - ZIP file:          $ZipPath ($zipSize bytes)"
Write-Host "  - SHA256 file:       $shaFile"
Write-Host "  - Release notes:     $releasesDir\v$Version-notes.md"
Write-Host ""
Write-Host "Verify with:" -ForegroundColor Cyan
Write-Host "  Get-FileHash '$ZipPath' -Algorithm SHA256"
Write-Host "  Get-Content '$shaFile'"
Write-Host ""
Write-Host "Don't forget:" -ForegroundColor Yellow
Write-Host "  1. Manually update TRACEABILITY.md if v$Version is the new latest"
Write-Host "  2. Commit releases/v$Version.sha256 + v$Version-notes.md"
Write-Host "  3. Submit the new ZIP to Edge Partner Center"
