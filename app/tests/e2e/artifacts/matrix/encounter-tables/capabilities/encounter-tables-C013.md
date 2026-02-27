---
cap_id: encounter-tables-C013
name: encounter-tables-C013
type: —
domain: encounter-tables
---

### encounter-tables-C013
- **name:** Add/Update/Remove Entry APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/entries/index.post.ts`, `[entryId].put.ts`, `[entryId].delete.ts`
- **game_concept:** Manage species entries in table
- **description:** Add species entry (speciesId + weight + optional level range), update weight/level range, or remove entry.
- **inputs:** URL params: id, entryId. Body: { speciesId, weight?, levelRange? } or { weight?, levelMin?, levelMax? }
- **outputs:** `{ success, data: EncounterTableEntry }` or `{ success: true }`
- **accessible_from:** gm
