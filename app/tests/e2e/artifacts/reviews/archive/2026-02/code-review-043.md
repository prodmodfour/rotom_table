---
review_id: code-review-043
review_type: code
reviewer: senior-reviewer
trigger: ptu-rule-fix
target_report: ptu-rule-038
domain: healing
commits_reviewed:
  - 8d07eee
files_reviewed:
  - app/server/api/characters/[id]/pokemon-center.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - healing-pokemon-center-time-001
  - healing-workflow-pokemon-center-full-heal-001
reviewed_at: 2026-02-18T17:00:00
follows_up: code-review-042
---

## Review Scope

Follow-up fix for ptu-rule-038, spawned by rules-review-039 which found that commit `5198d2e` (ptu-rule-035) still conditionally restored drained AP when Pokemon Center healing time exceeded 4 hours. The Game Logic Reviewer ruled that Pokemon Centers and Extended Rests are separate PTU mechanics — Pokemon Centers never restore drained AP regardless of visit duration.

Commit `8d07eee` removes all AP restoration logic from the character Pokemon Center endpoint.

## Cross-verification performed

- **`pokemon/[id]/pokemon-center.post.ts`:** Confirmed clean — no `drainedAp` or `apRestored` logic. Pokemon don't have AP in PTU.
- **`characters/[id]/extended-rest.post.ts:74,84`:** Still correctly restores AP (`apRestored = character.drainedAp`, `drainedAp: 0`). This is the proper and only place for AP restoration per PTU.
- **Grep for `drainedAp` across `server/api/`:** Only present in game/new-day (reset), characters GET (expose), heal-injury (drain 2 AP), character new-day (reset), and extended-rest (restore). No residual AP logic in any Pokemon Center context.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

## What Looks Good

- **Exact match to ticket requirements.** The fix removes precisely the three things ptu-rule-038 asked for: `meetsExtendedRest` variable, `apRestored` calculation, and conditional `drainedAp: 0` spread from the DB update.
- **Backwards-compatible response shape.** `apRestored: 0` hardcoded in the response preserves the field for any client-side consumers without lying about what happened.
- **JSDoc updated.** Comment now explicitly notes "Pokemon Centers do NOT restore drained AP" — prevents future developers from re-introducing this.
- **Minimal diff.** 7 lines removed, 2 lines changed (JSDoc + response field). No unrelated changes. No behavior changes mixed in.
- **Fix log in ticket is thorough.** Documents what was changed, what was verified, and which files were affected.

## Verdict

APPROVED — The fix exactly addresses what rules-review-039 and ptu-rule-038 required. All AP restoration logic is removed from the Pokemon Center endpoint. The Extended Rest endpoint remains the sole AP restoration path, which is correct per PTU. No regressions introduced.

## Scenarios to Re-run

- `healing-pokemon-center-time-001`: Verify AP is never restored regardless of Pokemon Center visit duration (previously tested conditional restoration at 4+ hours).
- `healing-workflow-pokemon-center-full-heal-001`: Expected values are now stale — scenario asserts `apRestored = 2` and `drainedAp 2 -> 0` (line 106 of scenario, line 15 of verification). Both should now expect `apRestored = 0` and `drainedAp` unchanged by the Pokemon Center visit.
