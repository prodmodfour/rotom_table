---
review_id: code-review-252
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-120
domain: combat+character-lifecycle
commits_reviewed:
  - 8eaf22ec
  - de5f92a0
files_reviewed:
  - app/tests/unit/utils/equipmentBonuses.test.ts
  - app/tests/unit/utils/combatantCapabilities.test.ts
  - app/utils/equipmentBonuses.ts
  - app/utils/combatantCapabilities.ts
  - app/server/services/combatant.service.ts
  - app/constants/naturewalk.ts
  - artifacts/tickets/open/ptu-rule/ptu-rule-120.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T15:40:00Z
follows_up: code-review-222
---

## Review Scope

Re-review of ptu-rule-120 fix cycle addressing code-review-222 H1 (no unit tests for `getEquipmentGrantedCapabilities` or the equipment-derived Naturewalk path). The fix cycle added 2 commits:

1. `8eaf22ec` — 31 new tests across 2 files (12 in `equipmentBonuses.test.ts`, 19 in `combatantCapabilities.test.ts`)
2. `de5f92a0` — docs: resolution log update in ptu-rule-120 ticket

Previous reviews:
- **rules-review-198**: APPROVED (game logic correctness verified against PTU p.293, p.322, p.149, p.276)
- **code-review-222**: CHANGES_REQUIRED (H1 only — no unit tests; M1 filed as ux-011, M2 filed as ptu-rule-125)

This re-review focuses exclusively on: test quality, coverage completeness, and verification that the original implementation is still correct after test additions.

### Decree Compliance

- **decree-003**: Tests do not introduce any Naturewalk bypass for enemy-occupied rough terrain. The `naturewalkBypassesTerrain` tests check only painted terrain base types. Compliant.
- **decree-010**: Multi-tag terrain not affected. Tests use single-type terrain cells (consistent with existing tests). Compliant.
- **decree-012**: No changes to server-side enforcement. Status immunity tests verify the client-side utility functions, not the endpoint. Compliant.

## H1 Resolution Analysis

### equipmentBonuses.test.ts (NEW — 12 tests)

All test cases requested in code-review-222 H1 are present:

| Required Coverage | Test(s) Present | Verified |
|---|---|---|
| Empty equipment | Lines 14-17, 19-29 (empty object + all undefined slots) | Yes |
| Single item with capabilities | Lines 47-57 (Snow Boots) | Yes |
| Multiple items with capabilities | Lines 59-76 (two slots, two different capabilities) | Yes |
| Deduplication | Lines 92-107 (across items), 109-119 (within single item) | Yes |
| Items without capabilities | Lines 31-45 (items with DR/evasion only) | Yes |

Additional coverage beyond the minimum:
- Multiple capabilities from a single item (lines 78-90)
- Mixed equipment with and without capabilities (lines 121-144)
- Empty `grantedCapabilities` array (lines 146-155)
- Non-Naturewalk capabilities (lines 157-174, verifying `Darkvision` is collected)
- Deterministic slot iteration order via `FOCUS_SLOT_PRIORITY` (lines 176-195)

The deterministic order test (line 193-194) is particularly valuable — it verifies that `accessory` is processed before `feet` per `FOCUS_SLOT_PRIORITY`, which is the same ordering used by `computeEquipmentBonuses` for Focus selection. This ensures behavioral consistency across the two functions sharing the same iteration order.

### combatantCapabilities.test.ts (EXTENDED — 19 new tests, 60 total)

The `makeHumanCombatant` helper was correctly extended with an optional `equipment?: EquipmentSlots` parameter (line 67), spread into the entity stub (line 102). This is the minimal change needed to enable equipment tests without disrupting the existing 41 tests.

Three new describe blocks were added:

**`getCombatantNaturewalks — equipment-derived capabilities` (8 tests, lines 506-628)**

| Coverage Area | Test(s) | Verified |
|---|---|---|
| Snow Boots → Tundra | Lines 507-519 | Yes |
| Jungle Boots → Forest | Lines 521-533 | Yes |
| Equipment without capabilities | Lines 535-546 | Yes |
| Non-Naturewalk equipment capabilities | Lines 548-559 | Yes |
| Manual + equipment merge | Lines 561-576 | Yes |
| Manual + equipment deduplication | Lines 578-591 | Yes |
| Multiple equipment slots | Lines 593-612 | Yes |
| Multiple capabilities per item | Lines 614-628 | Yes |

The merge test (line 561) verifies that a trainer with `Naturewalk (Forest)` from Survivalist class AND Snow Boots (`Naturewalk (Tundra)`) gets both terrains. The deduplication test (line 578) verifies that redundant sources (manual Forest + Jungle Boots Forest) produce a single `Forest` entry. Both are critical edge cases for the merge logic in `getCombatantNaturewalks`.

**`naturewalkBypassesTerrain — equipment-derived capabilities` (5 tests, lines 631-701)**

Tests verify the full path from equipment → parsed Naturewalk → terrain map lookup → bypass result:
- Snow Boots (Tundra) → matches `normal` terrain (line 632)
- Jungle Boots (Forest) → matches `normal` terrain (line 646)
- Snow Boots (Tundra) → does NOT match `water` terrain (line 660)
- Manual Ocean + equipment Tundra → matches both `water` and `normal` (line 674)
- Equipment Naturewalk → does NOT bypass `blocking` terrain (line 690)

**`findNaturewalkImmuneStatuses — equipment-derived capabilities` (6 tests, lines 704-846)**

End-to-end integration tests through the full status immunity path:
- Equipment Naturewalk grants Slowed/Stuck immunity on matching terrain (line 721)
- Equipment Naturewalk does NOT grant immunity on non-matching terrain (line 744)
- Manual OR equipment Naturewalk grants immunity (line 765)
- Non-immune statuses (Paralysis, Burned) not affected by equipment Naturewalk (line 788)
- Terrain disabled → no immunity even with equipment (line 808)
- No position → no immunity even with equipment (line 828)

### Test Quality Assessment

**Strengths:**

1. **Realistic test data.** Tests use actual PTU item names (Snow Boots, Jungle Boots) and terrain names (Tundra, Forest) that match the equipment catalog and `NATUREWALK_TERRAIN_MAP`. This validates the full chain from catalog entry to terrain bypass.

2. **Edge cases covered comprehensively.** The tests cover: empty inputs, single items, multiple items, deduplication within items, deduplication across items, deduplication across manual + equipment sources, mixed equipment (items with/without capabilities), non-Naturewalk capabilities, blocking terrain immunity, disabled terrain, missing position, and deterministic ordering.

3. **Assertion specificity.** Tests use exact value assertions (`toEqual`) for deterministic cases and containment assertions (`toContain` + `toHaveLength`) for cases where order is not guaranteed but cardinality matters. This is the correct testing pattern.

4. **No false positives.** Negative tests (lines 548-559 non-Naturewalk caps, lines 660-672 non-matching terrain, lines 744-763 non-matching terrain for immunity) ensure the functions do not over-match.

5. **Helper design.** The `makeHumanCombatant` helper uses optional spread syntax (`...(overrides?.equipment ? { equipment: overrides.equipment } : {})`) which correctly omits the field when not provided rather than setting it to `undefined`. This preserves the existing test behavior where `equipment` is absent from the entity.

6. **Comments reference PTU rules.** Test file comments cite PTU page numbers (p.293 Snow Boots, p.149 Survivalist, p.322 Naturewalk definition) providing traceability to game rules.

**No issues found.** The test suite is thorough, correctly structured, and fully addresses the code-review-222 H1 finding.

### Implementation Integrity Check

Re-read the source files to verify no implementation changes snuck in alongside the test additions:

- `app/utils/equipmentBonuses.ts` — unchanged from the original 7 implementation commits. The `getEquipmentGrantedCapabilities` function (lines 95-108) correctly iterates `FOCUS_SLOT_PRIORITY`, filters items with `grantedCapabilities`, and deduplicates via `Set`.
- `app/utils/combatantCapabilities.ts` — unchanged. The `getCombatantNaturewalks` human branch (lines 201-214) correctly merges `human.capabilities` with `getEquipmentGrantedCapabilities(human.equipment ?? {})`, parses via `parseNaturewalksFromOtherCaps`, and deduplicates.
- `app/server/services/combatant.service.ts` — unchanged. `buildCombatantFromEntity` passes equipment through to the entity, and `calculateCurrentInitiative` correctly reads equipment for focus speed bonus.
- `app/constants/naturewalk.ts` — unchanged. All 9 PTU terrain types mapped correctly.

The git diff for commit `8eaf22ec` confirms only 2 test files were modified (549 insertions, 1 deletion — the deletion being the old single-line `makeHumanCombatant` signature).

## What Looks Good

1. **Complete H1 resolution.** Every test case specified in code-review-222 is present, plus additional edge cases that strengthen confidence in the implementation.

2. **Test count verified.** 12 tests in `equipmentBonuses.test.ts` + 19 new tests in `combatantCapabilities.test.ts` = 31 new tests. Prior test count in `combatantCapabilities.test.ts` was 41 (11 + 14 + 5 + 4 + 7 = 41), now 60 total (41 + 19). Matches the ticket resolution log claim.

3. **Zero source code changes.** The fix cycle only added tests — no source modifications that could introduce regressions.

4. **Ticket resolution log updated.** `ptu-rule-120.md` now documents the fix cycle commit, files changed, and test count, providing a complete audit trail.

5. **M1 and M2 from code-review-222 properly deferred.** M1 filed as ux-011 (custom form grantedCapabilities), M2 filed as ptu-rule-125 (catalog completeness). These are not blocking and were correctly handled as separate tickets.

## Verdict

**APPROVED**

The fix cycle fully resolves code-review-222 H1. The 31 new tests provide comprehensive coverage of `getEquipmentGrantedCapabilities` and the equipment-derived Naturewalk path through `getCombatantNaturewalks`, `naturewalkBypassesTerrain`, and `findNaturewalkImmuneStatuses`. Test quality is high with correct assertion patterns, realistic PTU data, thorough edge cases, and proper negative tests. No source code was modified. Combined with rules-review-198 (APPROVED), ptu-rule-120 is ready to proceed.

## Required Changes

None.
