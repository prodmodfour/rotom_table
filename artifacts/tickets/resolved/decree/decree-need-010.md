---
ticket_id: decree-need-010
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-010
domain: vtt
topic: rough-slow-terrain-overlap
affected_files:
  - app/stores/terrain.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should terrain support being both Rough AND Slow simultaneously?

## PTU Rule Reference

- **p.231**: "Rough Terrain: Most Rough Terrain is also Slow Terrain, but not always. When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls."
- **p.231**: "Slow Terrain: When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead."
- **p.231**: "Squares occupied by enemies always count as Rough Terrain."

PTU defines Rough (accuracy penalty) and Slow (double movement cost) as overlapping but distinct. "Most Rough is also Slow" implies a cell can be both.

## Current Behavior

`terrain.ts` has mutually exclusive types: `difficult: 2` (slow) and `rough: 1` (accuracy penalty). A cell cannot be both. Additionally, enemy-occupied squares are not treated as Rough Terrain.

## Options

### Option A: Add composite "rough-slow" terrain type
Single new type that applies both movement cost doubling and accuracy penalty.

### Option B: Multi-tag terrain system
Each cell can have multiple flags (rough + slow) rather than a single enum. More flexible but larger refactor.

### Option C: Keep simplified model (current)
Accept as a known limitation. GM chooses the more important effect per cell.

## Blocking

Affects terrain modeling fidelity. Current behavior is functional but incomplete.
