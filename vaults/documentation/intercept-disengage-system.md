# Intercept and Disengage System

Intercept Melee, Intercept Ranged, and Disengage maneuvers.

## Service

`server/services/intercept.service.ts` (extracted from out-of-turn) — `canIntercept`, `checkInterceptLoyalty`, `canInterceptMove`, `detectInterceptMelee`, `detectInterceptRanged`, `calculatePushDirection`, `resolveInterceptMelee`, `resolveInterceptRanged`, `getCombatantSpeed` (with movement modifiers).

## Line of Attack

`utils/lineOfAttack.ts` — Bresenham algorithm: `getLineOfAttackCells`, `getLineOfAttackCellsMultiTile`, `canReachLineOfAttack`, `getReachableInterceptionSquares`. [[multi-cell-token-footprint]] support via center-of-footprint and bbox distance.

## Component

`InterceptPrompt.vue` — GM prompt showing pending intercept list, melee/ranged type badges, reactor HP display, DC preview for melee, skill check input, auto-selects best target square for ranged.

## API

- `POST .../intercept-melee` — skill check vs DC 3x distance; success: push ally 1m + shift to their space + take hit; failure: shift floor(check/3) meters. Consumes Full Action + Interrupt.
- `POST .../intercept-ranged` — shift floor(check/2) toward target square on line of attack; success if reached target square. Consumes Full Action + Interrupt.
- `POST .../disengage` — PTU p.241. Consumes Shift Action, sets `disengaged` flag, movement clamped to 1m, does not provoke [[attack-of-opportunity-system|AoO]]. Flag cleared at turn-end and round-start.

## Store

Encounter getters: `pendingIntercepts`, `hasInterceptPrompts`. Actions: `interceptMelee`, `interceptRanged`, `disengage`.

## Types

`INTERCEPT_BLOCKING_CONDITIONS` in `types/combat.ts`.

## Distance Calculation

`ptuDistanceTokensBBox` for edge-to-edge multi-tile distance. Alternating diagonal per decree-002 in step loops.

## WebSocket

`interrupt_resolved`, `encounter_update` with action `disengage`.
