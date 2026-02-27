---
cap_id: encounter-tables-C023
name: encounter-tables-C023
type: —
domain: encounter-tables
---

### encounter-tables-C023
- **name:** Encounter Tables Store — getResolvedEntries getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` — getResolvedEntries()
- **game_concept:** Resolved species pool after modification
- **description:** Computes final species pool by starting with parent entries and applying a modification (if specified): removes, overrides weights, adds new species. Each entry tagged with source ('parent', 'modification', 'added'). Level ranges cascade: entry → modification → table default.
- **inputs:** tableId, modificationId?
- **outputs:** ResolvedTableEntry[] with speciesName, weight, levelRange, source
- **accessible_from:** gm
