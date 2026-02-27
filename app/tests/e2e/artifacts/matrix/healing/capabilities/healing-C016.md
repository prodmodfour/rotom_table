---
cap_id: healing-C016
name: Calculate Pokemon Center Injury Healing
type: —
domain: healing
---

## healing-C016: Calculate Pokemon Center Injury Healing

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculatePokemonCenterInjuryHealing`
- **Game Concept:** Pokemon Center injury healing with daily cap
- **Description:** Calculates how many injuries can be healed at Pokemon Center given the daily 3-injury limit from all sources. Returns injuries actually healed, remaining injuries, and whether at daily limit.
- **Inputs:** `{ injuries, injuriesHealedToday }`
- **Outputs:** `{ injuriesHealed, remaining, atDailyLimit }`
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false
