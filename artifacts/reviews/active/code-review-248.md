---
review_id: code-review-248
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-011
domain: combat
commits_reviewed:
  - 5540937d
  - 3f948f94
  - 99796267
  - 0712e99a
  - 43382731
  - e6fbf256
  - f90d9ae5
files_reviewed:
  - app/server/services/switching.service.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/release.post.ts
  - app/composables/useSwitching.ts
  - app/composables/usePlayerCombat.ts
  - app/stores/encounter.ts
  - app/components/player/PlayerCombatActions.vue
  - app/types/combat.ts
  - app/types/player-sync.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-03-01T15:10:00Z
follows_up: code-review-236
---

## Review Scope

P2 implementation of feature-011 (Pokemon Switching Workflow -- Polish). 7 commits covering:
- **Section K**: Immediate-act logic for released Pokemon in Full Contact battles
- **Section L**: Standalone recall and release endpoints (1 = Shift, 2 = Standard)
- **Section N**: Recall+release pair detection for League restriction
- **Section M**: Enhanced player switch request with recall/release details

946 lines added across 10 files. All source files read in full. Decree-034 (Roar/Whirlwind) and decree-038 (Sleep condition decoupling) checked -- no violations found.

## Issues

### CRITICAL

#### CRITICAL-001: Missing WebSocket event handlers for `pokemon_recalled` and `pokemon_released`

**Files:** `app/composables/useWebSocket.ts` (not changed but affected), `app/server/api/encounters/[id]/recall.post.ts` (line 244), `app/server/api/encounters/[id]/release.post.ts` (line 295)

The recall endpoint broadcasts `type: 'pokemon_recalled'` and the release endpoint broadcasts `type: 'pokemon_released'`. However, `useWebSocket.ts` only handles `pokemon_switched` (added in P0 review fix). The two new event types are not handled in the client WebSocket handler's switch statement.

**Impact:** Group View and Player View will NOT update when a standalone recall or release happens. The GM gets the updated state via the REST response, but all other connected clients will show stale encounter data until the next event that triggers a full sync (e.g., `encounter_update`). This is a real-time sync breakage in a multi-view application.

**Fix:** Add `case 'pokemon_recalled':` and `case 'pokemon_released':` handlers to `useWebSocket.ts` that call `getEncounterStore().updateFromWebSocket(message.data.encounter)`, identical to the existing `pokemon_switched` handler.

### HIGH

#### HIGH-001: `app-surface.md` not updated with new endpoints

**File:** `.claude/skills/references/app-surface.md`

Two new REST API endpoints were added (`POST /api/encounters/:id/recall`, `POST /api/encounters/:id/release`) and two new WebSocket events (`pokemon_recalled`, `pokemon_released`). The Switching system description also needs to mention the new composable methods (`executeRecall`, `executeRelease`) and store actions (`recallPokemon`, `releasePokemon`). None of these appear in app-surface.md.

This file is the primary reference for all skill agents discovering the application surface. Missing entries cause downstream skills (planner, developer, reviewer, auditor) to miss these capabilities, leading to incorrect plans and incomplete reviews.

**Fix:** Add the two new endpoints to the Encounters API list, add the two new WS events to the broadcast events section, and update the Switching system description to include `executeRecall`, `executeRelease`, `recallPokemon`, `releasePokemon`, `findAdjacentPosition`, `checkRecallReleasePair`, `hasInitiativeAlreadyPassed`.

#### HIGH-002: No turn validation on recall/release endpoints -- design gap needs documentation

**Files:** `app/server/api/encounters/[id]/recall.post.ts`, `app/server/api/encounters/[id]/release.post.ts`

Neither the recall nor release endpoint validates whose turn it is. The full switch endpoint (switch.post.ts) validates that it must be the trainer's or their Pokemon's turn (via `validateActionAvailability`). The standalone recall/release endpoints only check that the trainer's Shift/Standard action is available, but not whether it is actually the trainer's or their Pokemon's turn.

PTU p.229 states: "A Trainer may recall a Pokemon to its Poke Ball or release a Pokemon from its Poke Ball as a Standard Action on either the Trainer's or the Pokemon's Initiative." This implies the trainer or their Pokemon must be the active combatant.

The spec (Section L) lists validation steps that do NOT include a turn check, so the developer followed the spec. However, without turn validation, a GM could (via API) recall/release Pokemon during another trainer's turn. While the GM has broad authority, this is inconsistent with the full switch endpoint's behavior, and it means the action cost (marking shift/standard as used) applies to a turn that may not be this trainer's.

**Fix:** Add turn validation matching the full switch endpoint pattern: the current combatant must be the trainer or one of their Pokemon. Alternatively, if this omission is intentional (GM-only action that bypasses turn order), add a code comment documenting the design decision.

### MEDIUM

#### MEDIUM-001: `encounter.ts` store exceeds 800-line limit (970 lines)

**File:** `app/stores/encounter.ts`

The encounter store is now at 970 lines, exceeding the project's 800-line maximum. It was already at 907 lines before P2 (pre-existing debt), and P2 added 63 lines for `recallPokemon` and `releasePokemon` store actions.

This is not a P2 regression -- the file was already over the limit. However, each addition compounds the problem. The store mixes encounter CRUD, combat actions, undo/redo, serve/unserve, weather, AoO, wild spawn, significance, and now switching. It has at least 5 distinct responsibility clusters that could be extracted.

**Fix:** File a refactoring ticket to extract the encounter store into focused sub-modules (e.g., `useCombatActions`, `useEncounterCrud`, `useUndoRedo`). Do not block P2 on this, but the ticket must exist.

#### MEDIUM-002: Recall/release endpoints duplicate recall side-effect logic from `switch.post.ts`

**Files:** `app/server/api/encounters/[id]/recall.post.ts` (lines 167-182), `app/server/api/encounters/[id]/switch.post.ts` (lines 224-239)

The recall side-effect code (fetch DB record, filter conditions via `RECALL_CLEARED_CONDITIONS`, clear temp HP, reset stage modifiers) is duplicated verbatim between `recall.post.ts` and `switch.post.ts`. This is 15 lines of identical logic that includes DB queries and JSON parsing.

This violates DRY and creates a maintenance risk: if recall side-effects change (e.g., decree-038 decoupling condition behaviors), both files must be updated independently. The switching service already centralizes other logic (range checks, turn order insertion, etc.), so extracting `applyRecallSideEffects(entityId: string)` to the service layer is a natural fit.

**Fix:** Extract a `applyRecallSideEffects(entityId: string): Promise<void>` function to `switching.service.ts` and call it from both endpoints.

#### MEDIUM-003: Release endpoint fallback placement returns trainer position on grid full

**File:** `app/server/services/switching.service.ts` (line 712)

`findAdjacentPosition` falls back to the trainer's own position when no free cell is found within radius 5. This places the released Pokemon token directly on top of the trainer token, creating overlapping tokens on the VTT grid. The VTT grid uses token positions for click targeting, measurement, and pathfinding -- overlapping tokens will cause incorrect interactions.

The design spec mentions `findPlacementPosition` as a fallback (line 212 of spec), but the implementation uses a static trainer-position fallback instead.

**Fix:** Either use the existing `findPlacementPosition` function (from grid-placement.service.ts) as the fallback, or throw a validation error informing the GM that no valid placement position exists. Overlapping tokens should never be the silent default.

## What Looks Good

**Section K (Immediate-Act):** The `hasInitiativeAlreadyPassed` function is clean and simple. The immediate-act insertion at `currentTurnIndex + 1` correctly models the PTU rule. The exclusion conditions (not for fainted switches, not for League battles) are correctly applied. The `canActImmediately` flag is properly surfaced in the switch response for client display.

**Section N (Pair Detection):** `checkRecallReleasePair` is a clean pure function with clear logic. The bidirectional pair detection (checking after both recall and release) correctly handles either ordering. The same-Pokemon-in-same-round validation is correctly applied in both endpoints. The League restriction application on detected pairs is correct.

**Section M (Player Switch Request):** The enhancement to `requestSwitchPokemon` adding the recall combatant ID and release name is minimal and well-integrated. The `handleRequestSwitch` in `PlayerCombatActions.vue` correctly identifies the active Pokemon combatant to recall. Using `targetIds` for the recall combatant follows the existing `PlayerActionRequest` structure without adding new fields.

**Service layer organization:** The new utility functions (`hasInitiativeAlreadyPassed`, `findAdjacentPosition`, `checkRecallReleasePair`, `canFitAt`) are properly colocated in `switching.service.ts`. The file is at 775 lines (under 800), well-documented with JSDoc and PTU rule citations. Pure function design enables testing.

**Type safety:** The `SwitchAction` interface was correctly extended in P1 to support `recall_only` and `release_only` action types, and P2 uses these types correctly. Nullable fields (`recalledCombatantId: null` for release-only, `releasedCombatantId: null` for recall-only) are consistently applied.

**Composable layer:** `useSwitching.ts` follows the established pattern (loading state, error handling, delegation to store). The new `executeRecall` and `executeRelease` methods are symmetrical and clean.

**Commit granularity:** 7 commits for 7 distinct pieces of functionality. Each commit produces a compilable state. The ordering follows the spec's recommended implementation order (K -> L -> N -> M).

## Verdict

**CHANGES_REQUIRED**

CRITICAL-001 (missing WebSocket handlers) is a real-time sync breakage that will cause stale state on Group View and Player View. This must be fixed before merge.

HIGH-001 (app-surface) and HIGH-002 (turn validation) should be addressed now -- the developer is already in these files and both are straightforward fixes.

MEDIUM-001 (encounter store size) predates P2 and should be addressed via a new refactoring ticket, not by blocking this PR.

## Required Changes

1. **CRITICAL-001:** Add `pokemon_recalled` and `pokemon_released` handlers to `useWebSocket.ts` (2 new case statements mirroring the existing `pokemon_switched` handler).

2. **HIGH-001:** Update `app-surface.md` with the two new endpoints, two new WS events, and expanded switching system description.

3. **HIGH-002:** Either add turn validation to recall/release endpoints (checking `turnOrder[currentTurnIndex]` is the trainer or their Pokemon), OR add explicit code comments documenting why turn validation is intentionally omitted (e.g., "GM-initiated action that can happen at any time").

4. **MEDIUM-002:** Extract `applyRecallSideEffects(entityId)` to `switching.service.ts` and call from both `recall.post.ts` and `switch.post.ts`.

5. **MEDIUM-003:** Replace the trainer-position fallback in `findAdjacentPosition` with either `findPlacementPosition` or a validation error.

6. **MEDIUM-001:** File a refactoring ticket for encounter store decomposition (do not block merge on this).
