---
review_id: code-review-198
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-107
domain: combat
commits_reviewed:
  - f91db19
  - 09ab7a0
  - aac5a22
  - fd0e034
  - 29367c5
  - ab33054
  - 66a939b
  - 50e1e1d
  - 3bd9101
  - c53c70d
files_reviewed:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/prisma/schema.prisma
  - app/server/api/encounters/[id]/declare.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id].put.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/stages.post.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/services/encounter.service.ts
  - app/stores/encounter.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
reviewed_at: 2026-02-27T10:15:00Z
follows_up: null
---

## Review Scope

First review of ptu-rule-107 P0 implementation: League Battle two-phase trainer system (decree-021). This implements the core declaration/resolution flow where trainers declare actions in low-to-high speed order, then resolve in high-to-low speed order, before Pokemon act.

**Spec sections reviewed:** A (Declaration Data Model), B (Declaration Recording API), C (Phase Transition Logic), D (Resolution Execution).

**Decrees verified:**
- decree-021: Two-phase trainer system. Implementation is faithful. Declaration phase uses low-to-high speed order, resolution uses high-to-low (reverse of trainerTurnOrder). Faster trainers see slower trainers' declarations before their actions resolve. **Compliant.**
- decree-006: Dynamic initiative reorder. The `reorderInitiativeAfterSpeedChange` function was updated with a `currentPhase` parameter to correctly handle resolution phase (descending sort) vs declaration phase (ascending sort). All three callers (stages, status, breather) pass `record.currentPhase`. **Compliant.**
- decree-005: Auto-apply CS from status conditions. Not directly affected by this change. The status endpoint's call to `reorderInitiativeAfterSpeedChange` correctly passes the new `currentPhase` parameter. **Not impacted.**

## Issues

### CRITICAL

**C1: Resolution phase reorder skips resolution-phase trainers during initiative reorder (encounter.service.ts:388-391)**

When a speed change occurs during the `trainer_resolution` phase, the stored `trainerTurnOrder` (used for future rounds' declaration order) is re-sorted. The code correctly re-sorts it in ascending order (`false`). However, the `trainerIndex` is set to `-1` for non-declaration phases, meaning the entire stored trainer order gets fully re-sorted (index -1 means "no acted slots to freeze").

The problem: the active `currentTurnOrder` for resolution is correctly reordered (line 402, `trainerDescending = true`), but the stored `trainerTurnOrder` reorder uses `trainerIndex = -1` even during the resolution phase. This means if a speed change happens during resolution, ALL trainers in the stored declaration order get re-sorted -- including trainers who have already declared this round. While this doesn't break the current round's resolution (since `currentTurnOrder` is handled separately), it means the NEXT round's declaration order will be fully re-sorted, which is actually correct behavior (next round starts fresh). However, the code comment says "index -1 for sub-lists that are not currently active so all combatants in inactive phases get fully re-sorted" which is accurate.

**CORRECTION:** On closer analysis, this is actually correct behavior. The stored `trainerTurnOrder` is the template for the next round's declaration order, and re-sorting it fully after a speed change is the right thing to do. The active `currentTurnOrder` (which IS the resolution order) is correctly handled with `currentTurnIndex` to freeze acted slots.

**Downgrade: NOT an issue.** Removed from critical count.

**ACTUAL CRITICAL: Stale encounter record used for buildEncounterResponse in declare.post.ts (line 109)**

In `declare.post.ts`, the response is built using the original `encounter` record (fetched at line 41) AFTER the Prisma update (line 102-107). While `declarations` is passed via the options override, all other fields come from the stale record. If any concurrent request modified the encounter between the `findUnique` and the `update`, the response would contain stale data for other fields.

However, there is a more concrete issue: `buildEncounterResponse` reads `record.combatants` to return in the response. The `combatants` variable was parsed from the record at line 55, but this is the same reference as what was parsed -- so the response would be correct for the single-writer case. In the multi-writer case (concurrent API calls), this is a known limitation of the existing endpoint pattern used throughout the codebase (e.g., `next-turn.post.ts` reads encounter, modifies, then updates similarly).

**Revised assessment:** This matches the existing codebase pattern and is not a new issue introduced by this PR. Downgrading.

**ACTUAL CRITICAL: `tempConditions` cleared during declaration phase next-turn (next-turn.post.ts:65)**

When `next-turn` is called during the declaration phase, the code marks the current combatant as having acted (line 61) AND clears their `tempConditions` (line 65). But during the declaration phase, the trainer hasn't actually taken their turn yet -- they've only declared an intent. Clearing `tempConditions` (which includes Sprint, Tripped, etc.) during declaration is incorrect. These conditions should persist until the trainer actually resolves their action in the resolution phase.

A trainer who was Tripped during a previous Pokemon phase would have their Tripped condition incorrectly cleared when they declare, rather than when they resolve. This is a mechanical error per PTU rules -- temporary conditions last "until the combatant's next turn," and the declaration is not their turn in the action-economy sense.

**Location:** `app/server/api/encounters/[id]/next-turn.post.ts` lines 60-66.

### HIGH

**H1: Resolution phase does not clear `hasActed` for ALL resolving trainers at phase transition (next-turn.post.ts:86-87)**

When transitioning from declaration to resolution (line 82-87), only the first resolving trainer's turn state is reset via `resetResolvingTrainerTurnState`. All other trainers still have `hasActed = true` and `actionsRemaining = 0` from the declaration phase. The mid-resolution reset on line 136-139 handles subsequent trainers as `next-turn` is called.

The concern: if `hasActed = true` is checked by any other endpoint or UI component during the resolution phase (before a trainer's resolution turn arrives), it would incorrectly indicate the trainer has already acted. For example, the `combatantsWithActions` getter in the store (line 86-91) checks `turnState.hasActed` -- a resolving trainer who hasn't resolved yet would appear as "already acted" to the UI until their resolution turn comes. This could cause UI confusion or incorrect action-gating during the resolution phase.

The spec (section D) says trainers get fresh action economy during resolution. While the per-turn reset approach works mechanically, it creates an inconsistent intermediate state visible to the client.

**Location:** `app/server/api/encounters/[id]/next-turn.post.ts` lines 82-87 (transition) and 136-139 (per-turn reset).

**H2: `app-surface.md` not updated with new endpoint**

The new `POST /api/encounters/:id/declare` endpoint is not listed in `app-surface.md`. Per project conventions, new endpoints must be registered. This affects downstream tooling (matrix skills, capability mappers, UX sessions) that rely on the surface map to discover testable API endpoints.

**Location:** `.claude/skills/references/app-surface.md` line ~129 (after `xp-distribute`).

### MEDIUM

**M1: `resetResolvingTrainerTurnState` sets hardcoded action counts without checking entity type or features (next-turn.post.ts:191-206)**

The function hardcodes `actionsRemaining = 2` and `shiftActionsRemaining = 1`. While these are the standard PTU defaults, some trainer features or abilities could modify the base action economy. The existing `resetCombatantsForNewRound` function (line 212-227) has the same limitation, so this is a pre-existing pattern -- but it's worth noting that the resolution-specific reset explicitly creates a new call site with the same assumption.

**Location:** `app/server/api/encounters/[id]/next-turn.post.ts` lines 191-206.

**M2: No unit tests for the three-phase progression or declare endpoint**

The existing `encounters.test.ts` tests are thin mocks that don't exercise the actual endpoint logic. The new three-phase flow and declare endpoint have no test coverage. While the P0 spec doesn't explicitly require tests, behavioral changes to a critical combat flow (turn progression) should have at least basic unit tests verifying:
- Declaration -> Resolution -> Pokemon -> New Round transition
- Declarations are cleared on new round
- Declare endpoint rejects out-of-phase requests

This is medium because P1 scope includes edge cases, but the core flow is risky to leave untested.

## What Looks Good

1. **Faithful decree-021 implementation.** The two-phase flow correctly implements low-to-high declaration, high-to-low resolution using `[...trainerTurnOrder].reverse()`. The design is clean and the code comments reference the decree throughout.

2. **Immutable patterns used correctly.** New declarations are built with spread (`[...declarations, declaration]`), new turn orders use spread copies. The `resetResolvingTrainerTurnState` mutation is documented as acceptable (freshly parsed JSON).

3. **Clean separation of declare and next-turn.** The declare endpoint only records the declaration. The next-turn endpoint handles all phase transitions. This separation follows the spec exactly and avoids conflating recording with execution.

4. **Initiative reorder made phase-aware.** The `reorderInitiativeAfterSpeedChange` function now correctly handles all three phases. Resolution phase trainers sort descending, declaration phase ascending. The `currentPhase` parameter was added cleanly with backward compatibility (defaults to `'pokemon'`).

5. **Undo/redo compatibility.** The PUT endpoint persists `declarations`, ensuring snapshots captured by the undo system include declaration state. This was a non-obvious requirement handled proactively.

6. **WebSocket sync support in store.** The `updateFromWebSocket` method properly handles `declarations` field updates, and the store getters (`currentDeclarations`, `currentResolutionDeclaration`) filter correctly by round and phase.

7. **Validation in declare.post.ts is thorough.** Phase check, combatant type check, current-turn check, duplicate-declaration check, valid action type check -- all four spec validation rules are implemented.

8. **Prisma schema change is additive.** The `declarations` field has a default of `"[]"`, so existing encounters will not break.

9. **Commit granularity is appropriate.** 10 commits for the feature, each with a clear purpose and manageable scope.

## Verdict

**CHANGES_REQUIRED**

The implementation is structurally sound and faithfully implements decree-021. The three-phase flow, declaration recording, initiative reorder awareness, and undo/redo compatibility are all well done.

However, one critical correctness bug (tempConditions cleared during declaration phase) and two high-priority issues (inconsistent `hasActed` state during resolution, missing app-surface entry) need to be addressed before approval.

## Required Changes

1. **CRITICAL (C1):** Fix `tempConditions` clearing during declaration phase. In `next-turn.post.ts`, the `tempConditions = []` clear on line 65 should be conditional -- skip clearing temporary conditions when `currentPhase === 'trainer_declaration'`. Trainers' temporary conditions should persist through declaration and only clear when their resolution turn arrives (where `resetResolvingTrainerTurnState` already handles the turn state reset, but doesn't address tempConditions either -- that function should clear them).

2. **HIGH (H1):** When transitioning from declaration to resolution phase, reset `hasActed` to `false` for ALL trainers in the resolution order (not just the first one). This ensures UI components and store getters see consistent state during the resolution phase. The per-turn `resetResolvingTrainerTurnState` call can then set the full action economy for the current resolver.

3. **HIGH (H2):** Add `POST /api/encounters/:id/declare` to `app-surface.md` in the Encounters section, with description "record trainer declaration (League Battle)".

4. **MEDIUM (M2):** Add basic unit test coverage for the three-phase flow. At minimum: one test verifying the declaration -> resolution -> pokemon -> new round transition sequence, and one test verifying the declare endpoint rejects requests outside `trainer_declaration` phase.
