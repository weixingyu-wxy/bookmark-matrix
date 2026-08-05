# Changelog

All notable changes to Bookmark Matrix are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.4.0] - 2026-08-05

### Added
- **Quick Switcher** (`Ctrl+Shift+B` / `Cmd+Shift+B` on Mac)
  - Full-screen popup window, opens on any tab via `chrome.commands`
  - Fuzzy search across title / URL / domain / tags / notes
  - Smart ranking: exact (1000) > starts (500) > contains (200) > URL (100) > domain exact (150) > tags (80) > fuzzy (30) > star (+5)
  - Keyboard nav: Up/Down move, Enter open, Ctrl+Enter background open, Esc close
  - Mouse hover changes active item
  - Window reuse: focuses existing window instead of opening duplicate
  - 17 unit tests covering fuzzyMatch, extractDomain, scoreBookmark, search, highlight
- New files: `src/quickswitcher.html`, `src/quickswitcher.css`, `src/quickswitcher.js`
- New test: `tools/test_quickswitcher.js` (17 tests)

### Changed
- Total tests: 211 → 228
- `src/background.js` added `chrome.commands.onCommand` handler
- `src/manifest.json` added `commands.open-quick-switcher` binding

### Fixed
- `quickswitcher.js`: `b.meta.tags` no longer throws when `b.meta` is undefined (default to empty)
- `extractDomain` test now correctly handles `URL` global in VM sandbox

## [1.3.0] - 2026-08-04

### Added
- Smart favicon system (`src/favicon.js`): offline LRU cache + multi-source fallback + base64 inline
- 4 themes: Dark, Light, Solarized, Nord (`src/themes.js`)
- 6 promo images for Edge Add-ons store (300x300 / 440x280 / 1400x560 + 6 screenshots)
- Privacy policy on GitHub Pages: `weixingyu-wxy.github.io/bookmark-matrix/privacy.html`
- Full store submission materials: `store/listing-zh-CN.txt`, `store/listing-en.txt`

### Changed
- Total tests: 176 → 211 (35 new in `test_themes_favicon.js`)
- Stats sidebar now fixed in DOM (no longer swapped during view mode change)
- Manifest `default_locale: "en"` (was removed for v1.2.0, re-added)
- Manifest `homepage_url` corrected to bookmark-matrix (was xiuxian-world placeholder)

### Fixed
- Multiple favicon race conditions under concurrent loads
- Stats card flickering on theme switch
- Manifest validation: `default_locale` mismatch with `_locales/en/messages.json`

## [1.2.0] - 2026-08-02

### Added
- **Health check** (`src/health.js`): dead link detection via HEAD request, RSS feed discovery + validation
- **Periodic review** (`src/notify.js`): `chrome.alarms` + `chrome.notifications` to remind about stale bookmarks
- **Kanban view** (`src/board.js`): drag-and-drop status (inbox/reading/todo/done/archive) + priority (high/med/low)
- **PWA standalone** (`standalone/`): full HTML app deployable to Netlify/GitHub Pages, with chrome.* API polyfill
- **Edge bookmark import** (Netscape Bookmark File Format parser)

### Changed
- Total tests: 73 → 176 (103 new tests in test_health_board_notify.js + test_io_meta.js + test_stats.js)

## [1.1.0] - 2026-07-30

### Added
- Tags / notes / starred per bookmark (stored in `chrome.storage.local`)
- Full-screen matrix page (new tab override)
- Statistics: bar chart (by category), donut (by host), timeline (by dateAdded), top domains
- JSON import / export for cross-device sync
- Drag-to-reorder categories

## [1.0.0] - 2026-07-28

### Added
- 18-category auto-classifier (offline, keyword + domain rules)
- Popup UI (800x600) with search, filter, sort
- Initial release: 73 classifier tests, 100% pass
