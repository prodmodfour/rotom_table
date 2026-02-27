---
review_id: code-review-128
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-055
domain: pokemon-lifecycle
commits_reviewed:
  - f860e1f
  - ad5c843
  - c39d146
  - d6f86f1
files_reviewed:
  - app/components/encounter/LevelUpNotification.vue
  - app/server/api/pokemon/[id]/add-experience.post.ts
  - app/components/encounter/XpDistributionModal.vue
  - app/assets/scss/components/_level-up-notification.scss
  - app/utils/experienceCalculation.ts
  - app/utils/levelUpCheck.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 3
reviewed_at: 2026-02-21T22:15:00Z
---

## Review Scope

P2 implementation of ptu-rule-055: Level-Up Notification component, standalone add-experience endpoint, and XpDistributionModal integration. Four commits reviewed against the design spec (design-xp-system-001.md, Section E).

P0 and P1 were previously reviewed and approved (code-review-117/117b, code-review-119/119b).

## Issues

### HIGH

**H1: Duplicate level-up information in XpDistributionModal results phase**

The results phase (lines 200-252 of XpDistributionModal.vue) now shows level-up information twice:

1. **Inline per-result details** (lines 222-239): Each result row with `levelUps.length > 0` already renders per-level breakdowns showing stat points, tutor points, new moves, and ability slots.
2. **LevelUpNotification component** (lines 247-250): Renders a separate aggregated view of the same data -- stat points, tutor points, new moves, ability milestones, and evolution eligibility.

These show the same information in different formats. A Pokemon that gained 2 levels shows "+1 Stat Point" twice in the inline details, then "+2 Stat Points" in the LevelUpNotification. Same moves, same ability milestones, same tutor points -- all displayed twice in the same scroll area. This is a UX issue that will confuse the GM.

**Fix:** Either remove the inline level-up details from the result rows (lines 222-239) and rely solely on LevelUpNotification for the detailed view, OR remove the LevelUpNotification and keep the inline details. The LevelUpNotification is the better-designed view (aggregated totals, color-coded, evolution info) so the recommendation is to remove the inline `result-row__details` section and let LevelUpNotification handle all level-up display.

**Location:** `app/components/encounter/XpDistributionModal.vue` lines 222-239

### MEDIUM

**M1: Missing app-surface.md update for new endpoint and component**

P2 adds `POST /api/pokemon/:id/add-experience` (a new endpoint) and `LevelUpNotification.vue` (a new component). Neither is registered in `.claude/skills/references/app-surface.md`. The P0 review (code-review-117, M2) already caught this exact same issue for the xp-calculate/xp-distribute endpoints and it was fixed. The same standard applies to P2.

**Fix:** Add `POST /api/pokemon/:id/add-experience` to the Pokemon API section. Add `LevelUpNotification.vue` to the encounter components note alongside `XpDistributionModal.vue`.

**Location:** `.claude/skills/references/app-surface.md`

**M2: No upper bound validation on `amount` in add-experience endpoint**

The validation on line 33 of `add-experience.post.ts` checks `body.amount < 1` but has no upper bound. While `calculateLevelUps` caps experience at `MAX_EXPERIENCE` (20,555), there is no server-side rejection of unreasonable values. The xp-distribute endpoint has an implicit ceiling via the pool-level check against `totalXpPerPlayer * playerCount`. The add-experience endpoint has no such guard.

A value like `amount: 999999999` would succeed (XP simply caps at 20,555), but this is sloppy for a production API. An explicit upper bound prevents accidental misuse and makes the API self-documenting.

**Fix:** Add an upper bound check: `body.amount > MAX_EXPERIENCE` should return a 400 error. This matches the significance multiplier validation pattern in xp-calculate (0.5-10 range).

**Location:** `app/server/api/pokemon/[id]/add-experience.post.ts` line 33

**M3: Non-unique `v-for` key for moves in LevelUpNotification**

Line 42 of `LevelUpNotification.vue` uses `:key="move"` for the `v-for="move in entry.allNewMoves"` loop. The `allNewMoves` array is built via `flatMap` across all level-ups. While rare, if a Pokemon's learnset has the same move name at multiple levels (some species data quirks), the key would be non-unique, causing Vue rendering issues.

The same pattern exists in XpDistributionModal line 230 (`:key="move"` for `lu.newMovesAvailable`), but that one is scoped per-level so duplicates are less likely.

**Fix:** Use index-based keys: `v-for="(move, index) in entry.allNewMoves" :key="'move-' + index"`.

**Location:** `app/components/encounter/LevelUpNotification.vue` line 42

## What Looks Good

1. **Clean component architecture.** LevelUpNotification is a pure presentational component with a single prop (`results: XpApplicationResult[]`) and a single computed that transforms data for display. No store access, no side effects, no API calls. Textbook SRP.

2. **Immutability.** All transformations in the `levelUpEntries` computed use `.filter()`, `.map()`, `.flatMap()`, and `.reduce()` -- no mutations. The endpoint builds the result object via spread, never mutating the DB record.

3. **Consistent endpoint pattern.** The `add-experience.post.ts` endpoint follows the exact same structure as `xp-distribute.post.ts`: load Pokemon, load learnset, calculate level-ups, update DB, return `XpApplicationResult`. Error handling re-throws HTTP errors and wraps unexpected errors in 500. Consistent with established codebase conventions.

4. **SCSS partial extraction.** The SCSS is properly separated into `_level-up-notification.scss`, keeping the SFC lean at 140 lines. Color-coded detail items (teal=stat, violet=tutor, green=move, pink=ability, amber=evolution) use existing SCSS variables correctly (`$color-accent-teal`, `$color-accent-violet`, `$color-success`, `$color-accent-pink`, `$color-warning`).

5. **Correct XP capping.** Both endpoints apply `Math.min(newExperience, MAX_EXPERIENCE)` before writing to the DB, consistent with the P0 xp-distribute endpoint. The double-cap (once in `calculateLevelUps`, once in the endpoint) is benign redundancy that acts as defense-in-depth.

6. **Correct tutor point calculation.** Tutor points are accumulated from `levelResult.levelUps.filter(lu => lu.tutorPointGained).length` and added to the existing `pokemon.tutorPoints`, matching the xp-distribute endpoint exactly.

7. **Conditional rendering.** The `hasLevelUps` computed and `v-if="hasLevelUps"` guard prevents rendering an empty LevelUpNotification when no Pokemon leveled up.

8. **Good commit granularity.** Four commits with clear separation: component (f860e1f), endpoint (ad5c843), integration (c39d146), documentation (d6f86f1). Each produces a working state.

9. **Proper Phosphor icon usage.** Uses `<img>` tags with Phosphor SVG icons (star, arrow-right, chart-bar, graduation-cap, sword, lightning, arrow-circle-up) -- consistent with project convention, no emojis.

## Verdict

**CHANGES_REQUIRED** -- One HIGH issue (duplicate level-up display creating UX confusion) and three MEDIUM issues (missing app-surface.md update, no upper bound on amount, non-unique v-for key). None are architectural problems; all are straightforward fixes.

## Required Changes

| Priority | Issue | Fix Description |
|----------|-------|-----------------|
| HIGH | H1 | Remove inline `result-row__details` (lines 222-239) from XpDistributionModal results phase, letting LevelUpNotification handle all level-up detail display |
| MEDIUM | M1 | Add `add-experience` endpoint and `LevelUpNotification.vue` to app-surface.md |
| MEDIUM | M2 | Add upper bound validation (`amount > MAX_EXPERIENCE` -> 400) in add-experience endpoint |
| MEDIUM | M3 | Use index-based key for move `v-for` in LevelUpNotification (`:key="'move-' + index"`) |
