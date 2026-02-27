---
cap_id: healing-C049
name: Pokemon Healing Fields
type: —
domain: healing
---

## healing-C049: Pokemon Healing Fields

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon`
- **Game Concept:** Pokemon rest and healing state persistence
- **Description:** Fields: `lastInjuryTime` (DateTime?, 24h timer), `restMinutesToday` (Int, max 480), `injuriesHealedToday` (Int, max 3), `lastRestReset` (DateTime?, daily counter reset), `injuries` (Int), `temporaryHp` (Int), `currentHp` (Int), `maxHp` (Int), `statusConditions` (JSON string), `moves` (JSON string with usedToday/usedThisScene/lastUsedAt tracking). Note: Pokemon do NOT have `drainedAp`, `boundAp`, or `currentAp`.
- **Inputs:** Updated by healing API endpoints
- **Outputs:** Read by healing API endpoints and composables
- **Accessible From:** `gm`, `api-only`
- **Orphan:** false
