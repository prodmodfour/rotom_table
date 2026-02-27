---
cap_id: healing-C058
name: Reset Scene Move Usage
type: —
domain: healing
---

## healing-C058: Reset Scene Move Usage

- **Type:** utility
- **Location:** `utils/moveFrequency.ts:resetSceneUsage`
- **Game Concept:** Scene end move usage counter reset
- **Description:** Resets scene-frequency usage on all moves: `usedThisScene` to 0 and `lastTurnUsed` to 0. Used when a scene/encounter ends. Returns a new array (no mutation).
- **Inputs:** `moves: Move[]`
- **Outputs:** `Move[]` (with scene counters reset)
- **Accessible From:** `api-only`
- **Orphan:** false

---

## RestHealingInfo Type
