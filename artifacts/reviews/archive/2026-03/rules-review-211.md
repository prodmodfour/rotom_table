---
review_id: rules-review-211
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-008
domain: trainer-lifecycle
commits_reviewed:
  - 5fe64bc
  - 28c0bcd
  - c668d16
  - 6070eaf
  - 99b106b
  - 55c01d1
  - 087ea29
  - 83fd0aa
  - 576634c
  - 0714016
  - 3f7350a
  - 85c2851
mechanics_verified:
  - trainer-stat-allocation-per-level
  - trainer-hp-formula
  - trainer-evasion-cap
  - trainer-hp-healing-on-level-up
  - skill-rank-removal-decree-037
  - milestone-definitions
  - bonus-skill-edge-tracking
  - multi-level-jump-accumulation
  - double-modal-guard
  - constant-deduplication
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Character-Advancement (pp.19-21)
  - core/02-character-creation.md#Derived-Stats (p.15)
  - core/03-skills-edges-and-features.md#Edges (p.52)
  - core/03-skills-edges-and-features.md#Skills (pp.33-34)
reviewed_at: 2026-03-01T05:30:00Z
follows_up: rules-review-206
---

## Re-Review Context

This is a follow-up to rules-review-206 (CHANGES_REQUIRED) and code-review-230 (CHANGES_REQUIRED) after a 12-commit fix cycle. The fix cycle addressed:

- **C1:** Double modal open from watcher re-trigger
- **H1:** Evasion preview missing +6 cap
- **H2:** currentHp not healed when trainer was at full HP on level-up
- **M1-M2:** RANK_PROGRESSION and STAT_DEFINITIONS duplicated in multiple files
- **M3:** app-surface.md missing trainer level-up entries
- **rules-review-206 HIGH-01:** Automatic skill rank per level contradicts PTU RAW -- resolved by decree-037 (skill ranks from Edge slots only)

## Decree Compliance

### decree-037 (skill ranks via Edge slots only)

**Rule:** "Skill ranks come from Edge slots only, not automatic per-level grants." PTU Core p.19 defines three per-level gains: Stat Points, Features, Edges. Skill ranks are purchased by spending Edge slots on Skill Edges (Core p.52).

**Verification:**

1. **`trainerAdvancement.ts`:** `skillRanksGained` property completely removed from `TrainerLevelUpInfo` interface and `computeTrainerLevelUp()` function. The only skill-related properties that remain are `skillRankCapUnlocked` (informational: tracks when Adept/Expert/Master caps unlock at L2/L6/L12) and `bonusSkillEdge` (tracks when a bonus Skill Edge is granted at L2/L6/L12). Neither of these grant automatic skill ranks -- they track entitlements that will be resolved in P1 Edge selection. **Compliant.**

2. **`TrainerAdvancementSummary`:** No `totalSkillRanks` field. The summary tracks `skillRankCapsUnlocked` and `bonusSkillEdges` as informational data. **Compliant.**

3. **`useTrainerLevelUp.ts`:** No skill rank computed properties (`skillRanksTotal`, `skillRanksRemaining`, `skillChoices`, `addSkillRank`, `removeSkillRank`). The composable header comment explicitly states: "Per decree-037, skill rank allocation is NOT part of level-up. Skill ranks come from Skill Edges only." **Compliant.**

4. **`LevelUpModal.vue`:** The wizard steps are `['stats', 'summary']`. No `'skills'` step. No import or usage of `LevelUpSkillSection`. The P1 comments reference edges (which will include Skill Edge rank allocation per decree-037). **Compliant.**

5. **`LevelUpSummary.vue`:** No skill rank change display. The P1 indicators correctly note: "bonus Skill Edge(s) to select -- grants skill ranks (P1)" -- this accurately describes the PTU RAW mechanism (Edge slots grant skill ranks, not automatic per-level). **Compliant.**

6. **`LevelUpSkillSection.vue`:** File still exists on disk but is dead code -- not imported or used by any component. The app-surface.md documents it as "disabled per decree-037, retained for P1 Edge integration." This is acceptable as it will be repurposed for P1. **Compliant.**

**Verdict:** decree-037 fully respected. All automatic skill rank grants removed. The only remaining skill-related code is informational cap tracking and the dead `LevelUpSkillSection.vue` component preserved for P1.

### decree-022 (branching class suffix)

P0 does not implement class selection. The `classChoicePrompt` flag at levels 5/10 is informational only. **No conflict.**

### decree-026 (Martial Artist not branching)

P0 does not reference `trainerClasses.ts` or any class data. **No conflict.**

### decree-027 (Pathetic skill edge block -- creation only)

P0 no longer has skill rank allocation (per decree-037). The `LevelUpSkillSection.vue` dead code still respects decree-027 correctly (allows Pathetic rank-ups during level-up, not creation). **No conflict.**

---

## Mechanics Verified

### 1. Stat Points Per Level (re-confirmed)

- **Rule:** "Every Level you gain a Stat Point. Trainers don't follow Base Relations, so feel free to spend these freely." (`core/02-character-creation.md`, p.19, lines 517-519)
- **Implementation:** `computeTrainerLevelUp()` returns `statPointsGained: 1` for every level. `useTrainerLevelUp` sums these across levels and provides `statPointsTotal` / `statPointsRemaining` for UI binding. No per-stat cap is enforced after level 1 (correct for trainers).
- **Status:** CORRECT

### 2. Edges Per Level (re-confirmed)

- **Rule:** "Every even Level you gain an Edge." (`core/02-character-creation.md`, p.19, line 523)
- **Implementation:** `edgesGained: isEven ? 1 : 0`. Verified against progression table: L2=1, L3=0, L4=1, L5=0, L6=1, etc.
- **Status:** CORRECT (P0 tracks count, defers selection to P1)

### 3. Features Per Level (re-confirmed)

- **Rule:** "Every odd Level you gain a Feature." (`core/02-character-creation.md`, p.19, line 521)
- **Implementation:** `featuresGained: (isOdd && level >= 3) ? 1 : 0`. Level 1 is never computed (advancement starts at `fromLevel + 1`). Level 2 (even) = 0. Level 3 (odd, >=3) = 1.
- **Verification against table:** L3=1, L5=1, L7=1, L9=1. `getExpectedFeaturesForLevel(50)` = 29, matches table at L50.
- **Status:** CORRECT (P0 tracks count, defers selection to P1)

### 4. Trainer HP Formula (re-confirmed)

- **Rule:** "Trainers have Hit Points equal to (Trainer Level x2) + (HP x3) + 10." (`core/02-character-creation.md`, p.15, line 309; repeated p.18, lines 480-481)
- **Implementation:** `updatedMaxHp = newLevel.value * 2 + updatedStats.value.hp * 3 + 10` (`useTrainerLevelUp.ts`, line 137). Uses the updated HP stat (current + level-up allocations) and the new level.
- **Status:** CORRECT

### 5. Evasion Cap at +6 (H1 fix verified)

- **Rule:** "To calculate these Evasion values, divide the related Combat Stat by 5 and round down. You may never have more than +6 in a given Evasion from Combat Stats alone." (`core/02-character-creation.md`, p.15, lines 313-315)
- **Implementation:** `LevelUpStatSection.vue` lines 111-113:
  ```typescript
  physical: Math.min(Math.floor(def / 5), 6),
  special: Math.min(Math.floor(spDef / 5), 6),
  speed: Math.min(Math.floor(spd / 5), 6)
  ```
  All three evasion calculations now include `Math.min(..., 6)`. A trainer with Defense 35 would show Physical Evasion of 6 (capped), not 7.
- **Prior issue:** rules-review-206 did not flag this (code-review-230 H-01 caught it). The evasion formula itself was correct; the cap was missing.
- **Status:** CORRECT -- H1 resolved

### 6. HP Healing on Level-Up (H2 fix verified)

- **Rule:** PTU RAW does not explicitly state what happens to currentHp on level-up. This is a design decision.
- **Implementation:** `useTrainerLevelUp.ts` lines 153-156:
  ```typescript
  const wasAtFullHp = character.value.currentHp >= (character.value.maxHp ?? 0)
  const newCurrentHp = wasAtFullHp
    ? newMaxHp
    : Math.min(character.value.currentHp, newMaxHp)
  ```
  If the trainer was at full HP before level-up, they are set to full HP after. If they were damaged, their currentHp is clamped to the new maxHp (preventing overshoot) but not reduced below its current value.
- **Analysis:** This is a reasonable design choice. A trainer at 42/42 HP who levels up to 50 maxHp will have 50/50 HP. A trainer at 30/42 HP who levels up to 50 maxHp will have 30/50 HP. The clamping is technically unnecessary in the "not at full HP" case (since maxHp can only increase on level-up), but it's a defensive guard that prevents no harm.
- **Status:** CORRECT -- H2 resolved. No PTU rule contradiction.

### 7. Bonus Skill Edges at L2/L6/L12 (re-confirmed)

- **Rule:** Level 2: "You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank." Level 6: cannot raise to Expert. Level 12: cannot raise to Master. (`core/02-character-creation.md`, pp.19-21, lines 530-563)
- **Implementation:** `bonusSkillEdge: [2, 6, 12].includes(level)`. The restriction (cannot use bonus Skill Edge to rank up to the newly unlocked cap) is tracked but deferred to P1 Edge selection UI.
- **Status:** CORRECT (P0 tracks flag, P1 will enforce restrictions)

### 8. Milestone Definitions (re-confirmed)

- **Rule (Amateur, L5):** Choose: (a) +1 Atk/SpAtk on even levels 6-10, plus +2 retroactive for L2/L4; or (b) one General Feature. (`core/02-character-creation.md`, p.19, lines 536-544)
- **Rule (Capable, L10):** Choose: (a) +1 Atk/SpAtk on even levels 12-20; or (b) two Edges. (p.19, lines 551-557)
- **Rule (Veteran, L20):** Choose: (a) +1 Atk/SpAtk on even levels 22-30; or (b) two Edges. (p.19, lines 564-570)
- **Rule (Elite, L30):** Choose: (a) +1 Atk/SpAtk on even levels 32-40; or (b) two Edges; or (c) one General Feature. (p.19, lines 571-579)
- **Rule (Champion, L40):** Choose: (a) +1 Atk/SpAtk on even levels 42-50; or (b) two Edges; or (c) one General Feature. (p.19, lines 580-588)
- **Implementation:** `getMilestoneAt()` in `trainerAdvancement.ts` matches all five milestones exactly:
  - Amateur (L5): 2 choices -- lifestyle stats (range [6,10], retroactive 2) or general feature. CORRECT.
  - Capable (L10): 2 choices -- lifestyle stats (range [12,20]) or 2 bonus edges. CORRECT.
  - Veteran (L20): 2 choices -- lifestyle stats (range [22,30]) or 2 bonus edges. CORRECT.
  - Elite (L30): 3 choices -- lifestyle stats (range [32,40]), 2 bonus edges, or general feature. CORRECT.
  - Champion (L40): 3 choices -- lifestyle stats (range [42,50]), 2 bonus edges, or general feature. CORRECT.
- **Status:** CORRECT

### 9. Multi-Level Jump Accumulation (re-confirmed)

- **Rule:** Not explicitly stated in PTU (level-up is typically one at a time), but the design spec mandates accumulating all intervening rewards.
- **Implementation:** `computeTrainerAdvancement(fromLevel, toLevel)` iterates `fromLevel + 1` through `Math.min(toLevel, 50)`. Level cap at 50 enforced. Example: L3->L7 computes levels 4, 5, 6, 7 = 4 stat points, 0 skill ranks (removed per decree-037), 2 edges (L4, L6), 2 features (L5, L7), 1 milestone (Amateur at L5), 1 bonus Skill Edge (L6), Expert cap unlocked (L6), 1 class choice prompt (L5).
- **Status:** CORRECT

### 10. Double Modal Guard (C1 fix verified)

- **Rule:** N/A (UX correctness, not PTU mechanics)
- **Implementation:** Both `CharacterModal.vue` and `gm/characters/[id].vue` now have an `isApplyingLevelUp` ref:
  - The level watcher checks `if (isApplyingLevelUp.value) return` as its first guard.
  - `onLevelUpComplete` sets `isApplyingLevelUp.value = true` before applying the updated data, then resets to `false` after `await nextTick()`.
  - This prevents the watcher from re-triggering when the level is updated from the modal's result.
- **Pattern verified in both files:**
  - `gm/characters/[id].vue` lines 330-355: Guard present, `isApplyingLevelUp` set before data merge, reset after `nextTick()`.
  - `CharacterModal.vue` lines 342-368: Identical pattern with Pokemon guard (`isPokemon.value`).
- **Status:** CORRECT -- C1 resolved

### 11. Shared Constants (M1-M2 fix verified)

- **Rule:** N/A (code quality)
- **Implementation:** `constants/trainerStats.ts` now exports:
  - `STAT_DEFINITIONS`: shared by `LevelUpStatSection.vue`, `LevelUpSummary.vue`, and `StatAllocationSection.vue` (import verified in both level-up components).
  - `RANK_PROGRESSION`: shared constant, currently only referenced in comment and dead `LevelUpSkillSection.vue`.
- **Status:** CORRECT -- M1/M2 resolved

### 12. Skill Rank Cap Functions (re-confirmed)

- **Rule:** "Adept Rank requires Level 2. Expert Rank requires Level 6, and Master Rank requires Level 12." (`core/03-skills-edges-and-features.md`, p.34)
- **Implementation:** `getMaxSkillRankForLevel()` returns Novice for L1, Adept for L2-5, Expert for L6-11, Master for L12+. `isSkillRankAboveCap()` correctly compares rank indices. These functions remain in `trainerStats.ts` for use by the character creation flow and future P1 Edge selection.
- **Status:** CORRECT

---

## Prior Issue Resolution

| Issue | Severity | Resolution | Verified |
|-------|----------|------------|----------|
| C1: Double modal open | CRITICAL | `isApplyingLevelUp` guard in both integration points | YES -- guard present in both files, uses `nextTick()` reset |
| H1: Evasion cap missing | HIGH | `Math.min(..., 6)` on all three evasion calculations | YES -- lines 111-113 of `LevelUpStatSection.vue` |
| H2: currentHp not healed at full HP | HIGH | `wasAtFullHp` detection in `buildUpdatePayload()` | YES -- lines 153-156 of `useTrainerLevelUp.ts` |
| HIGH-01: Automatic skill rank per level | HIGH | Removed per decree-037 | YES -- `skillRanksGained` gone from utility, composable, modal, summary |
| M1: RANK_PROGRESSION duplicated | MEDIUM | Extracted to `constants/trainerStats.ts` | YES -- single source of truth |
| M2: STAT_DEFINITIONS duplicated | MEDIUM | Extracted to `constants/trainerStats.ts` | YES -- imported by both level-up components |
| M3: app-surface.md not updated | MEDIUM | Updated with all trainer level-up files | YES -- line 88 of `app-surface.md` |

---

## Rulings

1. **Stat allocation per level:** CORRECT. PTU grants +1 stat point per level with no per-stat cap for trainers. Implementation matches RAW exactly.

2. **HP formula:** CORRECT. `level * 2 + hp_stat * 3 + 10` matches PTU Core p.15 and p.18 exactly.

3. **Evasion preview with cap:** CORRECT. Uses calculated stats (current + pending allocations), not base stats. Capped at +6 per PTU Core p.15.

4. **Skill rank grants removed:** CORRECT per decree-037. PTU RAW does not grant free skill ranks per level; they come from Edge slots. The implementation now correctly omits any automatic skill rank allocation. Skill rank progression will be part of P1 Edge selection.

5. **Milestone definitions:** CORRECT. All five milestones (Amateur L5, Capable L10, Veteran L20, Elite L30, Champion L40) match PTU RAW for choice options, level ranges, retroactive points, and edge/feature counts.

6. **Bonus Skill Edges:** CORRECT. Tracked at levels 2, 6, 12 with the flag `bonusSkillEdge`. Restrictions (cannot rank up to newly unlocked cap) are correctly deferred to P1.

7. **HP healing on level-up:** ACCEPTABLE design decision. PTU RAW is silent on currentHp changes during level-up. The implementation's approach (full HP if was at full, else clamped) is intuitive and non-destructive.

---

## Summary

All six issues from code-review-230 and the one issue from rules-review-206 have been properly resolved in the 12-commit fix cycle. The implementation now correctly matches PTU 1.05 RAW for trainer level-up mechanics:

- **Per-level grants:** +1 Stat Point (every level), +1 Edge (even levels), +1 Feature (odd levels from L3+). No automatic skill ranks (per decree-037).
- **HP formula:** `level * 2 + hp * 3 + 10` -- exact match to PTU Core p.15.
- **Evasion:** `floor(stat / 5)` capped at +6 -- exact match to PTU Core p.15.
- **Milestones:** All five match RAW exactly (choice options, level ranges, retroactive points, edge/feature counts).
- **Skill rank caps:** Correctly tracked at L2 (Adept), L6 (Expert), L12 (Master).
- **Bonus Skill Edges:** Correctly tracked at L2, L6, L12 (selection deferred to P1).

All four applicable decrees (022, 026, 027, 037) are respected. No errata corrections apply to trainer advancement mechanics.

---

## Verdict

**APPROVED**

The trainer level-up milestone workflow P0 implementation is mechanically correct per PTU 1.05 RAW and compliant with all applicable decrees. All issues from the prior review cycle have been resolved. No new issues found.

---

## Required Changes

None.
