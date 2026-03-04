---
review_id: code-review-259
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-016
domain: combat
commits_reviewed:
  - 5e42856c
  - 2c36d897
  - 27b733da
  - 68485037
  - 0734d15b
  - 0082cca9
  - 4e09f724
  - 2b73246c
  - 6f493800
  - 926892a6
  - a6e0f9c8
  - 2f56e6a9
files_reviewed:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/server/services/out-of-turn.service.ts
  - app/server/api/encounters/[id]/hold-action.post.ts
  - app/server/api/encounters/[id]/release-hold.post.ts
  - app/server/api/encounters/[id]/priority.post.ts
  - app/server/api/encounters/[id]/interrupt.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/aoo-resolve.post.ts
  - app/stores/encounter.ts
  - app/server/routes/ws.ts
  - app/components/encounter/HoldActionButton.vue
  - app/components/encounter/PriorityActionPanel.vue
  - app/components/encounter/AoOPrompt.vue
  - app/constants/aooTriggers.ts
  - app/server/services/encounter.service.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 2
  high: 4
  medium: 5
reviewed_at: 2026-03-01T21:00:00Z
follows_up: (none -- first review)
---

## Review Scope

P1 implementation of feature-016: Priority / Interrupt / Attack of Opportunity System. 12 commits by slave-2, covering Hold Action (R040), Priority Standard/Limited/Advanced (R046, R047), Interrupt framework (R048), betweenTurns state, WebSocket events, and UI components. Reviewed against spec-p1.md, decrees (003, 006, 021, 033, 038, 039), and all relevant source files.

## Issues

### CRITICAL

#### CRIT-001: `betweenTurns` is never set to `true` -- PriorityActionPanel is unreachable

**File:** `app/stores/encounter.ts` (lines 1018-1020)

The `enterBetweenTurns()` action is defined but never called anywhere in the codebase. The spec (Section B6) explicitly states: "When `nextTurn()` completes, the store enters a `betweenTurns: true` state." The `nextTurn()` store action (line 432-452) does not call `enterBetweenTurns()` or set `betweenTurns = true`. This means:

- The `isBetweenTurns` getter always returns `false`
- `PriorityActionPanel.vue` can never be rendered (it depends on this state)
- Priority actions cannot be declared through the UI

The spec says this is client-side, but the P1 implementation must actually wire it up. Without this, the entire Priority action UI is dead code.

**Fix:** In the `nextTurn()` store action, set `this.betweenTurns = true` after `this.encounter = response.data`. The caller or `PriorityActionPanel`'s "Continue" button calls `exitBetweenTurns()`.

#### CRIT-002: Standard Priority does not skip the combatant's original turn order position

**File:** `app/server/api/encounters/[id]/priority.post.ts` (lines 96-101)

When a Standard Priority is declared, `turnOrder.splice(currentTurnIndex, 0, combatantId)` inserts the combatant at the current position. The combatant's ID now appears TWICE in the turn order: once at the inserted position and once at their original position (shifted by 1). After the combatant completes their Priority turn, `next-turn.post.ts` marks them `hasActed: true` and advances the index. When the index reaches their original position, their ID appears again, and the system presents them as the active combatant despite already having acted.

The spec (Section B2, Standard Priority, step 4) says: "Mark their original turn position for skipping." No skip logic was implemented. The `next-turn.post.ts` code does not auto-skip combatants with `hasActed: true`.

**Fix:** Either (a) remove the combatant's original entry from `turnOrder` when inserting the Priority turn, or (b) add auto-skip logic in `next-turn.post.ts` that advances past combatants with `hasActed: true` (similar to `skipFaintedTrainers`). Option (a) is simpler and more correct.

### HIGH

#### HIGH-001: `nextTurn()` store action does not return `holdReleaseTriggered` to caller

**File:** `app/stores/encounter.ts` (lines 432-452)

The server returns `holdReleaseTriggered: { combatantId: string }` in the next-turn response (at the same level as `data`), but the store's `nextTurn()` action:
1. Does not include `holdReleaseTriggered` in the `$fetch` generic type
2. Does not return it to the calling component

This means the UI has no way to know that a held combatant should be released. The GM is expected to call `release-hold` when prompted, but the prompt data is silently dropped.

**Fix:** Add `holdReleaseTriggered?: { combatantId: string }` to the `$fetch` type and return it alongside `heavilyInjuredPenalty`.

#### HIGH-002: `hold-action.post.ts` does not advance the turn after declaring a hold

**File:** `app/server/api/encounters/[id]/hold-action.post.ts`

The spec (Section A3, step 5) says: "Advance the turn (skip this combatant without consuming actions)." The endpoint marks the combatant with `hasActed: true` (via `applyHoldAction`) but does NOT advance `currentTurnIndex`. The GM must manually call `nextTurn` after declaring a hold.

While this could work as a two-step flow (declare hold, then manually advance), it diverges from the spec's explicit instruction and creates a confusing UX where the holding combatant is still shown as the active combatant after declaring the hold.

**Fix:** After saving the hold, advance `currentTurnIndex` by 1 (or delegate to the turn progression logic) so the next combatant becomes active immediately. Alternatively, if this is intentional for GM flexibility, document the deviation from spec explicitly.

#### HIGH-003: `applyAdvancedPriority` does not consume the Standard Action

**File:** `app/server/services/out-of-turn.service.ts` (lines 562-573)

The spec (Section B2, Advanced Priority, step 3) says: "Mark the Priority action as consuming a Standard Action." The `applyLimitedPriority` correctly sets `turnState.standardActionUsed = true`, but `applyAdvancedPriority` does not. This means an Advanced Priority user who has NOT already acted this round retains their full Standard Action on their normal turn, which is a rules violation -- the Advanced Priority action should consume the Standard Action regardless.

**Fix:** Add `turnState: { ...combatant.turnState, standardActionUsed: true }` to the `applyAdvancedPriority` return object.

#### HIGH-004: Unused import `removeFromHoldQueue` in next-turn.post.ts

**File:** `app/server/api/encounters/[id]/next-turn.post.ts` (line 22)

`removeFromHoldQueue` is imported from `out-of-turn.service.ts` but never used in the file. The hold queue is cleared by reassigning `holdQueue = []` at round end (line 415), not by calling `removeFromHoldQueue`. Dead imports indicate unfinished integration or copy-paste error.

**Fix:** Remove the unused import.

### MEDIUM

#### MED-001: `app-surface.md` not updated with new endpoints, components, or store actions

**File:** `.claude/skills/references/app-surface.md`

The P1 implementation adds 4 new API endpoints, 2 new Vue components, 4 new WebSocket event types, and 7 new store actions. None of these are reflected in `app-surface.md`. Per project standards, new endpoints/components/routes/stores require an `app-surface.md` update.

**New entries required:**
- Endpoints: `hold-action.post.ts`, `release-hold.post.ts`, `priority.post.ts`, `interrupt.post.ts`
- Components: `HoldActionButton.vue`, `PriorityActionPanel.vue`
- Store state: `betweenTurns`
- Store actions: `holdAction`, `releaseHold`, `declarePriority`, `enterBetweenTurns`, `exitBetweenTurns`, `declareInterrupt`
- WS events: `priority_declared`, `hold_action`, `hold_released`, `interrupt_triggered`

**Fix:** Update `app-surface.md` with all new surface elements.

#### MED-002: `encounter.ts` store exceeds 800-line limit (1132 lines)

**File:** `app/stores/encounter.ts` (1132 lines)

The project coding standard sets an 800-line maximum for files. The encounter store was likely already close to the limit before P1, and P1 pushed it past 1132. The store handles too many concerns: loading, CRUD, turn progression, undo/redo, weather, AoO, hold, priority, interrupt, wild Pokemon spawning, significance, and serving.

**Fix:** File a refactoring ticket to extract out-of-turn action store actions into a composable (e.g., `useOutOfTurnActions`) or a separate store module. This is not blocking for P1 but must be addressed before P2 adds more actions.

#### MED-003: Interrupt endpoint eligibility check runs before resolution check, blocking legitimate declines

**File:** `app/server/api/encounters/[id]/interrupt.post.ts` (lines 97-103 vs 110-180)

The endpoint validates `canUseInterrupt(reactor)` at line 97-103 before checking if `resolution === 'accept'` or `resolution === 'decline'` at lines 110-180. If the GM wants to immediately decline an interrupt, the eligibility check still runs. If the reactor has already used their interrupt this round (from a previous accepted interrupt), the decline request would erroneously return a 400 error because `canUseInterrupt` fails.

The pattern used in `aoo-resolve.post.ts` is better: it checks eligibility only when `accepted` is true (line 91-102).

**Fix:** Move the eligibility check inside the `resolution === 'accept'` block, or check eligibility only when no `resolution` is provided (pending creation path) and when `resolution === 'accept'`.

#### MED-004: `checkHoldQueue` only returns the FIRST matching held combatant

**File:** `app/server/services/out-of-turn.service.ts` (lines 446-456)

`checkHoldQueue` iterates the hold queue and returns the first combatant whose `holdUntilInitiative` threshold is met. If multiple combatants are holding until the same (or overlapping) initiative values, only one is flagged for release. Per the spec (Section E2), multiple combatants wanting to act should resolve in initiative order. The function should return all matching combatants, not just the first.

**Fix:** Change the return type to an array and return all matching entries. The caller can then handle them in initiative order.

#### MED-005: `PriorityActionPanel` receives all combatants but filters client-side instead of using a computed from the store

**File:** `app/components/encounter/PriorityActionPanel.vue` (lines 65-67, 79-88)

The component receives `combatants: Combatant[]` as a prop and filters for eligibility in a local computed. This duplicates the Priority eligibility logic from `canUsePriority` in the service layer. A combatant might appear eligible in the UI (passes the component filter) but fail server-side validation (e.g., holding state not synced). The service function `canUsePriority` should be the single source of truth.

**Fix:** Either expose a `priorityEligibleCombatants` getter from the store (calling `canUsePriority` per combatant), or accept this as a P1 simplification and ensure the server rejects invalid requests (which it does). This is acceptable for P1 but should be unified in P2.

## Decree Compliance

- **decree-003** (token passability): Not directly relevant to P1; no movement logic changed. COMPLIANT.
- **decree-006** (dynamic initiative reorder): The spec (A5) acknowledges that `holdUntilInitiative` is an absolute value unaffected by reorder. The `checkHoldQueue` function correctly uses absolute initiative comparison. COMPLIANT.
- **decree-021** (League Battle two-phase): The spec sections D1-D3 describe how hold/priority/interrupt interact with League Battles. The implementation handles `isLeagueBattle` in the interrupt endpoint (F3 penalty) and the `resetCombatantsForNewRound` handles `skipNextRound`. However, no phase-specific restrictions are enforced for Priority in League Battles (e.g., no validation that Priority is declared between phases, not mid-phase). Per decree-021, the phases are declaration/resolution/pokemon. This is acceptable for P1 as a generic framework, but should be enforced in P2. PARTIALLY COMPLIANT -- flag for P2.
- **decree-033** (fainted switch on turn): Not directly relevant to P1. COMPLIANT.
- **decree-038** (Sleep behavior decoupling): Not directly relevant to P1. COMPLIANT.
- **decree-039** (Roar vs Trapped): Not directly relevant to P1. COMPLIANT.

## What Looks Good

1. **Service layer architecture is excellent.** All business logic lives in `out-of-turn.service.ts` as pure functions. Endpoints are thin controllers that validate, call service functions, and persist. This follows SRP and DIP cleanly.

2. **Immutability patterns are consistent.** Every service function (applyHoldAction, releaseHeldAction, applyStandardPriority, applyLimitedPriority, applyAdvancedPriority, applyInterruptUsage) returns new objects without mutating inputs. The `combatants.map()` pattern in endpoints correctly creates new arrays.

3. **Mutation in `next-turn.post.ts` is documented and justified.** The `resetCombatantsForNewRound` function mutates freshly-parsed JSON objects (no shared references). The comment explains why this is acceptable.

4. **`skipNextRound` penalty is correctly integrated.** The `resetCombatantsForNewRound` function handles the Advanced Priority / League Interrupt penalty by pre-marking acted combatants, and the flag is always cleared regardless of whether it was set.

5. **Hold queue cleanup at round end is correct.** Per spec F5, unheld actions at round end are lost. The `clearDeclarations` block in `next-turn.post.ts` correctly clears the hold queue.

6. **WebSocket events are well-structured.** Four new event types follow the existing pattern: server-side `broadcastToEncounter` in endpoints, client-side relay in `ws.ts`. Event payloads include enough data for UI updates.

7. **UI components follow project patterns.** BEM-style SCSS, Phosphor Icons, proper `defineProps`/`defineEmits`, computed getters for derived state. Both components are clean and focused (<200 lines each).

8. **Error handling is consistent.** All endpoints follow the `try/catch` pattern with `createError` for HTTP errors and the `statusCode` passthrough for service errors.

9. **Out-of-turn state initialization in `start.post.ts` is complete.** All new fields (outOfTurnUsage, disengaged, holdAction, skipNextRound) are initialized on encounter start.

10. **The interrupt endpoint supports both immediate resolution and pending creation.** This dual-mode design (pass `resolution: 'accept'/'decline'` for immediate, omit for pending) reduces the number of endpoints while supporting both GM workflows.

## Verdict

**CHANGES_REQUIRED**

Two CRITICAL issues block approval:
1. The Priority UI is completely unreachable because `betweenTurns` is never set to `true`.
2. Standard Priority creates duplicate turn order entries without skip logic, causing double-turn presentation.

Four HIGH issues require fixes before P2 builds on this foundation:
1. `holdReleaseTriggered` is silently dropped by the store.
2. Hold Action does not advance the turn per spec.
3. Advanced Priority does not consume the Standard Action.
4. Dead import in next-turn.

## Required Changes

| Priority | Issue | File | Fix |
|----------|-------|------|-----|
| CRITICAL | CRIT-001 | encounter.ts store | Wire `betweenTurns = true` into `nextTurn()` action |
| CRITICAL | CRIT-002 | priority.post.ts | Remove original turn order entry or add auto-skip for already-acted combatants |
| HIGH | HIGH-001 | encounter.ts store | Add `holdReleaseTriggered` to `nextTurn()` return type and value |
| HIGH | HIGH-002 | hold-action.post.ts | Advance `currentTurnIndex` after hold declaration, or document intentional deviation |
| HIGH | HIGH-003 | out-of-turn.service.ts | Add `standardActionUsed: true` to `applyAdvancedPriority` |
| HIGH | HIGH-004 | next-turn.post.ts | Remove unused `removeFromHoldQueue` import |
| MEDIUM | MED-001 | app-surface.md | Add all P1 surface elements |
| MEDIUM | MED-002 | encounter.ts store | File refactoring ticket for store extraction (>800 lines) |
| MEDIUM | MED-003 | interrupt.post.ts | Move eligibility check after resolution branch |
| MEDIUM | MED-004 | out-of-turn.service.ts | Return all matching hold queue entries, not just first |
| MEDIUM | MED-005 | PriorityActionPanel.vue | Accept as P1 simplification, unify in P2 |
