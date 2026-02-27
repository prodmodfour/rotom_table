---
cap_id: healing-C046
name: Breather Cured Conditions Constant
type: —
domain: healing
---

## healing-C046: Breather Cured Conditions Constant

- **Type:** constant
- **Location:** `server/api/encounters/[id]/breather.post.ts:BREATHER_CURED_CONDITIONS`
- **Game Concept:** Full set of conditions cleared by Take a Breather
- **Description:** Combines VOLATILE_CONDITIONS (minus Cursed) + Slowed + Stuck. Per PTU 1.05 p.245, Take a Breather cures all volatile conditions plus Slowed and Stuck. Cursed excluded because the app does not track curse sources.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Accessible From:** `api-only`
- **Orphan:** false
