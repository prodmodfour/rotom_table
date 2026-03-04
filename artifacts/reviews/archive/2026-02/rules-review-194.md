---
review_id: rules-review-194
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-095+ptu-rule-119
domain: character-lifecycle+combat
commits_reviewed:
  - c9d442c
  - e507367
  - a922d48
  - 8899e68
  - 1ccbc71
  - 91664e2
mechanics_verified:
  - trainer-naturewalk-survivalist
  - naturewalk-terrain-bypass
  - naturewalk-slowed-stuck-immunity
  - addedge-skill-edge-injection-guard
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - 04-trainer-classes.md#4688-4694 (Survivalist class, Naturewalk grant)
  - 04-trainer-classes.md#2800-2801 (Naturewalk immunity definition)
  - 10-indices-and-reference.md#322-325 (Naturewalk format and Basic Terrain)
  - 07-combat.md#2136-2137 (Naturewalk bypasses Rough Terrain example)
  - 09-gear-and-items.md#1700-1714 (Snow Boots, Jungle Boots)
  - errata-2.md (checked, no Naturewalk errata)
reviewed_at: 2026-02-28T12:30:00Z
follows_up: rules-review-191
---

## Review Scope

Re-review of the fix cycle for ptu-rule-119 (Trainer Naturewalk) + refactoring-095 (addEdge injection guard). The original implementation was reviewed in rules-review-191 (APPROVED) and code-review-215 (CHANGES_REQUIRED, 2 HIGH + 3 MEDIUM). This review verifies that the 6 fix-cycle commits resolve all code-review-215 issues without introducing PTU rules regressions.

### Decree Compliance

- **decree-027** (Block Skill Edges from raising Pathetic skills during character creation): Still compliant. The fix cycle added error feedback in `EdgeSelectionSection.vue` when the `addEdge()` guard blocks a Skill Edge string. The guard logic itself (`/^skill edge:/i` regex) was not modified and remains correct. Per decree-027, this approach was ruled correct.
- **decree-003** (All tokens passable, enemy-occupied rough terrain): Not affected by fix cycle.
- **decree-010** (Multi-tag terrain): Not affected by fix cycle.
- **decree-025** (Exclude endpoint cells from rough terrain accuracy penalty): Not affected by fix cycle.

### Errata Check

Searched `books/markdown/errata-2.md` for "Naturewalk" -- no errata entries found. Core text controls.

## Fix Cycle Verification

### HIGH-01: Comma-splitting mangles multi-terrain Naturewalk (c9d442c)

**Issue:** `onCapabilitiesChange` in `[id].vue` used naive `input.split(',')`, which would mangle PTU-format entries like `"Naturewalk (Forest, Grassland)"` into `["Naturewalk (Forest", "Grassland)"]`.

**PTU reference:** The PTU rulebook uses comma-inside-parentheses format in multiple places:
- 10-indices-and-reference.md:322-323: "Naturewalk (Forest and Grassland)"
- 07-combat.md:2136-2137: "Oddish has the Naturewalk (Forest, Grassland) Capability"
- 04-trainer-classes.md:4694: "The terrains are: Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert"

**Fix:** Changed to `.split(/,(?![^(]*\))/)` -- a parentheses-aware regex that splits on commas only when NOT inside parentheses.

**Rules verification:** CORRECT. The regex correctly preserves `"Naturewalk (Forest, Grassland)"` as a single entry while still splitting `"Naturewalk (Forest), Naturewalk (Ocean)"` into two entries. This matches both formats used in PTU RAW. The downstream parser `parseNaturewalksFromOtherCaps()` in `combatantCapabilities.ts` (line 245) already handles both comma and "and" separators inside the parentheses, so the full pipeline is correct:
1. Input: `"Naturewalk (Forest, Grassland), Wallclimber"`
2. After parentheses-aware split: `["Naturewalk (Forest, Grassland)", "Wallclimber"]`
3. `parseNaturewalksFromOtherCaps` extracts: `["Forest", "Grassland"]`

### HIGH-02: No unit tests for trainer Naturewalk (8899e68)

**Fix:** Added comprehensive test suites in two files:

1. `app/tests/unit/utils/combatantCapabilities.test.ts` -- 3 new `describe` blocks (18 new tests):
   - `getCombatantNaturewalks -- trainer with capabilities`: 5 tests covering single terrain, multiple terrains, multi-terrain single entry, non-Naturewalk capabilities, empty capabilities
   - `naturewalkBypassesTerrain -- trainer with capabilities`: 4 tests covering matching terrain, non-matching terrain, Ocean/water match, no Naturewalk
   - `findNaturewalkImmuneStatuses`: 8 tests covering Slowed+Stuck immunity on matching terrain, single status, non-matching terrain, terrain disabled, no position, non-immune statuses, Pokemon on matching terrain, default-to-normal fallback

2. `app/tests/unit/composables/useCharacterCreation.test.ts` -- new file (6 tests):
   - Tests for the `addEdge()` guard: blocks "Skill Edge: Athletics", case-insensitive blocking, UPPERCASE blocking, allows "Basic Edge", allows "Iron Mind", allows "Multiskill Training" (contains "skill" but not "Skill Edge:" format)

**Rules verification:** CORRECT. The test cases accurately model PTU mechanics:
- Trainer with `Naturewalk (Forest)` returns `['Forest']` -- matches PTU p.149 Survivalist grant
- Multi-terrain `Naturewalk (Forest, Grassland)` correctly parsed -- matches PTU 10-indices-and-reference.md:322
- Slowed/Stuck immunity on matching terrain -- matches PTU 04-trainer-classes.md:2800-2801
- Non-matching terrain returns no immunity -- correct, Naturewalk is terrain-specific
- `findNaturewalkImmuneStatuses` defaults to 'normal' when no terrain cell at position -- reasonable default since unpainted cells are conceptually "normal" terrain

The `makeHumanCombatant()` helper was properly extended with `overrides` parameter supporting both `capabilities` and `position`, enabling clean test construction.

### MED-01: addEdge return value silently ignored (a922d48)

**Fix:** `EdgeSelectionSection.vue` now accepts an `addEdgeFn?: (edgeName: string) => string | null` prop. When provided:
- Calls `addEdgeFn(edgeName)` instead of emitting `addEdge`
- On error (non-null return): displays red error text below input, highlights input border red, does NOT clear input
- On success (null return): clears input normally

`create.vue` passes `:add-edge-fn="creation.addEdge"` instead of `@add-edge="creation.addEdge"`. The `creation.addEdge()` function both validates AND adds the edge to `form.edges` on success, so the prop-based approach is correct.

**Rules verification:** No PTU mechanics affected. This is a UX fix for the decree-027 enforcement UI.

### MED-02: app-surface.md not updated (1ccbc71)

**Fix:** Added documentation for `HumanCharacter.capabilities` field to `app-surface.md`, including Prisma type, format, wiring path, and UI locations.

**Rules verification:** No PTU mechanics affected. Documentation-only change.

### MED-03: border-color missing on --capability tag (e507367)

**Fix:** Added `border-color: rgba($color-success, 0.3)` to the `--capability` tag variant in `[id].vue`, matching `HumanClassesTab.vue`.

**Rules verification:** No PTU mechanics affected. CSS-only change.

## Mechanics Verified

### Trainer Naturewalk via Survivalist (ptu-rule-119)

- **Rule:** "Choose a Terrain in which you have spent at least three nights. You gain Naturewalk for that terrain" (`04-trainer-classes.md#4690`)
- **Implementation:** HumanCharacter stores `capabilities: string[]` containing entries like `"Naturewalk (Forest)"`. `getCombatantNaturewalks()` calls `parseNaturewalksFromOtherCaps()` on human capabilities, extracting terrain names. `naturewalkBypassesTerrain()` and `findNaturewalkImmuneStatuses()` are type-agnostic, working for both Pokemon and humans.
- **Status:** CORRECT

### Naturewalk Terrain Bypass

- **Rule:** "Pokemon with Naturewalk treat all listed terrains as Basic Terrain." (`10-indices-and-reference.md#324-325`). This also applies to trainers per Survivalist grant.
- **Implementation:** `naturewalkBypassesTerrain()` checks if any Naturewalk terrain maps to the base terrain type via `NATUREWALK_TERRAIN_MAP`. Returns true if match found.
- **Terrain list verified:** The 9 terrains in `NaturewalkTerrain` type exactly match PTU 04-trainer-classes.md:4694: Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert.
- **Status:** CORRECT

### Naturewalk Slowed/Stuck Immunity

- **Rule:** "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains." (`04-trainer-classes.md#2800-2801`)
- **Implementation:** `findNaturewalkImmuneStatuses()` filters applied statuses against `NATUREWALK_IMMUNE_STATUSES` (Slowed, Stuck only), checks terrain at combatant position, verifies Naturewalk match. The `combatant.type !== 'pokemon'` early-return was correctly removed in the original implementation -- trainers with Naturewalk get the same immunity.
- **Status:** CORRECT

### Naturewalk Format Parsing

- **Rule:** PTU uses both "Naturewalk (Forest and Grassland)" (`10-indices-and-reference.md#322-323`) and "Naturewalk (Forest, Grassland)" (`07-combat.md#2136-2137`) formats.
- **Implementation:** `parseNaturewalksFromOtherCaps()` splits by comma or "and" via `.split(/[,]|\band\b/i)`. The capabilities input parser in `[id].vue` now uses parentheses-aware split `/,(?![^(]*\))/` to avoid mangling multi-terrain entries.
- **Status:** CORRECT

### decree-027 Injection Guard (refactoring-095)

- **Rule:** Per decree-027, Skill Edges cannot raise Pathetic skills during character creation. The injection vector was typing `"Skill Edge: Athletics"` into the generic edge input.
- **Implementation:** `addEdge()` blocks strings matching `/^skill edge:/i` and returns a descriptive error string. `EdgeSelectionSection.vue` displays the error and preserves the input text. Unit tests verify blocking and allow-through for legitimate edges.
- **Status:** CORRECT (per decree-027)

## Summary

All 5 issues from code-review-215 have been correctly resolved without introducing any PTU rules regressions:

1. **HIGH-01** (comma split): Fixed with parentheses-aware regex. Parser pipeline now correctly handles both PTU Naturewalk formats.
2. **HIGH-02** (missing tests): 24 new tests across 2 files cover all trainer Naturewalk code paths and the addEdge guard.
3. **MED-01** (silent rejection): Error feedback now shown in `EdgeSelectionSection.vue` via `addEdgeFn` prop pattern.
4. **MED-02** (app-surface.md): Capabilities field documented.
5. **MED-03** (border-color): Added to match `HumanClassesTab.vue`.

The underlying PTU rules implementation (verified in rules-review-191) remains sound. No new rules issues introduced by the fix cycle.

## Rulings

No new PTU ambiguities discovered. All mechanics are clearly supported by the cited rulebook references.

## Verdict

**APPROVED**

The fix cycle correctly resolves all code-review-215 issues. No PTU rules regressions. No decree violations. The trainer Naturewalk implementation remains correct per PTU 04-trainer-classes.md:4688-4694 and the injection guard remains compliant with decree-027.

## Required Changes

None.
