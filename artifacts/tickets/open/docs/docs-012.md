---
id: docs-012
title: "Add CLAUDE.md for app/types/"
priority: P0
severity: MEDIUM
status: open
domain: types
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 3
affected_files:
  - app/types/CLAUDE.md (new)
---

# docs-012: Add CLAUDE.md for app/types/

## Summary

Create a descendant CLAUDE.md in `app/types/` to document the 15 type files, their classification (Prisma-derived vs hand-written), the combatant type hierarchy, and cross-domain import patterns. Agents modifying types need to understand which types mirror DB models vs which represent runtime-only state, and the central `Combatant` wrapper pattern.

## Target File

`app/types/CLAUDE.md` (~50 lines)

## Required Content

### File Classification Table
| File | Lines | Source | Key Types |
|------|-------|--------|-----------|
| `index.ts` | 44 | Barrel re-export | Exports all below |
| `combat.ts` | 256 | Hand-written | StatusCondition, ActionType, TurnPhase, StageModifiers, TurnState, CombatSide, OutOfTurnAction |
| `spatial.ts` | 131 | Hand-written | GridPosition, PixelPosition, GridConfig, TokenState, TerrainCell, MovementPath, RangeType |
| `character.ts` | 289 | Prisma-derived + manual | HumanCharacter, Pokemon, PokemonOrigin |
| `encounter.ts` | 211 | Prisma-derived + manual | Combatant, Encounter, MoveLogEntry, EncounterSnapshot |
| `scene.ts` | 61 | Hand-written | Scene, SceneCharacter, ScenePokemon, SceneGroup, GroupViewTab, SceneModifier |
| `habitat.ts` | 97 | Hand-written | Rarity weights, density suggestions, table entries, modifications (includes runtime constants) |
| `template.ts` | 29 | Hand-written | TemplateCombatant, EncounterTemplate |
| `api.ts` | 94 | Hand-written | ApiResponse\<T\>, 40+ member WebSocketEvent discriminated union |
| `settings.ts` | 22 | Hand-written | AppSettings, DamageMode, defaults |
| `species.ts` | 44 | Prisma-derived | SpeciesData, EvolutionTrigger |
| `player.ts` | 8 | Hand-written | PlayerTab type |
| `player-sync.ts` | 155 | Hand-written | Track C WebSocket protocol: action requests, turn notifications, move requests |
| `vtt.ts` | 15 | Hand-written | TerrainCostGetter, ElevationCostGetter (function type signatures) |
| `guards.ts` | 37 | Hand-written | isPokemon(), isHumanCharacter(), getEntityDisplayName() |

### Prisma-Derived vs Hand-Written
**Prisma-aligned** (shape mirrors DB model, but hand-written with richer typing for JSON fields):
- `character.ts` — `Pokemon` and `HumanCharacter` interfaces match Prisma models but add TypeScript union types for fields stored as JSON strings
- `species.ts` — `SpeciesData` mirrors Prisma `SpeciesData` model
- `encounter.ts` — `Encounter` mirrors Prisma `Encounter` model (partial)

**Purely hand-written** (runtime state, not in DB):
- All others: `combat.ts`, `spatial.ts`, `scene.ts`, `habitat.ts`, `template.ts`, `api.ts`, `player-sync.ts`, `vtt.ts`, `guards.ts`, `settings.ts`, `player.ts`

### Combatant Type Hierarchy
```
Pokemon / HumanCharacter (DB entities in character.ts)
  ↓ wrapped by
Combatant (in encounter.ts) — adds:
  - type: 'pokemon' | 'human' discriminator
  - entityId: string reference
  - entity: Pokemon | HumanCharacter union
  - Combat state: initiative, TurnState, InjuryState, StageSource[], OutOfTurnUsage, evasions, GridPosition, tokenSize
  ↓ contained in
Encounter (in encounter.ts) — holds:
  - combatants: Combatant[]
  - Turn tracking, declarations, switchActions, pendingOutOfTurnActions
```

### Cross-Domain Import Flow
- `combat.ts` types feed into `encounter.ts` and `character.ts`
- `spatial.ts` types feed into `encounter.ts` and `vtt.ts`
- `character.ts` imports from `combat.ts` (StatusCondition, StageModifiers, ActionType, MoveFrequency)
- `encounter.ts` imports from `spatial.ts`, `combat.ts`, and `character.ts`
- `api.ts` imports from everything — defines the 40+ member `WebSocketEvent` discriminated union
- `scene.ts` is self-contained (extracted from stores/groupViewTabs.ts)
- `player-sync.ts` only imports `GridPosition` from `spatial.ts`

### Special Notes
- `vtt.ts` exists solely to break a circular dependency between `usePathfinding` and `useRangeParser` — it defines function type signatures (`TerrainCostGetter`, `ElevationCostGetter`) that both composables can reference without importing each other
- `habitat.ts` includes runtime constants (`RARITY_WEIGHTS`, `DENSITY_SUGGESTIONS`, `MAX_SPAWN_COUNT`) — not just types
- Import via barrel: `import { Combatant } from '~/types'` or direct: `import { GridPosition } from '~/types/spatial'`

## Verification

- File is 30-80 lines
- File count matches actual directory listing (15 files)
- Combatant hierarchy verified against encounter.ts and character.ts type definitions
- Import flow verified against actual import statements in type files
