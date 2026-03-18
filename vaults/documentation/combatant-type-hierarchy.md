# Combatant Type Hierarchy

The central type relationship in the app:

```
Pokemon / HumanCharacter  (DB entities, character.ts)
  -> wrapped by Combatant  (encounter.ts)
     adds: type discriminator, initiative, TurnState, InjuryState,
           StageSource[], evasions, GridPosition, OutOfTurnUsage,
           MountState, ConditionInstance[]
  -> contained in Encounter (encounter.ts)
     holds: combatants[], turnOrder, declarations, moveLog,
            pendingOutOfTurnActions, gridConfig, weather
```

Pokemon and HumanCharacter are [[prisma-derived-vs-hand-written-types|Prisma-derived]] entity types. Combatant wraps them with encounter-specific runtime state. Encounter state is [[denormalized-encounter-combatants|stored as JSON]] in the database.

## Cross-Domain Import Flow

- `combat.ts` -> `character.ts` and `encounter.ts` (StatusCondition, StageModifiers, TurnState)
- `spatial.ts` -> `encounter.ts` and `vtt.ts` (GridPosition, GridConfig)
- `encounter.ts` imports from `spatial.ts`, `combat.ts`, `character.ts`, and `~/utils/visionRules`
- `api.ts` imports from all domain files — defines the [[websocket-event-union]]
- `scene.ts` is self-contained (extracted from stores/groupViewTabs.ts)
- `player-sync.ts` only imports GridPosition from `spatial.ts`

## See also

- [[combat-stage-system]] — StageSource[] tracks combat stage modifications
- [[status-condition-categories]] — ConditionInstance[] categorized as persistent/volatile/other
- [[hp-injury-system]] — InjuryState tracks marker-crossing injuries
- [[initiative-and-turn-order]] — initiative field on combatants
- [[type-file-classification]]
- [[entity-union-unsafe-downcasts]] — the LSP cost of the current Pokemon/HumanCharacter union
- [[entity-shared-field-incompatibility]] — capabilities and skills field name clash
- [[combatant-interface-breadth]] — the ISP cost of the 35-field Combatant type
