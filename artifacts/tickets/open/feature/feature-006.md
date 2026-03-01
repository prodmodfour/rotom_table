---
id: feature-006
title: Pokemon Evolution System
priority: P1
severity: HIGH
status: in-progress
domain: pokemon-lifecycle
source: matrix-gap (GAP-PLC-1)
matrix_source: pokemon-lifecycle R029, R031, R032, R033, R034
created_by: master-planner
created_at: 2026-02-28
---

# feature-006: Pokemon Evolution System

## Summary

No evolution mechanics are implemented. The app can create Pokemon at any stage but has no detection, workflow, or automation for evolution events. This is a core PTU lifecycle mechanic covering 5 matrix rules, all classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R029 | Evolution Check on Level Up | Missing — `checkLevelUp` does not check evolution conditions; `SpeciesData` lacks evolution trigger encoding |
| R031 | Evolution — Stat Recalculation | Missing — no species change workflow; no stat recalculation |
| R032 | Evolution — Ability Remapping | Missing — no ability remapping on evolution |
| R033 | Evolution — Immediate Move Learning | Missing — no evolution-triggered move learning |
| R034 | Evolution — Skills/Capabilities Update | Missing — no evolution capability/skill update |

## PTU Rules

- Chapter 10 (Pokemon) — Evolution rules
- Evolution triggers: level thresholds, item use, trade, happiness, etc.
- Stats recalculated using new species base stats + existing stat points
- Abilities remapped from new species ability list
- New moves from evolution learnset immediately available
- Capabilities and skills update per new species data

## Implementation Scope

This is a FULL-scope feature requiring a multi-tier design spec before implementation.

## Affected Areas

- `app/prisma/schema.prisma` — SpeciesData may need evolution trigger encoding
- `app/server/services/pokemon-generator.service.ts` — evolution stat recalculation
- `app/composables/usePokemonLevelUp.ts` or new composable — evolution detection
- `app/components/pokemon/` — evolution UI (confirmation modal, species change)
- `app/server/api/pokemon/` — evolution endpoint
- `books/markdown/pokedexes/` — evolution data source

## Resolution Log

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-28 | 200b3b3 | Design spec complete: `artifacts/designs/design-pokemon-evolution-001/` (6 files, 3 tiers: P0 core mechanics, P1 ability/move/capability updates, P2 items/undo/special conditions) |
| 2026-02-28 | 5453baf | P0: Schema — add `evolutionTriggers` column to SpeciesData, add EvolutionTrigger interface |
| 2026-02-28 | 8e35417 | P0: Seed — enhance parser to extract evolution triggers (level/stone/held-item patterns) |
| 2026-02-28 | cb5615a | P0: Utility — `evolutionCheck.ts` with eligibility check + getEvolutionLevels |
| 2026-02-28 | dada60b | P0: Service — `evolution.service.ts` with extractStatPoints, recalculateStats, performEvolution |
| 2026-02-28 | 82cb467 | P0: Endpoint — POST /api/pokemon/:id/evolution-check |
| 2026-02-28 | b1ae35a | P0: Endpoint — POST /api/pokemon/:id/evolve |
| 2026-02-28 | fe4a5ec | P0: Integration — feed evolution levels into calculateLevelUps (canEvolve flag) |
| 2026-02-28 | 912692e | P0: UI — EvolutionConfirmModal with stat redistribution + Base Relations validation |
| 2026-02-28 | 4d2cc37 | P0: UI — clickable evolution entries in LevelUpNotification |
| 2026-02-28 | 2849aec | P0: UI — manual Evolve button on Pokemon sheet page |
| 2026-02-28 | 5ce760c | P0: Refactor — move validateBaseRelations to shared utils for client use |
| 2026-03-01 | b589480 | P1: Service — remapAbilities() for positional ability remapping (R032) |
| 2026-03-01 | 34b1684 | P1: Utility — getEvolutionMoves() for evolution move learning (R033, decree-036) |
| 2026-03-01 | 24d6bfb | P1: Service — extend performEvolution with abilities, moves, capabilities, skills (R032/R033/R034) |
| 2026-03-01 | e19d2f8 | P1: Endpoint — extend POST evolve to accept abilities and moves arrays |
| 2026-03-01 | 55f5636 | P1: Endpoint — extend POST evolution-check with ability/move data + MoveData enrichment |
| 2026-03-01 | 30851f4 | P1: UI — multi-step evolution modal (stat/ability/move/summary) with 3 sub-components |
| 2026-03-01 | 39f47e9 | P1: UI — update Pokemon sheet + XpDistributionResults callers for P1 props |
| 2026-03-01 | 900c49d | P1: WebSocket — pokemon_evolved broadcast to all clients |
