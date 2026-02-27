---
review_id: rules-review-157
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-003-track-a-p2
domain: player-view
commits_reviewed:
  - 7dfd5c5
  - d3a1841
  - effcdc6
  - 2177e32
  - 6affd63
  - b9c88a8
  - 99f4138
  - f4a5564
  - 1e8da77
mechanics_verified:
  - move-detail-display
  - action-feedback-toasts
  - auto-scroll-initiative-order
  - combat-action-types
  - evasion-display
  - struggle-attack-properties
  - league-battle-phases
  - move-exhaustion-display
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Standard-Shift-Swift-Actions
  - core/07-combat.md#Struggle-Attacks
  - core/07-combat.md#Accuracy-Check
  - core/07-combat.md#Damage-Base
  - core/07-combat.md#Initiative
  - core/07-combat.md#Combat-Stages-Evasion
reviewed_at: 2026-02-26T12:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Move Detail Overlay — Properties Displayed

- **Rule:** PTU moves have: Name, Type, Damage Class (Physical/Special/Status), Frequency, AC (Accuracy Check), Damage Base, Range, and Effect text. (`core/07-combat.md`, move definition structure)
- **Implementation:** `PlayerCombatActions.vue:278-308` — the move detail overlay (triggered by long-press/right-click) displays: `detailMove.type`, `detailMove.name`, `detailMove.damageBase` (conditionally), `detailMove.ac` (conditionally, null for auto-hit), `detailMove.frequency`, `detailMove.damageClass`, `detailMove.range`, and `detailMove.effect`. These map directly to the `Move` interface (`types/character.ts:47-56`) which models all PTU move properties.
- **Status:** CORRECT — All core PTU move properties are shown. DB and AC are conditionally rendered (hidden for Status/auto-hit moves where they are null), which matches PTU data (Status moves have no DB, auto-hit moves have no AC).

### 2. Move Button Summary Display

- **Rule:** Same as above — DB, AC, Frequency are the key combat-relevant stats for quick move selection.
- **Implementation:** `PlayerCombatActions.vue:99-113` — move buttons display Type badge, Name, DB (conditional), AC (conditional with `ac !== null`), and Frequency. The `isMoveExhausted()` check renders an exhaustion label when frequency limits are reached.
- **Status:** CORRECT — The summary correctly omits DB for Status moves and AC for auto-hit moves, matching PTU data patterns.

### 3. PlayerMoveList (Team View) — Move Properties

- **Rule:** Same move property set.
- **Implementation:** `PlayerMoveList.vue:11-34` — displays Type badge, Name, Damage Class, DB (conditional), AC (conditional), Frequency, and on expand: Range and Effect text.
- **Status:** CORRECT — Complete PTU move property display with no missing fields.

### 4. Action Feedback Toasts — Combat Result Reporting

- **Rule:** PTU combat involves accuracy checks (d20 vs AC threshold) and damage rolls. Results should communicate what move was used and the outcome.
- **Implementation:** `PlayerCombatActions.vue:450-467` — the `confirmTargetSelection` handler resolves the move name from `activeMoves` (or defaults to 'Struggle'), then shows a toast: `"${moveName} used on ${targetCount} target(s)"` on success, or `"${moveName} failed: ${error}"` on failure. The toast uses `showToast()` (line 511) with success/error severity and auto-dismissal (2.5s success, 4s error).
- **Status:** CORRECT — Toasts correctly report the move name and target count. The actual damage/accuracy calculation is delegated to `executeMove()` and `useStruggle()` in the store/composable layer (not modified in P2), so the feedback is a UI-level summary of the action outcome. No PTU formulas are computed in this component.

### 5. Auto-Scroll to Current Combatant on Turn Change

- **Rule:** PTU initiative determines turn order: "combatants take turns acting in order of their Initiative values" (`core/07-combat.md:56-58`). Initiative is typically the Speed stat plus bonuses.
- **Implementation:** `PlayerEncounterView.vue:110-124` — watches `currentCombatant` (from `usePlayerCombat`), which is derived from `encounterStore.currentCombatant` (getter at `stores/encounter.ts:62-66`). The getter reads `turnOrder[currentTurnIndex]` and finds the matching combatant by ID. On change, `nextTick()` queries `[data-combatant-id="${combatant.id}"]` and scrolls it into view with `smooth` behavior and `nearest` block alignment.
- **Combatant ID binding:** `PlayerCombatantInfo.vue:9` binds `:data-combatant-id="combatant.id"` on the root element, which is the exact selector the auto-scroll targets.
- **Status:** CORRECT — The auto-scroll correctly uses the store's turn-order-based `currentCombatant` getter, which respects the server-computed initiative order. The `data-combatant-id` attribute on `PlayerCombatantInfo` matches the selector. The `nextTick()` wait ensures DOM is updated before querying.

### 6. Combat Action Types (Standard, Shift, Swift)

- **Rule:** "each participant may take one Standard Action, one Shift Action, and one Swift Action" per turn (`core/07-combat.md:82-83`). Standard is for Moves and many Features. Shift is primarily for movement. "You may give up a Standard Action to take another Shift Action" (`core/07-combat.md:117-118`).
- **Implementation:** `PlayerCombatActions.vue:6-22` — the turn banner displays three action pips (STD, SHF, SWF) with `--used` styling when each is consumed, tracking via `turnState.standardActionUsed`, `turnState.shiftActionUsed`, `turnState.swiftActionUsed`. Move buttons are disabled when `!canUseStandardAction` (line 90). Shift button is disabled when `!canUseShiftAction` (line 124). Struggle requires Standard Action (line 135).
- **Status:** CORRECT — The three-action-per-turn model matches PTU. The disable logic correctly gates moves and struggle behind Standard Action availability, and shift behind Shift Action availability.

### 7. Struggle Attack

- **Rule:** "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type" (`core/07-combat.md:1072-1073`). "Never apply STAB to Struggle Attacks" (`core/07-combat.md:1076`).
- **Implementation:** Struggle is available as a core action button (`PlayerCombatActions.vue:132-141`) gated behind `canUseStandardAction` and `canBeCommanded`. The execution delegates to `useStruggle()` from `usePlayerCombat`, which handles server-side resolution. The Player View does not compute Struggle AC/DB — it just triggers the action and reports the result.
- **Status:** CORRECT — The Struggle button is correctly gated as a Standard Action. The actual Struggle mechanics (AC 4, DB 4, no STAB) are enforced server-side, not in this UI layer.

### 8. League Battle Phase Awareness

- **Rule:** In League Battles, trainers act in a separate Trainer Phase before Pokemon act in the Pokemon Phase (`core/07-combat.md:25-50`).
- **Implementation:** `PlayerCombatActions.vue:26-30` — when `isLeagueBattle` is true, a phase indicator shows "Trainer Phase" or "Pokemon Phase" based on `isTrainerPhase`. The `canBeCommanded` flag (line 33-36) prevents commanding newly switched-in Pokemon.
- **Status:** CORRECT — Phase detection is driven by `usePlayerCombat` which reads from `encounterStore.currentPhase`.

### 9. Evasion Display (Character Sheet)

- **Rule:** "for every 5 points [in Defense/SpDef/Speed], they gain +1 [Physical/Special/Speed] Evasion, up to +6" (`core/07-combat.md:594-610`). Evasion is derived from calculated stats (not base stats), with combat stages applied as multipliers.
- **Implementation:** `PlayerCharacterSheet.vue:349-363` — computes `physEvasion`, `specEvasion`, `spdEvasion` using `calculateEvasion()` from `utils/damageCalculation.ts`. Passes `character.stats.defense` (calculated stats for HumanCharacter), `character.stageModifiers.defense`, equipment evasion bonus, and stat bonus.
- **Calculation verification:** `calculateEvasion()` at `damageCalculation.ts:102-109` applies combat stage multiplier to the stat, adds flat stat bonus (Focus items), divides by 5, caps at 6, then adds evasion bonus with min 0 floor. This matches the PTU two-part evasion system exactly.
- **Status:** CORRECT — Uses calculated stats (not base stats), applies combat stages via multiplier, derives evasion as `floor(stat/5)` capped at 6, and stacks bonus evasion additively.

### 10. Stat Display (Character Sheet & Pokemon Card)

- **Rule:** PTU stats: HP, Attack, Defense, Special Attack, Special Defense, Speed. Combat stages range from -6 to +6.
- **Implementation:** `PlayerCharacterSheet.vue:330-341` displays all 6 stats with their combat stage modifiers. `PlayerPokemonCard.vue:172-183` does the same for Pokemon using `currentStats` (not `baseStats`), which is correct — display should show current calculated values.
- **Status:** CORRECT — All 6 stats displayed. Stages shown with +/- prefix and color coding. Pokemon uses `currentStats` (calculated), not `baseStats`.

### 11. Haptic Feedback — Event Mapping

- **Rule:** No PTU rule governs haptic feedback, but the events it maps to must be correctly identified.
- **Implementation:** `useHapticFeedback.ts` defines patterns: `vibrateOnTurnStart` (double-pulse), `vibrateOnMoveExecute` (single), `vibrateOnDamageTaken` (triple). `usePlayerWebSocket.ts:129-165` triggers these on: `player_turn_notify` -> `vibrateOnTurnStart`, `move_executed` (own entity) -> `vibrateOnMoveExecute`, `damage_applied` (own entity) -> `vibrateOnDamageTaken`.
- **Status:** CORRECT — Vibration triggers correctly identify player ownership via `playerStore.characterId` and `playerStore.pokemonIds`.

### 12. HP Display Thresholds

- **Rule:** PTU injury markers trigger at 50% HP, 0% HP, -50% HP, and -100% HP. The color-coded HP bar in the Player View uses 50% and 25% thresholds for visual feedback.
- **Implementation:** HP color logic is consistent across all player components: `>50%` = healthy (green), `>25%` = warning (yellow), `<=25%` = critical (red). Found in `PlayerCharacterSheet.vue:322-327`, `PlayerPokemonCard.vue:165-169`, `PlayerCombatantInfo.vue:130-134`.
- **Status:** CORRECT — The 50%/25% visual thresholds are reasonable UI feedback markers. The actual PTU injury system (50%/0%/-50%/-100%) is tracked separately in the injury system, not affected by this display code.

## Summary

This P2 phase focuses on UX polish, accessibility, and visual feedback. No PTU game formulas are computed in the newly added/modified code — the mechanics are either:
1. **Display-only** (move detail overlay shows stored move data properties),
2. **Delegation** (action buttons trigger composable/store methods that handle server-side resolution), or
3. **Pre-existing** (evasion calculation in `damageCalculation.ts` was not modified, only called).

All move properties displayed match the `Move` interface which faithfully models PTU move data (Type, Damage Class, AC, DB, Frequency, Range, Effect). The auto-scroll correctly identifies the current combatant via the initiative-ordered turn list. Combat actions correctly gate behind the Standard/Shift/Swift action economy. Evasion computation uses calculated stats with the correct two-part PTU formula.

## Rulings

1. **Move detail overlay completeness:** The overlay shows Type, Name, DB, AC, Frequency, Damage Class, Range, and Effect. The only PTU move properties not shown are `keywords` (e.g., "Five Strike", "Push") and `critRange`. These are optional fields in the `Move` interface and their absence in the detail overlay is acceptable for a player-facing quick-reference — keywords and crit range are advanced mechanics typically managed by the GM. **No issue raised** — this is a display completeness consideration, not a correctness issue.

2. **Trainer Struggle vs Pokemon Struggle:** PTU differentiates trainer struggle (AC 4, DB 4) from Expert+ struggle (AC 3, DB 5). The Player View's Struggle button does not distinguish these visually, but the actual mechanics are resolved server-side. **No issue raised** — the button correctly delegates to the server.

3. **Status condition display:** Status badges show the condition name but not detailed effects. This is consistent with PTU character sheets where conditions are listed by name, with rules looked up in the reference. **No issue raised.**

## Verdict

**APPROVED** — No PTU rule violations found. All game mechanics displayed are correct. Move properties match PTU data model. Evasion uses calculated stats with the correct formula. Combat actions respect the Standard/Shift/Swift economy. Auto-scroll correctly uses initiative-ordered turn data.

## Required Changes

None.
