---
ticket_id: decree-need-004
ticket_type: decree-need
priority: P0
status: addressed
decree_id: decree-004
domain: combat
topic: massive-damage-temp-hp
affected_files:
  - app/server/services/combatant.service.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

For the Massive Damage injury threshold (50%+ of max HP), should the check use total attack damage or only the portion that hit real HP after temp HP absorption?

## PTU Rule Reference

- **p.250 lines 1843-1848**: "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points."
- **p.247 lines 1653-1656**: "Temporary Hit Points are always lost first from damage. Damage carries over directly to real Hit Points once the Temporary Hit Points are lost."

The word "damage" is ambiguous — does it mean the total damage of the attack, or the actual HP lost after temp HP cushion?

## Current Behavior

`combatant.service.ts` lines 95-112: Only HP damage (after temp HP absorption) counts toward the 50% check. Example: Pokemon with 100 max HP and 40 temp HP takes 80 damage. Temp HP absorbs 40, leaving 40 real HP damage. Since 40 < 50 (50%), no massive damage injury.

## Options

### Option A: Total damage (before temp HP)
The attack "did" 80 damage regardless of temp HP. 80 >= 50, so massive damage triggers. Temp HP doesn't prevent the injury.

### Option B: HP damage only (current)
Temp HP "prevented" part of the damage. Only 40 real HP lost, so no massive damage. More protective.

### Option C: Raw input damage from attacker
Use the attacker's damage roll directly, before any reduction.

## Blocking

Affects any combat involving temp HP + high damage. Current behavior is functional.
