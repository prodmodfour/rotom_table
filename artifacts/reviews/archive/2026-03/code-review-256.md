---
review_id: code-review-256
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-011
domain: combat
commits_reviewed:
  - d84d3d60
  - 3fee2a90
  - f6ae7952
  - 2b4a7623
  - db6e81cc
  - dea273fe
files_reviewed:
  - app/composables/useWebSocket.ts
  - app/types/api.ts
  - app/server/services/switching.service.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/release.post.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/composables/useSwitching.ts
  - app/stores/encounter.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/feature/feature-011.md
  - artifacts/tickets/open/refactoring/refactoring-112.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-01T17:45:00Z
follows_up: code-review-249
---

## Review Scope

Re-review of feature-011 P2 (Pokemon Switching Workflow) fix cycle. 6 commits addressing all 5 actionable issues from code-review-249 (CRIT-001, H1, H2, M2, M3). M1 was correctly routed to refactoring-112 and is non-blocking.

All source files read in full. Decree-033 (fainted switch timing), decree-034 (Roar/Whirlwind), decree-038 (Sleep condition decoupling), decree-039 (Roar vs Trapped) checked -- no violations found.

Note: commit hashes in the feature-011 ticket resolution log reference the original pre-collection hashes (e.g., `2106cccd`). The actual commits on this branch are `d84d3d60` through `dea273fe`. Content verified to match.

## Issue Resolution Verification

### CRIT-001 (CRITICAL): Missing WebSocket handlers -- RESOLVED

**Commit:** d84d3d60

Two new case statements added to `useWebSocket.ts` (lines 199-205):
- `case 'pokemon_recalled':` calls `getEncounterStore().updateFromWebSocket(message.data.encounter)`
- `case 'pokemon_released':` calls `getEncounterStore().updateFromWebSocket(message.data.encounter)`

Both handlers follow the identical pattern used by the existing `pokemon_switched` handler (line 196). The handlers correctly access `message.data.encounter` which matches the broadcast payload shape in both `recall.post.ts` (line 257) and `release.post.ts` (line 326).

Type definitions added to `app/types/api.ts` (lines 54-55):
- `pokemon_recalled` event type with `encounterId`, `trainerId`, `trainerName`, `recalledNames`, `actionCost`, `encounter` fields
- `pokemon_released` event type with `encounterId`, `trainerId`, `trainerName`, `releasedNames`, `releasedCombatantIds`, `actionCost`, `countsAsSwitch`, `encounter` fields

The type definitions match the actual broadcast payloads. Group View and Player View will now correctly update on standalone recall/release events. Real-time sync breakage is fixed.

### HIGH-001: app-surface.md not updated -- RESOLVED

**Commit:** db6e81cc

Three updates made:
1. **New endpoints** added to the Encounters API list (lines 128-129): `POST /api/encounters/:id/recall` and `POST /api/encounters/:id/release` with concise descriptions of action cost, side-effects, and tracking.
2. **Switching system description** expanded (line 163): now includes all service functions (`validateFaintedSwitch`, `validateForcedSwitch`, `hasInitiativeAlreadyPassed`, `findAdjacentPosition`, `checkRecallReleasePair`, `applyRecallSideEffects`), store actions (`recallPokemon`, `releasePokemon`), composable methods (`executeRecall`, `executeRelease`), all three WS events (`pokemon_switched`, `pokemon_recalled`, `pokemon_released`), and all five action types.
3. **Service table** updated (line 271): `switching.service.ts` row now lists all exported functions.

Coverage is comprehensive. Downstream skills will discover the full switching surface.

### HIGH-002: No turn validation on recall/release endpoints -- RESOLVED

**Commit:** f6ae7952

Turn validation added to both endpoints:

**recall.post.ts** (lines 81-98): After finding the trainer combatant, validates that `turnOrder[currentTurnIndex]` is either:
- The trainer's own combatant ID, OR
- One of the Pokemon being recalled, OR
- Any Pokemon owned by the trainer (checked via `ownerId === trainer.entityId`)

**release.post.ts** (lines 88-104): Identical pattern -- validates current turn combatant is the trainer or one of their owned Pokemon.

Both implementations correctly:
- Guard against `currentTurnCombatantId` being undefined (empty turn order edge case)
- Include PTU p.229 rule citation in comments
- Return 400 status with descriptive error message
- Are consistent with `validateActionAvailability` in `switch.post.ts`

The recall endpoint's `isOwnedPokemonTurn` check (line 86-91) includes both `pokemonCombatantIds.includes(currentTurnCombatantId)` (the Pokemon being recalled is the current combatant) and the broader ownerId check (any of the trainer's Pokemon is the current combatant). This is correct -- a trainer may recall Pokemon A on Pokemon B's turn, as long as Pokemon B also belongs to them.

### MEDIUM-002: Duplicate recall side-effects -- RESOLVED

**Commit:** 3fee2a90

`applyRecallSideEffects(entityId: string): Promise<void>` extracted to `switching.service.ts` (lines 752-770). The function:
1. Fetches the Pokemon DB record
2. Parses status conditions
3. Filters out `RECALL_CLEARED_CONDITIONS`
4. Updates DB: clears filtered conditions, resets `temporaryHp` to 0, resets `stageModifiers` to `{}`
5. Returns early if no DB record found (defensive guard)

Both `switch.post.ts` (line 224) and `recall.post.ts` (line 186) now call this single function. The 15-line inline blocks in both files have been removed. When decree-038's condition behavior decoupling is implemented (refactoring-106), only this one function needs to change.

### MEDIUM-003: Overlapping tokens fallback -- RESOLVED

**Commit:** 2b4a7623

`findAdjacentPosition` in `switching.service.ts` (line 718) now falls back to `findPlacementPosition(occupiedCells, side, tokenSize, gridWidth, gridHeight)` instead of returning the trainer's own position.

The function signature was updated to accept a `side` parameter (line 682, default `'players'`), and the release endpoint passes `trainer.side` (release.post.ts line 193). This ensures grid-wide placement respects side-specific positioning (players on the left, enemies on the right per `SIDE_POSITIONS`).

The import of `findPlacementPosition` from `grid-placement.service.ts` was added to `switching.service.ts` (line 13). The function's signature (`occupiedCells, side, tokenSize, gridWidth, gridHeight`) matches the call site.

### MEDIUM-001: Encounter store size -- NON-BLOCKING, TRACKED

refactoring-112 ticket exists at `artifacts/tickets/open/refactoring/refactoring-112.md` with correct metadata (P3, MEDIUM, EXT-GOD category, source: code-review-249 MEDIUM-001). The ticket accurately describes the 970-line store, identifies 5 responsibility clusters, and suggests sub-module extraction. This was correctly handled as a non-blocking follow-up.

## Issues

### MEDIUM

#### MEDIUM-001: switching.service.ts now exceeds 800-line limit (811 lines)

**File:** `app/server/services/switching.service.ts`

The extraction of `applyRecallSideEffects` added 36 lines (from 775 to 811), pushing the file past the 800-line project limit. This is a direct consequence of correctly fixing MEDIUM-002 from code-review-249 -- the DRY fix was the right call, and the file is the natural home for this function.

At 811 lines this is only 11 lines over the limit and does not warrant blocking the merge. However, refactoring-112 (encounter store decomposition) should be extended to also cover the switching service, or a separate ticket should be filed when the service grows further. The file currently has 6 logical sections that could be split (range validation, removal, initiative insertion, action tracking, placement, pair detection).

**Action:** Non-blocking. File a note on refactoring-112 or a separate ticket when the service next grows.

## What Looks Good

**Fix completeness:** All 5 actionable issues from code-review-249 are fully resolved. No partial fixes, no deferred work (except M1 which was correctly tracked via ticket).

**WebSocket handler pattern consistency:** The new `pokemon_recalled` and `pokemon_released` handlers in `useWebSocket.ts` are identical in structure to the existing `pokemon_switched` handler. The type definitions in `api.ts` are complete and match the actual broadcast payloads.

**Turn validation thoroughness:** Both recall and release endpoints check the full ownership chain (trainer turn OR any owned Pokemon's turn), not just the Pokemon being recalled/released. This correctly handles the case where a trainer recalls Pokemon A during Pokemon B's turn (both belonging to the same trainer).

**applyRecallSideEffects extraction:** Clean extraction with no behavioral change. The function is properly exported, includes JSDoc with PTU rule citation, has a defensive null guard, and is called from both consumers. The `RECALL_CLEARED_CONDITIONS` import was correctly moved from the endpoint files to the service.

**Grid-wide fallback:** Using `findPlacementPosition` with the trainer's `side` is the correct fallback -- it searches the entire grid for a valid position within the trainer's side zone, avoiding both token overlap and cross-side placement.

**Ticket documentation:** The feature-011 ticket resolution log accurately records all 6 fix cycle commits with correct descriptions. refactoring-112 exists with proper metadata.

**Decree compliance:** No decree violations found. The `applyRecallSideEffects` function uses `RECALL_CLEARED_CONDITIONS` which will need updating per decree-038 (refactoring-106/ptu-rule-128), but that is tracked separately and does not block this fix cycle.

## Verdict

**APPROVED**

All 5 actionable issues from code-review-249 are fully resolved:
- CRIT-001 (WebSocket handlers): Fixed, real-time sync restored
- HIGH-001 (app-surface): Comprehensive update with all endpoints, events, functions
- HIGH-002 (turn validation): Added to both endpoints, matches switch.post.ts pattern
- MEDIUM-002 (DRY recall side-effects): Extracted to service, single source of truth
- MEDIUM-003 (overlapping tokens): Grid-wide fallback via findPlacementPosition

MEDIUM-001 (switching.service.ts at 811 lines) is noted but non-blocking at 11 lines over limit. Combined with the previously APPROVED rules-review-225, this feature is ready to merge.

## Required Changes

None. All issues resolved.
