---
review_id: code-review-058
type: code-review
commits:
  - b2f6c80
  - 0ac2f03
  - aa4861c
  - be4257a
tickets:
  - bug-013
  - bug-025
status: approved-with-issues
date: 2026-02-19
---

# Code Review 058 — Bug Fixes 013, 025

## Verdict: APPROVED with 2 MEDIUM issues requiring follow-up tickets

Both fixes are correct, minimal, and well-scoped. No regressions introduced. The developer performed duplicate code path audits for both fixes and documented them in the ticket resolution logs. Two medium-severity issues identified: one stale test and one stale matrix artifact.

---

## Bug-013: Trapped Capture Bonus Removed — `b2f6c80`

**Files:** `app/utils/captureRate.ts` (214 lines), `app/composables/useCapture.ts` (261 lines)

### PTU Correctness: PASS

PTU 05-pokemon.md line 1733 states: "Stuck adds +10 to Capture Rate, and Slow adds +5." Trapped is not listed. Trapped means "cannot be recalled" (07-combat.md), which is mechanically distinct from Stuck ("cannot Shift"). The fix correctly removes Trapped from the capture bonus.

### Fix Completeness: PASS

Two code paths existed for capture rate calculation, and both were fixed:

1. **Server-side** (`captureRate.ts:17`): `STUCK_CONDITIONS` changed from `['Stuck', 'Trapped']` to `['Stuck']`. This utility is called by `server/api/capture/rate.post.ts` via `calculateCaptureRate()`.

2. **Client-side** (`useCapture.ts:160`): Inline condition changed from `condition === 'Stuck' || condition === 'Trapped'` to `condition === 'Stuck'`. This is the local calculation in `calculateCaptureRateLocal`.

Both paths now produce identical results for any status condition input. The `server/api/capture/attempt.post.ts` endpoint delegates to `rate.post.ts`'s logic, so it is also covered transitively.

### No Other Capture References to Trapped: PASS

Searched the entire `app/` directory for Trapped in capture context. All remaining references to Trapped are in:
- `constants/statusConditions.ts:17` -- OTHER_CONDITIONS list (correct, Trapped is a valid condition)
- `types/combat.ts:8` -- StatusCondition union (correct, Trapped is a valid type)
- `composables/useTypeChart.ts:15` -- Ghost type immunity to Stuck and Trapped (correct per PTU)
- Move data CSV entries (reference data, not capture logic)
- Test artifacts and matrix documents (documentation)

No other capture calculation code references Trapped. Fix is complete.

### Immutability: PASS

Both changes modify constant declarations and condition checks, not runtime data. No mutation patterns introduced.

### MEDIUM — Stale Matrix Artifact: `capture-capabilities.md` Still References Trapped

**File:** `app/tests/e2e/artifacts/matrix/capture-capabilities.md`, lines 172-173:

```
- **Game Concept:** Stuck/Trapped (+10) and Slowed (+5) capture modifiers
- **Description:** `STUCK_CONDITIONS` ['Stuck', 'Trapped'] add +10 each...
```

The `capture-C016` capability entry still describes `STUCK_CONDITIONS` as `['Stuck', 'Trapped']`. This is now stale and will cause confusion in future matrix pipeline runs. The audit file (`capture-audit.md:152-155`) also describes the pre-fix state, though that is less harmful since it documents the bug that was found.

**Action required:** File a ticket to update `capture-capabilities.md` capability `capture-C016` to reflect `STUCK_CONDITIONS` = `['Stuck']` only.

---

## Bug-025: `players.get.ts` Returns Computed maxHp — `aa4861c`

**File:** `app/server/api/characters/players.get.ts` (51 lines)

### Fix Correctness: PASS

The one-line change is correct:

```typescript
// Before (WRONG):
maxHp: char.hp, // Use hp stat as max HP (PTU convention)

// After (CORRECT):
maxHp: char.maxHp,
```

`char.hp` is the raw HP stat value (e.g., 10). `char.maxHp` is the computed Trainer HP formula result (`level * 2 + hpStat * 3 + 10`, e.g., 42). The misleading comment was correctly removed.

### Prisma Field Verification: PASS

The `HumanCharacter` Prisma model has both `hp` (stat value) and `maxHp` (computed value) as separate database columns. The `maxHp` column is populated correctly at creation time (fixed in bug-010, commit `566f1a1`). The endpoint's `include: { pokemon: true }` query returns all scalar fields including `maxHp`, so no query changes were needed.

### Duplicate Code Path Audit: PASS

All other character-returning endpoints use the shared serializers in `server/utils/serializers.ts`:
- `GET /api/characters` -- uses `serializeCharacterSummary` (line 146: `maxHp: character.maxHp`)
- `GET /api/characters/:id` -- uses `serializeCharacter` (line 85: `maxHp: character.maxHp`)
- `POST /api/characters` -- uses `serializeCharacter`
- `PUT /api/characters/:id` -- uses `serializeCharacter`

`players.get.ts` is the only endpoint with inline serialization. It was the only code path with this bug.

### Inline Serialization vs Shared Serializer: Acceptable (Pre-existing)

`players.get.ts` returns a reduced field set (id, name, playedBy, level, currentHp, maxHp, avatarUrl, trainerClasses, pokemon) compared to the shared serializer which returns 25+ fields. This is intentional -- the players endpoint serves the encounter lobby and player view which need minimal data. The inline approach is defensible for a purpose-built summary endpoint.

However, the inline serialization is missing fields that might be useful for player view in the future (e.g., statusConditions, injuries, stageModifiers). This is a design concern, not a bug, and is not introduced by this commit.

### MEDIUM — Stale Test in `characters.test.ts:84`

**File:** `app/tests/unit/api/characters.test.ts`, line 84:

```typescript
maxHp: char.hp,
```

This test simulates the old GET endpoint serialization logic and uses `char.hp` as `maxHp`. The test exercises mock data only (not the actual endpoint), so the stale line does not hide a production bug. However, it codifies incorrect behavior and will mislead future developers reading the test to understand the expected response shape.

The test also lacks a `maxHp` field on the mock character factory (`createMockCharacter` at line 19), which means `char.maxHp` would be undefined in the test context. A proper fix would:
1. Add `maxHp: 42` (or computed value) to `createMockCharacter`
2. Change line 84 to `maxHp: char.maxHp`

**Action required:** File a ticket to fix the stale test assertion.

### Stale Matrix Artifact: `character-lifecycle-capabilities.md`

**File:** `app/tests/e2e/artifacts/matrix/character-lifecycle-capabilities.md`, line 239:

```
Note: uses `hp` stat as maxHp in response (line 36: `maxHp: char.hp`), which differs from the general GET endpoint.
```

This capability description for `character-lifecycle-C019` is now stale. Same class of issue as the capture-capabilities staleness above. Can be combined into the same follow-up ticket for matrix artifact refresh.

---

## File Size Summary

| File | Lines | Status |
|------|-------|--------|
| `captureRate.ts` | 214 | OK (< 800) |
| `useCapture.ts` | 261 | OK (< 800) |
| `players.get.ts` | 51 | OK |

---

## Issues Summary

| # | Severity | Ticket | Description | Action |
|---|----------|--------|-------------|--------|
| 1 | MEDIUM | bug-013 (context) | `capture-capabilities.md` C016 still describes `STUCK_CONDITIONS` as `['Stuck', 'Trapped']` | File ticket for matrix artifact refresh |
| 2 | MEDIUM | bug-025 (context) | `characters.test.ts:84` uses `char.hp` as maxHp, mock factory missing `maxHp` field | File ticket for stale test fix |

**Total: 0 blocking issues. 2 medium issues requiring follow-up tickets.**
