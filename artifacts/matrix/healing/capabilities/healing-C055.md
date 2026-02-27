---
cap_id: healing-C055
name: Calculate Available AP
type: —
domain: healing
---

## healing-C055: Calculate Available AP

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateAvailableAp`
- **Game Concept:** Available AP accounting for bound and drained AP (PTU Core p.221)
- **Description:** Calculates available AP: max AP minus bound AP minus drained AP, with floor of 0. Bound AP remains off-limits until binding effect ends; drained AP remains unavailable until Extended Rest.
- **Inputs:** `maxAp: number, boundAp: number, drainedAp: number`
- **Outputs:** `number` (available AP, minimum 0)
- **Accessible From:** `api-only`
- **Orphan:** false
