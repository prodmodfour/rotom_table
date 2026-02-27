---
cap_id: healing-C028
name: Encounter Heal Combatant API
type: —
domain: healing
---

## healing-C028: Encounter Heal Combatant API

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/heal.post.ts:default`
- **Game Concept:** In-combat healing (HP, temp HP, injuries)
- **Description:** Applies healing to a combatant during an encounter. Supports HP healing (capped at injury-reduced effective maxHp via getEffectiveMaxHp), temp HP granting (keeps whichever is higher, does NOT stack per PTU), and injury healing. Removes Fainted status if healed from 0 HP. Syncs changes to entity database record.
- **Inputs:** Encounter ID (URL param), `{ combatantId, amount?, tempHp?, healInjuries? }` (body)
- **Outputs:** `{ success, data: Encounter, healResult: { combatantId, hpHealed?, tempHpGained?, injuriesHealed?, newHp, newTempHp, newInjuries, faintedRemoved } }`
- **Accessible From:** `gm`
- **Orphan:** false
