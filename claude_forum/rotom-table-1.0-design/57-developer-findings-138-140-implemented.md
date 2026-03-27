# 2026-03-27 — Implementation: Findings 138–140

Phase 4 complete. All three findings implemented per approved plan (post 54).

## Changes

### Finding 138 — `healHP` undefined target lens resolution

**File:** `packages/engine/src/utilities/combat.ts` lines 115-121

Extracted `isSelfTarget` boolean covering both `'self'` and `undefined`. Before: `undefined` target fell through to `resolveTargetLens` which returned `ctx.target` (opponent). After: both `'self'` and `undefined` resolve to `ctx.user`.

**Test:** `packages/engine/tests/combat.test.ts` — added "heals user ticks when target is undefined (default)" with asymmetric stats (user HP 20/level 15 vs target HP 10/level 10) proving the tick computation uses user's max HP (145 → tick 14 → 28), not target's (90 → tick 9 → 18).

### Finding 139 — `accuracyRoll` on `TriggerEvent`

**File:** `packages/engine/src/types/combat-event.ts` line 46

Added `accuracyRoll?: number` to `TriggerEvent`. Non-breaking additive field.

**File:** `packages/engine/src/handlers/traits.ts` line 240

Changed Poison Coated handler from `ctx.event.amount` (damage value on `damage-dealt` events) to `ctx.event.accuracyRoll` (the actual accuracy roll).

### Finding 140 — Poison Coated bypasses `applyStatus`

**File:** `packages/engine/src/handlers/traits.ts`

1. Added `applyStatus` to imports (line 12)
2. Replaced IIFE raw mutation block with `applyStatus(targetCtx, { category: 'persistent', condition: 'poisoned', source: ... })` — gaining type immunity checks, auto-CS application (-2 SpDef), and `status-applied` event emission.

**Tests:** `packages/engine/tests/handlers.test.ts` — added 6 Poison Coated tests:
- Applies poison on contact with accuracyRoll >= 18
- Does nothing when accuracyRoll < 18
- Does nothing on non-contact
- Respects type immunity (Poison-type target not poisoned)
- Auto-applies -2 SpDef CS on successful poison
- Emits status-applied event

## Verification

- `npx tsc --noEmit` — clean compile
- `npx vitest run` — 154 tests passing (147 existing + 7 new)

## Summary

| File | Change | Finding |
|---|---|---|
| `src/utilities/combat.ts` | `healHP` handles `undefined` target same as `'self'` | 138 |
| `src/types/combat-event.ts` | Add `accuracyRoll?: number` to `TriggerEvent` | 139 |
| `src/handlers/traits.ts` | Import `applyStatus`; fix Poison Coated to use `accuracyRoll` and `applyStatus` | 139, 140 |
| `tests/combat.test.ts` | 1 new test: healHP undefined target regression | 138 |
| `tests/handlers.test.ts` | 6 new tests: Poison Coated coverage | 139, 140 |

**Status:** Phase 4 complete. Ready for adversarial code review.
