# Type File Classification

15 TypeScript type definition files in `app/types/`. Import via barrel (`~/types`) or direct (`~/types/spatial`).

| File | Lines | Source | Key Types |
|---|---|---|---|
| `index.ts` | 44 | Barrel re-export | Exports all below |
| `combat.ts` | 372 | Hand-written | StatusCondition, ActionType, TurnPhase, StageModifiers, TurnState, CombatSide, OutOfTurnAction, MountState, WieldRelationship, ConditionSourceType, ConditionInstance, HpReductionType |
| `spatial.ts` | 131 | Hand-written | GridPosition, GridConfig, TokenState, TerrainCell, TerrainFlags, MovementPath, RangeType, ParsedRange |
| `character.ts` | 294 | Prisma-derived | HumanCharacter, Pokemon, Move, Ability, Stats, EquipmentSlots, PokemonOrigin |
| `encounter.ts` | 338 | Prisma-derived | Combatant, Encounter, MoveLogEntry, EnvironmentEffect, EnvironmentPreset, MovementPreview, EncounterSnapshot, LibraryFilters |
| `scene.ts` | 61 | Hand-written | Scene, SceneCharacter, ScenePokemon, SceneGroup, GroupViewTab, SceneModifier |
| `habitat.ts` | 97 | Hand-written | EncounterTable, TableModification, RarityPreset, DensityTier (includes runtime constants) |
| `template.ts` | 29 | Hand-written | TemplateCombatant, EncounterTemplate |
| `api.ts` | 99 | Hand-written | ApiResponse\<T\>, [[websocket-event-union|WebSocketEvent]] (53-member discriminated union) |
| `settings.ts` | 22 | Hand-written | AppSettings, DamageMode, DEFAULT_SETTINGS |
| `species.ts` | 44 | Prisma-derived | SpeciesData, EvolutionTrigger |
| `player.ts` | 8 | Hand-written | PlayerTab |
| `player-sync.ts` | 167 | Hand-written | PlayerActionRequest, PlayerTurnNotification, SceneSyncPayload |
| `vtt.ts` | 15 | Hand-written | TerrainCostGetter, ElevationCostGetter (function type signatures) |
| `guards.ts` | 37 | Hand-written | isPokemon(), isHumanCharacter(), getEntityDisplayName() |

See [[prisma-derived-vs-hand-written-types]] for the distinction. See [[combatant-type-hierarchy]] for the central type relationship.

`vtt.ts` exists solely to break a circular dependency between `usePathfinding` and `useRangeParser`. `habitat.ts` and `combat.ts` include runtime constants alongside types. See [[encounter-table-data-model]] for the models behind `habitat.ts`.
