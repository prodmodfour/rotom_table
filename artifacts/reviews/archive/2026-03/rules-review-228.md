---
review_id: rules-review-228
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-120
domain: combat+character-lifecycle
commits_reviewed:
  - 8eaf22ec
mechanics_verified:
  - equipment-granted-naturewalk
  - naturewalk-terrain-bypass
  - naturewalk-status-immunity
  - equipment-capability-derivation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#snow-boots-p1700-1703
  - core/09-gear-and-items.md#jungle-boots-p1713-1715
  - core/10-indices-and-reference.md#naturewalk-p322-325
  - core/04-trainer-classes.md#naturewalk-immunity-p2800-2801
  - core/04-trainer-classes.md#survivalist-p4688-4693
reviewed_at: 2026-03-01T15:45:00Z
follows_up: rules-review-198
---

## Context

Re-review of ptu-rule-120 after fix cycle addressing code-review-222 H1 (no unit tests for `getEquipmentGrantedCapabilities` and equipment-derived Naturewalk path). The fix cycle added commit `8eaf22ec` with 31 new tests across 2 files. The implementation source files (`equipmentBonuses.ts`, `combatantCapabilities.ts`) were NOT modified in the fix cycle -- only test files were added/extended.

rules-review-198 already APPROVED the PTU rule correctness of the implementation. This re-review focuses on:
1. Verifying the tests correctly encode PTU rules (test assertions match PTU RAW)
2. Verifying coverage completeness against code-review-222 H1 requirements
3. Confirming the implementation remains correct (no regressions from test additions)

## Mechanics Verified

### Equipment-Granted Naturewalk (Test Accuracy)

- **Rule:** "Snow Boots grant you the Naturewalk (Tundra) capability, but lower your Overland Speed by -1 while on ice or deep snow." (`core/09-gear-and-items.md` line 1701-1702)
- **Rule:** "Jungle Boots grant you the Naturewalk (Forest) capability" (`core/09-gear-and-items.md` line 1714)
- **Tests:** `equipmentBonuses.test.ts` lines 47-56 test Snow Boots with `grantedCapabilities: ['Naturewalk (Tundra)']`, lines 59-76 test Jungle Boots with `grantedCapabilities: ['Naturewalk (Forest)']`. Both terrain names match PTU RAW exactly.
- **Tests:** `combatantCapabilities.test.ts` lines 507-519 and 521-533 test that `getCombatantNaturewalks` correctly extracts terrain names from Snow Boots and Jungle Boots equipped items, returning `['Tundra']` and `['Forest']` respectively.
- **Status:** CORRECT -- test assertions encode the correct PTU terrain names and expected parsed output.

### Equipment Capability Derivation (Pure Function Tests)

- **Rule:** Equipment capabilities are active while worn. The `grantedCapabilities` field stores capability strings in the same format as the Survivalist class feature.
- **Tests:** `equipmentBonuses.test.ts` covers 12 cases for `getEquipmentGrantedCapabilities`:
  - Empty equipment (lines 14-17, 19-29): returns `[]` -- CORRECT
  - Items without grantedCapabilities (lines 31-45): returns `[]` -- CORRECT
  - Single item with capabilities (lines 47-57): returns parsed array -- CORRECT
  - Multiple items across slots (lines 59-76): collects from all slots -- CORRECT
  - Single item with multiple capabilities (lines 78-90): returns all -- CORRECT
  - Cross-item deduplication (lines 92-107): uses `Set`, returns unique -- CORRECT
  - Within-item deduplication (lines 109-119): handles duplicate entries -- CORRECT
  - Mixed fields (lines 121-144): items with other bonuses but no capabilities skipped -- CORRECT
  - Empty array edge case (lines 146-155): `grantedCapabilities: []` returns `[]` -- CORRECT
  - Non-Naturewalk capabilities (lines 157-174): generic capability strings pass through -- CORRECT
  - Deterministic slot ordering (lines 176-195): follows `FOCUS_SLOT_PRIORITY` order -- CORRECT
- **Status:** CORRECT -- comprehensive coverage of the pure function's behavior.

### Naturewalk Terrain Bypass (Equipment Path)

- **Rule:** "Pokemon with Naturewalk treat all listed terrains as Basic Terrain." (`core/10-indices-and-reference.md` line 322-325). Same rule applies to trainers per PTU p.149 Survivalist and equipment-granted capabilities.
- **Tests:** `combatantCapabilities.test.ts` lines 631-702 cover `naturewalkBypassesTerrain` with equipment:
  - Snow Boots Naturewalk (Tundra) matches `'normal'` terrain (line 632-643): Tundra maps to `['normal']` in `NATUREWALK_TERRAIN_MAP` -- CORRECT per terrain mapping
  - Jungle Boots Naturewalk (Forest) matches `'normal'` terrain (lines 646-658): Forest maps to `['normal']` -- CORRECT
  - Snow Boots does not match `'water'` terrain (lines 660-672): Tundra only maps to `['normal']` -- CORRECT
  - Manual + equipment union (lines 674-688): Ocean (manual) matches water, Tundra (equipment) matches normal -- CORRECT
  - Blocking terrain never bypassed (lines 690-701): no Naturewalk maps to `'blocking'` -- CORRECT per PTU (blocking terrain is impassable)
- **Status:** CORRECT -- terrain mapping assertions match `NATUREWALK_TERRAIN_MAP` constants and PTU terrain categories.

### Naturewalk Status Immunity (Equipment Path)

- **Rule:** "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains." (`core/04-trainer-classes.md` line 2800-2801)
- **Tests:** `combatantCapabilities.test.ts` lines 704-846 cover `findNaturewalkImmuneStatuses` with equipment:
  - Snow Boots on matching normal terrain grants Slowed+Stuck immunity (lines 721-742): Tundra matches normal cell -- CORRECT
  - Snow Boots on non-matching water terrain does NOT grant immunity (lines 744-763): Tundra does not map to water -- CORRECT
  - Manual OR equipment match grants immunity (lines 765-786): Ocean (manual) matches water cell -- CORRECT
  - Non-Naturewalk-immune statuses NOT blocked (lines 788-806): Paralysis/Burned not in immune set -- CORRECT per PTU (only Slowed and Stuck)
  - Terrain disabled returns empty (lines 808-825): terrain system off, no immunity -- CORRECT
  - No position returns empty (lines 828-845): cannot determine terrain without position -- CORRECT
- **Status:** CORRECT -- all assertions align with PTU p.2800-2801 (Slowed/Stuck only, on matching terrain only).

### Merge and Deduplication (Manual + Equipment Sources)

- **Rule:** A trainer may have Naturewalk from both the Survivalist class feature (PTU p.4690) and equipment (PTU p.1701-1714). These should stack as a union of terrain types with deduplication.
- **Tests:** `combatantCapabilities.test.ts` lines 561-576 test merge of manual Forest + equipment Tundra, expecting both terrains. Lines 578-591 test deduplication when both manual and equipment grant Forest, expecting single entry.
- **Implementation:** `getCombatantNaturewalks` at lines 206-214 of `combatantCapabilities.ts` concatenates `manualCaps` and `equipmentCaps`, parses all for Naturewalk patterns, and deduplicates via `Set`. This is correct behavior.
- **Status:** CORRECT -- merge is union-based, deduplication prevents duplicate terrain entries.

### Decree Compliance

- **decree-011 (terrain speed averaging):** Not directly relevant to this fix cycle (test-only changes). The equipment Naturewalk tests do not affect movement speed averaging. COMPLIANT.
- **decree-025 (rough terrain penalty endpoints):** Not relevant to Naturewalk functionality. COMPLIANT.
- No active decrees govern equipment-granted Naturewalk specifically. The previous review (rules-review-198) verified decree-003 (enemy-occupied rough), decree-010 (multi-tag terrain), and decree-012 (server-side enforcement) compliance. No new decree violations introduced.

### Errata Check

No errata entries exist for Naturewalk or Snow Boots/Jungle Boots in `errata-2.md`. Confirmed via search.

## Summary

The fix cycle commit `8eaf22ec` adds 31 well-structured tests (12 in `equipmentBonuses.test.ts`, 19 in `combatantCapabilities.test.ts`) that fully address code-review-222 H1. The test assertions correctly encode PTU rules:

1. Snow Boots grant Naturewalk (Tundra) per PTU p.1701 -- tested
2. Jungle Boots grant Naturewalk (Forest) per PTU p.1714 -- tested
3. Equipment capabilities merge with manual Survivalist capabilities -- tested with deduplication
4. Naturewalk terrain bypass uses correct `NATUREWALK_TERRAIN_MAP` mappings -- tested
5. Naturewalk grants immunity to Slowed and Stuck only (not other statuses) per PTU p.2800-2801 -- tested
6. Immunity requires matching terrain at combatant position -- tested (including edge cases: no position, terrain disabled, non-matching terrain)

The `makeHumanCombatant` helper was correctly extended with an optional `equipment` parameter (line 67 of `combatantCapabilities.test.ts`), as required by code-review-222 H1.

No implementation files were modified in this fix cycle. The implementation correctness was already verified by rules-review-198 (APPROVED).

## Rulings

No new PTU rule issues found. The MEDIUM issues from rules-review-198 (MED-01: Snow Boots speed penalty, MED-02: catalog completeness) were already filed as separate tickets (ptu-rule-126, ptu-rule-125) and do not block this review.

## Verdict

**APPROVED**

The fix cycle fully resolves code-review-222 H1. All 31 tests correctly encode PTU rules. Test coverage spans the complete equipment-granted Naturewalk path: capability derivation (`getEquipmentGrantedCapabilities`), Naturewalk extraction (`getCombatantNaturewalks` with equipment), terrain bypass (`naturewalkBypassesTerrain` with equipment), and status immunity (`findNaturewalkImmuneStatuses` with equipment). Edge cases are well covered (empty equipment, deduplication, non-matching terrain, disabled terrain, no position, non-immune statuses). No regressions. No decree violations.

## Required Changes

None.
