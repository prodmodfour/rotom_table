---
cap_id: pokemon-lifecycle-C020
name: calculateEncounterXp
type: utility
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C020: calculateEncounterXp
- **cap_id**: pokemon-lifecycle-C020
- **name**: Post-Combat XP Calculator
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -- `calculateEncounterXp()`
- **game_concept**: PTU post-combat XP formula (Core p.460)
- **description**: Pure function. Step 1: sum defeated enemy levels (trainers count as 2x). Step 2: multiply by GM significance multiplier (0.5-10). Step 3: divide by player count (unless boss encounter). All divisions floored. Returns full breakdown with per-enemy contributions.
- **inputs**: XpCalculationInput (defeatedEnemies, significanceMultiplier, playerCount, isBossEncounter)
- **outputs**: XpCalculationResult (totalXpPerPlayer, breakdown with enemy details)
- **accessible_from**: gm (via xp-calculate/xp-distribute endpoints)
