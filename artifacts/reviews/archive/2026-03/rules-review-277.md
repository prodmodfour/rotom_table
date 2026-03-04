---
review_id: rules-review-277
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-018
domain: scenes
commits_reviewed:
  - d0dc47fb
  - 74930b05
  - d84459e4
  - e3ea37ee
mechanics_verified:
  - weather-damage-hail
  - weather-damage-sandstorm
  - weather-type-immunity
  - weather-ability-immunity-hail
  - weather-ability-immunity-sandstorm
  - weather-adjacent-ally-protection
  - weather-fainted-ally-exclusion
  - weather-tick-timing
  - weather-tick-formula
  - weather-duration-decrement
  - weather-trainer-interaction
  - weather-faint-handling
  - weather-minimum-damage
  - weather-declaration-phase-skip
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - "PTU p.342 — Hail effects (all non-Ice Type Pokemon lose a Tick at turn start)"
  - "PTU p.342 — Sandstorm effects (all non-Ground/Rock/Steel Type Pokemon lose a Tick at turn start)"
  - "PTU p.246 — Tick of Hit Points (1/10th max HP)"
  - "PTU p.1541-1543 — Ice Body (immune to Hail, heals 1 tick)"
  - "PTU p.2384-2388 — Snow Cloak (user + adjacent allies immune to Hail)"
  - "PTU p.2389-2392 — Snow Warning (user not damaged by Hail)"
  - "PTU p.1950-1954 — Overcoat (immune to weather damage)"
  - "PTU p.1770-1775 — Magic Guard (immune to Weather damage)"
  - "PTU p.2252-2256 — Sand Veil (user + adjacent allies immune to Sandstorm)"
  - "PTU p.2242-2246 — Sand Rush (immune to Sandstorm damage)"
  - "PTU p.2236-2241 — Sand Force (immune to Sandstorm damage)"
  - "PTU p.1106-1108 — Desert Weather (immune to Sandstorm Damage)"
  - "PTU p.2247-2251 — Sand Stream (user not damaged by Sandstorm)"
  - "PTU p.1991-1997 — Permafrost (subtract 5 from tick HP loss)"
  - "PTU p.342 — Weather Conditions last 5 rounds"
  - "decree-001 — Minimum 1 damage at both post-defense and final steps"
  - "decree-004 — Massive damage uses real HP lost after temp HP absorption"
reviewed_at: 2026-03-03T18:00:00Z
follows_up: rules-review-275
---

## Decree Check

Scanned all active decrees. Relevant to this domain:

- **decree-001** (minimum damage floor): Weather tick damage goes through `calculateDamage()` from `combatant.service.ts` which enforces the dual minimum-1 floor. The tick itself uses `Math.max(1, Math.floor(maxHp / 10))` guaranteeing minimum 1. COMPLIANT.
- **decree-004** (massive damage uses real HP after temp HP): Weather damage is applied via `calculateDamage()` which implements decree-004's temp HP absorption logic. COMPLIANT.
- **decree-032** (Cursed tick only on Standard Action): Weather damage is correctly separated from status tick damage and fires at a different lifecycle point (turn start vs turn end). No interaction issues. COMPLIANT.

No decree violations found.

---

## Previous Review Issues — Resolution Verification

### rules-review-275 HIGH-001: Sand Stream Missing from SANDSTORM_IMMUNE_ABILITIES

**Previous finding:** `SANDSTORM_IMMUNE_ABILITIES` did not include `'Sand Stream'`. PTU p.2247-2251: "As a static effect, the user is not damaged by Sandstorm."

**Fix commit:** d0dc47fb

**Verification:** `weatherRules.ts:88-89` now reads:
```typescript
export const SANDSTORM_IMMUNE_ABILITIES: string[] = [
  'Sand Veil', 'Sand Rush', 'Sand Force', 'Desert Weather', 'Overcoat', 'Magic Guard', 'Sand Stream'
]
```
Sand Stream is present. Comment at line 86-87 cites "PTU 10-indices p.2247-2251."

**Status:** RESOLVED.

### rules-review-275 HIGH-002: Magic Guard Missing from Both Immunity Arrays

**Previous finding:** Magic Guard explicitly grants Weather damage immunity (PTU p.1770-1775) but was absent from both `HAIL_IMMUNE_ABILITIES` and `SANDSTORM_IMMUNE_ABILITIES`.

**Fix commit:** d0dc47fb

**Verification:** `weatherRules.ts:74-76`:
```typescript
export const HAIL_IMMUNE_ABILITIES: string[] = [
  'Ice Body', 'Snow Cloak', 'Snow Warning', 'Overcoat', 'Magic Guard'
]
```
`weatherRules.ts:88-89`:
```typescript
export const SANDSTORM_IMMUNE_ABILITIES: string[] = [
  'Sand Veil', 'Sand Rush', 'Sand Force', 'Desert Weather', 'Overcoat', 'Magic Guard', 'Sand Stream'
]
```
Magic Guard is present in both arrays. Comment at line 72 cites "PTU p.1770-1775."

**Status:** RESOLVED.

### rules-review-275 MEDIUM-001: Permafrost Damage Reduction Not Handled

**Previous finding:** Permafrost subtracts 5 from weather tick HP loss (PTU p.1991-1997). Not handled in P0, recommended deferral to P1/P2 with tracking.

**Fix commit:** d0dc47fb

**Verification:** `weatherRules.ts:212` now contains tracking comment:
```typescript
// Permafrost damage reduction not handled (tracked in ptu-rule-133)
```
Ticket `artifacts/tickets/open/ptu-rule/ptu-rule-133.md` exists with title "Permafrost ability weather damage reduction not handled" at P4 priority.

**Status:** RESOLVED (deferred with tracking as recommended).

### rules-review-275 MEDIUM-002: Ticket Text Said 1/16 Instead of 1/10

**Previous finding:** `feature-018.md:33` said "1/16 max HP damage" instead of the correct "1/10 max HP" (1 Tick per PTU p.246).

**Fix commit:** d84459e4

**Verification:** `feature-018.md:33` now reads:
```
- Hail/Sandstorm: 1/10 max HP damage (1 Tick) at turn start (with type immunities)
```
The text is correct and matches PTU p.246.

**Status:** RESOLVED.

---

## Mechanics Verified

### 1. Hail Damage Formula

- **Rule:** "While it is Hailing, all non-Ice Type Pokemon lose a Tick of Hit Points at the beginning of their turn." (PTU p.342)
- **Rule:** "A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points." (PTU p.246, `07-combat.md:831-833`)
- **Implementation:** `weather-automation.service.ts:94` calls `calculateTickDamage(combatant.entity.maxHp)` which computes `Math.max(1, Math.floor(maxHp / 10))` (imported from `status-automation.service.ts:56-58`).
- **Status:** CORRECT.

### 2. Sandstorm Damage Formula

- **Rule:** "While it is Sandstorming, all non-Ground, Rock, or Steel Type Pokemon lose a Tick of Hit Points at the beginning of their turn." (PTU p.342)
- **Implementation:** Same `calculateTickDamage()` function, same 1/10th max HP formula. `weatherRules.ts:47` `isDamagingWeather()` correctly identifies both `'hail'` and `'sandstorm'`.
- **Status:** CORRECT.

### 3. Hail Type Immunity

- **Rule:** "all non-Ice Type Pokemon" -- Ice-type Pokemon are immune (PTU p.342).
- **Implementation:** `weatherRules.ts:61` `HAIL_IMMUNE_TYPES = ['Ice']`. `isImmuneToHail()` at lines 168-173 checks `getCombatantTypes()` against this array. `getCombatantTypes()` reads `pokemon.types` (the `[PokemonType] | [PokemonType, PokemonType]` tuple).
- **Status:** CORRECT. Dual-type Pokemon with Ice as either type are correctly immune.

### 4. Sandstorm Type Immunity

- **Rule:** "all non-Ground, Rock, or Steel Type Pokemon" -- those types are immune (PTU p.342).
- **Implementation:** `weatherRules.ts:64` `SANDSTORM_IMMUNE_TYPES = ['Ground', 'Rock', 'Steel']`. Same checking pattern as Hail in `isImmuneToSandstorm()` at lines 232-236.
- **Status:** CORRECT. Any Pokemon with at least one of these types is immune.

### 5. Hail Ability Immunity (Complete List)

Verified every ability that grants Hail immunity against PTU source text:

| Ability | PTU Source | Implemented |
|---------|-----------|-------------|
| Ice Body | "The user is not damaged by Hail." (p.1541-1543) | Yes, in `HAIL_IMMUNE_ABILITIES` |
| Snow Cloak | "The user and allies adjacent to the user are not damaged by Hail." (p.2384-2388) | Yes, in `HAIL_IMMUNE_ABILITIES` + `HAIL_ADJACENT_PROTECTION` |
| Snow Warning | "the user is not damaged by Hail." (p.2389-2392) | Yes, in `HAIL_IMMUNE_ABILITIES` |
| Overcoat | "does not take damage from any Weather that would normally cause it to take damage." (p.1950-1954) | Yes, in `HAIL_IMMUNE_ABILITIES` |
| Magic Guard | "immune to damage and Hit Point loss from Hazards, Weather..." (p.1770-1775) | Yes, in `HAIL_IMMUNE_ABILITIES` |

- **Status:** CORRECT. All five Hail-immune abilities are present. No omissions found.

### 6. Sandstorm Ability Immunity (Complete List)

Verified every ability that grants Sandstorm immunity against PTU source text:

| Ability | PTU Source | Implemented |
|---------|-----------|-------------|
| Sand Veil | "The user and allies adjacent to the user are not damaged by the Sandstorm." (p.2252-2256) | Yes, in `SANDSTORM_IMMUNE_ABILITIES` + `SANDSTORM_ADJACENT_PROTECTION` |
| Sand Rush | "the user is immune to damage from Sandstorms." (p.2242-2246) | Yes, in `SANDSTORM_IMMUNE_ABILITIES` |
| Sand Force | "the user is immune to damage from Sandstorms." (p.2236-2241) | Yes, in `SANDSTORM_IMMUNE_ABILITIES` |
| Desert Weather | "The user is immune to Sandstorm Damage" (p.1106-1108) | Yes, in `SANDSTORM_IMMUNE_ABILITIES` |
| Overcoat | "does not take damage from any Weather" (p.1950-1954) | Yes, in `SANDSTORM_IMMUNE_ABILITIES` |
| Magic Guard | "immune to damage and Hit Point loss from...Weather" (p.1770-1775) | Yes, in `SANDSTORM_IMMUNE_ABILITIES` |
| Sand Stream | "the user is not damaged by Sandstorm." (p.2247-2251) | Yes, in `SANDSTORM_IMMUNE_ABILITIES` |

- **Status:** CORRECT. All seven Sandstorm-immune abilities are present. No omissions found.

### 7. Adjacent Ally Protection (Snow Cloak / Sand Veil)

- **Rule:** Snow Cloak: "allies adjacent to the user are not damaged by Hail." (PTU p.2387-2388)
- **Rule:** Sand Veil: "allies adjacent to the user are not damaged by the Sandstorm." (PTU p.2255-2256)
- **Implementation:** `weatherRules.ts:93-96` defines `HAIL_ADJACENT_PROTECTION = ['Snow Cloak']` and `SANDSTORM_ADJACENT_PROTECTION = ['Sand Veil']`. The adjacency check uses Chebyshev distance (dx <= 1 && dy <= 1 && dx + dy > 0), which correctly models "adjacent" as the 8 surrounding cells. Same-side filtering (`ally.side !== combatant.side`) ensures only allies provide protection.
- **Status:** CORRECT.

### 8. Fainted Ally Exclusion from Adjacent Protection

- **Rule:** Fainted Pokemon cannot use abilities (PTU p.248 implicit -- fainted Pokemon are removed from active play).
- **Implementation:** Both `isImmuneToHail()` (line 190) and `isImmuneToSandstorm()` (line 254) now include `if (ally.entity.currentHp <= 0) continue` in their adjacent ally loops. Comment cites "PTU p.248: fainted abilities inactive."
- **Status:** CORRECT. This was missing in the original review (code-review-302 HIGH-001) and has been properly fixed.

### 9. Weather Tick Timing (Turn Start)

- **Rule:** "at the beginning of their turn" (PTU p.342, both Hail and Sandstorm).
- **Implementation:** In `next-turn.post.ts:448-513`, weather tick processing occurs AFTER `currentTurnIndex++` (line 234) and after round/phase transitions, targeting `turnOrder[currentTurnIndex]` -- the INCOMING combatant whose turn is starting.
- **Contrast with status ticks:** Status ticks (Burn/Poison/Cursed) are processed at lines 170-221 BEFORE advancing the turn index, applying to the OUTGOING combatant. This correctly separates turn-end and turn-start effects.
- **Status:** CORRECT.

### 10. Declaration Phase Skip

- **Rule:** Declaration phase in League Battles is not a real turn -- it is just declaring an action. Weather damage should only fire at actual turn start.
- **Implementation:** `next-turn.post.ts:454` checks `currentPhase !== 'trainer_declaration'` before weather processing.
- **Status:** CORRECT.

### 11. Weather Duration Decrement

- **Rule:** "Weather Conditions last 5 rounds." (PTU p.342)
- **Implementation:** `turn-helpers.ts:209-222` `decrementWeather()` decrements duration at round end. Manual weather (source `'manual'`) is exempt from decrement. When duration reaches 0, weather is cleared to null.
- **Status:** CORRECT. Duration management follows PTU rules.

### 12. Damage Application Pipeline

- **Implementation:** Weather tick damage flows through the standard damage pipeline:
  1. `calculateTickDamage()` computes raw tick amount (1/10 max HP, min 1)
  2. `calculateDamage()` from `combatant.service.ts` applies temp HP absorption, injury markers, massive damage checks (per decree-004)
  3. `applyDamageToEntity()` updates HP, temp HP, injuries on the entity
  4. Faint handling via `applyFaintStatus()` if fainted
  5. Mount auto-dismount via `clearMountOnFaint()` if applicable
  6. Database sync via `syncEntityToDatabase()`
- **Minimum damage (decree-001):** The tick itself is always >= 1 from `calculateTickDamage()`. The `calculateDamage()` function handles further pipeline steps. Since weather tick is flat HP damage (not attack-defense), the decree-001 dual floor on attack rolls is not directly triggered, but the tick minimum of 1 is correct per the PTU Tick definition.
- **Status:** CORRECT.

### 13. Trainer Weather Damage

- **Rule:** PTU p.342 says "all non-Ice Type Pokemon" for Hail and "all non-Ground, Rock, or Steel Type Pokemon" for Sandstorm.
- **Implementation:** `getCombatantTypes()` returns `[]` for trainers (no types), so trainers fail the type immunity check and take weather damage. The design spec explicitly documents this as a deliberate decision for Full Contact battles.
- **Status:** ACCEPTABLE. Not strictly RAW (text says "Pokemon"), but a reasonable gameplay design decision documented in the spec. No decree exists to contradict this. If contested, a decree-need ticket can be filed.

### 14. Faint Handling from Weather Damage

- **Implementation:** `next-turn.post.ts:485-498` handles weather-induced faint: `applyFaintStatus()`, mount auto-dismount via `clearMountOnFaint()`, defeated enemy tracking via `trackDefeated()`.
- **Status:** CORRECT. Matches the existing faint handling pattern used for status tick damage.

---

## Positive Findings

1. **All rules-review-275 issues resolved.** Sand Stream and Magic Guard added to immunity arrays. Permafrost tracked via ptu-rule-133. Ticket text corrected from 1/16 to 1/10.

2. **Comprehensive ability audit.** Performed a full search of the PTU ability index for any ability mentioning Hail, Sandstorm, or weather immunity. All immune-granting abilities are now present in the correct arrays. No omissions detected.

3. **Fainted ally protection correctly implemented.** The adjacent ally protection loops now skip fainted allies (HP <= 0), preventing dead Pokemon from conferring weather immunity -- a subtle but important PTU mechanic.

4. **Clean tick formula reuse.** `calculateTickDamage()` from `status-automation.service.ts` is shared between status tick damage (Burn, Poison) and weather tick damage (Hail, Sandstorm). Single source of truth for the 1/10th max HP calculation.

5. **Correct turn lifecycle placement.** Weather damage fires at the start of the incoming combatant's turn (after turn advance), while status ticks fire at the end of the outgoing combatant's turn (before turn advance). This precisely matches PTU RAW timing.

6. **Decree compliance.** Weather damage flows through `calculateDamage()` which handles decree-001 minimum floors and decree-004 temp HP absorption/massive damage rules automatically.

7. **Permafrost properly deferred.** The Permafrost ability (subtract 5 from weather tick HP loss, PTU p.1991-1997) is a niche mechanic that requires a damage reduction mechanism not present in the current tick pipeline. Deferral to P1/P2 with explicit tracking (ptu-rule-133 ticket + inline code comment) is the correct approach.

---

## Summary

The 4-commit fix cycle (d0dc47fb, 74930b05, d84459e4, e3ea37ee) successfully resolves all issues raised in rules-review-275. The two HIGH-severity issues (Sand Stream and Magic Guard missing from immunity arrays) are both fixed with correct PTU citations. The two MEDIUM-severity items (Permafrost tracking and ticket text correction) are both addressed. The refactoring extraction to `turn-helpers.ts` does not affect any game logic -- the helper functions are behaviorally identical to their inline predecessors.

A comprehensive re-audit of all weather-immune abilities against the PTU 1.05 ability index confirms no further omissions. The implementation correctly handles all 5 Hail-immune abilities, all 7 Sandstorm-immune abilities, and both adjacent ally protection abilities (Snow Cloak, Sand Veil).

---

## Verdict

**APPROVED**

All rules-review-275 issues are resolved. No new rules issues found. The weather damage automation correctly implements PTU 1.05 weather mechanics for P0 scope.

---

## Required Changes

None.
