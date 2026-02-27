---
review_id: code-review-002
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-001
domain: combat
commits_reviewed:
  - 72df77b
  - 84b9f6c
  - b9dfed7
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/move.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - combat-workflow-faint-replacement-001
reviewed_at: 2026-02-16T06:00:00
---

## Review Scope

Fix for bug-001: When a Pokemon fainted (HP reached 0), the "Fainted" status was appended to `statusConditions` without clearing pre-existing statuses. PTU p248 requires all Persistent and Volatile status conditions to be cleared on faint.

Three commits reviewed: core fix (72df77b), guard simplification (84b9f6c), and `move.post.ts` pipeline adoption (b9dfed7).

## Issues

### CRITICAL

(none)

### HIGH

(none)

### MEDIUM

(none)

### Informational

1. **`move.post.ts` doesn't track defeated enemies for XP** — `move.post.ts:107-113`

   `damage.post.ts:54-63` pushes fainted enemies to the `defeatedEnemies` array for XP tracking. `move.post.ts` does not — it saves the encounter directly via `prisma.encounter.update` without updating `defeatedEnemies`. If a move kills an enemy, the faint is tracked correctly in status and HP, but the enemy is not recorded for XP.

   **Pre-existing** — this gap existed before the fix. Not introduced by these commits. Now that `move.post.ts` correctly detects faints via the damage pipeline, adding defeated enemy tracking would be straightforward.

## What Looks Good

- **Core fix is minimal and correct** (72df77b): `entity.statusConditions = ['Fainted']` replaces the entire array, clearing all prior statuses. Directly implements PTU p248.

- **Guard simplification** (84b9f6c): Removing the `!includes('Fainted')` check is correct — the assignment is idempotent. The old guard was dead logic since the new assignment wipes the array regardless.

- **Pipeline adoption in `move.post.ts`** (b9dfed7): The old code did `Math.max(0, currentHp - damage)` and only synced `currentHp` to the database — missing temp HP absorption, massive damage injuries, and faint detection entirely. The fix uses `calculateDamage()` → `applyDamageToEntity()` → `syncDamageToDatabase()`, matching the established pattern in `damage.post.ts`.

- **Both damage code paths now use the pipeline**: `damage.post.ts` was already correct. `move.post.ts` is now aligned. No other server endpoints apply combat damage (confirmed via grep for `currentHp` mutations across `app/server/api/`).

- **Commit granularity**: Three focused commits with clear messages. Each produces a working intermediate state.

## Verdict

APPROVED — All three commits are correct. The core fix addresses the exact bug (statuses not cleared on faint). The pipeline adoption in `move.post.ts` prevents the same class of bug from occurring through the move execution path. No correctness, security, or performance issues found.

## Scenarios to Re-run

- `combat-workflow-faint-replacement-001`: Directly tests the fix — assertion #8 verifies that "Burned" is cleared when Caterpie faints.
