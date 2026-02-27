---
cap_id: combat-C021
name: Heal Combatant
type: api-endpoint
domain: combat
---

### combat-C021: Heal Combatant
- **cap_id**: combat-C021
- **name**: Heal Combatant in Combat
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/heal.post.ts`
- **game_concept**: In-combat healing (HP, temp HP, injuries)
- **description**: Heals a combatant: HP capped at injury-reduced effective max, temp HP keeps higher of old/new (no stacking), injury healing. Removes Fainted status if healed from 0 HP.
- **inputs**: `{ combatantId, amount?, tempHp?, healInjuries? }`
- **outputs**: Updated encounter + heal result
- **accessible_from**: gm
