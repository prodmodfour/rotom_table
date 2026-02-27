---
review_id: rules-review-049
target: bug-006-re-verify
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-19
follows_up: rules-review-048
commits_reviewed:
  - bf44494 (fix: use real maxHp for rest healing 1/16th calculation)
  - 2b9c66d (test: add unit tests for getEffectiveMaxHp)
---

## Review Summary

Re-verification of bug-006 after the Developer fixed the 1/16th formula issue flagged in rules-review-048 (Finding 5). Both the utility function fix and the accompanying unit tests are now correct. The distinction between real maxHp (for healing amount) and effective maxHp (for healing cap) is properly implemented and tested.

## Findings

### Finding 1: calculateRestHealing -- 1/16th Healing Amount Now Uses Real maxHp

**Commit:** `bf44494`
**File:** `app/utils/restHealing.ts` (lines 64-67)
**Severity:** N/A (fix verified)
**Verdict:** CORRECT

**PTU Rules (07-combat.md):**
p.250: "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."
p.252: "heal 1/16th of their Maximum Hit Points"

**Implementation after fix:**
```typescript
// Healing amount: 1/16th of REAL max HP (PTU p.250: "use the real maximum")
const healAmount = Math.max(1, Math.floor(maxHp / 16))
// Healing cap: injury-reduced effective max (PTU p.250: "could only heal up to")
const actualHeal = Math.min(healAmount, effectiveMax - currentHp)
```

**Verification with worked examples:**

1. **80 maxHp, 4 injuries, currentHp = 0:**
   - `effectiveMax = floor(80 * 6/10) = 48`
   - `healAmount = floor(80/16) = 5` (uses real maxHp -- CORRECT)
   - `actualHeal = min(5, 48 - 0) = 5`
   - Previous (wrong): `floor(48/16) = 3` -- was 40% lower

2. **50 maxHp, 3 injuries, currentHp = 34:**
   - `effectiveMax = floor(50 * 7/10) = 35`
   - `healAmount = floor(50/16) = 3` (uses real maxHp -- CORRECT)
   - `actualHeal = min(3, 35 - 34) = 1` (caps at effective max -- CORRECT)

3. **100 maxHp, 0 injuries, currentHp = 0:**
   - `effectiveMax = 100`
   - `healAmount = floor(100/16) = 6`
   - `actualHeal = min(6, 100 - 0) = 6`
   - No difference with 0 injuries, as expected.

4. **10 maxHp, 0 injuries (minimum clamp test):**
   - `healAmount = max(1, floor(10/16)) = max(1, 0) = 1`
   - Minimum 1 HP per rest. Correct.

**Diff review:** The commit changes `effectiveMax` to `maxHp` in exactly the right place (the numerator of the 1/16th formula) while leaving `effectiveMax` in the cap calculation (`effectiveMax - currentHp`). This is the exact change prescribed in rules-review-048, Finding 5.

---

### Finding 2: getRestHealingInfo -- hpPerRest Display Value Also Fixed

**Commit:** `bf44494`
**File:** `app/utils/restHealing.ts` (line 174)
**Severity:** N/A (fix verified)
**Verdict:** CORRECT

**Implementation after fix:**
```typescript
const hpPerRest = Math.max(1, Math.floor(maxHp / 16))
```

**Verification:** The display value `hpPerRest` now matches the actual healing computation in `calculateRestHealing`. Both use `maxHp` (real max), not `effectiveMax`. This ensures the UI shows the correct per-rest healing amount to the GM.

The `effectiveMax` variable is still computed on line 171 but is no longer used for the 1/16th calculation -- it remains available for the `canRestHeal` check and `restMinutesRemaining` logic, which is correct since those are about whether rest is allowed, not about the healing formula.

---

### Finding 3: Healing Cap Still Uses effectiveMax

**File:** `app/utils/restHealing.ts` (line 67)
**Severity:** N/A (verified correct)
**Verdict:** CORRECT

**PTU Rule (07-combat.md, p.250):**
> "a Pokemon with 3 injuries and 50 Max Hit Points could only heal up to 35 Hit Points"

**Implementation (unchanged by this fix):**
```typescript
const actualHeal = Math.min(healAmount, effectiveMax - currentHp)
```

**Verification:** The cap remains `effectiveMax - currentHp`, meaning a Pokemon can never heal above its injury-reduced ceiling. This is the correct interpretation of "could only heal up to 35 Hit Points."

Also verified: the "Already at full HP" check on line 60 (`currentHp >= effectiveMax`) correctly uses injury-reduced max, not raw max. A Pokemon at 35/50 HP with 3 injuries is considered "full" since their effective max is 35.

---

### Finding 4: API Callers Pass maxHp Correctly

**Files:** `app/server/api/pokemon/[id]/rest.post.ts`, `app/server/api/characters/[id]/rest.post.ts`
**Severity:** N/A (verified correct)
**Verdict:** CORRECT

Both REST endpoints pass `pokemon.maxHp` / `character.maxHp` from the Prisma model to `calculateRestHealing({ maxHp })`. The Prisma `maxHp` field stores the raw (real) maximum HP, not an injury-reduced value. Injuries are stored separately as `pokemon.injuries` / `character.injuries`.

This means the function receives the correct real maxHp for the 1/16th calculation and the correct injury count for the effectiveMax derivation.

---

### Finding 5: Unit Tests Cover the Distinction

**Commit:** `2b9c66d`
**File:** `app/tests/unit/utils/restHealing.test.ts`
**Severity:** N/A (verified correct)
**Verdict:** CORRECT

**Key test cases reviewed:**

1. **"uses real maxHp for 1/16th healing amount, not effective max"** (line 54):
   - 80 maxHp, 4 injuries: expects `hpHealed = 5` (from `floor(80/16)`), not 3 (from `floor(48/16)`)
   - This test would FAIL if the code regressed to using `effectiveMax`

2. **"caps healing at effective max, not raw max"** (line 67):
   - 50 maxHp, 3 injuries, currentHp = 34: expects `hpHealed = 1` (capped at `35 - 34`)
   - Verifies the cap uses injury-reduced max

3. **"reports already at full HP when at effective max"** (line 81):
   - 50 maxHp, 3 injuries, currentHp = 35: expects `canHeal = false`
   - Verifies the fullness check uses injury-reduced max (35), not raw max (50)

4. **"blocks rest healing with 5+ injuries"** (line 94): Correct per PTU p.252.

5. **"blocks rest healing after 480 minutes"** (line 105): Correct per PTU p.252 (8 hours).

6. **"heals minimum 1 HP even for very low maxHp"** (line 116): Edge case for `Math.max(1, ...)` clamp.

**Test quality assessment:** The tests directly encode the PTU rule distinction (real max for amount, effective max for cap) with concrete numeric examples. The first test case (80 maxHp, 4 injuries) is particularly strong as a regression guard -- the expected value of 5 is only correct if real maxHp is used.

All 14 tests pass (verified by running `vitest run`).

---

### Finding 6: Cross-Reference with PTU Rules

**PTU p.250 (07-combat.md, lines 1867-1876):**
> "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th."
> "The artificial Max Hit Point number is not considered when potentially acquiring new injuries, or when dealing with any other effects such as Poison that consider fractional damage, or when dealing with Hit Point Markers."
> "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."

**PTU p.252 (07-combat.md, lines 1995-2003):**
> "For the first 8 hours of rest each day, Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."

**Interpretation chain:**
1. Rest healing heals "1/16th of their Maximum Hit Points" -- this is a formula that computes a value based on Maximum Hit Points.
2. "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum" -- the 1/16th formula is such an effect.
3. Therefore: `healAmount = floor(realMaxHp / 16)`.
4. Separately, "could only heal up to [injury-reduced] Hit Points" -- this is the ceiling.
5. Therefore: `actualHeal = min(healAmount, effectiveMax - currentHp)`.

The current implementation matches this interpretation exactly. Confirmed correct.

---

## Pre-Existing Issues

None found in the touched code.

## Summary Table

| # | Finding | File | Severity | Verdict |
|---|---------|------|----------|---------|
| 1 | 1/16th healing amount uses real maxHp | restHealing.ts (calculateRestHealing) | N/A | CORRECT |
| 2 | hpPerRest display value uses real maxHp | restHealing.ts (getRestHealingInfo) | N/A | CORRECT |
| 3 | Healing cap still uses effectiveMax | restHealing.ts (calculateRestHealing) | N/A | CORRECT |
| 4 | API callers pass raw maxHp from Prisma | rest.post.ts (x2) | N/A | CORRECT |
| 5 | Unit tests cover amount vs cap distinction | restHealing.test.ts | N/A | CORRECT |
| 6 | Cross-reference with PTU p.250/p.252 | books/markdown/core/07-combat.md | N/A | CORRECT |

## Verdict: APPROVED

The fix in commit `bf44494` correctly resolves the issue identified in rules-review-048, Finding 5. The 1/16th rest healing amount now uses the real `maxHp` while the healing cap continues to use the injury-reduced `effectiveMax`. This matches the PTU p.250 rule that "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."

The unit tests in commit `2b9c66d` provide strong regression protection for this distinction, with concrete numeric examples that would fail if the code reverted to using `effectiveMax` for the 1/16th formula.

Bug-006 rest healing implementation is now fully PTU-compliant.
