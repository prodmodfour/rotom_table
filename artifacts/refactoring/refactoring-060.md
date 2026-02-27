---
ticket_id: refactoring-060
priority: P4
status: in-progress
category: TEST-COVERAGE
source: code-review-122 (MEDIUM-001)
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

The generate endpoint's count clamping logic (`Math.min(Math.max(1, ...), MAX_SPAWN_COUNT)`) in `app/server/api/encounter-tables/[id]/generate.post.ts:25-28` is untested. Default behavior when count is omitted or non-numeric is also not verified.

## Affected Files

- `app/server/api/encounter-tables/[id]/generate.post.ts` — count clamping logic (lines 25-28)

## Suggested Fix

Add integration tests covering:
1. Count below minimum (0, -1) -> clamped to 1
2. Count above maximum (21, 100) -> clamped to MAX_SPAWN_COUNT (20)
3. Count omitted -> uses default (4)
4. Count non-numeric -> handled gracefully

## Impact

Low — the clamping logic is straightforward and unlikely to break, but testing boundary conditions prevents regressions if the logic changes.

## Resolution Log

| Commit | Files | Description |
|--------|-------|-------------|
| f24cc9d | `app/tests/unit/api/generateCountClamping.test.ts` | Added 14 tests covering all clamping scenarios: below min, above max, valid range, non-numeric defaults, NaN behavior |
