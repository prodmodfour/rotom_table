---
ticket_id: ptu-rule-105
ticket_type: ptu-rule
priority: P2
status: in-progress
domain: rest
topic: extended-rest-bound-ap
source: decree-016
affected_files:
  - app/server/api/characters/[id]/extended-rest.post.ts
created_at: 2026-02-26T18:00:00
---

## Summary

Extended rest should only clear Drained AP, not Bound AP. Fix `extended-rest.post.ts` to preserve bound AP.

## PTU Rule

"Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP." (p.252). "Bound AP remains off-limits until the binding effect ends."

## Current Behavior

`extended-rest.post.ts` lines 87-89 clear BOTH drained AND bound AP, then set current AP to full max.

## Required Behavior

1. Only clear `drainedAp` (set to 0)
2. Preserve `boundAp` value (do not modify)
3. Set current AP to `maxAp - boundAp` (not full max)
4. Bound AP can only be cleared by GM manually removing the binding effect

## Resolution Log

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-26 | 3e0dfd9 | fix: extended rest preserves Bound AP per decree-016 |

**Files modified (1):**
- `app/server/api/characters/[id]/extended-rest.post.ts` (only clear drainedAp, preserve boundAp, set currentAp to maxAp - boundAp)

## Notes

- Related: decree-016 establishes that rest types only grant explicitly listed effects
