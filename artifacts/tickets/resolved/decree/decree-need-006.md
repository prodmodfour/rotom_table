---
ticket_id: decree-need-006
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-006
domain: combat
topic: initiative-speed-cs
affected_files:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/start.post.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should turn order update dynamically when Speed Combat Stages change mid-encounter (e.g., Paralysis, Agility)?

## PTU Rule Reference

- **p.227**: "In most situations, a Pokemon or Trainer's Initiative is simply their Speed Stat, though Items, Features, Moves, and other effects may modify this."
- **p.235**: "Combat Stages remain until the Pokemon or Trainer is switched out, or until the end of the encounter."

The rules say initiative IS the Speed Stat, and CS modifies the stat. But the rules never explicitly state whether initiative should be recalculated each round when Speed changes.

## Current Behavior

`combatant.service.ts` line 586-589: Initiative is calculated once at combatant creation from base speed. Turn order is set once at encounter start and never recalculated. Paralysis (-4 Speed CS) applied mid-combat does not change the combatant's position in initiative order.

## Options

### Option A: Static initiative (current)
Set once at encounter start, never changes. Simpler. Avoids re-sorting complexity. What about tie-break d20 rolls — do they carry over?

### Option B: Dynamic initiative
Recalculate turn order every round based on stage-modified Speed. More faithful to "Initiative is simply their Speed Stat."

### Option C: Hybrid
Recalculate initiative values but only re-sort at the start of each new round (not mid-round). Tie-breaks re-rolled if relative order changes.

## Blocking

Affects combats with Paralysis, speed-boosting moves, etc. Current behavior is functional.
