# Character Creation Composable

`composables/useCharacterCreation.ts` — full form state management for the [[character-creation-page]]. Part of the [[composable-domain-grouping|Character/Trainer domain]].

## Responsibilities

- Reactive form state for all PTU character fields
- Stat point tracking: total/remaining computed from [[trainer-stat-budget]], maxHp preview via PTU Trainer HP formula
- Background application: 11 presets from [[sample-backgrounds]] plus custom mode
- Trainer class management: add/remove with max 4 cap from [[trainer-class-catalog]]
- Feature management: class features and training features
- Edge management: add/remove, Skill Edges with rank bump and revert
- Skill rank editing with level-based cap from [[trainer-skill-definitions]]
- Section completion tracking for progress indicators
- Soft validation warnings (non-blocking) via [[character-creation-validation]]
- `buildCreatePayload()` assembles the API body for [[character-api-endpoints|POST /api/characters]]

## Key Exports

`form`, `computedStats`, `maxHp`, `evasions`, `statPointsUsed`, `statPointsRemaining`, `allWarnings`, `sectionCompletion`, `buildCreatePayload()`, `incrementStat`, `decrementStat`, `applyBackground`, `clearBackground`, `enableCustomBackground`, `setSkillRank`, `addClass`, `removeClass`, `addFeature`, `removeFeature`, `setTrainingFeature`, `addEdge`, `removeEdge`, `addSkillEdge`.

## See also

- [[character-creation-page]]
- [[character-creation-validation]]
- [[library-store]]
