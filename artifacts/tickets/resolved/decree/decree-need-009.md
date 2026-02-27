---
ticket_id: decree-need-009
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-009
domain: vtt
topic: diagonal-line-length
affected_files:
  - app/composables/useRangeParser.ts
  - app/stores/measurement.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should diagonal Line attacks be shortened to account for PTU's alternating diagonal cost rule?

## PTU Rule Reference

- **p.343-344**: "Line X — The Move creates a line X meters long starting from the user and hits all legal targets in that line. When used diagonally, apply the same rules as for diagonal movement."
- Diagonal movement rule (p.231): alternating 1-2-1 cost.

## Current Behavior

`useRangeParser.ts` and `measurement.ts` always step exactly `size` cells in the given direction. Line 4 diagonal = 4 cells. But per PTU alternating rule, 4 meters of diagonal distance = 3 cells (costs 1+2+1=4m).

## Options

### Option A: Shorten diagonal lines (PTU literal)
Line 4 diagonal = 3 cells (since 4m of alternating-diagonal covers 3 squares). Faithful to rules but less intuitive.

### Option B: Always X cells (current)
Simpler, more intuitive. Diagonal and cardinal lines hit the same number of cells. Diverges from literal PTU text.

### Option C: "Apply same rules" means grid tracing, not length
Interpret the rule as meaning "trace the line diagonally on the grid" (which the code does) rather than "the line is shorter diagonally."

## Blocking

Affects diagonal Line-type moves. Current behavior is functional.
