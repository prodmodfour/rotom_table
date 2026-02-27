---
cap_id: healing-C056
name: Calculate Scene End AP
type: —
domain: healing
---

## healing-C056: Calculate Scene End AP

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateSceneEndAp`
- **Game Concept:** AP restoration at scene end (PTU Core p.221)
- **Description:** Calculates available AP after scene-end restoration. Per PTU: AP is completely regained at the end of each Scene, but drained AP remains unavailable until Extended Rest and bound AP remains until binding effect ends.
- **Inputs:** `level: number, drainedAp: number, boundAp?: number`
- **Outputs:** `number` (AP at scene end)
- **Accessible From:** `api-only`
- **Orphan:** false
