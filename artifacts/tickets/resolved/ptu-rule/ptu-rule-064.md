---
ticket_id: ptu-rule-064
type: ptu-rule
priority: P3
status: resolved
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-19
domain: character-lifecycle
severity: MEDIUM
affected_files:
  - app/server/api/encounter-templates/from-encounter.post.ts
  - app/server/api/encounter-templates/[id]/load.post.ts
---

## Summary

Encounter template save/load fallback defaults for HP stat use `0` instead of the PTU starting value of `10`. Other stats default to `5`, which is correct per PTU, but the HP default is inconsistent.

## PTU Rule Reference

`core/02-character-creation.md`, line 473:
> Level 1 Trainers begin with 10 HP and 5 in each of their other Stats.

## Expected Behavior

Fallback defaults should match PTU starting trainer stats:
- HP: **10**
- Attack, Defense, Special Attack, Special Defense, Speed: **5**

## Current Behavior

Save endpoint (`from-encounter.post.ts` line 68) fallback:
```javascript
stats: c.entity.stats ?? { hp: 0, attack: 0, defense: 5, specialAttack: 0, specialDefense: 5, speed: 5 }
```

Load endpoint (`load.post.ts` line 85) fallback:
```javascript
const hpStat = tc.entityData?.stats?.hp ?? 0
```

Note: The save endpoint also defaults Attack and Special Attack to `0` instead of `5`. These don't affect HP computation but are also incorrect per PTU starting values.

## Impact

When the fallback triggers (no `stats` property on entity), a Level 5 trainer gets `maxHp = 20` instead of the correct `maxHp = 50`. In practice, this only triggers for data corruption cases since the fix in commit `98287f5` now persists real stats. However, the fallback should be defensively correct.

## Recommended Fix

```javascript
// Save endpoint:
stats: c.entity.stats ?? { hp: 10, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }

// Load endpoint:
const hpStat = tc.entityData?.stats?.hp ?? 10
```

## Discovery Context

Found during rules-review-053 while reviewing bug-024 fix (commit `98287f5`). Pre-existing issue partially introduced by the same commit (the `?? 0` fallback is new code, but the save endpoint fallback was added in the same commit).

## Resolution Log

- **2026-02-20**: Fixed both fallback defaults. Save endpoint (`from-encounter.post.ts` line 68) now uses `{ hp: 10, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }`. Load endpoint (`load.post.ts` line 84) now uses `?? 10` for HP fallback. Searched entire server codebase for similar patterns; the only other `hp: 0` occurrence is in `pokemon-generator.service.ts` which is an accumulator initialization (correct). All 529 unit tests pass. Commit: `e2644c6`.
- **Resolved:** 2026-02-20 — Both Senior Reviewer and Game Logic Reviewer approved.
