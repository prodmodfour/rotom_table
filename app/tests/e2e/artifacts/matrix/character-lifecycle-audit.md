---
domain: character-lifecycle
audited_at: 2026-02-26T16:00:00Z
audited_by: implementation-auditor
rules_catalog: character-lifecycle-rules.md
capabilities_catalog: character-lifecycle-capabilities.md
matrix: character-lifecycle-matrix.md
items_audited: 42
---

# Implementation Audit: Character Lifecycle

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 33 |
| Incorrect | 1 |
| Approximation | 7 |
| Ambiguous | 1 |
| **Total Audited** | **42** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 3 | R035 (branch class duplicate block), R024 (Pathetic skill enforcement gap in custom mode), R037 (no duplicate feature detection) |
| LOW | 5 | R040 (no max level validation), R020 (no WC derivation), R033 (no stat tag auto-bonus), R034 (no ranked tracking), R042 (AP refresh function exists but no auto-trigger) |

---

## Tier 1: Core Formulas and Enumerations

### R001 — Trainer Combat Stats Definition

- **Rule:** "The 6 combat stats are HP, Attack, Defense, Special Attack, Special Defense, and Speed."
- **Expected behavior:** Model stores all 6 stats.
- **Actual behavior:** Prisma model `HumanCharacter` has `hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed` fields (`app/prisma/schema.prisma:25-30`). `trainerStats.ts` defines `BASE_HP=10`, `BASE_OTHER=5`. `useCharacterCreation.ts:103-110` computes all 6 stats.
- **Classification:** Correct

### R003 — Skill Categories

- **Rule:** "Body: Acrobatics, Athletics, Combat, Intimidate, Stealth, Survival. Mind: General Education, Medicine Education, Occult Education, Pokemon Education, Technology Education, Guile, Perception. Spirit: Charm, Command, Focus, Intuition."
- **Expected behavior:** 17 skills across 3 categories: Body(6), Mind(7), Spirit(4).
- **Actual behavior:** `app/constants/trainerSkills.ts:4-8` defines `PTU_SKILL_CATEGORIES` with Body(6), Mind(7), Spirit(4) = 17 total. Skill names use abbreviated forms (`General Ed`, `Medicine Ed`, etc.) but map correctly to PTU skills.
- **Classification:** Correct

### R004 — Skill Ranks and Dice

- **Rule:** Pathetic=1d6, Untrained=2d6, Novice=3d6, Adept=4d6, Expert=5d6, Master=6d6.
- **Expected behavior:** 6 ranks with matching dice values.
- **Actual behavior:** `app/constants/trainerSkills.ts:19-26` defines `SKILL_RANKS` with exactly these 6 ranks and dice: `{rank:'Pathetic', value:1, dice:'1d6'}` through `{rank:'Master', value:6, dice:'6d6'}`.
- **Classification:** Correct

### R008 — Trainer HP Formula

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10"
- **Expected behavior:** maxHp = level * 2 + hpStat * 3 + 10, where hpStat is the TOTAL HP stat (base 10 + allocated points).
- **Actual behavior:** `useCharacterCreation.ts:113-115` computes `form.level * 2 + computedStats.value.hp * 3 + 10` where `computedStats.hp = BASE_HP(10) + form.statPoints.hp`. At level 1 with 0 HP points, computedStats.hp = 10, so maxHp = 2 + 30 + 10 = 42. Server-side: `app/server/api/characters/index.post.ts:13` computes `level * 2 + hpStat * 3 + 10` where hpStat is the total stat value. Both match PTU.
- **Classification:** Correct

### R009 — Physical Evasion Formula

- **Rule:** "for every 5 points in Defense, +1 Physical Evasion, up to +6 at 30 Defense."
- **Expected behavior:** floor(Defense/5), capped at +6.
- **Actual behavior:** `useCharacterCreation.ts:119` — `Math.min(6, Math.floor(computedStats.value.defense / 5))`.
- **Classification:** Correct

### R010 — Special Evasion Formula

- **Rule:** "for every 5 points in Special Defense, +1 Special Evasion, up to +6."
- **Expected behavior:** floor(SpDef/5), capped at +6.
- **Actual behavior:** `useCharacterCreation.ts:120` — `Math.min(6, Math.floor(computedStats.value.specialDefense / 5))`.
- **Classification:** Correct

### R011 — Speed Evasion Formula

- **Rule:** "for every 5 points in Speed, +1 Speed Evasion, up to +6."
- **Expected behavior:** floor(Speed/5), capped at +6.
- **Actual behavior:** `useCharacterCreation.ts:121` — `Math.min(6, Math.floor(computedStats.value.speed / 5))`.
- **Classification:** Correct

### R012 — Evasion General Formula

- **Rule:** "divide the related Combat Stat by 5 and round down. Never more than +6 from Combat Stats alone."
- **Expected behavior:** floor division with +6 cap, consistently applied.
- **Actual behavior:** All three evasions (R009-R011) use `Math.floor` for division and `Math.min(6, ...)` for cap.
- **Classification:** Correct

### R041 — Action Points Pool

- **Rule:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels; a Level 15 Trainer would have 8 Action Points."
- **Expected behavior:** maxAP = 5 + floor(level/5). L1=5, L5=6, L10=7, L15=8.
- **Actual behavior:** `app/utils/restHealing.ts:219-221` — `return 5 + Math.floor(level / 5)`. L1=5, L5=6, L15=8. Matches PTU example.
- **Classification:** Correct

### R068 — Percentages Are Additive

- **Rule:** "Percentages are additive, not multiplicative."
- **Expected behavior:** Combined bonuses use addition.
- **Actual behavior:** `app/utils/equipmentBonuses.ts:42-45` uses additive accumulation: `damageReduction += item.damageReduction`. No multiplicative percentage compounding found anywhere.
- **Classification:** Correct

---

## Tier 2: Core Constraints

### R002 — Starting Stat Baseline

- **Rule:** "Level 1 Trainers begin with 10 HP and 5 in each other Stat. Assign 10 points, no more than 5 per stat."
- **Expected behavior:** BASE_HP=10, BASE_OTHER=5, TOTAL_STAT_POINTS=10, MAX_POINTS_PER_STAT=5.
- **Actual behavior:** `app/constants/trainerStats.ts:11-19` defines all constants correctly. `useCharacterCreation.ts:127` enforces per-stat cap at level 1. `characterCreationValidation.ts:51-59` validates per-stat cap at level 1 only (per PTU, no per-stat cap after level 1).
- **Classification:** Correct

### R005 — Skill Rank Level Prerequisites

- **Rule:** "Adept requires Level 2. Expert requires Level 6. Master requires Level 12."
- **Expected behavior:** Skill rank caps at levels 2, 6, 12.
- **Actual behavior:** `app/constants/trainerSkills.ts:29-33` — `SKILL_RANK_LEVEL_REQS: { Adept: 2, Expert: 6, Master: 12 }`. `trainerStats.ts:51-56` — `getMaxSkillRankForLevel` returns correct rank per level. `isSkillRankAboveCap` correctly compares rank index against max.
- **Classification:** Correct

### R006 — Skills Default Rank

- **Rule:** "Skills begin at Untrained unless modified by a Background."
- **Expected behavior:** All 17 skills default to Untrained.
- **Actual behavior:** `app/constants/trainerSkills.ts:36-40` — `getDefaultSkills()` maps all skills to `'Untrained'`.
- **Classification:** Correct

### R021 — Rounding Rule

- **Rule:** "round down to the nearest whole number, even if .5 or higher."
- **Expected behavior:** Math.floor used consistently.
- **Actual behavior:** `Math.floor` used in evasion formulas (`useCharacterCreation.ts:119-121`), AP formula (`restHealing.ts:220`), stat points (`trainerStats.ts:35`), rest healing (`restHealing.ts:65`), and movement modifiers (`useGridMovement.ts:102,113,123`).
- **Classification:** Correct

### R022 — Starting Edges

- **Rule:** "Starting Trainers begin with four Edges."
- **Expected behavior:** 4 edges at level 1.
- **Actual behavior:** `trainerStats.ts:74-85` — `getExpectedEdgesForLevel(1)` returns `{ base: 4, bonusSkillEdges: 0, total: 4 }`. Formula: `base = 4 + Math.floor(1/2) = 4`.
- **Classification:** Correct

### R023 — Starting Skill Cap

- **Rule:** "you cannot raise Skills above Novice at your starting level!"
- **Expected behavior:** Novice max at level 1.
- **Actual behavior:** `trainerStats.ts:55` — `getMaxSkillRankForLevel(1)` returns `'Novice'`. `addSkillEdge` (line 256) blocks rank above cap.
- **Classification:** Correct

### R026 — Edges Per Level

- **Rule:** "4 during creation, another at every even Level, additional Edges at each level where max Skill Rank increases (L2, L6, L12)."
- **Expected behavior:** L1=4, L2=6, L4=7, L6=9, L12=13.
- **Actual behavior:** `trainerStats.ts:74-85`: `base = 4 + Math.floor(level / 2)`, plus `bonusSkillEdges` at L2/L6/L12. L1: 4+0+0=4. L2: 5+1=6. L4: 6+1=7. L6: 7+2=9. L12: 10+3=13. All match PTU progression.
- **Classification:** Correct

### R030 — Starting Features

- **Rule:** "4 Features + 1 Training Feature = 5 total at level 1."
- **Expected behavior:** 5 features at level 1.
- **Actual behavior:** `trainerStats.ts:97-99` — `getExpectedFeaturesForLevel(1) = 5`. Training feature tracked separately via `form.trainingFeature`.
- **Classification:** Correct

### R032 — Max Class Features

- **Rule:** "Maximum of 4 Class Features."
- **Expected behavior:** Max 4 trainer classes enforced.
- **Actual behavior:** `trainerClasses.ts:40` — `MAX_TRAINER_CLASSES = 4`. `useCharacterCreation.ts:182` — `if (form.trainerClasses.length >= MAX_TRAINER_CLASSES) return`. Also validated in `characterCreationValidation.ts:194`.
- **Classification:** Correct

### R036 — Features Per Level

- **Rule:** "Every odd Level you gain a Feature."
- **Expected behavior:** L1=5, L3=6, L5=7, L10=9.
- **Actual behavior:** `trainerStats.ts:97-99` — `5 + Math.floor((level - 1) / 2)`. L1=5, L3=6, L5=7, L10=9. Correct.
- **Classification:** Correct

### R038 — Stat Points Per Level

- **Rule:** "Every Level you gain a Stat Point."
- **Expected behavior:** Total = 10 + (level - 1).
- **Actual behavior:** `trainerStats.ts:34-36` — `TOTAL_STAT_POINTS + Math.max(0, level - 1)` = `10 + (level - 1)`. L1=10, L50=59.
- **Classification:** Correct

### R039 — Edges Per Level (Advancement)

- **Rule:** "Every even Level you gain an Edge."
- **Expected behavior:** +1 at levels 2, 4, 6, ...
- **Actual behavior:** `trainerStats.ts:76` — `base = 4 + Math.floor(level / 2)` correctly adds 1 per even level.
- **Classification:** Correct

### R040 — Max Trainer Level

- **Rule:** "Trainers have a Maximum Level of 50."
- **Expected behavior:** Level cannot exceed 50.
- **Actual behavior:** `HumanCharacter.level` is `Int @default(1)` with no max constraint. No validation in create/update APIs or composable prevents level > 50.
- **Classification:** Approximation
- **Severity:** LOW — Edge case, level 50 is rarely reached in campaigns. GM can manually enforce.

---

## Tier 3: Core Workflows

### R007 — Background Skill Modification

- **Rule:** "Choose 1 Skill to Adept, 1 to Novice, 3 lowered to Pathetic."
- **Expected behavior:** 11 presets + custom mode, each with 1 Adept, 1 Novice, 3 Pathetic.
- **Actual behavior:** `app/constants/trainerBackgrounds.ts:16-94` — 11 backgrounds with exactly 1 `adeptSkill`, 1 `noviceSkill`, 3 `patheticSkills`. `useCharacterCreation.ts:144-156` applies backgrounds correctly. Custom mode resets to defaults and allows manual setting. Validated by `characterCreationValidation.ts:86-121`.
- **Classification:** Correct

### R051 — Character Creation Workflow

- **Rule:** PTU 9-step creation process.
- **Expected behavior:** Full creation flow covering all relevant steps.
- **Actual behavior:** `useCharacterCreation.ts` covers Steps 2-7 (Background, Edges, Features, Stats, Derived Stats, Biography). Steps 1 (Concept), 8 (Pokemon), and 9 (Items) are handled by other parts of the app. Section completion tracking at lines 293-335 covers: basicInfo, background, edges, classes, stats, biography.
- **Classification:** Correct

### R052 — Steps 3/4 Interleaving

- **Rule:** "You can take Steps 3 and 4 in any order."
- **Expected behavior:** No forced ordering between edges and features.
- **Actual behavior:** Separate sections in the create page, no sequence enforcement. Both `addEdge` and `addFeature` are independently callable.
- **Classification:** Correct

### R025 — Skill Edge Definitions

- **Rule:** "Basic Skills: Rank Up from Pathetic to Untrained, or Untrained to Novice. Adept/Expert/Master Skills unlock at L2/L6/L12."
- **Expected behavior:** Skill edges raise rank by one step, subject to level caps and Pathetic restriction.
- **Actual behavior:** `useCharacterCreation.ts:241-266` — `addSkillEdge` bumps rank one step along `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']`. Blocks Pathetic skills (line 243). Checks cap via `isSkillRankAboveCap` (line 256). `removeEdge` reverts rank (lines 217-233).
- **Classification:** Correct

---

## Tier 4: Partial Items

### R024 — Pathetic Skills Cannot Be Raised At Creation

- **Rule:** "You may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank."
- **Expected behavior:** Pathetic skills from background cannot be raised via Skill Edges during creation.
- **Actual behavior:** `useCharacterCreation.ts:243-244` — `addSkillEdge` blocks if `currentRank === 'Pathetic'`, correctly preventing Skill Edges from raising Pathetic skills. However, `setSkillRank` (line 173-178) in custom background mode has no such restriction. A GM using custom background mode can set Pathetic skills back to higher ranks without going through the Skill Edge path.
- **Classification:** Approximation
- **Severity:** MEDIUM — The primary Skill Edge path enforces the rule. The custom background path does not track which skills were lowered to Pathetic, so it cannot enforce the restriction.

### R033 — Stat Tag Effect

- **Rule:** "[+Stat] Features increase a Stat by one point."
- **Expected behavior:** Features with [+Stat] tags auto-apply stat bonuses.
- **Actual behavior:** Features stored as plain string array (`schema.prisma:38`). No feature metadata parsing. GM must manually adjust stats.
- **Classification:** Approximation
- **Severity:** LOW — Intentional simplification. App stores feature names, not metadata.

### R034 — Ranked Feature Tag

- **Rule:** "[Ranked X] can be taken up to X times."
- **Expected behavior:** Rank tracking for Ranked features.
- **Actual behavior:** Features stored as simple strings. No rank tracking or rank limit validation.
- **Classification:** Approximation
- **Severity:** LOW — GM controls feature entry manually.

### R035 — Branch Feature Tag

- **Rule:** "[Branch] on a [Class] Feature means it may be taken multiple times using a Class slot with different specializations."
- **Expected behavior:** Branching classes can be added multiple times with different specializations.
- **Actual behavior:** `trainerClasses.ts` defines `isBranching: true` on Type Ace, Stat Ace, Style Expert, Researcher, Martial Artist. However, `useCharacterCreation.ts:183` checks `if (form.trainerClasses.includes(className)) return`, which blocks adding the same class name twice. The `isBranching` flag is never consulted during `addClass`. A workaround exists if the user modifies the class name (e.g., "Type Ace: Fire", "Type Ace: Water"), but the catalog selection flow would select "Type Ace" which gets blocked on second selection.
- **Classification:** Incorrect
- **Severity:** MEDIUM — Branching classes like Type Ace should be selectable multiple times per PTU rules. The `isBranching` flag exists but is not used.

### R037 — No Duplicate Features

- **Rule:** "Unless explicitly stated (Ranked), you can only take a Feature once."
- **Expected behavior:** Duplicate detection for non-ranked features.
- **Actual behavior:** `addFeature` at `useCharacterCreation.ts:199-201` appends without duplicate checking. Validation does not check for duplicates.
- **Classification:** Approximation
- **Severity:** MEDIUM — GM can accidentally add the same feature twice.

### R042 — AP Refresh Per Scene

- **Rule:** "Action Points are completely regained at the end of each Scene."
- **Expected behavior:** AP auto-restored at scene end.
- **Actual behavior:** `restHealing.ts:240-243` — `calculateSceneEndAp` correctly computes `maxAp - boundAp - drainedAp`. Function exists but no automatic trigger fires at scene boundaries. GM must manually refresh AP.
- **Classification:** Approximation
- **Severity:** LOW — Calculation is correct; only the automation trigger is missing.

### R044 — Level 2 Milestone (Adept Skills)

- **Rule:** "Level 2: Adept Skills unlocked. Gain one Skill Edge (cannot raise to Adept)."
- **Expected behavior:** Skill rank cap to Adept + 1 bonus Skill Edge with restriction.
- **Actual behavior:** `trainerStats.ts:53` — `getMaxSkillRankForLevel(2)` = `'Adept'`. `getExpectedEdgesForLevel(2)` includes `bonusSkillEdges: 1`. Validation info message mentions the restriction (`characterCreationValidation.ts:144`). However, the restriction "cannot raise to Adept with the bonus edge" is not mechanically enforced — all Skill Edges at level 2 CAN raise to Adept.
- **Classification:** Correct — The rank unlock and edge count are correct. The per-edge restriction is informational per the app's design philosophy (soft warnings, GM decides). The bonus skill edge IS correctly counted in the edge budget.

### R046 — Level 6 Milestone (Expert Skills)

- **Rule:** "Level 6: Expert Skills unlocked. Gain one Skill Edge (cannot raise to Expert)."
- **Expected behavior:** Expert rank unlocked + 1 bonus Skill Edge.
- **Actual behavior:** `trainerStats.ts:52` — `getMaxSkillRankForLevel(6)` = `'Expert'`. `getExpectedEdgesForLevel(6)` includes cumulative `bonusSkillEdges: 2`. Same informational approach as R044.
- **Classification:** Correct — Same reasoning as R044.

### R048 — Level 12 Milestone (Master Skills)

- **Rule:** "Level 12: Master Skills unlocked. Gain one Skill Edge."
- **Expected behavior:** Master rank unlocked + 1 bonus Skill Edge.
- **Actual behavior:** `trainerStats.ts:51` — `getMaxSkillRankForLevel(12)` = `'Master'`. `getExpectedEdgesForLevel(12)` includes `bonusSkillEdges: 3`.
- **Classification:** Correct

---

## Tier 5: Implemented-Unreachable

### R063 — AP Spend for Roll Bonus

- **Rule:** "Spend 1 AP as free action before Accuracy/Skill Check to add +1."
- **Expected behavior:** AP fields exist, player can spend AP.
- **Actual behavior:** AP fields exist on model (`currentAp`, `drainedAp`, `boundAp`). GM can decrement AP via update API. Player view is read-only — players cannot spend their own AP. This is a UI access limitation, not a rules implementation error.
- **Classification:** Correct (logic-wise)

---

## Tier 6: Modifier Items

### R031 — Free Training Feature

- **Rule:** "Pick one Training Feature for free, no prerequisites required."
- **Expected behavior:** Training feature stored separately, no prereq checks.
- **Actual behavior:** `useCharacterCreation.ts:207-209` — `setTrainingFeature` stores separately in `form.trainingFeature`. No prerequisite checking for any features.
- **Classification:** Correct

### R043 — AP Bind and Drain

- **Rule:** "Bound AP off-limits until binding ends. Drained AP unavailable until Extended Rest."
- **Expected behavior:** drainedAp restored by extended rest, boundAp cleared by effect end.
- **Actual behavior:** `schema.prisma:58-60` — `drainedAp`, `boundAp`, `currentAp` fields. Extended rest restores all. Heal injury can drain 2 AP. New day resets all. `calculateAvailableAp` correctly computes `maxAp - boundAp - drainedAp`.
- **Classification:** Correct

### R019 — Trainer Size

- **Rule:** "Trainers are Medium by default."
- **Expected behavior:** Trainers treated as Medium.
- **Actual behavior:** No explicit `size` field. Trainers implicitly Medium: 1x1 grid tokens, default movement speed 5. Consistent throughout.
- **Classification:** Correct

### R020 — Weight Class

- **Rule:** "55-110 lbs = WC3, 111-220 = WC4, higher = WC5."
- **Expected behavior:** Weight class derived from weight.
- **Actual behavior:** `HumanCharacter.weight` field exists (Int?, kg). No WC derivation function. GM must manually track.
- **Classification:** Approximation
- **Severity:** LOW — Weight field exists; WC derivation is missing but rarely needed.

### R064 — Skill Stunt Edge

- **Rule:** "Choose a Skill at Novice+. Under specific circumstances, roll one less die, add +6."
- **Expected behavior:** Edge stored as string; mechanical effect is table-resolved.
- **Actual behavior:** Edges stored as string array. Can store "Skill Stunt: [skill]". No mechanical effect — dice rolling is not automated.
- **Classification:** Correct — Skill checks are Out of Scope (R027). Storage is correct.

### R065 — Skill Enhancement Edge

- **Rule:** "Choose two Skills. Gain +2 bonus to each."
- **Expected behavior:** Edge stored; bonus computed or table-resolved.
- **Actual behavior:** Edge stored as string. +2 bonus not auto-applied. Table-resolved.
- **Classification:** Correct — Same reasoning as R064.

### R066 — Categoric Inclination Edge

- **Rule:** "Choose Body/Mind/Spirit. Gain +1 to all Skill Checks of that category."
- **Expected behavior:** Edge stored; bonus computed or table-resolved.
- **Actual behavior:** Edge stored as string. +1 bonus not auto-applied. Table-resolved.
- **Classification:** Correct — Same reasoning as R064.

---

## Ambiguous Items

### R035 — Branch Feature Tag (Design Ambiguity)

Two valid interpretations exist for branch class handling:

1. **PTU RAW:** Branching classes should be addable multiple times from the catalog, each with a different specialization. The `addClass` function should skip the duplicate check when `isBranching` is true.
2. **Name-based approach:** Specializations are encoded in the class name string (e.g., "Type Ace: Fire", "Type Ace: Water"). The duplicate check passes because strings differ. This requires the UI to prompt for specialization before adding.

The code implements neither approach cleanly — `isBranching` exists but is unused, and the catalog provides "Type Ace" as a fixed string. This is classified as **Incorrect** above because the most natural user flow (selecting "Type Ace" from the catalog twice) fails.

**Recommendation:** Create a `decree-need` ticket clarifying branch class handling. Either: (a) allow duplicate class names for branching classes, or (b) require specialization suffix before adding to the array.

---

## Escalation Notes

### Items Requiring Fix

1. **R035 — Branch Feature Tag** (Incorrect, MEDIUM): `addClass` blocks duplicate class names, preventing branching classes from being taken multiple times with different specializations. The `isBranching` flag is defined but never consulted.

### Approximation Items (monitor, no immediate fix needed)

- R024: Pathetic skill enforcement gap in custom background mode (MEDIUM)
- R037: No duplicate feature detection (MEDIUM)
- R040: No max level 50 validation (LOW)
- R020: No weight class derivation (LOW)
- R033: No [+Stat] auto-bonus (LOW)
- R034: No ranked feature tracking (LOW)
- R042: AP refresh function exists but no auto-trigger (LOW)

### No Active Decrees

No active decrees exist in `decrees/`. The R035 branch class handling warrants a `decree-need` ticket.
