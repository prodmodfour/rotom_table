---
ticket_id: decree-need-007
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-007
domain: vtt
topic: cone-shape-width
affected_files:
  - app/composables/useRangeParser.ts
  - app/stores/measurement.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should cone attack shapes have fixed 3m-wide rows (literal PTU text) or expand proportionally with distance (current code)?

## PTU Rule Reference

- **p.343**: "Cone X — The Move hits all legal targets in the square immediately in front of the user and in 3m wide rows extending from that square up to X meters away."
- Accompanying Cone 2 diagram shows 1 cell at d=1, 3 cells at d=2 — consistent with BOTH interpretations for Cone 2.

## Current Behavior

Code uses `halfWidth = Math.floor(d / 2)`, giving expanding width:
- d=1: width=1, d=2: width=3, d=3: width=3, d=4: width=5

## Options

### Option A: Fixed 3-wide rows (literal PTU)
All rows beyond the first square are exactly 3 cells wide. Makes larger cones (Cone 4, Cone 6) look like narrow channels.

### Option B: Expanding width (current)
Width grows with distance. More visually cone-like. Matches common tabletop expectations. Diverges from literal "3m wide" text.

### Option C: The "3m wide" is a Cone 2 example, not universal
Treat the text as describing Cone 2 specifically. Larger cones expand proportionally.

## Blocking

Affects all Cone-type moves. Current behavior is functional.
