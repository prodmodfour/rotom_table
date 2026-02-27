---
cap_id: combat-C034
name: Set Significance
type: api-endpoint
domain: combat
---

### combat-C034: Set Significance
- **cap_id**: combat-C034
- **name**: Set Encounter Significance
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/significance.put.ts`
- **game_concept**: PTU significance multiplier for XP (Core p.460)
- **description**: Persists significance multiplier (1.0-5.0) and tier label.
- **inputs**: `{ significanceMultiplier, significanceTier? }`
- **outputs**: Updated encounter
- **accessible_from**: gm
