---
cap_id: healing-C057
name: Reset Daily Move Usage
type: —
domain: healing
---

## healing-C057: Reset Daily Move Usage

- **Type:** utility
- **Location:** `utils/moveFrequency.ts:resetDailyUsage`
- **Game Concept:** New day move usage counter reset
- **Description:** Resets daily move usage counters on all moves in a list. Clears `usedToday` to 0 and removes `lastUsedAt`. Used by character new-day and global new-day endpoints. Returns a new array (no mutation).
- **Inputs:** `moves: Move[]`
- **Outputs:** `Move[]` (with daily counters reset)
- **Accessible From:** `api-only` (used by new-day endpoints)
- **Orphan:** false
