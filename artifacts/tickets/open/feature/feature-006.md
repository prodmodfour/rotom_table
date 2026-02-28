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
