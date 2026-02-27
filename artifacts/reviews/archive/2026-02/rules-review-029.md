---
review_id: rules-review-029
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-024, refactoring-026
domain: healing, combat-rolls
commits_reviewed:
  - 5b5fb0c
  - 860abf3
  - 50ee867
  - 8eaa354
  - 0004898
mechanics_verified:
  - rest-healing-30min
  - extended-rest
  - pokemon-center
  - natural-injury-healing
  - drain-ap-injury-healing
  - new-day-reset
  - attack-roll-accuracy
  - damage-roll-calculation
  - critical-hit-damage
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Resting
  - core/07-combat.md#Persistent-Afflictions
  - core/07-combat.md#Volatile-Afflictions
  - core/07-combat.md#Accuracy-Roll
  - core/07-combat.md#Dealing-Damage
  - core/07-combat.md#Critical-Hits
  - core/07-combat.md#Pokemon-Centers
reviewed_at: 2026-02-18T18:00:00
---

## Review Scope

PTU correctness review of refactoring-024 (extract `usePokemonSheetRolls` composable and `HealingTab` component from `pokemon/[id].vue`) and refactoring-026 (consolidate duplicated healing UI/logic from both `pokemon/[id].vue` and `characters/[id].vue` into shared `HealingTab.vue`).

Five commits reviewed. Two new files created:
- `app/composables/usePokemonSheetRolls.ts` (137 lines) — dice rolling extracted from pokemon sheet
- `app/components/common/HealingTab.vue` (314 lines) — shared healing UI extracted from both sheets

This is a pure refactoring — code was moved, not modified. Review focuses on (1) behavioral equivalence between original and extracted code, and (2) PTU correctness of the mechanics in the extracted code (per Lesson 2: always check touched code, even if pre-existing).

## Mechanics Verified

### 1. Rest Healing (30 min)
- **Rule:** "For the first 8 hours of rest each day, Pokémon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points. [...] a Trainer or Pokémon is unable to restore Hit Points through rest if the individual has 5 or more injuries." (`core/07-combat.md#Resting`, p.252)
- **Implementation:** `HealingTab.vue` delegates to `useRestHealing.rest()`. Button disabled when `!healingInfo.canRestHeal || currentHp >= maxHp`. `restHealing.ts` computes `canRestHeal = injuries < 5 && restMinutesToday < 480` and `hpPerRest = Math.max(1, Math.floor(maxHp / 16))`. Rest cap is 480 min = 8 hours.
- **Status:** CORRECT
- **Behavioral equivalence:** Identical to original inlined handlers in both pages. Original had null-guard `if (!pokemon.value) return`; new component receives entity as a required prop (parent guards rendering). Equivalent. Original called `loadPokemon()` directly; new emits `'healed'` event, parent calls `loadPokemon` via `@healed`. Equivalent.

### 2. Extended Rest (4+ hours)
- **Rule:** "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP. Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day." (`core/07-combat.md#Resting`, p.252). Persistent Afflictions are: Burned, Frozen, Paralyzed, Poisoned/Badly Poisoned (`core/07-combat.md#Persistent-Afflictions`, p.246).
- **Implementation:** `HealingTab.vue` delegates to `useRestHealing.extendedRest()`. Character description: "Heal HP for 4 hours, clear persistent status conditions, restore drained AP." Pokemon description: "Heal HP for 4 hours, clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Asleep), restore daily moves."
- **Status:** CORRECT (delegation), with **pre-existing MEDIUM textual issue** (see below)
- **Pre-existing issue — Asleep mislabeled as persistent in UI text:** The Pokemon extended rest description parenthetical lists "Asleep" alongside the four true persistent conditions. Per PTU p.247, Sleep (Bad Sleep/Good Sleep) is a Volatile Affliction, not Persistent. This was corrected in the data model by refactoring-008 (commit `63fe747` moved Asleep to `VOLATILE_CONDITIONS`), but the UI description text was never updated. The original `pokemon/[id].vue` had the identical text — the refactoring faithfully preserved it. This does not affect game logic (the server endpoint determines what actually gets cleared), but presents inaccurate PTU taxonomy to the user. **Ticket recommended.**

### 3. Pokemon Center
- **Rule:** "Pokémon Centers [...] heal a Trainers and Pokémon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves. [...] For each Injury on the Trainer or Pokémon, Healing takes an additional 30 minutes. If the Trainer or Pokémon has five or more Injuries, it takes one additional hour per Injury instead. Pokémon Centers can remove a maximum of 3 Injuries per day." (`core/07-combat.md#Pokemon-Centers`, p.252)
- **Implementation:** Pokemon description: "Full HP, all status cleared, daily moves restored. Heals up to 3 injuries/day. Time: 1 hour + 30min per injury." Character description adds "AP restored."
- **Status:** CORRECT
- **Note:** The timing description simplifies the 5+ injury tier (1 hour per injury instead of 30 min). This is a pre-existing UI text simplification — actual timing logic is server-side. LOW severity, not worth a standalone ticket.

### 4. Natural Injury Healing
- **Rule:** "they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries." and "Pokémon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total." (`core/07-combat.md#Resting`, p.252)
- **Implementation:** Button disabled when `!healingInfo.canHealInjuryNaturally || healingInfo.injuriesRemainingToday <= 0`. Description: "Heal 1 injury after 24 hours without gaining new injuries. Max 3 injuries healed per day from all sources."
- **Status:** CORRECT

### 5. Drain AP Injury Healing (Character-only)
- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP. This is subject to the limitations on healing Injuries each day." (`core/07-combat.md#Resting`, p.252)
- **Implementation:** Conditionally rendered via `v-if="entityType === 'character' && injuries > 0"`. Calls `healInjury(entityType, entityId, 'drain_ap')`. Description: "Drain 2 AP to heal 1 injury as an Extended Action. Subject to daily injury limit."
- **Status:** CORRECT
- **Behavioral equivalence:** Original `characters/[id].vue` showed this button with `v-if="character.injuries > 0"`; original `pokemon/[id].vue` never had this button. New component correctly gates on both `entityType === 'character'` and `injuries > 0`. Equivalent.

### 6. New Day Reset
- **Rule:** Implied by daily limits — "first 8 hours of rest each day" and "3 Injuries per day" (`core/07-combat.md#Resting`, p.252)
- **Implementation:** Pokemon description: "Reset daily healing limits: rest time, injuries healed counter." Character description adds "drained AP."
- **Status:** CORRECT

### 7. Attack Roll (Accuracy)
- **Rule:** "make an Accuracy Roll, and to hit, this roll must meet or exceed the Accuracy Check. An Accuracy Roll is always simply 1d20" (`core/07-combat.md#Accuracy-Roll`, p.236). "On an Accuracy Roll of 20, a damaging attack is a Critical Hit." (`core/07-combat.md#Critical-Hits`, p.236)
- **Implementation:** `usePokemonSheetRolls.rollAttack()` rolls `1d20`. Natural 20 → crit. Natural 1 → miss. Otherwise compares `result.total >= move.ac` for hit/miss.
- **Status:** CORRECT
- **Behavioral equivalence:** Character-for-character identical to original inline code in `pokemon/[id].vue`.
- **Note:** Natural 1 auto-miss is not explicitly codified in PTU 1.05 core rules (the rulebook only specifies nat 20 crit). This is a widely-used PTU house rule. Pre-existing design choice, not introduced by this refactoring. Not worth a ticket — this is a deliberate GM tool behavior.
- **Note:** Sheet-level rolls compare against `move.ac` (base AC) only, without target Evasion. This is appropriate for a sheet view quick-roll feature (no target context available). The full encounter combat system handles Evasion separately.

### 8. Damage Roll Calculation
- **Rule:** "check the attack's Damage Base [...] see the corresponding Actual Damage in the Damage Charts [...] to which you add your Attack or Special Attack Stat." (`core/07-combat.md#Dealing-Damage`, p.236). Physical uses Attack stat; Special uses Special Attack stat.
- **Implementation:** `usePokemonSheetRolls.rollDamage()` calls `getDamageRoll(move.damageBase)` for dice notation, adds `getAttackStat(move)` which returns `currentStats.attack` for Physical or `currentStats.specialAttack` for Special.
- **Status:** CORRECT
- **Behavioral equivalence:** Character-for-character identical to original inline code.

### 9. Critical Hit Damage
- **Rule:** "A Critical Hit adds the Damage Dice Roll a second time to the total damage dealt, but does not add Stats a second time; for example, a DB6 Move Crit would be 4d6+16+Stat" (`core/07-combat.md#Critical-Hits`, p.236)
- **Implementation:** `isCrit ? rollCritical(notation) : roll(notation)`. Attack stat is added once to the result (`diceResult.total + stat`). `rollCritical` doubles the dice portion; stat is added once after.
- **Status:** CORRECT
- **Behavioral equivalence:** Identical to original.

## Summary
- Mechanics checked: 9
- Correct: 9
- Incorrect: 0
- Needs review: 0

Pre-existing issues found in touched code: 1 (MEDIUM — Asleep mislabeled as persistent in extended rest UI description text)

## Rulings

No ambiguous rules to resolve. All mechanics in the extracted code are behavior-preserving and PTU-correct.

## Verdict

**APPROVED** — The refactoring is purely structural (code extraction to shared component and composable). All 9 verified mechanics are behaviorally identical to the original inlined code and PTU-correct. No new PTU incorrectness introduced. One pre-existing MEDIUM textual issue noted (Asleep listed as persistent in extended rest description — downstream artifact of resolved refactoring-008).

## Required Changes

None. The pre-existing "Asleep as persistent" text issue should be tracked as a separate ticket (not a blocker for this refactoring).

## Pre-Existing Issues

### MEDIUM: Extended rest description lists Asleep as persistent condition
- **Location:** `app/components/common/HealingTab.vue:168` — `"clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Asleep)"`
- **Rule:** PTU p.247 (`core/07-combat.md#Volatile-Afflictions`) enumerates Sleep under Volatile Afflictions, not Persistent. Persistent conditions per p.246 are: Burned, Frozen, Paralyzed, Poisoned/Badly Poisoned.
- **Origin:** Pre-existing in original `pokemon/[id].vue`, faithfully copied during extraction. Data model was corrected by refactoring-008 (commit `63fe747`), but this UI text was not updated.
- **Impact:** Informational text only — does not affect game logic (server endpoints determine actual healing behavior). Presents incorrect PTU taxonomy to users.
- **Recommended fix:** Remove "Asleep" from the parenthetical or restructure to: "clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned)." Sleep clears naturally during a 4-hour rest via save checks, so no functional change needed — just the label.
