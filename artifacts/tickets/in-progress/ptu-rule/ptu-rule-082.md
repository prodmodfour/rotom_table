---
ticket_id: ptu-rule-082
priority: P4
status: in-progress
domain: pokemon-lifecycle
source: rules-review-118 (MEDIUM observation)
created_by: slave-collector (plan-20260221-215717)
---

## Summary

Pokemon maxHp is not recalculated when a Pokemon levels up via XP distribution or manual add-experience. The level component of the PTU HP formula (`Level + HP*3 + 10`) increases by 1 per level gained, but neither `xp-distribute.post.ts` nor `add-experience.post.ts` updates `maxHp` in the database.

## Expected Behavior (PTU Rules)

Per PTU Core p.198: "Pokemon Hit Points = Pokemon Level + (HP x 3) + 10". When a Pokemon gains N levels, maxHp should increase by at least N (the level component), even before stat points are manually allocated.

## Actual Behavior

Both XP endpoints update `level`, `experience`, and `tutorPoints` but leave `maxHp` unchanged. A Pokemon going from Level 5 to Level 8 retains the Level 5 maxHp until the GM manually updates the Pokemon sheet.

## Affected Files

- `app/server/api/encounters/[id]/xp-distribute.post.ts` — bulk XP distribution endpoint
- `app/server/api/pokemon/[id]/add-experience.post.ts` — standalone XP grant endpoint

## Suggested Fix

After computing `levelResult`, if `levelResult.levelsGained > 0`, update maxHp:
```typescript
maxHp: pokemon.maxHp + levelResult.levelsGained
```

This applies only the level component of the HP formula. The HP stat component (`hpStat * 3`) changes only when the GM allocates stat points, which remains a manual operation.

## Impact

Low urgency — the GM can manually update maxHp after leveling. But it causes a correctness gap where displayed HP is wrong between XP distribution and manual sheet update.

## Resolution Log

- **edae0b5** — `fix: update maxHp when Pokemon levels up via XP endpoints`
  - `app/server/api/encounters/[id]/xp-distribute.post.ts` — Added `maxHp` to Prisma select; increments `maxHp` by `levelsGained` when > 0
  - `app/server/api/pokemon/[id]/add-experience.post.ts` — Added `maxHp` to Prisma select; increments `maxHp` by `levelsGained` when > 0
  - Duplicate code path check: Only two automated level-up paths exist (xp-distribute, add-experience). Manual PUT `/api/pokemon/:id` allows direct maxHp/level editing by GM — no change needed there.

## Notes

This is a pre-existing design decision from P0 (approved in rules-review-109). The `add-experience.post.ts` endpoint (P2) correctly follows the same pattern, so this is not a regression. Filed for tracking and future improvement.
