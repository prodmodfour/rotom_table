---
review_id: rules-review-175
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - league-battle-declaration-order
  - league-battle-resolution-order
  - three-phase-turn-progression
  - declaration-recording
  - resolution-turn-state-reset
  - initiative-reorder-phase-awareness
  - declaration-clearing-on-new-round
  - undo-redo-declarations-persistence
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Page 227 (Initiative — League Battles)
  - core/07-combat.md#Page 229 (Pokemon Switching — League Battles)
reviewed_at: 2026-02-27T18:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. League Battle Declaration Order (Low-to-High Speed)

- **Rule:** "In League Battles only, Trainers declare their actions in order from lowest to highest speed" (`core/07-combat.md#Page 227`)
- **Decree:** decree-021 mandates "Declaration phase (trainer_declaration): Trainers declare actions in order from lowest to highest speed."
- **Implementation:** `start.post.ts` lines 98-99 sort trainers using `sortByInitiativeWithRollOff(trainers, false)` where `false` = ascending order (low-to-high speed). The resulting IDs become `trainerTurnOrder` and are used as `turnOrder` when `currentPhase = 'trainer_declaration'` (lines 103-109).
- **Status:** CORRECT

### 2. League Battle Resolution Order (High-to-Low Speed)

- **Rule:** "and then the actions take place and resolve from highest to lowest speed. This allows quicker Trainers to react to their opponent's switches and tactics." (`core/07-combat.md#Page 227`)
- **Decree:** decree-021 mandates "Resolution phase (trainer_resolution): Declared actions resolve in order from highest to lowest speed."
- **Implementation:** `next-turn.post.ts` lines 80-81 build resolution order as `const resolutionOrder = [...trainerTurnOrder].reverse()`. Since `trainerTurnOrder` is sorted low-to-high, reversing produces high-to-low. This is set as the `turnOrder` for the `trainer_resolution` phase (lines 82-84).
- **Status:** CORRECT

### 3. Three-Phase Turn Progression

- **Rule:** "all Trainers should take their turns, first, before any Pokemon act" and the two-phase trainer system within that (`core/07-combat.md#Page 227`)
- **Decree:** decree-021: "trainer_declaration -> trainer_resolution -> pokemon phase"
- **Implementation:** `next-turn.post.ts` implements the full three-phase cycle:
  - `trainer_declaration` exhausted (line 77) -> `trainer_resolution` (line 82)
  - `trainer_resolution` exhausted (line 103) -> `pokemon` (line 106)
  - `pokemon` exhausted (line 119) -> new round, back to `trainer_declaration` (line 126)
  - Each transition correctly resets `currentTurnIndex = 0` and sets the appropriate `turnOrder`
  - New rounds increment `currentRound`, call `resetCombatantsForNewRound`, decrement weather, and set `clearDeclarations = true`
- **Status:** CORRECT

### 4. Declaration Recording (declare.post.ts)

- **Rule:** Declarations are recorded during the declaration phase, not executed. Per decree-021, this is the "record intent" step.
- **Implementation:** `declare.post.ts` validates:
  1. Encounter is active and in `trainer_declaration` phase (lines 46-53)
  2. Declaring combatant is the current turn's combatant (lines 60-66)
  3. Combatant is human type (lines 69-75)
  4. No duplicate declaration for this round (lines 78-86)
  5. Builds a `TrainerDeclaration` with combatantId, trainerName, actionType, description, targetIds, round (lines 89-97)
  6. Persists to DB without advancing turn (lines 102-107)
- **Status:** CORRECT

### 5. Resolution Turn State Reset

- **Rule:** Trainers should have fresh action economy during resolution to execute their declared action. Per spec-p0 Section D: "Trainers do NOT get action economy during the declaration phase. The declaration phase is purely for recording intent. The actual standard/shift/swift actions are consumed during resolution."
- **Implementation:** `next-turn.post.ts` calls `resetResolvingTrainerTurnState()` (lines 191-206) which resets `hasActed`, `actionsRemaining`, `shiftActionsRemaining`, and full `turnState`. This is called:
  - When entering resolution phase: for the first trainer (line 87)
  - When advancing within resolution: for each subsequent trainer (lines 136-140)
- **Status:** CORRECT

### 6. Initiative Reorder Phase Awareness (decree-006 interaction)

- **Rule:** Per decree-006, initiative should dynamically reorder on Speed CS changes. Per decree-021, resolution phase uses high-to-low order while declaration uses low-to-high.
- **Implementation:** `encounter.service.ts` `reorderInitiativeAfterSpeedChange()` (lines 320-436) correctly handles all three phases:
  - `trainer_declaration`: sorts active turn order ascending (`trainerDescending = false`)
  - `trainer_resolution`: sorts active turn order descending (`trainerDescending = true`)
  - `pokemon`: sorts descending (standard)
  - Stored `trainerTurnOrder` is always re-sorted ascending (declaration order) regardless of current phase, which is correct since it represents the canonical declaration order
  - All callers (status.post.ts, stages.post.ts, breather.post.ts) pass `record.currentPhase`
- **Status:** CORRECT

### 7. Declaration Clearing on New Round

- **Rule:** Per spec-p0: "Cleared at the start of each new round"
- **Implementation:** `next-turn.post.ts` sets `clearDeclarations = true` whenever a new round starts (lines 98, 115, 123). The update data conditionally includes `declarations: JSON.stringify([])` when `clearDeclarations` is true (lines 162-164). The response builder also passes empty declarations when clearing (line 172).
- **Status:** CORRECT

### 8. Undo/Redo Declarations Persistence

- **Rule:** Undo/redo should preserve declaration state to avoid desyncs.
- **Implementation:** `[id].put.ts` line 47 includes `declarations: JSON.stringify(body.declarations ?? [])` in the full state write. This ensures that when the encounter store calls PUT for undo/redo (via `undoAction`/`redoAction` in `encounter.ts`), the declarations array is properly saved and restored.
- **Status:** CORRECT

## Data Model Verification

### TrainerDeclaration Interface (`types/combat.ts`)
- Fields match spec-p0 Section A exactly: `combatantId`, `trainerName`, `actionType`, `description`, `targetIds?`, `round`
- Action types match spec: `'command_pokemon' | 'switch_pokemon' | 'use_item' | 'use_feature' | 'orders' | 'pass'`
- **Status:** CORRECT

### Encounter Interface (`types/encounter.ts`)
- `declarations: TrainerDeclaration[]` field added (line 128)
- `TrainerDeclaration` imported from `types/combat` (line 14)
- **Status:** CORRECT

### Prisma Schema
- `declarations String @default("[]")` field added to Encounter model
- JSON storage approach matches existing patterns (combatants, turnOrder, etc.)
- **Status:** CORRECT

### Encounter Service (`encounter.service.ts`)
- `EncounterRecord` includes `declarations: string` (line 43)
- `ParsedEncounter` includes `declarations: TrainerDeclaration[]` (line 78)
- `buildEncounterResponse` parses declarations with fallback: `options?.declarations ?? JSON.parse(record.declarations || '[]')` (line 246)
- **Status:** CORRECT

### Store Getters and Actions (`stores/encounter.ts`)
- `currentDeclarations` getter filters by current round (lines 98-103)
- `currentResolutionDeclaration` getter returns the current trainer's declaration during resolution phase only (lines 106-113)
- `submitDeclaration` action calls POST to `/declare` endpoint (lines 292-313)
- `updateFromWebSocket` includes declarations sync (lines 439-441)
- **Status:** CORRECT

## Medium Issues

### M1: Declaration Phase Marks Trainers as "Acted" with Zero Actions

**File:** `app/server/api/encounters/[id]/next-turn.post.ts` lines 58-66

During the declaration phase, `next-turn` marks the current combatant with `hasActed = true`, `actionsRemaining = 0`, `shiftActionsRemaining = 0`. While this is functionally harmless (the resolution phase resets turn state via `resetResolvingTrainerTurnState`), it creates a brief inconsistent state where a trainer in the declaration phase appears to have "acted" and consumed actions, when in reality they only declared intent.

This could cause confusion if any UI component or middleware reads these fields during the declaration phase to determine visual state (e.g., showing a trainer as "done" with a grayed-out action bar when they actually just declared). The resolution reset corrects this before the trainer actually acts.

**Impact:** UI-only confusion potential. No mechanical incorrectness because resolution resets everything.

**Recommendation:** Consider conditionally skipping the action-zeroing during declaration phase, or at minimum documenting that these fields are meaningless during declaration. This is a P1 consideration for when UI components (DeclarationPanel) are built.

### M2: No Validation That All Trainers Declared Before Advancing Past Declaration Phase

**File:** `app/server/api/encounters/[id]/next-turn.post.ts` lines 76-84

The code transitions from `trainer_declaration` to `trainer_resolution` when `currentTurnIndex >= turnOrder.length`, meaning the GM has called `next-turn` for every trainer in the turn order. However, there is no validation that each trainer actually submitted a declaration via the `/declare` endpoint before being advanced. The GM could theoretically call `next-turn` repeatedly without ever calling `/declare`, reaching the resolution phase with zero declarations.

Per PTU p.227, ALL trainers declare before resolution begins. The spec-p0 document notes that the GM "submits a declaration for the current trainer, then separately calls next-turn to advance." But the server does not enforce this coupling.

**Impact:** The system allows entering resolution with missing declarations. This is a GM-operator error scenario and the GM is expected to know to declare first. However, the lack of enforcement means a UI bug or misclick could skip a declaration silently.

**Recommendation:** Consider adding a warning (not a hard block -- the GM may have legitimate reasons to skip a declaration for a fainted or absent trainer). This is a P1 edge case item aligned with the spec's P1 scope (faint/skip handling).

## Summary

The P0 implementation of decree-021's two-phase League Battle trainer system is mechanically correct. All 10 commits work together to deliver:

1. A `TrainerDeclaration` data model with proper persistence and response building
2. A declaration recording endpoint with comprehensive validation (phase, turn, type, duplication checks)
3. Correct three-phase turn progression: `trainer_declaration` (low-to-high speed) -> `trainer_resolution` (high-to-low speed) -> `pokemon` (high-to-low speed) -> new round
4. Proper turn state reset during resolution so trainers have fresh action economy
5. Phase-aware initiative reordering that respects decree-006's dynamic reorder while correctly handling the different sort directions per phase
6. Declaration clearing on new round boundaries
7. Undo/redo compatibility via the PUT endpoint
8. Store getters and actions for client-side consumption

The implementation faithfully follows PTU p.227: "Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed." Per decree-021, the true two-phase system is implemented, not a simplified single-pass approach.

## Rulings

1. **Declaration order (ascending by speed):** CONFIRMED CORRECT per PTU p.227 and decree-021.
2. **Resolution order (descending by speed):** CONFIRMED CORRECT per PTU p.227 and decree-021. Implemented as `reverse()` of declaration order.
3. **Resolution is GM-mediated, not auto-executed:** ACCEPTABLE for P0. Declarations are free-text descriptions, not machine-executable commands. The GM manually executes declared actions using existing endpoints. This is explicitly called out in spec-p0 Section D.
4. **Initiative reorder during resolution skips `trainerTurnOrder` reorder for storage:** CORRECT. The stored `trainerTurnOrder` is always in ascending (declaration) order. During resolution, only the active `turnOrder` is re-sorted in descending order. This is the right separation of concerns.
5. **decree-005 (status CS auto-apply) interaction:** No direct interaction with this implementation. Status CS changes that affect Speed will trigger initiative reorder via existing endpoints, which now correctly handles the resolution phase sort direction.

## Verdict

**APPROVED** -- No critical or high issues. Two medium issues identified are P1 scope items (UI state during declaration, missing-declaration validation) that do not affect mechanical correctness of the P0 implementation. The three-phase flow, declaration recording, resolution ordering, and initiative reorder phase-awareness are all correctly implemented per PTU p.227 and decree-021.

## Required Changes

None for P0 approval. The medium issues should be addressed in P1 when UI components and edge cases (faint/skip/undo) are implemented.
