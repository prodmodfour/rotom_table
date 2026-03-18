# Encounter Template API Endpoints

Six REST endpoints under `app/server/api/encounter-templates/` handle template persistence:

- **GET `/api/encounter-templates`** — lists all templates; supports optional `category` and `search` query params (search matches name and description via substring)
- **POST `/api/encounter-templates`** — creates a blank template with metadata (name, description, battleType, combatants, gridConfig, category, tags)
- **GET `/api/encounter-templates/:id`** — fetches a single template
- **PUT `/api/encounter-templates/:id`** — partial update of template fields
- **DELETE `/api/encounter-templates/:id`** — deletes a template (returns 404 if not found)
- **POST `/api/encounter-templates/from-encounter`** — [[encounter-template-from-encounter-strips-runtime-state|saves a live encounter as a template]] by extracting combatant snapshots
- **POST `/api/encounter-templates/:id/load`** — [[encounter-template-load-endpoint-generates-pokemon|creates a new encounter from a template]]

All endpoints share a [[encounter-template-combatants-stored-as-json-text|JSON serialization pattern]] for combatants and tags fields. There are no dedicated service files — endpoint handlers call Prisma directly.

## See also

- [[encounter-library-store-manages-client-state]] — the store actions that call these endpoints
- [[encounter-template-prisma-model]] — the database schema these endpoints read/write
