# Privacy Policy — Bookmark Matrix

**Last updated**: 2026-08-05
**Effective date**: 2026-08-05
**Author**: Xingyu Wei
**Contact**: weixingyu.cq@gmail.com

---

## 1. Overview

Bookmark Matrix ("the Extension") is a Microsoft Edge browser extension that helps you organize and manage your bookmarks. This privacy policy explains what data the Extension accesses, how it is used, and what we do — and do not do — with it.

**Short version**: We don't collect anything. All your data stays on your device. The only network requests happen when YOU explicitly click the "Health Check" button.

---

## 2. Data We Access

The Extension requests the following permissions from your browser:

| Permission | Why we need it |
|------------|----------------|
| `bookmarks` | To read your local bookmarks so we can categorize and display them. We only read; we do not modify your bookmarks unless you explicitly delete one through the UI. |
| `storage` | To save your preferences (theme, category order, manual category overrides, tags, notes, starred bookmarks, health-check results) in `chrome.storage.local` on your device. |
| `alarms` | To schedule periodic "review" reminders (only if you enable this feature). |
| `notifications` | To show you a desktop notification when a review reminder fires (only if you enable this feature). |
| `favicon` | To display website icons next to your bookmarks. |
| `host_permissions` (http://*/*, https://*/*) | To make outbound HTTP requests when YOU click the "Health Check" button. The Extension validates whether a bookmark URL is reachable and whether its RSS feed is still valid. |

---

## 3. Data We Do NOT Collect

We want to be unambiguous:

- ❌ We do **not** collect your bookmarks, tags, notes, or any of your personal data on any server.
- ❌ We do **not** send analytics, telemetry, or crash reports.
- ❌ We do **not** use cookies, tracking pixels, or fingerprinting.
- ❌ We do **not** include any third-party SDKs (no Google Analytics, no Facebook Pixel, no Mixpanel, no Sentry, nothing).
- ❌ We do **not** sell or share any data with anyone, because we have no data to sell.
- ❌ We do **not** call any Large Language Model (LLM) API. No ChatGPT, no Claude, no Gemini, nothing.

The Extension has **zero dependencies** — no jQuery, no React, no Vue, no analytics libraries. The code is fully reviewable on [GitHub](https://github.com/weixingyu-wxy/xiuxian-world).

---

## 4. What Happens When You Use the Extension

### 4.1 Default Behavior (Offline)
By default, the Extension makes **zero network requests**. All processing — categorization, search, sorting, statistics — happens locally on your device.

### 4.2 Health Check (User-Triggered)
If you click the "Health Check" button (🩺) in the Extension, the Extension will:

- Send an HTTP HEAD (fallback GET) request to each bookmark URL to verify it returns a 2xx/3xx status code.
- If the URL appears to be a feed, fetch the page and look for `<link rel="alternate" type="application/rss+xml">` or similar to discover the feed URL, then fetch that feed and validate it as XML.

These requests are sent **directly from your browser to the destination website**. The requests are **not** routed through any server we operate. We do not log, record, store, or transmit the responses anywhere except back to your local `chrome.storage.local`.

If you do not click the Health Check button, no network requests are made.

### 4.3 Other Features
All other features (categorization, tags, notes, starred, drag-and-drop, themes, search, statistics, kanban, periodic review) operate entirely offline. No data leaves your device.

---

## 5. Where Your Data Is Stored

All Extension data is stored in `chrome.storage.local` on your device. This storage is:

- Local to your browser profile
- Not synced to Google's servers (this is `local`, not `sync`)
- Not accessible to other extensions unless they have the same storage key (ours is `overrides`, `bookmark_meta`, `category_order`, `theme`, `themeId`, `viewMode`, `review_cache`, `review_settings`)
- Cleared when you uninstall the Extension

We have **no server-side storage**. There is no backend database. We literally cannot access your data, because we never receive it.

---

## 6. Children

The Extension does not target children under 13. We do not knowingly collect any data from children. The Extension does not collect data from anyone, period.

---

## 7. Changes to This Policy

If we change this policy, we will:

1. Update the "Last updated" date at the top
2. Bump the Extension version number
3. Briefly describe the change in the Extension's release notes on the Edge Add-ons store
4. For material changes, notify users via a one-time notification on Extension startup (if you have the periodic review feature enabled)

---

## 8. Your Rights

You can:

- **Export all your data** to a JSON file at any time via the Extension's ↕ menu
- **Delete all your data** by uninstalling the Extension
- **Inspect the source code** on GitHub: https://github.com/weixingyu-wxy/xiuxian-world
- **Contact the author** at: weixingyu.cq@gmail.com

Since we don't collect any data, we have nothing to provide, export, or delete on our side. All actions apply to your local data only.

---

## 9. Data Breach Policy

We do not maintain a server. We have no database. We collect nothing. A "data breach" in the traditional sense is not possible because there is no centralized data to breach.

The only theoretical risk is the open-source code itself being tampered with. To mitigate this, the GitHub repository is public and the build process is transparent — anyone can verify the code that ships in the Extension matches the code on GitHub.

---

## 10. Compliance

This Extension and its privacy practices are designed to comply with:

- **GDPR** (EU General Data Protection Regulation) — we collect no personal data, so most GDPR obligations do not apply
- **CCPA** (California Consumer Privacy Act) — no sale of personal information (because none is collected)
- **PIPL** (中国个人信息保护法) — 不收集任何个人信息
- **CSL** (网络安全法) — 无数据上报
- **DSL** (数据安全法) — 无数据传输

---

## 11. Contact

If you have any questions about this privacy policy or the Extension:

- **Email**: weixingyu.cq@gmail.com
- **GitHub**: https://github.com/weixingyu-wxy/xiuxian-world/issues
- **Extension author**: Xingyu Wei

---

## 12. TL;DR (Too Long; Didn't Read)

> The Extension is 100% offline by default. It reads your bookmarks (to categorize them) and stores preferences locally. The only network requests happen when you click "Health Check" — those go directly from your browser to the website, never through any server we operate. We don't collect, store, or share any of your data because we have no servers. Source code is on GitHub for review.

---

**Author**: Xingyu Wei
**AI Use Statement**: This privacy policy was drafted with the assistance of Mavis (MiniMax Code) and reviewed by the author.
