---
domain: pokemon-lifecycle
type: audit-tier
tier: 1
name: Core Formulas and Constants
items_audited: 9
correct: 9
incorrect: 0
approximation: 0
ambiguous: 0
audited_at: 2026-03-05T18:00:00Z
audited_by: implementation-auditor
session: 121
---

# Tier 1: Core Formulas and Constants

9 items verifying foundational formulas and constant tables against PTU 1.05 rules.

---

## Item 1: R006 -- Nature Stat Adjustments (C017: applyNatureToBaseStats)

**Rule:** "HP is only ever raised or lowered by 1, but all other stats are raised or lowered by 2, respectively, to a minimum of 1." (PTU p.198)

**Expected behavior:** `applyNatureToBaseStats()` adds +1/-1 for HP, +2/-2 for non-HP stats, floors at 1. Neutral natures produce no change.

**Actual behavior:** `app/constants/natures.ts:78-106`
- `modifierAmount()` returns 1 for `hp`, 2 for all others (line 79).
- `applyNatureToBaseStats()` applies `Math.max(1, ...)` for both raise and lower (lines 102-103).
- Neutral natures detected by `nature.raise === nature.lower` and return unmodified copy (lines 97-99).
- Unknown nature names also return unmodified copy (lines 92-93).
- Returns a new object (immutable, does not mutate input).

**Classification:** Correct

---

## Item 2: R007 -- Neutral Natures (C013, C017)

**Rule:** PTU p.199 lists 6 neutral natures (marked with asterisk): Composed, Hardy, Docile, Bashful, Quirky, Serious. "These Natures are neutral; they simply do not affect Base Stats, since they cancel themselves out."

**Expected behavior:** Exactly 6 neutral natures identified and handled as no-ops.

**Actual behavior:** `app/constants/natures.ts:66-71`
- Composed: `{ raise: 'hp', lower: 'hp' }`
- Hardy: `{ raise: 'attack', lower: 'attack' }`
- Docile: `{ raise: 'defense', lower: 'defense' }`
- Bashful: `{ raise: 'specialAttack', lower: 'specialAttack' }`
- Quirky: `{ raise: 'specialDefense', lower: 'specialDefense' }`
- Serious: `{ raise: 'speed', lower: 'speed' }`

All 6 have `raise === lower`, which triggers the neutral branch in `applyNatureToBaseStats()` (line 97).

**Classification:** Correct

---

## Item 3: R005 -- Nature System (C013: NATURE_TABLE)

**Rule:** PTU p.199 defines 36 natures in a 6x6 grid (6 raise stats x 6 lower stats). Each non-neutral nature raises one stat and lowers another.

**Expected behavior:** All 36 natures present with correct raise/lower pairings matching PTU table.

**Actual behavior:** `app/constants/natures.ts:22-72`
- 36 entries in `NATURE_TABLE`.
- Verified against PTU p.199 table (values 1-36):
  - HP-raising: Cuddly/Atk, Distracted/Def, Proud/SpAtk, Decisive/SpDef, Patient/Speed -- matches.
  - Attack-raising: Desperate/HP, Lonely/Def, Adamant/SpAtk, Naughty/SpDef, Brave/Speed -- matches.
  - Defense-raising: Stark/HP, Bold/Atk, Impish/SpAtk, Lax/SpDef, Relaxed/Speed -- matches.
  - SpAtk-raising: Curious/HP, Modest/Atk, Mild/Def, Rash/SpDef, Quiet/Speed -- matches.
  - SpDef-raising: Dreamy/HP, Calm/Atk, Gentle/Def, Careful/SpAtk, Sassy/Speed -- matches.
  - Speed-raising: Skittish/HP, Timid/Atk, Hasty/Def, Jolly/SpAtk, Naive/SpDef -- matches.
  - Neutral: Composed/HP, Hardy/Atk, Docile/Def, Bashful/SpAtk, Quirky/SpDef, Serious/Speed -- matches.

**Classification:** Correct

---

## Item 4: R011 -- Pokemon HP Formula (C009, C029)

**Rule:** "Pokemon Hit Points = Pokemon Level + (HP x 3) + 10" (PTU p.198)

**Expected behavior:** HP calculated as `Level + (HP_stat * 3) + 10` at creation and on level-up.

**Actual behavior:**
- **At creation:** `app/server/services/pokemon-generator.service.ts:152` -- `const maxHp = input.level + (calculatedStats.hp * 3) + 10` -- matches exactly.
- **On level-up (add-experience):** `app/server/api/pokemon/[id]/add-experience.post.ts:116` -- `maxHpIncrease = levelResult.levelsGained` -- increments maxHp by 1 per level gained (the Level component of the formula increases by 1 per level; the HP stat component changes only when stat points are manually allocated). Correct.
- **On level-up (xp-distribute):** `app/server/api/encounters/[id]/xp-distribute.post.ts:203` -- Same logic as add-experience.
- **On evolution:** `app/server/services/evolution.service.ts:224` -- `maxHp = level + (calculatedStats.hp * 3) + 10` -- full recalculation.

**Classification:** Correct

---

## Item 5: R009 -- Stat Points Allocation Total (C033: distributeStatPoints)

**Rule:** "Next, add +X Stat Points, where X is the Pokemon's Level plus 10." (PTU p.198)

**Expected behavior:** Total stat points allocated = Level + 10.

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:386` -- `let remainingPoints = Math.max(0, level + 10)`. The while loop (lines 387-398) decrements `remainingPoints` by 1 each iteration until it reaches 0, distributing exactly `level + 10` points.

Also verified in evolution service: `app/server/services/evolution.service.ts:183-185` -- validates `total === expectedTotal` where `expectedTotal = level + 10`.

**Classification:** Correct

---

## Item 6: R010 -- Base Relations Rule (C033: distributeStatPoints)

**Rule:** "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points. [...] Stats that are equal need not be kept equal, however." (PTU p.198)

**Expected behavior:** After distributing stat points, stats with higher base values receive >= added points than stats with lower base values. Equal base stats form tiers with no ordering constraint between them.

**Actual behavior:** `app/server/services/pokemon-generator.service.ts:376-483`
- `distributeStatPoints()` receives nature-adjusted base stats (line 149 in `generatePokemonData()` passes `adjustedBaseStats` from `applyNatureToBaseStats()`).
- Weighted random distribution (lines 387-398) uses nature-adjusted base stats as weights.
- `enforceBaseRelations()` (lines 428-483):
  - Groups stats by base value into tiers (lines 454-459).
  - Sorts added-point values descending (line 444).
  - Assigns highest added values to highest tier, shuffles within tiers (lines 467-472).
- **decree-035 compliance:** The base stats passed to `distributeStatPoints()` are already nature-adjusted, so the ordering it enforces uses nature-modified values. A +Atk/-Def nature changes which stats must be higher/lower. This complies with decree-035.

**Classification:** Correct (per decree-035)

---

## Item 7: R060 -- Experience Chart (C014: EXPERIENCE_CHART)

**Rule:** PTU p.203 defines cumulative XP thresholds for levels 1-100. Level 1 = 0 XP, Level 100 = 20,555 XP.

**Expected behavior:** All 100 level thresholds match PTU book exactly.

**Actual behavior:** `app/utils/experienceCalculation.ts:28-49`

Spot-checked against PTU p.203:
- Level 1: 0 -- code: 0 -- match
- Level 5: 40 -- code: 40 -- match
- Level 10: 90 -- code: 90 -- match
- Level 21: 460 -- code: 460 -- match
- Level 30: 1,165 -- code: 1165 -- match
- Level 50: 3,645 -- code: 3645 -- match
- Level 70: 8,485 -- code: 8485 -- match
- Level 90: 15,780 -- code: 15780 -- match
- Level 100: 20,555 -- code: 20555 -- match

`MAX_EXPERIENCE = EXPERIENCE_CHART[100] = 20555` (line 55).

Helper functions `getXpForLevel()`, `getLevelForXp()`, and `getXpToNextLevel()` provide correct lookups (lines 210-250).

**Classification:** Correct

---

## Item 8: R058 -- Pokemon Experience Calculation (C020: calculateEncounterXp)

**Rule:** "First off, total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled. [...] Second, consider the significance of the encounter. [...] Third, divide the Experience by the number of players gaining Experience." (PTU p.460)

**Expected behavior:** XP = floor(sum_of_enemy_levels * significance_multiplier / player_count). Trainers count as 2x level. Boss encounters skip player division. All divisions floored.

**Actual behavior:** `app/utils/experienceCalculation.ts:259-300`
- Step 1: `xpContribution = enemy.isTrainer ? enemy.level * 2 : enemy.level` (line 272) -- trainers 2x.
- Step 2: `multipliedXp = Math.floor(enemyLevelsTotal * significanceMultiplier)` (line 280) -- floor after multiply.
- Step 3: `perPlayerXp = isBossEncounter ? multipliedXp : Math.floor(multipliedXp / Math.max(1, playerCount))` (lines 283-285) -- boss encounters skip division, normal encounters floor divide.
- PTU p.489 boss rule: "do not divide the Experience from the Boss Enemy itself by the number of players" -- implemented via `isBossEncounter` flag.

**Classification:** Correct

---

## Item 9: R002 -- Pokemon Maximum Level (C006, C042)

**Rule:** "Pokemon have a maximum Level of 100." (PTU p.202)

**Expected behavior:** Experience capped at 20,555 (level 100 threshold). Level cannot exceed 100.

**Actual behavior:**
- `MAX_EXPERIENCE = 20555` (`app/utils/experienceCalculation.ts:55`).
- `add-experience.post.ts:42-47`: Validates `body.amount <= MAX_EXPERIENCE` on input.
- `add-experience.post.ts:111`: `cappedExperience = Math.min(levelResult.newExperience, MAX_EXPERIENCE)`.
- `xp-distribute.post.ts:198`: Same cap applied.
- `calculateLevelUps()` (line 324): `newExperience = Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)`.
- `getLevelForXp()` (line 225): Returns `MAX_LEVEL` (100) for XP >= MAX_EXPERIENCE.
- `checkLevelUp()` (line 58): Caps iteration at `Math.min(newLevel, 100)`.

**Classification:** Correct
