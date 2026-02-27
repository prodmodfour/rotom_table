---
review_id: rules-review-019
target: refactoring-020
verdict: APPROVED
reviewer: game-logic-reviewer
date: 2026-02-17
trigger: refactoring-review
commits_reviewed:
  - 3f9afc0
  - a51e49c
  - 07fa45e
  - d7bff18
files_reviewed:
  - app/utils/typeChart.ts (new)
  - app/utils/damageCalculation.ts
  - app/composables/useTypeChart.ts
  - app/tests/unit/utils/typeChart.test.ts (new)
  - app/tests/unit/composables/useTypeChart.test.ts
mechanics_verified: 6
mechanics_correct: 6
mechanics_incorrect: 0
ptu_references:
  - 07-combat.md:780-787 (type effectiveness multipliers)
  - 07-combat.md:790-793 (STAB)
  - 07-combat.md:992-1033 (type chart, dual-type interaction rules)
  - 07-combat.md:1043-1055 (type status immunities)
  - 07-combat.md:1538-1561 (Burn, Frozen, Paralysis, Poison immunity detail)
  - 07-combat.md:1726-1729 (Ghost immunity to Stuck/Trapped)
---

## PTU Rules Verification Report

### Scope

- [x] TYPE_CHART — all 18 attacking types, all non-neutral matchups (SE, NVE, Immune)
- [x] NET_EFFECTIVENESS — 7-tier multiplier lookup table
- [x] getTypeEffectiveness — dual-type interaction logic and ±3 net clamp
- [x] getEffectivenessLabel — label-to-multiplier mapping
- [x] Type status immunities — composable typeImmunities table
- [x] STAB — composable hasSTAB function

### Mechanics Verified

#### 1. TYPE_CHART (18 types, all matchups)

- **Rule:** PTU 07-combat.md:780-787 — "A Super-Effective hit will deal x1.5 damage. A Doubly Super-Effective hit will deal x2 damage. Rare Triply-Effective Hits will deal x3 damage. A Resisted Hit deals 1/2 damage; a doubly Resisted hit deals 1/4th damage. A rare triply-Resisted hit deals 1/8th damage." Chart on page 238 follows Gen 6+ matchup table with PTU multipliers.
- **Implementation:** `typeChart.ts:15-34` — 18-type Record, only non-1.0 entries stored. SE=1.5, NVE=0.5, Immune=0.
- **Verification:** All 18 attacking types cross-referenced against canonical Gen 6+ type chart. Every SE, NVE, and Immune matchup verified individually. No missing matchups, no extra matchups, all multiplier values correct.
- **Status:** CORRECT
- **Severity:** N/A

#### 2. NET_EFFECTIVENESS table

- **Rule:** PTU 07-combat.md:780-787, 1010-1033 — "Super-Effective hit will deal x1.5 damage" (net +1), "Doubly Super-Effective hit will deal x2 damage" (net +2), "Triply-Effective Hits will deal x3 damage" (net +3), "Resisted Hit deals 1/2 damage" (net -1), "doubly Resisted hit deals 1/4th damage" (net -2), "triply-Resisted hit deals 1/8th damage" (net -3).
- **Implementation:** `typeChart.ts:41-49` — 7-entry Record mapping net -3 through +3.
- **Verification:** All 7 entries verified against rulebook text:

| Net | Rule | Code | Match |
|-----|------|------|-------|
| -3 | 1/8th damage (line 786-787) | 0.125 | Yes |
| -2 | 1/4th damage (line 1013-1014) | 0.25 | Yes |
| -1 | 1/2 damage (line 785) | 0.5 | Yes |
| 0 | neutral (line 1010-1011) | 1.0 | Yes |
| +1 | x1.5 damage (line 781) | 1.5 | Yes |
| +2 | x2 damage (line 782-783) | 2.0 | Yes |
| +3 | x3 damage (line 783-784) | 3.0 | Yes |

- **Status:** CORRECT
- **Severity:** N/A

#### 3. getTypeEffectiveness — dual-type interaction logic

- **Rule:** PTU 07-combat.md:1007-1033 — Five explicit rules for dual types, plus triply clause for >2 types.
- **Implementation:** `typeChart.ts:59-76` — counts SE and resist per type, immunity short-circuits to 0, nets SE-resist, clamps to ±3, looks up multiplier.
- **Verification:**

| Rule (line) | Expected behavior | Code behavior | Match |
|-------------|-------------------|---------------|-------|
| Both neutral (1010-1011) | Neutral | 0 SE, 0 resist → net 0 → 1.0 | Yes |
| Both resistant (1013-1014) | 1/4th | 0 SE, 2 resist → net -2 → 0.25 | Yes |
| Both weak (1016-1017) | x2 | 2 SE, 0 resist → net +2 → 2.0 | Yes |
| One weak, one resistant (1019-1020) | Neutral | 1 SE, 1 resist → net 0 → 1.0 | Yes |
| Either immune (1022) | 0 damage | `if (value === 0) return 0` early exit | Yes |
| Triply SE/resisted for >2 types (1030-1033) | x3 / 1/8th | net ±3 → 3.0 / 0.125 | Yes |
| Net beyond ±3 (code-review-020 fix) | Clamp to triply | `Math.max(-3, Math.min(3, ...))` | Yes — PTU defines triply as maximum tier |

- **Status:** CORRECT
- **Severity:** N/A

#### 4. getEffectivenessLabel

- **Rule:** Labels correspond to the 7 effectiveness tiers plus "Immune" from 07-combat.md:780-787, 1010-1033.
- **Implementation:** `typeChart.ts:81-90` — threshold-based label assignment.
- **Verification:** All 8 labels (Immune, Triply Resisted, Doubly Resisted, Resisted, Neutral, Super Effective, Doubly Super Effective, Triply Super Effective) map to the correct multiplier ranges from the rulebook.
- **Status:** CORRECT
- **Severity:** N/A

#### 5. Type status immunities

- **Rule:** PTU 07-combat.md:1043-1055, with detail at 1538-1561, 1726-1729.
- **Implementation:** `useTypeChart.ts:12-20` — `typeImmunities` Record.
- **Verification:**

| Rule (line) | Code entry | Match |
|-------------|-----------|-------|
| "Electric Types are immune to Paralysis" (1044, 1558) | `Electric: ['Paralyzed']` | Yes |
| "Fire Types are immune to Burn" (1046, 1538-1539) | `Fire: ['Burned']` | Yes |
| "Ghost Types cannot be Stuck or Trapped" (1048, 1726-1729) | `Ghost: ['Stuck', 'Trapped']` | Yes |
| "Grass Types are immune to...Powder" (1050-1051) | `Grass: []` + comment "handled separately" | Yes — Powder is a move keyword, not a status condition |
| "Ice Types are immune to being Frozen" (1053, 1548) | `Ice: ['Frozen']` | Yes |
| "Poison and Steel Types are immune to Poison" (1055, 1561) | `Poison: ['Poisoned', 'Badly Poisoned']`, `Steel: ['Poisoned', 'Badly Poisoned']` | Yes |

- **Status:** CORRECT
- **Severity:** N/A

#### 6. STAB (Same Type Attack Bonus)

- **Rule:** PTU 07-combat.md:790-793 — "If a Pokemon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2."
- **Implementation:** `useTypeChart.ts:33-35` — `userTypes.includes(moveType)`.
- **Verification:** Correctly checks if move type is in the attacker's type array. The +2 DB bonus is applied in `damageCalculation.ts:237`, not in the composable — correct separation of detection vs. application.
- **Status:** CORRECT
- **Severity:** N/A

### Integration Verification

The refactoring preserves behavioral equivalence for both consumers:

| Consumer | Import chain (before) | Import chain (after) | Behavioral change |
|----------|-----------------------|----------------------|-------------------|
| `useMoveCalculation.ts` | `useTypeChart()` → inline chart | `useTypeChart()` → `typeChart.ts` | None — same function signatures, same return values |
| `calculate-damage.post.ts` | `calculateDamage()` → inline `TYPE_CHART` | `calculateDamage()` → auto-imported `getTypeEffectiveness` from `typeChart.ts` | None — same formula, same chart data |

The `damageCalculation.ts` re-export (line 79) preserves the public API for any consumer importing type chart symbols from there.

### Errata Check

`books/markdown/errata-2.md` searched for type chart, type effectiveness, and related terms. **No errata corrections** apply to the type chart or type effectiveness mechanics.

### Test Coverage of PTU Mechanics

| Test file | PTU mechanic tested | Coverage |
|-----------|-------------------|----------|
| `typeChart.test.ts` (23 tests) | Chart completeness (18 types), all 7 NET_EFFECTIVENESS tiers, all immunity matchups (6 pairs), dual-type interactions (SE+SE, SE+resist, resist+resist, immunity+SE), ±3 clamp boundaries, all 8 labels | Comprehensive |
| `useTypeChart.test.ts` (13 tests) | Re-export wiring (4), hasSTAB (2), isImmuneToStatus (7 — all 6 type-immunity pairs + dual-type + negative case) | Comprehensive |

### Summary

- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0

### Verdict: APPROVED

This is a clean structural refactoring that consolidates duplicated PTU type chart data and logic into a single canonical utility. All type matchup data, effectiveness multipliers, dual-type interaction rules, type status immunities, and STAB detection are PTU 1.05 correct. The ±3 net clamp (code-review-020 fix) is a valid interpretation — PTU defines triply as the maximum tier. No regressions, no behavioral changes.
