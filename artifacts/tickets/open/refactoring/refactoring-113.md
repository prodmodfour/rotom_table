---
ticket: refactoring-113
category: EXT-DEAD-CODE
priority: P3
severity: LOW
status: open
domain: combat
source: code-review-251 MED-001 + rules-review-227 M-1
created_by: slave-collector (plan-20260301-152500)
created_at: 2026-03-01
---

# refactoring-113: Wire or remove autoDeclineFaintedReactor in aoo-resolve.post.ts

## Summary

`autoDeclineFaintedReactor` is imported in `aoo-resolve.post.ts` (line 21) but never called. The function exists in `out-of-turn.service.ts` and is designed to auto-decline pending AoOs where the reactor has fainted, but it is not wired into any endpoint or lifecycle hook.

Currently, fainted reactor AoOs are caught by the CRIT-001 guard (reactor eligibility check at resolve time), so there is no correctness bug. However, the stale AoO prompt remains visible to the GM until they try to accept (rejected by the guard) or the round expires.

## Affected Files

- `app/server/api/encounter/aoo-resolve.post.ts` — dead import
- `app/server/services/out-of-turn.service.ts` — `autoDeclineFaintedReactor` function

## Suggested Fix

Either:
1. Wire `autoDeclineFaintedReactor` into the damage endpoint (after faint detection) so stale AoO prompts are proactively cleaned up, OR
2. Remove the dead import if the guard-at-resolve-time approach is sufficient

## Impact

- UX annoyance: GM sees stale AoO prompt for fainted reactor
- Dead code: unused import
- No correctness risk (guarded at resolve time)
