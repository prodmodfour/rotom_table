---
cap_id: combat-C072
name: calculateEncounterXp
type: utility
domain: combat
---

### combat-C072: calculateEncounterXp
- **cap_id**: combat-C072
- **name**: XP Calculator
- **type**: utility
- **location**: `app/utils/encounterBudget.ts` — `calculateEncounterXp()`
- **game_concept**: PTU XP formula (Core p.460)
- **description**: effectiveLevels * significance / playerCount.
- **inputs**: enemies[], significanceMultiplier, playerCount
- **outputs**: { totalXp, xpPerPlayer, baseXp }
- **accessible_from**: gm

---

## Constant Capabilities
