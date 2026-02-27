---
ticket_id: decree-need-020
ticket_type: decree-need
priority: P2
status: addressed
decree_id: decree-020
domain: rest
topic: pokemon-center-injury-time
affected_files:
  - app/utils/restHealing.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should Pokemon Center healing time be calculated from the pre-healing or post-healing injury count?

## PTU Rule Reference

- **p.252**: "For each Injury on the Trainer or Pokemon, Healing takes an additional 30 minutes. If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead."

"For each Injury ON the Trainer or Pokemon" — doesn't specify when in the process the count is evaluated.

## Current Behavior

`restHealing.ts:calculatePokemonCenterTime()`: Uses the injury count at time of arrival (pre-healing). A Pokemon with 4 injuries: base 1h + 4*30min = 3h total. After healing, it may have only 1 injury remaining, but the time reflects the original 4.

## Options

### Option A: Pre-healing count (current)
The injuries cause the delay — the healing process takes longer because of the injuries being treated. Narratively sensible.

### Option B: Post-healing count
Only remaining injuries determine recovery time. A Pokemon with 4 injuries healed to 1 would take 1h + 30min.

## Blocking

Affects Pokemon Center time display only. Current behavior is functional.
