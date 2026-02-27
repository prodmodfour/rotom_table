---
cap_id: healing-C012
name: Calculate Rest Healing
type: —
domain: healing
---

## healing-C012: Calculate Rest Healing

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateRestHealing`
- **Game Concept:** 30-minute rest HP calculation formula
- **Description:** Pure function that calculates HP healed from a 30-minute rest. Healing amount is 1/16th of REAL maxHp (min 1), capped at injury-reduced effective max HP. Returns canHeal=false if injuries >= 5, restMinutesToday >= 480, or already at effective max HP.
- **Inputs:** `{ currentHp, maxHp, injuries, restMinutesToday }`
- **Outputs:** `{ hpHealed, canHeal, reason? }`
- **Accessible From:** `api-only` (used by server endpoints)
- **Orphan:** false
