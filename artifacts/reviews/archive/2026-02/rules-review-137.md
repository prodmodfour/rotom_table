---
review_id: rules-review-137
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-003
domain: player-view
commits_reviewed:
  - c8113d1
  - c46b974
  - ba8d298
  - e5fb03b
mechanics_verified:
  - turn-detection
  - ptu-action-economy
  - move-frequency-enforcement
  - league-battle-phases
  - combat-maneuvers
  - switch-pokemon-action-type
  - struggle-attack
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Action Types (p.227)
  - core/07-combat.md#Pokémon Switching (p.229)
  - core/07-combat.md#Struggle Attacks (p.240)
  - core/07-combat.md#Combat Maneuvers (p.241-243)
  - core/07-combat.md#Initiative - League Battles (p.227)
  - core/07-combat.md#Suppressed (p.241) - frequency definitions
reviewed_at: 2026-02-23T14:15:00Z
follows_up: rules-review-134
---

## Mechanics Verified

### 1. Turn Detection (`isMyTurn`)

- **Rule:** "In each round of combat, players get to take two turns: one for their Trainer, and one for a Pokémon." (`core/07-combat.md#p.226`)
- **Implementation:** `usePlayerCombat.ts` lines 31-38. `isMyTurn` checks if `currentCombatant.entityId` matches either `playerStore.character.id` (the trainer) or any of `playerStore.pokemon.map(p => p.id)` (their Pokemon). This correctly detects both trainer turns and Pokemon turns as belonging to the player.
- **Status:** CORRECT

The same logic is duplicated in `PlayerEncounterView.vue` lines 98-106, using `props.myCharacterId` and `props.myPokemonIds`. Both implementations are consistent and correct.

### 2. PTU Action Economy (Standard/Shift/Swift)

- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order." (`core/07-combat.md#p.227`)
- **Implementation:** `usePlayerCombat.ts` lines 84-107. `turnState` reads directly from `combatant.turnState` which tracks `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed`. The three computed properties `canUseStandardAction`, `canUseShiftAction`, `canUseSwiftAction` simply negate the corresponding flags. The UI in `PlayerCombatActions.vue` lines 6-22 displays three action pips (STD/SHF/SWF) that visually reflect usage.
- **Action mapping:**
  - Moves: require Standard Action (`:disabled="isMoveExhausted(move).exhausted || !canUseStandardAction"`, line 84) -- **CORRECT** per "Using a Move" under Standard Actions (p.227)
  - Shift: requires Shift Action (`:disabled="!canUseShiftAction"`, line 113) -- **CORRECT** per "Shift Actions" (p.227)
  - Struggle: requires Standard Action (`:disabled="!canUseStandardAction"`, line 123) -- **CORRECT** per "Struggle Attacks may be used...as a Standard Action" (p.240)
  - Pass Turn: always enabled (no `:disabled`, line 134) -- **CORRECT**, passing is always allowed
- **Status:** CORRECT

### 3. Move Frequency Enforcement

- **Rule:** PTU moves have frequencies: At-Will (unlimited), EOT (every other turn), Scene/Scene x2/Scene x3 (limited per scene), Daily/Daily x2/Daily x3 (limited per day), Static (passive only). From `core/07-combat.md#p.241` (Suppressed condition): "At-Will Moves become EOT, and EOT and Scene x2 Moves become Scene."
- **Implementation:** `usePlayerCombat.ts` lines 132-191. The `isMoveExhausted` function handles all MoveFrequency types:
  - `At-Will`: always available -- **CORRECT**
  - `EOT`: checks `lastTurnUsed >= currentRound - 1 && lastUsed > 0`. If the move was used in the current or previous round, it is exhausted. Available again 2 rounds after last use. -- **CORRECT** (used round 3 -> exhausted rounds 3,4 -> available round 5)
  - `Scene`/`Scene x2`/`Scene x3`: checks `usedThisScene` against 1/2/3 limit -- **CORRECT**
  - `Daily`/`Daily x2`/`Daily x3`: checks `usedToday` against 1/2/3 limit -- **CORRECT**
  - `Static`: always returns exhausted with "passive only" reason -- **CORRECT** (Static moves are not actively used)
  - Default case: returns not exhausted -- acceptable, handles any unexpected frequency gracefully
- **`hasUsableMoves`** (line 196): correctly checks if any move passes `!isMoveExhausted(m).exhausted` for struggle availability hinting.
- **Status:** CORRECT

### 4. League Battle Mode (Trainer vs Pokemon Phases)

- **Rule:** "During Tournament matches and other League Battles where the Trainer doesn't participate directly in the fighting, all Trainers should take their turns, first, before any Pokémon act. In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed. Following that, all Pokémon then act in order from highest to lowest speed." (`core/07-combat.md#p.227`)
- **Implementation:** `usePlayerCombat.ts` lines 60-78.
  - `isLeagueBattle` reads from `encounterStore.isLeagueBattle` (which checks `battleType === 'trainer'`) -- **CORRECT**
  - `currentPhase` reads from `encounterStore.currentPhase` -- **CORRECT** (server manages phase transitions)
  - `isTrainerPhase` checks `currentPhase === 'trainer_declaration' || currentPhase === 'trainer_resolution'` -- **CORRECT** per TurnPhase type which has `trainer_declaration`, `trainer_resolution`, `pokemon`
  - `isPokemonPhase` checks `currentPhase === 'pokemon'` -- **CORRECT**
  - The UI (line 26-30) displays a phase indicator when in a league battle showing "Trainer Phase" or "Pokemon Phase" -- **CORRECT**
- **Note:** The actual enforcement of which actions are available per phase (e.g., trainer can only declare during trainer phase, Pokemon act during Pokemon phase) is handled server-side via the encounter store's turn management. The player composable delegates to `encounterStore.executeMove()` and `encounterStore.nextTurn()` which enforce phase rules on the server. The client-side UI correctly shows phase awareness but does not need to re-implement phase gating -- the server is the authority.
- **Status:** CORRECT

### 5. Combat Maneuvers

- **Rule:** PTU Combat Maneuvers (`core/07-combat.md#p.241-243`):
  - Push: Standard Action, AC 4, Melee, opposed Combat/Athletics
  - Sprint: Standard Action, Self, +50% movement
  - Trip: Standard Action, AC 6, Melee, opposed Combat/Acrobatics
  - Grapple: Standard Action, AC 4, Melee, opposed Combat/Athletics
  - Disarm: Standard Action, AC 6, Melee, opposed Combat/Stealth
  - Dirty Trick: Standard Action, AC 2, Melee, once per scene per target
  - Intercept Melee: Full Action + Interrupt
  - Intercept Ranged: Full Action + Interrupt
  - Take a Breather: Full Action, reset stages, cure volatile status
- **Implementation:** `constants/combatManeuvers.ts` defines `COMBAT_MANEUVERS` with all 9 maneuvers above. Cross-referencing against PTU rules:
  - Push: `actionType: 'standard'`, `ac: 4` -- **CORRECT**
  - Sprint: `actionType: 'standard'`, `ac: null` -- **CORRECT**
  - Trip: `actionType: 'standard'`, `ac: 6` -- **CORRECT**
  - Grapple: `actionType: 'standard'`, `ac: 4` -- **CORRECT**
  - Disarm: `actionType: 'standard'`, `ac: 6` -- **CORRECT**
  - Dirty Trick: `actionType: 'standard'`, `ac: 2` -- **CORRECT**
  - Intercept Melee: `actionType: 'interrupt'`, `actionLabel: 'Full + Interrupt'` -- **CORRECT**
  - Intercept Ranged: `actionType: 'interrupt'`, `actionLabel: 'Full + Interrupt'` -- **CORRECT**
  - Take a Breather: `actionType: 'full'`, `actionLabel: 'Full Action'` -- **CORRECT**
- **Player-side handling:** All maneuvers are sent as GM requests via `requestManeuver()` (line 296-304), which sends a `player_action` WebSocket message. This is correct -- maneuvers involve opposed checks, AC rolls, and tactical decisions that the GM should resolve.
- **Missing maneuvers:** Disengage (Shift Action, no AoO) and Attack of Opportunity (Free Action, triggered) are not in the list. These are pre-existing omissions from the `COMBAT_MANEUVERS` constant, not introduced by this P1 implementation. Disengage is a shift-action variant (not a Standard-action maneuver), and AoO is a triggered free action. Neither is a standard "selectable" maneuver in the same sense. Acceptable omission for P1.
- **Status:** CORRECT (pre-existing constant, player code correctly delegates all maneuvers to GM)

### 6. Switch Pokemon Action Type

- **Rule:** "A full Pokémon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokémon on their respective Initiative Counts." ... "Recall and Release actions can also be taken individually by a Trainer as Shift Actions." ... "Trainers may Switch out Fainted Pokémon as a Shift Action." (`core/07-combat.md#p.229`)
- **Implementation:** `usePlayerCombat.ts` lines 283-290. The `requestSwitchPokemon` function sends a `player_action` WebSocket message with `action: 'switch_pokemon'`. The GM receives this request and resolves the switch with the correct action cost (Standard for full switch, Shift for recall/release individually, Shift for fainted swap).
- **Important design decision:** Switch Pokemon is correctly categorized as a "Requested Action" requiring GM approval. This is the right approach because:
  1. The GM needs to determine the correct action cost (Standard vs Shift depending on context)
  2. The GM needs to enforce League Battle restrictions (cannot command newly-switched Pokemon)
  3. The `canBeCommanded` flag in `TurnState` (combat.ts line 60) exists for this purpose
  4. Range checks (8m recall beam in full contact) require GM adjudication
- **`switchablePokemon` computed** (lines 329-333): Correctly filters to non-fainted Pokemon (`p.currentHp > 0`) and excludes the currently active combatant's entity. This gives the player a valid list of switchable targets.
- **Status:** CORRECT

### 7. Struggle Attack

- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type. ... Never apply STAB to Struggle Attacks. Struggle Attacks do not count as Moves, and effects that alter Moves do not apply to them." (`core/07-combat.md#p.240`)
- **Implementation:** `usePlayerCombat.ts` lines 230-242. The comment correctly documents Struggle as "Normal Type, AC 4, DB 4, Melee, Physical. No STAB." The function calls `encounterStore.executeMove(combatant.id, 'struggle', targetIds)` which delegates to the server-side move execution that creates the Struggle attack with proper parameters (matching the GM-side `GMActionModal.vue` which defines `struggleMove` with `type: 'Normal'`, `damageClass: 'Physical'`, `ac: 4`, `damageBase: 4`).
- **Availability:** Struggle is presented as always available (only gated by `!canUseStandardAction`), not restricted to "no usable moves remain." This is **CORRECT** per PTU rules -- Struggle is a Standard Action option available to all combatants at any time, not just when out of moves. The comment on line 232 ("Available when no usable moves remain") is slightly misleading but the actual button behavior is correct.
- **Note:** Per PTU p.240, "if a Trainer or Pokémon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5." This Expert upgrade is not enforced client-side, but since the server resolves the actual combat calculation, this is acceptable for P1.
- **Status:** CORRECT

## Summary

All seven PTU mechanics verified in this review are correctly implemented. The player combat composable (`usePlayerCombat.ts`) correctly:

1. Detects the player's turn for both trainer and Pokemon combatants
2. Enforces the Standard/Shift/Swift action economy with proper UI feedback
3. Enforces all PTU move frequency types (At-Will, EOT, Scene xN, Daily xN, Static)
4. Provides league battle phase awareness (trainer declaration/resolution vs Pokemon phase)
5. Delegates all combat maneuvers to GM via WebSocket with correct maneuver definitions
6. Delegates switch Pokemon to GM (correct for complex action-cost rules)
7. Implements Struggle as a Standard Action with correct PTU parameters

The implementation follows a clean separation of concerns: the client handles turn detection, UI gating, and frequency enforcement (read-only checks), while delegating all combat resolution (damage calculation, accuracy rolls, opposed checks) to the server via `encounterStore` methods. This is architecturally sound from a PTU rules perspective -- the server remains the source of truth for all game state mutations.

## Rulings

### MEDIUM-001: Misleading Struggle comment (documentation-only)

**File:** `app/composables/usePlayerCombat.ts`, line 232
**Issue:** Comment says "Available when no usable moves remain" but Struggle is actually available whenever a Standard Action is available, per PTU rules. The button behavior is correct (only gated by `canUseStandardAction`), but the comment is misleading.
**PTU Reference:** "Struggle Attacks may be used by Pokémon and Trainers alike as a Standard Action." (`core/07-combat.md#p.240`) -- no prerequisite of exhausting all moves.
**Severity:** MEDIUM (documentation inaccuracy, no behavioral impact)
**Suggested fix:** Change comment to "Available as a Standard Action alternative to using a Move."

## Verdict

**APPROVED**

No CRITICAL or HIGH issues found. One MEDIUM documentation inaccuracy (misleading comment) that does not affect game behavior. All PTU mechanics are correctly implemented or correctly delegated to server-side resolution. The move frequency enforcement is thorough and handles all PTU frequency types. The action economy (Standard/Shift/Swift) is properly gated in the UI. League battle phase awareness is present and correct. Combat maneuvers use the existing verified constant and are properly routed to GM for resolution.

## Required Changes

None required for approval. The MEDIUM-001 comment fix is recommended but not blocking.
