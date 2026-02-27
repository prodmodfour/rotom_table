---
cap_id: character-lifecycle-C016
name: character-lifecycle-C016
type: —
domain: character-lifecycle
---

### character-lifecycle-C016
- **name:** CSV Import API
- **type:** api-endpoint
- **location:** `app/server/api/characters/import-csv.post.ts`
- **game_concept:** Bulk character import from PTU sheets
- **description:** Accepts raw CSV content, auto-detects sheet type (trainer or pokemon), parses fields, and creates the corresponding DB record. Trainer creation is direct; Pokemon creation routes through pokemon-generator.service.
- **inputs:** Body: { csvContent: string }
- **outputs:** `{ success, type: 'trainer'|'pokemon', data: Character|Pokemon }`
- **accessible_from:** gm
