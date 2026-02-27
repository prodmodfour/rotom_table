---
ticket_id: refactoring-036
priority: P2
categories:
  - PTU-INCORRECT
affected_files:
  - app/server/services/csv-import.service.ts
estimated_scope: trivial
status: resolved
created_at: 2026-02-18T21:00:00
---

## Summary

`createPokemonFromCSV()` hardcodes `size: 'Medium'` instead of reading from the already-queried `speciesData`. Non-Medium imported Pokemon get wrong VTT token sizing.

## Findings

### Finding 1: PTU-INCORRECT
- **Metric:** Size capability hardcoded instead of derived from species data
- **Threshold:** PTU size (Small/Medium/Large/Huge/Gigantic) must match species for correct token sizing
- **Impact:** Imported Steelix (Gigantic, should be 4x4) renders as 1x1. Imported Wailord (Large, should be 2x2) renders as 1x1. Affects any non-Medium species imported via CSV.
- **Evidence:** `csv-import.service.ts:378` — `size: 'Medium'` hardcoded. `speciesData` is already queried at line 337 but only used for types.

## Suggested Fix

```typescript
// csv-import.service.ts:378
// Before:
size: 'Medium',

// After:
size: speciesData?.size ?? 'Medium',
```

One-line change. No new queries needed — `speciesData` is already fetched.

## Related

- refactoring-010: Added size to generator service and speciesData (resolved)
- rules-review-031: Identified this issue during PTU verification of refactoring-028
- refactoring-028: Parent refactoring that routed CSV import through generator service

## Resolution Log
- Commits: 8cbfee1
- Files changed: app/server/services/csv-import.service.ts (size: 'Medium' → speciesData?.size ?? 'Medium')
- Tests passing: bundled with refactoring-037 verification
