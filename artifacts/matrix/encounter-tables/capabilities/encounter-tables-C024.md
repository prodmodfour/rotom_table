---
cap_id: encounter-tables-C024
name: encounter-tables-C024
type: —
domain: encounter-tables
---

### encounter-tables-C024
- **name:** Encounter Tables Store — getTotalWeight getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` — getTotalWeight()
- **game_concept:** Encounter probability calculation
- **description:** Sums weights of all resolved entries for a table (with optional modification). Used for probability percentage display.
- **inputs:** tableId, modificationId?
- **outputs:** number (total weight)
- **accessible_from:** gm
