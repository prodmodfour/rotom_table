---
review_id: rules-review-149
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-003-track-c-p1
domain: player-view
commits_reviewed:
  - fda245d
  - 7419874
  - 2f09939
  - 1630177
  - 5a01c60
  - 3d0b92b
  - d3eeb8e
  - 51029cb
  - 6661d43
mechanics_verified:
  - combat-turn-order-visibility
  - action-execution-model
  - movement-distance-calculation
  - league-battle-phases
  - information-asymmetry
  - struggle-attack-rules
  - move-frequency-exhaustion
  - pokemon-switching-rules
  - fog-of-war-visibility
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Initiative
  - core/07-combat.md#Action-Types
  - core/07-combat.md#Movement-and-Positioning
  - core/07-combat.md#Struggle-Attacks
  - core/07-combat.md#Pokemon-Switching
reviewed_at: 2026-02-25T15:30:00Z
follows_up: rules-review-146
---

## Mechanics Verified

### 1. Combat Turn Order Visibility
- **Rule:** "Combat in Pokemon Tabletop United takes place in a sequence of 10 second rounds where combatants take turns acting in order of their Initiative values." (`core/07-combat.md#Initiative`, p.227)
- **Implementation:** `usePlayerCombat.ts` detects player turn via `encounterStore.currentCombatant` which reads `turnOrder[currentTurnIndex]`. The player sees `isMyTurn` when the current combatant's `entityId` matches their character or any of their pokemon. `PlayerEncounterView.vue` shows `currentCombatant` name in the header and highlights current-turn combatants.
- **Status:** CORRECT -- Turn order is server-authoritative (managed by GM through encounterStore). Player sees whose turn it is but cannot manipulate turn order. Initiative order itself is computed server-side and synced via WebSocket `encounter_update` / `turn_change`.

### 2. Action Execution Model (Direct vs Requested)
- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order." (`core/07-combat.md#Action-Types`, p.227)
- **Implementation:** `usePlayerCombat.ts` splits actions into two categories:
  - **Direct:** `executeMove` (Standard), `useShiftAction` (Shift), `useStruggle` (Standard), `passTurn` -- executed via encounterStore API calls.
  - **Requested:** `requestUseItem`, `requestSwitchPokemon`, `requestManeuver` -- sent via WebSocket `player_action` to GM for approval.
  - Turn state tracking (`standardActionUsed`, `shiftActionUsed`, `swiftActionUsed`) gates UI buttons via `canUseStandardAction` / `canUseShiftAction` / `canUseSwiftAction`.
- **Status:** CORRECT -- The PTU action economy (Standard + Shift + Swift per turn) is properly tracked. The split between direct and requested actions is a design choice (not a PTU rule), but it correctly ensures the GM retains authority over complex actions (items, switching, maneuvers) while common actions proceed without delay.

### 3. Movement Distance Calculation (Player Grid View)
- **Rule:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth." (`core/07-combat.md#Movement-and-Positioning`, p.231)
- **Implementation:** `PlayerGridView.vue` lines 125-128 calculate distance for the move confirmation sheet:
  ```typescript
  const dx = Math.abs(position.x - combatant.position.x)
  const dy = Math.abs(position.y - combatant.position.y)
  // PTU diagonal: alternating 1m/2m, simplified as Chebyshev
  const distance = Math.max(dx, dy)
  ```
  However, the canonical PTU diagonal formula (already implemented in `useGridMovement.ts` lines 141-148) is:
  ```typescript
  const diagonals = Math.min(dx, dy)
  const straights = Math.abs(dx - dy)
  const diagonalCost = diagonals + Math.floor(diagonals / 2)
  return diagonalCost + straights
  ```
- **Status:** INCORRECT -- The Chebyshev distance (`Math.max(dx, dy)`) underestimates PTU diagonal movement cost. Example: moving 4 squares diagonally costs 6m in PTU (1+2+1+2), but Chebyshev reports 4m. The correct formula is already available in `useGridMovement.calculateMoveDistance` but is NOT used here. The comment says "simplified as Chebyshev" -- this is not an acceptable simplification because the distance is displayed to the player on the confirmation sheet and sent to the GM in the `PlayerMoveRequest`.

### 4. League Battle Phase Rules
- **Rule:** "During Tournament matches and other League Battles where the Trainer doesn't participate directly in the fighting, all Trainers should take their turns, first, before any Pokemon act." (`core/07-combat.md#Initiative`, p.227)
- **Rule (switching):** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced..." (`core/07-combat.md#Pokemon-Switching`, p.229)
- **Implementation:**
  - `usePlayerCombat.ts` reads `encounterStore.isLeagueBattle` (battleType === 'trainer') and `currentPhase` (TurnPhase: `trainer_declaration` | `trainer_resolution` | `pokemon`).
  - `isTrainerPhase` and `isPokemonPhase` computed properties used by `PlayerCombatActions.vue` to show phase indicator.
  - `canBeCommanded` flag reads `turnState.canBeCommanded` which defaults to `true`. In League battles, the server sets this to `false` for newly switched-in Pokemon.
- **Status:** CORRECT -- The three-phase League Battle model is properly represented. Phase enforcement is server-authoritative (turn order computed server-side), and the player UI correctly reflects which phase is active.

### 5. Information Asymmetry (HP Visibility)
- **Rule:** PTU does not prescribe specific information hiding rules for digital tools. The design spec defines: Own = full info, Allied = name + exact HP, Enemy = name + HP percentage only.
- **Implementation:**
  - `PlayerCombatantInfo.vue` (combatant list): Correctly implements the three-tier visibility.
  - `usePlayerGridView.ts`: `getInfoLevel` and `getDisplayHp` are defined and exposed but **not consumed** by any component. `VTTToken.vue` always renders the HP bar from `entity.currentHp / entity.maxHp`, showing exact HP fill width for all combatants including enemies.
- **Status:** MEDIUM -- The combatant list (PlayerCombatantInfo) correctly implements information asymmetry. The VTT grid tokens do NOT -- enemy tokens show exact HP fill width. However, since VTTToken shows a proportional bar (not numbers), and the same behavior exists on the Group View, this is acceptable for P1. The `getDisplayHp` utility is already built for when VTTToken gets player-mode HP masking.

### 6. Struggle Attack Rules
- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type. [...] Never apply STAB to Struggle Attacks." (`core/07-combat.md#Struggle-Attacks`, p.240)
- **Implementation:** `usePlayerCombat.ts` `useStruggle` delegates to `encounterStore.executeMove(combatantId, 'struggle', targetIds)`. The actual damage calculation is server-side.
- **Status:** CORRECT -- Player-side code correctly routes struggle as a Standard Action with a special moveId. Server enforces AC 4, DB 4, no STAB.

### 7. Move Frequency Exhaustion
- **Rule:** PTU move frequencies: At-Will, EOT, Scene, Scene x2, Scene x3, Daily, Daily x2, Daily x3, Static.
- **Implementation:** `usePlayerCombat.ts` `isMoveExhausted` handles all frequency types. EOT uses `lastTurnUsed` compared to `currentRound - 1`. Scene frequencies check `usedThisScene` against limits. Daily frequencies check `usedToday`. Static returns always exhausted.
- **Status:** CORRECT -- All PTU frequency types are handled.

### 8. Pokemon Switching (Player Requests)
- **Rule:** "A full Pokemon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts." (`core/07-combat.md#Pokemon-Switching`, p.229)
- **Implementation:** `requestSwitchPokemon` sends a WebSocket request to the GM. `switchablePokemon` excludes fainted Pokemon and the currently active combatant.
- **Status:** CORRECT -- Switching is correctly modeled as a GM-approval action. Complexity of Standard vs Shift action cost (fainted = Shift, voluntary = Standard) handled server-side.

### 9. Fog of War Token Visibility
- **Rule:** Design spec: "Hidden cells = dark/blank, explored cells = dimmed/terrain visible/no tokens, revealed cells = full visibility."
- **Implementation:** `usePlayerGridView.ts` lines 80-97: `visibleTokens` filters combatants by fog state. Hidden cells are excluded. Both 'revealed' AND 'explored' cells show tokens. When fog is disabled, all tokens are visible.
- **Status:** MEDIUM -- The design spec says explored cells should show "terrain visible, no tokens," but the implementation shows tokens in explored cells. From a PTU perspective, there is no explicit fog-of-war mechanic (this is GM tooling). However, showing tokens in explored-but-not-revealed cells leaks information about enemy positions that the GM may have intentionally obscured. This diverges from the design spec's own information asymmetry table.

## Issues

### CRITICAL

**R1: Player distance calculation uses Chebyshev instead of PTU alternating diagonal rule**

File: `app/components/player/PlayerGridView.vue`, lines 125-130

PTU 1.05 Chapter 9 (p.231) specifies diagonal movement costs alternate between 1m and 2m. The correct formula is `diagonals + floor(diagonals / 2) + straights`. The implementation uses `Math.max(dx, dy)` (Chebyshev distance), which treats every diagonal as 1m.

| Movement | Correct PTU | Chebyshev (bug) | Error |
|----------|-------------|-----------------|-------|
| 2 diagonal | 3m | 2m | -1m |
| 3 diagonal | 4m | 3m | -1m |
| 4 diagonal | 6m | 4m | -2m |
| 5 diagonal | 7m | 5m | -2m |
| 6 diagonal | 9m | 6m | -3m |

This incorrect value is displayed to the player in the confirmation sheet AND sent to the GM in the `player_move_request` payload, directly affecting movement approval decisions. A player with Overland 5 sees a 4-diagonal move reported as 4m (within speed) when it actually costs 6m (exceeds speed by 1m).

The correct formula already exists in `useGridMovement.calculateMoveDistance()` (lines 141-148 of the composable).

### MEDIUM

**R2: VTT grid tokens show exact HP bar for enemies (information asymmetry gap)**

File: `app/components/vtt/VTTToken.vue`, lines 157-163

The HP bar fill width is calculated from `entity.currentHp / entity.maxHp` for all combatants, including enemies in player mode. The `getDisplayHp` utility in `usePlayerGridView.ts` is built to provide percentage-only data for enemies, but it is not wired into VTTToken. A motivated player could deduce exact HP from pixel-level analysis of the bar width.

This is acceptable for P1 since (a) the HP bar is proportional not numeric, (b) the same behavior exists on the Group View, and (c) PTU does not mandate HP hiding. The utility function exists for P2 integration.

**R3: Explored fog cells show tokens (diverges from design spec)**

File: `app/composables/usePlayerGridView.ts`, lines 86-91

The `visibleTokens` filter includes tokens in both 'revealed' and 'explored' cells. The design spec table (section 3.5) says explored cells should show "Dimmed, terrain visible, no tokens." PTU has no explicit fog-of-war mechanic, so this is a design spec question rather than a rules question. However, the implementation should match the design spec or the spec should be updated to reflect the intended behavior.

## Rulings

1. **PTU diagonal distance is NOT Chebyshev.** The alternating 1m/2m rule produces `diagonals + floor(diagonals/2) + straights`, which is strictly greater than Chebyshev for any path with 2+ diagonals. The player grid view MUST use the correct formula. The correct implementation already exists in `useGridMovement.calculateMoveDistance`.

2. **VTT HP bar information leakage is MEDIUM, not HIGH**, because: (a) the HP bar is a proportional visual indicator, not a number; (b) the same behavior exists on the Group View; (c) PTU does not mandate HP hiding; (d) the utility function `getDisplayHp` exists and can be wired in P2.

3. **Fog explored-cell token visibility is a design spec question**, not a PTU rules question. PTU has no fog-of-war mechanic. However, the design spec explicitly says "explored cells = no tokens," so this should be reconciled with the design author.

## Verdict

**CHANGES_REQUIRED** -- The Chebyshev distance calculation (R1) is a PTU rules violation that produces incorrect movement distances shown to both player and GM. This must be fixed to use the correct PTU alternating diagonal formula before approval.

## Required Changes

### CRITICAL: Fix movement distance calculation (MUST FIX)

**File:** `app/components/player/PlayerGridView.vue`, lines 125-128

Replace:
```typescript
const dx = Math.abs(position.x - combatant.position.x)
const dy = Math.abs(position.y - combatant.position.y)
const distance = Math.max(dx, dy)
```

With the correct PTU formula (use `useGridMovement.calculateMoveDistance` or inline):
```typescript
const dx = Math.abs(position.x - combatant.position.x)
const dy = Math.abs(position.y - combatant.position.y)
const diagonals = Math.min(dx, dy)
const straights = Math.abs(dx - dy)
const distance = diagonals + Math.floor(diagonals / 2) + straights
```

**PTU reference:** `core/07-combat.md` p.231: "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again."

### MEDIUM: Reconcile explored fog cell token visibility with design spec (FIX OR UPDATE SPEC)

Either change `usePlayerGridView.ts` line 91 filter to only show tokens in 'revealed' cells (`return state === 'revealed'`), or update the design spec table to reflect that explored cells DO show tokens (dimmed). Consult the design author.

### MEDIUM: Wire getDisplayHp into VTTToken for player mode (DEFER TO P2 OK)

The `getDisplayHp` / `getInfoLevel` utilities exist in `usePlayerGridView.ts` but are not consumed. Acceptable to defer to P2 since the visual impact is minimal, but track this as a known gap.
