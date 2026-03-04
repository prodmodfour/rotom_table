---
review_id: rules-review-206
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-008
domain: character-lifecycle
commits_reviewed:
  - cdcc7d8
  - 8c83b02
  - f40ce4a
  - da2b849
  - 33394c7
  - 16aad2d
  - 6a767e0
  - 45a1df8
  - 684e6f5
mechanics_verified:
  - trainer-stat-allocation-per-level
  - trainer-skill-rank-allocation
  - trainer-hp-formula
  - trainer-evasion-calculation
  - skill-rank-cap-enforcement
  - multi-level-jump-accumulation
  - milestone-definitions
  - lifestyle-stat-points
  - body-mind-spirit-skill-grouping
  - pathetic-skill-handling-during-levelup
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
ptu_refs:
  - core/02-character-creation.md#Character-Advancement (pp.19-21)
  - core/03-skills-edges-and-features.md#Edges (p.52)
  - core/03-skills-edges-and-features.md#Skills (pp.33-34)
  - errata-2.md (no relevant errata found)
reviewed_at: 2026-02-28T22:15:00Z
follows_up: null
---

## Mechanics Verified

### 1. Stat Points Per Level
- **Rule:** "Every Level you gain a Stat Point. Trainers don't follow Base Relations, so feel free to spend these freely." (`core/02-character-creation.md`, p.19, lines 517-519)
- **Implementation:** `computeTrainerLevelUp()` returns `statPointsGained: 1` for every level. The `useTrainerLevelUp` composable sums these across levels and provides `statPointsTotal` / `statPointsRemaining` for UI binding. Stat allocations are unbounded per-stat (no cap after level 1).
- **Status:** CORRECT

### 2. Edges Per Level
- **Rule:** "Every even Level you gain an Edge." (`core/02-character-creation.md`, p.19, line 523)
- **Implementation:** `edgesGained: isEven ? 1 : 0` in `computeTrainerLevelUp()`. Verified against progression table: L2=1, L3=0, L4=1, L5=0, L6=1, etc.
- **Status:** CORRECT (P0 tracks count but defers selection to P1)

### 3. Features Per Level
- **Rule:** "Every odd Level you gain a Feature." (`core/02-character-creation.md`, p.19, line 521). Level 1 features are character creation (4+1 Training Feature), not level-up.
- **Implementation:** `featuresGained: (isOdd && level >= 3) ? 1 : 0`. Level 1 is never computed (advancement starts at `fromLevel + 1`). Level 2 (even) = 0. Level 3 (odd, >=3) = 1.
- **Verification against table:** L3=1, L5=1, L7=1, L9=1. `getExpectedFeaturesForLevel(50)` = 29, matches table.
- **Status:** CORRECT (P0 tracks count but defers selection to P1)

### 4. Bonus Skill Edges
- **Rule:** Levels 2, 6, 12 each grant a bonus Skill Edge with restricted use. Level 2: "You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank." Level 6: cannot raise to Expert. Level 12: cannot raise to Master. (`core/02-character-creation.md`, pp.19, lines 530-563)
- **Implementation:** `bonusSkillEdge: [2, 6, 12].includes(level)`. Levels match RAW exactly.
- **Status:** CORRECT (P0 tracks flag but defers Edge selection to P1)

### 5. Skill Rank Caps by Level
- **Rule:** "Adept Rank requires Level 2. Expert Rank requires Level 6, and Master Rank requires Level 12." (`core/03-skills-edges-and-features.md`, p.34, lines 68-71)
- **Implementation:** `getMaxSkillRankForLevel()` in `trainerStats.ts` returns Novice for L1, Adept for L2-5, Expert for L6-11, Master for L12+. `isSkillRankAboveCap()` compares rank index against max rank index. `canRankUpSkill()` uses the **target level** (not starting level) for cap checks.
- **Status:** CORRECT

### 6. Trainer HP Formula
- **Rule:** "Trainers have Hit Points equal to (Trainer Level x2) + (HP x3) + 10." (`core/02-character-creation.md`, p.18, lines 480-481)
- **Implementation:** `updatedMaxHp = newLevel.value * 2 + updatedStats.value.hp * 3 + 10` (`useTrainerLevelUp.ts`, line 201). Uses the updated HP stat (current + level-up allocations) and the new level.
- **Status:** CORRECT

### 7. Evasion Preview Calculation
- **Rule:** Evasion = `floor(calculatedStat / 5)` using calculated stats per system instructions.
- **Implementation:** `LevelUpStatSection.vue` (lines 112-121) computes `Math.floor((currentStats.defense + allocations.defense) / 5)` for physical, and equivalent for special/speed. Uses the total calculated stat (existing + pending allocations), not base stats.
- **Status:** CORRECT

### 8. Milestone Definitions
- **Rule (Amateur, Level 5):** Choose: (a) +1 Atk/SpAtk on even levels 6-10, plus +2 retroactive for L2/L4; or (b) one General Feature. (`core/02-character-creation.md`, p.19, lines 536-544)
- **Rule (Capable, Level 10):** Choose: (a) +1 Atk/SpAtk on even levels 12-20; or (b) two Edges. (p.19, lines 551-557)
- **Rule (Veteran, Level 20):** Choose: (a) +1 Atk/SpAtk on even levels 22-30; or (b) two Edges. (p.19, lines 564-570)
- **Rule (Elite, Level 30):** Choose: (a) +1 Atk/SpAtk on even levels 32-40; or (b) two Edges; or (c) one General Feature. (p.19, lines 571-579)
- **Rule (Champion, Level 40):** Choose: (a) +1 Atk/SpAtk on even levels 42-50; or (b) two Edges; or (c) one General Feature. (p.19, lines 580-588)
- **Implementation:** `getMilestoneAt()` in `trainerAdvancement.ts` matches all five milestones exactly. Choice counts, level ranges, retroactive points, and option types all match RAW.
- **Status:** CORRECT

### 9. Lifestyle Stat Point Calculation
- **Rule:** Amateur stats option: +1 on even levels {6, 8, 10} = 3, plus 2 retroactive = 5 total.
- **Implementation:** `calculateLifestyleStatPoints()` iterates even levels in range, adds retroactive. Verified: Amateur at L10 yields 3+2=5. Partial calculation at L7 yields 1+2=3.
- **Status:** CORRECT

### 10. Body/Mind/Spirit Skill Grouping
- **Rule:** Body: Acrobatics, Athletics, Combat, Intimidate, Stealth, Survival. Mind: General Education, Medicine Education, Occult Education, Pokemon Education, Technology Education, Guile, Perception. Spirit: Charm, Command, Focus, Intuition. (`core/03-skills-edges-and-features.md`, p.33, lines 22-31)
- **Implementation:** `PTU_SKILL_CATEGORIES` in `trainerSkills.ts` matches exactly (Education abbreviated to "Ed" for display, which is a UI convention, not a rule violation).
- **Status:** CORRECT

### 11. Multi-Level Jump Accumulation
- **Rule:** Not explicitly stated in PTU (level-up is typically one level at a time), but the design spec mandates accumulating all intervening rewards.
- **Implementation:** `computeTrainerAdvancement(fromLevel, toLevel)` iterates `fromLevel + 1` through `toLevel` (capped at 50). `summarizeTrainerAdvancement()` sums all per-level values. Example: L3->L7 computes levels 4, 5, 6, 7 = 4 stat points, 4 skill ranks, 2 edges (L4, L6), 2 features (L5, L7), 1 milestone (Amateur at L5), 1 bonus skill edge (L6), Expert cap unlocked (L6).
- **Status:** CORRECT

### 12. Pathetic Skill Handling During Level-Up
- **Rule:** Per decree-027, Pathetic skills cannot be raised during **character creation** only. Post-creation, the Basic Skills Edge description (p.41) applies and allows Pathetic-to-Untrained progression.
- **Implementation:** `canRankUpSkill()` checks only the level-based cap, not whether the skill is Pathetic. If a Pathetic skill's next rank (Untrained) is below the level cap, the rank-up is allowed. This is explicitly noted in the design spec (line 630).
- **Status:** CORRECT (per decree-027)

### 13. Decree Compliance
- **decree-022 (branch class handling):** P0 does not implement class selection. The `classChoicePrompt` flag at levels 5/10 is informational only. No class data is manipulated. No conflict.
- **decree-026 (Martial Artist not branching):** P0 does not reference `trainerClasses.ts`. No conflict.
- **decree-027 (Pathetic skill edge block):** P0 correctly allows Pathetic skill rank-ups during level-up (not creation). The composable's comment at line 12 explicitly cites decree-027 as the reason for differing from character creation behavior. No conflict.
- **Status:** CORRECT -- all three decrees respected.

---

## Issues Found

### HIGH-01: Automatic Skill Rank Per Level Contradicts PTU RAW

**Severity:** HIGH
**Mechanic:** Skill rank allocation
**File:** `app/utils/trainerAdvancement.ts`, line 251 (`skillRanksGained: 1`)
**File:** `app/composables/useTrainerLevelUp.ts`, lines 87-95 (skill rank total/remaining)
**File:** `app/components/levelup/LevelUpSkillSection.vue` (entire skill allocation UI)

**Rule (PTU Core p.19, lines 516-523):**
> Every Level you gain a Stat Point. Trainers don't follow Base Relations, so feel free to spend these freely.
> Every odd Level you gain a Feature.
> Every even Level you gain an Edge.

**Rule (PTU Core p.52, lines 1233-1235):**
> You gain 4 Edges during character creation, another at every even Level, and additional Edges with restricted uses at every Level at which your maximum Skill Rank increases. Most likely, the vast majority of Edges will be to increase Skill Ranks...

**Analysis:** PTU does NOT grant a free skill rank per level. Skill ranks are advanced by **spending Edge slots** on Skill Edges (Basic Skills, Adept Skills, Expert Skills, Master Skills). The per-level advancement grants are: Stat Point (every level), Edge (every even level), Feature (every odd level from 3+). The book explicitly notes that "the vast majority of Edges will be to increase Skill Ranks," but this is a **player choice**, not an automatic entitlement.

The implementation treats `skillRanksGained: 1` as an automatic per-level grant, separate from Edge slots. This creates a risk of **double-counting** when P1 adds Edge selection: the trainer would get both a free skill rank AND an Edge that could also be spent on a Skill Edge, resulting in more skill ranks than PTU RAW allows.

**Why not CRITICAL:** The design spec explicitly made this decision (spec-p0.md line 24: "Skill ranks gained this level (always 1 -- feature or general, GM decides)"), suggesting this may be an intentional simplification or the designer's interpretation. However, it contradicts PTU RAW and will cause accounting problems when P1 Edge selection is implemented. The correct PTU approach would be: trainers use their Edge slots (from even levels and bonus Skill Edges at 2/6/12) to purchase Skill Edges, which then raise skill ranks.

**Recommendation:** File a `decree-need` ticket to get a human ruling on whether this is an intentional house rule or an error. If it is an error, `skillRanksGained` should be removed from the per-level entitlements and skill rank allocation should be handled as part of Edge selection in P1. If it is intentional (a convenience simplification for the app), it should be documented as a house rule in a decree.

### MEDIUM-01: currentHp Not Increased on Level-Up

**Severity:** MEDIUM
**Mechanic:** HP update on level-up
**File:** `app/composables/useTrainerLevelUp.ts`, line 237

**Implementation:**
```typescript
currentHp: Math.min(character.value.currentHp, newMaxHp)
```

**Analysis:** When leveling up, `currentHp` is clamped to `newMaxHp` but never increased. If a trainer has 20/30 HP and levels up to a new max of 35, their currentHp stays at 20. This is a reasonable conservative default, but many GMs would expect leveling up to heal the trainer to full or at least increase currentHp by the maxHp delta.

PTU RAW does not explicitly state what happens to currentHp on level-up. The design spec (spec-p0.md line 968) says "currentHp is clamped to the new maxHp" and notes it "should not be reduced below its current value unless it was already above the new max."

**Impact:** This is a GM workflow concern, not a formula error. The GM can manually adjust currentHp after saving. However, the most common expectation in tabletop play is that level-ups occur between adventures (during rests), so full HP is typical.

**Recommendation:** Consider adding a checkbox to the summary step: "Restore HP to new maximum?" defaulting to checked. This would set `currentHp: newMaxHp` when checked. Low priority since the GM can manually adjust.

### MEDIUM-02: Level-Up Watch Could Fire on Same-Value Reassignment in CharacterModal

**Severity:** MEDIUM
**Mechanic:** Level-up detection
**File:** `app/components/character/CharacterModal.vue` (diff line 338+)

**Implementation:**
```typescript
watch(() => editData.value.level, (newVal, oldVal) => {
  if (isPokemon.value || !isEditing.value) return
  if (typeof newVal !== 'number' || typeof oldVal !== 'number') return
  if (newVal <= oldVal) return
  editData.value = { ...editData.value, level: oldVal }
  ...
})
```

**Analysis:** The watch reverting `editData.value.level` back to `oldVal` on line 345 could potentially cause the watch to fire again (detecting a change from the intermediate value back to oldVal). In practice, Vue's watch deduplication and the `newVal <= oldVal` guard should prevent an infinite loop, because the revert sets `newVal = oldVal`, which fails the `newVal <= oldVal` check (since they'd be equal). The guard is `newVal <= oldVal`, meaning equal values return early. This is safe.

However, there is an edge case: if the watcher fires synchronously during the assignment (before the next tick), the intermediate state could cause a race condition. Vue 3's watcher scheduling (flush: 'pre' by default for `watch()`) should prevent this, but the revert-then-reassign pattern is fragile.

**Recommendation:** Consider using `{ flush: 'post' }` or a `nextTick()` guard to make the revert timing explicit. Alternatively, use a `watchPostEffect` or a flag to disable the watcher during revert. This is a robustness concern, not a rules issue.

---

## Rulings

1. **Stat allocation per level:** CORRECT. PTU grants +1 stat point per level with no per-stat cap for trainers. Implementation matches.

2. **HP formula:** CORRECT. `level * 2 + hp_stat * 3 + 10` matches PTU p.18 exactly.

3. **Evasion preview:** CORRECT. Uses calculated stats (current + pending allocations), not base stats.

4. **Skill rank cap enforcement:** CORRECT. Caps at Novice (L1), Adept (L2+), Expert (L6+), Master (L12+). Uses target level for cap checks during multi-level jumps.

5. **Milestone definitions:** CORRECT. All five milestones (Amateur L5, Capable L10, Veteran L20, Elite L30, Champion L40) match PTU RAW for choice options, level ranges, and retroactive points.

6. **Skill grouping:** CORRECT. Body (6 skills), Mind (7 skills), Spirit (4 skills) match PTU p.33 exactly.

7. **Automatic skill ranks per level:** NEEDS DECREE. PTU RAW does not grant free skill ranks; they come from Edge slots. The design spec explicitly chose `skillRanksGained: 1` per level, which may be intentional but risks double-counting with P1 Edge selection. Filing a decree-need ticket.

8. **Pathetic skill rank-ups during level-up:** CORRECT per decree-027. The decree only restricts Pathetic skill rank-ups during character creation. Post-creation level-ups allow them.

---

## Summary

The P0 implementation of the trainer level-up milestone workflow is mechanically sound for the core formulas: stat allocation, HP calculation, evasion preview, skill rank caps, milestone definitions, and multi-level accumulation all match PTU 1.05 RAW exactly. The code structure cleanly separates pure logic (`trainerAdvancement.ts`) from reactive state (`useTrainerLevelUp.ts`) from UI components, making verification straightforward.

The one significant issue is HIGH-01: the design grants `skillRanksGained: 1` per level as an automatic entitlement, but PTU RAW only grants stat points, edges, and features per level -- skill ranks are purchased by spending Edge slots on Skill Edges. This is baked into the design spec and may be intentional, but it risks double-counting when P1 adds Edge selection. A decree-need ticket should resolve the ambiguity.

All three applicable decrees (022, 026, 027) are respected by the P0 implementation.

---

## Verdict

**CHANGES_REQUIRED**

The implementation cannot be approved until HIGH-01 is resolved via a decree ruling. If the human rules that automatic skill ranks are an intentional house rule, the implementation is correct as-is and the decree should document the deviation from PTU RAW. If the human rules it is an error, the skill rank allocation step should be removed from P0 and handled as part of P1 Edge selection.

No blocking code changes are needed immediately -- only a decree ruling is needed.

---

## Required Changes

1. **HIGH-01 (decree-need):** File `artifacts/tickets/open/decree/decree-need-028.md` to get a human ruling on whether trainers receive an automatic +1 skill rank per level (implementation) or whether skill ranks are exclusively purchased via Edge slots (PTU RAW). The ruling determines whether the P0 skill allocation step is correct or needs to be deferred to P1.

2. **MEDIUM-01 (optional):** Consider adding a "Restore HP to full" option on the summary step. Not blocking.

3. **MEDIUM-02 (optional):** Consider adding `{ flush: 'post' }` to the level-up watch for robustness. Not blocking.
