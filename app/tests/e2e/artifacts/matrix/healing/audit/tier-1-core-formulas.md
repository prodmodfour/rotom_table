## Tier 1: Core Formulas

### healing-R001: Tick of Hit Points Definition

- **Rule:** "A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points."
- **Expected behavior:** 1 tick = floor(maxHp / 10). Used as the building block for injury HP reduction.
- **Actual behavior:** `getEffectiveMaxHp()` at `utils/restHealing.ts:20-24` computes `Math.floor(maxHp * (10 - injuries) / 10)`. Each injury reduces max HP by exactly 1/10th. The tick value itself is not stored as a named constant, but the `maxHp / 10` fraction is the implicit unit in the `(10 - injuries) / 10` calculation.
- **Classification:** Correct

### healing-R003: Injury Definition -- HP Reduction per Injury

- **Rule:** "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th. For example, a Pokemon with 3 injuries and 50 Max Hit Points could only heal up to 35 Hit Points, or 7/10ths of their maximum."
- **Expected behavior:** Effective max HP = floor(maxHp * (10 - injuries) / 10).
- **Actual behavior:** `getEffectiveMaxHp()` at `utils/restHealing.ts:20-24`: `Math.floor(maxHp * (10 - effectiveInjuries) / 10)` where `effectiveInjuries = Math.min(injuries, 10)`. Cap at 10 injuries prevents negative effective HP. This function is used as a healing cap in `calculateRestHealing()` (line 57: `const effectiveMax = getEffectiveMaxHp(maxHp, injuries)`) and in `applyHealingToEntity()` (`combatant.service.ts:213`: `getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)`), and in the Pokemon Center endpoint (`pokemon-center.post.ts:59`: `getEffectiveMaxHp(pokemon.maxHp, newInjuries)`).
- **Classification:** Correct
- **Notes:** The PTU example (50 maxHp, 3 injuries = 35) matches exactly. The injury-reduced cap is correctly applied as a healing ceiling in all healing paths.

### healing-R007: Natural Healing Rate (Rest HP Recovery)

- **Rule:** "Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."
- **Expected behavior:** Heal amount = floor(maxHp / 16), using real maxHp per R017.
- **Actual behavior:** `calculateRestHealing()` at `utils/restHealing.ts:64-65`: `const healAmount = Math.max(1, Math.floor(maxHp / 16))`. The `Math.max(1, ...)` enforces a minimum of 1 HP healed per rest period.
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Notes:** The `Math.max(1, ...)` minimum guarantee is not in the PTU rules. PTU says "heal 1/16th of their Maximum Hit Points" with the general rounding rule being floor. For maxHp = 10, PTU yields floor(10/16) = 0 but the code yields 1. For maxHp = 15, PTU yields floor(15/16) = 0 but code yields 1. This affects very low maxHp entities (below 16). While arguably a QoL improvement (healing 0 per 30-min rest feels bad), it contradicts the strict rule.

### healing-R027: Pokemon Center -- Injury Time (Under 5)

- **Rule:** "For each Injury on the Trainer or Pokemon, Healing takes an additional 30 minutes."
- **Expected behavior:** Total time = 1 hour base + (injuries * 30 minutes) when injuries < 5.
- **Actual behavior:** `calculatePokemonCenterTime()` at `utils/restHealing.ts:84-115`: `baseTime = 60`, `injuryTime = injuries * 30` when `injuries < 5`. `totalTime = 60 + injuries * 30`.
- **Classification:** Correct

### healing-R028: Pokemon Center -- Injury Time (5+ Injuries)

- **Rule:** "If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead."
- **Expected behavior:** Total time = 1 hour base + (injuries * 60 minutes) when injuries >= 5.
- **Actual behavior:** `calculatePokemonCenterTime()` at `utils/restHealing.ts:93-95`: when `injuries >= 5`, `injuryTime = injuries * 60`. `totalTime = 60 + injuries * 60`.
- **Classification:** Correct

### healing-R033: Extended Rest -- Restores Drained AP

- **Rule:** "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."
- **Expected behavior:** After extended rest, drainedAp = 0, currentAp restored.
- **Actual behavior:** `server/api/characters/[id]/extended-rest.post.ts:87-89`: sets `drainedAp: 0`, `boundAp: 0`, `currentAp: maxAp` where `maxAp = calculateMaxAp(character.level)`. `calculateMaxAp()` at `utils/restHealing.ts:219-221`: `5 + Math.floor(level / 5)`.
- **Classification:** Correct
- **Notes:** Also clears boundAp. This is a reasonable interpretation: extended rest implies scene transition, and bound AP "remains off-limits until the effect that Bound them ends." Clearing on extended rest is generous but not contradicted by rules.

---
