# push.ps1 - One-click GitHub push
# Author: Xingyu Wei + Mavis
# Note: ASCII-only to avoid PowerShell 5.1 GBK encoding issues

$ErrorActionPreference = 'Stop'

function Step($t) { Write-Host ">> $t" -ForegroundColor Cyan }
function OK($t)   { Write-Host "[OK] $t" -ForegroundColor Green }
function Warn($t) { Write-Host "[!] $t" -ForegroundColor Yellow }
function Err($t)  { Write-Host "[X] $t" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Bookmark Matrix: One-Click GitHub Push ===`n" -ForegroundColor Magenta

# Step 0: Check git
Step "Checking git..."
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Err "git not installed. Get Git for Windows: https://git-scm.com/"
}
OK "git installed: $(git --version)"

# Step 1: Configure git user
Step "Configuring git user..."
$userName = git config --global user.name
$userEmail = git config --global user.email
if (-not $userName) {
  git config --global user.name "Xingyu Wei"
  OK "user.name = Xingyu Wei"
} else { OK "user.name = $userName" }
if (-not $userEmail) {
  git config --global user.email "weixingyu.cq@gmail.com"
  OK "user.email = weixingyu.cq@gmail.com"
} else { OK "user.email = $userEmail" }

# Step 2: Prepare docs/privacy.md
Step "Preparing docs/privacy.md..."
if (-not (Test-Path docs/privacy.md)) {
  New-Item -ItemType Directory -Force -Path docs | Out-Null
  if (Test-Path store/privacy-policy.md) {
    Copy-Item store/privacy-policy.md docs/privacy.md
    OK "Copied store/privacy-policy.md to docs/privacy.md"
  } else {
    Warn "store/privacy-policy.md not found, skipping"
  }
} else { OK "docs/privacy.md already exists" }

# Step 3: Create .gitignore
Step "Checking .gitignore..."
if (-not (Test-Path .gitignore)) {
  $gitignoreContent = @"
node_modules/
.DS_Store
__pycache__/
*.pyc
.vscode/
.idea/
*.log
README.md.bak
"@
  $gitignoreContent | Out-File -Encoding utf8 .gitignore
  OK "Created .gitignore"
} else { OK ".gitignore already exists" }

# Step 4: Check SSH key
Step "Checking SSH key..."
$sshKey = "$env:USERPROFILE\.ssh\id_ed25519"
if (Test-Path $sshKey) {
  OK "Found SSH key: $sshKey"
  $hasSshKey = $true
} else {
  Warn "No id_ed25519 found, will use HTTPS"
  $hasSshKey = $false
}

# Step 5: Configure remote
Step "Configuring git remote..."
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
  git remote add origin https://github.com/weixingyu-wxy/bookmark-matrix.git
  OK "Added origin (HTTPS)"
} else {
  OK "origin exists: $remoteUrl"
}

# Step 6: Try SSH
$useSsh = $false
if ($hasSshKey) {
  Step "Testing SSH connection..."
  ssh-keygen -R github.com 2>$null | Out-Null
  Start-Service ssh-agent -ErrorAction SilentlyContinue
  Set-Service ssh-agent -StartupType Manual -ErrorAction SilentlyContinue
  ssh-add $sshKey 2>$null
  try {
    $sshTest = ssh -T -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 git@github.com 2>&1
    if ($LASTEXITCODE -eq 1 -and $sshTest -match "successfully authenticated") {
      OK "SSH connection successful!"
      git remote set-url origin git@github.com:weixingyu-wxy/bookmark-matrix.git
      $useSsh = $true
    } else {
      Warn "SSH failed, falling back to HTTPS"
    }
  } catch {
    Warn "SSH test failed: $($_.Exception.Message)"
  }
}

# Step 7: HTTPS fallback
if (-not $useSsh) {
  Step "Switching to HTTPS..."
  git remote set-url origin https://github.com/weixingyu-wxy/bookmark-matrix.git
  Write-Host "`nYou need a GitHub Personal Access Token (PAT)" -ForegroundColor Yellow
  Write-Host "Get one: https://github.com/settings/tokens/new" -ForegroundColor Yellow
  Write-Host "Check 'repo' scope. Copy the token (shown only once!)`n" -ForegroundColor Yellow

  $cred = Get-Credential -Message "Enter GitHub Username and Personal Access Token (NOT your password!)"
  if ($cred) {
    $env:GIT_TERMINAL_PROMPT = "0"
    $username = $cred.UserName
    $token = $cred.GetNetworkCredential().Password
    git config --global credential.helper store
    $credFile = "$env:USERPROFILE\.git-credentials"
    Add-Content -Path $credFile -Value "https://${username}:${token}@github.com`n"
    OK "Credentials saved to $credFile"
  } else {
    Err "No credentials provided, aborting"
  }
}

# Step 8: git add + commit
Step "git add..."
git add .

Step "git commit..."
$commitMsg = "v1.3.0: initial release with src, docs, and store assets"
$currentBranch = git rev-parse --abbrev-ref HEAD
try {
  git commit -m $commitMsg
  OK "Commit successful: $commitMsg"
} catch {
  Warn "Nothing to commit or commit failed (may already be committed)"
}

# Step 9: git push
Step "git push (network may be slow)..."
$env:GIT_TERMINAL_PROMPT = "0"
try {
  git push -u origin $currentBranch
  OK "`n[SUCCESS] Push complete!`n"
  Write-Host "View: https://github.com/weixingyu-wxy/bookmark-matrix" -ForegroundColor Cyan
  Write-Host "Enable Pages: Settings -> Pages -> main / docs -> Save`n" -ForegroundColor Cyan
} catch {
  Err "Push failed: $($_.Exception.Message)`n`nDiagnostics:`ngit remote -v`n`nCommon fixes:`n1. SSH failed: Use HTTPS + Personal Access Token (see above)`n2. Bad credentials: Delete $env:USERPROFILE\.git-credentials and retry`n3. Repo not found: Verify https://github.com/weixingyu-wxy/bookmark-matrix exists"
}

# Done
Write-Host "`n=== ALL DONE! ===`n" -ForegroundColor Magenta
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open https://github.com/weixingyu-wxy/bookmark-matrix" -ForegroundColor White
Write-Host "2. Settings -> Pages -> main / docs -> Save (enable GitHub Pages)" -ForegroundColor White
Write-Host "3. Wait 1-3 min, visit https://weixingyu-wxy.github.io/bookmark-matrix/privacy.html" -ForegroundColor White
Write-Host "4. Paste that URL into Edge Add-ons store Privacy Policy field`n" -ForegroundColor White
