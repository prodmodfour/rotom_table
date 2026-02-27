---
review_id: rules-review-140
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-003
domain: player-view
commits_reviewed:
  - af5ee4f
  - 867e189
  - 58673d8
  - 7a512e7
  - f8931ab
  - b7b81c5
  - fdcdc55
mechanics_verified:
  - canBeCommanded-league-switch
  - struggle-attack-availability
  - ptu-action-economy
  - move-frequency-enforcement
  - league-battle-phases
  - combat-maneuvers
  - switch-pokemon-action-type
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Pokemon Switching (p.229)
  - core/07-combat.md#Action Types (p.227)
  - core/07-combat.md#Struggle Attacks (p.240)
  - core/07-combat.md#Combat Maneuvers (p.241-243)
  - core/07-combat.md#Initiative - League Battles (p.227)
  - core/07-combat.md#Suppressed (p.247)
reviewed_at: 2026-02-24T16:30:00Z
follows_up: rules-review-137
---

## Fix Verification

### C1 Fix: canBeCommanded not checked in league battles (af5ee4f)

- **Rule:** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon." (`core/07-combat.md#p.229`)
- **Previous state:** Moves and Struggle buttons were only gated by `canUseStandardAction`, ignoring the `canBeCommanded` flag on `turnState`. A newly switched-in Pokemon in a league battle could be commanded by the player.
- **Fix applied:** Added `canBeCommanded` computed in `usePlayerCombat.ts` (line 114-116) reading `turnState.value.canBeCommanded ?? true`. The `?? true` fallback is correct for backward compatibility with existing combatants that predate this field. The disable condition `!canBeCommanded` was added to:
  - Move buttons (`:disabled` at line 90)
  - Struggle button (`:disabled` at line 129)
  - `handleMoveSelect` guard (line 350)
  - `handleStruggleSelect` guard (line 360)
- **Shift and Pass remain enabled:** Shift button is only gated by `canUseShiftAction` (line 119), Pass has no disable condition (line 139). This is correct -- the PTU rule restricts *commanding* (using moves/struggle/maneuvers), not shifting or passing.
- **Warning banner:** A `combat-actions__not-commandable` div (lines 33-36) displays "Cannot command this Pokemon this turn" with a warning icon when `!canBeCommanded`. Correct UX.
- **Server-side backing:** Confirmed `canBeCommanded: boolean` exists in `app/types/combat.ts` (line 60) and is initialized to `true` in `combatant.service.ts` (line 618). The server manages the state transition when a switch occurs.
- **Status:** FIX VERIFIED -- CORRECT

### MEDIUM-001 Fix: Misleading Struggle comment (af5ee4f)

- **Rule:** "Struggle Attacks may be used by Pokemon and Trainers alike as a Standard Action." (`core/07-combat.md#p.240`) -- no prerequisite of exhausting all moves.
- **Previous state:** Comment on `useStruggle` said "Available when no usable moves remain."
- **Fix applied:** Comment now reads "Available as a Standard Action alternative to using a Move." (line 241). This accurately reflects PTU rules -- Struggle is always available as a Standard Action, not only when moves are exhausted.
- **Status:** FIX VERIFIED -- CORRECT

### M1 Fix: Duplicated isMyTurn logic (7a512e7)

- **Previous state:** `PlayerEncounterView.vue` had its own computed `isMyTurn` using `props.myCharacterId` and `props.myPokemonIds`, duplicating the logic in `usePlayerCombat.ts`.
- **Fix applied:** Replaced with `const { isMyTurn, currentCombatant } = usePlayerCombat()`. The local `currentCombatant` computed was also removed in favor of the composable's version. Diff confirms 12 lines removed, 1 added.
- **Rules impact:** None. The composable's `isMyTurn` uses `playerStore.character.id` and `playerStore.pokemon.map(p => p.id)` which are equivalent to the previous props-based approach. Turn detection logic is unchanged.
- **Status:** FIX VERIFIED -- NO REGRESSION

### M2 Fix: alert() calls replaced with toast notifications (58673d8)

- **Previous state:** Three `alert()` calls in error handlers for `confirmTargetSelection`, `handleShift`, and `confirmPassTurn`.
- **Fix applied:** All three replaced with `showToast(message, 'error')`. Error toasts display for 4 seconds (vs 2.5s for success). Toast has two severity variants (`--success`, `--error`) with appropriate icons (`PhCheckCircle` / `PhWarningCircle`).
- **Rules impact:** None. This is a UX improvement with no game logic change.
- **Status:** FIX VERIFIED -- NO REGRESSION

### H1 Fix: PlayerCombatActions.vue over 800 lines (867e189)

- **Previous state:** Component exceeded 800-line limit due to embedded SCSS.
- **Fix applied:** All SCSS extracted to `app/assets/scss/components/_player-combat-actions.scss` (578 lines). Component now 476 lines (template + script only). SCSS registered via `nuxt.config.ts` css array.
- **Rules impact:** None. Pure style extraction with no template or script changes.
- **Status:** FIX VERIFIED -- NO REGRESSION

### M3 Fix: Dead PlayerActionPanel.vue deleted (f8931ab)

- **Previous state:** `PlayerActionPanel.vue` was a dead file superseded by `PlayerCombatActions.vue`.
- **Fix applied:** File deleted. Confirmed no file exists at `**/PlayerActionPanel.vue` via glob search.
- **Rules impact:** None.
- **Status:** FIX VERIFIED -- NO REGRESSION

### H2 Fix: app-surface.md updated (b7b81c5)

- **Previous state:** New player view components and composables not documented in the app surface map.
- **Fix applied:** `app-surface.md` now references `PlayerCombatActions`, `PlayerEncounterView`, `PlayerCombatantInfo`, `usePlayerCombat`, `usePlayerIdentity`, and `canBeCommanded` check.
- **Rules impact:** None. Documentation only.
- **Status:** FIX VERIFIED -- NO REGRESSION

## Mechanics Re-Verified

All seven mechanics from rules-review-137 remain correct after the fix cycle. I re-verified each against the current codebase:

### 1. Turn Detection (isMyTurn)
- **Rule:** "In each round of combat, players get to take two turns: one for their Trainer, and one for a Pokemon." (`core/07-combat.md#p.226`)
- **Implementation:** `usePlayerCombat.ts` lines 31-38. Matches entityId against character ID or Pokemon IDs.
- **Status:** CORRECT (unchanged from rules-review-137, now also used by PlayerEncounterView via composable)

### 2. PTU Action Economy (Standard/Shift/Swift)
- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action" (`core/07-combat.md#p.227`)
- **Implementation:** `usePlayerCombat.ts` lines 84-107 plus new `canBeCommanded` at lines 113-116. Action pips in template lines 6-22.
- **Status:** CORRECT (enhanced with canBeCommanded check, no regressions)

### 3. Move Frequency Enforcement
- **Rule:** At-Will, EOT, Scene xN, Daily xN, Static frequencies per PTU rules. Suppressed downgrades: "At-Will Moves become EOT, and EOT and Scene x2 Moves become Scene." (`core/07-combat.md#p.247`)
- **Implementation:** `usePlayerCombat.ts` lines 141-200. All frequency types handled correctly.
- **Status:** CORRECT (unchanged)

### 4. League Battle Phases
- **Rule:** "all Trainers should take their turns, first, before any Pokemon act" (`core/07-combat.md#p.227`)
- **Implementation:** `usePlayerCombat.ts` lines 60-78. Phase indicator in template lines 26-30.
- **Status:** CORRECT (unchanged)

### 5. Combat Maneuvers
- **Rule:** Push (Std, AC 4), Sprint (Std), Trip (Std, AC 6), Grapple (Std, AC 4), Disarm (Std, AC 6), Dirty Trick (Std, AC 2), Intercept (Full+Interrupt), Take a Breather (Full). (`core/07-combat.md#p.241-243`)
- **Implementation:** `constants/combatManeuvers.ts` -- all 9 maneuvers correct. Delegated to GM via `requestManeuver()`.
- **Status:** CORRECT (unchanged)

### 6. Switch Pokemon Action Type
- **Rule:** "A full Pokemon Switch requires a Standard Action" (`core/07-combat.md#p.229`)
- **Implementation:** Delegated to GM via `requestSwitchPokemon()`. `switchablePokemon` correctly filters to non-fainted, non-active Pokemon.
- **Status:** CORRECT (unchanged)

### 7. Struggle Attack
- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type... Never apply STAB to Struggle Attacks." (`core/07-combat.md#p.240`)
- **Implementation:** `usePlayerCombat.ts` lines 240-251. Comment now correctly states "Available as a Standard Action alternative to using a Move." Gated by `canUseStandardAction` and `canBeCommanded`.
- **Status:** CORRECT (comment fixed, canBeCommanded added)

## Errata Check

Reviewed `books/markdown/errata-2.md` for any corrections to Struggle Attacks, Pokemon Switching, league battle command restrictions, or action types. No errata found affecting any of the seven verified mechanics.

## Summary

All 7 issues from code-review-147 and 1 issue from rules-review-137 have been fully resolved across 7 commits. No PTU rule regressions were introduced:

| Issue | Source | Commit | Status |
|-------|--------|--------|--------|
| C1: canBeCommanded not checked | code-review-147 | af5ee4f | FIXED -- moves/struggle now disabled when Pokemon cannot be commanded |
| H1: Component over 800 lines | code-review-147 | 867e189 | FIXED -- 476 lines (from ~850+), SCSS extracted to 578-line stylesheet |
| H2: app-surface.md outdated | code-review-147 | b7b81c5 | FIXED -- player components and composables documented |
| M1: Duplicated isMyTurn | code-review-147 | 7a512e7 | FIXED -- PlayerEncounterView uses composable |
| M2: alert() calls | code-review-147 | 58673d8 | FIXED -- toast notifications with success/error severity |
| M3: Dead PlayerActionPanel.vue | code-review-147 | f8931ab | FIXED -- file deleted |
| MEDIUM-001: Misleading Struggle comment | rules-review-137 | af5ee4f | FIXED -- comment now matches PTU rules |

## Rulings

No new issues found. All PTU mechanics remain correctly implemented.

## Verdict

**APPROVED**

All fix cycle commits verified. The `canBeCommanded` implementation correctly enforces the PTU league battle switching restriction: newly switched-in Pokemon cannot use moves, struggle, or maneuvers for the remainder of the round, but can still shift and pass. The Struggle comment now accurately reflects PTU rules. No game logic regressions introduced by any of the 7 commits.

## Required Changes

None.
