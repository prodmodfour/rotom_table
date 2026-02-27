---
cap_id: pokemon-lifecycle-C013
name: NATURE_TABLE
type: constant
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C013: NATURE_TABLE
- **cap_id**: pokemon-lifecycle-C013
- **name**: PTU Nature Chart
- **type**: constant
- **location**: `app/constants/natures.ts` -- `NATURE_TABLE`
- **game_concept**: PTU 36 natures with stat modifiers (Core Chapter 5, p.199)
- **description**: Complete mapping of 36 nature names to { raise, lower } stat keys. 30 natures have distinct raise/lower stats; 6 neutral natures (Composed, Hardy, Docile, Bashful, Quirky, Serious) have raise === lower.
- **inputs**: N/A (constant)
- **outputs**: Used by applyNatureToBaseStats() and pokemon-generator
- **accessible_from**: api-only
