---
cap_id: healing-C030
name: Apply Healing to Entity (Service)
type: —
domain: healing
---

## healing-C030: Apply Healing to Entity (Service)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:applyHealingToEntity`
- **Game Concept:** Core in-combat healing logic
- **Description:** Heals injuries first (so effective max HP reflects post-heal count), then applies HP healing (capped at getEffectiveMaxHp using post-heal injury count), grants temp HP (keeps whichever is higher per PTU, does NOT stack), and removes Fainted status if healing from 0 HP. Mutates combatant entity in-place.
- **Inputs:** `combatant: Combatant, options: { amount?, tempHp?, healInjuries? }`
- **Outputs:** `HealResult { hpHealed?, tempHpGained?, injuriesHealed?, newHp, newTempHp, newInjuries, faintedRemoved }`
- **Accessible From:** `api-only`
- **Orphan:** false
