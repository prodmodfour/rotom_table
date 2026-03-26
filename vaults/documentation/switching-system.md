# Switching System

Pokemon switch, recall, and release during encounters.

## Composable

`composables/useSwitching.ts` — `getBenchPokemon`, `canSwitch`, `canFaintedSwitch`, `canForcedSwitch` (pre-validation), `executeSwitch`, `executeRecall`, `executeRelease`.

## Service

`server/services/switching.service.ts` — `validateSwitch` (10-step validation chain), `validateFaintedSwitch`, `validateForcedSwitch`, `checkRecallRange` (8m per [[poke-ball-recall-range]]), `insertIntoTurnOrder` (full contact + league), `removeCombatantFromEncounter`, `markActionUsed`, `buildSwitchAction`, `canSwitchedPokemonBeCommanded`, `hasInitiativeAlreadyPassed` (Section K), `findAdjacentPosition`, `checkRecallReleasePair` (Section N), `applyRecallSideEffects`.

## Components

`SwitchPokemonModal.vue` — shows recalled Pokemon, loads bench from trainer roster, select replacement with sprite/level/HP display.

`CombatantGmActions.vue` — Switch/Fainted Switch/Force Switch buttons.

## API

- `POST .../switch` — full switch: recall + release as Standard Action with 8m range check, initiative insertion, action economy enforcement.
- `POST .../recall` — standalone: 1 = Shift Action, 2 = Standard Action. Removes from field, clears volatile conditions, tracks `recall_only` SwitchAction.
- `POST .../release` — standalone: 1 = Shift Action, 2 = Standard Action. Auto-places adjacent to trainer, immediate-act logic (Section K), detects recall+release pair (Section N).

## Store

Actions: `switchPokemon`, `recallPokemon`, `releasePokemon`.

## Model Field

`switchActions` on Encounter (JSON, cleared per round) — tracks `full_switch`, `fainted_switch`, `forced_switch`, `recall_only`, `release_only`.

## WebSocket

`pokemon_switched`, `pokemon_recalled`, `pokemon_released`.

## See also

- [[status-condition-categories]] — volatile conditions cleared on recall
- [[faint-and-revival-effects]] — fainted switch triggers special validation
- [[initiative-and-turn-order]] — new combatant inserted by initiative
- [[turn-lifecycle]]
- [[encounter-core-api]]
- [[deployment-state-model]] — tracks active/reserve/fainted roster for switching decisions
