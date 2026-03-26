# Combatant Interface Breadth

The `Combatant` interface has 35 fields mixing 8+ distinct concerns:

| Concern | Fields |
|---|---|
| Identity | id, type, entityId, side |
| Initiative | initiative, initiativeBonus, initiativeRollOff |
| Turn state | turnState, hasActed, actionsRemaining, shiftActionsRemaining |
| Combat tracking | injuries, stageSources, conditionInstances, badlyPoisonedRound, evasions |
| VTT spatial | position, tokenSize |
| Out-of-turn | outOfTurnUsage, disengaged, holdAction, skipNextRound |
| Mount state | mountState |
| Living weapon | wieldingWeaponId, wieldedByTrainerId, wasInBladeFormeOnEngage, wieldMovementUsed |
| Misc | forecastOriginalTypes, visionState, entity |

Every consumer — whether a grid component needing only position, a status panel needing only conditions, or a turn tracker needing only initiative — receives the full 35-field surface. This violates the [[interface-segregation-principle]]: clients are forced to depend on fields they do not use.

Smaller focused interfaces (e.g., `CombatantPosition`, `CombatantTurnState`, `CombatantCombatStats`) would let consumers depend only on what they need. The 35-field interface also exhibits [[data-clumps-smell]] — several groups of fields always appear together and could be extracted.

## See also

- [[extract-interface]] — the refactoring that would segregate concerns
- [[large-class-smell]] — the interface is the type-level equivalent of a large class
- [[entity-union-unsafe-downcasts]] — the `entity` field itself carries a further LSP concern
- [[pinia-store-classification]] — contrast with the well-segregated zero-state stores
- [[combatant-type-segregation]] — a potential design to split this into focused sub-interfaces
