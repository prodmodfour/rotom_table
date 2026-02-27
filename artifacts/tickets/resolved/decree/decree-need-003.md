---
ticket_id: decree-need-003
ticket_type: decree-need
priority: P0
status: addressed
decree_id: decree-003
domain: vtt
topic: token-blocking-movement
affected_files:
  - app/composables/useGridMovement.ts
  - app/composables/usePathfinding.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should all tokens completely block movement, or should some be passable?

## PTU Rule Reference

- **p.231**: "Squares occupied by enemies always count as Rough Terrain" — implies enemies are passable (with accuracy penalty), NOT blocking.
- **p.231**: Rough Terrain is NOT listed as Blocking Terrain. It has an accuracy penalty when targeting through it.
- **p.241**: Attack of Opportunity triggers when "An adjacent foe Shifts out of a Square adjacent to you" — implies adjacency during movement, not pass-through.
- PTU does not explicitly address ally-occupied squares.

## Current Behavior

`useGridMovement.ts:getBlockedCells()` treats ALL other tokens (ally and enemy) as completely blocked cells. The A* pathfinding in `usePathfinding.ts` skips blocked cells entirely. No token can move through or into any occupied square.

## Options

### Option A: All tokens block (current)
Most conservative. Simple. But contradicts PTU calling enemy squares "Rough Terrain" (passable).

### Option B: Allies passable, enemies block
Common tabletop convention. Can move through allied squares but not enemy squares.

### Option C: Pass-through but no stacking (D&D-style)
Can move through any occupied square but cannot end turn on one. Enemy squares count as rough terrain (accuracy penalty).

### Option D: All passable, enemy = rough terrain
Literal PTU reading. Can move through everything. Enemy squares have accuracy penalty when targeting through them.

## Blocking

Affects all VTT movement and pathfinding. Current behavior is functional but restrictive.
