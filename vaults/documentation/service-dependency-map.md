# Service Dependency Map

How the 23 services in [[service-inventory]] depend on each other:

```
pokemon-generator --> combatant (buildCombatantFromEntity)
pokemon-generator --> grid-placement (sizeToTokenSize)
csv-import --------> pokemon-generator (createPokemonRecord)
encounter ---------> combatant (calculateCurrentInitiative)
switching ---------> encounter (sortByInitiativeWithRollOff)
switching ---------> grid-placement (findPlacementPosition)
healing-item ------> combatant (applyHealingToEntity, updateStatusConditions)
intercept ---------> out-of-turn (getDefaultOutOfTurnUsage)
out-of-turn -------> intercept (detect/resolve intercept functions)
ball-condition ----> encounter (encounter state for context building)
mounting ----------> combatant (mount state on combatants)
living-weapon -----> encounter (wield state on combatants)
living-weapon -----> living-weapon-abilities + living-weapon-movement
living-weapon-abilities -> (standalone)
living-weapon-movement --> (standalone)
weather-automation -> status-automation (calculateTickDamage)
living-weapon-state -> (standalone)
```

Notable: `out-of-turn` and `intercept` are circular dependencies. `intercept` was extracted from `out-of-turn` for file size; they share types via `~/types/combat`.

## See also

- [[service-pattern-classification]]
- [[pokemon-generator-entry-point]]
