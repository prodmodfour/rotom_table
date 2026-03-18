# Pokemon Bulk Operations

`POST /api/pokemon/bulk-action` supports mass archive or delete of Pokemon records.

## Actions

- **Archive** — sets `isInLibrary = false` (see [[isinlibrary-archive-flag]]). Pokemon remain in the database but are hidden from library views.
- **Delete** — permanently removes Pokemon records.

## Selection

Accepts either explicit `pokemonIds[]` or a filter object (`origin`, `hasOwner`) for broader targeting.

## Safety Check

Both archive and delete are blocked for Pokemon that are active combatants in any encounter. The endpoint checks encounter combatants JSON to prevent removing Pokemon mid-combat.

## See also

- [[pokemon-api-endpoints]] — listed under Bulk
- [[isinlibrary-archive-flag]] — the archive mechanism
