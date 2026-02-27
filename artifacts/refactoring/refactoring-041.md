---
ticket_id: refactoring-041
priority: P3
status: resolved
category: TEST-STALE
discovered_by: code-review-058
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

`app/tests/unit/api/characters.test.ts:84` contains `maxHp: char.hp` in a mock-based test, simulating the old (broken) GET endpoint logic. The mock factory also lacks a `maxHp` field, so switching to `char.maxHp` returns undefined without updating the factory.

## Affected Files

- `app/tests/unit/api/characters.test.ts` — line 84 and mock factory

## Suggested Fix

1. Add `maxHp` to the character mock factory (computed from the PTU formula or set as a fixed test value)
2. Update line 84 to use `char.maxHp` instead of `char.hp`
3. Verify the test still passes with the corrected mock data

## Resolution Log

- **Resolved:** 2026-02-20
- **Changes:**
  1. Added `maxHp: 165` to `createMockCharacter` factory (PTU formula: `level + (baseHp * 3) + 10 = 5 + (50*3) + 10 = 165`)
  2. Updated line 84 from `maxHp: char.hp` to `maxHp: char.maxHp` to match the actual serializer behavior (`serializeCharacterSummary` uses `character.maxHp`)
- **Verification:** All 13 tests in `characters.test.ts` pass
