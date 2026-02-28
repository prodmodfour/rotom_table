# Design: Pokemon Evolution System

**Design ID:** design-pokemon-evolution-001
**Feature Ticket:** feature-006
**Priority:** P1
**Domain:** pokemon-lifecycle
**Status:** p0-implemented
**Created:** 2026-02-28

## Scope

Full PTU 1.05 Pokemon evolution mechanics: detection, species change, stat recalculation, ability remapping, move learning, capability/skill updates, evolution items, and cancellation.

## Matrix Coverage

| Rule | Title | Tier |
|------|-------|------|
| R029 | Evolution Check on Level Up | P0 |
| R031 | Evolution -- Stat Recalculation | P0 |
| R032 | Evolution -- Ability Remapping | P1 |
| R033 | Evolution -- Immediate Move Learning | P1 |
| R034 | Evolution -- Skills/Capabilities Update | P1 |

## Priority Tiers

### P0: Core Evolution Mechanics
- Evolution trigger data model (SpeciesData.evolutionTriggers column)
- Seed parser enhancement to extract trigger conditions from pokedex files
- Evolution eligibility check utility (level, stone, held-item triggers)
- Evolution execution service (species change, stat recalculation, HP adjustment)
- Server endpoints: evolution-check, evolve
- Minimal UI: confirmation modal with stat redistribution
- Level-up integration: accurate `canEvolve` flag in LevelUpEvent

### P1: Ability, Move, Capability Updates
- Ability positional remapping (Basic1 -> Basic1, etc.)
- Evolution move learning (new form's exclusive learnset moves)
- Capability and skill wholesale replacement from new species
- Size change handling (VTT token update)
- WebSocket sync (pokemon_evolved event)
- Multi-step evolution modal (stat, ability, move, summary steps)

### P2: Polish and Special Conditions
- Everstone/Eviolite evolution prevention
- Stone consumption from trainer inventory
- Held item consumption after evolution
- Post-evolution undo (snapshot + restore)
- Evolution history logging (move log + Pokemon notes)
- Gender-specific evolution triggers
- Move-specific evolution triggers
- Sprite auto-update on evolution
- Trade evolution placeholder (if needed)

## Design Documents

| File | Contents |
|------|----------|
| [shared-specs.md](shared-specs.md) | Existing code analysis, types, interfaces, evolution trigger format |
| [spec-p0.md](spec-p0.md) | Core evolution: data model, eligibility check, stat recalc, endpoint |
| [spec-p1.md](spec-p1.md) | Ability remapping, move learning, capability/skill updates, WebSocket |
| [spec-p2.md](spec-p2.md) | Items, prevention, undo, history, special conditions, sprites |
| [testing-strategy.md](testing-strategy.md) | Unit test plan with specific test cases per tier |

## Key Design Decisions

1. **Evolution triggers stored in SpeciesData** (JSON column, not separate table) -- consistent with learnset/abilities/skills pattern, avoids joins in hot path

2. **Stat recalculation requires GM redistribution** -- PTU rules say "re-Stat the Pokemon, spreading the Stats as you wish." The app provides old allocation as starting point but the GM must confirm the new distribution.

3. **Current HP adjusts proportionally** -- if Pokemon was at 50% HP before evolution, it stays at 50% after. Prevents evolution from being a free heal or an accidental kill.

4. **Ability remapping is positional** -- PTU explicitly states abilities "change to match the Ability in the same spot." Non-species abilities (from Features) are preserved.

5. **Evolution moves are offered, not forced** -- PTU says they "can" learn moves, not that they must. Player chooses what to add/replace.

6. **Base Relations validated but overridable** -- some PTU Features break Base Relations. The GM gets a skip flag for these cases.

## Dependencies

- Prisma schema migration (new column on SpeciesData)
- Seed re-run (to populate evolution triggers)
- No external library dependencies

## Implementation Log

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-28 | 5453baf | P0: Schema — `evolutionTriggers` column on SpeciesData + EvolutionTrigger type |
| 2026-02-28 | 8e35417 | P0: Seed — parser extracts evolution triggers from pokedex files |
| 2026-02-28 | cb5615a | P0: Utility — `evolutionCheck.ts` eligibility check + getEvolutionLevels |
| 2026-02-28 | dada60b | P0: Service — `evolution.service.ts` stat recalc + performEvolution |
| 2026-02-28 | 82cb467 | P0: Endpoint — POST /api/pokemon/:id/evolution-check |
| 2026-02-28 | b1ae35a | P0: Endpoint — POST /api/pokemon/:id/evolve |
| 2026-02-28 | fe4a5ec | P0: Integration — evolution levels fed to calculateLevelUps |
| 2026-02-28 | 912692e | P0: UI — EvolutionConfirmModal with stat redistribution |
| 2026-02-28 | 4d2cc37 | P0: UI — clickable evolution entries in LevelUpNotification |
| 2026-02-28 | 2849aec | P0: UI — Evolve button on Pokemon sheet page |
| 2026-02-28 | 5ce760c | P0: Refactor — shared validateBaseRelations + EvolutionStats type |
