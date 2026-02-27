---
review_id: code-review-056
type: code-review
commits:
  - f1ba7c3
  - 7a3e8dc
  - 566f1a1
  - 49a7fb2
tickets:
  - bug-008
  - bug-009
  - bug-010
  - bug-012
status: approved-with-issues
date: 2026-02-19
---

# Code Review 056 — Bug Fixes 008, 009, 010, 012

## Verdict: APPROVED with 1 MEDIUM issue requiring follow-up ticket

All four fixes are correct in their core logic. No regressions introduced. File sizes are within limits. Immutability violations have been avoided. The developer performed duplicate code path audits documented in each ticket's resolution log. One medium-severity issue identified (pre-existing, exposed by review context).

---

## Bug-008: Temp HP max(old, new) — `f1ba7c3`

**File:** `app/server/services/combatant.service.ts` (580 lines)

### Correctness: PASS

The fix is correct. PTU Core Chapter 9 specifies that when gaining Temporary HP while already having some, keep whichever value is higher. The code change:

```typescript
// Before: additive stacking (WRONG)
const newTempHp = previousTempHp + options.tempHp

// After: max(old, new) (CORRECT)
const newTempHp = Math.max(previousTempHp, options.tempHp)
```

The `tempHpGained` delta fix (`newTempHp - previousTempHp`) correctly reports 0 when the old temp HP was already higher, which is important for logging and WebSocket broadcasts.

### Duplicate Path Audit: PASS

All 4 code paths that touch `temporaryHp` were verified:
1. **Damage absorption** (`calculateDamage`, line 94-99): Correctly reduces temp HP before HP damage. Not affected.
2. **Breather reset** (`breather.post.ts`, line 63): Resets temp HP to 0. Not affected.
3. **Entity-update passthrough** (`entity-update.service.ts`): Passes raw value to DB. Not affected.
4. **Healing grant** (`applyHealingToEntity`, line 222-227): **Fixed** -- now uses `Math.max`.

### Immutability: Note

The function mutates `entity.temporaryHp` directly (line 225). This is the established pattern throughout `combatant.service.ts` -- all `applyX` functions mutate the entity in-place and return a result object. Consistent with codebase convention. Not a regression.

**No issues found.**

---

## Bug-009: Nature Stat Adjustments — `7a3e8dc`

**Files:** `app/constants/natures.ts` (106 lines, new), `app/server/services/pokemon-generator.service.ts` (439 lines)

### NATURE_TABLE Completeness: PASS

All 36 PTU natures present and correct:
- 30 non-neutral natures: 6 stats x 5 cross-pairs each = 30. Verified each stat-raising group has exactly 5 entries.
- 6 neutral natures: Composed (HP), Hardy (Atk), Docile (Def), Bashful (SpAtk), Quirky (SpDef), Serious (Spd). `raise === lower` so they cancel out.
- Total: 36 natures.

### Neutral Nature Handling: PASS

Early return at line 97 (`if (nature.raise === nature.lower)`) prevents any modification for neutral natures. Returns a spread copy (no mutation).

### Min-1 Clamp: PASS

Line 102-103: `Math.max(1, modified[stat] +/- modifier)` ensures no stat drops below 1. Correct per PTU.

### Modifier Amounts: PASS

- HP: +1/-1 via `modifierAmount('hp') === 1`
- Non-HP: +2/-2 via `modifierAmount(stat) === 2`
- Cross-category natures (e.g., Desperate: +Atk/-HP) correctly use the modifier for each respective stat: `+modifierAmount('attack')` = +2 for the raise, `-modifierAmount('hp')` = -1 for the lower.

### Application Order: PASS

Nature is applied at line 144 (`applyNatureToBaseStats(baseStats, selectedNature)`) and the adjusted stats are passed to `distributeStatPoints` at line 147. This is correct: nature modifies base stats BEFORE stat point distribution per PTU Chapter 5.

### Immutability: PASS

`applyNatureToBaseStats` creates a spread copy of the input (`{ ...baseStats }`) and returns it without mutating the original. Lines 101-103 mutate the local `modified` variable (a fresh object), not the input. Correct.

### File Structure: PASS

Clean separation: constants/type definitions in `natures.ts`, application logic via the exported `applyNatureToBaseStats` function. Well-organized comments grouping natures by stat.

### Semantic Note (informational)

The `baseStats` field in the returned `GeneratedPokemonData` (line 170) now stores nature-adjusted values, not raw species base stats. This means `Pokemon.baseStats` in the DB and entity types represents "species base + nature modifier" rather than pure species base. This is consistent with how the values are used downstream (stat distribution, HP formula), and the raw species data remains available in `SpeciesData`. No action needed, but worth documenting if this distinction ever matters.

### Unknown Nature Handling: PASS

Line 92: If `NATURE_TABLE[natureName]` returns undefined (name not found), the function returns a spread copy with no modifications. Defensive and correct.

**No issues found.**

---

## Bug-010: Trainer HP Formula — `566f1a1`

**File:** `app/server/api/characters/index.post.ts` (71 lines)

### Formula Correctness: PASS

PTU Trainer HP = `Level x 2 + HP Stat x 3 + 10`. The code at line 13:

```typescript
const computedMaxHp = level * 2 + hpStat * 3 + 10
```

Verified: Level 1, HP stat 10 = 2 + 30 + 10 = 42. Correct.

### Graceful Defaults: PASS

- `level` defaults to 1 via `body.level || 1` (line 9)
- `hpStat` defaults to 10 via `body.stats?.hp || body.hp || 10` (line 10)
- Both use `||` (falsy fallback), which means 0 would also trigger defaults. For HP stat and level, 0 is not a valid PTU value, so this is acceptable behavior.

### Body.maxHp Override: PASS

Line 14: `const maxHp = body.maxHp || computedMaxHp` preserves explicit `maxHp` from CSV import or API callers. This is the correct precedence: caller-provided value takes priority over computed formula. Note that `body.maxHp === 0` would trigger the fallback, but 0 is not a valid maxHp, so this is fine.

### currentHp Derivation: PASS

Line 34: `currentHp: body.currentHp || maxHp` — new characters start at full HP unless explicitly overridden. Correct.

### MEDIUM — Pre-existing Bug in `players.get.ts` (Requires Ticket)

**File:** `app/server/api/characters/players.get.ts`, line 36:

```typescript
maxHp: char.hp, // Use hp stat as max HP (PTU convention)
```

This endpoint returns the raw HP stat as `maxHp` for the player view. It should be `char.maxHp`. The comment "PTU convention" is incorrect -- `char.hp` is the HP stat value (e.g., 10), while `char.maxHp` is the computed formula result (e.g., 42). This pre-dates bug-010's fix but is now exposed: after the fix, `char.maxHp` is correctly computed on creation, but `players.get.ts` ignores it and returns the raw stat instead. Player view will show trainers with e.g. 10 max HP instead of 42.

**Action required:** File a new ticket for this bug. It is a one-line fix (`char.hp` -> `char.maxHp`).

### Known Related Issue: Confirmed

The commit message notes `encounter-templates/[id]/load.post.ts` line 85 uses `10 + level * 2` for inline human combatants (missing HP stat factor). Verified this is out of scope and tracked separately.

---

## Bug-012: Terrain-Aware Click-to-Move — `49a7fb2`

**Files:** `app/composables/useGridMovement.ts` (170 lines), `app/composables/useGridInteraction.ts` (594 lines), `app/composables/useGridRendering.ts` (519 lines), `app/components/vtt/GridCanvas.vue` (309 lines)

### A* Integration: PASS

`isValidMove` correctly delegates to `calculatePathCost` (A* in `useRangeParser.ts`) when terrain is present. The A* implementation:
- Uses PTU diagonal rules (alternating 1/2 cost)
- Applies terrain cost multipliers per cell
- Returns null for unreachable destinations (blocked by terrain)
- Handles the same-cell case correctly (A* returns cost=0, `isValidMove` returns `valid: false, distance: 0`)

### Performance Fallback: PASS

Line 130-131: `getTerrainCostGetter()` returns `undefined` when `terrainStore.terrainCount === 0`. When undefined, `isValidMove` falls back to the fast geometric `calculateMoveDistance` (line 152). No A* overhead when no terrain exists.

### Interface Wiring: PASS

`isValidMove` is threaded through all three composables:
- `GridCanvas.vue` passes `movement.isValidMove` to both interaction and rendering (lines 156, 189)
- `useGridInteraction` uses it for click validation (line 202) and hover preview (line 280)
- `useGridRendering` uses it for movement preview arrow rendering (line 380)

The old duplicated validation logic (manual `calculateMoveDistance` + `getBlockedCells` + `isBlocked` checks) in interaction and rendering is replaced by the single `isValidMove` call. Good deduplication.

### Edge Cases: PASS

1. **No selected token / null movingToken**: `handleMouseDown` checks `movingTokenId.value` at line 198 and `token` at line 200 before calling `isValidMove`. Preview in `handleMouseMove` checks `token && gridPos.x >= 0 && gridPos.y >= 0` at line 278. `drawMovementPreview` checks `token && target` at line 375.
2. **Out of bounds**: `isValidMove` checks `inBounds` at line 119 and returns `valid: false` if out of grid.
3. **Same cell**: Returns `distance: 0` which triggers cancel in `handleMouseDown` (line 218).
4. **Blocked by token**: Pre-checks at line 118 before any pathfinding. Returns early with `blocked: true`.

### canSwim TODO: Noted (Pre-existing)

`getTerrainCostAt` at line 73 has `// TODO: Pass canSwim based on combatant`, hardcoding `false`. This means water terrain always blocks movement regardless of the combatant's swim capability. This is a pre-existing limitation, not introduced by this commit. The commit message's claim "Water blocks non-swimmers" is technically inaccurate -- it blocks everyone. This should be addressed in a future ticket when water terrain interactions are fully implemented.

### Double `getBlockedCells` Call: Acceptable

`isValidMove` computes `blockedCells` once (line 117), uses it for the destination check (line 118), and passes the same array to `calculatePathCost` (line 134). No redundant computation.

**No blocking issues found.**

---

## File Size Summary

| File | Lines | Status |
|------|-------|--------|
| `combatant.service.ts` | 580 | OK (< 800) |
| `natures.ts` | 106 | OK |
| `pokemon-generator.service.ts` | 439 | OK |
| `characters/index.post.ts` | 71 | OK |
| `useGridMovement.ts` | 170 | OK |
| `useGridInteraction.ts` | 594 | OK (< 800) |
| `useGridRendering.ts` | 519 | OK |
| `GridCanvas.vue` | 309 | OK |

---

## Issues Summary

| # | Severity | Commit | Description | Action |
|---|----------|--------|-------------|--------|
| 1 | MEDIUM | 566f1a1 (context) | `players.get.ts` returns raw HP stat as maxHp instead of computed maxHp | File new ticket |

**Total: 0 blocking issues. 1 medium issue requiring a new ticket.**
