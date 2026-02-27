---
review_id: rules-review-134
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-003
domain: player-view
commits_reviewed:
  - 2340554
  - 818f479
  - b8bc03c
  - 41c25f8
  - 37f80d5
  - 430f96a
  - dc1f21e
  - 698e479
  - c04921c
mechanics_verified:
  - evasion-calculation
  - equipment-evasion-bonus
  - websocket-character-update
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - 07-combat.md#Page 234 (Evasion rules, lines 587-657)
  - 09-gear-and-items.md#Page 294 (Shield evasion bonuses, lines 1767-1778)
  - errata-2.md#Page 4 (Shield/Armor errata)
reviewed_at: 2026-02-23T11:15:00Z
follows_up: rules-review-129
---

## Mechanics Verified

### 1. Equipment Evasion Bonus Calculation (H2 Fix)

- **Rule:** "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense." (`07-combat.md#Page 234`, lines 598-600). "Besides these base values for evasion, Moves and effects can raise or lower Evasion. These extra Changes in Evasion apply to all types of Evasion, and stack on top." (`07-combat.md#Page 234`, lines 648-651). Shield evasion bonus: "Light Shields grant +2 Evasion" (`09-gear-and-items.md#Page 294`, line 1768-1769). Errata supersedes: "Light Shields (now just Shields) grant a +1 Evasion bonus" (`errata-2.md#Page 4`, lines 185-186).

- **Implementation (Player Sheet):** `PlayerCharacterSheet.vue` (lines 249-268) now computes equipment bonuses via `computeEquipmentBonuses()` and passes three parameters to `calculateEvasion()`:
  1. `evasionBonus` (from shields/armor) -- added as Part 2 additive bonus on top of stat-derived evasion
  2. `statBonuses.defense` / `statBonuses.specialDefense` / `statBonuses.speed` (from Focus items) -- added to the stat before dividing by 5

  The `calculateEvasion()` function (`damageCalculation.ts`, line 102-109):
  ```typescript
  export function calculateEvasion(baseStat, combatStage = 0, evasionBonus = 0, statBonus = 0): number {
    const statEvasion = Math.min(6, Math.floor((applyStageModifier(baseStat, combatStage) + statBonus) / 5))
    return Math.max(0, statEvasion + evasionBonus)
  }
  ```
  This correctly implements the two-part PTU evasion system:
  - Part 1: `floor((stageModifiedStat + focusBonus) / 5)` capped at 6 -- stat-derived evasion
  - Part 2: `+ evasionBonus` from equipment/effects, stacked additively
  - Total floored at 0 (negative evasion erases but does not go negative per PTU p.234 lines 654-655)

- **Parity with GM View:** Verified against three comparison points:

  **a) `useMoveCalculation.ts` (lines 191-233):** The `getTargetEvasion()` function computes equipment bonuses for human targets identically: `computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})`, extracts `evasionBonus` and per-stat `focusDefBonus`/`focusSpDefBonus`/`focusSpeedBonus`, and passes them to `calculatePhysicalEvasion()`/`calculateSpecialEvasion()`/`calculateSpeedEvasion()`. These are thin wrappers in `useCombat.ts` (lines 50-60) that call the same `calculateEvasion()`. **Match confirmed.**

  **b) `combatant.service.ts` (lines 562-629):** The `buildCombatantFromEntity()` function computes equipment bonuses for humans: `computeEquipmentBonuses((entity as HumanCharacter).equipment ?? {})`, then applies them as:
  ```typescript
  physicalEvasion: initialEvasion((stats.defense || 0) + (equipmentStatBonuses.defense ?? 0)) + equipmentEvasionBonus,
  specialEvasion: initialEvasion((stats.specialDefense || 0) + (equipmentStatBonuses.specialDefense ?? 0)) + equipmentEvasionBonus,
  speedEvasion: initialEvasion((stats.speed || 0) + focusSpeedBonus) + equipmentEvasionBonus,
  ```
  Where `initialEvasion(stat) = Math.min(6, Math.floor(stat / 5))`. This is the **initial** evasion at encounter start (combat stage = 0), which is equivalent to `calculateEvasion(stat, 0, evasionBonus, statBonus)`. **Match confirmed.**

  **c) Player Sheet:** `calculateEvasion(props.character.stats.defense, props.character.stageModifiers.defense ?? 0, evasionBonus, defBonus)`. Uses calculated stats (`props.character.stats.defense` is the character's current stat) and passes combat stages. **Match confirmed.**

- **Status:** CORRECT

### 2. WebSocket `character_update` Entity Match Logic (C1 Fix)

- **Rule:** Not a PTU mechanic -- this is a data synchronization concern. However, the correctness of what triggers a refresh has game-logic implications: if a player's Pokemon takes damage (HP change) via the GM view, the player view must update to reflect the new HP. The `character_update` event carries `data: Pokemon | HumanCharacter` (typed in `api.ts`, line 40), and both `Pokemon` and `HumanCharacter` have an `id: string` field.

- **Implementation:** `pages/player/index.vue` (lines 210-217):
  ```typescript
  removeWsListener = onMessage((message) => {
    if (message.type === 'character_update' && playerStore.characterId) {
      const data = message.data as { id?: string }
      const entityId = data?.id
      if (entityId === playerStore.characterId || playerStore.pokemonIds.includes(entityId ?? '')) {
        refreshCharacterData()
      }
    }
  })
  ```

  The listener:
  1. Filters for `character_update` events only
  2. Guards on `playerStore.characterId` being set (player must be identified)
  3. Extracts `id` from the event data (safe -- both `Pokemon.id` and `HumanCharacter.id` are strings)
  4. Matches against the player's character ID OR any of their Pokemon IDs
  5. Calls `refreshCharacterData()` which re-fetches from `/api/characters/{id}/player-view`

  The match logic is correct: a `character_update` for the player's own character triggers a refresh (covers stat changes, HP, equipment, etc.), and a `character_update` for any of the player's Pokemon also triggers a refresh (covers damage, healing, status conditions applied to their Pokemon by the GM). The `playerStore.pokemonIds` getter (line 34-35 of `playerIdentity.ts`) returns `state.pokemon.map(p => p.id)`, which is the list of Pokemon IDs loaded when the character was fetched.

  The `entityId ?? ''` fallback ensures that if `data.id` is undefined (which should not happen given the type, but is a defensive guard), the `includes()` check safely returns false rather than matching.

  The cleanup in `onUnmounted` (lines 247-250) properly removes the listener to prevent memory leaks.

- **Status:** CORRECT

### 3. Non-Mechanic Commits Verification

The remaining 7 commits do not affect PTU game mechanics:

- **2340554** (`refactor: move PlayerTab type to types/player.ts`): Type relocation only. No game logic.
- **818f479** (`refactor: extract duplicated SCSS to shared _player-view.scss`): Styling extraction. No game logic.
- **b8bc03c** (`refactor: extract bottom nav clearance to $player-nav-clearance variable`): SCSS variable extraction. No game logic.
- **430f96a** (`fix: add exponential backoff to encounter polling on failure`): Network retry logic. No game logic.
- **dc1f21e** (`fix: add aria-label to Switch Character icon button`): Accessibility attribute. No game logic.
- **698e479** (`fix: replace alert() with inline error for character selection failures`): UI error display. No game logic.
- **c04921c** (`docs: update feature-003 resolution log with code-review-139 fix cycle`): Documentation only.

- **Status:** NO GAME LOGIC IMPACT (verified by diff inspection)

## Summary

The fix cycle for feature-003 P0 Track A correctly addresses the two game-logic-relevant issues from code-review-139:

1. **H2 (Equipment evasion bonus):** The `PlayerCharacterSheet` now uses `computeEquipmentBonuses()` to extract shield/armor evasion bonuses and Focus stat bonuses, passing them to `calculateEvasion()` as the 3rd and 4th parameters. This produces identical evasion values to the GM view (`useMoveCalculation.ts`) and the server-side combatant builder (`combatant.service.ts`). The underlying `calculateEvasion()` function correctly implements the PTU two-part evasion system: stat-derived evasion (with combat stage multiplier, capped at +6) plus additive bonus evasion from effects/equipment (floored at 0).

2. **C1 (WebSocket character_update listener):** The player view now listens for `character_update` WebSocket events and refreshes when the updated entity is the player's character or one of their Pokemon. The entity match logic is correct and covers all relevant scenarios (GM modifying player stats, GM damaging player's Pokemon, etc.).

The remaining 7 commits are SCSS refactoring, accessibility, polling robustness, type organization, and documentation -- none affect PTU game mechanics.

## Rulings

**R1:** The evasion calculation in `PlayerCharacterSheet.vue` is PTU-correct. The `calculateEvasion(baseStat, combatStage, evasionBonus, statBonus)` function matches the rulebook's two-part evasion system (07-combat.md lines 598-655) and achieves parity with both the GM view composable and the server-side combatant builder.

**R2:** The equipment bonus model is data-driven -- the `EquippedItem.evasionBonus` field stores the bonus value, and `computeEquipmentBonuses()` sums all equipped items. Whether the stored bonus is +1 (errata) or +2 (base rules) depends on the data entered by the GM when equipping the shield. The code correctly aggregates whatever value is stored. This is the correct approach for a system that supports both base rules and errata.

**R3:** The WebSocket `character_update` listener correctly identifies relevant updates by matching the event's entity `id` against the player's character ID and all their Pokemon IDs. This is not a PTU mechanic but ensures game state (HP, stats, conditions) is accurately reflected on the player's screen.

## Verdict

**APPROVED** -- No PTU rule violations found. The equipment evasion bonus fix achieves correct parity with the GM view. The WebSocket listener correctly handles entity matching for real-time sync.

## Required Changes

None.
