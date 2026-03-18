# Pokemon Evolution System

Evolution check, perform, and undo workflow spanning utilities, service, modal, and composable layers.

## Utilities

`utils/evolutionCheck.ts` — pure eligibility logic: level/item/trigger validation, `getEvolutionLevels`, `getEvolutionMoves` with decree-036 stone-vs-level-based comparison, `buildSelectedMoveList`, `validateBaseRelations` re-export.

## Types

`EvolutionTrigger` interface in `types/species.ts`: `toSpecies`, `targetStage`, `minimumLevel`, `requiredItem`, `itemMustBeHeld`, `requiredGender`, `requiredMove`.

## Service

`server/services/evolution.service.ts` — `PokemonSnapshot` (includes notes + consumedStone for full undo), `consumeStoneFromInventory`, `restoreStoneToInventory`, `performEvolution` (atomic transaction updating species, types, stats, HP, spriteUrl, abilities, moves, capabilities, skills, notes; stone consumption).

## Modal

`EvolutionConfirmModal.vue` — 4-step wizard:

1. Stat redistribution (`EvolutionStatStep.vue` — stat point allocation with base stat comparison)
2. Ability resolution (`EvolutionAbilityStep.vue` — auto-remap display, preserved abilities, GM resolution dropdown with effects)
3. Move learning (`EvolutionMoveStep.vue` — current/available moves, add/replace/remove workflow)
4. Summary

Validates [[pokemon-stat-allocation|Base Relations]], shows HP preview, supports GM override.

## Undo

`composables/useEvolutionUndo.ts` — client-side snapshot storage. Exposes `canUndo`, `undoEvolution`, `clearUndo`. Session-scoped `Map` keyed by Pokemon ID.

## WebSocket

`pokemon_evolved` event (server to all clients). Includes `undone: true` for undo events. See [[websocket-real-time-sync]].

## See also

- [[pokemon-api-endpoints]]
- [[pokemon-stat-allocation]]
- [[pokemon-ability-assignment]]
