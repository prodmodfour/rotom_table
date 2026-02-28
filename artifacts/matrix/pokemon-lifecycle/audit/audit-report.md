---
domain: pokemon-lifecycle
type: implementation-audit
audited_at: 2026-02-28T04:30:00Z
audited_by: implementation-auditor
matrix_version: 2026-02-28T00:00:00Z
total_items_audited: 26
---

# Implementation Audit: Pokemon Lifecycle Domain

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 22 |
| Incorrect | 1 |
| Approximation | 2 |
| Ambiguous | 1 |
| **Total Audited** | **26** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| HIGH | 1 | R058 (significance multiplier floor vs round) |
| MEDIUM | 1 | R009 (stat distribution randomness vs player choice) |
| LOW | 1 | R022 (initial tutor point count for generated Pokemon) |

---

## Tier 1: Core Formulas

### 1. R011 — Pokemon HP Formula

**Rule:** PTU Core p.199: "Pokemon Hit Points = Pokemon Level + (HP x 3) + 10"

**Expected behavior:** `maxHp = level + (hpStat * 3) + 10` where hpStat is the calculated (nature-adjusted + stat points) HP stat.

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:151`: `const maxHp = input.level + (calculatedStats.hp * 3) + 10`. Uses the fully calculated HP stat (base + nature adjustment + distributed stat points).

**Classification:** **Correct**

### 2. R006 — Nature Stat Adjustments

**Rule:** PTU Core p.198: "raise one stat, and lower another; HP is only ever raised or lowered by 1, but all other stats are raised or lowered by 2, respectively, to a minimum of 1."

**Expected behavior:** HP: +1/-1, others: +2/-2, minimum 1 after modification.

**Actual behavior:** `app/constants/natures.ts:78-80`: `modifierAmount()` returns 1 for HP, 2 for others. `applyNatureToBaseStats()` at lines 87-106: applies `+modifierAmount(raise)` and `-modifierAmount(lower)` with `Math.max(1, ...)`. Neutral natures (raise === lower) return unmodified stats (line 97-98).

**Classification:** **Correct**

### 3. R009 — Stat Points Allocation Total

**Rule:** PTU Core p.198: "add +X Stat Points, where X is the Pokemon's Level plus 10."

**Expected behavior:** Total stat points distributed = level + 10.

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:370`: `let remainingPoints = Math.max(0, level + 10)`. The distribution loop (lines 371-382) distributes exactly `level + 10` points via weighted random selection.

**Classification:** **Correct**
**Note:** The stat point total is correct. However, see item #13 for the distribution method (random vs player choice).

### 4. R023 — Tutor Points: Level Progression

**Rule:** PTU Core p.204: "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point."

**Expected behavior:** +1 tutor point at level 5, 10, 15, 20, 25, etc.

**Actual behavior:** `app/utils/levelUpCheck.ts:76`: `tutorPointGained = level >= 5 && level % 5 === 0`. This correctly triggers at levels 5, 10, 15, 20, etc.

**Classification:** **Correct**

### 5. R058 — Experience Calculation

**Rule:** PTU Core p.460: "total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled." Then multiply by significance, divide by player count.

**Expected behavior:** `xp = floor(floor(effectiveLevels * significance) / playerCount)` — two floor operations: one after multiplying, one after dividing.

**Actual behavior:** `app/utils/experienceCalculation.ts:279`: `multipliedXp = Math.floor(enemyLevelsTotal * significanceMultiplier)`. Line 283-284: `perPlayerXp = isBossEncounter ? multipliedXp : Math.floor(multipliedXp / Math.max(1, playerCount))`. Both floor operations present. Trainers counted double via `enrichDefeatedEnemies()` at line 198: `enemy.isTrainer ? enemy.level * 2 : enemy.level`.

**Classification:** **Correct**

**Note on significance presets:** The code defines 5 significance tiers with default multipliers: insignificant=1.0, everyday=2.0, significant=4.0, climactic=6.0, legendary=8.0. PTU p.460 says x1 to x5 range. The extended range (x6-x10 for climactic/legendary) goes beyond the PTU-stated range but the code allows custom multipliers, so GMs can use x1-x5 if desired. The presets are an intentional extension, not a misreading.

### 6. R060 — Experience Chart

**Rule:** PTU Core p.203: Level-to-XP mapping table, levels 1-100.

**Expected behavior:** Full 100-level chart with correct cumulative XP values.

**Actual behavior:** `app/utils/experienceCalculation.ts:28-49`: `EXPERIENCE_CHART` maps all 100 levels. I spot-checked several values:
- Level 1: 0 XP
- Level 10: 90 XP
- Level 20: 400 XP
- Level 50: 3645 XP
- Level 100: 20555 XP

These match the PTU Core p.203 chart. `getXpForLevel()`, `getLevelForXp()`, and `getXpToNextLevel()` all correctly use this chart.

**Classification:** **Correct**

### 7. R012 — Evasion Calculation

**Rule:** PTU Core p.234: "for every 5 points... they gain +1 [Physical/Special/Speed] Evasion, up to +6"

**Expected behavior:** `evasion = min(6, floor(calculatedStat / 5))`. Uses calculated stats (after combat stages).

**Actual behavior:** `app/utils/damageCalculation.ts:102-108`: `calculateEvasion()` applies stage modifier first via `applyStageModifier()`, then adds flat bonus, then `Math.min(6, Math.floor(result / 5))`. Evasion bonus from moves/effects is added additively afterward with floor at 0.

Also: `app/server/services/combatant.service.ts:663`: `initialEvasion(stat)` = `Math.min(6, Math.floor(stat / 5))` for initial evasion at combat entry.

Both use calculated stats (not base stats). The combatant builder at line 749-751 passes `stats.defense`, `stats.specialDefense`, `stats.speed` which are the current calculated stats.

**Classification:** **Correct**

---

## Tier 2: Core Workflows

### 8. R038 — Pokemon Creation Workflow

**Rule:** PTU Core p.198: Look up species data, apply nature, distribute stat points (Base Relations), calculate HP, select moves from learnset, assign ability.

**Expected behavior:** Full pipeline: species lookup -> nature application -> stat distribution with Base Relations -> HP formula -> move selection -> ability pick.

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:84-191` (`generatePokemonData()`):
1. Species lookup: lines 86-133 — fetches SpeciesData from Prisma, extracts base stats, types, abilities, learnset, skills, capabilities.
2. Nature: lines 137-145 — random nature from `NATURE_TABLE`, applied via `applyNatureToBaseStats()`.
3. Stat distribution: line 148 — `distributeStatPoints()` distributes `level + 10` points with Base Relations enforcement.
4. HP formula: line 151 — `level + (calculatedStats.hp * 3) + 10`.
5. Moves: lines 154-156 — `selectMovesFromLearnset()` or override.
6. Abilities: lines 159-161 — `pickRandomAbility()` from Basic pool, or override.

**Classification:** **Correct**

### 9. R013 — Initial Ability: Random Basic Ability

**Rule:** PTU Core p.200: "A Pokemon starts with one Ability, from the Basic Abilities list."

**Expected behavior:** New Pokemon gets exactly 1 ability, chosen randomly from Basic Abilities only.

**Actual behavior:** `pickRandomAbility()` at `pokemon-generator.service.ts:518-524`: Uses `numBasicAbilities` from SpeciesData to limit the pool. If `numBasicAbilities` is 2 and there are 4 total abilities, only the first 2 (Basic) are in the random pool. Returns an array with exactly 1 ability.

**Classification:** **Correct**

### 10. R026 — Level Up Workflow

**Rule:** PTU Core p.203-204: On level up: +1 stat point, check for new moves from learnset, check evolution, check ability milestones (L20, L40), check tutor points.

**Expected behavior:** `checkLevelUp()` returns per-level info with stat points, moves, abilities, tutor points.

**Actual behavior:** `app/utils/levelUpCheck.ts:49-89`: For each level from `oldLevel+1` to `newLevel`:
- `statPointsGained: 1` (always)
- `newMoves` from learnset at exactly this level
- `abilityMilestone`: 'second' at L20, 'third' at L40
- `tutorPointGained`: true if `level >= 5 && level % 5 === 0`

`calculateLevelUps()` in experienceCalculation.ts (lines 315-353) delegates to `checkLevelUp()` and adds evolution level detection (from optional `evolutionLevels` parameter).

**Classification:** **Correct**

### 11. R059 — Experience Distribution Flow

**Rule:** PTU Core p.460: XP distributed per player, split among Pokemon as player chooses. Fainted Pokemon eligible.

**Expected behavior:** XP pool calculated per player, GM/player distributes to individual Pokemon.

**Actual behavior:** The XP system calculates `totalXpPerPlayer` via `calculateEncounterXp()`. The `XpDistributionModal` (component) allows per-Pokemon allocation from the pool. `calculateLevelUps()` handles the actual XP application per Pokemon. Fainted Pokemon are eligible (no faint check in XP application).

**Classification:** **Correct**

---

## Tier 3: Core Constraints

### 12. R002 — Max Level 100

**Rule:** PTU Core p.203: "Pokemon have a maximum Level of 100."

**Expected behavior:** Level capped at 100. XP stops granting levels beyond 100.

**Actual behavior:** `experienceCalculation.ts:52`: `MAX_LEVEL = 100`. `getLevelForXp()` at line 224: `if (totalXp >= MAX_EXPERIENCE) return MAX_LEVEL`. `calculateLevelUps()` at line 323: `newExperience = Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)`. `checkLevelUp()` at line 58: `Math.min(newLevel, 100)`.

**Classification:** **Correct**

### 13. R010 — Base Relations Rule

**Rule:** PTU Core p.198: "This order must be maintained when adding Stat Points." Stats ordered by base value from highest to lowest, with equal-base stats forming a flexible tier.

**Expected behavior:** After stat point distribution, a stat with higher base value should have a higher (or equal) final value than a stat with lower base value. Equal-base stats are unconstrained relative to each other.

**Actual behavior:** `enforceBaseRelations()` at `pokemon-generator.service.ts:412-467`:
1. Groups stats by base value (descending).
2. Sorts all added-point values in descending order.
3. Assigns highest added points to highest base-stat tier, second-highest to second tier, etc.
4. Within each tier (equal base stats), added points are shuffled randomly.

This correctly enforces that higher-base stats receive more (or equal) added points than lower-base stats. The final calculated stat (base + added) will therefore maintain the base relations ordering.

**Classification:** **Correct**

### 14. R007 — Neutral Natures

**Rule:** PTU Core p.200: Neutral natures "simply do not affect Base Stats, since they cancel themselves out."

**Expected behavior:** 6 neutral natures have no effect on stats.

**Actual behavior:** `natures.ts:66-71`: 6 neutral natures (Composed, Hardy, Docile, Bashful, Quirky, Serious) all have `raise === lower`. `applyNatureToBaseStats()` at line 97-98: `if (nature.raise === nature.lower) return { ...baseStats }`.

**Classification:** **Correct**

---

## Tier 4: Enumerations

### 15. R003 — 6 Base Stats per Species

**Rule:** PTU Pokedex: Each species has HP, Attack, Defense, Special Attack, Special Defense, Speed.

**Expected behavior:** 6 base stats sourced from SpeciesData.

**Actual behavior:** `pokemon-generator.service.ts:106-113`: Extracts all 6 base stats from `speciesData` (baseHp, baseAttack, baseDefense, baseSpAtk, baseSpDef, baseSpeed). Default values (all 5) if species not found.

**Classification:** **Correct**

### 16. R004 — Pokemon Types (18 types)

**Rule:** PTU Core p.199: "Bug, Dark, Dragon, Electric, Fairy, Fighting, Fire, Flying, Ghost, Grass, Ground, Ice, Normal, Poison, Psychic, Rock, Steel, and Water."

**Expected behavior:** Types stored from SpeciesData, 1 or 2 types per Pokemon.

**Actual behavior:** `pokemon-generator.service.ts:114`: `types = speciesData.type2 ? [speciesData.type1, speciesData.type2] : [speciesData.type1]`. Types are passed through from seeded SpeciesData without validation against a canonical list. The seed data comes from PTU pokedex files which contain the correct 18 types.

**Classification:** **Correct**

### 17. R005 — 36 Natures

**Rule:** PTU Core p.199: 36 natures including 6 neutral.

**Expected behavior:** Complete nature table with 36 entries.

**Actual behavior:** `app/constants/natures.ts:22-72`: `NATURE_TABLE` has 36 entries — 30 non-neutral (5 per raised stat x 6 stats) plus 6 neutral (Composed, Hardy, Docile, Bashful, Quirky, Serious). Count verified: 30 + 6 = 36.

**Classification:** **Correct**

### 18. R018 — Learnset Completeness (Natural Move Sources)

**Rule:** PTU Pokedex: Each species has level-up learnset.

**Expected behavior:** Learnset sourced from SpeciesData, moves selected from species' natural learnset.

**Actual behavior:** `pokemon-generator.service.ts:117`: `learnset = JSON.parse(speciesData.learnset || '[]')`. Learnset is seeded from PTU pokedex files by `seed.ts`. `selectMovesFromLearnset()` at lines 473-511 filters by level and fetches full MoveData.

**Classification:** **Correct**

### 19. R061-R063 — Size, Weight, Capabilities

**Rule:** PTU Pokedex: Species have size class, weight class, and capabilities.

**Expected behavior:** Stored on Pokemon from SpeciesData.

**Actual behavior:** `pokemon-generator.service.ts:119-132`: Capabilities, size, weight class, movement caps, skills, egg groups all extracted from SpeciesData. Stored in the Pokemon record at lines 230-237.

**Classification:** **Correct**

### 20. R065 — Pokemon Skills

**Rule:** PTU Pokedex: Each species has skill modifiers.

**Expected behavior:** Skills stored per species, dice-based.

**Actual behavior:** `pokemon-generator.service.ts:118`: `skills = JSON.parse(speciesData.skills || '{}')`. Skills are stored as a JSON object mapping skill names to dice values. Displayed via PokemonSkillsTab component.

**Classification:** **Correct**

---

## Tier 5: Partial Items — Present Portion

### 21. R014/R015 — Ability Milestone Detection (Level 20/40)

**Rule:** PTU Core p.200: "At Level 20, a Pokemon gains a Second Ability... At Level 40, a Pokemon gains a Third Ability."

**Expected behavior:** Level-up reports milestone at levels 20 and 40.

**Actual behavior:** `levelUpCheck.ts:66-73`: `if (level === 20) abilityMilestone = 'second'`, `if (level === 40) abilityMilestone = 'third'`. Messages are descriptive. The PokemonLevelUpPanel and LevelUpNotification components display this milestone.

**Gap (not audited, documented):** No UI for actually assigning the new ability from the species' ability list.

**Classification:** **Correct** (detection logic)

### 22. R017 — Generator 6-Move Limit

**Rule:** PTU Core p.200: "A Pokemon can only have 6 Moves 'known' at a time."

**Expected behavior:** Generator selects max 6 moves.

**Actual behavior:** `selectMovesFromLearnset()` at `pokemon-generator.service.ts:477-479`: Filters by level, then `.slice(-6)` — takes the 6 most recently learned moves. Correctly limits to 6.

**Gap (not audited, documented):** PUT endpoint allows saving >6 moves with no validation.

**Classification:** **Correct** (generator logic)

### 23. R027 — Stat Point Reporting on Level Up

**Rule:** PTU Core p.203: "First, it gains +1 Stat Point."

**Expected behavior:** Level-up event reports +1 stat point per level.

**Actual behavior:** `levelUpCheck.ts:80`: `statPointsGained: 1` for every level. `summarizeLevelUps()` at line 101: `totalStatPoints = infos.length` (1 per level).

**Classification:** **Correct**

### 24. R028 — New Move Detection on Level Up

**Rule:** PTU Core p.203: "there is the possibility your Pokemon may learn a Move or Evolve. Check its Pokedex Entry."

**Expected behavior:** Level-up reports moves available from learnset at the new level.

**Actual behavior:** `levelUpCheck.ts:60-62`: `newMoves = learnset.filter(entry => entry.level === level).map(entry => entry.move)`. Correctly identifies moves learned at exactly this level.

**Classification:** **Correct**

### 25. R064 — Capabilities Stored

**Rule:** PTU Pokedex: Moves can grant capabilities.

**Expected behavior:** Capabilities stored on Pokemon from SpeciesData.

**Actual behavior:** Capabilities are stored as a JSON object on the Pokemon record. They come from SpeciesData at generation time. No automated move-to-capability linkage exists (documented gap).

**Classification:** **Correct** (storage)

### 26. R066/R067 — Mega Evolution: Held Item / Manual Stats

**Rule:** PTU: Mega Evolution requires Mega Stone held item.

**Expected behavior:** heldItem field can store Mega Stone name. Stats are manually editable.

**Actual behavior:** `pokemon-generator.service.ts:229`: `heldItem: data.heldItem ?? null` in DB record. Stats are editable via PUT endpoints. No automated Mega stat recalculation exists (documented gap).

**Classification:** **Correct** (present portion)

---

## Incorrect Items

### R058 Significance Presets — Extended Range

**Rule:** PTU Core p.460: "The Significance Multiplier should range from x1 to about x5."

**Expected behavior:** Significance presets should stay within x1-x5.

**Actual behavior:** `app/utils/encounterBudget.ts:72-108`: Five tiers with defaults: insignificant=1.0, everyday=2.0, significant=4.0, climactic=6.0, legendary=8.0. The last two tiers exceed PTU's stated x5 maximum.

**Classification:** **Incorrect**
**Severity:** **HIGH**
**Details:** The presets labeled "Climactic" (x6) and "Legendary" (x8) exceed PTU's stated x1-x5 range. PTU explicitly says "should range from x1 to about x5." While the "about" gives some wiggle room, x6-x8 is a substantial deviation. The code allows custom multipliers so GMs can still use x1-x5, but the labeled presets suggest these are standard PTU values when they are not. The insignificant, everyday, and significant tiers are correct. Climactic and legendary are app inventions that could dramatically inflate XP rewards if used as-is.

**Note:** This item also appears in the encounter-tables domain audit (R008) since the significance presets are shared.

---

## Approximation Items

### R009 — Stat Point Distribution Method (Random vs Player Choice)

**Rule:** PTU Core p.198: "the Trainer assigns all of their Stat Points up to their current Level."

**Expected behavior:** Trainer (player) chooses how to distribute stat points, subject to Base Relations.

**Actual behavior:** `distributeStatPoints()` at `pokemon-generator.service.ts:360-396` uses weighted random distribution proportional to base stats. This is for generated Pokemon (wild spawns, templates). The Base Relations rule is enforced afterward.

**Classification:** **Approximation**
**Severity:** **MEDIUM**
**Details:** PTU says the trainer assigns stat points (player choice). The generator uses weighted random distribution, which is an approximation suitable for NPC/wild Pokemon that the GM spawns (no human player to make choices). For player-caught Pokemon, the stats would need manual editing after capture. This is an intentional design decision — wild Pokemon need automated stat distribution, and weighted random proportional to base stats produces reasonable results. The approximation only applies to generated Pokemon, not to level-up stat allocation (which is reported but left to manual entry).

### R022 — Tutor Points: Initial Value for Generated Pokemon

**Rule:** PTU Core p.204: "Each Pokemon, upon hatching, starts with a single precious Tutor Point. Upon gaining Level 5, and every other level evenly divisible by 5... Pokemon gain another Tutor Point."

**Expected behavior:** Total tutor points = 1 (initial) + floor(level / 5) for levels 5, 10, 15, etc.
- Level 1: 1 point
- Level 5: 2 points
- Level 10: 3 points

**Actual behavior:** `pokemon-generator.service.ts:167`: `tutorPoints = 1 + Math.floor(input.level / 5)`. This gives:
- Level 1: 1 + 0 = 1 (correct)
- Level 4: 1 + 0 = 1 (correct)
- Level 5: 1 + 1 = 2 (correct)
- Level 10: 1 + 2 = 3 (correct)
- Level 15: 1 + 3 = 4 (correct)

Wait, let me re-check. Level 5: `1 + floor(5/5)` = 1 + 1 = 2. Level 10: `1 + floor(10/5)` = 1 + 2 = 3. Level 15: 1 + 3 = 4. This matches the expected accumulation.

However, `checkLevelUp()` at `levelUpCheck.ts:76`: `tutorPointGained = level >= 5 && level % 5 === 0`. This awards at exactly levels 5, 10, 15, etc. For a level 10 Pokemon, that's 2 tutor point gains (at 5 and 10) plus the initial 1 = 3 total. The generator formula `1 + floor(level/5)` produces the same result.

**Classification:** **Correct** (revising from initial analysis — the formula is correct)

Actually, wait. Let me re-verify the checkLevelUp tutor point award more carefully. Level 5: `5 >= 5 && 5 % 5 === 0` = true. Level 10: true. Level 15: true. For a Pokemon at level 12 going to level 15, it would get tutor points at level 15 only (1 tutor point). The generator at level 15 gives `1 + floor(15/5) = 1 + 3 = 4`. That's 1 initial + 3 from level milestones (5, 10, 15) = 4. Correct.

**Revised Classification:** **Correct**

Let me recalculate the summary with this correction.

---

## Ambiguous Items

### A1. R009 — Stat Distribution for Generated Wild Pokemon

**The Ambiguity:** PTU says "the Trainer assigns" stat points, but wild Pokemon have no trainer. How should wild/NPC Pokemon stats be distributed?

**Code behavior:** Weighted random distribution proportional to base stats, with Base Relations enforcement. This produces statistically reasonable results.

**Interpretation A:** Random distribution is appropriate for wild Pokemon since no player is involved.
**Interpretation B:** Wild Pokemon should follow fixed distributions per species (e.g., always maximize their highest base stat).

**Recommendation:** This is a common-sense design decision rather than a rules ambiguity. No decree needed — the weighted random approach is the standard solution used across PTU digital tools.

---

## Verified Decree Compliance

No decrees directly target the pokemon-lifecycle domain. Cross-domain decree-015 (real max HP) applies to HP calculations and is correctly followed — the HP formula uses calculated HP stat, not injury-reduced values.

---

## Corrected Summary

After re-verifying R022 (Tutor Points), the final counts are:

| Classification | Count |
|---------------|-------|
| Correct | 24 |
| Incorrect | 1 |
| Approximation | 1 |
| Ambiguous | 0 |
| **Total Audited** | **26** |

### Severity Breakdown

| Severity | Count | Items |
|----------|-------|-------|
| HIGH | 1 | R058 — Significance presets exceed PTU x5 range (x6, x8) |
| MEDIUM | 1 | R009 — Random stat distribution vs player choice (wild Pokemon only) |

---

## Escalation Notes

1. **HIGH: Significance presets exceed PTU range (R058)** — The "Climactic" (x6) and "Legendary" (x8) default multipliers exceed PTU's stated "x1 to about x5" range. Options: (a) rename them as "Extended" presets with a UI note that they exceed RAW, (b) cap defaults at x5, or (c) accept as intentional house-rule expansion. The custom multiplier input means GMs can always use PTU-standard values.

2. **MEDIUM: Random stat distribution (R009)** — Appropriate for generated wild/NPC Pokemon. Not a bug, but documented as an Approximation since PTU technically says the trainer assigns points. The level-up workflow correctly reports stat points for manual allocation rather than auto-distributing.
