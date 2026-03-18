The [[trainer-level-up-summary-step]] includes a "Skill Rank-Ups (from Skill Edges)" section when any Skill Edges were chosen. Each rank-up shows the skill name, old rank, new rank, and source (e.g., "Bonus L2" or "Regular Edge").

The display handles stacking correctly: if the same skill is raised by multiple Skill Edges (e.g., a bonus Skill Edge and a regular Skill Edge both targeting Athletics), each subsequent rank-up starts from the result of the previous one, not the character's base rank. This is computed via a `runningRank` tracker that processes bonus Skill Edge rank-ups first, then regular Skill Edge rank-ups.

Skill Edge tags in the "New Edges" section are highlighted with a distinct style (warning color) to distinguish them from non-Skill edges.
