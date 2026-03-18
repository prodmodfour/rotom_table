Pokemon gain additional abilities at milestone levels: level 20 unlocks a second ability, and level 40 unlocks a third.

`POST /api/pokemon/:id/assign-ability` handles the assignment. It validates that the Pokemon has reached the appropriate milestone and that the chosen ability belongs to the correct pool, as determined by [[species-abilities-categorized-by-positional-index]].

The [[pokemon-level-up-allocation-composable]] (`app/composables/useLevelUpAllocation.ts`) checks for these milestones during level-up and surfaces them in the [[pokemon-level-up-panel]].

During [[evolution-confirm-modal]], abilities are positionally remapped from the old species' ability list to the new species' list. When the positional index exceeds the new list's size, the system flags it for GM resolution.
