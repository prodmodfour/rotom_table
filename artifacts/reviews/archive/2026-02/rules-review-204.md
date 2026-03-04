---
review_id: rules-review-204
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-012
domain: combat
commits_reviewed:
  - 30cdb43
  - a8bde87
  - 068c202
  - 702d09d
  - cffce87
  - 243d8f9
  - aaac6c5
  - a33d12e
mechanics_verified:
  - heavily-injured-penalty
  - death-check
  - league-battle-death-exemption
  - faint-status-clearing
  - faint-cs-reversal
  - standard-action-gating
  - defeated-enemy-tracking
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
ptu_refs:
  - core/07-combat.md#Heavily Injured (p.250, lines 1898-1905)
  - core/07-combat.md#Death (p.251, lines 1926-1942)
  - core/07-combat.md#Persistent Status Conditions (p.246, lines 1534-1536)
  - core/07-combat.md#Volatile Afflictions (p.247, lines 1577-1581)
  - core/07-combat.md#Standard Actions (p.228, lines 96-98)
reviewed_at: 2026-02-28T22:30:00Z
follows_up: rules-review-201
---

## Mechanics Verified

### 1. Heavily Injured Penalty (C1 / HIGH-001 fix)

- **Rule:** "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured. Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have." (`core/07-combat.md` p.250, lines 1898-1905)
- **Implementation:**
  - `injuryMechanics.ts:checkHeavilyInjured()` correctly returns `isHeavilyInjured = true` when `injuries >= 5` and `hpLoss = injuries` (the injury count, not 1/8 maxHp). This matches PTU RAW.
  - `injuryMechanics.ts:applyHeavilyInjuredPenalty()` applies `hpLoss` to `currentHp`, clamps to 0, and tracks unclamped value for death threshold. Correct.
  - **Two trigger paths correctly separated:**
    - "Takes Damage from an attack" path: `damage.post.ts:61-74` and `move.post.ts:113-125` apply the penalty immediately after damage is applied, using the NEW injury count (post-damage injuries may cross the threshold). Correct.
    - "Takes a Standard Action" path: `next-turn.post.ts:90-144` checks `standardActionUsed === true` at turn end. Only fires when a Standard Action was actually used. Correct.
  - **Standard Action gating (C1 fix):** `next-turn.post.ts:95-96` reads `currentCombatant.turnState?.standardActionUsed === true` and also skips during `trainer_declaration` phase. The `standardActionUsed` flag is set by `move.post.ts:236-239` when executing a move, and by `action.post.ts` when using other Standard Actions. Passing or shifting without using a Standard Action leaves the flag `false`, so the penalty correctly does not fire. This addresses the CRITICAL issue from code-review-225.
- **Status:** CORRECT

### 2. Death Check

- **Rule:** "If a Pokemon or Trainer has 10 injuries, or goes down to either -50 Hit Points or -200% Hit Points, whichever is lower (in that -80 Hit Points is lower than -50 Hit Points), during a non-friendly match, they die." (`core/07-combat.md` p.251, lines 1926-1932)
- **Implementation:**
  - `injuryMechanics.ts:calculateDeathHpThreshold()` correctly computes `Math.min(-50, Math.floor(maxHp * -2.0))`, which is the "more negative" (lower) of -50 and -200%. Correct.
  - `injuryMechanics.ts:checkDeath()` checks:
    1. `injuries >= 10` first (always applies, even in League Battles). Correct.
    2. `hpForCheck <= deathHpThreshold` using unclamped HP when available. Correct -- uses `<=` since the rule says "goes down to ... -50 Hit Points" (at or below).
  - Death checks are performed in all three damage paths: `damage.post.ts:80-86`, `move.post.ts:128-135`, `next-turn.post.ts:112-118`. All pass `isLeagueBattle` and `unclampedHp` correctly. Correct.
  - `Dead` status is prepended to status conditions array when death occurs. Correct.
- **Status:** CORRECT

### 3. League Battle Death Exemption (decree-021)

- **Rule:** "Generally Pokemon can hold back when instructed to, or when competing in 'friendly' or at least sportsmanlike matches such as during League events or Gym Matches -- in situations like this, simply pay no heed to the -50/-200% damage rule." (`core/07-combat.md` p.251, lines 1933-1937) + "Injuries are a different issue -- the 10 Injuries Rule always applies." (lines 1938-1942)
- **Implementation:**
  - `injuryMechanics.ts:checkDeath()` line 139: when `isLeagueBattle === true` and HP-based death would trigger, returns `isDead: false, leagueSuppressed: true`. Injury-based death at line 127 always returns `isDead: true` regardless of `isLeagueBattle`. Correct per decree-021.
  - `isLeagueBattle` is determined by `record.battleType === 'trainer'` in all three endpoints. Correct.
  - GM alert on suppression: `useEncounterActions.ts:59-61` shows "death is suppressed in League Battle mode". Correct UX feedback.
- **Status:** CORRECT

### 4. Faint Status Clearing (PTU p.246-247)

- **Rule:** "All Persistent Status conditions are cured if the target is Fainted." (`core/07-combat.md` p.246, line 1535-1536) and "When Pokemon are Fainted, they are automatically cured of all Volatile Status Afflictions." (`core/07-combat.md` p.247, line 1580-1581)
- **Implementation:**
  - `combatant.service.ts:applyFaintStatus()` (lines 170-186) clears both `PERSISTENT_CONDITIONS` and `VOLATILE_CONDITIONS`, preserving only non-persistent/non-volatile conditions (like injury markers). Sets `['Fainted', ...survivingConditions]`. Correct.
  - `applyFaintStatus` is called from:
    - `applyDamageToEntity()` when `damageResult.fainted === true` (line 158-160). Correct.
    - `damage.post.ts:71-73` when heavily injured penalty causes faint but direct damage didn't. Correct.
    - `move.post.ts:122-124` same heavily-injured-penalty-faint path. Correct.
    - `next-turn.post.ts:107-109` when heavily injured penalty at turn end causes faint. Correct.
  - All faint paths converge on the same `applyFaintStatus()` function. Consistent and correct.
- **Status:** CORRECT

### 5. Faint CS Reversal (decree-005)

- **Rule:** Per decree-005, CS effects from status conditions must be reversed when the condition is cured. Fainting cures persistent/volatile conditions (see mechanic 4), so their CS effects must be reversed.
- **Implementation:**
  - `combatant.service.ts:applyFaintStatus()` lines 174-180: iterates through conditions being cleared, calls `reverseStatusCsEffects()` for each before updating the status array. Correct order of operations.
  - `reverseStatusCsEffects()` (lines 393-415): finds matching `stageSources` entries, reverses their deltas, removes the source entries. Uses immutable spread patterns for `stageModifiers`. Correct.
  - DB sync for reversed stages:
    - `damage.post.ts:109-112`: syncs `stageModifiers` to DB via `syncStagesToDatabase()` when `faintedFromAnySource` includes heavily-injured-penalty faint. Correct.
    - `move.post.ts:156-159`: same pattern. Correct.
    - `next-turn.post.ts:129-134`: syncs via `syncEntityToDatabase()` with conditional `stageModifiers` inclusion when `penalty.newHp === 0`. Correct.
- **Status:** CORRECT

### 6. Dead/Fainted Badge Filtering (M1 fix)

- **Rule:** UI concern -- Dead and Fainted have dedicated visual indicators (death badge, fainted styling), so they should not also appear in the generic status badge list to avoid duplicate display.
- **Implementation:**
  - `CombatantCard.vue:275-279`: `displayStatusConditions` computed filters out `'Dead'` and `'Fainted'` from the generic status badge list. Comment at line 76 explains the rationale.
  - `isDead` computed (line 271) drives the death badge at lines 65-74.
  - `isFainted` computed (line 270) drives the fainted card styling at line 6.
- **Status:** CORRECT (UI concern, not a PTU mechanics issue)

### 7. Defeated Enemy Tracking for XP (M2 fix)

- **Rule:** Defeated enemies must be tracked for XP distribution. All death/faint paths must contribute to the `defeatedEnemies` list.
- **Implementation:**
  - `move.post.ts:241-257`: iterates `targetResults`, checks `result.fainted || result.isDead`, and the `fainted` field at line 167 correctly accounts for heavily-injured-penalty faint: `damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)`. Correct.
  - `next-turn.post.ts:342-359`: tracks defeated from both heavily injured penalty (lines 343-348) and tick damage (lines 351-358). Correct.
  - **`damage.post.ts:116` -- ISSUE FOUND (see HIGH-001 below):** `isDefeated` only checks `damageResult.fainted || deathCheck.isDead`, missing the heavily-injured-penalty faint case. When direct damage doesn't faint but the heavily injured penalty does (and death check is negative), the enemy is NOT tracked as defeated.
- **Status:** INCORRECT in `damage.post.ts` (see HIGH-001)

### 8. XP Store Extraction (M3 fix)

- **Rule:** Code organization concern -- `encounter.ts` exceeded 800 lines. XP calculation/distribution actions extracted to `encounterXp.ts`.
- **Implementation:**
  - `encounterXp.ts` (91 lines): clean, focused store with `calculateXp` and `distributeXp` actions. Both delegate to server endpoints. No game logic, pure API calls.
  - `encounter.ts` now at 758 lines, under the 800-line limit.
  - `SignificancePanel.vue` and `XpDistributionModal.vue` both import from `useEncounterXpStore()`.
- **Status:** CORRECT (code organization, not PTU mechanics)

### 9. Test Name Correction (MEDIUM-001 fix)

- **Rule:** Test names must accurately describe what they test.
- **Implementation:**
  - `injuryMechanics.test.ts` line 144: Test reads "declares death at exactly the threshold (100 HP Pokemon at -200)" with comment "At exactly -200, which is <= -200, so death". Accurately describes the boundary condition being tested. The test verifies `isDead: true` at exact threshold, which matches `checkDeath`'s `<=` comparison. Correct.
  - All other test names reviewed and found to be accurate and descriptive.
- **Status:** CORRECT

## Issues Found

### HIGH-001: damage.post.ts misses heavily-injured-penalty faint in defeated enemy tracking

**Severity:** HIGH
**File:** `app/server/api/encounters/[id]/damage.post.ts:116`
**PTU Ref:** Not a formula error, but a tracking gap that affects XP distribution for defeated enemies.

**Problem:** The `isDefeated` check on line 116 is:
```typescript
const isDefeated = damageResult.fainted || deathCheck.isDead
```

This does NOT account for the case where direct damage does not faint the target (`damageResult.fainted = false`) but the heavily injured penalty reduces HP to 0 (`entity.currentHp === 0`), and the death check is negative.

**Scenario:**
1. Enemy Pokemon with 8 injuries, 12 HP, maxHp 50 takes 5 damage via GM direct damage.
2. Direct damage: 12 - 5 = 7 HP. `damageResult.fainted = false`.
3. Heavily injured penalty: 7 - 8 = -1, clamped to 0. Entity is now fainted.
4. Death check: 8 injuries < 10, unclamped HP -1 > threshold -100. `isDead = false`.
5. `isDefeated = false || false = false`. Enemy not tracked as defeated.

**Evidence this is inconsistent:** The same file correctly detects this case at line 109:
```typescript
const faintedFromAnySource = damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)
```

And `move.post.ts` correctly handles it at line 167:
```typescript
fainted: damageResult.fainted || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0),
```

**Fix:** Change line 116 to:
```typescript
const isDefeated = damageResult.fainted || deathCheck.isDead || (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)
```

## Summary

The fix cycle addressed 7 of 8 original issues correctly. All PTU mechanics are faithfully implemented:

- **Heavily Injured penalty:** Both triggers (Standard Action and taking damage) are correctly implemented with proper gating. The `standardActionUsed` flag (C1 fix) correctly prevents the penalty from firing on non-Standard-Action turns (passing, shifting). The HP loss equals the injury count, matching PTU RAW.
- **Death checks:** Both injury-based (10+ injuries) and HP-based (-50 / -200%) death conditions are correct. The `<=` comparison and `Math.min` for "whichever is lower" are correct.
- **League Battle exemption:** HP-based death correctly suppressed while injury-based death always applies, per PTU p.251 and decree-021.
- **Faint handling:** All persistent and volatile conditions cleared on faint per PTU p.246-247. CS effects from those conditions reversed per decree-005.
- **decree-005 compliance:** CS reversal on faint is handled in all faint paths (direct damage, heavily injured penalty from damage, heavily injured penalty from Standard Action). `stageSources` tracking ensures only the actual applied deltas are reversed.

One HIGH issue remains: `damage.post.ts` does not track enemies defeated by heavily-injured-penalty faint in the `defeatedEnemies` list. This is an XP tracking gap, not a formula error, but it means enemies fainted via this specific path won't contribute to XP calculation. The same logic is already correct in `move.post.ts` and `next-turn.post.ts`, making this an inconsistency within the codebase.

## Rulings

1. **Heavily Injured HP loss = injury count, not 1/8 maxHp.** The task description mentions "R076: lose 1/8 maxHp" but the PTU RAW text says "lose Hit Points equal to the number of Injuries they currently have." The implementation correctly uses injury count. The rule matrix entry R076 may need updating to reflect RAW.
2. **GM direct damage endpoint applying heavily injured penalty is acceptable.** PTU says "takes Damage from an attack" but the GM damage endpoint is a manual tool. Applying the penalty on any damage application is a reasonable design choice -- the GM is unlikely to manually apply non-attack damage in combat where the distinction matters.

## Verdict

**CHANGES_REQUIRED**

One HIGH issue must be fixed before approval:
- HIGH-001: `damage.post.ts:116` must include heavily-injured-penalty faint in defeated enemy tracking.

## Required Changes

| # | Severity | File | Description |
|---|----------|------|-------------|
| HIGH-001 | HIGH | `app/server/api/encounters/[id]/damage.post.ts:116` | Change `isDefeated` to include heavily-injured-penalty faint: `damageResult.fainted \|\| deathCheck.isDead \|\| (heavilyInjuredHpLoss > 0 && entity.currentHp === 0)` |
