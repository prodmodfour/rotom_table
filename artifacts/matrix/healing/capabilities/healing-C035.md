---
cap_id: healing-C035
name: Store -- healCombatant()
type: —
domain: healing
---

## healing-C035: Store -- healCombatant()

- **Type:** store-action
- **Location:** `stores/encounter.ts:healCombatant`
- **Game Concept:** Store action for in-combat healing
- **Description:** Calls `POST /api/encounters/:id/heal` with combatantId, amount, tempHp, healInjuries. Updates encounter state with response.
- **Inputs:** `combatantId, amount, tempHp, healInjuries`
- **Outputs:** Updates `this.encounter` with healed encounter state
- **Accessible From:** `gm`
- **Orphan:** false
