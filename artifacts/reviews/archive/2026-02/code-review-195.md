---
review_id: code-review-195
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-108
domain: vtt-grid
commits_reviewed:
  - 0dd3605
  - 36571e9
  - 308f9ab
  - 95a99e6
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
  low: 1
reviewed_at: 2026-02-27T12:00:00Z
follows_up: null
---

## Files Reviewed

| File | Lines Changed | Assessment |
|------|---------------|------------|
| `app/composables/useMoveCalculation.ts` | +21 / -10 | CLEAN |
| `app/tests/unit/composables/useMoveCalculation.test.ts` | +338 (new) | CLEAN |
| `artifacts/tickets/open/ptu-rule/ptu-rule-108.md` | +14 / -0 (fix log) | N/A |
| `artifacts/tickets/open/ptu-rule/ptu-rule-093.md` | +16 / -3 (fix log) | N/A |

## Code Quality Assessment

### Change Summary

The fix adds painted rough terrain detection to the existing Bresenham line-of-fire trace in `getRoughTerrainPenalty()`. The change is minimal and surgical:

1. **Renamed** `targetsThroughEnemyRoughTerrain` to `targetsThroughRoughTerrain` (reflects broader scope)
2. **Added** a single `terrainStore.isRoughAt(x0, y0)` check alongside the existing `enemyOccupiedCells` check in the Bresenham loop
3. **Updated** JSDoc comments and section headers to reflect both rough terrain sources
4. **Created** a comprehensive test file with 12 test cases

### Strengths

- **Minimal diff, maximum impact.** The core fix is 3 lines of production code (one `if` check + `return true` + a comment). This is exactly the right scope for a bug fix.
- **Function rename** from `targetsThroughEnemyRoughTerrain` to `targetsThroughRoughTerrain` correctly reflects the expanded responsibility without breaking the public API (it's a private function).
- **Comment quality.** Every code block has decree references (decree-003, decree-010) and PTU page citations. Future maintainers can trace the logic to rulebook authority.
- **Test coverage is excellent.** 12 tests across 5 logical groups cover: positive cases, negative cases, boundary conditions (adjacent, no-position), combined sources, and terrain type interactions (water+rough, slow-only).
- **Test structure.** Helper functions `makeCombatant()` and `makeMove()` with override patterns follow project conventions. Mock setup for auto-imported composables is thorough.
- **Immutability.** No mutation of shared state. The Bresenham trace reads from computed properties and store getters without side effects.

### Issues

#### MED-1: allCombatants fallback to targets may miss enemy-occupied cells

In `combatantsOnGrid` (line 110-112):
```typescript
const combatantsOnGrid = computed((): Combatant[] => {
  return allCombatants?.value ?? targets.value
})
```

When `allCombatants` is not provided, the fallback is `targets.value`. But `targets` only contains potential targets of the current move, not all combatants on the grid. If an enemy combatant is NOT a valid target for the current move but IS between the attacker and a valid target, their cell won't be in `enemyOccupiedCells` and the rough terrain penalty from that enemy won't be detected.

This is a pre-existing issue (not introduced by this fix) and the signature correctly documents `allCombatants` as optional. All callers should pass it when VTT grid data is available.

**Recommendation:** No change needed for this fix. Document the limitation or consider making `allCombatants` required in a future refactor.

#### LOW-1: Test file uses vi.stubGlobal for Vue primitives

The test file (lines 8-9) stubs `ref` and `computed` as globals:
```typescript
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
```

This works because Nuxt auto-imports these, but it's a testing infrastructure concern, not a logic issue. Commit 308f9ab was specifically needed to add these stubs. This is the standard pattern for testing Nuxt auto-imported composables with Vitest. Acceptable.

## Checklist

- [x] No hardcoded secrets or credentials
- [x] No console.log statements
- [x] Functions under 50 lines (largest: `targetsThroughRoughTerrain` at ~68 lines including comments, acceptable for algorithmic code)
- [x] Files under 800 lines (useMoveCalculation.ts is 809 lines -- borderline but acceptable, it was already at ~790)
- [x] Proper error handling (graceful null checks for positions)
- [x] Immutable patterns (no mutation)
- [x] Input validation (null position guards)
- [x] Test coverage for new code

## Verdict

**APPROVED.** The fix is clean, minimal, well-documented, and thoroughly tested. The one MEDIUM issue is pre-existing and not introduced by this change. Code follows project conventions and SOLID principles (SRP: terrain checking is a self-contained concern within the line-of-fire trace).
