---
review_id: rules-review-254
review_type: rules
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-020
domain: healing
commits_reviewed:
  - e918bcee
  - b2cbeeb5
  - 9999122a
  - 64ba1d60
  - 1ff9d7ea
  - 7d2f48f9
  - fc9a8108
  - 3f2a833f
files_reviewed:
  - app/constants/healingItems.ts
  - app/server/services/healing-item.service.ts
  - app/composables/useHealingItems.ts
  - app/tests/unit/services/healing-item.service.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
reviewed_at: 2026-03-02T15:30:00Z
follows_up: rules-review-247
---

## Review Scope

PTU rules correctness review of P1 healing item implementation (feature-020). Verified all healing item catalog entries against PTU 1.05 p.276 (Basic Restoratives), status cure mechanics against p.246-248 (Status Afflictions), revive mechanics against p.248 (Fainting), and injury cap against p.250 (Injuries and healing).

Decree compliance verified: decree-005 (status CS auto-apply), decree-017 (effective max HP cap), decree-029 (rest healing minimum -- correctly NOT applied to items).

## PTU Rule Verification

### 1. Restorative Items (PTU p.276) -- CORRECT
- **Potion** (20 HP, $200): Matches PTU exactly
- **Super Potion** (35 HP, $380): Matches PTU exactly
- **Hyper Potion** (70 HP, $800): Matches PTU exactly
- **Energy Powder** (25 HP, $150, Repulsive): Matches PTU exactly
- **Energy Root** (70 HP, $500, Repulsive): Matches PTU exactly
- All restoratives correctly capped at effective max HP per decree-017

### 2. Status Cure Items (PTU p.276) -- CORRECT (with one exception)
- **Antidote** ($200): Cures Poison. Implementation cures both Poisoned and Badly Poisoned. PTU p.247: "Badly Poisoned is a more severe version of Poison" -- curing both under "Cures Poison" is the correct interpretation.
- **Paralyze Heal** ($200): Cures Paralysis. Correctly reverses -4 Speed CS per decree-005.
- **Burn Heal** ($200): Cures Burns. Correctly reverses -2 Defense CS per decree-005.
- **Ice Heal** ($200): Cures Freezing. Correctly modeled.
- **Full Heal** ($450): "Cures all Persistent Status Afflictions." Correctly uses `curesAllPersistent: true` which resolves to Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. Correctly does NOT cure volatile conditions (Confused, Asleep, etc.).
- **Heal Powder** ($350, Repulsive): Same as Full Heal. Correctly modeled.
- **Awakening** ($200): NOT IN PTU 1.05. See issue H1 below.

### 3. Full Restore (PTU p.276) -- CORRECT
- "Heals a Pokemon for 80 Hit Points and cures any Status Afflictions" ($1450)
- Implementation: `hpAmount: 80, curesAllStatus: true` -- CORRECT
- `curesAllStatus` resolves to all conditions except Fainted and Dead -- CORRECT interpretation. PTU "Status Afflictions" refers to Persistent and Volatile conditions (p.246-247), not the Fainted state (p.248, separate section).
- Correctly does NOT revive from Fainted. PTU provides separate Revive items for that purpose. Matches video game behavior.
- Application order (cure first, then heal) is correct for CS reversal consistency.

### 4. Revive Items (PTU p.276) -- CORRECT
- **Revive** ($300): "Revives fainted Pokemon and sets to 20 Hit Points." Implementation: `hpAmount: 20, canRevive: true` -- CORRECT. HP correctly capped at effective max per decree-017.
- **Revival Herb** ($350, Repulsive): "Revives Pokemon and sets to 50% Hit Points." Implementation: `healToPercent: 50, canRevive: true, repulsive: true` -- CORRECT. Floor rounding applied. Minimum 1 HP guard present (reasonable house-rule extension for extreme injury cases).

### 5. Faint Mechanics (PTU p.248) -- CORRECT
- "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." The implementation correctly handles this by:
  - Revive items only need to remove Fainted (other conditions already cleared on faint)
  - Non-revive items correctly reject fainted targets
  - Full Restore correctly cannot be used on fainted targets (no revive capability)
- "Potions and other healing items may still bring a Pokemon above 0 Hit Points, but it remains Fainted for another 10 minutes." -- The implementation correctly prevents non-revive items from being used on fainted targets, which is the simpler and more practical approach for a digital tool.

### 6. Item Refusal (PTU p.276) -- CORRECT
- PTU: "Pokemon may refuse items from their Trainer." The `targetAccepts: false` mechanism correctly models this with no item consumption on refusal.

### 7. Status CS Effects (decree-005) -- CORRECT
- Cure items correctly delegate to `updateStatusConditions()` which handles CS reversal with source tracking
- Burn cure reverses -2 Defense CS
- Paralysis cure reverses -4 Speed CS
- Poison cure reverses -2 Special Defense CS
- `badlyPoisonedRound` counter correctly reset to 0 when Badly Poisoned is cured
- Test suite verifies CS reversal for Burn, Paralysis, and Full Heal (all persistent)

### 8. Injury Cap on Healing (decree-017) -- CORRECT
- All HP healing (restoratives, combined, revives) correctly uses `getEffectiveMaxHp(maxHp, injuries)` to cap healing at injury-reduced max
- Test verifies injury cap on Potion validation (2 injuries reducing max from 45 to 35)
- Revive caps at effective max: `Math.min(item.hpAmount, effectiveMax)`
- Revival Herb uses `Math.floor(effectiveMax * 0.5)`

### 9. Rest Healing Minimum NOT Applied to Items (decree-029) -- CORRECT
- decree-029 establishes minimum 1 HP for rest healing. The ruling explicitly states "rest healing has a minimum of 1 HP" -- this applies to the rest healing formula, not to items. Items heal their stated amounts, and if the effective max is low, the item simply heals less. The implementation correctly does NOT apply a universal minimum 1 HP to all items (only Revival Herb has a minimum 1 guard for the edge case of extremely high injuries with percentage-based healing).

## Issues

### HIGH

**H1: Awakening item not in PTU 1.05 rulebook**

File: `app/constants/healingItems.ts`, lines 107-113

The PTU 1.05 p.276 Basic Restoratives table lists exactly 14 items. There is no "Awakening" in this list. The PTU approach to curing Sleep is:
1. Full Heal ($450) -- cures all Persistent conditions. However, Asleep is volatile (PTU p.247), so Full Heal intentionally does NOT cure Sleep.
2. Full Restore ($1450) -- cures "any Status Afflictions" including volatiles. This DOES cure Sleep.
3. Save checks -- Pokemon can attempt DC 16 check at start of turn (PTU p.247).
4. Taking damage -- "Sleep is cured if the sleeping target takes damage" (PTU p.247).

The absence of a cheap targeted sleep cure in PTU 1.05 is a deliberate design choice. Sleep is intended to be harder to cure with items than persistent conditions (which have cheap targeted cures). Adding Awakening at $200 fundamentally changes the PTU item economy around Sleep.

The Awakening exists in the Pokemon video games but was not included in PTU 1.05's item catalog. The developer's implementation log claims it was "referenced in spec section F item list" but section F of spec-p1.md does not mention Awakening, and the shared-specs canonical item table (14 items) does not include it.

Required resolution: Either remove Awakening from the catalog (aligning with PTU 1.05 and the design spec), or file a `decree-need` ticket for human ruling on whether to include this as a house-rule extension. Non-PTU items require explicit human authorization.

## What Looks Good

1. **All 14 PTU items correctly modeled**: Every item in the PTU 1.05 p.276 Basic Restoratives table has accurate HP amounts, condition targets, costs, and categories.

2. **Persistent vs Volatile distinction correct**: Full Heal correctly targets only persistent conditions. Full Restore correctly targets all status afflictions (both persistent and volatile, excluding Fainted/Dead). This distinction is critical to PTU rules and is implemented precisely.

3. **Antidote covers Badly Poisoned**: The interpretation that Antidote cures both Poisoned and Badly Poisoned (since Badly Poisoned is a "more severe version of Poison" per PTU p.247) is the correct PTU reading.

4. **Full Restore does not revive**: The distinction between Full Restore (heals + cures status, but not Fainted) and Revive (specifically removes Fainted) matches both PTU item descriptions and video game behavior. "Status Afflictions" in PTU p.276 refers to Persistent and Volatile conditions, not the Fainted state.

5. **Decree compliance is thorough**: decree-005 CS reversal, decree-017 effective max HP cap, and decree-029 rest minimum (correctly NOT applied to items) are all properly respected.

6. **Repulsive flag correctly deferred**: PTU p.276 says repulsive medicines "decrease a Pokemon's loyalty with repeated use." Since loyalty is not tracked, the flag is stored and displayed without mechanical effect. This is the correct approach.

7. **Test coverage verifies PTU mechanics**: The test suite includes specific verification of CS reversal per decree-005, injury cap per decree-017, Revival Herb percentage rounding, and Full Restore condition curing order.

## Verdict

**CHANGES_REQUIRED**

One rules issue requires resolution:
- **H1**: Awakening item is not in PTU 1.05. Must be removed or authorized via decree. This is a house-rule-level addition that changes PTU's intended item balance around Sleep curing.

All other 14 PTU items are correctly implemented with verified PTU page references. Status cure mechanics, revive logic, Full Restore behavior, faint mechanics, injury caps, and decree compliance are all verified correct.
