---
cap_id: pokemon-lifecycle-C026
name: resolvePresetFromMultiplier
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C026: resolvePresetFromMultiplier
- **cap_id**: pokemon-lifecycle-C026
- **name**: Significance Preset Resolver
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `resolvePresetFromMultiplier()`
- **game_concept**: Map multiplier value back to preset name
- **description**: Pure function. Given a numeric multiplier, finds the matching SIGNIFICANCE_PRESETS key. Returns 'custom' if no preset matches. Used to initialize XpDistributionModal from encounter's persisted significanceMultiplier.
- **inputs**: multiplier number
- **outputs**: SignificancePreset | 'custom'
- **accessible_from**: gm
