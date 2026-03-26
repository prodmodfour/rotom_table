# Combatant Type Segregation

A potential [[extract-interface]] to address the [[combatant-interface-breadth|35-field Combatant mega-interface]].

## The idea

Split the `Combatant` interface into focused sub-interfaces, each representing a coherent concern:

| Interface | Fields | Consumers |
|---|---|---|
| `CombatantIdentity` | id, type, entityId, side, entity | All |
| `CombatantPosition` | position, tokenSize | Grid/VTT components |
| `CombatantTurnState` | turnState, hasActed, actionsRemaining, shiftActionsRemaining | Turn tracker, action panels |
| `CombatantCombatStats` | injuries, stageSources, conditionInstances, evasions, badlyPoisonedRound | Status panels, damage calculation |
| `CombatantInitiative` | initiative, initiativeBonus, initiativeRollOff | Initiative display, turn order |
| `CombatantOutOfTurn` | outOfTurnUsage, disengaged, holdAction, skipNextRound | Out-of-turn action panels |
| `CombatantMountState` | mountState | Mount-related components |
| `CombatantWeaponState` | wieldingWeaponId, wieldedByTrainerId, wasInBladeFormeOnEngage, wieldMovementUsed | Living weapon components |

`Combatant` would become the intersection of all sub-interfaces, preserving backward compatibility. Consumers could opt into narrower types where appropriate.

## Principles improved

- [[interface-segregation-principle]] — consumers depend only on the fields they use
- Could help [[single-responsibility-principle]] at the component level — components typed with narrow interfaces are implicitly scoped

## Patterns and techniques

- [[extract-interface]] — the core refactoring
- TypeScript intersection types (`CombatantIdentity & CombatantPosition`) for consumers needing multiple slices

## Trade-offs

- TypeScript intersection types can be verbose in function signatures
- Components using 4+ slices would have longer type annotations than just `Combatant`
- The sub-interfaces add naming overhead — 8 new type names to learn
- In practice, most components might just keep using `Combatant` because the narrow types aren't worth the verbosity
- No runtime benefit — this is purely a compile-time documentation/safety improvement

## Open questions

- Would consumers actually use the narrow types, or would `Combatant` remain the default everywhere?
- Is the overhead worth it for a team of one? ISP's value scales with team size and API surface
- Could a lighter approach (utility types like `Pick<Combatant, 'position' | 'tokenSize'>`) achieve the same benefit without new named types?
- Should the sub-interfaces be exported from a central `types/combatant.ts`, or co-located with their consumers?

## See also

- [[combat-entity-base-interface]] — the complementary proposal for the entity union
- [[data-clumps-smell]] — the field groupings that suggest natural interface boundaries
