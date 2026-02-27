---
cap_id: healing-C048
name: HumanCharacter Healing Fields
type: —
domain: healing
---

## healing-C048: HumanCharacter Healing Fields

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:HumanCharacter`
- **Game Concept:** Character rest and healing state persistence
- **Description:** Fields: `lastInjuryTime` (DateTime?, 24h timer), `restMinutesToday` (Int, max 480), `injuriesHealedToday` (Int, max 3), `lastRestReset` (DateTime?, daily counter reset), `drainedAp` (Int, restored by extended rest), `boundAp` (Int, off-limits until binding effect ends), `currentAp` (Int, restored at scene end minus drained and bound), `injuries` (Int), `temporaryHp` (Int), `currentHp` (Int), `maxHp` (Int), `statusConditions` (JSON string).
- **Inputs:** Updated by healing API endpoints
- **Outputs:** Read by healing API endpoints and composables
- **Accessible From:** `gm`, `api-only`
- **Orphan:** false
