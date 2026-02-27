---
cap_id: healing-C014
name: Can Heal Injury Naturally
type: —
domain: healing
---

## healing-C014: Can Heal Injury Naturally

- **Type:** utility
- **Location:** `utils/restHealing.ts:canHealInjuryNaturally`
- **Game Concept:** Natural injury healing timer check (24h rule)
- **Description:** Returns true if 24+ hours have elapsed since lastInjuryTime. Returns false if lastInjuryTime is null (no injury to heal, or no timestamp recorded).
- **Inputs:** `lastInjuryTime: Date | null`
- **Outputs:** `boolean`
- **Accessible From:** `api-only` (used by server endpoints and client getRestHealingInfo)
- **Orphan:** false
