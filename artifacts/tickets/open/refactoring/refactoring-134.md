---
id: refactoring-134
title: "alert() reintroduced in toggleVisionCapability store action"
category: UX-PATTERN
priority: P4
severity: MEDIUM
status: open
domain: combat
source: code-review-331 (HIGH-2)
created_by: slave-collector (plan-1772668105)
created_at: 2026-03-05
affected_files:
  - app/stores/encounter.ts
---

## Summary

The `toggleVisionCapability` action in encounter store uses `alert()` for error handling (line ~1654). The codebase just completed refactoring-131 to replace all `alert()` calls with `useGmToast`. This reintroduces the eliminated anti-pattern.

## Suggested Fix

Replace `alert()` with `showToast()` from `useGmToast`, using `'error'` type for the failure case.

## Impact

Low — cosmetic regression, but contradicts the pattern established by refactoring-097 and refactoring-131.
