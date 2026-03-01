---
review_id: code-review-248
review_type: code + game-logic
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - e36f5b11
  - 52878c55
  - f82bc48f
  - 1de3db6e
  - 63633ee8
  - 339a0d90
  - 4d4651e1
  - 35cb1af5
  - 4353f7a2
files_reviewed:
  - app/utils/evolutionCheck.ts
  - app/server/services/evolution.service.ts
  - app/server/api/pokemon/[id]/evolve.post.ts
  - app/server/api/pokemon/[id]/evolution-check.post.ts
  - app/server/api/pokemon/[id]/evolution-undo.post.ts
  - app/composables/useEvolutionUndo.ts
  - app/components/pokemon/EvolutionConfirmModal.vue
  - app/components/encounter/XpDistributionResults.vue
  - app/pages/gm/pokemon/[id].vue
  - app/types/species.ts
  - app/prisma/seed.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-03-01T15:30:00Z
follows_up: code-review-243
---

## Review Scope

P2 tier of feature-006 (Pokemon Evolution System). 9 commits implementing:
1. Everstone/Eviolite prevention in eligibility check
2. Stone consumption from trainer inventory + held item consumption
3. Post-evolution undo (snapshot, endpoint, composable)
4. Evolution history logging in Pokemon notes
5. Gender-specific + move-specific evolution triggers (type, seed parser, eligibility check, service validation)
6. UI wiring: prevention alert, undo button, item consumption in evolve request
7. XpDistributionResults updated for P2 features (ownerId, preventedByItem)
8. requiredGender/requiredMove exposed in evolution check response
9. Docs: implementation log + ticket update

Design spec: `artifacts/designs/design-pokemon-evolution-001/spec-p2.md`
Decrees checked: decree-035 (nature-adjusted Base Relations -- respected), decree-036 (stone evolution move learning -- respected, P1 implementation unchanged).

## Issues

### CRITICAL

**C1: Evolution undo does not revert the evolution history note**

File: `app/server/services/evolution.service.ts` (step 13) + `app/server/api/pokemon/[id]/evolution-undo.post.ts`

When evolution occurs, step 13 prepends `[Evolved from X at Level Y on Z]` to the Pokemon's `notes` field. However, `PokemonSnapshot` does NOT capture `notes`, and the undo endpoint does NOT restore `notes`. After an undo, the evolution note remains in the Pokemon's notes, creating a false record of an evolution that was reverted.

This is a data correctness bug. If the GM undoes an evolution, the historical note saying the evolution happened is a lie.

**Fix required:** Either:
- (A) Add `notes` to `PokemonSnapshot` and capture/restore it during undo, OR
- (B) Have the undo endpoint strip the most recent `[Evolved from ...]` line from the Pokemon's notes after restoring, OR
- (C) Move the notes update from step 13 into a separate, later operation and skip it if the undo happens before any other action

Option (A) is simplest and most reliable.

### HIGH

**H1: Two separate `prisma.pokemon.update()` calls for the same record in `performEvolution()`**

File: `app/server/services/evolution.service.ts` lines 566 and 608

The evolution update (step 11) and the notes update (step 13) are two separate DB round trips to update the same Pokemon record. These should be combined into a single `prisma.pokemon.update()` call. This eliminates an extra DB round trip and avoids the narrow window where the Pokemon has been evolved but the notes haven't been updated yet.

Additionally, the stone consumption (step 12) and the Pokemon update (step 11) are not wrapped in a transaction. If stone consumption fails (item not found), the evolution has already been committed but the error is thrown, which creates a confusing UX: the Pokemon is evolved but the user sees an error.

**Fix required:** Combine the notes update into step 11's `prisma.pokemon.update()` call. Also wrap steps 11 + 12 in a `prisma.$transaction()` so that if stone consumption fails, the evolution is rolled back.

**H2: Stone consumption not reversed on evolution undo**

File: `app/server/api/pokemon/[id]/evolution-undo.post.ts`

When the GM undoes an evolution that consumed a stone from the trainer's inventory, the stone is NOT restored to the trainer's inventory. The `heldItem` on the Pokemon IS restored (via snapshot), but the stone consumed from the HumanCharacter inventory is permanently lost.

The design spec (section 3.3) says undo "restores the Pokemon to its pre-evolution state" and the acceptance criteria says "Undo restores all pre-evolution state (species, stats, abilities, moves, capabilities, skills)." Inventory is arguably outside "Pokemon state" since it belongs to the trainer, but from a UX perspective, an undo that doesn't restore the consumed stone is surprising and frustrating.

**Fix required:** Either:
- (A) Track consumed item details in the snapshot so the undo endpoint can restore the stone to the trainer's inventory, OR
- (B) Display a warning in the undo confirmation dialog: "Note: consumed items (stones) will not be restored. Undo anyway?"

Option (A) is preferred for correctness. Option (B) is acceptable as a minimum.

**H3: No GM override UI for missing stone in inventory**

File: `app/components/pokemon/EvolutionConfirmModal.vue` line 377

The design spec (section 1.1, step 5) explicitly requires: "If trainer does not have it, show warning but allow GM override ('Use stone anyway?')". The modal always sends `skipInventoryCheck: false`. If the stone is not in the trainer's inventory, `consumeStoneFromInventory()` throws, and the evolution fails with an error.

The GM has no path to override this. The `skipInventoryCheck` field exists in the API contract but is inaccessible from the UI.

**Fix required:** Before sending the evolve request with `consumeItem`, check whether the stone exists in the trainer's inventory. If it does not, show a confirmation dialog: "Water Stone not found in inventory. Evolve anyway?" If confirmed, send `skipInventoryCheck: true`.

### MEDIUM

**M1: `app-surface.md` not updated for P2 additions**

File: `.claude/skills/references/app-surface.md`

P2 added a new endpoint (`POST /api/pokemon/:id/evolution-undo`), a new composable (`useEvolutionUndo`), and new fields on the evolve/evolution-check endpoints (`consumeItem`, `consumeHeldItem`, `preventedByItem`, `requiredGender`, `requiredMove`, `undoSnapshot`). None of these are reflected in `app-surface.md`.

The P1 review (code-review-237/M3) already flagged this pattern and it was fixed for P1 in commit 3e0b77e. The same update is needed for P2.

**Fix required:** Update `app-surface.md` with the new endpoint, composable, and field additions from P2.

**M2: Undo button has no undo-window expiry**

File: `app/composables/useEvolutionUndo.ts`

The design spec (section 3.3) says the undo should be "Only valid within a reasonable window (e.g., same session, before the next combat action)." The current implementation stores the snapshot in `useState` (survives navigation but not page refresh) but has no expiry mechanism. The undo button remains available indefinitely within the same session.

This isn't broken -- it's actually more permissive than the spec -- but it could lead to confusing behavior if the GM undoes an evolution much later, after the Pokemon has participated in combat or had other changes applied. The undo would revert ALL stats/moves/abilities to the pre-evolution snapshot, discarding any post-evolution modifications.

**Recommendation:** File a ticket. Add a timestamp to each snapshot entry and either auto-clear after N minutes or warn the GM if the snapshot is stale. Alternatively, clear the snapshot when the Pokemon enters an encounter (the endpoint already rejects undo for Pokemon in active encounters, but the button would still show).

**M3: `alert()` used for prevention item messaging instead of proper UI notification**

Files: `app/pages/gm/pokemon/[id].vue` line 406, `app/components/encounter/XpDistributionResults.vue` line 237

Both the Pokemon sheet page and XpDistributionResults use `alert()` to display the Everstone/Eviolite prevention message. This is inconsistent with the design spec's requirement for "clear user message" in the evolution check UI. The evolution check response already includes `preventedByItem` -- this could be displayed inline in the UI rather than via a browser alert.

The P1 reviews accepted `alert()` usage elsewhere (it's common in this codebase), so this is not blocking, but it should be a ticket for UX improvement.

**Recommendation:** File a ticket for replacing alert() calls with inline UI feedback for evolution prevention.

## Game Logic Review

### Mechanics Verified (Correct)

1. **Everstone prevention (PTU p.291):** Correctly blocks ALL evolution paths when held. Case-insensitive matching. Returns `preventedByItem` field with clear reason message. Per decree-035, this is checked before any trigger evaluation.

2. **Eviolite prevention (PTU p.291):** Same prevention mechanic as Everstone, correctly implemented identically. The stat bonus aspect is correctly deferred as out-of-scope per spec section 2.3.

3. **Stone consumption from trainer inventory:** Correctly decrements quantity and removes entry when quantity reaches 0. Immutable inventory transformation (`.map().filter()` pattern). Case-insensitive item matching.

4. **Held item consumption:** Correctly clears `heldItem` when `itemMustBeHeld` is true and `consumeHeldItem !== false`. Default behavior (consume) matches spec section 1.2.

5. **Gender-specific evolution triggers:** Correctly checks Pokemon's gender against `requiredGender` field. Case-insensitive comparison. Gender extracted from seed data patterns like "Minimum 20 Female", "Dawn Stone Male Minimum 30". Tested against actual pokedex entries: Combee->Vespiquen (Female), Burmy->Wormadam (Female)/Mothim (Male), Ralts->Gallade (Male + Dawn Stone).

6. **Move-specific evolution triggers:** Correctly checks Pokemon's current moves against `requiredMove` field. Case-insensitive comparison. Seed parser handles "Learn <MoveName>" and "Minimum Learn <MoveName>" (Bonsly/Sudowoodo edge case) patterns.

7. **Evolution history logging:** Correctly prepends `[Evolved from X at Level Y on Z]` to Pokemon notes. Date format is ISO (YYYY-MM-DD). Existing notes are preserved below.

8. **Post-evolution undo snapshot:** Captures all stat, type, ability, move, capability, skill, and held item fields. The snapshot is complete for Pokemon state restoration.

9. **Undo active encounter guard:** Correctly rejects undo for Pokemon in active encounters (same guard pattern as the evolve endpoint).

10. **decree-035 compliance:** Base Relations ordering uses nature-adjusted base stats. P2 did not modify this logic (P0 implementation).

11. **decree-036 compliance:** Stone evolution move learning uses `entry.level <= currentLevel`. P2 did not modify this logic (P1 implementation).

### Seed Parser Verification

The parser correctly handles these real pokedex patterns:
- `"Minimum 20 Female"` -> `{ minimumLevel: 20, requiredGender: 'Female' }`
- `"Minimum 20 Male"` -> `{ minimumLevel: 20, requiredGender: 'Male' }`
- `"Dawn Stone Male Minimum 30"` -> `{ requiredItem: 'Dawn Stone', minimumLevel: 30, requiredGender: 'Male' }`
- `"Learn Double Hit"` -> `{ requiredMove: 'Double Hit', minimumLevel: null }`
- `"Learn Ancient Power"` -> `{ requiredMove: 'Ancient Power', minimumLevel: null }`
- `"Minimum Learn Mimic"` -> `{ requiredMove: 'Mimic', minimumLevel: null }` (Bonsly edge case handled)

Gender is extracted first and consumed from the remaining text before item/level parsing. The approach is correct and handles the ordering ambiguity well.

## What Looks Good

1. **Immutability discipline in useEvolutionUndo:** Every mutation creates a new `Map` instance. The composable follows project immutability patterns perfectly.

2. **Clean separation of concerns:** Prevention check is in the shared utility (client-side), gender/move validation is duplicated in the service (server-side) as a defense-in-depth pattern, and item consumption is a separate service function.

3. **Seed parser refactoring:** The trigger text parser was cleanly refactored to extract gender and move requirements as first-class concerns, with the remaining text flowing into the existing item/level patterns. The edge case handling for "Minimum Learn Mimic" shows attention to real data.

4. **P2 props properly threaded:** `ownerId` is correctly passed through the component chain (XpDistributionResults -> EvolutionConfirmModal) for stone consumption context.

5. **WebSocket broadcast on undo:** The undo endpoint correctly broadcasts a `pokemon_evolved` event with `undone: true` so Group View clients can update.

6. **Commit granularity:** 8 feature commits + 1 docs commit is appropriate for the P2 scope. Each commit is focused and builds logically.

7. **File sizes:** All files remain well under the 800-line limit. `evolution.service.ts` at 638 lines is the largest and still reasonable.

## Verdict

**CHANGES_REQUIRED**

One critical data correctness bug (C1: undo doesn't revert evolution notes) and three high-severity issues (H1: non-atomic multi-step DB writes, H2: stone not restored on undo, H3: no GM override UI for missing stone) must be fixed before approval.

## Required Changes

| ID | Severity | File(s) | Description |
|----|----------|---------|-------------|
| C1 | CRITICAL | `evolution.service.ts`, `evolution-undo.post.ts` | Add `notes` to `PokemonSnapshot` and restore it on undo |
| H1 | HIGH | `evolution.service.ts` | Combine notes update into main Pokemon update; wrap evolution + stone consumption in `prisma.$transaction()` |
| H2 | HIGH | `evolution-undo.post.ts` | Either restore consumed stone on undo, or warn user that items will not be restored |
| H3 | HIGH | `EvolutionConfirmModal.vue` | Add GM override dialog when stone is not in trainer's inventory |
| M1 | MEDIUM | `.claude/skills/references/app-surface.md` | Update with P2 endpoint, composable, and field additions |
| M2 | MEDIUM | -- | File ticket: add undo-window expiry or staleness warning to `useEvolutionUndo` |
| M3 | MEDIUM | -- | File ticket: replace `alert()` with inline UI for evolution prevention messages |
