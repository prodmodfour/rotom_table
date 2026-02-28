---
id: decree-need-029
title: "New Day: should bound AP reset at the start of a new game day?"
priority: P2
severity: HIGH
category: decree-need
source: healing audit A2 (plan-20260228-072000 slave-3) + bug-038 ambiguity note (plan-20260228-093200 slave-1)
created_by: slave-collector (plan-20260228-093200)
created_at: 2026-02-28
---

## Summary

Bug-038 fixed the new-day endpoint to **preserve** boundAp (not reset it to 0), based on decree-016 ("Bound AP persists until the binding effect ends") and decree-019 ("New Day is a pure counter reset"). However, the dev explicitly flagged this as an ambiguity: does a new game day implicitly end all binding effects from the previous day?

## The Ambiguity

Decree-016 says bound AP persists "until the binding effect ends." Decree-019 says New Day resets daily counters (drainedAp, restMinutesToday, injuriesHealedToday). The tension: is boundAp a daily counter that expires overnight, or a persistent effect that only the GM explicitly clears?

## Interpretations

**A) Bound AP persists across days (current implementation):**
Decree-016 is explicit — bound AP persists until the binding effect ends. A new day is not an implicit "end all effects" trigger. The GM must manually clear bound AP when the binding effect narratively ends. This is the strict reading of both decrees.

**B) Bound AP resets on New Day:**
In practice, binding effects (e.g., a move that costs AP to maintain) typically last for a scene or encounter, not across game days. By the time the GM advances the day, any binding effects from yesterday are long over. Resetting boundAp on New Day is a reasonable convenience that matches tabletop play.

## Current State

The bug-038 fix (commits 68325a5, 65b4c96) implemented Interpretation A. The code now preserves boundAp and subtracts it from the restored currentAp on New Day. If the ruling is Interpretation B, the fix should be partially reverted.

## Affected Code

- `app/server/api/game/new-day.post.ts` — global new-day reset
- `app/server/api/characters/[id]/new-day.post.ts` — per-character new-day reset

## Related Decrees

- decree-016: Extended rest clears only Drained AP, not Bound AP
- decree-019: New Day is a pure counter reset

## Impact

Medium — affects AP restoration on day boundaries. If a GM forgets to manually clear boundAp, characters could have permanently reduced AP pools.
