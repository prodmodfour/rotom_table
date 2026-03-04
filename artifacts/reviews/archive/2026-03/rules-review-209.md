---
review_id: rules-review-209
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-012
domain: combat
commits_reviewed:
  - ed23b45
  - 2cd0ad4
mechanics_verified:
  - heavily-injured-penalty
  - death-threshold
  - faint-detection
  - xp-tracking
  - faint-status-clearing
  - faint-cs-reversal
  - league-battle-death-exemption
  - standard-action-gating
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Heavily Injured (p.250, lines 1898-1905)
  - core/07-combat.md#Death (p.251, lines 1926-1942)
  - core/07-combat.md#Persistent Status Conditions (p.246, lines 1534-1536)
  - core/07-combat.md#Volatile Afflictions (p.247, lines 1577-1581)
reviewed_at: 2026-03-01T09:00:00Z
follows_up: rules-review-204
---

## Scope

Re-review of feature-012 (Death & Heavily Injured Automation) after fix cycle 3. This review verifies that all issues from rules-review-204 (CHANGES_REQUIRED: 1 HIGH) and code-review-228 (CHANGES_REQUIRED: 1 HIGH, 2 MEDIUM) are resolved. Two code commits reviewed: ed23b45 (H1-NEW faint detection fix) and 2cd0ad4 (M1-NEW entity builder extraction).

## Prior Issues Resolution

| ID | Source | Severity | Status | Notes |
|----|--------|----------|--------|-------|
| HIGH-001 | rules-review-204 | HIGH | RESOLVED | `damage.post.ts:116` now uses `faintedFromAnySource` instead of `damageResult.fainted` |
| H1-NEW | code-review-228 | HIGH | RESOLVED | Same fix as HIGH-001 above |
| M1-NEW | code-review-228 | MEDIUM | RESOLVED | Entity builders extracted to `entity-builder.service.ts`; `combatant.service.ts` now 686 lines |
| M2-NEW | code-review-228 | MEDIUM | RESOLVED | `app-surface.md` updated with `encounterXp` store and `entity-builder.service.ts` entries |

## Mechanics Verified

### 1. Heavily Injured Penalty (PTU p.250)

- **Rule:** "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured. Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have." (`core/07-combat.md` p.250)
- **Implementation:**
  - `injuryMechanics.ts:checkHeavilyInjured()` returns `isHeavilyInjured = true` when `injuries >= 5` and `hpLoss = injuries` (the injury count, not a fraction of maxHp). Matches PTU RAW.
  - `injuryMechanics.ts:applyHeavilyInjuredPenalty()` applies `hpLoss` to `currentHp`, clamps to 0, and tracks unclamped value for death threshold. Correct.
  - **"Takes Damage" path:** `damage.post.ts:61-74` and `move.post.ts:113-125` apply the penalty immediately after damage, using the NEW injury count (damage may cross the 5-injury threshold). Both guard with `entity.currentHp > 0` to skip already-fainted entities. Correct.
  - **"Standard Action" path:** `next-turn.post.ts:90-144` checks `standardActionUsed === true` at turn end. Only fires when a Standard Action was actually used. Skips during `trainer_declaration` phase. Correct.
- **Status:** CORRECT

### 2. Death Threshold Calculation (PTU p.251)

- **Rule:** "If a Pokemon or Trainer has 10 injuries, or goes down to either -50 Hit Points or -200% Hit Points, whichever is lower (in that -80 Hit Points is lower than -50 Hit Points), during a non-friendly match, they die." (`core/07-combat.md` p.251)
- **Implementation:**
  - `injuryMechanics.ts:calculateDeathHpThreshold()` computes `Math.min(-50, Math.floor(maxHp * -2.0))`. The `Math.min` correctly selects the "more negative" (lower) of the two thresholds. Correct.
  - `injuryMechanics.ts:checkDeath()` checks: (1) `injuries >= 10` first (always applies); (2) `hpForCheck <= deathHpThreshold` using unclamped HP when available. The `<=` comparison matches "goes down to ... -50 Hit Points" (at or below). Correct.
  - Death checks are performed in all three damage paths: `damage.post.ts:80-86`, `move.post.ts:128-135`, `next-turn.post.ts:112-118`. All pass `isLeagueBattle` and `finalUnclampedHp` correctly. Correct.
  - `Dead` status is prepended to the status conditions array when death occurs. Correct.
- **Status:** CORRECT

### 3. League Battle Death Exemption (PTU p.251, decree-021)

- **Rule:** "Generally Pokemon can hold back when instructed to, or when competing in 'friendly' or at least sportsmanlike matches such as during League events or Gym Matches -- in situations like this, simply pay no heed to the -50/-200% damage rule." + "Injuries are a different issue -- the 10 Injuries Rule always applies." (`core/07-combat.md` p.251)
- **Implementation:**
  - `injuryMechanics.ts:checkDeath()`: when `isLeagueBattle === true` and HP-based death would trigger, returns `isDead: false, leagueSuppressed: true`. Injury-based death (10+ injuries) always returns `isDead: true` regardless of `isLeagueBattle`. Correct per PTU RAW and decree-021.
  - `isLeagueBattle` determined by `record.battleType === 'trainer'` consistently in all three endpoints. Correct.
- **Status:** CORRECT

### 4. Faint Detection Across All Damage Paths (H1-NEW / HIGH-001 fix)

- **Rule:** Any entity reaching 0 HP must be detected as fainted, regardless of whether faint was caused by direct damage or by the heavily injured penalty applied after damage.
- **Implementation (the fix under review):**
  - **`damage.post.ts:109` (unchanged):** `faintedFromAnySource = damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)` — this correctly detects fainting from either direct damage or the subsequent heavily injured penalty.
  - **`damage.post.ts:116` (FIXED in ed23b45):** `isDefeated = faintedFromAnySource || deathCheck.isDead` — previously this used `damageResult.fainted` instead of `faintedFromAnySource`, which missed the case where direct damage did not faint the entity but the heavily injured penalty did. Now correctly uses `faintedFromAnySource`.
  - **Cross-path consistency verified:**
    - `move.post.ts:156`: `faintedFromAnySource = damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)` — same pattern. Correct.
    - `move.post.ts:167`: `fainted: damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)` in targetResults — matches. Correct.
    - `move.post.ts:244`: defeated tracking checks `result.fainted || result.isDead` which now includes heavily-injured-penalty faints. Correct.
    - `next-turn.post.ts:344`: checks `currentCombatant.entity.currentHp === 0` directly after penalty application, which inherently covers the penalty-caused faint. Correct.
  - **The scenario from HIGH-001 in rules-review-204 is now correctly handled:** Enemy with 8 injuries, 12 HP, takes 5 direct damage (HP=7, not fainted), then heavily injured penalty (-8 HP, clamped to 0). `faintedFromAnySource = false || (8 > 0 && 0 === 0) = true`. `isDefeated = true`. Enemy tracked for XP. Verified.
- **Status:** CORRECT

### 5. Faint Status Clearing (PTU p.246-247)

- **Rule:** "All Persistent Status conditions are cured if the target is Fainted." (`core/07-combat.md` p.246) and "When Pokemon are Fainted, they are automatically cured of all Volatile Status Afflictions." (`core/07-combat.md` p.247)
- **Implementation:** `combatant.service.ts:applyFaintStatus()` (lines 170-186) clears both `PERSISTENT_CONDITIONS` and `VOLATILE_CONDITIONS`, preserving only non-persistent/non-volatile conditions. Sets `['Fainted', ...survivingConditions]`. Called from all faint paths:
  - `applyDamageToEntity()` when `damageResult.fainted === true` (line 158-160)
  - `damage.post.ts:71-73` when heavily injured penalty causes faint after damage
  - `move.post.ts:122-124` same heavily-injured-penalty-faint path
  - `next-turn.post.ts:107-109` when heavily injured penalty at turn end causes faint
- **Entity builder extraction (2cd0ad4) does not affect this mechanic.** The `applyFaintStatus` function remains in `combatant.service.ts` where it belongs — it is combat logic, not entity building. Only pure data mapping functions were extracted. Correct separation.
- **Status:** CORRECT

### 6. Faint CS Reversal (decree-005)

- **Rule:** Per decree-005, CS effects from status conditions must be reversed when the condition is cured. Fainting cures persistent/volatile conditions (see mechanic 5), so their CS effects must be reversed.
- **Implementation:**
  - `combatant.service.ts:applyFaintStatus()` lines 174-180: iterates through conditions being cleared, calls `reverseStatusCsEffects()` for each before updating the status array. Correct order of operations.
  - `reverseStatusCsEffects()` (lines 393-415): finds matching `stageSources` entries, reverses their actual applied deltas, removes the source entries. Uses immutable spread patterns for `stageModifiers`. Correct.
  - DB sync for reversed stages in all three endpoints:
    - `damage.post.ts:109-112`: syncs `stageModifiers` when `faintedFromAnySource` (now correctly includes penalty-faint). Correct.
    - `move.post.ts:156-159`: same pattern. Correct.
    - `next-turn.post.ts:129-134`: conditional `stageModifiers` inclusion when `penalty.newHp === 0`. Correct.
- **Status:** CORRECT

### 7. XP Tracking Consistency Across All Defeat Paths

- **Rule:** All defeated enemies (fainted or dead from any cause) must be tracked in `defeatedEnemies` for XP calculation.
- **Implementation after fix:**
  - `damage.post.ts:116`: `isDefeated = faintedFromAnySource || deathCheck.isDead` — covers direct damage faint, heavily-injured-penalty faint, and death. Correct.
  - `move.post.ts:244`: checks `result.fainted || result.isDead` where `result.fainted` (line 167) already includes heavily-injured-penalty faint. Correct.
  - `next-turn.post.ts:343-348`: checks `currentHp === 0 || isDead` for heavily injured penalty path. Correct.
  - `next-turn.post.ts:351-358`: checks `tick.fainted` for tick damage path. Correct.
  - All four defeat-cause paths across three endpoints now consistently track defeated enemies. No gaps remain.
- **Status:** CORRECT

### 8. Entity Builder Extraction — PTU Mechanics Impact

- **Rule:** The entity builder extraction (2cd0ad4) must not alter any PTU game mechanics. Pure data transformation only.
- **Implementation:**
  - `entity-builder.service.ts` contains `buildPokemonEntityFromRecord()` and `buildHumanEntityFromRecord()` — both are 1:1 exact copies of the functions formerly in `combatant.service.ts`. No logic changes, no field additions, no field removals. Diff verified: the extracted code is byte-identical to the removed code.
  - All combat mechanics functions remain in `combatant.service.ts`: damage calculation, healing, status conditions, stage modifiers, faint handling, evasion helpers, initiative calculation, combatant building. The extraction boundary is clean — only Prisma-record-to-typed-entity mapping was moved.
  - Import paths updated in: `combatants.post.ts`, `switch.post.ts`, `from-scene.post.ts`. All verified to import `buildPokemonEntityFromRecord`/`buildHumanEntityFromRecord` from the new location and `buildCombatantFromEntity` from the original. Correct.
  - **`combatant.service.ts` line count: 686 lines** (down from 809). Well under the 800-line limit.
  - The `prisma` import was removed from `combatant.service.ts` since it was only used by the entity builder type derivations. The entity-builder service now owns that import. Correct dependency management.
- **Status:** CORRECT — no PTU mechanics affected by this refactoring.

## Decrees Checked

| Decree | Domain | Compliance |
|--------|--------|------------|
| decree-001 | Minimum 1 damage at post-defense and final | Not directly exercised in these commits; previously verified in rules-review-204. No regression. |
| decree-005 | Auto-apply/reverse CS effects from status conditions | `applyFaintStatus` reversal logic verified intact after extraction. All faint paths still call it. Compliant. |
| decree-021 | League battle death exemption | `isLeagueBattle` logic unchanged. HP-based death suppressed, injury-based death always applies. Compliant. |
| decree-032 | Cursed tick fires only on Standard Action use | `next-turn.post.ts` tick processing unchanged by these commits. Compliant. |
| decree-033 | Fainted switch on trainer's next turn | Not directly exercised in these commits. No regression. |

## Rulings

1. **The `faintedFromAnySource` fix (ed23b45) is a correct and minimal change.** The single-line diff (`damageResult.fainted` to `faintedFromAnySource`) closes the XP tracking gap without altering any other logic. The variable was already computed on line 109 for the stage-sync gate, and now both consumers use the same comprehensive faint detection. The fix is mechanically consistent with how `move.post.ts` and `next-turn.post.ts` already handle the same scenario.

2. **The entity builder extraction (2cd0ad4) is a safe refactoring with no game logic impact.** The extracted functions are pure data mapping (Prisma record fields to TypeScript interface fields). No combat formula, no PTU mechanic, no injury/faint/death check logic was touched. The `Prisma` type derivation (`PrismaPokemonRecord`, `PrismaHumanRecord`) was correctly made `export` in the new file since callers may need the types.

3. **Ruling from rules-review-204 remains valid:** GM direct damage endpoint applying heavily injured penalty on any damage (not just "attack" damage) is a reasonable design choice. The PTU text says "takes Damage from an attack" but GM manual damage is a meta-level tool. No change needed.

## Summary

All PTU mechanics implemented in feature-012 remain correct after fix cycle 3:

- **Heavily Injured penalty:** Both trigger paths (Standard Action, taking damage) correctly gated. HP loss equals injury count per PTU RAW. Standard action gating respects `standardActionUsed` flag.
- **Death checks:** Injury-based (10+ injuries) and HP-based (-50 / -200%) conditions both correct. League exemption correctly suppresses HP-based death while preserving injury-based death.
- **Faint handling:** All persistent and volatile conditions cleared on faint per PTU p.246-247. CS effects reversed per decree-005. All faint paths converge on `applyFaintStatus()`.
- **XP tracking (the primary fix):** The `damage.post.ts` gap where heavily-injured-penalty faints were not tracked as defeats is now closed. All three endpoints (damage, move, next-turn) consistently track defeated enemies from all faint/death causes.
- **Entity builder extraction:** No game logic impact. Pure data mapping functions relocated to a dedicated service file. Import paths updated. Combat service now 686 lines.

No new issues found. All prior review issues are resolved.

## Verdict

**APPROVED**

All issues from rules-review-204 and code-review-228 are resolved. PTU mechanics remain correctly implemented. The `faintedFromAnySource` fix closes the last tracking gap, and the entity builder extraction is a clean refactoring with no game logic impact.
