---
ticket_id: ptu-rule-053
priority: P2
status: resolved
domain: healing
matrix_source:
  rule_id: healing-R042
  audit_file: matrix/healing-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Only `drainedAp` is tracked. No scene-end AP refresh, no bound AP tracking, and no total AP pool tracking exist. The AP system is incomplete beyond the drain mechanic.

## Expected Behavior (PTU Rules)

Per PTU Core: characters have an AP pool that fully refreshes at scene end (except drained AP). Bound AP from Features reduces available AP. Total AP = base AP - bound AP - drained AP.

## Actual Behavior

Only `drainedAp` is stored. No total AP, no bound AP, no scene-end refresh trigger.

## Resolution Log

### 2026-02-20 — Bound AP tracking implementation

**Note:** Scene-end AP refresh was already implemented by bug-022. This ticket addresses the missing bound AP tracking.

**Changes:**
- Added `boundAp Int @default(0)` column to `HumanCharacter` in Prisma schema
- Added `calculateAvailableAp(maxAp, boundAp, drainedAp)` utility to `app/utils/restHealing.ts`
- Updated `calculateSceneEndAp()` to accept optional `boundAp` parameter
- Updated scene deactivation (`app/server/api/scenes/[id]/deactivate.post.ts`) to clear `boundAp` at scene end
- Updated scene activation (`app/server/api/scenes/[id]/activate.post.ts`) to clear `boundAp` when deactivating other scenes
- Updated character Extended Rest endpoint to clear `boundAp` alongside `drainedAp`
- Updated character new-day and global new-day endpoints to clear `boundAp`
- Updated character PUT endpoint to accept `boundAp` field for GM editing
- Updated serializers (both detail and summary) to include `boundAp`
- Updated combatant service to include `boundAp` in character serialization
- Added `boundAp` to `HumanCharacter` TypeScript interface
- Updated library store test fixture to include `boundAp`
- Added unit tests for `calculateAvailableAp` in `app/tests/unit/utils/restHealing.test.ts`

**Remaining:** UI components for binding/unbinding AP as a Free Action during combat are not yet implemented. The data layer is complete — GMs can manually set `boundAp` via character edit.

- **Resolved:** 2026-02-20 — Both Senior Reviewer and Game Logic Reviewer approved.
