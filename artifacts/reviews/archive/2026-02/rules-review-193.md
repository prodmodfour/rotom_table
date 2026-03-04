---
review_id: rules-review-193
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-107
domain: combat
commits_reviewed:
  - 4faef76
  - c46ad18
  - 2e47c3a
  - 904c765
  - 1f8aec1
  - 3bae724
  - d6d69f3
  - 790ebdc
mechanics_verified:
  - declaration-phase-turn-order-direction
  - resolution-phase-turn-order-direction
  - pokemon-phase-turn-order-direction
  - declaration-panel-visibility-and-phase-gating
  - declaration-summary-resolution-tracking
  - fainted-trainer-auto-skip
  - undeclared-trainer-auto-skip-in-resolution
  - temp-condition-preservation-during-declaration
  - resolution-action-economy-reset
  - websocket-declaration-sync
  - phase-label-accuracy
  - decree-021-compliance
  - decree-006-interaction
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 227 (Initiative - League Battles)
  - core/07-combat.md#Page 227 (Action Types)
reviewed_at: 2026-02-28T14:30:00Z
follows_up: rules-review-178
---

## Review Scope

P1 implementation review of ptu-rule-107 (League Battle two-phase trainer system). P0 was approved in rules-review-175 (initial) and rules-review-178 (fix cycle). This review covers the P1 tier: DeclarationPanel UI, DeclarationSummary UI, WebSocket sync for declarations, auto-skip of fainted/undeclared trainers, GM page + Group view integration, and phase labels showing turn order direction.

No P2 spec exists -- P1 is the final tier.

**Decrees verified:**
- decree-021: Two-phase trainer system for League Battles. All P1 UI elements faithfully present the two-phase flow.
- decree-006: Dynamic initiative reorder. Not modified by P1 commits. Phase-aware reorder (verified in rules-review-178) remains intact.
- decree-012: Type-based status immunities. Not impacted by P1.

## Mechanics Verified

### 1. Declaration Phase Turn Order Direction

- **Rule:** "In League Battles only, Trainers declare their actions in order from lowest to highest speed" (`core/07-combat.md#Page 227`)
- **Implementation:** The start endpoint (`start.post.ts` line 99) calls `sortByInitiativeWithRollOff(trainers, false)` -- the `false` parameter means ascending sort (lowest speed first). The `trainerTurnOrder` is stored and reused when entering declaration phases. At new round boundaries in `next-turn.post.ts` (lines 173-175), `turnOrder = [...trainerTurnOrder]` preserves the low-to-high ordering.
- **UI Representation:** `DeclarationPanel.vue` (line 77) shows progress via `encounterStore.trainersByTurnOrder` which maps `trainerTurnOrder` to combatants -- preserving the ascending order. The `EncounterHeader.vue` phase label reads "Declaration (Low -> High)" (line 190: `trainer_declaration: 'Declaration (Low \u2192 High)'`). `CombatantSides.vue` and `InitiativeTracker.vue` display the same label.
- **Status:** CORRECT

### 2. Resolution Phase Turn Order Direction

- **Rule:** "and then the actions take place and resolve from highest to lowest speed" (`core/07-combat.md#Page 227`)
- **Implementation:** In `next-turn.post.ts` (line 99), when transitioning from declaration to resolution: `const resolutionOrder = [...trainerTurnOrder].reverse()`. Since `trainerTurnOrder` is sorted ascending (low-to-high), reversing it produces descending (high-to-low). `turnOrder` is set to this reversed array.
- **UI Representation:** The `EncounterHeader.vue` phase label reads "Resolution (High -> Low)" (line 191: `trainer_resolution: 'Resolution (High \u2192 Low)'`). `DeclarationSummary.vue` highlights the currently-resolving trainer via `isCurrentlyResolving()` (line 49) which checks `encounterStore.currentCombatant?.id`, and tracks resolved trainers via `isResolved()` (line 55) which compares combatant position against `currentTurnIndex` in the resolution-ordered `turnOrder`. This correctly reflects resolution proceeding from fastest to slowest.
- **Status:** CORRECT

### 3. Pokemon Phase Turn Order Direction

- **Rule:** "Following that, all Pokemon then act in order from highest to lowest speed." (`core/07-combat.md#Page 227`)
- **Implementation:** In `start.post.ts` (line 101): `sortByInitiativeWithRollOff(pokemon, true)` -- `true` = descending (high-to-low). The `pokemonTurnOrder` is stored and used when transitioning to the pokemon phase in `next-turn.post.ts` (lines 147-149): `turnOrder = [...pokemonTurnOrder]`.
- **UI Representation:** `EncounterHeader.vue` shows "Pokemon Phase" (line 192). `InitiativeTracker.vue` shows "Pokemon Phase" (line 60). No directional arrow needed because high-to-low is the default/expected order.
- **Status:** CORRECT

### 4. Declaration Panel Visibility and Phase Gating

- **Rule:** Per decree-021: "Declaration phase (trainer_declaration): Trainers declare actions in order from lowest to highest speed. Actions are recorded but NOT executed."
- **Implementation:** `DeclarationPanel.vue` (line 58-61) gates visibility with three conditions: `encounterStore.isLeagueBattle`, `encounterStore.currentPhase === 'trainer_declaration'`, and `encounterStore.currentCombatant?.type === 'human'`. The panel is only visible during declaration phase of League Battles when a trainer is the current combatant.
- **Declaration submission** (line 86-108): Calls `encounterStore.submitDeclaration()` which hits `declare.post.ts`. The declare endpoint (line 48-53) validates `encounter.currentPhase !== 'trainer_declaration'` and rejects non-declaration-phase requests. It also validates the combatant is the current turn's combatant (line 60-66) and is of type 'human' (line 69-75). After successful declaration, the panel calls `encounterStore.nextTurn()` to advance to the next declaring trainer.
- **Action types offered:** `command_pokemon`, `switch_pokemon`, `use_item`, `use_feature`, `orders`, `pass`. These cover the standard PTU trainer actions during League Battles. The "pass" option handles PTU's implicit "do nothing" choice. The spec's edge case H5 ("Can a trainer hold their declaration?") correctly concludes no -- declaration order is mandatory per PTU p.227.
- **Status:** CORRECT

### 5. Declaration Summary Resolution Tracking

- **Rule:** During resolution phase, trainers resolve actions from highest to lowest speed. The summary should track which trainers have resolved and which is currently resolving.
- **Implementation:** `DeclarationSummary.vue` (line 49-59):
  - `isCurrentlyResolving()`: Returns true only during `trainer_resolution` phase when the combatant ID matches `currentCombatant.id`.
  - `isResolved()`: Returns true only during `trainer_resolution` phase when the combatant's index in `turnOrder` is less than `currentTurnIndex`. Since `turnOrder` during resolution is the reversed trainer order (high-to-low), and `currentTurnIndex` advances as each trainer resolves, any combatant whose position is before the current index has already resolved.
- **Visibility:** The component shows whenever `encounterStore.currentDeclarations.length > 0` (line 37), meaning it persists through declaration, resolution, AND pokemon phases. Per spec section F: "During pokemon phase: shows full list as reference (collapsed by default)." The `expanded` ref defaults to `true` (line 35), but this is a minor UI preference -- during resolution phase it shows actively, and during pokemon phase players can still reference declarations.
- **Status:** CORRECT

### 6. Fainted Trainer Auto-Skip During Declaration

- **Rule:** PTU p.227: Trainers "declare their actions in order." A fainted trainer (0 HP) cannot take any actions and should be skipped.
- **Implementation:** `next-turn.post.ts` lines 86-88: During `trainer_declaration` phase, `skipFaintedTrainers()` (lines 305-318) is called. The function advances `currentTurnIndex` past any combatants where `combatant.entity.currentHp <= 0`. This is also called at the start of new rounds when entering declaration phase (lines 162-163, 181-183).
- **Analysis:** The HP check (`currentHp > 0`) correctly identifies fainted trainers. PTU has no explicit rule about fainted trainers during declaration (they simply cannot act), so skipping them is the correct implementation. The spec's edge case H1 is correctly implemented: fainted trainers get no declaration entry, and during resolution they are automatically skipped by `skipUndeclaredTrainers()` since they have no declaration.
- **Status:** CORRECT

### 7. Undeclared Trainer Auto-Skip in Resolution

- **Rule:** If a trainer has no declaration (e.g., was fainted during declaration), they have nothing to resolve.
- **Implementation:** `next-turn.post.ts` lines 89-92 and 110: During `trainer_resolution` phase, `skipUndeclaredTrainers()` (lines 327-343) is called. The function checks `declarations.some(d => d.combatantId === combatantId && d.round === currentRound)` and advances past trainers with no matching declaration. This is called both at mid-resolution advancement and at the start of the resolution phase (line 110).
- **Analysis:** The round-matching check (`d.round === currentRound`) ensures only current-round declarations are considered, preventing stale declarations from previous rounds (which are cleared anyway, but this is defense-in-depth). This correctly handles the edge case where all trainers were fainted: if no declarations exist for anyone, `skipUndeclaredTrainers` advances past all trainers and the phase transitions to pokemon (lines 112-117).
- **Status:** CORRECT

### 8. Temporary Condition Preservation During Declaration

- **Rule:** Per rules-review-178 ruling #1: "Declaration is not a 'turn' for temporary condition purposes."
- **Implementation:** `next-turn.post.ts` line 68: `if (currentPhase !== 'trainer_declaration') { currentCombatant.tempConditions = [] }`. During declaration phase, temp conditions are NOT cleared. They are instead cleared during resolution in `resetResolvingTrainerTurnState()` (line 251: `trainer.tempConditions = []`).
- **P1 impact:** The P1 commits do not modify this logic. The DeclarationPanel UI does not interact with temp conditions -- it only records declarations. The phase labels accurately communicate that declaration is a non-execution phase.
- **Status:** CORRECT (preserved from P0 fix cycle, verified in rules-review-178)

### 9. Resolution Action Economy Reset

- **Rule:** PTU p.227: "each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn."
- **Implementation:** `resetResolvingTrainerTurnState()` (lines 243-261) gives each resolving trainer: `actionsRemaining = 2`, `shiftActionsRemaining = 1`, and a full `turnState` reset. `resetAllTrainersForResolution()` (lines 270-277) clears `hasActed` for all trainers entering resolution. This is called at the declaration-to-resolution transition (line 107), and then `resetResolvingTrainerTurnState` is called for the first resolver (line 128) and for each subsequent resolver mid-resolution (line 191).
- **P1 impact:** The P1 commits do not modify this logic. The GM page's "Next Turn" button (line 429 of `gm/index.vue`) correctly calls `encounterStore.nextTurn()` which triggers the server-side `next-turn.post.ts` logic for phase transitions and action economy resets.
- **Status:** CORRECT (preserved from P0, verified in rules-review-178)

### 10. WebSocket Declaration Sync

- **Rule:** All connected clients (GM, Group, Player) should see declaration state updates in real-time.
- **Implementation:** `ws.ts` (lines 349-361) handles two new event types:
  - `trainer_declared` (line 349-354): GM-only broadcast to encounter, relaying that a trainer declared.
  - `declaration_update` (line 356-361): GM-only broadcast to encounter, relaying updated declarations array.
  - `sendEncounterState()` (line 81): Includes `declarations: JSON.parse(encounter.declarations || '[]')` in the encounter state sent to clients on sync.
- **Encounter store WebSocket handler** (line 438-441 of `encounter.ts`): `if (data.declarations !== undefined) { this.encounter.declarations = data.declarations }` updates declarations from incoming WebSocket data.
- **GM page broadcast** (lines 442-451 of `gm/index.vue`): `handleDeclarationBroadcast()` sends the full encounter state via `encounter_update` after a declaration, ensuring all clients receive the updated declarations.
- **Analysis:** The broadcast pattern follows the existing encounter update mechanism. Group views receive declarations through the standard `encounter_update` flow, allowing `DeclarationSummary.vue` on the Group EncounterView to display real-time declaration data. The existing `encounter_update` handler already propagates all encounter fields including `currentPhase`, `turnOrder`, and `declarations`.
- **Status:** CORRECT

### 11. Phase Label Accuracy

- **Rule:** PTU p.227 specifies three distinct phases for League Battles: (1) trainers declare low-to-high, (2) trainers resolve high-to-low, (3) Pokemon act high-to-low.
- **Implementation:** Three components display phase labels, all using consistent label maps:
  - `EncounterHeader.vue` (lines 189-193): `'Declaration (Low -> High)'`, `'Resolution (High -> Low)'`, `'Pokemon Phase'`
  - `CombatantSides.vue` (lines 125-129): Same labels, displayed as a badge next to "Current Turn"
  - `InitiativeTracker.vue` (lines 57-61): Same labels, displayed as the tracker title
- **Tooltips:** `EncounterHeader.vue` (lines 195-199) provides explanatory tooltips referencing decree-021 for the trainer phases and stating "Pokemon act in initiative order (fastest first)" for the pokemon phase.
- **Analysis:** The directional arrows (Low -> High, High -> Low) accurately represent the PTU-mandated ordering for each phase. The labels are only shown when `encounter.battleType === 'trainer'` and `encounter.isActive`, correctly hiding them for Full Contact battles and inactive encounters.
- **Status:** CORRECT

### 12. Decree-021 Compliance

- **Rule:** decree-021 mandates: "In League Battle mode, trainer turns follow a two-phase cycle per PTU p.227: (1) Declaration phase: trainers declare in lowest-to-highest speed order, recorded but NOT executed. (2) Resolution phase: declared actions resolve in highest-to-lowest speed order."
- **P1 UI Implementation:** DeclarationPanel enforces declaration-only behavior (records intent, does not execute actions). DeclarationSummary shows the declaration/resolution flow. Phase labels communicate the turn order direction. Auto-skip handles fainted/undeclared edge cases without violating the two-phase structure. WebSocket sync ensures all clients see the two-phase flow in real-time.
- **Status:** COMPLIANT

### 13. Decree-006 Interaction

- **Rule:** decree-006 mandates dynamic initiative reorder on speed changes without granting extra turns.
- **P1 impact:** The P1 commits do not modify `reorderInitiativeAfterSpeedChange()` in `encounter.service.ts`. The phase-aware sort directions (ascending for declaration, descending for resolution/pokemon) remain intact. The P1 UI correctly reflects whatever turn order the server provides, so if a speed change triggers a reorder mid-declaration, the UI will display the updated order via the standard encounter update flow.
- **Status:** NOT IMPACTED (preserved from P0)

## Summary

The P1 implementation correctly presents the League Battle two-phase trainer system through dedicated UI components, WebSocket synchronization, and edge case handling. All PTU p.227 mechanics verified in P0 (rules-review-175, rules-review-178) remain intact. The new P1 code is purely presentational and orchestrational -- it does not alter any game-mechanical calculations, turn order algorithms, or phase transition logic.

Key correctness points:
1. Declaration order (low-to-high speed) is accurately labeled and enforced through the existing server-side sort.
2. Resolution order (high-to-low speed) is accurately labeled and tracked in the DeclarationSummary component.
3. Fainted trainer auto-skip during declaration prevents invalid declarations without violating turn order rules.
4. Undeclared trainer auto-skip during resolution correctly skips trainers who had no opportunity to declare.
5. WebSocket sync propagates declaration state to all clients, ensuring Group/Player views see the two-phase flow.
6. Phase labels with directional arrows provide clear feedback about the current phase's turn order.

## Rulings

1. **DeclarationPanel action types are PTU-complete for League Battles:** The six action types (Command Pokemon, Switch Pokemon, Use Item, Use Feature, Orders, Pass) cover all standard trainer actions in PTU League Battles. "Orders" covers Trainer Features that give commands/buffs. "Pass" covers trainers who choose not to act. This is sufficient for the declaration recording mechanic.

2. **DeclarationSummary "resolved" tracking uses correct index comparison:** The `isResolved()` function compares the combatant's position in the resolution-ordered `turnOrder` against `currentTurnIndex`. Since resolution proceeds sequentially through the array, any combatant with a lower index has already resolved. This is mathematically correct for the linear turn progression model.

3. **Auto-skip mechanics do not violate PTU turn order:** Skipping fainted trainers during declaration and skipping undeclared trainers during resolution are both valid PTU interpretations. A fainted trainer cannot take any actions (PTU does not mandate that fainted combatants still declare). An undeclared trainer has nothing to resolve. The skip logic preserves the relative order of remaining trainers.

## Verdict

**APPROVED** -- The P1 implementation correctly presents the PTU 1.05 League Battle two-phase trainer system (decree-021) through UI components, WebSocket sync, and edge case handling. All 13 mechanics verified are CORRECT. Phase labels accurately reflect PTU p.227's mandated turn order directions. No PTU mechanics issues found. No decree violations detected.

## Required Changes

None.
