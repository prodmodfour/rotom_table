---
review_id: rules-review-048
target: bug-006-and-bug-007
verdict: CHANGES_REQUIRED
reviewer: game-logic-reviewer
date: 2026-02-19
commits_reviewed:
  - 73074a1 (bug-007: stat point allocation)
  - 85af350 (bug-006: injury-reduced max HP)
---

## Review Summary

Reviewed two CRITICAL bug fixes for PTU rule correctness. Bug-007 (stat points) is fully correct. Bug-006 (injury-reduced max HP) is partially correct -- the HP cap logic is right, but the 1/16th rest healing amount now incorrectly uses the injury-reduced max instead of the real max, contradicting the prior ruling in rules-review-047 (healing-R007).

## Findings

### Finding 1: bug-007 -- Stat Point Allocation Formula

**Commit:** `73074a1`
**File:** `app/server/services/pokemon-generator.service.ts`
**Severity:** N/A (fix verified)
**Verdict:** CORRECT

**PTU Rule (05-pokemon.md, p.102-103):**
> "Next, add +X Stat Points, where X is the Pokemon's Level plus 10."
> "Because these Charmanders are Level 5, they each have a total of 15 added Stat Points."

**Implementation after fix:**
```typescript
let remainingPoints = Math.max(0, level + 10)
```

**Verification:**
- Level 1: `1 + 10 = 11` stat points. Correct.
- Level 5: `5 + 10 = 15` stat points. Matches the PTU worked example (Charmander Level 5 = 15 stat points).
- Level 20: `20 + 10 = 30` stat points. Correct.
- Level 100: `100 + 10 = 110` stat points. Correct.
- The `Math.max(0, ...)` guard is technically unnecessary (level + 10 is always >= 10), but is harmless.

**Errata check:** No errata corrections found for stat point distribution formula.

**Previous code:** `level - 1` produced 0 points at level 1, 4 at level 5. This was 11 points too low at every level, confirming the bug was real and the fix is correct.

---

### Finding 2: bug-006 -- Injury-Reduced Max HP Formula

**Commit:** `85af350`
**File:** `app/utils/restHealing.ts` (getEffectiveMaxHp)
**Severity:** N/A (fix verified)
**Verdict:** CORRECT

**PTU Rule (07-combat.md, p.250):**
> "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th. For example, a Pokemon with 3 injuries and 50 Max Hit Points could only heal up to 35 Hit Points, or 7/10ths of their maximum."

**Implementation:**
```typescript
export function getEffectiveMaxHp(maxHp: number, injuries: number): number {
  if (injuries <= 0) return maxHp
  const effectiveInjuries = Math.min(injuries, 10)
  return Math.floor(maxHp * (10 - effectiveInjuries) / 10)
}
```

**Verification:**
- 50 maxHp, 3 injuries: `floor(50 * 7/10) = floor(35) = 35`. Matches PTU example exactly.
- 60 maxHp, 1 injury: `floor(60 * 9/10) = floor(54) = 54`. Correct.
- 100 maxHp, 5 injuries: `floor(100 * 5/10) = 50`. Correct.
- 0 injuries: returns raw maxHp. Correct (early return).
- 10 injuries: `floor(maxHp * 0/10) = 0`. Correct (10 injuries = dead per PTU p.251: "10 injuries... they die").
- `Math.min(injuries, 10)` clamp prevents negative HP from >10 injuries. Correct defensive coding.

**Errata check:** No errata corrections found for injury HP reduction formula.

---

### Finding 3: bug-006 -- Pokemon Center HP Cap

**Commit:** `85af350`
**Files:** `app/server/api/pokemon/[id]/pokemon-center.post.ts`, `app/server/api/characters/[id]/pokemon-center.post.ts`
**Severity:** N/A (fix verified)
**Verdict:** CORRECT

**PTU Rule (07-combat.md, p.252):**
> "Pokemon Centers can heal a Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."
> "Pokemon Centers can remove a maximum of 3 Injuries per day"

**Implementation:** The code heals injuries first, then computes the effective max based on the POST-healing injury count, then sets HP to that effective max.

**Verification:**
- 3 injuries, center heals all 3: `newInjuries = 0`, `effectiveMax = getEffectiveMaxHp(maxHp, 0) = maxHp`. Heals to full raw max. Correct -- "full health" with 0 remaining injuries means raw max.
- 5 injuries, center heals 3: `newInjuries = 2`, `effectiveMax = getEffectiveMaxHp(maxHp, 2) = floor(maxHp * 8/10)`. Heals to 80% of raw max. Correct -- "full health" is capped by remaining injuries.
- Ordering is correct: injuries heal first, then HP caps at new effective max. This matches the PTU intent that the Pokemon Center is doing its best within the injury limitation system.

---

### Finding 4: bug-006 -- In-Combat Healing Cap

**Commit:** `85af350`
**File:** `app/server/services/combatant.service.ts` (applyHealingToEntity)
**Severity:** N/A (fix verified)
**Verdict:** CORRECT

**PTU Rule (07-combat.md, p.250):**
> "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th. For example, a Pokemon with 3 injuries and 50 Max Hit Points could only heal up to 35 Hit Points"

**Implementation:**
```typescript
const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
const newHp = Math.min(effectiveMax, previousHp + options.amount)
```

**Verification:** In-combat healing (Heal Pulse, Potions, etc.) is correctly capped at the injury-reduced max. A Pokemon with 50 maxHp and 3 injuries healed for 100 will cap at 35, not 50. This matches the PTU text "could only heal up to 35 Hit Points."

---

### Finding 5: bug-006 -- Rest Healing 1/16th Base Uses Wrong Max (CONTRADICTS rules-review-047)

**Commit:** `85af350`
**File:** `app/utils/restHealing.ts` (calculateRestHealing, getRestHealingInfo)
**Severity:** MEDIUM
**Verdict:** INCORRECT

**PTU Rules (07-combat.md):**
p.250: "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum."
p.252: "heal 1/16th of their Maximum Hit Points"

**Prior ruling (rules-review-047, healing-R007, verdict: CORRECT):**
> "The 1/16th rest healing formula references 'Maximum Hit Points' as a calculation input -- it computes a healing amount BASED ON maxHP. This falls under the 'Effects that go off the Pokemon's Max Hit Points' exemption. The real maximum should be used."
> "Using the injury-reduced max for the 1/16th formula would create a compounding effect where injuries reduce both the ceiling AND the rate of healing, which is overly punitive and not supported by the text."

**Implementation after bug-006 fix:**
```typescript
// calculateRestHealing (line 64-66):
const healAmount = Math.max(1, Math.floor(effectiveMax / 16))
const actualHeal = Math.min(healAmount, effectiveMax - currentHp)

// getRestHealingInfo (line 173):
const hpPerRest = Math.max(1, Math.floor(effectiveMax / 16))
```

**Problem:** The fix changed the 1/16th healing AMOUNT to use `effectiveMax` (injury-reduced) instead of `maxHp` (real). This contradicts rules-review-047's ruling that the 1/16th formula is an "Effect that goes off Max Hit Points" and should use the real maximum.

The correct implementation should be:
- **Healing amount (1/16th):** Uses real `maxHp` -- this is a formula that "goes off" max HP.
- **Healing cap:** Uses injury-reduced `effectiveMax` -- this is the "could only heal up to" ceiling.

**Example of the error:**
- 80 maxHp, 4 injuries: `effectiveMax = floor(80 * 6/10) = 48`
- Current (wrong): `healAmount = floor(48/16) = 3`
- Correct: `healAmount = floor(80/16) = 5`
- Both cap at `effectiveMax - currentHp`, but the per-rest healing amount is 40% lower than it should be.

**Required change in `calculateRestHealing()`:**
```typescript
// Healing AMOUNT: 1/16th of REAL max HP (PTU p.250: "use the real maximum")
const healAmount = Math.max(1, Math.floor(maxHp / 16))
// Healing CAP: injury-reduced effective max (PTU p.250: "could only heal up to")
const actualHeal = Math.min(healAmount, effectiveMax - currentHp)
```

**Required change in `getRestHealingInfo()`:**
```typescript
// Display value uses real maxHp for the per-rest amount
const hpPerRest = Math.max(1, Math.floor(maxHp / 16))
```

---

### Finding 6: Damage Thresholds Use Raw MaxHp (Verified Correct)

**File:** Not modified in these commits (verified via existing code)
**Severity:** N/A
**Verdict:** CORRECT (not affected by these changes)

**PTU Rule (07-combat.md, p.250):**
> "The artificial Max Hit Point number is not considered when potentially acquiring new injuries, or when dealing with any other effects such as Poison that consider fractional damage, or when dealing with Hit Point Markers."

The bug-006 ticket resolution log correctly notes: "Damage calculation and HP marker thresholds correctly continue to use raw maxHp per PTU rules (07-combat.md:1872-1876). Only healing caps are affected." The HP marker system (50%, 0%, -50%, -100%) was not modified by this commit and should continue to use raw maxHp. Verified correct.

---

## Pre-Existing Issues

None found in the touched code beyond the Finding 5 issue introduced by this commit.

## Summary Table

| # | Finding | File | Severity | Verdict |
|---|---------|------|----------|---------|
| 1 | Stat point formula (level + 10) | pokemon-generator.service.ts | N/A | CORRECT |
| 2 | getEffectiveMaxHp formula | restHealing.ts | N/A | CORRECT |
| 3 | Pokemon Center HP cap | pokemon-center.post.ts (x2) | N/A | CORRECT |
| 4 | In-combat healing cap | combatant.service.ts | N/A | CORRECT |
| 5 | Rest 1/16th uses effectiveMax instead of maxHp | restHealing.ts | MEDIUM | INCORRECT |
| 6 | Damage thresholds use raw maxHp | (not modified) | N/A | CORRECT (verified) |

## Verdict: CHANGES_REQUIRED

Bug-007 fix (commit `73074a1`) is fully correct. Approved.

Bug-006 fix (commit `85af350`) has one MEDIUM issue: the 1/16th rest healing amount formula should use real `maxHp`, not injury-reduced `effectiveMax`. The HP cap (where healing stops) correctly uses `effectiveMax`. The distinction is:
- `healAmount = floor(maxHp / 16)` -- how much HP each rest period provides (uses REAL max)
- `actualHeal = min(healAmount, effectiveMax - currentHp)` -- can't exceed injury-reduced ceiling

This also affects `getRestHealingInfo()` where `hpPerRest` should use `maxHp`, not `effectiveMax`.

All other aspects of the bug-006 fix (getEffectiveMaxHp utility, Pokemon Center endpoints, in-combat healing cap) are correct.
