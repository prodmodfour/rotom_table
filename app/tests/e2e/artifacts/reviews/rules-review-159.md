---
review_id: rules-review-159
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-003-track-a-p2
domain: player-view
commits_reviewed:
  - 6d80b1a
  - 969ab55
  - 891a4fe
  - 4ea8ec7
mechanics_verified:
  - trainer-hp-formula
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#trainer-hit-points
  - core/07-combat.md#derived-stats
reviewed_at: 2026-02-26T16:15:00Z
follows_up: rules-review-157
---

## Mechanics Verified

### Trainer HP Formula (Tooltip)

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) +10" (`core/02-character-creation.md` line 309) and "Trainer Hit Points = Trainer's Level x2 + (HP stat x3) + 10" (`core/07-combat.md` line 623)
- **Errata:** No errata correction found for trainer HP formula in `errata-2.md`.
- **Implementation:** `PlayerCharacterSheet.vue` line 333 builds the tooltip string:
  ```typescript
  const hpTooltip = `Max HP = Level (${props.character.level}) x2 + HP Base (${stats.hp}) x3 + 10 = ${props.character.maxHp}`
  ```
  The stat cell label was changed from `'HP'` to `'HP Base'` (line 335) to clarify that the displayed value is the base stat, not the derived max HP.
- **Cross-verification:** Server-side trainer HP calculation at `server/api/characters/index.post.ts:13` uses `level * 2 + hpStat * 3 + 10`. Encounter template loader at `server/api/encounter-templates/[id]/load.post.ts:85` uses `(level * 2) + (hpStat * 3) + 10`. Both match the tooltip formula.
- **Rulebook example validation:** Lisa's level 1 trainer with 15 HP stat yields `(1 * 2) + (15 * 3) + 10 = 57 Hit Points`, which matches the rulebook example on line 366.
- **Status:** CORRECT

### Commit History

**6d80b1a — refactor: extract PlayerCharacterSheet SCSS into external file**
- Extracted 438 lines of `<style>` block from `PlayerCharacterSheet.vue` into `app/assets/scss/components/_player-character-sheet.scss` (462 lines with comments/header).
- Registered the new file in `nuxt.config.ts` CSS array.
- No `<style>` tag remains in the Vue component.
- No PTU mechanics affected — purely structural refactoring.

**969ab55 — fix: label trainer HP stat as 'HP Base' with formula tooltip**
- Changed stat cell label from `'HP'` to `'HP Base'`.
- Added `tooltip` property to stat entries with trainer HP formula string.
- Initial tooltip used Pokemon HP formula (`Level + HP Base x3 + 10`) — missing the `x2` multiplier on Level.

**891a4fe — fix: use correct trainer HP formula (Level x2) in tooltip**
- Corrected the tooltip from `Level (N) + HP Base (N) x3 + 10` to `Level (N) x2 + HP Base (N) x3 + 10`.
- The final formula now correctly matches PTU 1.05 trainer HP: `(Level * 2) + (HP * 3) + 10`.

**4ea8ec7 — docs: update feature-003 and ux-002 tickets with resolution logs**
- Documentation-only change. No game logic.

### SCSS Extraction Verification (Non-Mechanics)

While SCSS extraction is not a PTU mechanics concern, I verified that the extraction did not alter any game-relevant UI:

1. **PlayerCharacterSheet.vue:** 384 lines (well under 800-line limit).
2. **No `<style>` block remaining** in the Vue component.
3. **SCSS registered** in `nuxt.config.ts` CSS array.
4. **Scoping preserved:** All styles use `.player-sheet` prefix (BEM naming) or `.player-sheet .child` nesting, matching the component's root class. No scoped attribute needed.
5. **4K `.list-subheader` override present** at line 431 of the extracted file with `font-size: $font-size-4k-sm`, resolving M2 from code-review-181.
6. **No conflicting `.list-subheader` definitions** found elsewhere in the SCSS codebase.
7. **Follows established pattern** from `_player-combat-actions.scss` (same extraction approach, same comment header style).

### Design Decrees

No active decrees apply to the player-view domain. Scanned all 22 decrees (decree-001 through decree-022) — none reference PlayerCharacterSheet, player view, or trainer HP display.

## Summary

This fix cycle addressed two code quality issues (M1: file size, M2: missing 4K selector) and one UX issue (ux-002: trainer HP stat confusion). The only PTU mechanic involved is the trainer HP formula displayed in a tooltip. After an initial error in commit 969ab55 (using Pokemon HP formula instead of trainer HP formula), it was corrected in commit 891a4fe. The final implementation correctly shows `Level x2 + HP Base x3 + 10`, which matches PTU 1.05 exactly.

## Rulings

1. **Trainer HP tooltip formula is CORRECT.** The tooltip string `Max HP = Level (N) x2 + HP Base (N) x3 + 10 = M` accurately represents the PTU 1.05 trainer HP formula from `core/02-character-creation.md` and `core/07-combat.md`. The computed `maxHp` value shown after the equals sign is produced by the same formula on the server side (`characters/index.post.ts:13`).

2. **"HP Base" label is appropriate.** The stat cell previously showed "HP" which could be confused with the derived max HP value. Renaming to "HP Base" with a tooltip showing the derivation formula is a clear UX improvement with no mechanical impact.

## Verdict

**APPROVED** — No PTU rule violations. The trainer HP formula in the tooltip is correct. The SCSS extraction is structurally sound with no game logic impact. All issues from code-review-181 (M1, M2) are resolved.

## Required Changes

None.
