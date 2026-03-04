---
review_id: code-review-201
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-112
domain: vtt-grid
commits_reviewed:
  - c2741566cf87ffca1c043bee83566396f145f432
  - a9cedd349218a52eb0debeac95c48bbfc675dd22
  - 3c287c86cf136597e8a6735553032b1eeea63d82
  - 9fd4d128ccfdc52240a175ac79f215182b467b8e
  - 0dd3605e288f196f15a7cb5a4d6e24e0487c1ad3
files_reviewed:
  - app/constants/naturewalk.ts
  - app/utils/combatantCapabilities.ts
  - app/composables/useGridMovement.ts
  - app/composables/useMoveCalculation.ts
  - app/stores/terrain.ts
  - app/types/character.ts
  - app/tests/unit/composables/useMoveCalculation.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-02-27T22:15:00Z
follows_up: null
---

## Review Scope

First code review of ptu-rule-112: Naturewalk capability terrain bypass. Four implementation commits plus one preceding fix commit (0dd3605 -- painted rough terrain in accuracy penalty, which forms the base for the Naturewalk integration). The feature adds:

1. `app/constants/naturewalk.ts` (NEW) -- PTU Naturewalk terrain names mapped to app terrain base types
2. `app/utils/combatantCapabilities.ts` -- `getCombatantNaturewalks()` and `naturewalkBypassesTerrain()` utility functions
3. `app/composables/useGridMovement.ts` -- `getTerrainCostForCombatant()` updated to bypass slow flag for matching Naturewalk
4. `app/composables/useMoveCalculation.ts` -- `targetsThroughRoughTerrain()` updated to bypass painted rough flag for matching Naturewalk

Decree compliance checked: decree-003 (enemy-occupied rough), decree-010 (multi-tag terrain), decree-025 (endpoint exclusion).

## Issues

### HIGH

#### HIGH-1: No unit tests for Naturewalk functions

The implementation adds three new exported functions (`getCombatantNaturewalks`, `parseNaturewalksFromOtherCaps` (private but testable through the public API), `naturewalkBypassesTerrain`) and modifies two core composable functions, but no unit tests were added. The existing `useMoveCalculation.test.ts` tests rough terrain penalty behavior but does not test Naturewalk bypass of that penalty.

Required test coverage:

1. **`getCombatantNaturewalks`** -- human combatant returns empty; Pokemon without capabilities returns empty; Pokemon with `capabilities.naturewalk` returns terrain names; Pokemon with otherCapabilities containing "Naturewalk (Forest, Grassland)" parses correctly; both sources present deduplicates.

2. **`naturewalkBypassesTerrain`** -- returns false for human; returns false for Pokemon without matching Naturewalk; returns true when Naturewalk (Forest) matches `normal` base type; returns false when Naturewalk (Ocean) does not match `normal` base type; handles multiple Naturewalk terrains.

3. **`useMoveCalculation` Naturewalk rough bypass** -- actor with matching Naturewalk bypasses painted rough on the line of sight; actor with non-matching Naturewalk does NOT bypass painted rough; Naturewalk does NOT bypass enemy-occupied rough (decree-003).

4. **`useGridMovement` Naturewalk slow bypass** -- combatant with matching Naturewalk on slow-flagged cell gets base cost (not doubled); combatant without matching Naturewalk still gets doubled cost; Naturewalk does not bypass blocking/impassable terrain.

**Files:** New test file `app/tests/unit/utils/combatantCapabilities.test.ts` and additions to `app/tests/unit/composables/useMoveCalculation.test.ts`.

### MEDIUM

#### MED-1: `app-surface.md` not updated with new file and functions

`app-surface.md` lists `utils/combatantCapabilities.ts` with specific functions (`combatantCanFly`, `getSkySpeed`, `combatantCanSwim`, `combatantCanBurrow`) but does not mention the new `getCombatantNaturewalks` or `naturewalkBypassesTerrain` functions. The new `constants/naturewalk.ts` file is also not mentioned anywhere in the surface document.

**File:** `.claude/skills/references/app-surface.md`

#### MED-2: `parseNaturewalksFromOtherCaps` regex does not handle inline Naturewalk within longer capability strings

The regex `^Naturewalk\s*\(([^)]+)\)$` uses `^...$` anchors, meaning it only matches strings where Naturewalk is the ENTIRE string. If the seeder or any data source produces a capability string like `"Naturewalk (Forest), Underdog"` (multiple capabilities in one string), the regex will not match.

I verified the `SpeciesData` schema stores capabilities as a JSON array where each entry is a single capability string (e.g., `["Naturewalk (Forest)", "Underdog"]`), so this is safe with current data. However, the defensive pattern would be to also handle substring matches. Since the seeder already splits correctly, this is a data format coupling rather than a bug -- but it is fragile if the data format changes.

**File:** `app/utils/combatantCapabilities.ts`, line 227

## What Looks Good

1. **Decree compliance is exemplary.** Every function documents which decrees apply and why. The enemy-occupied rough terrain (decree-003) is explicitly separated from painted terrain rough and checked before the Naturewalk bypass, ensuring Naturewalk never circumvents the game mechanic. Per decree-003, this approach was ruled correct. Per decree-025, endpoint exclusion is preserved. Per decree-010, the multi-tag system is properly leveraged.

2. **Separation of concerns is clean.** Constants in `constants/naturewalk.ts`, utility functions in `utils/combatantCapabilities.ts`, and integration in the composables. The `naturewalkBypassesTerrain` function is a pure function that takes a combatant and base terrain type, making it easily testable and reusable.

3. **The two-source Naturewalk extraction** (`capabilities.naturewalk` + `capabilities.otherCapabilities`) covers both direct seeded data and parsed species data, with proper deduplication via `Set`.

4. **Movement cost bypass correctly targets only the slow flag.** The rough flag has no movement cost effect (only accuracy), so bypassing only the slow doubling is correct per PTU terrain rules (p.465-474). The code returns `TERRAIN_COSTS[terrain]` (base cost without slow doubling) rather than hardcoding 1, which correctly handles edge cases like hazard terrain with slow flag.

5. **Accuracy penalty bypass correctly targets only painted rough.** The `targetsThroughRoughTerrain` function checks enemy-occupied cells FIRST (returning true immediately -- no Naturewalk bypass), then checks painted rough terrain with the Naturewalk bypass. This ordering ensures decree-003 is never violated.

6. **Commit granularity is appropriate.** Four small, logically sequenced commits: constants, utilities, movement integration, accuracy integration. Each commit is self-contained and produces a consistent state.

7. **The known limitation** (multiple PTU terrain categories mapping to `normal` base type) is well-documented in the constants file. This is an inherent mismatch between the app's terrain painter (which uses generic base types) and PTU's terrain categories, and the documentation makes it clear the GM must set up terrain appropriately.

8. **Immutability is preserved throughout.** No mutation of combatant or terrain objects. All functions return new values.

## Verdict

**CHANGES_REQUIRED**

The implementation logic is correct, well-documented, and decree-compliant. The single blocking issue is the lack of unit tests (HIGH-1). For a feature that modifies core movement cost and accuracy calculations, test coverage is essential to prevent regressions. The medium issues (app-surface update and regex fragility) should also be addressed in the fix cycle.

## Required Changes

1. **HIGH-1:** Add unit tests for the three new functions and the two composable integrations. Minimum: test `getCombatantNaturewalks` parsing from both data sources, test `naturewalkBypassesTerrain` with matching and non-matching terrains, test movement cost bypass for slow flag, test accuracy penalty bypass for painted rough (and confirm enemy-occupied rough is NOT bypassed).

2. **MED-1:** Update `app-surface.md` to list `constants/naturewalk.ts` and the new functions in `utils/combatantCapabilities.ts`.

3. **MED-2:** Add a code comment to `parseNaturewalksFromOtherCaps` noting the assumption that each otherCapabilities entry is a single capability string, to prevent future data format changes from silently breaking the parser.
