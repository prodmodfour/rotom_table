---
review_id: code-review-293
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-020
domain: healing
commits_reviewed:
  - 9ee31c52
  - d55e225e
  - f4baf3ee
  - 474bc3e5
  - 2f30d9c3
files_reviewed:
  - app/server/api/encounters/[id]/use-item.post.ts
  - app/components/encounter/UseItemModal.vue
  - app/assets/scss/components/_use-item-modal.scss
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T22:55:00Z
follows_up: code-review-287
---

## Review Scope

Re-review of feature-020 P2 fix cycle. Previous code-review-287 found 1 CRITICAL, 2 HIGH, 2 MEDIUM issues. This review verifies all five fixes across 5 commits and 4 files. Rules-review-263 already APPROVED the PTU rule compliance.

Decrees checked: decree-041 (Awakening at $200 — catalog unchanged, per decree-041 this is correct), decree-017 (effective max HP healing cap — not affected by these fixes). No decree violations.

## Issues

No new issues found. All five issues from code-review-287 are resolved correctly.

## Verification of Previous Issues

### C1 (CRITICAL): UseItemModal.vue exceeds 800-line limit -- RESOLVED

**Commit:** `474bc3e5` — refactor: extract UseItemModal SCSS into separate partial file

UseItemModal.vue was 971 lines. The fix extracts ~350 lines of scoped SCSS into `app/assets/scss/components/_use-item-modal.scss` (352 lines), bringing the component down to 625 lines — well under the 800-line limit. The component now uses `@import '~/assets/scss/components/use-item-modal'` in its `<style lang="scss" scoped>` block. This follows the same pattern established by MoveTargetModal's SCSS extraction. The extracted styles are a clean 1:1 move with no modifications to the CSS itself.

Verified: `wc -l UseItemModal.vue` = 625 lines.

### H1 (HIGH): Missing turn validation -- RESOLVED

**Commit:** `9ee31c52` — fix: add turn validation to use-item endpoint

The fix adds turn validation at lines 77-88 of `use-item.post.ts`, after loading the encounter and resolving the user combatant but before any action logic. The implementation:

1. Gates on `record.isActive` — correctly skips validation for pre-combat setup.
2. Parses `record.turnOrder` as `string[]` (correct — turnOrder is stored as JSON in the DB).
3. Resolves `currentTurnId` from `turnOrder[record.currentTurnIndex]`.
4. Checks `isUsersTurn` (exact ID match) or `hasHeldAction` (`user.holdAction?.isHolding === true`).
5. Throws 400 if neither condition is met.

This matches the design spec Section J requirement and the suggested fix from code-review-287. The held action path correctly uses optional chaining on `holdAction` to avoid null reference errors.

### H2 (HIGH): Duplicate trainer lookup -- RESOLVED

**Commit:** `d55e225e` — refactor: deduplicate trainer lookup in use-item endpoint

The fix hoists trainer resolution to a single `itemTrainer` variable at line 134, before the `!skipInventory` block. The variable is reused for both the inventory check (line 139) and the inventory deduction (line 204). The second lookup block that previously duplicated the `findTrainerForPokemon` call is eliminated entirely.

The deduction block condition changed from `if (!skipInventory)` with a nested `if (trainer)` to `if (!skipInventory && itemTrainer)`, which is logically equivalent since `itemTrainer` was validated non-null when `!skipInventory` in the check block above. This is a safe simplification — the `&& itemTrainer` guard is technically redundant but serves as a TypeScript narrowing hint, which is fine.

### M1 (MEDIUM): app-surface.md not updated -- RESOLVED

**Commit:** `2f30d9c3` — docs: add P2 service functions to app-surface.md

The diff shows two additions to `app-surface.md`:

1. Feature-020 description block (line 161): Added `checkItemRange — P2 adjacency validation with multi-tile token support, findTrainerForPokemon — P2 inventory owner resolution for Pokemon users` to the healing-item.service.ts description.
2. Service table (line 300): Updated the healing-item.service.ts row from `validateItemApplication, applyHealingItem, getEntityDisplayName` to include `checkItemRange (P2 adjacency check), findTrainerForPokemon (P2 inventory owner resolution)`.

Both new P2 exports are now documented.

### M2 (MEDIUM): Case-sensitive inventory matching -- RESOLVED

**Commit:** `f4baf3ee` — fix: use case-insensitive comparison for inventory item matching

The fix applies `toLowerCase()` comparisons in four locations:

1. **Server — inventory check** (line 150): `inv.name.toLowerCase() === body.itemName.toLowerCase()`
2. **Server — inventory deduction** (line 209): `inv.name.toLowerCase() === itemNameLower` (with `itemNameLower` cached at line 206)
3. **Server — remaining quantity** (line 231): `inv.name.toLowerCase() === itemNameLower`
4. **Client — getItemQuantity** (line 447-448): `inv.name.toLowerCase() === nameLower`

The server-side code caches `body.itemName.toLowerCase()` as `itemNameLower` to avoid repeated calls within the map/find operations — a good micro-optimization. The client-side code similarly caches `itemName.toLowerCase()` as `nameLower`. All four comparison sites are covered consistently. Comments document the rationale.

## What Looks Good

1. **Clean commit separation.** Each fix is a single focused commit touching only the files relevant to that specific issue. The commits are correctly ordered: turn validation (H1) first (since H2 depends on the same file), then deduplication (H2), then case-insensitive matching (M2, which builds on the deduplicated code), then SCSS extraction (C1), then docs (M1). Each intermediate state compiles.

2. **SCSS extraction preserves exact styles.** Comparing the extracted `_use-item-modal.scss` against the removed `<style>` block in the `474bc3e5` diff shows a 1:1 content match — 352 lines added to the new file, 349 removed from the component (the 3-line difference accounts for the new file's header comment). No style modifications were introduced during extraction.

3. **Hoisted trainer variable naming.** The renamed variable from `trainer` to `itemTrainer` is descriptive and avoids shadowing concerns with the more generic `trainer` name that could collide with other variables in the scope.

4. **Turn validation placement.** The validation is placed after `findCombatant` (so the user object is available for the `holdAction` check) but before any action logic (adjacency, action economy, inventory). This is the correct position — if the user is not the current combatant and has no held action, we should fail fast before doing any work.

## Verdict

**APPROVED** — All 5 issues from code-review-287 are resolved correctly. No new issues introduced. The fixes are clean, focused, and follow project patterns. The endpoint is now 288 lines (under 800), the component is 625 lines (under 800), turn validation prevents out-of-turn item use, trainer lookup is deduplicated, inventory matching is case-insensitive, and app-surface.md is updated.

## Required Changes

None.
