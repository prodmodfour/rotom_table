---
review_id: rules-review-018
target: refactoring-019
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-17
trigger: developer-fix-review
commits_reviewed:
  - 5565b6e
files_reviewed:
  - app/composables/useTypeChart.ts
  - app/utils/damageCalculation.ts
  - app/tests/unit/composables/useTypeChart.test.ts
ptu_references:
  - "07-combat.md:780-787 (damage multiplier tiers)"
  - "07-combat.md:1010-1022 (dual-type interaction rules)"
  - "07-combat.md:1030-1033 (triple-type interactions)"
  - "errata-2.md (no type effectiveness errata found)"
---

## PTU Rules Verification Report

### Scope

- [x] Net-classification effectiveness algorithm (replaces multiplicative loop)
- [x] `NET_EFFECTIVENESS` lookup table values against PTU-defined tiers
- [x] All 8 PTU dual/triple-type interaction rules
- [x] Test case type matchups against PTU type chart
- [x] Both code paths (`useTypeChart.ts` composable + `damageCalculation.ts` utility)
- [x] `getEffectivenessDescription` / `getEffectivenessLabel` ordering correctness
- [x] Errata check for type effectiveness changes

### Algorithm Verification

The fix replaces a multiplicative loop (`effectiveness *= chart[defType]`) with PTU's qualitative classification system:

1. For each defender type, classify as SE (`value > 1`), resist (`value < 1`), immune (`value === 0`), or neutral (undefined/exactly 1)
2. If any immune → return 0 immediately
3. Net = SE count - resist count
4. Look up flat multiplier from `NET_EFFECTIVENESS` table

This directly implements the PTU dual-type rules from 07-combat.md:1010-1033.

### Mechanics Verified

#### 1. Doubly Super Effective (×2)
- **Rule:** "If both Types are weak, the attack is doubly super-effective and does x2 damage." (07-combat.md:1016-1017)
- **Implementation:** net=2 → `NET_EFFECTIVENESS[2]` = 2.0
- **Previous (incorrect):** `1.5 × 1.5 = 2.25` (12.5% overcalculation)
- **Status:** CORRECT
- **Severity:** n/a (fixed)

#### 2. SE + Resist = Neutral (×1.0)
- **Rule:** "If one Type is weak and one is resistant, the attack is neutral." (07-combat.md:1019-1020)
- **Implementation:** net=0 → `NET_EFFECTIVENESS[0]` = 1.0
- **Previous (incorrect):** `1.5 × 0.5 = 0.75` (25% undercalculation)
- **Status:** CORRECT
- **Severity:** n/a (fixed)

#### 3. Triply Super Effective (×3)
- **Rule:** "triply super-effective attacks do x3 damage" (07-combat.md:1032-1033)
- **Implementation:** net=3 → `NET_EFFECTIVENESS[3]` = 3.0
- **Previous (incorrect):** `1.5 × 1.5 × 1.5 = 3.375`
- **Status:** CORRECT
- **Severity:** n/a (fixed)

#### 4. Triply Resisted (×0.125)
- **Rule:** "A rare triply-Resisted hit deals 1/8th damage." (07-combat.md:786-787)
- **Implementation:** net=-3 → `NET_EFFECTIVENESS[-3]` = 0.125
- **Previous:** `0.5 × 0.5 × 0.5 = 0.125` (happened to be correct multiplicatively)
- **Status:** CORRECT

#### 5. Doubly Resisted (×0.25)
- **Rule:** "If both Types are resistant, the attack is doubly resisted and does 1/4th damage" (07-combat.md:1013-1014)
- **Implementation:** net=-2 → `NET_EFFECTIVENESS[-2]` = 0.25
- **Previous:** `0.5 × 0.5 = 0.25` (happened to be correct multiplicatively)
- **Status:** CORRECT

#### 6. Immunity Overrides All
- **Rule:** "If either Type is Immune, the attack does 0 damage." (07-combat.md:1022)
- **Implementation:** `if (value === 0) return 0` — early return before SE/resist counting
- **Status:** CORRECT

#### 7. Single-Type Super Effective (×1.5)
- **Rule:** "A Super-Effective hit will deal x1.5 damage." (07-combat.md:781-782)
- **Implementation:** net=1 → `NET_EFFECTIVENESS[1]` = 1.5
- **Status:** CORRECT

#### 8. Single-Type Resisted (×0.5)
- **Rule:** "A Resisted Hit deals 1/2 damage" (07-combat.md:785)
- **Implementation:** net=-1 → `NET_EFFECTIVENESS[-1]` = 0.5
- **Status:** CORRECT

### Test Case Type Matchup Verification

All test cases use real type matchups verified against the PTU type chart:

| Test | Attack → Defender | Per-type | Net | Expected | Correct? |
|------|-------------------|----------|-----|----------|----------|
| Doubly SE #1 | Fire → Grass/Steel | SE+SE | +2 | 2.0 | Yes |
| Doubly SE #2 | Ground → Fire/Steel | SE+SE | +2 | 2.0 | Yes |
| Doubly SE #3 | Electric → Water/Flying | SE+SE | +2 | 2.0 | Yes |
| SE+Resist #1 | Fighting → Ice/Poison | SE+Resist | 0 | 1.0 | Yes |
| SE+Resist #2 | Fire → Grass/Water | SE+Resist | 0 | 1.0 | Yes |
| Triply SE | Ice → Grass/Ground/Flying | SE+SE+SE | +3 | 3.0 | Yes |
| Mixed (SE+neutral) | Ground → Water/Grass | neutral+Resist | -1 | 0.5 | Yes |
| Double resist | Fire → Fire/Dragon | Resist+Resist | -2 | 0.25 | Yes |
| Immunity override | Ground → Water/Flying | neutral+Immune | — | 0 | Yes |

Ground→Water: not listed in chart (neutral). Ground→Grass: 0.5 (resist). Net=-1 → 0.5. Confirmed correct.

### Code Path Consistency

Both implementations are algorithmically identical:
- **`useTypeChart.ts:36-63`** — composable (used by `useMoveCalculation.ts`)
- **`damageCalculation.ts:248-279`** — standalone utility (used by `calculateDamage()`)

Both share: same `NET_EFFECTIVENESS` table, same SE/resist counting loop, same immunity early return, same `?? 1` fallback.

Type charts are identical across both files (18 types, same entries verified).

### Label Function Verification

`getEffectivenessDescription` (composable) and `getEffectivenessLabel` (utility) both use extreme-inward ordering:

```
0      → Immune
≤0.125 → Triply Resisted
≤0.25  → Doubly Resisted
<1     → Resisted
≥3     → Triply Super Effective
≥2     → Doubly Super Effective
>1     → Super Effective
else   → Neutral
```

This correctly classifies all 8 possible output values (0, 0.125, 0.25, 0.5, 1.0, 1.5, 2.0, 3.0). No overlapping ranges.

### Known Issue (Pre-Existing, Tracked)

`NET_EFFECTIVENESS[net] ?? 1` returns neutral for net beyond ±3 instead of clamping to ±3. Already tracked by code-review-020 MEDIUM #1 and deferred to refactoring-020 (consolidation). Impact: only affects hypothetical 4+ type Pokemon, which are extremely rare in PTU.

### Errata Check

Searched `books/markdown/errata-2.md` for type effectiveness, type chart, super effective, resistance, and weakness. No errata corrections apply to type effectiveness rules.

### Summary

- Mechanics checked: 8
- Correct: 8
- Incorrect: 0
- Needs review: 0

### Verdict

**APPROVED.** The net-classification algorithm directly implements all 8 PTU dual/triple-type interaction rules from 07-combat.md:1010-1033. All three ticket findings (doubly SE 2.25→2.0, SE+resist 0.75→1.0, triply SE 3.375→3.0) are correctly fixed. Both code paths are consistent. Test cases use verified type matchups. No errata corrections apply.
