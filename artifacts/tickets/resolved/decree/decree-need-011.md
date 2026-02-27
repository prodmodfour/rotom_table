---
ticket_id: decree-need-011
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-011
domain: vtt
topic: mixed-terrain-speed-averaging
affected_files:
  - app/composables/useGridMovement.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should the app average movement speeds when a path crosses terrain boundaries (e.g., land to water)?

## PTU Rule Reference

- **p.231**: "When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value. For example, if a Pokemon has Overland 7 and Swim 5, they can shift a maximum of 6 meters on a turn that they use both Capabilities."

## Current Behavior

`useGridMovement.ts:getSpeed()` selects movement speed based on terrain at the combatant's starting position. If starting on land, Overland speed is used for the entire move. No terrain boundary detection or speed averaging. A Pokemon with Overland 7 and Swim 5 starting from water gets Swim 5 for the entire move, even if it immediately steps onto land.

## Options

### Option A: Implement path-based speed averaging
Detect terrain transitions along the A* path and average applicable speeds. Complex — requires path analysis before movement validation.

### Option B: Use minimum of relevant speeds
Conservative — always legal but overly restrictive. Simpler than averaging.

### Option C: Keep current behavior (starting terrain only)
Acceptable simplification. GM can manually adjust. Multiple past reviews (rules-review-067, 073, 075) flagged this as a known limitation.

### Option D: Use destination terrain speed
Still wrong in multi-terrain cases but less wrong than current in some scenarios.

## Blocking

Affects movement across terrain boundaries. Current behavior is functional but produces incorrect results at boundaries.
