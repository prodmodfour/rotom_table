---
review_id: rules-review-051
ticket: bug-011
commits_reviewed:
  - d6e6ad7
reviewed_at: 2026-02-19T23:50:00Z
reviewed_by: game-logic-reviewer
verdict: APPROVED
---

# Rules Review: bug-011 — Int weight column truncates fractional weights to 0

## Summary

The developer changed `EncounterTableEntry.weight` from `Int` to `Float` and `ModificationEntry.weight` from `Int?` to `Float?` in the Prisma schema, updated the `EncounterTableModal.vue` weight input to accept fractional values (`min="0.1"`, `step="0.1"`), and added a `Legendary (0.1)` preset option. This review verifies these changes against PTU 1.05 encounter table rules.

## PTU Rulebook Analysis

### Does PTU define specific weight values for encounter table entries?

**No.** PTU 1.05 Chapter 11 (Running the Game) does not define any mechanical system for weighted encounter tables. The rulebook provides:

1. **Habitat lists** (pp. 448-455) — qualitative species-to-habitat mappings, not weighted probabilities
2. **Energy pyramid guidance** (p. 444) — "producers, that is, plant-life (or photosynthetic grass Pokemon perhaps!) are the most populous denizens of an environment, and the higher up you go on the food chain, the rarer a species becomes"
3. **Fun game progression** (pp. 443-444) — weaker Pokemon in early areas, powerful ones later
4. **XP-budget encounter creation** (pp. 461-462) — GM-driven level budgeting, not random generation

There are no d100 encounter tables, no weight/probability percentages, no density tier definitions, and no random encounter generation mechanics in PTU 1.05. The app's entire encounter table system (weighted spawn tables, density tiers, sub-habitat modifications) is custom GM tooling that operationalizes PTU's qualitative guidance. This was already confirmed in rules-review-028, which noted: "App-defined spawn probability weights (common=10, uncommon=5, rare=3, very-rare=1, legendary=0.1). Not PTU-defined — these are custom encounter table weights for this tool."

### Is the `Legendary (0.1)` preset appropriate?

**Yes, with a caveat.** Since the weight scale is entirely app-defined (not PTU-mandated), the `Legendary (0.1)` preset is a reasonable GM-facing tool. The existing scale (common=10, uncommon=5, rare=3, very-rare=1) establishes a pattern of decreasing weight by roughly half at each tier. A `0.1` weight for legendary-tier species means they have 1/100th the encounter probability of common species, which aligns with the energy pyramid principle that apex/legendary species should be extremely rare relative to producers.

The caveat: PTU's pseudo-legendary placement guidance (p. 444) is about geographic restriction ("save the pseudo-legendaries like Dratini and Beldum for the out of the way, difficult to reach places") rather than encounter probability weighting. A GM following PTU's guidance would place legendaries in specific hard-to-reach habitats, not in normal habitats with a low weight. However, the app supports both approaches — the GM can create a dedicated habitat for legendaries (geographic restriction) OR include them in a normal habitat with low weight (probability rarity), which gives the GM more flexibility than the rulebook prescribes. This is not PTU-incorrect; it is a superset of PTU's guidance.

### Density tiers and weight mapping

PTU does not define density tiers. The app's `DENSITY_RANGES` (sparse: 2-4, moderate: 4-8, dense: 8-12, abundant: 12-16) are entirely custom and do not conflict with any PTU rule.

## Mechanics Verified

### 1. Schema change: Int to Float
- **Status:** CORRECT
- **Analysis:** The `Int` type truncated fractional weights (0.1 → 0), making low-weight entries unreachable in the weighted random selection algorithm (`generate.post.ts:139-148`). `Float` preserves fractional precision. Since the weight system is app-defined (not PTU-mandated), the data type choice is an implementation correctness issue, not a rules correctness issue. The fix ensures the app's own `RARITY_WEIGHTS` constant (`legendary: 0.1`) works as intended.

### 2. ModificationEntry.weight: Int? to Float?
- **Status:** CORRECT
- **Analysis:** Modifications can add or override species weights. A modification adding a legendary-tier species needs to store `0.1` — the same truncation bug applied here. Fix is consistent with the parent table fix.

### 3. Legendary (0.1) preset in EncounterTableModal.vue
- **Status:** CORRECT
- **Analysis:** Adds the missing tier to the Habitats page dropdown. The `TableEditor.vue` component already had a `Legendary (Weight: 0.1)` option via the canonical `RARITY_WEIGHTS` constant. Adding it to `EncounterTableModal.vue` reduces the inconsistency between the two entry points.

### 4. Weight input: min changed from 1 to 0.1, step added
- **Status:** CORRECT
- **Analysis:** Allows GMs to enter fractional weights in the inline editor. Consistent with the existing `TableEditor.vue` custom weight input which already had `min="0.1"` and `step="0.1"`.

### 5. Weighted random selection algorithm
- **Status:** CORRECT (pre-existing, not changed by this commit)
- **Analysis:** `generate.post.ts:119-148` uses standard cumulative weight selection: sum all weights, generate random float in [0, totalWeight), subtract each entry's weight until <= 0. This algorithm works correctly with fractional weights — a 0.1-weight entry will be selected ~0.1/totalWeight of the time.

## Pre-Existing Issues Found

### ISSUE-1: Rarity weight inconsistency between EncounterTableModal and RARITY_WEIGHTS (OBS-002 from audit)

- **Severity:** LOW
- **Location:** `app/components/habitat/EncounterTableModal.vue:109`
- **Finding:** The `EncounterTableModal.vue` dropdown uses `Rare (2)` while the canonical `RARITY_WEIGHTS` constant in `habitat.ts` defines `rare: 3`. The `TableEditor.vue` uses the canonical constant correctly via `Rare (Weight: 3)`. This means a species added as "Rare" via the Habitats page gets weight 2, but the same rarity label via the Encounter Tables page gets weight 3.
- **PTU Impact:** None — both are app-defined values, and neither is PTU-mandated. However, the inconsistency is confusing for the GM.
- **Ticket:** This was already identified as OBS-002 in the encounter-tables audit (`app/tests/e2e/artifacts/matrix/encounter-tables-audit.md`). No separate ticket filed as the audit already tracks it.

### ISSUE-2: max constraint removed from inline weight input

- **Severity:** LOW
- **Location:** `app/components/habitat/EncounterTableModal.vue:137-138`
- **Finding:** The original code had `min="1" max="100"`. The fix changed this to `min="0.1" step="0.1"` but dropped the `max` constraint entirely. A GM could now enter arbitrarily large weight values in the inline editor. The entry update API (`[entryId].put.ts`) validates `weight >= 0.1` but has no upper bound check.
- **PTU Impact:** None — weights are relative, so an arbitrarily large weight just means "always selected." But the missing max is a UX concern, not a rules issue.
- **Ticket:** Not filed — this is a UX quality issue, not a PTU rules issue or a bug (the system still functions correctly with any positive weight).

## Verdict: APPROVED

The fix correctly resolves the Int-to-Float truncation bug that prevented fractional weights from being stored. All changes are internally consistent with the app's existing weight system. No PTU rules are violated because PTU does not define encounter table weight mechanics — the entire system is custom GM tooling. The weighted random selection algorithm works correctly with fractional values without modification.
