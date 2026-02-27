---
cap_id: pokemon-lifecycle-C046
name: GET /api/species
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C046: GET /api/species
- **cap_id**: pokemon-lifecycle-C046
- **name**: Species Reference Data List
- **type**: api-endpoint
- **location**: `app/server/api/species/index.get.ts`
- **game_concept**: Species lookup for UI autocomplete and generation
- **description**: Returns species reference data with search and limit. Select fields: name, types, base stats, abilities, evolution stage. Parses abilities JSON. Default limit 100, max 500.
- **inputs**: Query params: search?, limit?
- **outputs**: { success: true, data: SpeciesSummary[] }
- **accessible_from**: gm
