# Pokemon Evolution System

Evolution check, perform, and undo workflow spanning utilities, service, modal, and composable layers.

## Utilities

`utils/evolutionCheck.ts` — pure eligibility logic: level/item/trigger validation, `getEvolutionLevels`, `getEvolutionMoves` with decree-036 stone-vs-level-based comparison, `buildSelectedMoveList`.

## Types

`EvolutionTrigger` interface in `types/species.ts`: `toSpecies`, `targetStage`, `minimumLevel`, `requiredItem`, `itemMustBeHeld`, `requiredGender`, `requiredMove`.

## Service

`server/services/evolution.service.ts` — `PokemonSnapshot` (includes notes + consumedStone for full undo), `consumeStoneFromInventory`, `restoreStoneToInventory`, `performEvolution` (atomic transaction updating species, types, stats, HP, spriteUrl, traits, skills, notes; stone consumption). Inherited innate traits persist through evolution. Moves are rechecked against unlock conditions (evolution can change type/stats, invalidating or newly satisfying conditions).

## Modal

`EvolutionConfirmModal.vue` — 4-step wizard:

1. Stat redistribution (`EvolutionStatStep.vue` — full stat rebuild: new base stats, redistribute all stat points from scratch)
2. Trait resolution (`EvolutionTraitStep.vue` — species innate traits update to new form, inherited innate traits persist, learned/emergent traits persist)
3. Move condition recheck (`EvolutionMoveStep.vue` — verify all known moves still meet unlock conditions after species/type/stat changes)
4. Summary

Shows HP preview, supports GM override.

## Undo

`composables/useEvolutionUndo.ts` — client-side snapshot storage. Exposes `canUndo`, `undoEvolution`, `clearUndo`. Session-scoped `Map` keyed by Pokemon ID.

## WebSocket

`pokemon_evolved` event (server to all clients). Includes `undone: true` for undo events. See [[websocket-real-time-sync]].

## See also

- [[pokemon-api-endpoints]]
- [[pokemon-stat-allocation]]
- [[evolution-rebuilds-all-stats]] — stats completely rebuilt on evolution
- [[evolution-trigger-conditions]] — species-specific unlock conditions
