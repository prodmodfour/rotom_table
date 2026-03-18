The rest healing service (`app/server/services/rest-healing.service.ts`) refreshes daily-frequency moves during Extended Rest.

Per PTU Core p.252, daily moves are regained during Extended Rest only if the move has not been used since the previous day. The service implements this as a rolling window rule: a move's `lastUsedAt` timestamp is compared against the current date. If the move was used today, it is skipped and remains expended. If it was used before today (or has no timestamp), its `usedToday` counter is reset to 0.

`refreshDailyMoves()` is a pure function that processes a single Pokemon's move array, returning updated moves plus tracking arrays of which moves were restored and which were skipped. Non-daily moves have their `usedToday` field cleaned up for data hygiene even though it has no gameplay effect for those frequencies.

`refreshDailyMovesForOwnedPokemon()` applies the refresh to all Pokemon owned by a given character, writing back only those whose moves actually changed.

## See also

- [[character-api-covers-crud-and-rest-healing]] — the extended-rest endpoint that calls this service
- [[game-new-day-resets-daily-counters-globally]] — the global daily reset, which is distinct from per-character Extended Rest
