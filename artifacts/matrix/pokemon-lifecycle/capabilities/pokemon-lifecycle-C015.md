---
cap_id: pokemon-lifecycle-C015
name: SIGNIFICANCE_PRESETS
type: constant
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C015: SIGNIFICANCE_PRESETS
- **cap_id**: pokemon-lifecycle-C015
- **name**: XP Significance Multiplier Presets
- **type**: constant
- **location**: `app/utils/experienceCalculation.ts` -- `SIGNIFICANCE_PRESETS`
- **game_concept**: GM-assigned encounter significance for XP (Core p.460)
- **description**: Derived from encounterBudget.ts canonical source. Maps tier names to multipliers: insignificant (1.0), everyday (2.0), significant (3.5), climactic (4.5), legendary (5.0). Used in XpDistributionModal preset selector.
- **inputs**: N/A (constant)
- **outputs**: XP calculation multiplier
- **accessible_from**: gm
