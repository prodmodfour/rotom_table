# Attack of Opportunity System

AoO detection, eligibility, and resolution for out-of-turn reactions.

## Service

`server/services/out-of-turn.service.ts` — `canUseAoO`, `detectAoOTriggers`, `resolveAoOAction`, `expirePendingActions`, `autoDeclineFaintedReactor`, `cleanupResolvedActions`, `getDefaultOutOfTurnUsage`.

## Constants

`constants/aooTriggers.ts` — `AOO_TRIGGER_MAP`, `AOO_TRIGGERING_MANEUVERS`, `AOO_STRUGGLE_ATTACK_AC`, `AOO_STRUGGLE_ATTACK_DAMAGE_BASE`.

## Adjacency

`utils/adjacency.ts` — `areAdjacent`, `getAdjacentEnemies`, `wasAdjacentBeforeMove`.

## Component

`AoOPrompt.vue` — GM prompt panel showing pending AoO list with accept/decline buttons, damage input, and reactor HP display.

## Store

Encounter getters: `pendingAoOs`, `pendingOutOfTurnActions`, `hasAoOPrompts`. Actions: `detectAoO`, `resolveAoO`.

## Types

`OutOfTurnAction`, `OutOfTurnUsage`, `AoOTrigger`, `AOO_BLOCKING_CONDITIONS` in `types/combat.ts`.

## VTT Integration

`useGridMovement.ts` — `getAoOTriggersForMove()` for client-side preview with reactor eligibility filtering.

## API

- `POST .../aoo-detect` — detect triggers from actor action (shift_away, ranged_attack, stand_up, maneuver_other, retrieve_item); returns triggered `OutOfTurnAction` objects stored as pending.
- `POST .../aoo-resolve` — resolve pending AoO (accept/decline); accept validates reactor eligibility, applies Struggle Attack damage, auto-declines remaining if trigger target faints.

## WebSocket

`aoo_triggered`, `aoo_resolved`.

## Round Reset

`outOfTurnUsage` cleared per round, `pendingActions` expired per round.

## See also

- [[turn-lifecycle]]
- [[encounter-core-api]]
