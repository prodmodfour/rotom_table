---
ticket_id: decree-need-021
ticket_type: decree-need
priority: P2
status: addressed
decree_id: decree-021
domain: combat
topic: league-battle-trainer-phases
affected_files:
  - app/types/combat.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should League Battle mode implement the two-phase trainer system (declare low-to-high, resolve high-to-low)?

## PTU Rule Reference

- **p.227**: "In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed. This allows quicker Trainers to react to their opponent's switches and tactics."

## Current Behavior

`combat.ts` defines three phases: `'trainer_declaration' | 'trainer_resolution' | 'pokemon'`. However, `start.post.ts` only sets up `trainer_declaration` and `pokemon` phases. The `next-turn.post.ts` handler transitions directly from `trainer_declaration` to `pokemon`, skipping `trainer_resolution`. The type exists but the feature is unimplemented.

## Options

### Option A: Combined phase (current)
One pass through trainers in low-to-high speed. Simple but doesn't allow fastest trainer to react to slower trainers' declarations.

### Option B: True two-phase implementation
First pass: trainers declare (no execution). Second pass: resolve in high-to-low speed. Uses the existing `trainer_resolution` type.

### Option C: GM-mediated
Process trainers in declaration order. GM manually handles resolution ordering by adjusting actions after all declarations are in.

## Blocking

Affects League Battle mode specifically. Current behavior works but doesn't match the PTU two-phase system.
