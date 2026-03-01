---
review_id: rules-review-216
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - fd299739
  - 4b5e0079
  - f6078c03
  - 350f1292
  - 4341ef07
  - 027982aa
  - f7b522c7
  - b5d5af8e
  - 1a57b6a1
  - c00b1460
  - 4f2eabd6
  - 3971e97b
  - ed906a60
  - ff64a2a7
  - fb01f6a2
mechanics_verified:
  - evolution-move-learning-r033-level-comparison
  - ability-remapping-r032-oldname-tracking
  - stat-recalculation-hp-formula
  - decree-036-stone-evolution-moves
  - decree-035-nature-adjusted-base-relations
  - decree-038-condition-behavior-decoupling
  - decree-038-sleep-persistence
  - decree-038-encounter-end-clearing
  - decree-038-faint-clearing
  - decree-038-breather-clearing
  - decree-038-capture-rate-conditions
  - decree-038-rest-healing-conditions
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Evolution
  - core/07-combat.md#Volatile-Afflictions
  - core/07-combat.md#Persistent-Afflictions
  - core/07-combat.md#Fainted
  - core/07-combat.md#Take-a-Breather
  - errata-2.md
reviewed_at: 2026-03-01T12:45:00Z
follows_up: rules-review-213
---

## Mechanics Verified

### R033: Evolution Move Learning — Level Comparison Fix (CRITICAL from rules-review-213)

- **Rule:** "When Pokemon Evolve, they can immediately learn any Moves that their new form learns at a Level **lower than** their minimum Level for Evolution but that their previous form could not learn." (`core/05-pokemon.md` lines 601-604)
- **Implementation:** `getEvolutionMoves()` in `app/utils/evolutionCheck.ts` (lines 168-173) now correctly differentiates between level-based and stone evolutions:
  ```typescript
  const meetsLevelCriteria = evolutionMinLevel !== null
    ? entry.level < evolutionMinLevel     // PTU: "at a Level lower than"
    : entry.level <= currentLevel          // decree-036: "at or below"
  ```
- **Status:** CORRECT

The fix (commit `fd299739`) splits the comparison operator precisely as the PTU text and design spec require. Level-based evolutions use strict `<` (e.g., Charmeleon evolving at level 36 gets Charizard moves at levels 1-35, NOT level 36). Stone evolutions use `<=` per decree-036. The function comment (lines 131-136) now explicitly documents both cases with citations. The deduplication logic (lines 184-190) and old-learnset exclusion (line 174) remain correct and unchanged.

### R032: Ability Remapping — oldName Tracking Fix (HIGH from code-review-237)

- **Rule:** "Abilities change to match the Ability in the same spot in the Evolution's Ability List." (`core/05-pokemon.md` lines 599-600)
- **Implementation:** `remapAbilities()` in `app/server/services/evolution.service.ts` (lines 238-242) now includes `oldName` in each remapped entry:
  ```typescript
  remappedAbilities.push({
    name: newSpeciesAbilities[oldIndex],
    effect: '',
    oldName: ability.name  // Tracks the original ability name
  })
  ```
  The `AbilityRemapResult` interface (line 194) adds the `oldName` field to `remappedAbilities`. The `EvolutionAbilityStep.vue` (line 16) displays `ability.oldName` directly instead of using the incorrect index-based `getOldAbilityName()` function which was removed.
- **Status:** CORRECT

The fix (commit `4b5e0079`) eliminates the index mismatch bug entirely by carrying the original ability name through the data flow. When a Pokemon has Feature-granted abilities that are preserved (not in old species list), the preserved abilities no longer shift the index mapping for remapped abilities. The UI correctly shows "OldBasic1 -> NewBasic1" even when preserved abilities exist at lower indices.

### Stat Recalculation / HP Formula (re-verified from rules-review-213)

- **Rule:** "Again, Pokemon add +X Stat Points to their Base Stats, where X is the Pokemon's Level plus 10." (`core/05-pokemon.md` lines 596-597)
- **Implementation:** `recalculateStats()` in `app/server/services/evolution.service.ts`:
  - Line 137: `expectedTotal = level + 10` — correct total stat points
  - Line 132: Nature applied to new species base stats first — correct
  - Line 164: Base Relations validated on nature-adjusted base stats — per decree-035
  - Line 177: `maxHp = level + (calculatedStats.hp * 3) + 10` — correct PTU HP formula
- **Status:** CORRECT — unchanged from rules-review-213, still correct.

### decree-036: Stone Evolution Move Learning (re-verified)

- **Rule:** "Stone evolutions learn new-form moves at or below the Pokemon's current level." (decree-036)
- **Implementation:** In `getEvolutionMoves()` (line 172): `entry.level <= currentLevel` when `evolutionMinLevel` is null. The `<=` comparison with `currentLevel` as the ceiling correctly implements the decree's formula: `newFormMoves WHERE moveLevel <= currentLevel AND NOT IN oldFormLearnset`.
- **Status:** CORRECT — per decree-036, this approach was ruled correct.

### decree-035: Nature-Adjusted Base Stats for Base Relations (re-verified)

- **Rule:** "Base Relations ordering uses nature-adjusted base stats." (decree-035)
- **Implementation:** `recalculateStats()` (line 132) applies nature first via `applyNatureToBaseStats()`, then (line 164) validates Base Relations using the nature-adjusted values. No changes from rules-review-213.
- **Status:** CORRECT — per decree-035, this approach was ruled correct.

### decree-038: Condition Behavior Decoupling (refactoring-106)

- **Rule:** "Condition behaviors must be decoupled from category arrays. Each condition should have independent behavior flags (e.g., clearsOnRecall, clearsOnEncounterEnd, clearsOnFaint) so that category is used only for display grouping, not behavior derivation." (decree-038, point 3)
- **Implementation:** `app/constants/statusConditions.ts` introduces `StatusConditionDef` type (lines 17-26) with `clearsOnRecall`, `clearsOnEncounterEnd`, `clearsOnFaint` flags per condition. `STATUS_CONDITION_DEFS` (lines 45-204) is the single source of truth. Derived arrays are generated from these flags:
  - `RECALL_CLEARED_CONDITIONS` (line 238-239): `.filter(d => d.clearsOnRecall)`
  - `ENCOUNTER_END_CLEARED_CONDITIONS` (line 245-246): `.filter(d => d.clearsOnEncounterEnd)`
  - `FAINT_CLEARED_CONDITIONS` (line 253-254): `.filter(d => d.clearsOnFaint)`
  Category arrays (`PERSISTENT_CONDITIONS`, `VOLATILE_CONDITIONS`, `OTHER_CONDITIONS`) are explicitly labeled "for UI display grouping only" (lines 214, 219, 223).
- **Status:** CORRECT

The architecture cleanly separates display grouping (category) from mechanical behavior (per-condition flags). Adding a new condition or changing an existing condition's behavior only requires editing the single `STATUS_CONDITION_DEFS` entry.

### decree-038: Sleep Persistence (ptu-rule-128)

- **Rule:** "Sleep does NOT clear on recall or encounter end. This matches mainline Pokemon video game behavior where Sleep persists through switching and battle end." (decree-038, point 2)
- **Implementation:** In `STATUS_CONDITION_DEFS`:
  - `Asleep` (lines 88-94): `clearsOnRecall: false`, `clearsOnEncounterEnd: false`, `clearsOnFaint: true`
  - `Bad Sleep` (lines 97-103): Same flags as Asleep
  All other volatile conditions (Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) have `clearsOnRecall: true`, `clearsOnEncounterEnd: true`.
- **Status:** CORRECT

Sleep and Bad Sleep are the only volatile conditions that persist through recall and encounter end, exactly as decreed. The `clearsOnFaint: true` is correct per PTU p.248: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."

### decree-038: Encounter-End Condition Clearing

- **Rule:** PTU p.247: "Volatile Afflictions are cured completely at the end of the encounter." Plus decree-038 decoupling.
- **Implementation:** `app/server/api/encounters/[id]/end.post.ts` (line 15) imports `ENCOUNTER_END_CLEARED_CONDITIONS` which is derived from per-condition `clearsOnEncounterEnd` flags. The `clearEncounterEndConditions()` function (lines 27-30) filters against this set. Since Sleep has `clearsOnEncounterEnd: false`, it survives encounter end.
- **Status:** CORRECT

Verified the consumer correctly uses the derived array rather than category-based filtering. The encounter-end endpoint also correctly resets combat stages (line 58) and scene-frequency moves (lines 66-73).

### decree-038: Faint Condition Clearing

- **Rule:** PTU p.248 (line 1691-1692): "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions."
- **Implementation:** `app/server/services/combatant.service.ts` `applyFaintStatus()` (lines 170-186) imports `FAINT_CLEARED_CONDITIONS` derived from `clearsOnFaint` flags. All persistent and volatile conditions (including Sleep) have `clearsOnFaint: true`. Only `Fainted` and `Dead` have `clearsOnFaint: false`, which is correct (Fainted cannot clear itself, Dead is permanent).
- **Status:** CORRECT

The faint clearing correctly handles: (1) reversing CS effects from cleared conditions via `reverseStatusCsEffects()` (decree-005), (2) preserving conditions with `clearsOnFaint: false`, (3) adding 'Fainted' to the surviving list. The 'Stuck', 'Slowed', 'Trapped', 'Tripped', 'Vulnerable' "other" conditions all have `clearsOnFaint: true`, matching PTU p.248's "all Persistent and Volatile" plus the reasonable interpretation that physical restraints are removed on unconsciousness.

### decree-038: Take a Breather Condition Clearing

- **Rule:** PTU p.245: "cured of all Volatile Status effects and the Slow and Stuck conditions"
- **Implementation:** `app/server/api/encounters/[id]/breather.post.ts` (lines 27-33) builds `BREATHER_CURED_CONDITIONS` from `STATUS_CONDITION_DEFS` by filtering for `d.category === 'volatile'` (excluding Cursed) plus Slowed and Stuck.
- **Status:** CORRECT

The breather legitimately uses the `category` field here because PTU explicitly says "all Volatile Status effects" for this mechanic. This is different from recall/encounter-end which decree-038 decouples from category. Since Sleep IS volatile (decree-038 point 1), the breather correctly cures Sleep. This aligns with PTU RAW: a Pokemon that Takes a Breather (a deliberate Full Action) should awaken from Sleep. The PTU text describes this as an active recovery action, not a passive state transition like recall or encounter end.

### decree-038: Capture Rate Condition Modifiers

- **Rule:** PTU capture rate: Persistent conditions = +10, Volatile conditions = +5
- **Implementation:** `app/utils/captureRate.ts` (lines 118-133) uses `STATUS_CONDITION_DEFS[condition]` to look up the category for capture rate calculation. Persistent = +10, Volatile = +5. The Poison/Badly Poisoned deduplication (lines 122-129) prevents double-counting.
- **Status:** CORRECT

Category is the correct lookup here because the PTU capture rules explicitly state bonuses by condition category. Sleep (volatile) correctly contributes +5, not +10. The deduplication for Poison variants is a correct implementation detail not present in PTU RAW but prevents an exploit where having both Poisoned and Badly Poisoned would grant +20 instead of +10.

### decree-038: Rest Healing Persistent Clearing

- **Rule:** PTU Core Ch.9: Extended Rest clears persistent status conditions.
- **Implementation:** `app/utils/restHealing.ts` `clearPersistentStatusConditions()` (lines 147-151) filters by `category !== 'persistent'` using `STATUS_CONDITION_DEFS`. Sleep (volatile) correctly survives extended rest; only Burn, Freeze, Paralysis, Poison, Badly Poisoned are cleared.
- **Status:** CORRECT

Extended rest clearing persistent conditions by category is correct because PTU explicitly names "persistent" conditions as what gets cleared. Sleep would need to be cured by other means (items, Pokemon Center, wake-up mechanics).

## Summary

All issues from rules-review-213 (CRITICAL + MEDIUM) and code-review-237 (C1 + H1 + H2 + M1-M3) have been correctly resolved:

**Feature-006 P1 Evolution System (7 commits):**
1. **C1 (CRITICAL):** `getEvolutionMoves()` now uses strict `<` for level-based evolutions and `<=` for stone evolutions. The off-by-one bug is fixed.
2. **H1:** `remapAbilities()` now includes `oldName` in each remapped entry. The UI reads it directly, eliminating the index mismatch.
3. **H2:** `enrichAbilityEffects()` now uses a single batch `findMany` query instead of N sequential lookups.
4. **M1:** `buildSelectedMoveList()` extracted to `utils/evolutionCheck.ts` as a shared pure function used by both EvolutionConfirmModal and EvolutionMoveStep.
5. **M2:** `app-surface.md` updated with all P1 additions (functions, components, endpoint changes, WS event).
6. **M3:** Resolution dropdown now shows ability effect descriptions, enriched via batch AbilityData lookup in the evolution-check endpoint.

**Refactoring-106 + ptu-rule-128 (decree-038 compliance, 8 commits):**
7. `StatusConditionDef` type with per-condition behavior flags introduced as the single source of truth.
8. All 7 consumer files updated to use either derived arrays (`ENCOUNTER_END_CLEARED_CONDITIONS`, `FAINT_CLEARED_CONDITIONS`) or `STATUS_CONDITION_DEFS` category lookups (capture rate, rest healing, breather) as appropriate for each mechanic.
9. Sleep and Bad Sleep correctly set to `clearsOnRecall: false`, `clearsOnEncounterEnd: false`, `clearsOnFaint: true`.

No new PTU rule violations were found in the reviewed code.

## Rulings

1. **R033 level comparison:** The fix correctly implements PTU p.202's "at a Level lower than their minimum Level for Evolution" as strict `<` for level-based evolutions. Stone evolutions use `<=` per decree-036. No remaining issues.

2. **decree-038 Take a Breather vs Sleep:** The breather endpoint correctly uses category-based volatile filtering to cure Sleep, because PTU p.245 explicitly says "all Volatile Status effects." This is a deliberate game mechanic distinct from recall/encounter-end. A Pokemon choosing to Take a Breather (Full Action) should wake up. This is not a decree-038 violation.

3. **decree-038 capture rate and rest healing:** Both correctly use `STATUS_CONDITION_DEFS` category lookups for their respective mechanics (capture rate bonuses by category, extended rest clears persistent by category). These are legitimate uses of category because the PTU rules for these mechanics explicitly reference condition categories.

4. **Breather Cursed exclusion:** The breather correctly excludes Cursed from auto-clearing (PTU p.245: "the source of the Curse must be KO'd or more than 12 meters away") since the app cannot track curse sources. This is a GM-adjudicated edge case.

## Verdict

**APPROVED**

All CRITICAL and MEDIUM issues from rules-review-213 are resolved. All code-review-237 issues (C1, H1, H2, M1, M2, M3) are resolved. The decree-038 implementation correctly decouples condition behaviors from categories while maintaining category-based lookups where PTU rules explicitly reference categories (breather, capture rate, extended rest). Sleep persistence through recall and encounter end is correctly implemented. No new PTU rule violations detected.

## Required Changes

None.
