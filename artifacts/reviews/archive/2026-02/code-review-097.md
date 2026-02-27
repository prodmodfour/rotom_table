---
review_id: code-review-097
target: refactoring-045
trigger: orchestrator-routed
reviewed_commits:
  - f127e53
  - ea438a3
  - e6a5bc5
verdict: APPROVED
reviewed_at: 2026-02-20
reviewer: senior-reviewer
---

## Scope

Three commits resolving refactoring-045 (N+1 query pattern in new-day and scene-activate AP updates). Two code commits and one docs commit.

## Findings

### 1. new-day.post.ts (commit f127e53) -- Grouping Logic

**Correct.** `calculateMaxAp(level)` depends only on `level`, so grouping by level is the right key. Characters at the same level receive the same `currentAp` value. The `Map<number, string[]>` type is appropriate.

The grouping loop uses `[...ids, char.id]` to build each array, which is immutable (new array each iteration). Minor allocation overhead per iteration, but negligible at TTRPG scale and consistent with project immutability rules.

### 2. new-day.post.ts -- Transaction and updateMany

**Correct.** `prisma.$transaction([...])` with an array of `PrismaPromise` objects is the documented batch transaction pattern. Each `updateMany` uses `where: { id: { in: ids } }` which correctly targets exactly the characters in that level group. The `data` block resets all five daily counters plus `currentAp` and `lastRestReset` -- identical to the original per-character update fields.

### 3. activate.post.ts (commit ea438a3) -- Composite Grouping Key

**Correct.** `calculateSceneEndAp(level, drainedAp)` depends on both `level` and `drainedAp`, so the composite key `${level}:${drainedAp}` is necessary and sufficient. Characters sharing both values will receive the same `restoredAp`. The string key avoids the need for a custom equality comparator on a Map.

Note: `calculateSceneEndAp` has a third parameter `boundAp` (default `0`). The original code called it with two arguments, and the refactored code does the same -- both rely on the default. This is correct because the endpoint explicitly sets `boundAp: 0` in the DB write, so passing `boundAp=0` to the calculation is the right semantic.

### 4. activate.post.ts -- Transaction Scope

Each active scene gets its own `$transaction` call inside the `for (const activeScene of activeScenes)` loop. This preserves the original behavior where each scene's characters are updated independently. The original code also operated per-scene with sequential awaits. A single outer transaction wrapping all scenes would be a further improvement but is out of scope for this ticket and does not affect correctness.

### 5. Behavior Preservation

Verified field-by-field:

**new-day:**
| Field | Before | After |
|---|---|---|
| `restMinutesToday` | `0` | `0` |
| `injuriesHealedToday` | `0` | `0` |
| `drainedAp` | `0` | `0` |
| `boundAp` | `0` | `0` |
| `currentAp` | `calculateMaxAp(char.level)` | `calculateMaxAp(level)` (same, grouped) |
| `lastRestReset` | `now` | `now` |

**activate (scene-end):**
| Field | Before | After |
|---|---|---|
| `boundAp` | `0` | `0` |
| `currentAp` | `calculateSceneEndAp(char.level, char.drainedAp)` | `restoredAp` (precomputed with same args, grouped) |

All fields match. No fields added or removed.

### 6. Resolution Log (commit e6a5bc5)

Ticket status updated from `open` to `resolved`. Resolution log documents both files, the grouping rationale, commit references, and behavior preservation notes. Complete and accurate.

### 7. Immutability

Both files use immutable patterns throughout: spread into new arrays (`[...ids, char.id]`, `[...existing.ids, char.id]`), spread into new objects (`{ ...existing, ids: [...] }`), and `Map` construction via iteration rather than mutation of external state. No violations.

## Verdict

**APPROVED.** Clean, focused refactoring that correctly replaces N+1 sequential updates with group-by-key batch `updateMany` inside transactions. Grouping keys match the calculation dependencies. Behavior is fully preserved. Immutability and code style are consistent with project standards. Resolution log is complete.
