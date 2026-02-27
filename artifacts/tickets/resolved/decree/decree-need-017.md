---
ticket_id: decree-need-017
ticket_type: decree-need
priority: P2
status: addressed
decree_id: decree-017
domain: rest
topic: pokemon-center-full-health
affected_files:
  - app/server/api/pokemon/[id]/pokemon-center.post.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Does Pokemon Center "full health" mean real max HP or injury-reduced effective max HP?

## PTU Rule Reference

- **p.252**: "In a mere hour, Pokemon Centers can heal a Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."
- **p.250**: Injury rules cap ALL healing at the injury-reduced effective max.

"Full health" could mean the real maximum, but the injury rules say healing is universally capped.

## Current Behavior

`pokemon-center.post.ts`: Heals injuries first (up to 3/day), then heals HP to effective max of remaining injuries. Respects the injury cap.

## Options

### Option A: Heal to effective max (current)
Respects injury cap as a universal rule. If 2 injuries remain after healing 3, HP caps at effective max.

### Option B: Heal to real max HP
Pokemon Center's advanced machinery overrides the injury cap for HP (injuries still remain as mechanical penalties). "Full health" = full HP regardless.

## Blocking

Affects Pokemon Center healing with remaining injuries. Current behavior is functional.
