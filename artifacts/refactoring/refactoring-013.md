---
ticket_id: refactoring-013
priority: P2
categories:
  - TEST-STALE
affected_files:
  - app/tests/unit/stores/settings.test.ts
estimated_scope: trivial
status: resolved
created_at: 2026-02-16T23:00:00
origin: manual
---

## Summary

Unit test `settings.test.ts` line 15 asserts `store.damageMode` defaults to `'set'`, but `DEFAULT_SETTINGS.damageMode` in `types/settings.ts` is `'rolled'`. The store initializes state by spreading `DEFAULT_SETTINGS`, so the actual default is `'rolled'`. The test is stale — it was not updated when the default was changed.

## Findings

### Finding 1: TEST-STALE — settings default test disagrees with DEFAULT_SETTINGS

- **File:** `app/tests/unit/stores/settings.test.ts:15`
- **Expected by test:** `store.damageMode` === `'set'`
- **Actual default:** `DEFAULT_SETTINGS.damageMode` === `'rolled'` (defined in `app/types/settings.ts:16`)
- **Store init:** `app/stores/settings.ts:11` spreads `...DEFAULT_SETTINGS` into state
- **Impact:** 1 permanently failing unit test (446/447 passing)
- **Error message:** `AssertionError: expected 'rolled' to be 'set'`

## Suggested Fix

Update the test assertion to match the actual default:

```typescript
// settings.test.ts line 15
expect(store.damageMode).toBe('rolled')
```

Alternatively, use `DEFAULT_SETTINGS.damageMode` directly (consistent with the `resetToDefaults` test on line 130):

```typescript
expect(store.damageMode).toBe(DEFAULT_SETTINGS.damageMode)
```

Estimated commits: 1

## Resolution Log
- Commits: `74916db`
- Files changed: `app/tests/unit/stores/settings.test.ts`
- New files created: none
- Tests passing: 508/508
