# Trainer Derived Stats

Pure PTU capability calculator in `utils/trainerDerivedStats.ts`.

## Functions

- `computeTrainerDerivedStats` — Computes Power, High Jump, Long Jump, Overland, Swimming, Throwing Range, Weight Class from skill ranks + weight.
- `skillRankToNumber` — Maps `SkillRank` enum to numeric 1--6.

## Consumers

- **CapabilitiesDisplay.vue** and **HumanStatsTab.vue** — Character sheet display.
- **combatantCapabilities.ts** — VTT movement values (Overland, Swimming).

## See also

- [[trainer-capabilities-field]]
- [[movement-modifiers-utility]]
- [[trainer-skill-definitions]]
- [[trainer-stat-budget]]
