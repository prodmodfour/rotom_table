---
ticket_id: refactoring-038
priority: P2
categories:
  - EXT-DUPLICATE
affected_files:
  - (migration script or seed re-run)
estimated_scope: trivial
status: resolved
source: code-review-035
created_at: 2026-02-18T22:30:00
---

## Summary

The generator service previously stored other capabilities under the key `"other"` in the capabilities JSON, but the UI and type definition use `"otherCapabilities"`. The rename in refactoring-037 fixed new records, but existing Pokemon in the DB still have the old `"other"` key. Their other capabilities (Underdog, Naturewalk, etc.) are invisible in the UI.

## Findings

### Finding 1: EXT-DUPLICATE
- **Metric:** JSON key mismatch between old DB records and current code
- **Impact:** Existing generator-created Pokemon show no other capabilities in the UI
- **Evidence:** Old generator wrote `other: data.otherCapabilities` (pre-refactoring-037), UI reads `capabilities.otherCapabilities` (PokemonCapabilitiesTab.vue:42, gm/pokemon/[id].vue:359)

## Suggested Fix

Either:
1. **SQL migration** (one-time):
   ```sql
   UPDATE Pokemon SET capabilities = REPLACE(capabilities, '"other":', '"otherCapabilities":')
   WHERE capabilities LIKE '%"other":%';
   ```
2. **Re-seed** — if the user re-seeds (which recreates all Pokemon), the new generator will produce the correct key automatically.

Option 1 is safer for users with existing game state. Option 2 is acceptable if the user doesn't mind losing manual edits.

## Related

- refactoring-037: Introduced the rename from `other` to `otherCapabilities`
- code-review-035: Discovered during review

## Resolution Log

- **Commit:** 9a7cca5
- **Files:** `app/prisma/migrate-capabilities-key.ts` (new)
- **Approach:** SQL REPLACE migration (option 1 from suggested fix) — preserves existing game state
- **Records migrated:** 88
- **Test status:** Post-migration verification query confirms 0 records with old key
- **Note:** Resolved as part of bug-003 fix (same root cause and fix)
