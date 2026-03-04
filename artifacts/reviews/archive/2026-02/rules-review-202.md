---
review_id: rules-review-202
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - a705745
  - fd169cd
  - b3fbbdd
  - 82cb606
  - 739fbb7
  - 766585e
  - 35ddd2c
  - 9d62911
  - 944e059
  - 0b7a100
  - 722f519
  - 91e14d5
mechanics_verified:
  - evolution-eligibility-check
  - stat-recalculation-on-evolution
  - base-relations-validation
  - hp-formula
  - nature-application
  - seed-trigger-parsing
  - level-up-integration
  - evolution-execution
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/05-pokemon.md#Evolution (p.202)
  - core/05-pokemon.md#Base Relations Rule (p.198)
  - core/05-pokemon.md#Pokemon Hit Points (p.198)
  - core/05-pokemon.md#Natures (p.199)
reviewed_at: 2026-02-28T23:30:00Z
follows_up: null
---

## Mechanics Verified

### R029: Evolution Check on Level Up

- **Rule:** "Next, there is the possibility your Pokemon may learn a Move or Evolve. Check its Pokedex Entry to see if either of these happens." (`core/05-pokemon.md#p.567`)
- **Implementation:** The `getEvolutionLevels()` function in `app/utils/evolutionCheck.ts:97-101` extracts level-only evolution triggers (where `requiredItem === null`) and passes them to `calculateLevelUps()` in `app/utils/experienceCalculation.ts:231`. The `canEvolve` flag is set per-level by checking `evolutionLevels.includes(info.newLevel)`. Both XP endpoints (`add-experience.post.ts:86-102` and `xp-distribute.post.ts:159-189`) fetch `evolutionTriggers` from SpeciesData and feed them correctly.
- **Status:** CORRECT

  The `LevelUpNotification.vue` (at `app/components/encounter/LevelUpNotification.vue:73-82`) now renders evolution entries as clickable buttons that emit `evolve-click`, enabling the GM to start the evolution flow directly from the level-up notification. The `canEvolve` flag accurately reflects level-based evolution eligibility.

  **Design note:** `getEvolutionLevels()` correctly excludes stone/item-based triggers from the level-up notification since those are not triggered by reaching a specific level. The manual "Evolve" button on the Pokemon sheet page covers those cases.

### R031: Stat Recalculation on Evolution

- **Rule:** "Take the new form's Base Stats, apply the Pokemon's Nature again, reapply any Vitamins that were used, and then re-Stat the Pokemon, spreading the Stats as you wish. Again, Pokemon add +X Stat Points to their Base Stats, where X is the Pokemon's Level plus 10." (`core/05-pokemon.md#Evolution, p.592-598`)
- **Implementation:** The `recalculateStats()` function in `app/server/services/evolution.service.ts:121-174` implements this sequence:
  1. Fetches raw base stats from `SpeciesData` for the target species (`targetSpeciesData.baseHp` etc.)
  2. Applies nature via `applyNatureToBaseStats()` from `constants/natures.ts`
  3. Validates stat points total equals `level + 10`
  4. Validates no negative stat points
  5. Validates Base Relations Rule
  6. Calculates final stats: `natureAdjusted[stat] + statPoints[stat]`
  7. Calculates maxHp: `level + (calculatedStats.hp * 3) + 10`
- **Status:** CORRECT

  **Detailed formula verification:**
  - Stat points total: `level + 10` -- matches PTU "+X Stat Points to their Base Stats, where X is the Pokemon's Level plus 10"
  - HP formula: `level + (hpStat * 3) + 10` -- matches PTU "Pokemon Hit Points = Pokemon Level + (HP x3) + 10" (`core/05-pokemon.md#p.118`)
  - Nature application: `applyNatureToBaseStats()` applies +2/-2 (or +1/-1 for HP) with minimum 1 floor, per PTU p.199. Neutral natures (raise === lower) correctly cancel out.
  - The `extractStatPoints()` function correctly reverse-engineers current allocations from existing Pokemon state: `currentStat - baseNatureAdjusted` for non-HP, and `Math.round((maxHp - level - 10) / 3) - baseHp` for HP. The `Math.round()` handles potential floating point issues from the HP formula inversion.

### Base Relations Validation

- **Rule:** "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points." (`core/05-pokemon.md#p.105-114`)
- **Decree:** decree-035 specifies nature-adjusted base stats for ordering.
- **Implementation:** `validateBaseRelations()` in `app/utils/evolutionCheck.ts:128-154` compares all pairs of stat keys. If `natureAdjustedBase[a] > natureAdjustedBase[b]`, then `final[a]` must be `>= final[b]`. Equal base stats are not constrained relative to each other (the check is strict `>`, not `>=`). This matches PTU: "Stats that are equal need not be kept equal" (p.111).
- **Status:** CORRECT -- per decree-035, uses nature-adjusted base stats for ordering.

  The function is shared between server (`evolution.service.ts` imports from `evolutionCheck.ts`) and client (`EvolutionConfirmModal.vue` imports directly). Both call it with the new species' nature-adjusted base stats, which is the correct sequence per decree-035.

### HP Proportional Preservation

- **Rule:** No explicit PTU rule for HP preservation during evolution. Design spec (spec-p0.md section 3.1.4) defines proportional HP.
- **Implementation:** `performEvolution()` at `evolution.service.ts:241-243`:
  ```typescript
  const hpRatio = oldMaxHp > 0 ? oldCurrentHp / oldMaxHp : 1
  const newCurrentHp = Math.max(1, Math.round(hpRatio * recalc.maxHp))
  ```
- **Status:** CORRECT (design-specified, not PTU-mandated)

  The `Math.max(1, ...)` prevents setting HP to 0, which is a sensible default. The proportional approach is a reasonable GM-friendly design choice.

### Nature Application to New Species

- **Rule:** "...apply the Pokemon's Nature again..." (`core/05-pokemon.md#Evolution, p.593`)
- **Implementation:** `recalculateStats()` calls `applyNatureToBaseStats(newSpeciesBaseStats, natureName)` where `newSpeciesBaseStats` are the raw base stats from the target's `SpeciesData`. The nature is preserved from the existing Pokemon (`JSON.parse(pokemon.nature).name`).
- **Status:** CORRECT

  Critical detail: `SpeciesData.baseHp` etc. store RAW species base stats (not nature-adjusted), while `Pokemon.baseHp` stores NATURE-ADJUSTED base stats. The evolution service correctly reads from SpeciesData (raw) for the new species and applies nature to those raw values. The resulting nature-adjusted values are then stored back into `Pokemon.baseHp` etc. via the Prisma update.

### Seed Trigger Parsing

- **Rule:** Evolution triggers must match the pokedex file formats.
- **Implementation:** `app/prisma/seed.ts:247-346` provides two parsing functions:
  - `parseEvoLineSpeciesAndTrigger()`: Separates species name from trigger text using a keyword boundary regex
  - `parseEvolutionTriggerText()`: Parses trigger text into structured EvolutionTrigger with 5 patterns
- **Status:** CORRECT

  **Pattern coverage verified:**
  - Level-only: "Minimum 15" -> `{ minimumLevel: 15, requiredItem: null }` (Charmander -> Charmeleon)
  - Stone-only: "Water Stone" -> `{ minimumLevel: null, requiredItem: "Water Stone" }` (Eevee -> Vaporeon)
  - Stone + Level: "Thunderstone Minimum 20" -> `{ minimumLevel: 20, requiredItem: "Thunderstone" }` (Pikachu -> Raichu)
  - Held item + Level: "Holding Metal Coat Minimum 30" -> `{ minimumLevel: 30, requiredItem: "Metal Coat", itemMustBeHeld: true }` (Scyther -> Scizor)
  - Gender-qualified stone + Level: "Dawn Stone Female Minimum 30" -> `{ minimumLevel: 30, requiredItem: "Dawn Stone" }` (Snorunt -> Froslass)
  - Held item without level: "Holding <Item>" -> `{ minimumLevel: null, requiredItem: Item, itemMustBeHeld: true }`

  **Branching evolution handling:** For Eevee-like species, the parser correctly builds triggers for ALL stage-2 entries from the stage-1 species' perspective (line 466-477). Only `stage === evolutionStage + 1` entries are included, preventing stage-1 from getting stage-3 triggers.

### Evolution Eligibility Check

- **Rule:** "You may choose not to Evolve your Pokemon if you wish." (`core/05-pokemon.md#p.571`) -- Evolution is optional.
- **Implementation:** `checkEvolutionEligibility()` in `app/utils/evolutionCheck.ts:50-81` checks level and held-item requirements. Stone triggers (where `itemMustBeHeld === false`) are listed as available since the GM is the authority on stone inventory -- P0 does not enforce stone inventory tracking.
- **Status:** CORRECT

  The eligibility check correctly handles:
  - Level requirement: `currentLevel >= minimumLevel` (null level = always passes)
  - Held item: case-insensitive comparison for `itemMustBeHeld === true`
  - Stones: listed as available without inventory check (GM authority)
  - Multiple triggers: all triggers are checked, producing separate available/ineligible arrays

### Evolution Execution (DB Write)

- **Implementation:** `performEvolution()` in `evolution.service.ts:184-273` updates:
  - `species`: target species name
  - `type1`, `type2`: from target SpeciesData
  - `baseHp/Attack/Defense/SpAtk/SpDef/Speed`: nature-adjusted new base stats
  - `currentAttack/Defense/SpAtk/SpDef/Speed`: calculated stats (base + points)
  - `maxHp`: from formula
  - `currentHp`: proportionally adjusted
- **Status:** CORRECT

  **Omissions documented for P1:**
  - Abilities (R032): not remapped -- comment at line 265 notes "P1 handles: abilities, moves, capabilities, skills"
  - Moves (R033): not learned from new species learnset
  - Skills/Capabilities (R034): not updated from new species
  - `spriteUrl`: not updated (would need manual update or sprite system integration)

  These are explicitly deferred to P1 per the design spec. The P0 scope is correctly limited to species, types, stats, and HP.

## Summary

The P0 evolution system implementation is PTU-correct for all mechanics within its stated scope. The core formula chain -- raw base stats -> nature application -> stat point redistribution -> calculated stats -> HP formula -- is implemented precisely as specified in PTU Core p.198/202. The Base Relations Rule uses nature-adjusted base stats per decree-035. The seed parser handles all observed pokedex trigger formats.

Key observations:
1. **HP formula is correct:** `level + (hpStat * 3) + 10` matches PTU exactly.
2. **Stat points total is correct:** `level + 10` matches PTU exactly.
3. **Nature reapplication is correct:** Raw species base stats -> nature modifier -> nature-adjusted base. The new species' raw base stats are fetched from SpeciesData, not carried over from the old species.
4. **Base Relations uses nature-adjusted base stats:** Per decree-035, the ordering constraint uses nature-modified values. Equal base stats allow free ordering per PTU p.111.
5. **No negative stat points allowed:** The service validates `statPoints[key] >= 0` for all stats.
6. **GM override available:** `skipBaseRelations` flag allows the GM to override Base Relations for edge cases.
7. **Branching evolutions handled:** First available evolution is auto-selected in P0 (per spec). P1 should add selection UI.

## Rulings

1. **R029 (evolution check on level up):** CORRECT. Level-up integration feeds evolution levels accurately. Stone/item evolutions are correctly excluded from level-up notifications and handled via the manual "Evolve" button.

2. **R031 (stat recalculation):** CORRECT. The formula chain follows PTU p.202 exactly. Nature is reapplied to the new species' raw base stats before stat redistribution.

3. **R032 (ability remapping):** NOT IMPLEMENTED (deferred to P1). This is acceptable per the P0 spec scope.

4. **R033 (immediate move learning):** NOT IMPLEMENTED (deferred to P1). Note: decree-036 (stone evolutions learn new-form moves at or below current level) will need to be respected in P1. The current code does not violate decree-036 since it simply does not implement move learning yet.

5. **R034 (skills/capabilities update):** NOT IMPLEMENTED (deferred to P1). Acceptable per P0 scope.

## Medium Issues

### MEDIUM-001: `extractStatPoints()` rounding may produce off-by-one for HP

**File:** `app/server/services/evolution.service.ts:94`
**Code:** `const hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)`

The HP formula is `maxHp = level + (hpStat * 3) + 10`, so `hpStat = (maxHp - level - 10) / 3`. This should always be an integer if the data was originally set correctly. However, if `maxHp` was manually edited or corrupted, `Math.round()` could produce incorrect stat point extraction. This function is currently used only for informational purposes (the EvolutionConfirmModal initializes stat points with even distribution, not from the old allocation), so the impact is low.

**Severity:** MEDIUM -- not exploitable in P0 since the extracted points are not used as default allocation. Would become HIGH if P1 uses this as the default.

### MEDIUM-002: First-available-evolution auto-selection for branching evolutions

**File:** `app/pages/gm/pokemon/[id].vue:307-309`
**Code:** `const evo = response.data.available[0]`

For species with multiple available evolutions (e.g., Eevee with all stone evolutions available), only the first one is offered. The GM cannot choose which evolution path to take without a selection UI.

**Severity:** MEDIUM -- the GM can work around this by manually tracking which stone they want to use. P1 should add a selection dialog.

## Verdict

**APPROVED**

The P0 evolution system correctly implements the PTU mechanics within its stated scope (R029, R031). The stat recalculation formula chain is precise. The Base Relations Rule respects decree-035. The HP formula is correct. The seed parser covers all observed pokedex trigger formats. The two medium issues are non-blocking and properly scoped for P1 resolution. The deferred R032/R033/R034 mechanics are clearly documented and do not introduce incorrectness -- they are simply not yet implemented.

No critical or high issues found. No decree violations found.

## Required Changes

None. APPROVED for merge.

P1 implementation should address:
- R032: Ability remapping (positional mapping)
- R033: Move learning (respecting decree-036 for stone evolutions)
- R034: Skills/capabilities update
- MEDIUM-002: Branching evolution selection UI
- Sprite URL update on evolution
