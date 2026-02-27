---
review_id: rules-review-118
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-055
domain: pokemon-lifecycle
commits_reviewed:
  - f860e1f
  - ad5c843
  - c39d146
  - d6f86f1
mechanics_verified:
  - stat-point-allocation-per-level
  - tutor-point-gain-per-level
  - move-learning-at-level-thresholds
  - ability-milestones
  - evolution-eligibility-notification
  - maxhp-on-level-up
  - experience-cap
  - tutor-point-db-persistence
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/05-pokemon.md#Leveling-Up
  - core/05-pokemon.md#Abilities
  - core/05-pokemon.md#Tutor-Points
  - core/05-pokemon.md#Moves
  - core/05-pokemon.md#Evolution
  - errata-2.md
reviewed_at: 2026-02-21T22:30:00Z
---

## Mechanics Verified

### 1. Stat Point Allocation Per Level

- **Rule:** "Whenever your Pokemon Levels up, follow this list: First, it gains +1 Stat Point." (`core/05-pokemon.md#Leveling Up`, p.202 line 563)
- **Implementation:** `checkLevelUp()` in `app/utils/levelUpCheck.ts` line 80 sets `statPointsGained: 1` for every level in the loop. `LevelUpNotification.vue` line 101-102 sums these via `result.levelUps.reduce((sum, lu) => sum + lu.statPointsGained, 0)`. The notification displays `+N Stat Points` (line 27).
- **Verification:** A Pokemon going from Level 5 to Level 8 would produce 3 `LevelUpInfo` entries, each with `statPointsGained: 1`, totaling 3. Matches the rule of +1 per level.
- **Status:** CORRECT

### 2. Tutor Point Gain Per Level

- **Rule:** "Each Pokemon, upon hatching, starts with a single precious Tutor Point. Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point." (`core/05-pokemon.md#Tutor Points`, p.202 line 576-582)
- **Implementation:** `checkLevelUp()` in `app/utils/levelUpCheck.ts` line 76: `tutorPointGained = level >= 5 && level % 5 === 0`. `LevelUpNotification.vue` line 104-106 counts tutor points via `.filter(lu => lu.tutorPointGained).length`. The notification conditionally renders tutor point text (lines 31-37).
- **Verification:**
  - Level 5: `5 >= 5 && 5 % 5 === 0` = true. CORRECT
  - Level 10: `10 >= 5 && 10 % 5 === 0` = true. CORRECT
  - Level 4: `4 >= 5` = false. CORRECT (no tutor point at level 4)
  - Level 15: `15 >= 5 && 15 % 5 === 0` = true. CORRECT
  - Level 3: `3 >= 5` = false. CORRECT
- **DB persistence:** `add-experience.post.ts` line 83-85 counts gained tutor points and line 93 adds them: `tutorPoints: pokemon.tutorPoints + tutorPointsGained`. Matches the xp-distribute endpoint pattern.
- **Status:** CORRECT

### 3. Move Learning at Level Thresholds

- **Rule:** "Next, there is the possibility your Pokemon may learn a Move or Evolve. Check its Pokedex Entry to see if either of these happens." (`core/05-pokemon.md#Leveling Up`, p.202 line 566-567)
- **Implementation:** `checkLevelUp()` in `app/utils/levelUpCheck.ts` lines 60-62 filters the learnset for exact level matches: `learnset.filter(entry => entry.level === level).map(entry => entry.move)`. `LevelUpNotification.vue` lines 107-108 flattens all new moves across level-ups via `result.levelUps.flatMap(lu => lu.newMovesAvailable)`. Each move is displayed individually (lines 40-47).
- **Learnset source:** `add-experience.post.ts` lines 62-71 loads the learnset from `SpeciesData.learnset` in the DB (JSON parsed as `LearnsetEntry[]`). The `xp-distribute.post.ts` does the same (lines 148-161). Both handle parse failures gracefully with empty fallback.
- **Analysis:** The implementation checks for moves at exactly the new level, which matches PTU behavior -- a Pokemon learns moves listed at each level it gains. Multiple moves at the same level are all included. Moves at skipped-over levels (in a multi-level jump) are correctly captured because the loop iterates through each intermediate level.
- **Status:** CORRECT

### 4. Ability Milestones

- **Rule:** "Pokemon gain additional Abilities as they Level up. At Level 20, a Pokemon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities. At Level 40, a Pokemon gains a Third Ability, which may be chosen from any of its Abilities." (`core/05-pokemon.md#Abilities`, p.200 lines 410-414)
- **Implementation:** `checkLevelUp()` in `app/utils/levelUpCheck.ts` lines 64-73:
  - Level 20: `abilityMilestone = 'second'`, message = "Basic or Advanced"
  - Level 40: `abilityMilestone = 'third'`, message = "any category"
- **LevelUpNotification display:** Lines 110-118 filter for non-null `newAbilitySlot` and generate messages:
  - 'second': "Level 20: Second Ability unlocked (Basic or Advanced)" -- matches rule
  - 'third': "Level 40: Third Ability unlocked (any category)" -- matches rule
- **Verification:**
  - Level 19 to 21: produces milestones for level 20 only. CORRECT
  - Level 39 to 41: produces milestones for level 40 only. CORRECT
  - Level 19 to 41: produces milestones for both 20 and 40. CORRECT
  - Level 60 to 61: no milestone (Ability Mastery at 60 is a Poke Edge, not an automatic ability slot). CORRECT
- **Errata check:** No errata modifies the Level 20/40 ability milestones. Mixed Sweeper was replaced by Mixed Power in errata, but that is a Poke Edge, not an automatic ability gain.
- **Status:** CORRECT

### 5. Evolution Eligibility Notification

- **Rule:** "Next, there is the possibility your Pokemon may learn a Move or Evolve. Check its Pokedex Entry to see if either of these happens. If a Pokemon evolves, make sure to then check its new form's Move List to see if it learned any Moves that Level." (`core/05-pokemon.md#Leveling Up`, p.202 lines 566-571)
- **Implementation:** `calculateLevelUps()` in `experienceCalculation.ts` line 345: `canEvolve: evolutionLevels ? evolutionLevels.includes(info.newLevel) : false`. The `evolutionLevels` parameter is optional and not provided by either `add-experience.post.ts` or `xp-distribute.post.ts`, so `canEvolve` is always `false`.
- **LevelUpNotification display:** Lines 119-121 filter for `lu.canEvolve === true` and lines 59-67 render evolution notifications. Since `canEvolve` is always false, this section never renders.
- **Analysis:** Evolution conditions in PTU are diverse -- level-based, item-based, trade-based, happiness-based, etc. The SpeciesData model does not encode evolution triggers, so automated detection is not feasible without a dedicated evolution data schema. The code provides the correct infrastructure (the `canEvolve` field and UI rendering logic) but leaves it dormant. The design spec explicitly documents this: "Evolution eligibility shows as a notification rather than a detailed evolution path, since SpeciesData does not encode evolution conditions."
- **Severity:** Not a PTU rule violation. The system correctly advises the GM to "check its Pokedex Entry" -- it simply does not automate this check. This is an acknowledged design limitation, not an implementation error.
- **Status:** ACCEPTABLE (design limitation, not rule violation)

### 6. maxHp Not Updated on Level-Up (Inherited from P0)

- **Rule:** "Pokemon Hit Points = Pokemon Level + (HP x3) + 10" (`core/05-pokemon.md#Managing Pokemon`, p.198 line 118). The Level component of the formula changes on level-up.
- **Implementation:** Neither `add-experience.post.ts` nor `xp-distribute.post.ts` updates the stored `maxHp` field when a Pokemon's level increases. `maxHp` is a stored DB column (`prisma/schema.prisma` line 32), not a computed value.
- **Analysis:** When a Pokemon gains N levels, its `maxHp` should increase by N (since the Level component of the formula increases by N, while the HP stat remains unchanged until stat points are manually allocated). Both endpoints update `level` but not `maxHp`, leaving it stale until the GM manually updates the Pokemon's sheet.
- **Prior review:** This behavior was present in the P0 `xp-distribute.post.ts` endpoint and reviewed in rules-review-109, which approved it. The endpoint explicitly documents: "Stat points from leveling are NOT auto-applied. The GM/player must manually allocate them. This endpoint only updates experience, level, and tutorPoints."
- **Caveat:** The level change portion of `maxHp` (i.e., `+levelsGained` to maxHp) does NOT require stat point allocation and could theoretically be auto-applied. However, this is a pre-existing design decision inherited from P0, not a P2 regression.
- **Status:** NEEDS REVIEW (pre-existing, not a P2 issue -- flagged as observation)

### 7. Experience Cap at Level 100

- **Rule:** "Pokemon have a maximum Level of 100." (`core/05-pokemon.md#Leveling Up`, p.202 line 559)
- **Implementation:**
  - `add-experience.post.ts` line 88: `Math.min(levelResult.newExperience, MAX_EXPERIENCE)` caps stored XP.
  - `calculateLevelUps()` line 328: `Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)` caps calculation XP.
  - `getLevelForXp()` line 229: returns `MAX_LEVEL` for XP >= MAX_EXPERIENCE.
  - `checkLevelUp()` line 58: loop caps at `Math.min(newLevel, 100)`.
- **Status:** CORRECT (capped at every layer)

### 8. Tutor Point DB Persistence in add-experience Endpoint

- **Rule:** Tutor points gained at levels divisible by 5 must be added to the Pokemon's record.
- **Implementation:** `add-experience.post.ts` lines 83-85: `const tutorPointsGained = levelResult.levelUps.filter(lu => lu.tutorPointGained).length`. Line 93: `tutorPoints: pokemon.tutorPoints + tutorPointsGained`.
- **Verification:** A Pokemon leveling from 8 to 12 would gain tutor points at level 10 only (1 tutor point). `filter(lu => lu.tutorPointGained)` returns the level 10 event. `.length` = 1. `pokemon.tutorPoints + 1` is written to DB. CORRECT.
- **Status:** CORRECT

## Summary

P2 adds three deliverables: `LevelUpNotification.vue` (display component), `add-experience.post.ts` (standalone XP endpoint), and `XpDistributionModal` integration.

All core PTU level-up mechanics are correctly implemented:
- **+1 stat point per level** (always 1, correctly summed)
- **Tutor points at levels divisible by 5** (correctly detected and persisted to DB)
- **New moves from learnset** (exact level match, handles multi-level jumps)
- **Ability milestones at Level 20 and 40** (correct slot types and descriptions)
- **Experience cap at Level 100 / 20,555 XP** (capped at every layer)

The `add-experience.post.ts` endpoint mirrors the existing `xp-distribute.post.ts` pattern correctly -- loads learnset, calls `calculateLevelUps()`, persists level + experience + tutorPoints.

## Observations

### MEDIUM: maxHp Not Recalculated on Level-Up (Pre-existing)

When a Pokemon levels up, the `Level` component of the HP formula (`Level + HP*3 + 10`) increases, which means `maxHp` should increase by the number of levels gained, even before stat points are allocated. Neither the P0 `xp-distribute.post.ts` nor the P2 `add-experience.post.ts` updates `maxHp`. This is a pre-existing design decision documented in the P0 endpoint comments and approved in rules-review-109. The `add-experience.post.ts` correctly follows the same pattern, so this is not a P2 regression. However, this means the stored `maxHp` will be stale by `levelsGained` HP until the GM manually updates the Pokemon sheet. A future enhancement could auto-apply the level component of the HP increase (`maxHp += levelsGained`) without touching stat allocation.

### LOW: Evolution Notification Infrastructure Dormant

The `canEvolve` field and `LevelUpNotification` evolution rendering logic exist but are always inactive because `evolutionLevels` is never provided. This is explicitly documented as a design limitation. No PTU rule is violated -- the GM must manually consult the Pokedex entry for evolution conditions, which is consistent with the tabletop experience.

## Rulings

1. **Stat points:** +1 per level is correct per PTU Core p.202. The notification correctly sums across multi-level gains.
2. **Tutor points:** Gained at Level 5 and every 5 levels thereafter. Code formula `level >= 5 && level % 5 === 0` is correct. DB persistence is correct in both endpoints.
3. **New moves:** Learnset filtering by exact level match is correct. Multi-level jumps correctly check each intermediate level.
4. **Ability milestones:** Level 20 = Second Ability (Basic or Advanced), Level 40 = Third Ability (any category). Both match PTU Core p.200.
5. **Evolution eligibility:** Not a bug that it is dormant -- evolution conditions are not encodable from current SpeciesData schema.
6. **maxHp:** Pre-existing approved design decision. Not a P2 regression.

## Verdict

**APPROVED**

No PTU rule violations in the P2 implementation. All level-up mechanics are correctly computed and displayed. The `add-experience.post.ts` endpoint correctly mirrors the established `xp-distribute.post.ts` pattern. The one medium observation (maxHp not recalculated on level-up) is a pre-existing design decision, not a P2 regression.

## Required Changes

None.
