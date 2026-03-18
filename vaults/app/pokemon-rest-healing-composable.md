The `useRestHealing` composable (`app/composables/useRestHealing.ts`) wraps the healing API calls used by the [[gm-pokemon-detail-healing-tab]].

It exposes actions for each healing type:
- `rest()` — 30-minute rest via `POST /api/pokemon/:id/rest`
- `extendedRest()` — configurable 4–8 hour rest via `POST /api/pokemon/:id/extended-rest`
- `pokemonCenter()` — full heal via `POST /api/pokemon/:id/pokemon-center`
- `healInjury()` — natural or drain-AP injury healing via `POST /api/pokemon/:id/heal-injury`
- `newDay()` — daily counter reset via `POST /api/pokemon/:id/new-day`
- `newDayGlobal()` — resets daily counters for all entities

The composable is shared between Pokemon and human character healing tabs.
