---
review_id: code-review-042
review_type: code
reviewer: senior-reviewer
trigger: ptu-rule-fix
target_report: ptu-rule-034, ptu-rule-035
domain: healing
commits_reviewed:
  - 658f0fa
  - 5198d2e
files_reviewed:
  - app/server/api/characters/[id]/heal-injury.post.ts
  - app/server/api/pokemon/[id]/heal-injury.post.ts
  - app/server/api/characters/[id]/pokemon-center.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun:
  - healing-natural-injury-timer-001
  - healing-pokemon-center-time-001
  - healing-ap-drain-injury-001
reviewed_at: 2026-02-18T16:15:00
---

## Review Scope

Two PTU rule fixes in the healing domain:

1. **ptu-rule-034** (commit `658f0fa`): Natural injury healing incorrectly reset `lastInjuryTime` to `new Date()` after each heal, enforcing a 24h cooldown between heals. PTU says the 24h timer tracks when injuries are *gained*, not *healed*. Fix: stop touching `lastInjuryTime` during natural healing (only clear to `null` when injuries reach 0).

2. **ptu-rule-035** (commit `5198d2e`): Character Pokemon Center endpoint unconditionally restored drained AP (`drainedAp: 0`), but PTU says drained AP is an Extended Rest benefit (4+ continuous hours). Fix: only restore AP when `totalTime >= 240` minutes.

## Issues

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

## What Looks Good

**ptu-rule-034:**
- **Correct fix in both endpoints.** Both `characters/[id]/heal-injury.post.ts:119` and `pokemon/[id]/heal-injury.post.ts:83` now use the spread conditional `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` — matching the drain_ap path pattern (line 76) that was already correct since `a84e7fd`.
- **Consistent with injury-gain path.** `entity-update.service.ts:96` sets `lastInjuryTime` only when `injuryGained === true`. The natural healing path now correctly leaves the timer alone, so the two paths are complementary: gain sets the timer, heal ignores it, and reaching 0 injuries clears it.
- **Verified all `lastInjuryTime` references.** Grepped across `server/api/` — all 13 references are consistent: gains set the timer, Pokemon Center preserves it (`character.lastInjuryTime`), natural heal and drain_ap clear on zero, and GET endpoints expose it read-only.

**ptu-rule-035:**
- **Threshold math is sound.** `calculatePokemonCenterTime()` returns `totalTime` in minutes. With < 5 injuries: max is 180 min (4 injuries × 30 + 60 base). With 5+ injuries: min is 360 min (5 × 60 + 60). The 240-minute threshold falls cleanly in the gap between 180 and 360 — no edge-case ambiguity.
- **Spread conditional is the right pattern.** `...(meetsExtendedRest ? { drainedAp: 0 } : {})` doesn't touch the field at all for short visits, avoiding accidental overwrites. Cleaner than `drainedAp: meetsExtendedRest ? 0 : character.drainedAp`.
- **Response data is backwards-compatible.** `apRestored` is still present in the response (set to `0` for short visits), so any client-side display continues to work without changes.
- **Pokemon endpoint confirmed clean.** `pokemon/[id]/pokemon-center.post.ts` has no `drainedAp` field — Pokemon don't have AP in PTU. No change needed there.
- **JSDoc header updated.** Comment now reads "Drained AP restored (only if healing time >= 4 hours, i.e. Extended Rest)" — accurate and helpful for future developers.
- **No double-restore risk.** `extended-rest.post.ts` and `pokemon-center.post.ts` are independent call paths. The conditional in Pokemon Center doesn't conflict with the Extended Rest endpoint.

**Both commits:**
- Minimal, focused diffs — each commit touches only the files described in the ticket.
- Commit messages are descriptive and reference the PTU rule being corrected.
- Fix logs in both tickets are thorough and document the pattern used.

## Verdict

APPROVED — Both fixes are correct, minimal, and consistent with existing patterns. The natural healing timer fix aligns with the injury-gain path in `entity-update.service.ts`. The Pokemon Center AP fix correctly gates restoration on the Extended Rest time threshold. No regressions introduced.

## Scenarios to Re-run

- `healing-natural-injury-timer-001` — verify chain-healing multiple injuries without 24h cooldown between heals
- `healing-pokemon-center-time-001` — verify AP restoration is conditional on visit duration
- `healing-ap-drain-injury-001` — regression check on AP drain path (which shares the `lastInjuryTime` clear pattern)
