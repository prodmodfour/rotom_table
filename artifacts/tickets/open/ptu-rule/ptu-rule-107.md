---
ticket_id: ptu-rule-107
ticket_type: ptu-rule
priority: P2
status: open
domain: combat
topic: league-battle-trainer-phases
source: decree-021
affected_files:
  - app/types/combat.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
created_at: 2026-02-26T18:00:00
---

## Summary

Implement the two-phase trainer system for League Battles: declare (low-to-high speed) then resolve (high-to-low speed).

## PTU Rule

"In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed." (p.227)

## Current Behavior

`combat.ts` defines `trainer_declaration | trainer_resolution | pokemon` phases, but `start.post.ts` only sets up declaration + pokemon. `next-turn.post.ts` skips resolution entirely.

## Required Behavior

1. In League Battle mode, after all trainers declare (low-to-high speed), transition to `trainer_resolution` phase
2. During resolution, process trainers in high-to-low speed order
3. Each trainer's declared action is executed during resolution
4. After all resolutions complete, transition to `pokemon` phase
5. UI must show declarations to all players during resolution phase (the strategic information advantage)

## Notes

- The `trainer_resolution` type already exists in `combat.ts` — needs to be connected
- Related: decree-006 (dynamic initiative with speed CS changes), decree-021
