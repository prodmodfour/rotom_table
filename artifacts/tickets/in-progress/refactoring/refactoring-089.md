---
ticket_id: refactoring-089
ticket_type: refactoring
priority: P4
status: in-progress
category: EXT-DOCUMENTATION
domain: healing
source: code-review-196 M1
created_by: slave-collector (plan-20260227-174900)
created_at: 2026-02-27T18:10:00
affected_files:
  - .claude/skills/references/app-surface.md
  - app/server/services/rest-healing.service.ts
---

## Summary

The new `rest-healing.service.ts` service file exports `refreshDailyMoves` and `refreshDailyMovesForOwnedPokemon` but is not listed in the `app-surface.md` reference manifest.

## Suggested Fix

Add a row for `server/services/rest-healing.service.ts` to the services section in `app-surface.md`, listing the two exported functions.

## Impact

Other skills and reviewers may not discover the service via the surface manifest. Documentation-only fix.

## Resolution Log

- **Commit:** `ee00288` — docs: add rest-healing.service.ts to app-surface manifest
- **Files changed:**
  - `.claude/skills/references/app-surface.md` — added row for `server/services/rest-healing.service.ts` listing refreshDailyMoves and refreshDailyMovesForOwnedPokemon
