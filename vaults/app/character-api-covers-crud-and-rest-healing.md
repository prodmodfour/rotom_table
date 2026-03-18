Character API endpoints under `app/server/api/characters/` handle trainer data with CRUD plus specialized sub-routes:

**CRUD**: `GET /api/characters` (list, filtered by `isInLibrary`), `POST /api/characters` (create), `GET /api/characters/:id`, `PUT /api/characters/:id`, `DELETE /api/characters/:id`

**Rest/Healing**: `rest.post` (30-minute rest), `extended-rest.post` (4-8 hour rest), `pokemon-center.post` (full heal), `heal-injury.post` (heal one injury), `new-day.post` (reset daily counters)

**XP**: `xp.post` (award trainer XP, see [[trainer-xp-api-endpoint]]), `xp-history.get` (current XP, level, XP to next)

**Equipment**: `equipment.get`, `equipment.put`

**Player**: `player-view.get` (filtered character data for the player view)

**Import**: `import-csv.post` (see [[csv-import-service-parses-ptu-character-sheets]])

The list endpoint includes nested Pokemon summaries (id, species, nickname) for each character. Simple endpoints call Prisma directly; rest/healing endpoints use the [[rest-healing-service-refreshes-daily-moves]].

## See also

- [[server-uses-nuxt-file-based-rest-routing]]
- [[pokemon-api-endpoint-structure]]
- [[game-new-day-resets-daily-counters-globally]] — the global daily reset distinct from per-character rest
