---
id: docs-002
title: "Add CLAUDE.md for app/server/services/"
priority: P0
severity: HIGH
status: open
domain: server
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 1
affected_files:
  - app/server/services/CLAUDE.md (new)
---

# docs-002: Add CLAUDE.md for app/server/services/

## Summary

Create a descendant CLAUDE.md in `app/server/services/` to document the 16-service architecture. The most critical invariant is that ALL Pokemon creation routes through `pokemon-generator.service.ts` — agents that bypass this create data inconsistencies. The service layer also has distinct patterns (pure functions vs DB writers vs orchestrators) that agents need to follow.

## Target File

`app/server/services/CLAUDE.md` (~65 lines)

## Required Content

### Entry Point Rule
ALL Pokemon creation goes through `pokemon-generator.service.ts`. Four graduated functions:
- `generatePokemonData(input)` — pure data generation (no DB)
- `createPokemonRecord(data, origin)` — DB insert only
- `generateAndCreatePokemon(input)` — generate + insert
- `buildPokemonCombatant(input, side)` — generate + insert + wrap as Combatant

### Service Patterns
| Pattern | Services | Characteristics |
|---------|----------|-----------------|
| Pure functions | status-automation, grid-placement, encounter-generation | No DB access, no side effects, easily testable |
| DB writers | entity-update, entity-builder | Prisma calls, minimal business logic |
| Hybrid | combatant, encounter, pokemon-generator, evolution | Business logic + DB writes |
| Orchestrators | switching, intercept, out-of-turn | Coordinate multiple services |

### Service Inventory (16 files)
- `pokemon-generator.service.ts` — Single entry point for all Pokemon creation
- `combatant.service.ts` — Damage application, healing, status conditions, stage modifiers, combatant construction (~686 lines, largest)
- `encounter.service.ts` — Encounter CRUD, initiative sorting, turn order, response serialization
- `entity-builder.service.ts` — Prisma records → typed Pokemon/HumanCharacter entities (JSON parsing)
- `entity-update.service.ts` — Sync combatant state changes back to DB for persistent entities
- `encounter-generation.service.ts` — Weighted random species selection with diversity enforcement for wild spawns
- `grid-placement.service.ts` — Auto-place tokens by side (players/allies/enemies), size→tokenSize mapping
- `out-of-turn.service.ts` — AoO detection/eligibility/resolution, Hold Action lifecycle, Priority Actions, Interrupts
- `intercept.service.ts` — Intercept Melee (R116) and Intercept Ranged (R117) per PTU p.242
- `switching.service.ts` — Pokemon switching: recall range validation, initiative insertion, condition clearing
- `status-automation.service.ts` — Turn-end tick damage: Burn/Poison (1 tick), Badly Poisoned (escalating), Cursed (2 ticks)
- `healing-item.service.ts` — Healing item application, delegates to combatant.service for HP/condition updates
- `evolution.service.ts` — Pokemon evolution: stat recalculation with new base stats + nature, Base Relations validation
- `rest-healing.service.ts` — Extended rest daily move refresh logic
- `scene.service.ts` — Scene-end AP restoration for all characters
- `csv-import.service.ts` — Parse PTU character sheet CSVs, routes Pokemon through pokemon-generator

### Service Dependency Map
```
pokemon-generator → combatant (buildCombatantFromEntity), grid-placement (sizeToTokenSize)
encounter → combatant (calculateCurrentInitiative)
switching → encounter (sortByInitiativeWithRollOff), grid-placement (findPlacementPosition)
healing-item → combatant (applyHealingToEntity, updateStatusConditions)
intercept → out-of-turn (getDefaultOutOfTurnUsage)
csv-import → pokemon-generator (createPokemonRecord)
```

### Gotchas
- `encounter-generation.service.ts` handles species selection from encounter tables — this is NOT the same as `pokemon-generator.service.ts` which creates Pokemon records
- Template-loaded combatants may have no `entityId` — `entity-update.service.ts` silently skips them
- `combatant.service.ts` is the largest service (~686 lines) — handles add/remove/damage/heal/status/stages
- Services that are pure functions (status-automation, grid-placement) should never gain DB dependencies

## Verification

- File is 30-80 lines
- No duplication with parent `app/server/CLAUDE.md` (currently only covers WebSocket)
- pokemon-generator entry point rule matches actual call sites in codebase
- Dependency map verified against actual import statements
