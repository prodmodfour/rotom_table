`useRestHealing` in `composables/useRestHealing.ts` provides the client-side interface to the [[rest-healing-api-endpoints]]. Each function manages its own loading and error state.

## Exported functions

- `rest(entityType, id)` — triggers [[thirty-minute-rest]]
- `extendedRest(entityType, id)` — triggers [[extended-rest]]
- `pokemonCenter(entityType, id)` — triggers [[pokemon-center-healing]]
- `healInjury(entityType, id, method)` — triggers [[natural-injury-healing]] or [[ap-drain-injury-healing]]
- `newDay(entityType, id)` — triggers per-entity [[new-day-reset]]
- `newDayGlobal()` — triggers global [[new-day-reset]]
- `getHealingInfo(entityType, id)` — fetches healing status and converts date strings to Date objects
- `formatRestTime(minutes)` — formats minutes as "Xh Ym" (e.g., "4h 30m")

Used by the [[healing-tab-component]] and [[advance-day-button]].

## See also

- [[composable-dependency-chains]]
- [[composable-domain-grouping]]
