---
review_id: rules-review-ptu-rule-133
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-133
domain: scenes
commits_reviewed:
  - 6eefc16b
  - c3465c0f
mechanics_verified:
  - permafrost-weather-damage-reduction
  - weather-tick-calculation
  - permafrost-immunity-interaction
  - minimum-damage-floor
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - 10-indices-and-reference.md#p1991-1997 (Permafrost ability)
  - 07-combat.md#p831-833 (Tick definition)
  - 10-indices-and-reference.md#p3552-3553 (Hail weather effect)
  - 10-indices-and-reference.md#p3585-3587 (Sandstorm weather effect)
  - 10-indices-and-reference.md#p10687-10696 (Sandstorm move)
  - 10-indices-and-reference.md#p7307-7315 (Hail move)
reviewed_at: 2026-03-05T13:00:00Z
follows_up: null
---

## Mechanics Verified

### Permafrost Weather Damage Reduction
- **Rule:** "The user gains 5 Damage Reduction against Super-Effective Damage. Additionally, whenever the user would lose a Tick of Hit Points due to an effect such as Sandstorm or the Burn Status condition, subtract 5 from the amount of Hit Points lost. Defensive." (`10-indices-and-reference.md` lines 1991-1997)
- **Implementation:** `WEATHER_DAMAGE_REDUCTION_ABILITIES` maps `'Permafrost'` to `5`. `getWeatherDamageReduction()` checks combatant abilities and returns the reduction amount. In `getWeatherTickForCombatant()`, after computing raw tick damage, the reduction is subtracted with `Math.max(1, rawTickDamage - reduction.reduction)`.
- **Status:** CORRECT — The reduction value of 5 matches the PTU ability text exactly. The ability text says "subtract 5 from the amount of Hit Points lost" and the code does exactly that for weather tick damage.

### Weather Tick Calculation
- **Rule:** "A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points." (`07-combat.md` lines 831-833). Hail: "all non-Ice Type Pokemon lose a Tick of Hit Points at the beginning of their turn" (`10-indices-and-reference.md` line 3552-3553). Sandstorm: "all non-Ground, Rock, or Steel Type Pokemon lose a Tick of Hit Points at the beginning of their turn" (`10-indices-and-reference.md` lines 3585-3587).
- **Implementation:** Uses `calculateTickDamage(maxHp)` which returns `Math.max(1, Math.floor(maxHp / 10))`. Raw tick is computed first, then Permafrost reduction is applied.
- **Status:** CORRECT — The tick calculation is `floor(maxHp / 10)` with minimum 1, matching the PTU definition.

### Permafrost and Immunity Ability Interaction
- **Rule:** Ice Body: "the user is not damaged by Hail" (`10-indices-and-reference.md` lines 1539-1543). Snow Cloak: "The user and allies adjacent to the user are not damaged by Hail" (`10-indices-and-reference.md` lines 2384-2388). These grant full immunity. Permafrost does NOT grant immunity — it reduces damage.
- **Implementation:** In `getWeatherTickForCombatant()`, immunity is checked first (line 81-100). Only if not immune does the damage reduction path execute (line 103-115). A Pokemon with both Ice Body and Permafrost (possible for Bergmite/Avalugg line) would be correctly handled: immunity takes precedence, Permafrost reduction is never reached.
- **Status:** CORRECT — Immunity correctly supersedes reduction. No double-dipping or missed interactions.

### Minimum Damage Floor After Reduction
- **Rule:** PTU does not specify a minimum damage for weather ticks after ability-based reduction. The only explicit minimum-1 rule is for attack damage: "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0" (`07-combat.md` lines 778-779).
- **Implementation:** `Math.max(1, rawTickDamage - reduction.reduction)` ensures minimum 1 damage after Permafrost reduction, citing decree-001.
- **Status:** NEEDS REVIEW — See MED-001 below.

## Summary

The Permafrost weather damage reduction implementation is correct for its scoped purpose. The core mechanic — subtracting 5 HP from weather tick damage — faithfully matches the PTU ability text. The code structure is clean: a constant maps ability names to reduction amounts, a helper function checks combatants, and the service applies the reduction after computing raw tick damage but before returning the result.

Two medium-severity observations are noted but neither blocks approval:

1. The decree-001 citation for the minimum damage floor is imprecise (decree-001 covers attack damage, not weather ticks), though the behavior itself is reasonable.
2. The ticket description incorrectly claims Permafrost is limited to "the Aurorus evolutionary line." In the PTU 1.05 pokedex data, the Amaura/Aurorus line does NOT have Permafrost. The actual Pokemon with Permafrost are: Bergmite, Avalugg, Avalugg-Hisuian, Cryogonal, Snom, and Frosmoth. This is a documentation inaccuracy in the ticket, not a code bug — the code checks abilities generically and works for any Pokemon with Permafrost.

## Rulings

### MED-001: decree-001 citation is imprecise for weather tick minimum floor

The code comment says "minimum 1 damage per decree-001" but decree-001 specifically rules on the attack damage pipeline (post-defense and post-type-effectiveness floors). Weather tick damage after ability reduction is a different context. The `Math.max(1, ...)` behavior is defensible — it would be nonsensical for Permafrost to eliminate weather damage entirely when the ability text says "subtract 5" (implying reduced damage, not immunity). However, the decree citation should be updated to note this is an extrapolation of decree-001's precedent, not a direct application. No decree-need ticket filed because the behavior is unambiguously correct (reduction, not elimination) and only the citation is imprecise.

**Severity:** MEDIUM — Misleading citation but correct behavior.

### MED-002: Permafrost Burn/status tick reduction not yet implemented (acknowledged out-of-scope)

The Permafrost ability text says: "whenever the user would lose a Tick of Hit Points due to an effect such as Sandstorm **or the Burn Status condition**, subtract 5 from the amount of Hit Points lost." The current implementation only handles weather tick damage. Burn/Poison tick damage in `status-automation.service.ts` does not check for Permafrost reduction. The ticket explicitly acknowledges this is out of scope ("Status tick damage reduction in `status-automation.service.ts` is out of scope for this ticket — weather damage path only"). Confirming that a follow-up ticket should be created for status tick reduction via Permafrost if one does not already exist.

**Severity:** MEDIUM — Known gap, correctly scoped out, but should be tracked.

## Verdict

**APPROVED** — The implementation correctly applies Permafrost's "subtract 5" weather tick damage reduction per PTU 1.05 ability text. The reduction amount (5), the application point (after raw tick calculation, before damage delivery), the minimum floor (1), and the immunity interaction (immunity takes precedence over reduction) are all correct. The two medium-severity observations are documentation/scope concerns, not code correctness issues.

## Required Changes

None required for approval. Two recommended follow-ups:

1. **Comment fix (optional):** Update the "per decree-001" comments in both `weatherRules.ts` (line 107) and `weather-automation.service.ts` (line 112) to say "minimum 1 damage (extrapolated from decree-001 precedent)" or similar, to clarify the citation is by analogy rather than direct application.
2. **Follow-up ticket (recommended):** Ensure a ticket exists to implement Permafrost reduction for Burn/Poison status tick damage in `status-automation.service.ts`. The ability text explicitly names "Burn Status condition" alongside Sandstorm.
