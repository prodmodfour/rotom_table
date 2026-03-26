# Character Creation Composable

`composables/useCharacterCreation.ts` — full form state management for the [[character-creation-page]]. Part of the [[composable-domain-grouping|Character/Trainer domain]].

## Responsibilities

- Reactive form state for PTR character fields
- Stat display: all stats [[starting-stat-allocation|default to 10]], maxHp preview via [[trainer-hp-formula|PTR Trainer HP formula]]
- Skill editing with [[ptr-skill-list|PTR skill system]] (numeric modifiers, no ranks)
- Trait management
- Section completion tracking for progress indicators
- Soft validation warnings (non-blocking) via [[character-creation-validation]]
- `buildCreatePayload()` assembles the API body for [[character-api-endpoints|POST /api/characters]]

## See also

- [[character-creation-page]]
- [[character-creation-validation]]
- [[library-store]]
