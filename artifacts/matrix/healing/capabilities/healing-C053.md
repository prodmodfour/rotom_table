---
cap_id: healing-C053
name: Is Daily Move Refreshable
type: —
domain: healing
---

## healing-C053: Is Daily Move Refreshable

- **Type:** utility
- **Location:** `utils/restHealing.ts:isDailyMoveRefreshable`
- **Game Concept:** Daily move refresh eligibility for Extended Rest (PTU Core p.252)
- **Description:** Checks if a daily-frequency move is eligible for Extended Rest refresh. Per PTU: "Daily-Frequency Moves are regained during an Extended Rest if the Move hasn't been used since the previous day." A move used today cannot be refreshed by tonight's Extended Rest.
- **Inputs:** `lastUsedAt: string | null | undefined`
- **Outputs:** `boolean` (true if eligible for refresh)
- **Accessible From:** `api-only` (used by Pokemon extended-rest endpoint)
- **Orphan:** false
