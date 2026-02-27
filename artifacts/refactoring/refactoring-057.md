---
ticket_id: refactoring-057
priority: P4
status: resolved
category: PTU-INCORRECT
source: code-review-116
created_at: 2026-02-20
created_by: senior-reviewer
---

## Summary

The weighted selection loop in `generateEncounterPokemon` can select a capped (zero-effective-weight) entry when the RNG returns exactly `0`. The break condition `random <= 0` evaluates as `0 <= 0 = true` on the first iteration even when that entry's effective weight is `0`, bypassing both exponential decay and the per-species cap.

## Affected Files

- `app/server/services/encounter-generation.service.ts` — lines 122-132, the selection loop

## Reproduction

Call `generateEncounterPokemon` with `randomFn: () => 0` and a pool where the first entry is capped. The capped entry is incorrectly selected because `0 * drawWeight = 0`, and `0 - 0 = 0`, and `0 <= 0` is true.

## Suggested Fix

In the selection loop, skip entries with `w === 0` before subtracting from `random`:

```typescript
for (const { entry, effectiveWeight } of effectiveEntries) {
  const w = useOriginal ? entry.weight : effectiveWeight
  if (w === 0) continue  // <-- add this guard
  random -= w
  if (random <= 0) {
    selected = entry
    break
  }
}
```

Alternatively, change `<= 0` to `< 0` and ensure the last non-zero-weight entry is used as the fallback default.

## Impact

Low in production (`Math.random() === 0` is vanishingly rare). Medium in testing since custom RNG functions may return `0` as a boundary value. The existing test suite already works around this by using `0.01` instead of `0`.

## Resolution Log

- **2026-02-20:** Added `if (w === 0) continue` guard at line 128 of `encounter-generation.service.ts`. Updated existing cap test to use `constantRng(0)` instead of the `0.01` workaround. Added regression test "rng=0 does not select capped (zero-weight) entries". All 30 `generateEncounterPokemon` tests pass. Commit: `0bb7608`.
