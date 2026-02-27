---
ticket_id: decree-need-001
ticket_type: decree-need
priority: P0
status: addressed
decree_id: decree-001
domain: combat
topic: minimum-damage-floor
affected_files:
  - app/utils/damageCalculation.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Where should the "minimum 1 damage" floor apply in the damage pipeline?

## PTU Rule Reference

- **p.236 lines 774-787**: "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0."
- **p.236 lines 837-847**: Formal damage steps: (7) subtract defense + DR, (8) apply weakness/resistance multipliers, (9) subtract from HP.

The prose says minimum 1 applies when "Defense Stats would reduce it to 0" — placing it at step 7 (after defense, before type effectiveness). No explicit mention of a floor after type effectiveness.

## Current Behavior

`damageCalculation.ts` applies TWO minimum-1 floors:
1. Line 283: `Math.max(1, subtotalBeforeDefense - effectiveDefense - dr)` — after defense (step 7)
2. Line 294: Final minimum-1 clamp after type effectiveness (step 8)

This means even a doubly-resisted (x0.25) attack that barely survived defense still deals 1 damage. A Normal-type move against Rock/Steel would always deal at least 1.

## Options

### Option A: Minimum 1 after defense only
Type effectiveness CAN reduce to 0. Only immunity = 0 damage. A resisted attack after defense could deal 0.

### Option B: Minimum 1 at the very end (current code)
If you're not immune, you always deal at least 1. More forgiving for attackers.

### Option C: Remove the step-7 floor, keep only the final floor
Type effectiveness applies to the raw (possibly 0) post-defense value, then floor to 1. Slightly different math than B in edge cases.

## Blocking

Affects every damage calculation in the app. Current behavior (Option B) is functional.
