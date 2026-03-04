---
review_id: rules-review-267
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-008
domain: character-lifecycle
commits_reviewed:
  - 3fdc1c21
  - 5779f595
  - 5cae0db8
mechanics_verified:
  - skill-edge-rank-ups-regular
  - skill-edge-rank-ups-bonus
  - skill-rank-cap-enforcement
  - effective-skills-unified-tracking
  - trainer-hp-on-level-up
  - milestone-definitions
  - decree-037-compliance
  - decree-022-compliance
  - decree-026-compliance
  - decree-027-compliance
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Character-Advancement (pp.19-21)
  - core/03-skills-edges-and-features.md#Edges (p.52)
  - core/03-skills-edges-and-features.md#Skill-Edges (pp.52-53)
  - errata-2.md (no relevant errata found)
reviewed_at: 2026-03-02T22:30:00Z
follows_up: rules-review-206
---

## Previous Issues Status

### rules-review-206 HIGH-01: Automatic Skill Rank Per Level Contradicts PTU RAW
**Status:** RESOLVED via decree-037

decree-037 ruled: "Skill ranks come from Edge slots only, not automatic per-level grants." The `skillRanksGained` field was removed from `trainerAdvancement.ts` (confirmed absent in current code). The `LevelUpSkillSection.vue` standalone skill step was removed. The LevelUpModal step order (line 190) explicitly comments: "Per decree-037 no standalone skill step, skill ranks come from Skill Edges." Skill rank allocation now happens exclusively through the Edge selection step, where the GM can choose Skill Edges (both regular and bonus). This fully aligns with PTU RAW (Core p.19, p.52) and the decree.

### rules-review-206 MEDIUM-01: currentHp Not Increased on Level-Up
**Status:** RESOLVED (improved behavior)

The `buildUpdatePayload()` now implements a more nuanced currentHp policy (lines 464-467):
```typescript
const wasAtFullHp = character.value.currentHp >= (character.value.maxHp ?? 0)
const newCurrentHp = wasAtFullHp
  ? newMaxHp
  : Math.min(character.value.currentHp, newMaxHp)
```
If the character was at full HP before leveling, they are set to the new maxHp (full health). If they were below max, their currentHp is clamped to the new maximum but not increased. This is a reasonable policy: trainers who were fully healed stay fully healed, and injured trainers do not gain free healing from leveling up. PTU RAW does not specify currentHp behavior on level-up, so this is a design choice rather than a rule error.

### rules-review-206 MEDIUM-02: Level-Up Watch Fragile Revert Pattern
**Status:** RESOLVED (guarded)

The watcher in `CharacterModal.vue` (line 374) now includes an `isApplyingLevelUp` flag guard (line 375: `if (isApplyingLevelUp.value) return`). When `onLevelUpComplete()` applies the updated data (including the new level), it sets `isApplyingLevelUp = true` before the assignment, then resets after `nextTick()`. This prevents the watcher from re-triggering on the legitimate level update. The original concern about synchronous revert race conditions is addressed by this flag.

---

## Mechanics Verified

### 1. Regular Skill Edge Rank-Ups (Fix Commit 3fdc1c21)
- **Rule:** "You gain 4 Edges during character creation, another at every even Level... Most likely, the vast majority of Edges will be to increase Skill Ranks..." (`core/03-skills-edges-and-features.md`, p.52, lines 1233-1235). Skill Edges: Basic Skills (Pathetic->Untrained or Untrained->Novice), Adept Skills (Novice->Adept, requires L2), Expert Skills (Adept->Expert, requires L6), Master Skills (Expert->Master, requires L12). (`core/03-skills-edges-and-features.md`, pp.52-53, lines 1241-1258)
- **Implementation:** Regular Skill Edges are stored as `"Skill Edge: <skillName>"` strings in `edgeChoices`. The new `regularSkillEdgeSkills` computed (line 173) parses these by prefix matching `"Skill Edge: "` and extracting the skill name. The `countAllSkillEdgeUps()` function (line 182) aggregates rank-ups from both bonus and regular sources. This count feeds into `effectiveSkills` (line 206), `getEffectiveSkillRank()` (line 192), `buildUpdatePayload()` skill updates (lines 454-461), and `LevelUpSummary.skillRankUpDetails` (lines 238-251).
- **Status:** CORRECT. Regular Skill Edges now correctly advance skill ranks in all four code paths (display, validation, persistence, summary).

### 2. Bonus Skill Edge Rank-Ups (Unchanged, re-verified)
- **Rule:** Level 2: "You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank." Level 6: "...may not be used to Rank Up a Skill to Expert Rank." Level 12: "...may not be used to Rank Up a Skill to Master Rank." (`core/02-character-creation.md`, p.19, lines 530-563)
- **Implementation:** `bonusSkillEdgeEntries` maps levels 2/6/12 to their restricted ranks via `skillRankCapsUnlocked`. The `addBonusSkillEdge()` function (line 314) validates: (a) slot not already filled for that level, (b) effective rank is not already at the level cap or Master, (c) the next rank would not be the restricted rank for that bonus. In the component, `isBonusSkillEdgeBlocked()` (line 240) checks whether the next rank equals the restricted rank. The `isBonusSkillEdgeAtCap()` (line 247) checks the general level-based cap.
- **Verification of restriction logic:** At level 2, the restricted rank is "Adept". If a skill is at Untrained (index 1), the next rank is Novice (index 2) -- not Adept, so allowed. If a skill is at Novice (index 2), the next rank is Adept (index 3) -- matches the restricted rank, so blocked. This correctly implements "may not be used to Rank Up a Skill to Adept Rank." The same pattern holds for Expert at L6 and Master at L12.
- **Status:** CORRECT. The restriction prevents upgrading TO the newly unlocked rank, exactly matching the PTU wording.

### 3. Skill Rank Cap Enforcement (Unified)
- **Rule:** "Adept Rank requires Level 2. Expert Rank requires Level 6, and Master Rank requires Level 12." (`core/03-skills-edges-and-features.md`, p.34)
- **Implementation:** `getMaxSkillRankForLevel()` in `trainerStats.ts` returns Novice for L1, Adept for L2-5, Expert for L6-11, Master for L12+. The `isRegularSkillEdgeCapped()` function in `LevelUpEdgeSection.vue` (line 213) checks the effective skill rank against this cap using `targetLevel`. Crucially, after commit 3fdc1c21, `effectiveSkills` now includes both bonus AND regular Skill Edge rank-ups, so the cap check accounts for all pending rank-ups. A skill at Novice with one pending regular Skill Edge shows as Adept in effective skills; if the target level is < 6, a second Skill Edge would be blocked (Expert exceeds cap).
- **Status:** CORRECT. Unified tracking prevents exceeding the level-based skill rank cap.

### 4. Effective Skills Unified Tracking
- **Rule:** Skill Edges (both regular and bonus) advance skill ranks by one step per Edge. The rank progression is Pathetic -> Untrained -> Novice -> Adept -> Expert -> Master. (`core/03-skills-edges-and-features.md`, pp.52-53, lines 1241-1258)
- **Implementation:** `effectiveSkills` computed (line 206) iterates all skills and applies `countAllSkillEdgeUps()` which sums bonus and regular Skill Edge rank-ups for that skill. The rank is advanced by that count using `RANK_PROGRESSION` index arithmetic with `Math.min` to cap at Master. The `RANK_PROGRESSION` constant is `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']` (trainerStats.ts, line 39), which matches the PTU rank order exactly.
- **Status:** CORRECT. Each Skill Edge advances one rank step, capped at Master.

### 5. Skill Rank-Up Summary Display (Stacking Fix)
- **Rule:** When multiple Skill Edges raise the same skill, each should show the correct from->to progression. E.g., Athletics: Untrained->Novice (Bonus L2), then Novice->Adept (Regular Edge).
- **Implementation:** `LevelUpSummary.skillRankUpDetails` (line 218) uses a `runningRank` tracker. For each rank-up (bonus first, then regular), it reads the current rank from `runningRank` (or falls back to the character's base skill), computes the next rank, records the from->to, and updates `runningRank`. This ensures sequential rank-ups on the same skill show correct progression rather than all starting from the base rank.
- **Status:** CORRECT. Stacked rank-ups display accurate from->to at each step.

### 6. Trainer HP Formula (Re-verified)
- **Rule:** "Trainers have Hit Points equal to (Trainer Level x2) + (HP x3) + 10." (`core/02-character-creation.md`, p.18)
- **Implementation:** `updatedMaxHp = newLevel.value * 2 + updatedStats.value.hp * 3 + 10` (line 381). Uses the target level and the HP stat including pending allocations.
- **Status:** CORRECT. Formula matches PTU p.18 exactly.

### 7. Milestone Definitions (Re-verified)
- **Rule:** Amateur (L5): choose +1 Atk/SpAtk on even L6-10 (+2 retroactive), or 1 General Feature. Capable (L10): choose +1 Atk/SpAtk on even L12-20, or 2 Edges. Veteran (L20): choose +1 Atk/SpAtk on even L22-30, or 2 Edges. Elite (L30): choose +1 Atk/SpAtk on even L32-40, or 2 Edges, or 1 General Feature. Champion (L40): choose +1 Atk/SpAtk on even L42-50, or 2 Edges, or 1 General Feature. (`core/02-character-creation.md`, pp.19-21)
- **Implementation:** `getMilestoneAt()` in `trainerAdvancement.ts` (lines 117-239) defines all five milestones with the correct choice options, level ranges, retroactive points, and edge counts. The milestone bonus edges from Capable/Veteran/Elite/Champion feed into `milestoneBonusEdges` (line 103) which adds to `regularEdgesTotal`. The milestone bonus features from Elite/Champion feed into `milestoneBonusFeatures` (line 120) which adds to `featuresTotal`.
- **Status:** CORRECT. All five milestones match PTU RAW.

### 8. Per-Level Entitlements (Re-verified)
- **Rule:** Every level: +1 stat point. Every even level: +1 Edge. Every odd level (3+): +1 Feature. (`core/02-character-creation.md`, p.19, lines 517-523)
- **Implementation:** `computeTrainerLevelUp()` returns `statPointsGained: 1`, `edgesGained: isEven ? 1 : 0`, `featuresGained: (isOdd && level >= 3) ? 1 : 0`. No `skillRanksGained` field exists (removed per decree-037).
- **Status:** CORRECT. Exactly three per-level gains as specified in PTU RAW.

---

## Decree Compliance

### decree-037 (skill ranks via edges only)
The composable comment at lines 13-14 explicitly cites decree-037. No automatic `skillRanksGained` exists in `trainerAdvancement.ts`. The LevelUpModal step navigation (line 188) explicitly comments on this decree. Skill ranks are exclusively advanced through Skill Edge selection in the edges step. Per decree-037, this approach was ruled correct. **COMPLIANT.**

### decree-022 (branching class suffix)
`LevelUpClassSection.vue` stores branching classes with `": "` suffix format (line 240: `emit('addClass', \`${pendingBranching.value.name}: ${branchingSpec.value}\`)`). The `hasBaseClass()` utility uses prefix matching. **COMPLIANT.**

### decree-026 (Martial Artist not branching)
The class picker shows `[Branch]` tag only for classes with `isBranching: true` (line 68). Martial Artist has `isBranching: false` in `trainerClasses.ts`, so no specialization picker appears. **COMPLIANT.**

### decree-027 (Pathetic skill edge block = creation only)
The composable header (lines 16-17) explicitly cites decree-027: "Per decree-027, Pathetic skill restriction is creation-only. During level-up, Pathetic skills CAN be raised via Skill Edges." Neither `isRegularSkillEdgeCapped()` nor `isBonusSkillEdgeBlocked()` checks for Pathetic status. The `RANK_PROGRESSION` includes Pathetic->Untrained as a valid step, allowing Basic Skills Edge progression during level-up. **COMPLIANT.**

---

## Errata Check

Reviewed `books/markdown/errata-2.md` for Skill Edge, level-up, or character advancement corrections. The errata contains revisions to Poke Edges (pp.454+) and some features but no changes to the core Skill Edge progression mechanics (Basic/Adept/Expert/Master Skills), the per-level entitlement schedule, or the milestone definitions. No errata conflicts.

---

## Summary

All three issues from rules-review-206 are resolved:

1. **HIGH-01** (automatic skill rank per level): Fully resolved by decree-037. The `skillRanksGained` field and standalone skill allocation step have been removed. Skill ranks now come exclusively from Skill Edge selection, matching PTU RAW (Core p.19, p.52).

2. **MEDIUM-01** (currentHp not increased): Improved with a "was at full HP" check. Characters at full health stay at full health after level-up; injured characters are clamped to the new max without free healing. Reasonable design choice; PTU RAW is silent on this.

3. **MEDIUM-02** (fragile watch revert): Resolved with an `isApplyingLevelUp` flag guard that prevents the watcher from re-triggering when the level-up modal applies changes.

The critical fix from code-review-239 (C1: regular Skill Edges not updating skill ranks) has been verified for PTU rules correctness. The `regularSkillEdgeSkills` computed, `countAllSkillEdgeUps()` function, and unified handling in `effectiveSkills`, `buildUpdatePayload()`, and `skillRankUpDetails` correctly implement PTU Skill Edge mechanics. Each Skill Edge advances one rank step, skill rank caps are enforced against the target level, bonus Skill Edge restrictions correctly prevent upgrading TO the newly unlocked rank, and stacked rank-ups on the same skill display correct from->to progressions.

All four applicable decrees (022, 026, 027, 037) are correctly implemented and cited in code comments.

No new PTU rule issues found.

---

## Rulings

1. **Skill rank via regular Skill Edges:** CORRECT. Regular edge slots can be spent on Skill Edges, which advance skill ranks by one step. The string format `"Skill Edge: <skillName>"` correctly encodes the choice and is parsed back for rank tracking. Per PTU Core p.52: "Most likely, the vast majority of Edges will be to increase Skill Ranks."

2. **Skill rank via bonus Skill Edges:** CORRECT. Levels 2, 6, 12 grant bonus Skill Edges with restrictions matching PTU Core p.19 exactly (cannot raise to Adept/Expert/Master respectively with that bonus).

3. **Unified rank tracking across all Skill Edge sources:** CORRECT. The `countAllSkillEdgeUps()` function aggregates both sources, preventing skills from exceeding the level cap when multiple Skill Edges target the same skill from different slot types.

4. **Skill rank caps by level:** CORRECT. Novice (L1), Adept (L2+), Expert (L6+), Master (L12+) per PTU Core p.34.

5. **No automatic skill ranks per level:** CORRECT per decree-037. PTU RAW grants only stat points, edges, and features per level.

6. **Trainer HP formula:** CORRECT. `level * 2 + hp_stat * 3 + 10` per PTU Core p.18.

7. **Milestone options:** CORRECT. All five milestones match PTU Core pp.19-21.

---

## Verdict

**APPROVED**

All issues from rules-review-206 are resolved. The P1 fix cycle commits correctly implement PTU 1.05 trainer level-up mechanics for Skill Edge rank-ups (both regular and bonus), skill rank caps, milestone definitions, and HP calculations. All four applicable decrees are respected. No new PTU rule violations found.

---

## Required Changes

None.
