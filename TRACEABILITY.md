# Traceability — Bookmark Matrix

**Every version of Bookmark Matrix is fully traceable.** This document is the
master index mapping every released version to its source code state, build
artifact, and distribution channels.

Last updated: 2026-08-06
Maintained by: Xingyu Wei (single-author)

---

## Quick reference: how to recover any version

| Want to... | Command |
|------------|---------|
| Get the latest stable source | `git clone git@github.com:weixingyu-wxy/bookmark-matrix.git` |
| Get a specific version's source | `git clone … && git checkout v1.4.0` |
| See what changed between versions | `git log --oneline v1.3.0..v1.4.0` |
| Download a specific version's ZIP | Go to https://github.com/weixingyu-wxy/bookmark-matrix/releases/tag/v1.4.0 |
| Verify a ZIP hasn't been tampered with | `Get-FileHash <zip> -Algorithm SHA256` and compare to table below |
| Roll back to an older version | `git checkout v1.3.0` (then re-load `src/` in `edge://extensions/`) |

---

## Version index

### v1.4.0 — 2026-08-05 (Latest stable)

| Field | Value |
|-------|-------|
| **Git commit** | `3d45389` |
| **Git tag** | `v1.4.0` (annotated) |
| **GitHub release** | https://github.com/weixingyu-wxy/bookmark-matrix/releases/tag/v1.4.0 |
| **Source ZIP** | `edge-bookmark-matrix-v1.4.0-src.zip` |
| **ZIP path** | `D:\AI_Agents\deliverables\edge-bookmark-matrix-v1.4.0-src.zip` |
| **ZIP size** | 69,495 bytes |
| **ZIP SHA256** | _(see file: `releases/v1.4.0.sha256`)_ |
| **Tests** | 228/228 passing (73 classifier + 23 io/meta + 25 stats + 55 health/board/notify + 35 themes/favicon + 17 quickswitcher) |
| **Edge Add-ons Product ID** | `83a53564-6b44-45b4-b53b-73c238e00519` |
| **Store ID** | `QRDCKPV8M1GM` |
| **CRX ID** | `ghbjpolancdlihhcmcnlebaflpjhapm` |
| **Status** | Submitted to Edge Partner Center (In review) |

**Key changes since v1.3.0:**

- ⌨️ **Quick Switcher** (`Ctrl+Shift+B` / `Cmd+Shift+B`) — full-screen popup, fuzzy search
- 🌐 **i18n infrastructure** — `_locales/en/` + `_locales/zh_CN/` with `__MSG_*__` placeholders
- 📊 17 new unit tests for Quick Switcher
- 🐛 Fixed manifest `default_locale` validation (added `_locales/` directory)
- 🐛 Trimmed `_locales/en/extensionDescription` to fit Edge 132-char limit
- 📄 Added `docs/privacy.html` for GitHub Pages privacy policy
- 📝 Added `CHANGELOG.md` (this traceability system)

**Commits in this release (newest first):**

```
3d45389  v1.4.0: Quick Switcher (Ctrl+Shift+B) + 17 tests + CHANGELOG
9e627a9  Fix manifest: add _locales/ for default_locale=en validation
21cfada  Fix manifest: correct homepage_url to bookmark-matrix, add default_locale=en
```

---

### v1.3.0 — 2026-08-05 (Initial release)

| Field | Value |
|-------|-------|
| **Git commit** | `1b2432d` |
| **Git tag** | `v1.3.0` (annotated) |
| **GitHub release** | https://github.com/weixingyu-wxy/bookmark-matrix/releases/tag/v1.3.0 |
| **Source ZIP** | `edge-bookmark-matrix-v1.3.0-src.zip` |
| **ZIP path** | `D:\AI_Agents\deliverables\edge-bookmark-matrix-v1.3.0-src.zip` |
| **ZIP size** | 63,475 bytes |
| **ZIP SHA256** | _(see file: `releases/v1.3.0.sha256`)_ |
| **Tests** | 211/211 passing |
| **Status** | First public release; v1.4.0 supersedes |

**Key features:**

- 18-category auto-classifier (73 unit tests, 100% accuracy)
- Tags / Notes / Starred per bookmark
- Full-screen matrix page (new tab)
- Drag-to-sort categories
- Statistics (bar / donut / timeline / top domains)
- Health check (dead link + RSS feed detection)
- Periodic review (browser notifications)
- Kanban view (status + priority)
- 4 theme presets
- Smart favicon (LRU + base64 inline)
- Cross-device JSON sync
- Full-text search
- Optional PWA standalone version

**Commits in this release:**

```
1b2432d  v1.3.0: initial release with src, docs, and store assets
7615a68  v1.3.0: add DEPLOY.md, push.ps1, release.ps1 (release tooling)
3ef21d8  Add DEVELOPER_GUIDE.md (full lifecycle guide) + README links
```

---

## Update flow (for future versions)

Every future update follows this 6-step pipeline, designed so no step is
ambiguous and every artifact is independently verifiable:

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. Code changes in src/                                            │
│     ↓                                                                │
│  2. Tests added/updated in tools/                                   │
│     ↓ (CI: node --test tools/test_*.js → all pass)                  │
│  3. Update CHANGELOG.md + TRACEABILITY.md (pre-release section)     │
│     ↓ (one commit: "v1.5.0: feature X + Y")                         │
│  4. git tag -a v1.5.0 <commit-sha> -m "..."                          │
│     ↓ (git push origin v1.5.0)                                      │
│  5. .\release.ps1 -Version "1.5.0"                                   │
│     - builds ZIP (scripts/build_zip.py, forward-slash)              │
│     - computes SHA256                                               │
│     - saves releases/v1.5.0.sha256                                  │
│     - gh release create v1.5.0 (clobber if exists)                  │
│  6. Update TRACEABILITY.md final section                            │
│     - commit "v1.5.0: traceability index updated"                   │
│     - push                                                           │
└──────────────────────────────────────────────────────────────────────┘
```

**Invariants guaranteed by this process:**

1. **Every release is git-tagged** with an annotated tag pointing to the exact commit.
2. **Every release has a SHA256 hash** stored in `releases/v<Version>.sha256` for tamper detection.
3. **Every release ZIP is in two places**:
   - `D:\AI_Agents\deliverables\edge-bookmark-matrix-v<Version>-src.zip` (local backup)
   - GitHub Release asset (public distribution)
4. **Every version's code can be checked out** via `git checkout v<Version>`.
5. **No orphan changes**: every local commit is either pushed or removed before the next release.

---

## File layout for traceability artifacts

```
edge-bookmark-matrix/
├── TRACEABILITY.md                  ← this file (master index)
├── CHANGELOG.md                     ← human-readable change log
├── README.md                        ← project overview
│
├── releases/                        ← per-version artifacts
│   ├── v1.3.0.sha256                ← SHA256 of v1.3.0 ZIP
│   ├── v1.3.0-notes.md              ← release notes for v1.3.0
│   ├── v1.4.0.sha256                ← SHA256 of v1.4.0 ZIP
│   └── v1.4.0-notes.md              ← release notes for v1.4.0
│
├── src/                             ← extension source (this version)
├── tools/                           ← tests + generators
├── store/                           ← Edge Add-ons store materials
├── docs/                            ← privacy policy + GitHub Pages
├── standalone/                      ← PWA standalone version
│
├── .git/                            ← full git history (every commit)
└── push.ps1, release.ps1            ← release automation
```

---

## How to verify a downloaded ZIP

```powershell
# 1. Compute SHA256
Get-FileHash "D:\path\to\edge-bookmark-matrix-v1.4.0-src.zip" -Algorithm SHA256

# 2. Compare to the official hash in releases/v1.4.0.sha256
Get-Content "D:\path\to\repo\releases\v1.4.0.sha256"

# 3. If they match → ZIP is authentic
# 4. If they don't match → ZIP was tampered with, do not use
```

---

## Source-of-truth precedence

When in doubt, **the order of authority is**:

1. **Git commit SHA** (canonical — what the code actually is)
2. **Git tag** (human-friendly name pointing to commit)
3. **GitHub Release** (artifact + notes + ZIP)
4. **Local ZIP in `D:\AI_Agents\deliverables\`** (offline backup)
5. **CHANGELOG.md** (human-readable narrative, not authoritative)
6. **TRACEABILITY.md** (this file — index of above)
7. **README.md** (current state, not history)

If any of these disagree, the higher number wins. Most commonly this happens when
a ZIP was rebuilt without re-tagging — always re-tag the source commit and
re-compute the hash.

---

## Maintenance rules (MUST follow for every new version)

1. **NEVER** edit a tagged commit. If a tagged release has a bug, release a new
   patch version (v1.4.1) with the fix, not amend the old tag.
2. **NEVER** delete a tag. Tags are immutable historical markers.
3. **NEVER** delete a release on GitHub. Old releases stay for users on older
   Edge versions.
4. **ALWAYS** run all tests before tagging. A tagged commit with failing tests
   is a corrupted version.
5. **ALWAYS** update TRACEABILITY.md before tagging, so the tag points to a
   commit that already references itself in the index.
6. **ALWAYS** keep `D:\AI_Agents\deliverables\` ZIPs — they're the only
   offline-copy of every version that doesn't require GitHub to be online.

---

Author: Xingyu Wei
AI Use Statement: This traceability system was designed with assistance from
Mavis (MiniMax Code AI assistant) and reviewed by the author.
