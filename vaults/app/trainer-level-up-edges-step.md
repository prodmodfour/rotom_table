The Edges step of the [[trainer-level-up-modal]], shown when the new level grants edges. Contains two sub-sections:

**Regular Edges** — a counter (e.g., "0 / 1"), a text input with "Enter edge name..." placeholder and an "Add Edge" button (disabled until text is entered), plus an "Add Skill Edge" button for converting a regular edge into a skill rank-up.

**Bonus Skill Edge (Level N)** — appears at levels that grant a bonus Skill Edge (levels 2, 6, 12). Shows a counter, an italic note describing the rank cap for that edge (e.g., "Cannot raise a skill to Adept with this edge." at level 2), and the [[trainer-level-up-bonus-skill-edge-picker]].

The text input and "Add Skill Edge" button match the same pattern used in the [[full-create-edges-section]]. Regular Skill Edges are [[trainer-level-up-regular-skill-edge-storage|stored as "Skill Edge: ..." strings]] in the edge choices array.

## See also

- [[trainer-skill-rank-caps-by-level]]
- [[trainer-level-up-milestone-budget-effects]]
