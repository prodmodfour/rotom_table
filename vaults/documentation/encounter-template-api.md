# Encounter Template API

REST endpoints under `/api/encounter-templates` for saving and loading encounter templates.

**CRUD:** GET/POST (list, create). GET/PUT/DELETE `/:id` (read, update, delete).

**From encounter:** POST `.../from-encounter` — save the current encounter state as a reusable template.

**Load:** POST `/:id/load` — load a template into a new encounter.

## See also

- [[api-endpoint-layout]]
