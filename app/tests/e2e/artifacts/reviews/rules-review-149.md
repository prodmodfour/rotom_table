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
  critical: 0
  high: 1
  medium: 2
ptu_refs:
  - core/07-combat.md#Initiative
  - core/07-combat.md#Action-Types
  - core/07-combat.md#Movement-and-Positioning
  - core/07-combat.md#Struggle-Attacks
  - core/07-combat.md#Pokemon-Switching
reviewed_at: 2026-02-25T19:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Combat Turn Order Visibility
- **Rule:** "Combat in Pokemon Tabletop United takes place in a sequence of 10 second rounds where combatants take turns acting in order of their Initiative values." (`core/07-combat.md#Initiative`, p.227)
- **Implementation:** `usePlayerCombat.ts` detects player turn via `encounterStore.currentCombatant` which reads `turnOrder[currentTurnIndex]`. The player sees `isMyTurn` when the current combatant's `entityId` matches their character or any of their pokemon. `PlayerEncounterView.vue` shows `currentCombatant` name in the header and highlights current-turn combatants.
- **Status:** CORRECT — Turn order is server-authoritative (managed by GM through encounterStore). Player sees whose turn it is but cannot manipulate turn order. Initiative order itself is computed server-side and synced via WebSocket `encounter_update` / `turn_change`.

### 2. Action Execution Model (Direct vs Requested)
- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order." (`core/07-combat.md#Action-Types`, p.227)
- **Implementation:** `usePlayerCombat.ts` splits actions into two categories:
  - **Direct:** `executeMove` (Standard), `useShiftAction` (Shift), `useStruggle` (Standard), `passTurn` — executed via encounterStore API calls.
  - **Requested:** `requestUseItem`, `requestSwitchPokemon`, `requestManeuver` — sent via WebSocket `player_action` to GM for approval.
  - Turn state tracking (`standardActionUsed`, `shiftActionUsed`, `swiftActionUsed`) gates UI buttons via `canUseStandardAction` / `canUseShiftAction` / `canUseSwiftAction`.
- **Status:** CORRECT — The PTU action economy (Standard + Shift + Swift per turn) is properly tracked. The split between direct and requested actions is a design choice (not a PTU rule), but it correctly ensures the GM retains authority over complex actions (items, switching, maneuvers) while common actions proceed without delay. The `canBeCommanded` flag correctly handles the League Battle switching restriction (see #4 below).

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
- **Status:** INCORRECT — The Chebyshev distance (`Math.max(dx, dy)`) underestimates PTU diagonal movement cost. Example: moving 4 squares diagonally costs 6m in PTU (1+2+1+2), but Chebyshev reports 4m. The correct formula is already available in `useGridMovement.calculateMoveDistance` but is NOT used here. The comment even says "simplified as Chebyshev" — this is not an acceptable simplification because the distance is displayed to the player on the confirmation sheet and sent to the GM in the `PlayerMoveRequest`.

### 4. League Battle Phase Rules
- **Rule:** "During Tournament matches and other League Battles where the Trainer doesn't participate directly in the fighting, all Trainers should take their turns, first, before any Pokemon act. In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed." (`core/07-combat.md#Initiative`, p.227)
- **Rule (switching):** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced..." (`core/07-combat.md#Pokemon-Switching`, p.229)
- **Implementation:**
  - `usePlayerCombat.ts` reads `encounterStore.isLeagueBattle` (battleType === 'trainer') and `currentPhase` (TurnPhase: `trainer_declaration` | `trainer_resolution` | `pokemon`).
  - `isTrainerPhase` and `isPokemonPhase` computed properties used by `PlayerCombatActions.vue` to show phase indicator ("Trainer Phase" / "Pokemon Phase").
  - `canBeCommanded` flag reads `turnState.canBeCommanded` which defaults to `true`. In League battles, the server sets this to `false` for newly switched-in Pokemon, correctly implementing the switching restriction.
  - `PlayerCombatActions.vue` shows a warning banner when `canBeCommanded` is false and disables move/struggle buttons.
- **Status:** CORRECT — The three-phase League Battle model is properly represented. Phase enforcement is server-authoritative (turn order computed server-side), and the player UI correctly reflects which phase is active. The `canBeCommanded` flag correctly prevents commanding newly switched-in Pokemon.

### 5. Information Asymmetry (HP Visibility)
- **Rule:** PTU does not prescribe specific information hiding rules for digital tools. The design spec (design-player-view-integration-001.md) defines: Own = full info, Allied = name + exact HP, Enemy = name + HP percentage only.
- **Implementation:**
  - `PlayerCombatantInfo.vue` (combatant list): Correctly implements the three-tier visibility. Own tokens show exact HP + stats + injuries. Allied tokens show exact HP + injuries. Enemy tokens show HP percentage only, no injuries. Lines 149-164 implement this.
  - `usePlayerGridView.ts`: `getInfoLevel` and `getDisplayHp` are defined (lines 109-130) and exposed but **not consumed** by any component. The VTT grid `VTTToken.vue` always renders the HP bar from `entity.currentHp / entity.maxHp` (lines 157-163), showing exact HP fill width for all combatants including enemies.
- **Status:** NEEDS REVIEW — The combatant list (PlayerCombatantInfo) correctly implements information asymmetry. The VTT grid tokens do NOT — enemy tokens show exact HP fill width on the token HP bar. However, since VTTToken shows a proportional bar (not numbers), and the same behavior exists on the Group View, this may be intentional for P1 and could be deferred to P2. The `getDisplayHp` utility is already built for when VTTToken gets player-mode HP masking. **Flagged as MEDIUM because the HP bar fill width leaks exact HP percentage to the pixel level, which a motivated player could reverse-engineer.**

### 6. Struggle Attack Rules
- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type. [...] Never apply STAB to Struggle Attacks. Struggle Attacks do not count as Moves, and effects that alter Moves do not apply to them." (`core/07-combat.md#Struggle-Attacks`, p.240)
- **Implementation:** `usePlayerCombat.ts` line 257-269: `useStruggle` delegates to `encounterStore.executeMove(combatantId, 'struggle', targetIds)`. The comment (line 258) correctly states "Normal Type, AC 4, DB 4, Melee, Physical. No STAB." The actual formula execution happens server-side where the 'struggle' special moveId is handled.
- **Status:** CORRECT — The player-side code correctly routes struggle as a Standard Action with a special moveId. The actual damage calculation (AC 4, DB 4, no STAB) is enforced server-side. `hasUsableMoves` (line 223) correctly determines when Struggle is the only option.

### 7. Move Frequency Exhaustion
- **Rule:** PTU move frequencies: At-Will, EOT (Every Other Turn), Scene (1/scene), Scene x2 (2/scene), Scene x3 (3/scene), Daily (1/day), Daily x2, Daily x3, Static (passive).
- **Implementation:** `usePlayerCombat.ts` lines 159-218: `isMoveExhausted` correctly handles all frequency types with proper limit checks. EOT uses `lastTurnUsed` compared to `currentRound - 1`. Scene frequencies check `usedThisScene` against limits. Daily frequencies check `usedToday`. Static returns always exhausted. `PlayerCombatActions.vue` correctly disables exhausted moves and shows the reason.
- **Status:** CORRECT — All PTU frequency types are handled. The EOT check correctly compares against `currentRound - 1` (not just previous turn index, since rounds are the PTU unit).

### 8. Pokemon Switching (Player Requests)
- **Rule:** "A full Pokemon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts." (`core/07-combat.md#Pokemon-Switching`, p.229)
- **Implementation:** `requestSwitchPokemon` in `usePlayerCombat.ts` sends a WebSocket request to the GM. The `switchablePokemon` computed excludes fainted Pokemon (`currentHp > 0`) and the currently active combatant's entity. The actual switch execution is GM-authoritative.
- **Status:** CORRECT — Switching is correctly modeled as a GM-approval action. The player cannot directly switch; they request, and the GM executes. This correctly handles the complexity of Standard vs Shift action cost (fainted = Shift, voluntary = Standard) server-side.

### 9. Fog of War Token Visibility
- **Rule:** Design spec: "Hidden cells = dark/blank, explored cells = dimmed/no tokens, revealed cells = full visibility."
- **Implementation:** `usePlayerGridView.ts` lines 80-97: `visibleTokens` filters combatants by fog state. Hidden cells (`fogStore.getCellState` returning 'hidden') are excluded. Both 'revealed' and 'explored' cells show tokens. When fog is disabled, all tokens are visible.
- **Status:** NEEDS REVIEW — The design spec says explored cells should show "terrain visible, no tokens," but the implementation shows tokens in explored cells. This is a design spec discrepancy. From a PTU perspective, there is no explicit fog-of-war mechanic — this is GM tooling. However, showing tokens in explored (but not currently revealed) cells leaks information about enemy positions that the GM may have intentionally obscured. **Flagged as MEDIUM because the implementation diverges from the design spec's own table.**

## Summary

The P1 Track C implementation correctly implements the core PTU combat mechanics that interface with the player view:

**Correctly implemented:**
- Turn order and initiative are server-authoritative; player sees but cannot manipulate
- Action economy (Standard + Shift + Swift) properly tracked and gated in UI
- League Battle three-phase model (trainer_declaration -> trainer_resolution -> pokemon) correctly reflected
- `canBeCommanded` flag prevents commanding newly switched-in Pokemon in League Battles
- Struggle attack rules correctly delegated to server with proper Standard Action gating
- Move frequency exhaustion handles all PTU frequency types
- Pokemon switching correctly modeled as GM-approval action
- Scene data stripped of GM-only fields (terrains, modifiers)
- Direct vs requested action split preserves GM authority

**Issues found:**
1. **[HIGH] Movement distance in PlayerGridView uses Chebyshev instead of PTU diagonal formula** — wrong distance shown to player and sent to GM
2. **[MEDIUM] VTT grid tokens show exact HP bar for enemies** — information asymmetry not enforced on grid, though `getDisplayHp` utility exists
3. **[MEDIUM] Explored fog cells show tokens** — diverges from design spec table that says explored = "no tokens"

## Rulings

1. **PTU diagonal distance is NOT Chebyshev.** The alternating 1m/2m rule produces `diagonals + floor(diagonals/2) + straights`, which is strictly greater than Chebyshev for any path with 2+ diagonals. The correct formula is already implemented in `useGridMovement.calculateMoveDistance`. The player grid view MUST use it.

2. **VTT HP bar information leakage is MEDIUM, not HIGH**, because:
   (a) The HP bar is a proportional visual indicator, not a number
   (b) The same behavior exists on the Group View (shared display)
   (c) PTU does not mandate HP hiding — this is a design choice
   (d) The utility function `getDisplayHp` exists and can be wired in P2

3. **Fog explored-cell token visibility is a design spec question**, not a PTU rules question. PTU has no fog-of-war mechanic. However, the design spec explicitly says "explored cells = no tokens," so this should be reconciled with the design author.

## Verdict

**CHANGES_REQUIRED** — The HIGH issue (Chebyshev distance instead of PTU diagonal formula) must be fixed before approval. The distance is displayed to the player on the confirmation sheet and sent in the `PlayerMoveRequest` payload, directly affecting game decision-making.

## Required Changes

### HIGH: Fix movement distance calculation in PlayerGridView (MUST FIX)

**File:** `app/components/player/PlayerGridView.vue`, lines 125-128

**Current (incorrect):**
```typescript
const dx = Math.abs(position.x - combatant.position.x)
const dy = Math.abs(position.y - combatant.position.y)
// PTU diagonal: alternating 1m/2m, simplified as Chebyshev
const distance = Math.max(dx, dy)
```

**Required fix:** Use `useGridMovement.calculateMoveDistance` (already available in the codebase) or inline the correct PTU formula:
```typescript
const dx = Math.abs(position.x - combatant.position.x)
const dy = Math.abs(position.y - combatant.position.y)
const diagonals = Math.min(dx, dy)
const straights = Math.abs(dx - dy)
const distance = diagonals + Math.floor(diagonals / 2) + straights
```

**PTU reference:** `core/07-combat.md` p.231: "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again."

### MEDIUM: VTT token HP bar does not enforce information asymmetry (DEFER OK)

**File:** `app/components/vtt/VTTToken.vue`

The `getDisplayHp` and `getInfoLevel` functions in `usePlayerGridView.ts` are already built but not consumed by VTTToken. In player mode, enemy token HP bars should show proportional fill based on percentage only (which they effectively already do visually), but the fill calculation uses exact `currentHp / maxHp`. This is acceptable for P1 since the visual result is indistinguishable, but should be formally wired in P2 when per-token info masking is implemented.

### MEDIUM: Explored fog cells show tokens (RECONCILE WITH DESIGN)

**File:** `app/composables/usePlayerGridView.ts`, lines 86-91

The `visibleTokens` filter includes tokens in both 'revealed' and 'explored' cells. The design spec table says explored cells should show "terrain visible, no tokens." Either the design spec or the implementation needs updating. If the intent is to show tokens in explored cells (reasonable for gameplay), update the design spec. If the intent is to hide them, change the filter to only include 'revealed'.
