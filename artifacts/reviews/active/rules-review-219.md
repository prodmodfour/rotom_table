---
review_id: rules-review-219
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-007
domain: pokemon-lifecycle
commits_reviewed:
  - 76831179 fix: correct categorizeAbilities boundary for species with no High ability
  - 2ea55977 fix: include real move ID in learn-move response, remove unsafe double-cast
  - 3dbe3597 fix: replace alert() with inline error display in PokemonLevelUpPanel
  - 025e6edd fix: enforce milestone ordering for third ability assignment
  - 1b451beb refactor: add distinct emit types for ability/move events in PokemonLevelUpPanel
  - 48490659 fix: replace watchEffect with one-time init for currentMoves in MoveLearningPanel
  - a02ba6b5 refactor: extract shared slideDown/spin keyframes to global SCSS
  - 5cae0db8 refactor: extract duplicated SCSS into _level-up-shared.scss partial
mechanics_verified:
  - ability-pool-categorization
  - ability-milestone-ordering-enforcement
  - ability-milestones-level-20-40
  - move-learning-6-slot-limit
  - move-learning-replace-workflow
  - stat-point-budget
  - base-relations-rule
  - hp-formula
  - tutor-point-schedule
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Abilities (p.200)
  - core/05-pokemon.md#Moves (p.200)
  - core/05-pokemon.md#Leveling Up (p.202)
  - core/05-pokemon.md#Base Relations Rule (p.198)
  - errata-2.md#Tutor and Inheritance Move Changes
reviewed_at: 2026-03-01T13:15:00Z
follows_up: rules-review-214
---

## Mechanics Verified

### 1. Ability Pool Categorization (C1 Fix)

- **Rule:** Species ability lists are ordered: Basic abilities first, then Advanced, then High. The High ability is always the last entry and only present when there are entries in all three tiers. (`core/05-pokemon.md` p.200, Pokedex entry format)
- **Implementation:** `categorizeAbilities()` in `app/utils/abilityAssignment.ts` (lines 38-57) now uses a `hasHighAbility` flag computed as `speciesAbilities.length > numBasicAbilities + 1`. This correctly means:
  - All Basic: `length = numBasic` -> no High, all classified Basic. Correct.
  - Basic + Advanced, no High: `length = numBasic + 1` -> `hasHighAbility = false`. The single Advanced ability at the last index enters the `!hasHighAbility` branch and is classified as Advanced. Correct.
  - Basic + Advanced + High: `length > numBasic + 1` -> `hasHighAbility = true`. Non-basic entries except the last are Advanced; the last entry is High. Correct.
  - All Advanced (numBasic=0): `length > 1` -> High for last entry, Advanced for rest. This edge case is degenerate but correct behavior since if numBasic=0 then all entries are in the Advanced+ range.
- **Previous Issue:** code-review-238 C1 identified that species with exactly `numBasicAbilities + 1` abilities (one Advanced, no High) had the Advanced ability misclassified as High. This would corrupt the Level 20 ability pool by excluding the sole Advanced ability.
- **Status:** CORRECT -- the fix resolves the C1 boundary error. The `hasHighAbility` guard correctly distinguishes the two-tier case (Basic + Advanced only) from the three-tier case (Basic + Advanced + High).

### 2. Ability Milestone Ordering Enforcement (rules-review-214 H1 Fix)

- **Rule:** "At Level 20, a Pokemon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities. At Level 40, a Pokemon gains a Third Ability, which may be chosen from any of its Abilities." (`core/05-pokemon.md` p.200, lines 411-414). The naming "Second" and "Third" implies sequential acquisition -- a Pokemon must have its second ability before gaining a third.
- **Implementation:** `app/server/api/pokemon/[id]/assign-ability.post.ts` (lines 74-79) now checks `currentAbilities.length < 2` when `milestone === 'third'` and returns a 400 error: "Pokemon must have a second ability before gaining a third. Assign the second ability first (Level 20 milestone)."
- **Previous Issue:** rules-review-214 H1 identified that the server allowed a Level 40+ Pokemon with only 1 ability to directly assign its "third" ability from the full pool (Basic + Advanced + High), bypassing the Basic/Advanced-only restriction of the second ability slot.
- **Validation chain:** The milestone check order in the endpoint is now: (1) level >= 40, (2) abilities.length >= 2 (NEW), (3) abilities.length < 3. This ensures sequential milestone completion.
- **Client-side consistency:** `useLevelUpAllocation.ts` `pendingAbilityMilestone` (lines 173-178) checks Level 40 first, returning `'third'` for a Level 40+ Pokemon with only 1 ability. However, this computed property is only used for `hasPendingActions` tracking, not for the ability assignment UI. The actual UI in `PokemonLevelUpPanel.vue` uses `levelUpInfo.abilityMilestones` from the server's `level-up-check.post.ts`, which lists milestones in level order (Level 20 first, Level 40 second). Both milestone buttons are visible, but the server now enforces ordering. This is acceptable -- the GM sees both milestones and can click either, but the server rejects out-of-order assignments with a clear error message.
- **Status:** CORRECT -- the fix enforces PTU's implicit sequential milestone ordering. The server is the enforcement point, and the client gracefully displays the error.

### 3. Ability Milestones at Level 20 and Level 40

- **Rule:** "At Level 20, a Pokemon gains a Second Ability" and "At Level 40, a Pokemon gains a Third Ability" (`core/05-pokemon.md` p.200, lines 411-413).
- **Implementation:** `levelUpCheck.ts` lines 67-73 detect milestones at exactly level 20 (`'second'`) and level 40 (`'third'`). The `getAbilityPool()` function maps `'second'` to `Set(['Basic', 'Advanced'])` and `'third'` to `Set(['Basic', 'Advanced', 'High'])`. The `assign-ability.post.ts` endpoint validates level >= 20 for second and level >= 40 for third.
- **Status:** CORRECT -- unchanged from P1 implementation, confirmed correct in rules-review-214.

### 4. Move Learning -- 6-Slot Limit

- **Rule:** "Pokemon may learn a maximum of 6 Moves from all sources combined." (`core/05-pokemon.md` p.200, lines 426-428)
- **Implementation:** `learn-move.post.ts` lines 100-107 enforce `currentMoves.length >= 6` when `replaceIndex` is null, requiring a valid `replaceIndex` when at capacity. The `MoveLearningPanel` (line 184) computes `hasEmptySlots` and conditionally shows "Add to Slot N" or "Replace a Move" UI.
- **H1 Fix impact:** The learn-move endpoint now includes `id: moveData.id` in the `newMove` object (line 76), and the `MoveLearningPanel` uses the real server response directly (`response.data.learnedMove as Move`, line 255) instead of creating a synthetic ID. This does not change the move slot enforcement logic.
- **Status:** CORRECT -- move slot limit enforcement is intact and unchanged by the fix cycle.

### 5. Move Learning -- Replace Workflow

- **Rule:** When a Pokemon already knows 6 moves and wants to learn a new one, it must replace an existing move. PTU does not specify which move must be replaced -- it is the player/GM's choice.
- **Implementation:** `MoveLearningPanel` provides a two-phase replace workflow: (1) click "Replace a Move" to enter replace mode, (2) click on a current move to select it as the replacement target. The `selectReplaceTarget` function (line 231) then calls `learnMove(moveName, index)`. The server validates the index bounds (line 91-96) and performs an immutable replacement via `currentMoves.map()` (line 97-99).
- **M2 Fix impact:** Replacing `watchEffect` with one-time `onMounted` initialization (lines 286-289) prevents the current moves list from being reset during the replace workflow when the parent re-renders. This is a correctness fix for the replace flow -- without it, the move indices could shift mid-workflow.
- **Status:** CORRECT -- the replace workflow correctly handles the 6-move constraint.

### 6. Stat Point Budget

- **Rule:** "add +X Stat Points, where X is the Pokemon's Level plus 10" (`core/05-pokemon.md` p.198, lines 102-104). Each level grants +1 stat point (`core/05-pokemon.md` p.202, line 563).
- **Implementation:** `useLevelUpAllocation.ts` line 60: `statBudget = pokemonRef.value.level + 10`. The `allocate-stats.post.ts` endpoint (line 136) independently calculates `budget = pokemon.level + 10` and validates the total does not exceed it (line 138).
- **Status:** CORRECT -- unchanged by fix cycle.

### 7. Base Relations Rule (decree-035)

- **Rule:** "The Base Relations Rule puts a Pokemon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points." (`core/05-pokemon.md` p.198, lines 105-110). Per decree-035: ordering uses nature-adjusted base stats, not raw species base stats.
- **Implementation:** `baseRelations.ts` `validateBaseRelations()` (lines 76-120) compares all pairs of stats from different base-value tiers. If `baseA > baseB`, then `finalA >= finalB` must hold. The function correctly handles equal base stats (they form a tier and may end up in any order). The composable uses `pokemonRef.value.baseStats` (nature-adjusted values) as the ordering reference. The server endpoint (`allocate-stats.post.ts`, line 56-63) builds `natureAdjustedBase` from the DB's `base<Stat>` fields (which store nature-adjusted values, not raw species stats).
- **extractStatPoints warnings fix:** The `extractStatPoints()` function (lines 155-212) now includes a `warnings` field that reports when a raw stat point extraction is negative (clamped to 0). This is a diagnostic improvement, not a mechanics change. Negative extractions can occur when calculated stats are below base stats due to data inconsistency, and clamping to 0 is the correct defensive behavior.
- **Status:** CORRECT -- per decree-035, this approach was ruled correct. No changes to Base Relations logic in the fix cycle.

### 8. HP Formula

- **Rule:** "Pokemon Hit Points = Pokemon Level + (HP x 3) + 10" (`core/05-pokemon.md` p.198, lines 117-118)
- **Implementation:** `allocate-stats.post.ts` line 163: `newMaxHp = pokemon.level + (newHpStat * 3) + 10`. The `extractStatPoints()` in `baseRelations.ts` line 170 reverses this: `hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)`.
- **Status:** CORRECT -- the formula matches PTU Core p.198 exactly. NOT the Trainer formula (`(level * 2) + (baseHp * 3) + 10`).

### 9. Tutor Point Schedule

- **Rule:** "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point." (`core/05-pokemon.md` p.202, lines 579-582)
- **Implementation:** `levelUpCheck.ts` line 76: `const tutorPointGained = level >= 5 && level % 5 === 0`. This correctly identifies levels 5, 10, 15, 20, 25, 30, etc.
- **Status:** CORRECT -- unchanged by fix cycle.

## Fix Cycle Issue Resolution Verification

### code-review-238 Issues

| Issue | Severity | Description | Commit | Status |
|-------|----------|-------------|--------|--------|
| C1 | CRITICAL | `categorizeAbilities()` misclassifies last ability when species has no High ability | 76831179 | RESOLVED -- `hasHighAbility` flag uses `length > numBasicAbilities + 1` |
| H1 | HIGH | MoveLearningPanel creates invalid Move objects with fake `id` via double-cast | 2ea55977 | RESOLVED -- server now includes `moveData.id` in response; client uses real response directly without double-cast |
| H2 | HIGH | PokemonLevelUpPanel uses `alert()` for error handling | 3dbe3597 | RESOLVED -- replaced with inline `errorMsg` ref and styled error container matching other panel patterns |
| M1 | MEDIUM | PokemonLevelUpPanel reuses `'allocated'` emit for ability/move events | 1b451beb | RESOLVED -- added distinct `abilityAssigned` and `moveLearned` emits with typed payloads; parent `[id].vue` wires both to `loadPokemon` |
| M2 | MEDIUM | MoveLearningPanel uses `watchEffect` causing re-sync during replace workflow | 48490659 | RESOLVED -- replaced with one-time initialization in `onMounted`; comment explains the design decision |
| M3 | MEDIUM | Duplicate `@keyframes` across AbilityAssignmentPanel and MoveLearningPanel | a02ba6b5 | RESOLVED -- `slideDown` and `spin` keyframes moved to global `main.scss`; removed from 4 components (AbilityAssignmentPanel, MoveLearningPanel, PokemonLevelUpPanel, StatAllocationPanel) |

### rules-review-214 Issues

| Issue | Severity | Description | Commit | Status |
|-------|----------|-------------|--------|--------|
| H1 | HIGH | Server allows Level 40 "third" ability assignment when Pokemon has only 1 ability | 025e6edd | RESOLVED -- server now validates `currentAbilities.length >= 2` before allowing third milestone |

**All 7 issues resolved. No regressions found.**

## Regression Check

Verified the following were not broken by the fix cycle:

1. **Ability pool computation:** The `getAbilityPool()` function still correctly calls `categorizeAbilities()` and filters by milestone category + already-held exclusion. The C1 fix only changes the internal categorization logic.
2. **Ability assignment endpoint:** The new milestone ordering check (025e6edd) is additive -- it adds a validation check before the existing `abilities.length >= 3` check, without modifying any other logic path.
3. **Move learning endpoint:** The H1 fix adds `id: moveData.id` to the `newMove` object without removing any existing fields. The response shape is expanded, not narrowed.
4. **MoveLearningPanel local state:** The M2 fix moves initialization from `watchEffect` to `onMounted`. The `onMounted` callback already existed (calling `loadMoveDetails()`), so the initialization now runs in the same lifecycle hook, maintaining correct ordering.
5. **PokemonLevelUpPanel emits:** The M1 fix changes emit names from `'allocated'` to `'abilityAssigned'`/`'moveLearned'`. The parent page (`app/pages/gm/pokemon/[id].vue`) was updated in the same commit to listen for both new event names, calling `loadPokemon` in both cases.
6. **SCSS keyframes:** The M3 fix moves `slideDown` and `spin` from scoped styles to global `main.scss`. Since these are generic animation names, they are now available globally. The scoped style blocks in the components still reference these keyframes via `animation: slideDown 0.3s ease-out` and `animation: spin 1s linear infinite`, which correctly resolve to the global definitions.

## New Issues Introduced by Fix Cycle

None found. The fix commits are surgical and do not introduce new mechanics bugs or rule violations.

## Errata Check

Reviewed `errata-2.md` for corrections relevant to the fix cycle:

- **Tutor and Inheritance Move Changes (errata-2.md lines 504-513):** Level-based restrictions on tutored/inherited moves (under Level 20: At-Will/EOT, DB 7 max; Level 20-29: Scene, DB 9 max; Level 30+: no restrictions). These apply to Tutor/Inheritance moves only, NOT to Level Up moves from learnset. The P1 implementation handles Level Up moves exclusively, so this errata does not apply. Confirmed unchanged.
- **Mixed Power errata (line 456-461):** Replaces Mixed Sweeper Poke Edge. Not relevant to level-up allocation.
- **Ability-related errata (lines 477-501):** Adds new abilities (Needles, Sequence, Eggscellence) and adjusts specific species. These affect the AbilityData table but not the categorization logic.
- No errata found affecting the Base Relations Rule, ability milestones, HP formula, or move learning mechanics.

## Decree Compliance

- **decree-035 (nature-adjusted base stats for Base Relations):** The fix cycle does not modify Base Relations validation. The `useLevelUpAllocation` composable continues to use `pokemonRef.value.baseStats` (nature-adjusted). The `allocate-stats.post.ts` endpoint builds `natureAdjustedBase` from DB `base<Stat>` fields. Per decree-035, this approach was ruled correct. Compliant.
- **decree-036 (stone evolution move learning):** Not applicable -- this decree covers evolution-triggered move learning, which is a separate system from level-up move learning. No interaction.
- No other active decrees in the pokemon-lifecycle domain affect the fix cycle.

## Summary

All 7 issues from code-review-238 (6 issues: C1, H1, H2, M1, M2, M3) and rules-review-214 (1 issue: H1) have been correctly resolved by the fix cycle's 8 commits. The fixes are targeted and surgical -- each commit addresses exactly one issue without modifying unrelated code paths. No regressions were introduced, no new PTU rule violations were found, and all verified mechanics remain correct.

The most important fix from a PTU rules perspective is the milestone ordering enforcement (025e6edd). Without it, a Pokemon at Level 40+ that skipped its Level 20 ability assignment could bypass the Basic/Advanced category restriction and directly access High abilities for what is effectively its second ability slot. This violated the implicit sequential nature of the "Second Ability" and "Third Ability" milestones described in PTU Core p.200.

The categorization boundary fix (76831179) corrects a real gameplay bug that would have affected any species with exactly `numBasicAbilities + 1` abilities -- a common configuration in the PTU Pokedex. Without the fix, these species' sole Advanced ability would be misclassified as High, making it unavailable at the Level 20 milestone and incorrectly labeled at Level 40.

## Verdict

**APPROVED** -- all mechanics are correctly implemented per PTU 1.05 rules and active decrees. All previous review issues are resolved. No new issues found. No regressions detected.

## Required Changes

None.
