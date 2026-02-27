---
cap_id: healing-C013
name: Should Reset Daily Counters
type: —
domain: healing
---

## healing-C013: Should Reset Daily Counters

- **Type:** utility
- **Location:** `utils/restHealing.ts:shouldResetDailyCounters`
- **Game Concept:** Daily rest counter reset detection
- **Description:** Checks if a new calendar day has started since lastReset. Returns true if lastReset is null or a different calendar day from now.
- **Inputs:** `lastReset: Date | null`
- **Outputs:** `boolean`
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false
