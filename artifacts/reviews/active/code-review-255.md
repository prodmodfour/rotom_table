---
review_id: code-review-255
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - d332a047
  - 1d2d2615
  - afa5c26f
  - d266984d
  - c6cdb082
  - a693d42a
files_reviewed:
  - app/server/services/evolution.service.ts
  - app/server/api/pokemon/[id]/evolution-undo.post.ts
  - app/components/pokemon/EvolutionConfirmModal.vue
  - app/composables/useEvolutionUndo.ts
  - app/prisma/seed.ts
  - app/components/encounter/XpDistributionResults.vue
  - app/types/species.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/feature/feature-006.md
  - artifacts/designs/design-pokemon-evolution-001/_index.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T21:00:00Z
follows_up: code-review-248
---

## Review Scope

Re-review of the P2 fix cycle for feature-006 (Pokemon Evolution System). The previous reviews (code-review-248 and rules-review-224) identified 1 CRITICAL + 3 HIGH + 3 MEDIUM issues (code) and 1 CRITICAL + 2 MEDIUM issues (rules). This re-review verifies all required fixes were properly implemented across 6 commits.

Decrees checked: decree-035 (nature-adjusted Base Relations -- unmodified by fix cycle, still correct), decree-036 (stone evolution move learning -- unmodified by fix cycle, still correct).

## Issue Verification

### code-review-248 C1 (CRITICAL): Evolution undo does not revert notes -- RESOLVED

**Commit:** d332a047

The `PokemonSnapshot` interface in `evolution.service.ts` (line 81) now includes `notes: string | null`. The snapshot capture at line 505 correctly captures `pokemon.notes` before any evolution changes. The undo endpoint (`evolution-undo.post.ts` line 114) now restores `notes: snapshot.notes ?? null`, and `notes` was added to the `SNAPSHOT_FIELDS` array (line 25) with proper nullable handling in the validation loop (line 49). The evolution history note `[Evolved from X at Level Y on Z]` is now correctly reverted when an undo is performed.

**Verified:** Notes field captured in snapshot, restored on undo, nullable validation correct.

### code-review-248 H1 (HIGH): Non-atomic DB writes -- RESOLVED

**Commit:** afa5c26f

The three separate DB operations (Pokemon update, stone consumption, notes update) have been consolidated. The notes update is now included in the main `prisma.pokemon.update()` call (line 646: `notes: updatedNotes`), eliminating the redundant second update. The Pokemon update and stone consumption are wrapped in `prisma.$transaction()` (lines 621-688), so if stone consumption fails (item not found, trainer not found), the entire evolution is rolled back. The transaction uses the `tx` client consistently for both operations.

**Verified:** Single Pokemon update, atomic transaction with stone consumption, no partial-commit window.

### code-review-248 H2 (HIGH): Stone not restored on undo -- RESOLVED

**Commits:** d332a047 + afa5c26f

Two-part fix:
1. `PokemonSnapshot` now includes `consumedStone?: { ownerId: string; itemName: string } | null` (lines 83-86). The snapshot is initialized with `consumedStone: null` (line 506) and only populated inside the transaction when stone consumption actually occurs (lines 680-684).
2. The undo endpoint checks for `snapshot.consumedStone?.ownerId && snapshot.consumedStone?.itemName` (line 119) and calls the new `restoreStoneToInventory()` function (lines 385-415) to re-add the stone to the trainer's inventory. The restore function handles both the case where the item already exists (increment quantity) and where it does not (add new entry with quantity 1).

**Verified:** Stone tracked in snapshot, restored on undo, immutable inventory transformations in `restoreStoneToInventory`.

### code-review-248 H3 (HIGH): No GM override for missing stone -- RESOLVED

**Commit:** d266984d

The `EvolutionConfirmModal.vue` now includes a `checkStoneInInventory()` async function (lines 356-370) that fetches the trainer's inventory via `GET /api/characters/:ownerId` and checks if the required stone exists with `quantity > 0`. Before sending the evolve request, `handleEvolve()` calls this check for non-held-item stone evolutions (lines 378-390). If the stone is missing, a `confirm()` dialog offers the GM a clear choice: "Evolve anyway without consuming a stone?" If confirmed, `skipInventoryCheck` is set to `true` and passed through to the API. If declined, the evolution is cancelled and `evolving` is reset to `false`.

The `skipInventoryCheck` variable is correctly threaded into the `consumeItem` payload (line 414), replacing the hardcoded `false`.

**Verified:** GM override dialog with clear messaging, skip flag correctly passed to API.

### code-review-248 M1 (MEDIUM): app-surface.md not updated -- RESOLVED

**Commit:** c6cdb082

The `app-surface.md` file was updated with:
- New `POST /api/pokemon/:id/evolution-undo` endpoint documentation (line 112)
- P2 additions to `POST /api/pokemon/:id/evolve` (consumeItem, consumeHeldItem, undoSnapshot, atomic transaction)
- P2 additions to `POST /api/pokemon/:id/evolution-check` (preventedByItem, requiredGender, requiredMove)
- Updated `EvolutionTrigger` interface description (requiredGender, requiredMove)
- Added `useEvolutionUndo` composable documentation
- Updated `evolution.service.ts` description (PokemonSnapshot with notes + consumedStone, consumeStoneFromInventory, restoreStoneToInventory, atomic transaction)

**Verified:** All P2 surface additions documented.

### code-review-248 M2 (MEDIUM): Undo snapshot staleness -- DEFERRED

Filed as ux-014. Ticket exists at `artifacts/tickets/open/ux/ux-014.md`. Non-blocking per original review.

### code-review-248 M3 (MEDIUM): alert() for prevention items -- DEFERRED

Filed as ux-015. Ticket exists at `artifacts/tickets/open/ux/ux-015.md`. Non-blocking per original review.

### rules-review-224 C1 (CRITICAL): Seed parser missing Learn keyword -- RESOLVED

**Commit:** 1d2d2615

The `triggerKeywords` regex in `parseEvoLineSpeciesAndTrigger()` (seed.ts line 257) now includes `Learn`, `Male`, and `Female` keywords. This ensures that evolution lines like "Ambipom Learn Double Hit" (Aipom), "Yanmega Learn Ancient Power" (Yanma), "Mamoswine Learn Ancient Power" (Piloswine), "Lickilicky Learn Rollout" (Lickitung), "Tangrowth Learn Ancient Power" (Tangela), "Mr. Mime Learn Mimic" (Mime Jr.), and "Tsareena Learn Stomp" (Steenee) all correctly split the species name from trigger text at the "Learn" boundary. The previously unaffected "Sudowoodo Minimum Learn Mimic" (Bonsly) continues to work via the "Minimum" keyword.

Adding `Male` and `Female` prevents future fragility if a gender-only evolution line appears without a co-occurring keyword like "Minimum" or a stone name.

**Verified:** Regex updated, all 7+1 affected species will parse correctly, Male/Female added for robustness.

### rules-review-224 M1 (MEDIUM): Notes not restored on undo -- RESOLVED

Same fix as code-review-248 C1. See verification above.

### rules-review-224 M2 (MEDIUM): Stone not restored on undo -- RESOLVED

Same fix as code-review-248 H2. See verification above.

## Additional Observations

### Undo endpoint non-transactional stone restoration

The undo endpoint (`evolution-undo.post.ts` lines 89-121) performs the Pokemon state restoration and stone inventory restoration as two separate DB operations -- the `prisma.pokemon.update()` at line 89 and `restoreStoneToInventory()` at line 120 are not wrapped in a transaction. This means if `restoreStoneToInventory` fails (e.g., trainer record deleted between operations), the Pokemon would be reverted but the stone would not be restored.

This is acceptable for the following reasons:
1. The undo operation is a GM convenience feature, not a critical game mechanic
2. The failure window is extremely narrow (two sequential DB operations on a single-user SQLite database)
3. The error would be caught by the outer try/catch and returned to the user, who could manually restore the stone
4. The evolve direction (performEvolution) IS properly transactional, which is the more critical path

No action required.

### Dead `consumeStoneFromInventory` function

The `consumeStoneFromInventory()` function (evolution.service.ts lines 352-378) is still exported but no longer called anywhere -- the stone consumption logic was inlined into the `performEvolution` transaction. This is acceptable: the function is still a valid, tested utility that could be useful for future features (e.g., manual item consumption outside evolution). It does not add meaningful maintenance burden.

No action required.

### `undoSnapshot` mutation inside transaction

The `undoSnapshot.consumedStone` field is mutated inside the transaction callback (line 681). Since `undoSnapshot` is a local object created before the transaction (line 482) and the mutation only occurs after the DB writes succeed within the transaction, this is safe. The mutation does not affect the transaction's DB operations. Per project coding style, immutability is preferred, but this is a local variable with no shared references -- the mutation is contained and clear.

No action required.

### File sizes

All files remain well within the 800-line limit:
- `evolution.service.ts`: 715 lines (within budget, grew from 638 due to transaction + restoreStoneToInventory)
- `seed.ts`: 755 lines (unchanged except 1 line in regex)
- `XpDistributionResults.vue`: 451 lines (unchanged)
- `EvolutionConfirmModal.vue`: 437 lines (grew from ~400 due to GM override)
- `evolution-undo.post.ts`: 152 lines
- `useEvolutionUndo.ts`: 61 lines

### Decree compliance

- **decree-035** (nature-adjusted Base Relations): The fix cycle did not modify any Base Relations or stat recalculation logic. The existing implementation in `recalculateStats()` (lines 170-233) continues to apply nature to base stats before validation. Compliant.
- **decree-036** (stone evolution move learning): The fix cycle did not modify the evolution move learning logic. The existing implementation in `getEvolutionMoves()` (in `utils/evolutionCheck.ts`, reviewed in P1) continues to use `<= currentLevel` for stone evolutions. Compliant.

## What Looks Good

1. **Atomic transaction in performEvolution:** The `prisma.$transaction()` correctly uses the `tx` client for both the Pokemon update and stone consumption. If either operation fails, both are rolled back. The transaction boundary is well-chosen -- it covers exactly the two operations that must be atomic.

2. **Stone restoration on undo is thorough:** The `restoreStoneToInventory()` function handles both the "item exists in inventory" case (increment quantity via immutable map) and the "item not in inventory" case (append new entry via spread). This is correct for edge cases where the trainer may have traded away all their stones after the evolution.

3. **GM override UX flow is clean:** The `checkStoneInInventory` -> `confirm()` -> `skipInventoryCheck` pipeline is straightforward. The confirmation message clearly explains what will happen ("Evolve anyway without consuming a stone?"). The `evolving` flag is correctly reset on cancellation (line 385).

4. **Seed parser fix is minimal and correct:** Adding three keywords (`Learn`, `Male`, `Female`) to the trigger keyword regex is the smallest possible fix. No other parsing logic was changed, so existing behavior for Minimum/Holding/stone-based triggers is preserved. The fix is orthogonal to the second-stage parser (`parseEvolutionTriggerText`), which already handled these keywords -- only the first-stage species/trigger splitter was broken.

5. **Snapshot field additions are defensive:** `consumedStone` is typed as optional with a null default (`consumedStone?: {...} | null`), so existing snapshots without this field (from before the fix) won't cause runtime errors. The undo endpoint checks `snapshot.consumedStone?.ownerId && snapshot.consumedStone?.itemName` using optional chaining, which handles undefined/null gracefully.

6. **Commit granularity is appropriate:** Each of the 6 commits addresses exactly one issue from the previous reviews (C1, rules-C1, H1, H3, M1, docs). The commits build logically and each produces a working state.

## Verdict

**APPROVED**

All 5 required fixes from code-review-248 (C1, H1, H2, H3, M1) and all 1 required + 2 recommended fixes from rules-review-224 (C1, M1, M2) have been properly implemented. The 2 deferred items (M2 -> ux-014, M3 -> ux-015) have tickets filed. No new issues introduced by the fix cycle. Decree compliance verified (decree-035, decree-036).

## Required Changes

None. All issues resolved.
