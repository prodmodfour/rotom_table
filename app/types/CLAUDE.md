# Types CLAUDE.md

15 TypeScript type definition files. Import via barrel (`~/types`) or direct (`~/types/spatial`).

## File Classification

| File | Lines | Source | Key Types |
|------|-------|--------|-----------|
| `index.ts` | 44 | Barrel re-export | Exports all below |
| `combat.ts` | 329 | Hand-written | StatusCondition, ActionType, TurnPhase, StageModifiers, TurnState, CombatSide, OutOfTurnAction, MountState, WieldRelationship |
| `spatial.ts` | 131 | Hand-written | GridPosition, GridConfig, TokenState, TerrainCell, TerrainFlags, MovementPath, RangeType, ParsedRange |
| `character.ts` | 289 | Prisma-derived | HumanCharacter, Pokemon, Move, Ability, Stats, EquipmentSlots, PokemonOrigin |
| `encounter.ts` | 244 | Prisma-derived | Combatant (includes mountState, wieldMovementUsed, forecastOriginalTypes), Encounter, MoveLogEntry, EncounterSnapshot, LibraryFilters |
| `scene.ts` | 61 | Hand-written | Scene, SceneCharacter, ScenePokemon, SceneGroup, GroupViewTab, SceneModifier |
| `habitat.ts` | 97 | Hand-written | EncounterTable, TableModification, RarityPreset, DensityTier (includes runtime constants) |
| `template.ts` | 29 | Hand-written | TemplateCombatant, EncounterTemplate |
| `api.ts` | 99 | Hand-written | ApiResponse\<T\>, WebSocketEvent (53-member discriminated union) |
| `settings.ts` | 22 | Hand-written | AppSettings, DamageMode, DEFAULT_SETTINGS |
| `species.ts` | 44 | Prisma-derived | SpeciesData, EvolutionTrigger |
| `player.ts` | 8 | Hand-written | PlayerTab |
| `player-sync.ts` | 167 | Hand-written | Track C WebSocket protocol: PlayerActionRequest, PlayerTurnNotification, SceneSyncPayload |
| `vtt.ts` | 15 | Hand-written | TerrainCostGetter, ElevationCostGetter (function type signatures) |
| `guards.ts` | 37 | Hand-written | isPokemon(), isHumanCharacter(), getEntityDisplayName() |

## Prisma-Derived vs Hand-Written

**Prisma-aligned** (shape mirrors DB model, enriched with TypeScript unions for JSON fields):
- `character.ts` -- `Pokemon` and `HumanCharacter` match Prisma models
- `species.ts` -- `SpeciesData` mirrors Prisma `SpeciesData` model
- `encounter.ts` -- `Encounter` mirrors Prisma `Encounter` model (partial)

**Hand-written** (runtime state only, no DB backing): all others.

## Combatant Type Hierarchy

```
Pokemon / HumanCharacter  (DB entities, character.ts)
  -> wrapped by Combatant  (encounter.ts)
     adds: type discriminator, initiative, TurnState, InjuryState,
           StageSource[], evasions, GridPosition, OutOfTurnUsage, MountState
  -> contained in Encounter (encounter.ts)
     holds: combatants[], turnOrder, declarations, moveLog,
            pendingOutOfTurnActions, gridConfig, weather
```

## Cross-Domain Import Flow

- `combat.ts` -> `character.ts` and `encounter.ts` (StatusCondition, StageModifiers, TurnState)
- `spatial.ts` -> `encounter.ts` and `vtt.ts` (GridPosition, GridConfig)
- `encounter.ts` imports from `spatial.ts`, `combat.ts`, and `character.ts`
- `api.ts` imports from all domain files -- defines the WebSocketEvent union
- `scene.ts` is self-contained (extracted from stores/groupViewTabs.ts)
- `player-sync.ts` only imports GridPosition from `spatial.ts`

## Special Notes

- **`vtt.ts`** exists solely to break a circular dependency between `usePathfinding` and `useRangeParser`
- **`habitat.ts`** includes runtime constants (`RARITY_WEIGHTS`, `DENSITY_SUGGESTIONS`, `MAX_SPAWN_COUNT`) -- not just types
- **`combat.ts`** includes runtime constants (`AOO_BLOCKING_CONDITIONS`, `INTERCEPT_BLOCKING_CONDITIONS`)
- **Barrel import**: `import { Combatant } from '~/types'` or direct: `import { GridPosition } from '~/types/spatial'`
