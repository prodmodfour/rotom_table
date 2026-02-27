---
cap_id: encounter-tables-C015
name: encounter-tables-C015
type: —
domain: encounter-tables
---

### encounter-tables-C015
- **name:** Add/Remove Modification Entry APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/` — index.post.ts, [entryId].delete.ts
- **game_concept:** Sub-habitat species pool changes
- **description:** Add species override (speciesName + weight), species addition (speciesName + weight for new species), or species removal (speciesName + remove=true). Remove deletes the modification entry.
- **inputs:** URL params: id, modId, entryId. Body: { speciesName, weight?, remove?, levelRange? }
- **outputs:** `{ success, data: ModificationEntry }` or `{ success: true }`
- **accessible_from:** gm
