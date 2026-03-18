The [[trainer-level-up-modal]] builds its step list dynamically based on what the advancement grants. The fixed order is: Milestones, Stats, Edges, Features, Classes, Summary. Steps are omitted when their budget is zero.

Milestones are placed first because [[trainer-level-up-milestone-budget-effects|milestone choices affect the budgets]] of Stats, Edges, and Features. Stats always appear. Edges appear when base edges, bonus Skill Edges, or milestone bonus edges exist. Features appear when base features or milestone bonus features exist. Classes appear when levels 5 or 10 are crossed. Summary always appears last.

If the step list shrinks (e.g., a milestone choice changes that removes an edge allocation), the current step index is clamped to avoid pointing past the end of the list.
