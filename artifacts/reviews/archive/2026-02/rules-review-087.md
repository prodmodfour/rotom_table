---
review_id: rules-review-087
target: refactoring-045
trigger: orchestrator-routed
reviewed_commits:
  - f127e53
  - ea438a3
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## Rules Review: refactoring-045 (N+1 Query Batch Optimization)

### Scope

Two commits converting per-character sequential DB updates to batched `updateMany` calls inside transactions. The refactoring must not change any PTU game logic -- the AP values computed for each character must be identical before and after.

- **`f127e53`**: `app/server/api/game/new-day.post.ts` -- group characters by level, batch `updateMany` per level group.
- **`ea438a3`**: `app/server/api/scenes/[id]/activate.post.ts` -- group characters by `(level, drainedAp)`, batch `updateMany` per composite-key group.

### PTU Reference

**AP formula** (PTU Core p221): Trainers have 5 AP + 1 more for every 5 Trainer Levels.

```
calculateMaxAp(level) = 5 + Math.floor(level / 5)
```

**Scene-end AP** (PTU Core p221): AP is completely regained at the end of each Scene. Drained AP remains unavailable until Extended Rest. Bound AP is cleared at scene end.

```
calculateSceneEndAp(level, drainedAp, boundAp = 0)
  = calculateAvailableAp(calculateMaxAp(level), boundAp, drainedAp)
  = Math.max(0, maxAp - boundAp - drainedAp)
```

**New-day reset**: All daily counters reset. Drained AP and bound AP are both cleared. `currentAp` is set to full `calculateMaxAp(level)`.

### Verification 1: new-day.post.ts (commit f127e53)

#### Grouping correctness

The new code groups characters by `level` alone:

```typescript
const charactersByLevel = new Map<number, string[]>()
for (const char of characters) {
  const ids = charactersByLevel.get(char.level) || []
  charactersByLevel.set(char.level, [...ids, char.id])
}
```

This is correct because `calculateMaxAp(level)` depends only on `level`. All characters at the same level will receive the same `currentAp` value. No other field in the `data` payload varies per character -- `restMinutesToday`, `injuriesHealedToday`, `drainedAp`, `boundAp`, and `lastRestReset` are all set to the same constant values for every character.

#### Data payload equivalence

| Field | Before (per-character) | After (per-level-group) | Match? |
|-------|----------------------|------------------------|--------|
| `restMinutesToday` | `0` | `0` | Yes |
| `injuriesHealedToday` | `0` | `0` | Yes |
| `drainedAp` | `0` | `0` | Yes |
| `boundAp` | `0` | `0` | Yes |
| `currentAp` | `calculateMaxAp(char.level)` | `calculateMaxAp(level)` | Yes (same level) |
| `lastRestReset` | `now` | `now` | Yes |

No formula changes. The `calculateMaxAp` function is not modified in either commit.

#### Edge cases

- **Empty character set**: `charactersByLevel` will be empty, `[...charactersByLevel.entries()]` yields `[]`, transaction with zero operations is a no-op. Original loop was also a no-op. Equivalent.
- **Single character**: One group with one ID. `updateMany` with `where: { id: { in: [singleId] } }` is functionally identical to `update({ where: { id: singleId } })`. Equivalent.

### Verification 2: scenes/[id]/activate.post.ts (commit ea438a3)

#### Grouping correctness

The new code groups characters by `(level, drainedAp)` composite key:

```typescript
const groupKey = (level: number, drainedAp: number) => `${level}:${drainedAp}`
```

This is correct because `calculateSceneEndAp(level, drainedAp)` depends on exactly these two fields. Characters sharing the same `(level, drainedAp)` pair will get the same `restoredAp` value. The string key format `"level:drainedAp"` is unambiguous since both values are integers (no collision risk from string concatenation).

#### boundAp parameter

Both old and new code call `calculateSceneEndAp(char.level, char.drainedAp)` with two arguments. The function signature is `calculateSceneEndAp(level, drainedAp, boundAp = 0)`, so `boundAp` defaults to `0`. This is intentionally correct: the DB update separately sets `boundAp: 0`, so the restored AP should reflect cleared bound AP. No change in behavior.

#### Data payload equivalence

| Field | Before (per-character) | After (per-group) | Match? |
|-------|----------------------|-------------------|--------|
| `boundAp` | `0` | `0` | Yes |
| `currentAp` | `calculateSceneEndAp(char.level, char.drainedAp)` | `restoredAp` (precomputed from same args) | Yes |

The `restoredAp` is computed once per group via `calculateSceneEndAp(char.level, char.drainedAp)` using the first character encountered in that group. Since all characters in the group share the same `level` and `drainedAp`, the result is identical to computing it individually for each.

#### Edge cases

- **Empty character set**: `dbCharacters` is empty, `groups` map is empty, transaction with zero operations is a no-op. Original loop was also a no-op. Equivalent.
- **All characters unique**: Each character gets its own group (G = N). The transaction executes N `updateMany` calls, each targeting one ID. Functionally identical to N individual `update` calls. Equivalent.

### Formula Integrity Check

Neither commit modifies `app/utils/restHealing.ts`. The functions `calculateMaxAp`, `calculateSceneEndAp`, and `calculateAvailableAp` are unchanged. The formulas remain:

- `calculateMaxAp(level) = 5 + Math.floor(level / 5)` -- matches PTU Core p221
- `calculateSceneEndAp(level, drainedAp) = Math.max(0, (5 + Math.floor(level / 5)) - drainedAp)` -- matches PTU Core p221
- No new game logic was introduced in either endpoint

### Verdict

**PASS** -- Both commits are pure performance refactorings with no behavioral change. The grouping keys are mathematically correct: `calculateMaxAp` depends only on `level`, and `calculateSceneEndAp` depends only on `level` and `drainedAp`. Every character receives exactly the same AP value it would have received under the original sequential approach. No PTU formulas were modified or introduced.
