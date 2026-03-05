---
domain: character-lifecycle
type: browser-audit
browser_audited_at: 2026-03-05T20:44:00Z
browser_audited_by: browser-auditor
total_checked: 37
present: 20
absent: 1
error: 15
unreachable: 0
untestable: 52
---

# Browser Audit: character-lifecycle

## Summary

Browser audit of the character-lifecycle domain, verifying that UI-facing capabilities identified in the capability catalog (91 total) are actually accessible in the running application via accessibility tree snapshots.

- **52 capabilities** are server-side only (API endpoints, services, stores, types, models) and classified as **Untestable**.
- **39 capabilities** have UI elements that were checked in the browser.
  - **2 capabilities** (C055 CharacterModal ORPHAN, C030 composable) were reclassified: C055 is dead code (untestable), C030's UI terminus was verified on the player view.
- **37 capabilities** were actively checked via Playwright accessibility tree snapshots.

### Overall Results

| Classification | Count | Percentage |
|----------------|-------|------------|
| Present | 20 | 54.1% |
| Absent | 1 | 2.7% |
| Error | 15 | 40.5% |
| Unreachable | 0 | 0% |
| Untestable | 52 | -- |
| **Total Checked** | **37** | -- |

### Critical Finding: SCSS Compilation Error

**15 of 15 Error items share a single root cause:** The character detail page (`/gm/characters/[id]`) fails to render due to an SCSS compilation error in `_level-up-shared.scss`. The file references `$spacing-xs` without the SCSS variables being imported into scope.

**Root cause file:** `app/assets/scss/_level-up-shared.scss:82`
**Error:** `[sass] Undefined variable: $spacing-xs`
**Trigger component:** `LevelUpClassSection.vue` (and sibling LevelUp components)
**Impact:** The entire character detail page (C091) fails to load, blocking all 7 tab components (C056, C057, C059-C065), all 6 LevelUp modal components (C077-C083), and the page itself.

**Fix:** Add SCSS variable forwarding to `_level-up-shared.scss` or configure Vite to auto-inject the variables partial.

---

## Action Items

| Priority | Item | Severity | Action Required |
|----------|------|----------|-----------------|
| P0 | Fix SCSS `$spacing-xs` undefined in `_level-up-shared.scss` | HIGH | Add `@use` or `@forward` for `_variables.scss` in the shared SCSS file, or ensure Vite `additionalData` includes variables for all scoped SCSS blocks |
| P2 | CSV Import UI missing (C008) | LOW | The API endpoint exists but has no visible UI trigger on `/gm/sheets` or `/gm/create`. Consider adding an import button if CSV import is intended for GM use. |
| INFO | decree-051 (stat tag auto-parse) | -- | Not yet implemented. When implemented, verify `[+Stat]` auto-application appears on character detail stats tab. |
| INFO | decree-052 (structured edges) | -- | Not yet implemented. When implemented, verify edges display metadata fields on character detail classes tab and player features/edges section. |

---

## View Files

- [GM View (`/gm/*`)](view-gm.md) -- 30 capabilities checked (13 present, 1 absent, 15 error, 1 untestable)
- [Player View (`/player`)](view-player.md) -- 5 capabilities checked (5 present)
- [Group View (`/group`)](view-group.md) -- 2 capabilities checked (2 present)
- [Untestable Items](untestable-items.md) -- 52 server-side capabilities (cold storage)

---

## Methodology

1. Dev server started from main repo (`cd /home/ash/PTU-Session-Helper/app && npm run dev`)
2. Playwright headless Chrome used via `playwright-cli` commands
3. Accessibility tree snapshots captured at each route after 3-5 second SPA hydration wait
4. Each capability from the catalog checked against the accessibility tree for matching roles, text, names
5. Decrees checked: decree-051 (stat tag auto-parse) and decree-052 (structured edges) -- both are future implementation items, no current UI impact

### Routes Visited

| Route | Page Title | Status |
|-------|-----------|--------|
| `/gm/sheets` | GM - Library | Loaded successfully |
| `/gm/create` | GM - Create Character | Loaded successfully (Quick and Full modes) |
| `/gm/characters/[id]` | 500 - Internal Server Error | SCSS compilation crash |
| `/player` (pre-identity) | PTU - Player View | Loaded successfully |
| `/player` (post-identity) | PTU - Player View | Loaded successfully (all sections expanded) |
| `/group` | PTU - Group View | Loaded successfully (encounter served) |

### Browser Session Notes

- The SPA occasionally auto-navigated away from GM pages (to `/gm`, `/group`, or `/player`) after approximately 5-8 seconds. This appears related to BroadcastChannel or WebSocket sync with the active encounter. Snapshots were captured within the 4-second window before any auto-navigation.
- The group view initially showed "No player characters in library" but resolved after WebSocket connection established (5 seconds), displaying the active encounter data.
