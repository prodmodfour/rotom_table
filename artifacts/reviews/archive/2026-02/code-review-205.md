---
review_id: code-review-205
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-112
domain: vtt-grid
commits_reviewed:
  - d9c0d81
  - 3b541b9
  - 2311d8f
  - c95021a
  - e5d6178
  - a34e706
  - 108239c
files_reviewed:
  - app/tests/unit/utils/combatantCapabilities.test.ts
  - app/tests/unit/composables/useMoveCalculation.test.ts
  - app/tests/unit/composables/useGridMovement.test.ts
  - app/composables/useGridMovement.ts
  - app/utils/combatantCapabilities.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-112.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-27T23:30:00Z
follows_up: code-review-201
---

## Review Scope

Re-review of the ptu-rule-112 fix cycle addressing all issues from code-review-201 (CHANGES_REQUIRED). The fix cycle comprises 7 commits:

1. `d9c0d81` -- Unit tests for `getCombatantNaturewalks` and `naturewalkBypassesTerrain` (new file: `combatantCapabilities.test.ts`)
2. `3b541b9` -- Naturewalk rough terrain bypass tests added to `useMoveCalculation.test.ts`
3. `2311d8f` -- Fix: earth terrain base cost in Naturewalk slow bypass path
4. `c95021a` -- Naturewalk slow terrain bypass tests added to `useGridMovement.test.ts`
5. `e5d6178` -- `app-surface.md` updated with Naturewalk entries
6. `a34e706` -- Format assumption comment added to `parseNaturewalksFromOtherCaps` regex
7. `108239c` -- Ticket resolution log updated

## Issue Resolution Verification

### HIGH-1: Unit tests for Naturewalk functions -- RESOLVED

The developer created comprehensive test coverage across three test files:

**`combatantCapabilities.test.ts` (290 lines, entirely new):**
- `getCombatantNaturewalks`: 10 tests covering human combatant (empty), Pokemon without capabilities (empty), direct naturewalk field, otherCapabilities parsing with comma separator, "and" separator, single terrain, non-Naturewalk entries filtered, deduplication from both sources, each source empty while other present.
- `naturewalkBypassesTerrain`: 12 tests covering human (false), no Naturewalk (false), Forest matching normal, Ocean not matching normal, Ocean matching water, Wetlands matching both water and normal, Mountain matching elevated, Cave matching earth, multiple Naturewalks, blocking terrain never bypassed, otherCapabilities parsed source, unrecognized terrain name.

**`useMoveCalculation.test.ts` (Naturewalk section: 6 tests added):**
- Actor with matching Naturewalk bypasses painted rough (returns 0).
- Actor with non-matching Naturewalk does NOT bypass (returns 2).
- Naturewalk does NOT bypass enemy-occupied rough (decree-003 compliance).
- Ocean Naturewalk bypasses rough on water terrain.
- Combined: painted rough bypassed but enemy-occupied rough still triggers penalty.

**`useGridMovement.test.ts` (Naturewalk section: 8 tests added):**
- Matching Naturewalk bypasses slow flag (cost 1 instead of 2).
- Non-matching Naturewalk: slow flag still doubles cost.
- No Naturewalk: slow flag doubles cost.
- Blocking terrain: Infinity even with Naturewalk.
- Water terrain: Infinity without swim even with Ocean Naturewalk.
- Water terrain with swim AND Ocean Naturewalk: slow bypassed (cost 1).
- Non-slow terrain: cost 1 regardless of Naturewalk.
- Earth terrain with burrow AND Cave Naturewalk: slow bypassed (cost 1).

Test quality assessment: Excellent. Tests cover positive cases, negative cases, edge cases (blocking terrain, capability-gated terrain), and decree compliance. The combatant stubs are well-constructed with appropriate type assertions. The composable tests properly initialize Pinia and the terrain store.

### MED-1: `app-surface.md` not updated -- RESOLVED

The VTT Grid utilities line now includes `getCombatantNaturewalks`, `naturewalkBypassesTerrain`, and `constants/naturewalk.ts` with its exports (`NATUREWALK_TERRAIN_MAP`, `NATUREWALK_TERRAINS`). Accurate and complete.

### MED-2: Regex format assumption comment -- RESOLVED

A clear NOTE block was added to `parseNaturewalksFromOtherCaps` documenting that the `^...$` anchors assume each otherCapabilities entry is a single capability string, matching current seeder behavior, and noting the parser will need updating if the data format changes. This is sufficient documentation to prevent the fragility from becoming a silent bug.

## Additional Finding: Earth Terrain Base Cost Fix

Commit `2311d8f` fixes a real bug not caught in code-review-201: `TERRAIN_COSTS['earth']` is `Infinity` (generic blocking cost for non-burrowers), so when a burrower with Cave Naturewalk hit slow earth terrain, the Naturewalk bypass path returned `TERRAIN_COSTS['earth']` = `Infinity` instead of 1. The fix adds an explicit `if (terrain === 'earth') return 1` before the generic `TERRAIN_COSTS[terrain]` lookup. This matches the `getMovementCost` behavior for capability-gated terrain types. The fix is correct and the corresponding test (`should bypass slow on earth terrain when combatant can burrow AND has Naturewalk (Cave)`) verifies it.

## File Size Check

| File | Lines | Status |
|------|-------|--------|
| `app/constants/naturewalk.ts` | 73 | Well under limit |
| `app/utils/combatantCapabilities.ts` | 273 | Well under limit |
| `app/composables/useGridMovement.ts` | 589 | Under limit |
| `app/composables/useMoveCalculation.ts` | 819 | Over 800-line limit (pre-existing) |
| `combatantCapabilities.test.ts` | 290 | N/A (test file) |
| `useGridMovement.test.ts` | 335 | N/A (test file) |
| `useMoveCalculation.test.ts` | 338 | N/A (test file) |

Note: `useMoveCalculation.ts` at 819 lines exceeds the 800-line guideline, but this is a pre-existing condition -- the fix cycle added zero lines to this file. A future refactoring ticket may be warranted to extract subsections (e.g., damage calculation or accuracy calculation into separate files), but that is outside the scope of ptu-rule-112.

## What Looks Good

1. **All three code-review-201 issues are fully resolved.** The developer addressed each issue systematically with appropriately scoped commits.

2. **Test coverage is thorough and well-structured.** 36 total Naturewalk-related tests across 3 files covering utility functions, movement cost bypass, and accuracy penalty bypass. Both positive and negative cases are present, and decree compliance is explicitly tested.

3. **The earth terrain base cost fix (`2311d8f`) demonstrates proactive bug discovery.** The developer found and fixed a real bug (Infinity cost for burrower + Naturewalk on slow earth terrain) while writing the slow bypass tests. The fix is minimal, correctly scoped, and immediately verified by a test.

4. **Commit granularity is correct.** Each commit is a single logical change: one for each test file, one for the bug fix, one for each documentation update, one for the ticket log.

5. **Test helper functions are well-designed.** `makePokemonCombatant` and `makePokemonCombatantWithCaps` provide clean, minimal stubs. The `createGridMovement` helper in the useGridMovement tests properly wires up the composable with a mock terrain store.

6. **The `useMoveCalculation` test mocking strategy is correct.** Auto-imported composables are stubbed via `vi.stubGlobal`, the terrain store is initialized fresh per test via `setActivePinia(createPinia())`, and the combatant factory was extended to support capabilities without breaking existing tests.

## Verdict

**APPROVED**

All issues from code-review-201 are resolved. The test coverage is comprehensive, the bug fix is correct, and the documentation updates are accurate. The fix cycle adds 641 lines (mostly tests) and changes 7 files with appropriate commit granularity. No new issues introduced.
