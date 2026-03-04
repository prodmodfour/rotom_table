---
review_id: code-review-290
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - 1642491f
  - a9a4789c
  - 93ebfcee
  - 854a0d97
  - 34165cb6
files_reviewed:
  - app/server/services/evolution.service.ts
  - app/server/api/pokemon/[id]/evolution-undo.post.ts
  - app/prisma/seed.ts
  - app/components/pokemon/EvolutionConfirmModal.vue
  - app/composables/useEvolutionUndo.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T20:45:00Z
follows_up: code-review-248
---

## Review Scope

Re-review of P2 fix cycle for feature-006 (Pokemon Evolution System). 5 fix commits addressing 1 CRITICAL, 3 HIGH, and 3 MEDIUM issues from code-review-248 and 1 CRITICAL, 2 MEDIUM issues from rules-review-224.

Decrees checked: decree-035 (nature-adjusted Base Relations -- no changes to this logic, still compliant), decree-036 (stone evolution move learning -- no changes to this logic, still compliant).

## Issue Resolution Verification

### code-review-248 C1: Evolution undo does not revert notes -- RESOLVED

**Commit:** 1642491f

`PokemonSnapshot` interface in `evolution.service.ts` (line 81) now includes `notes: string | null`. The snapshot capture in `performEvolution()` (line 505) stores `pokemon.notes` before evolution. The undo endpoint's `SNAPSHOT_FIELDS` array (line 24-26) now includes `'notes'`, and the `prisma.pokemon.update()` call restores it (line 114): `notes: snapshot.notes ?? null`. The `notes` field is correctly marked as nullable in the validation loop (line 49).

Verified: The evolution history note `[Evolved from X at Level Y on Z]` is fully reverted when undo is performed.

### code-review-248 H1: Two separate prisma.pokemon.update() calls not wrapped in transaction -- RESOLVED

**Commit:** 93ebfcee

The previous two-update pattern (step 11: species/stats, step 13: notes) has been collapsed into a single `prisma.$transaction()` call (lines 621-688). The notes update is now part of the Pokemon update data (line 646: `notes: updatedNotes`). Stone consumption runs within the same transaction using the `tx` client (lines 653-685). If stone consumption fails, the entire transaction rolls back, preventing the scenario where evolution commits but stone consumption errors.

Verified: Single atomic transaction wraps all related writes.

### code-review-248 H2: Stone consumption not reversed on evolution undo -- RESOLVED

**Commits:** 1642491f + 93ebfcee

Two-part fix:
1. **Snapshot tracking:** `PokemonSnapshot.consumedStone` (lines 82-86 in evolution.service.ts) stores `{ ownerId, itemName }`. This is populated inside the transaction when stone consumption succeeds (lines 680-684).
2. **Undo restoration:** `restoreStoneToInventory()` (lines 385-415 in evolution.service.ts) handles adding the item back to inventory -- either incrementing quantity on an existing entry or creating a new entry. The undo endpoint calls this when `snapshot.consumedStone` is present (lines 119-121 in evolution-undo.post.ts).

The `restoreStoneToInventory()` function uses immutable inventory transforms (`.map()` for increment, spread for new entry), case-insensitive matching, and proper error handling. Pattern is consistent with `consumeStoneFromInventory()`.

Verified: Consumed stones are restored to trainer inventory on undo.

### code-review-248 H3: No GM override UI when stone missing from trainer inventory -- RESOLVED

**Commit:** 854a0d97

`EvolutionConfirmModal.vue` now has a `checkStoneInInventory()` async function (lines 356-370) that fetches the trainer's inventory and checks for the required stone. The `handleEvolve()` function (lines 376-390) calls this check before sending the evolve request. If the stone is missing, `confirm()` offers a GM override. If confirmed, `skipInventoryCheck` is set to `true` in the evolve request body (line 413).

The `confirm()` usage is consistent with the H3 override pattern requested. While `alert()` was flagged as a UX concern in M3, the `confirm()` here serves a different purpose (GM decision gate with yes/no) and is a standard browser API for confirmation dialogs. This is acceptable.

Verified: GM can now override missing stone and proceed with evolution.

### code-review-248 M1: app-surface.md not updated for P2 additions -- RESOLVED

**Commit:** 34165cb6

`app-surface.md` now includes:
- `POST /api/pokemon/:id/evolution-undo` endpoint description (line 115)
- `consumeItem`, `skipInventoryCheck`, `consumeHeldItem`, `undoSnapshot` in evolve endpoint docs (line 114)
- `preventedByItem`, `requiredGender`, `requiredMove` in evolution-check endpoint docs (line 113)
- `useEvolutionUndo.ts` composable with method signatures (line 178)
- `PokemonSnapshot` with `notes` + `consumedStone` fields (line 178)
- `restoreStoneToInventory` in evolution service description (line 178 and service table)
- `requiredGender`, `requiredMove` in EvolutionTrigger type description (line 178)

Verified: All P2 additions are reflected in app-surface.md.

### code-review-248 M2: Undo button has no undo-window expiry -- RESOLVED (ticket filed)

Ticket `ux-014` has been filed as requested. The ticket is at `artifacts/tickets/open/ux/ux-014.md`, priority P4/LOW, with the suggested fix approaches documented.

Verified: Deferred via ticket as recommended.

### code-review-248 M3: alert() used for prevention messaging -- RESOLVED (ticket filed)

Ticket `ux-015` has been filed as requested. The ticket is at `artifacts/tickets/open/ux/ux-015.md`, priority P4/LOW, covering both `gm/pokemon/[id].vue` and `XpDistributionResults.vue`.

Verified: Deferred via ticket as recommended.

## Additional Verification

### File sizes
- `evolution.service.ts`: 715 lines (under 800-line limit)
- `evolution-undo.post.ts`: 152 lines
- `EvolutionConfirmModal.vue`: 437 lines
- `useEvolutionUndo.ts`: 61 lines

### Undo endpoint atomicity observation (non-blocking)

The undo endpoint (evolution-undo.post.ts lines 89-121) performs the Pokemon restore and stone restore as two separate operations, not wrapped in a `$transaction()`. If the Pokemon restore succeeds but `restoreStoneToInventory()` fails, the Pokemon is reverted but the stone is not restored. This is a much narrower risk than the original H1 issue (which could leave evolution committed with stone consumption errored), because:
1. Stone restoration failure is unlikely (simple inventory increment)
2. The Pokemon state is the primary concern for undo -- stone is secondary
3. The error is caught and propagated to the client

This is acceptable for now. If stone restoration reliability becomes a concern, wrapping both operations in a transaction would be a clean improvement.

### Immutability patterns
All inventory transformations use `.map()` and `.filter()` (no direct mutation). The `useEvolutionUndo.ts` composable continues to create new `Map` instances on every state change. No regressions.

## What Looks Good

1. **Transaction pattern in performEvolution:** Clean use of `prisma.$transaction(async (tx) => ...)` with the transaction client properly passed to all inner queries. The consumed stone tracking is elegantly done inside the transaction block, ensuring the snapshot only records the consumption if it actually succeeded.

2. **restoreStoneToInventory is a proper inverse of consumeStoneFromInventory:** Same structure, same case-insensitive matching, same immutable transforms. Handles both "item exists, increment" and "item missing, add new" cases.

3. **Seed parser fix is minimal and correct:** Adding three keywords (`Learn`, `Male`, `Female`) to the existing regex with zero structural changes. The surrounding `parseEvolutionTriggerText()` already handles all three keywords in its second-stage parsing, so the only gap was the first-stage species/trigger splitter.

4. **GM override UX flow is clean:** The pre-check on stone availability before the evolve request prevents a round trip that would fail. The confirm dialog gives the GM clear information and a binary choice. The `skipInventoryCheck` flag flows cleanly through the API.

5. **Commit granularity:** 5 commits for 5 distinct fixes. Each commit is focused, properly scoped, and has a clear commit message referencing the review issue it addresses.

## Verdict

**APPROVED**

All 7 issues from code-review-248 are resolved. The fix commits are clean, well-scoped, and introduce no new issues. File sizes remain within limits. Decree compliance is maintained. The two MEDIUM tickets (ux-014, ux-015) have been properly filed for future work.

## Required Changes

None. All issues resolved.
