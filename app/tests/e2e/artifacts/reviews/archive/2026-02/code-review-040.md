---
review_id: code-review-040
review_type: code
reviewer: senior-reviewer
trigger: ptu-rule-fix
target_report: ptu-rule-032
domain: healing
commits_reviewed:
  - a84e7fd
files_reviewed:
  - app/server/api/characters/[id]/heal-injury.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - healing-ap-drain-injury-001
reviewed_at: 2026-02-18T23:59:00
---

## Review Scope

Fix for ptu-rule-032: AP drain injury healing incorrectly reset `lastInjuryTime` to `new Date()`, destroying the natural healing 24h timer. Per PTU 1.05 p.252, the timer tracks injury **acquisition** ("24 hours without gaining any new injuries"), not healing. AP drain heals injuries at an AP cost — it should not affect the timer.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

## What Looks Good

- **Correct fix pattern.** Old: `lastInjuryTime: newInjuries > 0 ? new Date() : null` — unconditionally touched the timer on every AP drain heal. New: `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` — leaves the timer untouched unless all injuries are cleared (then nulls it). The conditional spread is idiomatic and clear.
- **Natural healing path correctly unchanged.** Line 118 still resets `lastInjuryTime` to `new Date()` after natural healing. This is correct game design — it enforces "one natural heal per 24h window." The daily cap of 3 applies across all methods (natural + AP drain), so the timer only rate-limits natural heals while AP drain is limited by its own AP cost.
- **Duplicate check verified.** Grepped all `lastInjuryTime` references in `server/`:
  - `pokemon/[id]/heal-injury.post.ts` — natural-only endpoint (no AP drain path for Pokemon). No issue.
  - `entity-update.service.ts:96` — only sets timer on injury **gain** (`injuryGained` flag). Correct.
  - `characters/[id]/pokemon-center.post.ts:78` and `pokemon/[id]/pokemon-center.post.ts:89` — preserve existing `lastInjuryTime` value, clear on 0. Correct.
  - `combatant.service.ts:444,495` — read-only serialization. No issue.
  - `pokemon-generator.service.ts:294` — initialization to null. Correct.
- **Minimal diff.** 1 insertion, 1 deletion, 1 file. Commit message accurately describes both the bug and the fix rationale.

## Verdict

APPROVED — The fix correctly preserves `lastInjuryTime` during AP drain healing while still clearing it when injuries reach 0. All parallel code paths verified clean. No issues found.

## Scenarios to Re-run

- **healing-ap-drain-injury-001:** Verify that AP drain healing preserves `lastInjuryTime` (Test 4 from the original scenario). Character with injuries=2 and lastInjuryTime=25h ago should retain that timestamp after AP drain, not have it reset to now.
