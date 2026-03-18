# Nitro File-Based Routing

API endpoints use Nitro's file-based routing convention:

- **CRUD pattern:** `index.get.ts` (list), `index.post.ts` (create), `[id].get.ts` (read), `[id].put.ts` (update), `[id].delete.ts` (delete)
- **Action endpoints:** `<action-name>.post.ts` (e.g., `extended-rest.post.ts`, `evolve.post.ts`, `damage.post.ts`)
- **Dynamic params:** `[id]`, `[entryId]`, `[combatantId]`, `[charId]`, `[pokemonId]`, `[modId]`, `[name]`
- **Nested resources:** Subdirectories (e.g., `encounters/[id]/combatants/[combatantId].delete.ts`)

## See also

- [[api-endpoint-layout]]
