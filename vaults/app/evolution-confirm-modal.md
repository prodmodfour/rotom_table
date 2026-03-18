The evolution confirm modal (`app/components/pokemon/EvolutionConfirmModal.vue`) is a multi-step UI that appears after the [[gm-pokemon-detail-evolve-button]] passes the evolution eligibility check.

It has three steps:
1. **Stat redistribution** (`EvolutionStatStep.vue`) — the new species has different base stats, so stat points may need redistribution while maintaining [[pokemon-stat-allocation-enforces-base-relations]]
2. **Ability resolution** (`EvolutionAbilityStep.vue`) — abilities are positionally remapped from old to new species. When the old ability's index exceeds the new species' list, the GM is prompted to resolve it manually
3. **Move learning** (`EvolutionMoveStep.vue`) — shows moves available upon evolution (new learnset entries not in the old form's learnset and not already known)

Confirming the final step calls `POST /api/pokemon/:id/evolve`, which delegates to the [[evolution-service]].
