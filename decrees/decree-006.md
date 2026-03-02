---
decree_id: decree-006
status: active
domain: combat
topic: initiative-speed-cs
title: "Dynamically reorder initiative on speed changes without granting extra turns"
ruled_at: 2026-02-26T18:05:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-006
implementation_tickets: [ptu-rule-099]
tags: [combat, initiative, speed, combat-stages, turn-order]
---

# decree-006: Dynamically reorder initiative on speed changes without granting extra turns

## The Ambiguity

Should turn order update dynamically when Speed Combat Stages change mid-encounter (e.g., Paralysis, Agility)?

Source: decree-need-006.

## Options Considered

### Option A: Static initiative (current)
Set once, never changes. Simple but inaccurate after speed changes.

### Option B: Dynamic initiative
Recalculate every round. Faithful but potentially confusing.

### Option C: Hybrid
Recalculate at round start only.

## Ruling

**The true master decrees: dynamically reorder initiative when Speed combat stages change, but never grant extra turns due to reordering.**

When a Speed CS change occurs (Paralysis, Agility, stat stage moves, etc.), immediately recalculate initiative values for all combatants and re-sort the remaining turn order. Combatants who have already acted this round retain their "acted" flag — reordering cannot give them a second turn. Combatants who haven't acted yet are re-sorted by updated initiative among the remaining slots.

## Precedent

Initiative is always based on current CS-modified Speed. Re-sorting happens immediately on speed change. The "acted this round" flag prevents double-turns. This applies to any effect that changes Speed CS mid-round.

## Implementation Impact

- Tickets created: ptu-rule-099 (dynamic initiative reorder on speed CS change)
- Files affected: `app/server/services/combatant.service.ts`, `app/server/api/encounters/[id]/start.post.ts`, `app/server/api/encounters/[id]/next-turn.post.ts`
- Skills affected: all combat reviewers, initiative/turn-order developers
