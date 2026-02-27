---
review_id: rules-review-013
target: refactoring-007
reviewer: game-logic-reviewer
verdict: APPROVED
date: 2026-02-16
commits_reviewed:
  - 5c8a2bb
  - d356d00
new_tickets:
  - refactoring-017
---

## Rules Review: refactoring-007 — Split useCombat.ts (PTU Correctness)

### Scope

Verified all PTU mechanics in the three composables produced by this refactoring:
- `useDamageCalculation.ts` (NEW — extracted from useCombat.ts)
- `useTypeChart.ts` (NEW — extracted from useCombat.ts)
- `useCombat.ts` (MODIFIED — slimmed from 475 to 234 lines)

Cross-referenced every formula, constant, and lookup table against `books/markdown/core/07-combat.md`, `books/markdown/core/05-pokemon.md`, and `books/markdown/errata-2.md`.

### Mechanics Verified

#### useDamageCalculation.ts (8 exports)

| # | Mechanic | Rule Reference | Status |
|---|----------|---------------|--------|
| 1 | Damage Base Chart (28 entries: rolled + set) | 07-combat.md:921-985 | CORRECT |
| 2 | getSetDamage (average lookup) | 07-combat.md:921-985 | CORRECT |
| 3 | getDamageRoll (notation lookup) | 07-combat.md:921-985 | CORRECT |
| 4 | getSetDamageByType (min/avg/max) | 07-combat.md:921-985 | CORRECT |
| 5 | rollDamageBase (delegates to diceRoller) | 07-combat.md:800-804 | CORRECT |
| 6 | getDamageByMode (set: avg, crit: x2) | 07-combat.md:800-804 | CORRECT |
| 7 | calculateDamage (full 7-step pipeline) | 07-combat.md:834-847 | CORRECT |
| 8 | calculateSetDamage (simplified wrapper) | — | CORRECT |

**Detail on #7 (calculateDamage):**
- STAB: +2 to DB before chart lookup — CORRECT (07-combat.md:790-793)
- Critical hit: `baseDamage += getSetDamage(effectiveDB)` doubles set damage — CORRECT (07-combat.md:800-804: "adds the Damage Dice Roll a second time...or 30+Stat going by set damage" — DB6 set avg is 15, crit gives 30)
- Formula order: DB → STAB → chart → +ATK → -DEF (min 1) → ×effectiveness — CORRECT
- Minimum 1 damage, immune overrides to 0 — CORRECT

#### useTypeChart.ts (6 exports)

| # | Mechanic | Rule Reference | Status |
|---|----------|---------------|--------|
| 9 | Type effectiveness chart (18 types) | 07-combat.md:992-1042 | CORRECT |
| 10 | getTypeEffectiveness (multiplicative stacking) | 07-combat.md:780-787 | CORRECT |
| 11 | getEffectivenessDescription | — | MINOR |
| 12 | Type immunities (6 rules) | 07-combat.md:1043-1055 | CORRECT |
| 13 | isImmuneToStatus | — | CORRECT |
| 14 | hasSTAB | 07-combat.md:790-793 | CORRECT |

**Detail on #9:** All 18 attacking types verified against Gen 6+ type chart (PTU 1.05 standard). Every super effective (1.5), resisted (0.5), immune (0), and neutral (1.0/omitted) matchup is correct. 0 incorrect, 0 missing, 0 spurious entries.

**Detail on #12:** Electric→Paralyzed, Fire→Burned, Ghost→Stuck/Trapped, Ice→Frozen, Poison→Poisoned/Badly Poisoned, Steel→Poisoned/Badly Poisoned, Grass→[] (powder handled separately). All match 07-combat.md:1043-1055.

**Note on #11:** `getEffectivenessDescription` uses `effectiveness >= 2` for "Doubly Super Effective", which means triple SE (3.375) also returns "Doubly Super Effective". Cosmetic only — the calculation is correct, only the label is imprecise for the rare triple-SE case. The server-side `getEffectivenessLabel` in `utils/damageCalculation.ts` handles this correctly with separate thresholds. Not a PTU incorrectness since no game values are affected.

#### useCombat.ts (15 exports remaining)

| # | Mechanic | Rule Reference | Status |
|---|----------|---------------|--------|
| 15 | stageMultipliers (-6 to +6) | 07-combat.md:701-728 | CORRECT |
| 16 | applyStageModifier (floor, clamped) | 07-combat.md:664-675 | CORRECT |
| 17 | calculatePokemonMaxHP | 07-combat.md:622, 05-pokemon.md:118 | CORRECT |
| 18 | calculateTrainerMaxHP | 07-combat.md:623 | CORRECT |
| 19 | calculateEvasion (+6 cap, stage-modified) | 07-combat.md:594-657 | CORRECT |
| 20 | calculateInitiative | 07-combat.md:730-733 | CORRECT |
| 21 | getAccuracyThreshold (+9 evasion cap) | 07-combat.md:735-755, 656-657 | CORRECT |
| 22 | calculateMaxActionPoints | 06-playing-the-game.md:220-222 | CORRECT |
| 23 | checkForInjury | 07-combat.md:1838-1856 | INCORRECT (dead code) |
| 24 | calculateXPGain | 11-running-the-game.md:2834-2856 | INCORRECT (dead code) |
| 25 | calculateMovementModifier | 07-combat.md:692-700 | NEEDS REVIEW (dead code) |

**Detail on #19 (evasion):** Uses `applyStageModifier(stat, combatStages)` — correctly applies combat stages to the raw stat before dividing by 5. `Math.min(6, ...)` caps stat-derived evasion at +6. `evasionBonus` stacks on top with `Math.max(0, ...)` floor. The +9 total cap is enforced at accuracy check time (#21), matching the rule: "you may only raise a Move's Accuracy Check by a max of +9."

### Dead Code Issues (Pre-Existing, Not Introduced)

These three functions are defined in useCombat.ts and exported, but **not consumed by any application code** (verified via grep). They are only referenced in `useCombat.test.ts` (unit tests) and `combat.md` (loop documentation). The real implementations live elsewhere.

#### #23: checkForInjury — INCORRECT

**Rule** (07-combat.md:1838-1856): Massive Damage (1 injury) AND HP marker crossings (1 injury each) stack in a single hit. Markers extend below -100% at every -50%. Example: "Max HP to -150% = 6 Injuries (1 Massive + 5 markers)."

**Code:** Uses early `return` — returns only the FIRST injury source found (either Massive Damage OR the first marker crossed, never both). Markers list is hardcoded `[50, 0, -50, -100]`, missing -150%, -200%, etc.

**Impact:** None — the server-side `combatant.service.ts:calculateDamage()` has a correct implementation with `countMarkersCrossed()` that handles stacking and dynamic markers. The client-side function is dead code.

#### #24: calculateXPGain — INCORRECT

**Rule** (11-running-the-game.md:2834-2856): XP = (sum of defeated levels × significance multiplier) / player count. No x10 multiplier exists. Trainer levels count double.

**Code:** `defeatedLevel * 10 / participantCount` — spurious x10, missing significance multiplier, no trainer level doubling.

**Impact:** None — function is not consumed by any application code.

#### #25: calculateMovementModifier — NEEDS REVIEW

**Rule** (07-combat.md:692-700): "bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down." Only positive example given (CS +6 → +3).

**Code:** `Math.floor(speedCombatStages / 2)` — for negative odd values, `Math.floor(-1/2)` = -1, vs "halve magnitude then negate" interpretation giving 0. Ambiguous.

**Impact:** None — function is not consumed by any application code.

### Pre-Existing Issue in Adjacent Code (Not Touched by Refactoring)

During damage formula verification, two pre-existing bugs were found in the client-side critical hit path. Neither was introduced or modified by this refactoring.

**Bug 1: `rollCritical` modifier not doubled** (`utils/diceRoller.ts:109`)
- Code: `total = diceSum + parsed.modifier` — adds flat modifier once
- Rule (07-combat.md:800-804): "adds the Damage Dice Roll a second time" — the full roll (dice + modifier) should be added again. For DB6 (2d6+8): should be 4d6+16, code produces 4d6+8
- Severity: CRITICAL (rolled damage mode)

**Bug 2: Critical hit flag hardcoded to false** (`composables/useMoveCalculation.ts:322`)
- Code: `rollDamageBase(effectiveDB.value, false)` — `isNat20` from accuracy results is never passed through
- Impact: Critical hits are cosmetically detected but deal normal damage in the GM move UI
- Severity: CRITICAL (both damage modes)

**Note:** The server-side `utils/damageCalculation.ts:calculateDamage()` correctly handles critical hits via set damage doubling. E2e tests exercise this correct server path. The bugs affect only the client-side GM UI damage workflow.

**New ticket filed:** refactoring-017 (PTU-INCORRECT, P1) — Critical hit damage non-functional in GM UI move workflow.

### Summary

| Category | Count | Details |
|----------|-------|---------|
| Active mechanics verified | 15 | All CORRECT |
| Dead code issues | 3 | Pre-existing, no gameplay impact |
| Adjacent-code issues | 2 | Pre-existing, ticket filed (refactoring-017) |
| Issues introduced by refactoring | 0 | Clean mechanical extraction confirmed |

### Verdict

**APPROVED.** The refactoring is a pure mechanical extraction with zero logic changes. All 15 active PTU mechanics in the three composables are correct. The 3 dead code issues and 2 critical hit bugs are all pre-existing — none were introduced by commits 5c8a2bb or d356d00.
