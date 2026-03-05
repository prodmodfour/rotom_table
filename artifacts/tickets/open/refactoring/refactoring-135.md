---
id: refactoring-135
title: "Vision toggle API lacks source parameter validation"
category: INPUT-VALIDATION
priority: P4
severity: MEDIUM
status: open
domain: encounter-tables
source: code-review-331 (MED-1)
created_by: slave-collector (plan-1772668105)
created_at: 2026-03-05
affected_files:
  - app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts
---

## Summary

The `source` parameter in the vision toggle API endpoint is not validated against the `VisionCapabilitySource` type. Arbitrary strings like `'foo'` can be stored. Important to fix before P1 adds `'species'` auto-detection source.

## Suggested Fix

Validate `source` against the `VisionCapabilitySource` union type from `visionRules.ts`. Return 400 for invalid values.

## Impact

Low — prevents invalid data from being stored in combatant vision state.
