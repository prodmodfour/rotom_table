---
cap_id: healing-C043
name: GM Layout Advance Day Button
type: —
domain: healing
---

## healing-C043: GM Layout Advance Day Button

- **Type:** component
- **Location:** `layouts/gm.vue:handleAdvanceDay`
- **Game Concept:** Global new day UI trigger
- **Description:** "Advance Day" button in the GM header bar with sun icon. Shows confirmation dialog asking if user wants to reset daily healing limits for all entities, then calls `newDayGlobal()` from `useRestHealing`. Displays loading state ("Advancing...") and success alert with server message.
- **Inputs:** User click + confirmation
- **Outputs:** Calls global new day API, shows alert on success
- **Accessible From:** `gm`
- **Orphan:** false
