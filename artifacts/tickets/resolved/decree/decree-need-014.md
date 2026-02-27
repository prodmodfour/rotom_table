---
ticket_id: decree-need-014
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-014
domain: capture
topic: stuck-slow-capture-bonus
affected_files:
  - app/utils/captureRate.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Do Stuck and Slow get ONLY their special capture bonuses (+10/+5), or do they ALSO get the volatile condition +5 bonus on top?

## PTU Rule Reference

- **p.214**: "Persistent Conditions add +10 to the Pokemon's Capture Rate; Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5."
- **p.238**: Take a Breather cures "all Volatile Status effects AND the Slow and Stuck conditions" — treating Stuck/Slow as separate from Volatile.

The word "Additionally" could mean the Stuck/Slow bonuses stack ON TOP of their category bonus, or that they are separate independent bonuses (since Stuck/Slow are not classified as volatile).

## Current Behavior

`captureRate.ts`: Stuck and Slow are in `OTHER_CONDITIONS` (not VOLATILE). When encountered: Stuck gives ONLY +10, Slow gives ONLY +5. Neither gets the volatile +5.

## Options

### Option A: Separate bonuses only (current)
Stuck = +10, Slow = +5. They are not volatile conditions, so no volatile bonus.

### Option B: Stacking bonuses
Stuck = +10 (special) + +5 (volatile) = +15. Slow = +5 (special) + +5 (volatile) = +10. Treats "Additionally" as stacking.

## Blocking

Affects capture rate calculations when Stuck/Slow are present. Current behavior is functional.
