---
decree_id: decree-004
status: active
domain: combat
topic: massive-damage-temp-hp
title: "Massive damage check uses real HP lost after temp HP absorption"
ruled_at: 2026-02-26T18:03:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-004
implementation_tickets: []
tags: [combat, massive-damage, temp-hp, injury]
---

# decree-004: Massive damage check uses real HP lost after temp HP absorption

## The Ambiguity

For the Massive Damage injury threshold (50%+ of max HP), should the check use total attack damage or only the portion that hit real HP after temp HP absorption?

Source: decree-need-004.

## Options Considered

### Option A: Total damage (before temp HP)
The attack "did" 80 damage regardless of temp HP. Temp HP doesn't prevent the injury. Harsher.

### Option B: HP damage only (current)
Only real HP lost counts toward the 50% threshold. Temp HP effectively shields from massive damage injuries. Rewards protective buffing strategies.

## Ruling

**The true master decrees: only real HP lost (after temp HP absorption) counts toward the massive damage threshold.**

Temp HP represents protective buffs (fairy shields, chef's cooking, cheerleader morale, root energy). These buffs narratively absorb part of the impact, reducing the effective blow to the Pokemon's body. If the shield takes most of the hit, the Pokemon didn't suffer a massive blow to their actual health.

## Precedent

Temp HP shields from massive damage injury checks. The massive damage threshold (50%+ max HP) is evaluated against real HP lost, not total incoming damage. Temp HP buffing strategies are mechanically rewarded.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: `app/server/services/combatant.service.ts`
- Skills affected: all combat reviewers (cite this decree for massive damage + temp HP interactions)
