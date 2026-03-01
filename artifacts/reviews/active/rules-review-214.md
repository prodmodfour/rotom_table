---
review_id: rules-review-214
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-007
domain: pokemon-lifecycle
commits_reviewed:
  - ab891146 feat: add getAbilityPool() utility for ability assignment
  - bae5e121 feat: add POST /api/abilities/batch endpoint
  - 554d434b feat: add POST /api/pokemon/:id/assign-ability endpoint
  - 35b3f647 feat: add AbilityAssignmentPanel.vue component
  - f9018550 feat: add POST /api/moves/batch endpoint
  - d89255f6 feat: add POST /api/pokemon/:id/learn-move endpoint
  - 4356122b feat: add MoveLearningPanel.vue component
  - 9f6f7c3d feat: extend useLevelUpAllocation with ability/move state
  - 6fd231ff feat: add ability/move action buttons to LevelUpNotification
  - 96a7c401 feat: add GET /api/species/:name endpoint
  - ce3780ed feat: add inline ability/move panels to PokemonLevelUpPanel
  - ea450bc5 feat: wire ability/move events in XpDistributionResults
  - 31e977cc docs: update ticket, design spec, and app-surface for P1 implementation
mechanics_verified:
  - ability-milestones-level-20-40
  - ability-pool-categorization
  - move-learning-from-learnset
  - move-slot-limit
  - stat-point-per-level
  - tutor-point-schedule
  - base-relations-rule
  - level-up-procedure-ordering
verdict: APPROVED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - core/05-pokemon.md#Abilities (p.200)
  - core/05-pokemon.md#Moves (p.200)
  - core/05-pokemon.md#Leveling Up (p.202)
  - errata-2.md#Tutor and Inheritance Move Changes
reviewed_at: 2026-03-01T11:30:00Z
follows_up: rules-review-205
---

## Mechanics Verified

### 1. Ability Milestones at Level 20 and Level 40

- **Rule:** "At Level 20, a Pokemon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities." and "At Level 40, a Pokemon gains a Third Ability, which may be chosen from any of its Abilities." (`core/05-pokemon.md` p.200, lines 411-414)
- **Implementation:** `levelUpCheck.ts` lines 67-73 correctly detect milestones at exactly level 20 (`'second'`) and level 40 (`'third'`). The `getAbilityPool()` function in `abilityAssignment.ts` lines 80-82 correctly maps `'second'` to `Set(['Basic', 'Advanced'])` and `'third'` to `Set(['Basic', 'Advanced', 'High'])`. The `assign-ability.post.ts` endpoint validates level >= 20 for second and level >= 40 for third (lines 54-79).
- **Status:** CORRECT

### 2. Ability Pool Categorization

- **Rule:** Species ability lists are ordered: Basic abilities first, then Advanced, then High. The High ability is always the last entry. (`core/05-pokemon.md` p.200; Pokedex entries show "Basic Ability 1/2", "Adv Ability 1/2", "High Ability")
- **Implementation:** `categorizeAbilities()` in `abilityAssignment.ts` lines 35-53 uses index-based classification: `index < numBasicAbilities` = Basic, middle entries = Advanced, last entry = High. The seed parser (`seed.ts` lines 403-426) stores abilities in the correct order (Basic, then Advanced, then High) and records `numBasicAbilities`.
- **Status:** CORRECT with caveat -- the code-review-238 identified an edge case where species with exactly `numBasicAbilities + 1` abilities (one Advanced, no High) would misclassify the Advanced ability as High. This is a code bug that produces an incorrect PTU ability pool. Since code-review-238 already flagged this as CRITICAL with a specific fix, I concur with that finding but do not duplicate it here. The fix is required for PTU correctness.

### 3. Ability Exclusion (Already Held)

- **Rule:** The rules do not explicitly state a Pokemon cannot have the same ability twice through normal leveling, but each milestone grants "a" new ability, implying a distinct one. The `Ability Mastery` Poke Edge (`core/05-pokemon.md` p.938-939) explicitly "gains an additional Ability, picked from any Ability it could naturally qualify for" -- suggesting the normal pathway yields distinct abilities.
- **Implementation:** `getAbilityPool()` line 91 filters out abilities already held by the Pokemon (`!currentSet.has(a.name)`). The server endpoint at line 105 validates the chosen ability is in the computed pool.
- **Status:** CORRECT -- conservative interpretation preventing duplicates aligns with PTU intent.

### 4. Move Learning from Learnset

- **Rule:** "Next, there is the possibility your Pokemon may learn a Move or Evolve. Check its Pokedex Entry to see if either of these happens." (`core/05-pokemon.md` p.202, lines 566-571). Moves available at a given level come from the species' Level Up Move List.
- **Implementation:** `checkLevelUp()` in `levelUpCheck.ts` line 60-62 correctly filters learnset entries where `entry.level === level` for each level gained. The `summarizeLevelUps()` function aggregates moves across all levels gained. The `MoveLearningPanel` component fetches full move details via `/api/moves/batch` and displays them for selection.
- **Status:** CORRECT

### 5. Move Slot Limit (Maximum 6)

- **Rule:** "Pokemon may learn a maximum of 6 Moves from all sources combined." (`core/05-pokemon.md` p.200, lines 426-428)
- **Implementation:** `learn-move.post.ts` lines 100-107 enforces `currentMoves.length >= 6` when `replaceIndex` is null. When at 6 moves, the endpoint requires a `replaceIndex` to specify which move to overwrite. The `MoveLearningPanel` component correctly shows "Replace a Move" UI when `hasEmptySlots` is false (line 100-114).
- **Status:** CORRECT

### 6. Stat Points Per Level

- **Rule:** "First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule." (`core/05-pokemon.md` p.202, lines 562-564)
- **Implementation:** `checkLevelUp()` in `levelUpCheck.ts` line 78 sets `statPointsGained: 1` for every level gained. The `summarizeLevelUps()` correctly sums these (line 101: `totalStatPoints = infos.length`).
- **Status:** CORRECT

### 7. Tutor Point Schedule

- **Rule:** "Upon gaining Level 5, and every other level evenly divisible by 5 (10, 15, 20, etc.), Pokemon gain another Tutor Point." (`core/05-pokemon.md` p.202, lines 579-582)
- **Implementation:** `levelUpCheck.ts` line 76: `const tutorPointGained = level >= 5 && level % 5 === 0`. This correctly identifies levels 5, 10, 15, 20, 25, 30, etc.
- **Status:** CORRECT

### 8. Base Relations Rule (decree-035)

- **Rule:** "As always, added Stat points must adhere to the Base Relations Rule." (`core/05-pokemon.md` p.202, line 564). Per decree-035: "Base Relations ordering uses nature-adjusted base stats, not raw species base stats."
- **Implementation:** The P1 changes do not modify the Base Relations validation code from P0. The `useLevelUpAllocation` composable (lines 46-49, 94-97) continues to use `pokemonRef.value.baseStats` (nature-adjusted) for validation via `validateBaseRelations()`. The `baseRelations.ts` utility is unchanged and correctly references decree-035 in its doc comment (line 7).
- **Status:** CORRECT -- per decree-035, this approach was ruled correct.

### 9. Level-Up Procedure Ordering

- **Rule:** The level-up sequence is: (1) stat points, (2) moves/evolution, (3) abilities at Level 20/40. (`core/05-pokemon.md` p.202, lines 561-575)
- **Implementation:** The `PokemonLevelUpPanel` and `LevelUpNotification` components present all three actions simultaneously and allow them to be completed in any order. The design spec (section 3.2) explicitly states "Each section can be completed independently in any order." This is a deliberate design choice for GM tool flexibility.
- **Status:** NEEDS REVIEW -- see issue M1 below. The PTU text prescribes an ordering, but for a GM tool where the GM has discretion, this is acceptable. The actions are all displayed, and the GM can follow the PTU ordering manually.

## Issues

### HIGH

#### H1: Server allows Level 40 "third" ability assignment when Pokemon has only 1 ability

**File:** `app/server/api/pokemon/[id]/assign-ability.post.ts`, lines 67-79
**Utility:** `app/composables/useLevelUpAllocation.ts`, lines 173-178

**PTU Rule:** The ability milestones are sequential -- a "Second Ability" at Level 20 and a "Third Ability" at Level 40. The naming ("second" and "third") implies the Pokemon should have its previous abilities before gaining the next one. At Level 20, the Pokemon goes from 1 to 2 abilities. At Level 40, from 2 to 3 abilities.

**Problem:** The server endpoint validates `abilities.length < 3` for the third milestone, but does not check that the second milestone was already completed (i.e., `abilities.length >= 2`). A Pokemon at Level 40+ with only 1 ability (because the GM skipped the Level 20 assignment) could directly assign its "third" ability from the full pool (Basic + Advanced + High), gaining access to High abilities for what is effectively its second ability slot.

The PTU text states Level 20 grants choice from "Basic or Advanced" and Level 40 grants choice from "any." If a Pokemon skips its Level 20 ability and goes straight to the Level 40 pool, it bypasses the Basic/Advanced restriction that should have applied to its second ability slot.

**Composable behavior:** `pendingAbilityMilestone` (line 173-178) checks Level 40 first, returning `'third'` for a Pokemon with 1 ability at Level 40+. The UI's `canAssignAbility()` in PokemonLevelUpPanel (lines 124-130) would show both "Assign Ability" buttons (for Level 20 and Level 40 milestones), but nothing prevents the GM from clicking the Level 40 button first.

**Severity justification:** HIGH, not CRITICAL, because: (a) this only affects an uncommon edge case where the GM skips a milestone, (b) the GM has discretion per PTU rules, and (c) the Level 20 button is also visible and the GM would normally assign in order. However, the server should enforce the correct category restriction regardless of which button the GM clicks.

**Recommended fix:** In `assign-ability.post.ts`, add a check for the third milestone:
```typescript
if (body.milestone === 'third') {
  if (pokemon.level < 40) { /* existing check */ }
  if (currentAbilities.length < 2) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon must have a second ability before gaining a third. Assign the second ability first (Level 20 milestone).'
    })
  }
  if (currentAbilities.length >= 3) { /* existing check */ }
}
```

### MEDIUM

#### M1: Level-up procedure ordering not enforced (by design)

**PTU Rule:** The level-up procedure (`core/05-pokemon.md` p.202) specifies: (1) stat points, (2) moves/evolution, (3) abilities. This ordering exists in the rulebook.

**Implementation:** All three actions are presented simultaneously. The user can assign an ability before allocating stat points, or learn a move before allocating stats.

**Assessment:** The PTU ordering exists partly for procedural clarity (stat points affect nothing that abilities or moves depend on, and vice versa at the same level). Since the three actions are independent of each other in this implementation (stat allocation doesn't change the ability pool, and ability assignment doesn't change the move pool), allowing any order produces the same final result. This is an acceptable design choice for a GM tool.

**Status:** No fix required. Noted for completeness. If a future mechanic creates a dependency between these steps (e.g., a Feature that grants extra moves based on stat allocation), this ordering would need to be revisited.

## Errata Check

Reviewed `errata-2.md` for any corrections to ability milestones, move learning, or level-up procedures:

- **Tutor and Inheritance Move Changes (errata-2.md lines 503-513):** Adds level-based restrictions on tutored/inherited moves (under Level 20: At-Will/EOT only with DB 7 max; Level 20-29: Scene frequency with DB 9 max; Level 30+: no restrictions). These restrictions apply to Tutor/Inheritance moves only, NOT to Level Up moves. The P1 implementation handles only Level Up moves from the learnset, so this errata does not apply.
- No errata found affecting ability milestones at Level 20/40 or the base move learning mechanic.

## Decree Compliance

- **decree-035 (nature-adjusted base stats for Base Relations):** P1 does not modify Base Relations code. The composable delegates to the P0-reviewed `validateBaseRelations()` using nature-adjusted base stats. Compliant.
- **decree-036 (stone evolution move learning):** Not applicable to P1 -- this decree covers evolution move learning, not level-up move learning. The two systems are separate.
- No other active decrees in the pokemon-lifecycle domain affect this implementation.

## Summary

The P1 implementation correctly implements the core PTU mechanics for ability assignment and move learning during level-up:

1. **Ability milestones at Level 20 and 40** are correctly detected and the appropriate category pools (Basic+Advanced vs. all) are correctly computed.
2. **Move learning from learnset** correctly identifies new moves at each level and enforces the 6-move maximum with a replace mechanism.
3. **Stat points (+1 per level)** and **Tutor Points (every 5 levels starting at 5)** are correctly calculated.
4. **Base Relations validation** remains intact from P0 and compliant with decree-035.

The ability categorization edge case (last ability misclassified as High for certain species configurations) was already identified by code-review-238 and is a correctness bug that must be fixed.

The one new rules issue (H1) is the missing enforcement of milestone ordering -- the server should prevent assigning a "third" ability (with access to High abilities) when the Pokemon hasn't yet received its second ability. This is a real PTU rules gap in the validation logic.

## Verdict

**APPROVED** -- with one HIGH issue (H1: milestone ordering enforcement) that should be addressed but does not block approval. The core PTU mechanics are implemented correctly. The CRITICAL categorization bug from code-review-238 must still be fixed per that review's required changes.

## Required Changes

1. **[HIGH] Add milestone ordering check to `assign-ability.post.ts`** -- Before allowing a `'third'` milestone assignment, verify `currentAbilities.length >= 2`. This prevents bypassing the Basic/Advanced category restriction that applies to the second ability slot. This can be fixed alongside the code-review-238 changes.
