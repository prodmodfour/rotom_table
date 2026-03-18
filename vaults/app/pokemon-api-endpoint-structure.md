Pokemon API endpoints live under `app/server/api/pokemon/`. Species-specific endpoints are separate — see [[species-api-serves-list-and-single-lookup]]. The structure covers the full Pokemon lifecycle:

**CRUD:**
- `GET /api/pokemon` — list all Pokemon (library)
- `POST /api/pokemon` — manual creation from the [[pokemon-creation-tab]]
- `GET /api/pokemon/:id` — fetch single Pokemon for the [[gm-pokemon-detail-page]]
- `PUT /api/pokemon/:id` — update from [[gm-pokemon-detail-edit-mode]]
- `DELETE /api/pokemon/:id` — delete a Pokemon

**Ownership:**
- `POST /api/pokemon/:id/link` — assign a Pokemon to a trainer
- `POST /api/pokemon/:id/unlink` — remove trainer association

**XP/Leveling:**
- `POST /api/pokemon/:id/add-experience` — add XP, auto-level (see [[pokemon-xp-and-leveling-system]])
- `POST /api/pokemon/:id/level-up-check` — read-only preview of level-up events
- `POST /api/pokemon/:id/allocate-stats` — stat point allocation (see [[pokemon-level-up-panel]])
- `POST /api/pokemon/:id/assign-ability` — milestone ability assignment (see [[pokemon-ability-milestone-assignment]])
- `POST /api/pokemon/:id/learn-move` — learn a move (max 6, can replace)

**Evolution:**
- `POST /api/pokemon/:id/evolution-check` — eligibility check (see [[gm-pokemon-detail-evolve-button]])
- `POST /api/pokemon/:id/evolve` — perform evolution (see [[evolution-service]])
- `POST /api/pokemon/:id/evolution-undo` — revert evolution

**Healing:**
- `POST /api/pokemon/:id/rest` — 30-minute rest
- `POST /api/pokemon/:id/extended-rest` — 4–8 hour rest
- `POST /api/pokemon/:id/pokemon-center` — full heal
- `POST /api/pokemon/:id/heal-injury` — heal one injury
- `POST /api/pokemon/:id/new-day` — reset daily counters

**Bulk:**
- `POST /api/pokemon/bulk-action` — operations across multiple Pokemon

## See also

- [[server-uses-nuxt-file-based-rest-routing]] — the file-based routing convention these endpoints follow
- [[character-api-covers-crud-and-rest-healing]] — the parallel trainer API structure
