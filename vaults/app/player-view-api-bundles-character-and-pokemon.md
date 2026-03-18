The `GET /api/characters/:id/player-view` endpoint returns the character and all owned Pokemon in a single response. The Prisma query uses `include: { pokemon: true }` to load the relation eagerly.

The response splits the data into two keys: `character` (with a `pokemonIds` reference array but no inline Pokemon objects) and `pokemon` (a flat array of full Pokemon data). This avoids multiple round-trips — the [[player-identity-persists-via-local-storage|usePlayerIdentity composable]] calls this once on restore to hydrate both the character sheet and the [[player-view-team-tab|team tab]].

## See also

- [[player-identity-store-is-populated-externally]] — receives this data via `setIdentity()` and `setCharacterData()`