---
id: refactoring-143
title: Add unit tests for checkRecallReleasePair including isFaintedSwitch path
priority: P4
severity: LOW
status: open
domain: combat
source: code-review-ptu-rule-130 M2
created_by: slave-collector (plan-1772711294)
created_at: 2026-03-05
affected_files:
  - app/tests/unit/services/switching.service.test.ts
---

# refactoring-143: Add unit tests for checkRecallReleasePair

## Summary

The `checkRecallReleasePair()` function in `switching.service.ts` has no unit test coverage for the `isFaintedSwitch` path added by ptu-rule-130 (fainted recall+release League exemption).

## Suggested Fix

Create tests covering:
- Pair with fainted recall returns `isFaintedSwitch: true`
- Pair with non-fainted recall returns `isFaintedSwitch: false`
- Mixed batch with multiple recalls (some fainted, some not)

Pure function with no DB dependencies — straightforward to test.

## Impact

LOW — Testing gap, not a bug.
