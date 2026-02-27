---
cap_id: encounter-tables-C027
name: encounter-tables-C027
type: —
domain: encounter-tables
---

### encounter-tables-C027
- **name:** Encounter Tables Store — filteredTables / filter actions
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` — filteredTables getter, setFilters(), resetFilters()
- **game_concept:** Table search/filter
- **description:** Filters tables by search (name, description) and sorts by name/createdAt/updatedAt.
- **inputs:** filters: { search, sortBy, sortOrder }
- **outputs:** EncounterTable[]
- **accessible_from:** gm

## Utilities (NEW)
