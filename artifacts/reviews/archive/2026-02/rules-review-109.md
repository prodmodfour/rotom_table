---
review_id: rules-review-109
target: ptu-rule-055
trigger: design-implementation
verdict: APPROVED
reviewed_commits: [5a388a4, 8119970, 79fc199, ebb1706, b078693, ad5c421]
reviewed_files:
  - app/utils/experienceCalculation.ts
  - app/components/encounter/XpDistributionModal.vue
  - app/stores/encounter.ts
  - app/server/api/encounters/[id]/xp-distribute.post.ts
  - app/server/api/encounters/[id]/xp-calculate.post.ts
  - app/server/services/encounter.service.ts
  - app/types/encounter.ts
  - app/prisma/schema.prisma
  - app/pages/gm/index.vue
  - app/utils/levelUpCheck.ts
date: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Verification Report

### Scope
- [x] XP calculation formula -- base XP from defeated enemies, trainer level doubling
- [x] Significance multiplier handling -- x1 to x5+ range
- [x] Division by players rule
- [x] Boss encounter XP rules -- no division
- [x] Fainted Pokemon CAN receive XP rule
- [x] Experience Chart values -- spot-checked against PTU Core p.203
- [x] Level-up detection via experience chart lookup
- [x] Level-up side effects -- stat points, tutor points, moves, ability slots
- [x] XP rounding behavior
- [x] Level 100 / max XP cap
- [x] xpDistributed safety flag behavior

### Mechanics Verified

#### 1. Base Experience Value -- Enemy Levels (PTU Core p.460)
- **Rule:** "Total the Level of the enemy combatants which were defeated."
- **Implementation:** `calculateEncounterXp()` in `experienceCalculation.ts` line 248-257 maps each defeated enemy to its `xpContribution` and sums them via `reduce()`. The `enemyLevelsTotal` is a direct sum of all effective levels.
- **Status:** CORRECT

#### 2. Trainer Level Doubling (PTU Core p.460)
- **Rule:** "For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation. For example, if your players fought a Level 10 Trainer with a level 20 Pokemon, Base Experience Value for this encounter is 40."
- **Implementation:** `xpContribution: enemy.isTrainer ? enemy.level * 2 : enemy.level` (line 252). The enrichment function `enrichDefeatedEnemies()` determines `isTrainer` from either `entry.type === 'human'` (new entries) or index-based `trainerEnemyIds` (legacy entries).
- **Verification against book example:** Level 10 Trainer (2x = 20) + Level 20 Pokemon = 40. The code would produce `10*2 + 20 = 40`. Matches.
- **Status:** CORRECT

#### 3. Significance Multiplier Range (PTU Core p.460)
- **Rule:** "The Significance Multiplier should range from x1 to about x5." Insignificant x1-1.5, Average x2-3, Significant x4-x5+. Adjust by +/- x0.5 to x1.5 based on difficulty.
- **Implementation:** `SIGNIFICANCE_PRESETS` maps: insignificant=1, below_average=1.5, average=2, above_average=3, significant=4, major=5. Custom input allows 0.5 to 10. Server validation enforces 0.5-10 range.
- **Analysis:** The presets match the PTU guidance exactly. The custom range (0.5-10) is generous but the rules say "x5 or even higher" for decisive battles, so allowing up to 10 is reasonable GM flexibility.
- **Status:** CORRECT

#### 4. Division by Players (PTU Core p.460)
- **Rule:** "Third, divide the Experience by the number of players gaining Experience. Divide by the number of Players -- not the number of Pokemon."
- **Implementation:** `Math.floor(multipliedXp / Math.max(1, playerCount))` (line 265). The `playerCount` is auto-detected from unique `ownerId` values of player-side Pokemon combatants (XpDistributionModal line 346-355), and is editable by the GM.
- **Analysis:** Divides by players not Pokemon count, as the rule specifies. The `Math.max(1, ...)` prevents division by zero. Auto-detection from combatant ownership is a sound heuristic.
- **Status:** CORRECT

#### 5. Per-Player XP Split Among Their Pokemon (PTU Core p.460)
- **Rule:** "If a Trainer used multiple Pokemon, he will have to split his experience among the Pokemon he used."
- **Implementation:** The XpDistributionModal groups participating Pokemon by owner (playerGroups computed property, lines 369-389). Each player gets XP input fields for their Pokemon with a running total that must not exceed `xpPerPlayer`. The "Split Evenly" button (lines 445-455) divides the player's share among their Pokemon with remainder going to the first.
- **Analysis:** Per-player grouping and validation correctly enforce the rule that each player splits their own share. Over-allocation is prevented client-side (`hasOverAllocation` computed, line 404-406) and pool-level server-side.
- **Status:** CORRECT

#### 6. Boss Encounter XP (PTU Core p.489)
- **Rule:** "When awarding Experience for a Boss encounter, do not divide the Experience from the Boss Enemy itself by the number of players."
- **Implementation:** When `isBossEncounter` is true, the entire XP pool is not divided: `perPlayerXp = multipliedXp` (line 263-265).
- **Analysis:** The PTU rule specifically says "the Experience from the Boss Enemy **itself**" should not be divided -- implying that if there are minion enemies alongside the boss, their XP could still be divided. The implementation simplifies this to a whole-encounter toggle. This is a known design-level simplification documented in the design spec. For practical purposes, this is acceptable: most boss encounters are single-enemy encounters, and the GM has full control over the multiplier to adjust. A per-enemy boss flag would add significant complexity for minimal gain.
- **Severity:** LOW -- design simplification, not a rule violation in typical use
- **Status:** ACCEPTABLE

#### 7. Fainted Pokemon CAN Receive XP (PTU Core p.460)
- **Rule:** "Unlike in the video games, Fainted Pokemon can still gain Experience."
- **Implementation:** The `xp-calculate.post.ts` endpoint (line 57-58) filters participating Pokemon as `c.side === 'players' && c.type === 'pokemon'` -- it does NOT filter by HP or fainted status. All player-side Pokemon appear in the distribution UI regardless of their current HP.
- **Analysis:** This correctly allows fainted Pokemon to receive XP. No faint-checking occurs anywhere in the XP distribution pipeline.
- **Status:** CORRECT

#### 8. Experience Chart Values (PTU Core p.203)
- **Rule:** Level-to-XP table from Level 1 (0 XP) to Level 100 (20,555 XP).
- **Implementation:** `EXPERIENCE_CHART` constant in `experienceCalculation.ts` lines 26-47.
- **Spot-check against rulebook:**
  - Level 1: 0 -- book says 0. MATCH
  - Level 10: 90 -- book says 90. MATCH
  - Level 20: 400 -- book says 400. MATCH
  - Level 30: 1165 -- book says 1,165. MATCH
  - Level 40: 2230 -- book says 2,230. MATCH
  - Level 50: 3645 -- book says 3,645. MATCH
  - Level 60: 5865 -- book says 5,865. MATCH
  - Level 70: 8485 -- book says 8,485. MATCH
  - Level 80: 11505 -- book says 11,505. MATCH
  - Level 90: 15780 -- book says 15,780. MATCH
  - Level 100: 20555 -- book says 20,555. MATCH
  - Additional checks: Level 29 = 1075 (book: 1,075 MATCH), Level 49 = 3445 (book: 3,445 MATCH)
- **Status:** CORRECT

#### 9. Level-Up Detection and getLevelForXp (PTU Core p.202-203)
- **Rule:** "Whenever your Pokemon gains Experience, add its Experience to its previous Experience total. If the new total is higher than the Experience threshold to reach the next Level, the Pokemon levels up."
- **Implementation:** `getLevelForXp()` walks from level 100 down to 1 to find the highest level the XP qualifies for (lines 203-215). `calculateLevelUps()` uses this to determine the new level and computes level-up events for each intermediate level (lines 296-334).
- **Analysis:** The reverse walk ensures the correct level is found even when multi-level jumps occur. Experience is capped at `MAX_EXPERIENCE` (20,555).
- **Status:** CORRECT

#### 10. Level-Up Effects (PTU Core p.202)
- **Rule:** Per level: +1 stat point. At level 20: second ability slot. At level 40: third ability slot. At levels divisible by 5 (starting at 5): +1 tutor point. New moves from learnset at each level.
- **Implementation:** `checkLevelUp()` in `levelUpCheck.ts`:
  - `statPointsGained: 1` (always, line 80)
  - `abilityMilestone` at level 20 = 'second', level 40 = 'third' (lines 66-73)
  - `tutorPointGained = level >= 5 && level % 5 === 0` (line 76)
  - `newMoves` from learnset filtered by exact level match (lines 60-62)
- **Verification:**
  - Level 5: tutor point = true (5 >= 5 && 5 % 5 === 0). CORRECT
  - Level 10: tutor point = true. CORRECT
  - Level 4: tutor point = false (4 % 5 !== 0). CORRECT
  - Level 19: no ability. CORRECT
  - Level 20: second ability. CORRECT
  - Level 40: third ability. CORRECT
- **Status:** CORRECT

#### 11. XP Rounding
- **Rule:** PTU does not explicitly specify rounding behavior. Design spec states: "XP values are always rounded down (floor) after division. Fractional XP is discarded per PTU convention."
- **Implementation:** `Math.floor()` is applied after multiplication (line 260) and after division (line 265). Double-flooring is conservative.
- **Analysis:** Flooring at both steps can lose up to 1 XP more than flooring only at the final step. With significance multipliers like 1.5, the intermediate floor loses 0-0 XP for even totals. Example: 15 base * 1.5 = 22.5, floor = 22. Then 22 / 3 = 7.33, floor = 7. If you only floored at the end: 22.5 / 3 = 7.5, floor = 7. Same result. For odd cases: 13 * 1.5 = 19.5, floor = 19 vs keeping 19.5, both / 2 = 9.5 vs 9.75, both floor to 9. The difference is at most 1 XP, which is negligible. No PTU rule is violated.
- **Status:** ACCEPTABLE

#### 12. Level 100 Cap
- **Rule:** Pokemon cannot exceed Level 100. Experience chart ends at Level 100 = 20,555 XP.
- **Implementation:** `MAX_LEVEL = 100`, `MAX_EXPERIENCE = 20555`. `calculateLevelUps()` caps at `Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)` (line 304). `getLevelForXp()` returns `MAX_LEVEL` for XP >= MAX_EXPERIENCE (line 205). The API endpoint also caps: `Math.min(levelResult.newExperience, MAX_EXPERIENCE)` (line 185 of xp-distribute.post.ts).
- **Status:** CORRECT (capped at both calculation and DB write layers)

#### 13. Tutor Points in DB Update
- **Rule:** PTU Core p.202: "At levels divisible by 5: gains +1 Tutor Point"
- **Implementation:** The `xp-distribute.post.ts` endpoint counts tutor points from level-up events (`levelResult.levelUps.filter(lu => lu.tutorPointGained).length`, line 180-182) and adds them to the existing value: `tutorPoints: pokemon.tutorPoints + tutorPointsGained` (line 194).
- **Status:** CORRECT

#### 14. xpDistributed Safety Flag
- **Rule:** No PTU rule governs this -- it is an application-level safeguard.
- **Implementation:** Prisma schema adds `xpDistributed Boolean @default(false)` to Encounter. Set to `true` after successful distribution (xp-distribute.post.ts lines 210-213). XpDistributionModal shows a warning banner when `xpDistributed === true` (line 14-17). Re-distribution is allowed but warned -- this is correct because the design spec says "warning but not hard block" (design spec Edge Case 8).
- **Status:** N/A (application feature, not PTU rule -- implementation matches design spec)

#### 15. Encounter End Flow Integration
- **Implementation:** `endEncounter()` in gm/index.vue checks `defeatedEnemies.length > 0`. If yes, shows XpDistributionModal instead of `confirm()`. Modal emits `skip` (end without XP) or `complete` (end after XP applied). Both handlers close the modal and call `encounterStore.endEncounter()`.
- **Analysis:** The flow correctly gates the XP modal on having defeated enemies (as designed). Empty encounters skip directly to the confirm dialog. The "Skip XP" path allows the GM to defer XP distribution without being forced through it.
- **Status:** CORRECT (matches design spec)

### Observations

#### Boss XP Per-Enemy Granularity (LOW)
The PTU rule (p.489) says "do not divide the Experience from the Boss Enemy **itself**" -- implying per-enemy boss tagging, not per-encounter. The current implementation uses a per-encounter boolean toggle. This is a design-level simplification that was already documented in the design spec. For a future enhancement, per-enemy boss flags would allow mixed encounters (boss + minions) to have only the boss's XP undivided. This is not worth blocking on.

#### Server-Side Per-Player Validation Gap (LOW)
Per-player XP validation is enforced client-side only (XpDistributionModal). The server does pool-level validation (`totalDistributed <= totalXpPerPlayer * playerCount`). A malicious or buggy client could send a distribution where Player A gets 0 and Player B gets 2x their share. This is a known design choice documented in the xp-distribute.post.ts TODO comment and the code-review-117 M1 fix notes. Not a PTU rule issue -- it's an architectural choice.

### Summary
- Mechanics checked: 15
- Correct: 13
- Acceptable (design simplification, no practical impact): 2
- Incorrect: 0
- No tickets required
