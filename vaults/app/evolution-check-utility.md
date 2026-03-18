The evolution check utility (`app/utils/evolutionCheck.ts`) provides pure functions for determining evolution eligibility.

`checkEvolutionEligibility()` evaluates a Pokemon against its species' EvolutionTriggers: level requirements, held items, gender constraints, and known-move prerequisites. It blocks evolution if the Pokemon holds an Everstone or Eviolite.

`getEvolutionLevels()` extracts level-only triggers for integration with the [[pokemon-xp-and-leveling-system]] — so the XP system can flag when a Pokemon reaches an evolution level.

`getEvolutionMoves()` identifies moves available upon evolution: new entries in the evolved form's [[species-learnset-stored-as-json]] that were not in the pre-evolution form's learnset and are not already known.

`buildSelectedMoveList()` combines the Pokemon's kept current moves with newly learned evolution moves for the [[evolution-confirm-modal]].

## See also

- [[gm-pokemon-detail-evolve-button]]
- [[evolution-service]]
