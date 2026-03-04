---
ticket_id: ptu-rule-106
ticket_type: ptu-rule
priority: P2
status: in-progress
domain: rest
topic: extended-rest-duration
source: decree-018
affected_files:
  - app/server/api/characters/[id]/extended-rest.post.ts
  - app/server/api/pokemon/[id]/extended-rest.post.ts
created_at: 2026-02-26T18:00:00
---

## Summary

Add duration parameter to extended rest endpoint for scalable healing (4-8 hours).

## PTU Rule

"Extended Rests are rests that are at least 4 continuous hours long." (p.252). "For the first 8 hours of rest each day... a continuous half hour resting heal 1/16th of their Maximum Hit Points."

## Current Behavior

`extended-rest.post.ts` always applies exactly 8 rest periods (4 hours). No duration parameter.

## Required Behavior

1. Accept optional `duration` parameter (hours, min 4, max 8)
2. Default to 4 hours if not specified (preserve current behavior)
3. Calculate rest periods: `floor(duration / 0.5)` — each heals 1/16th max HP
4. Account for `restMinutesToday` to respect 8h daily cap
5. Update `restMinutesToday` by adding the duration

## Resolution Log

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-26 | 81c2b02 | feat: add duration parameter to character extended rest endpoint |
| 2026-02-26 | 46be3bf | feat: add duration parameter to Pokemon extended rest endpoint |
| 2026-02-26 | 1835cf6 | feat: add duration parameter to extendedRest composable |
| 2026-02-26 | b2bce27 | feat: add duration input to extended rest UI in HealingTab |

**Files modified (4):**
- `app/server/api/characters/[id]/extended-rest.post.ts` (accept duration body param 4-8h, dynamic rest periods)
- `app/server/api/pokemon/[id]/extended-rest.post.ts` (same — accept duration body param 4-8h)
- `app/composables/useRestHealing.ts` (pass duration to endpoint)
- `app/components/common/HealingTab.vue` (number input for duration, updated descriptions)

## Notes

- Client UI needs a duration input (slider or number input, default 4h)
- Related: decree-018, decree-016 (bound AP handling during extended rest)
