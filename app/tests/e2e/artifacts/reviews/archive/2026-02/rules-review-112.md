---
review_id: rules-review-112
ticket_id: ptu-rule-058
design_spec: designs/design-density-significance-001.md
scope: P0 (Density Separation)
reviewer: game-logic-reviewer
verdict: PASS
date: 2026-02-20
commits_reviewed:
  - a5434db
  - c2d3b4d
  - 1343265
  - c44853f
  - 04c4a72
  - dd41e1d
  - e98b8e9
  - 68be10d
  - c5e30e5
---

# Rules Review: ptu-rule-058 P0 (Density/Significance Separation)

## Verdict: PASS

The P0 implementation correctly separates density from spawn count, aligning the app with how PTU 1.05 actually defines these concepts. No PTU rule violations were found in the implemented changes.

---

## PTU Source Verification

### 1. Density is NOT a Spawn Count Mechanic

**PTU source:** Chapter 11 (Running the Game) discusses habitats and encounter design at length (pp. 456-477). The rulebook describes habitat population in ecological/flavor terms -- energy pyramids, predator-prey relationships, niche competition, invasive species. The word "density" does not appear in PTU as a mechanical keyword with defined tiers or spawn ranges.

**What the old code did:** `DENSITY_RANGES` mapped `DensityTier` values directly to min/max spawn counts (e.g., `moderate: { min: 4, max: 8 }`). The `calculateSpawnCount` function derived spawn count from these ranges, treating density as a generation parameter.

**What the new code does:** `DENSITY_SUGGESTIONS` provides descriptive hints only (e.g., `moderate: { suggested: 4, description: 'Small group -- a pack or family unit' }`). These values are shown as informational suggestions in the UI but never fed into the generation algorithm. Spawn count is now an explicit `count` parameter provided by the GM.

**Ruling: CORRECT.** PTU has no density-to-spawn-count mapping. The old behavior was a homebrew invention. The new behavior correctly treats density as an informational label.

### 2. Spawn Count is a GM Decision, Not Formula-Derived

**PTU source (p. 473):** "One great method for creating encounters is to work backwards from the Experience drop you want to give your players." The encounter creation guidelines describe a level budget system:
- Baseline XP per player = avg Pokemon level x 2
- Total levels to distribute = baseline x number of trainers
- GM splits that budget into individual enemies at their discretion

**Example from PTU (p. 473):** "The GM splits this six ways and stats up an encounter with six Level 20 Pokemon." / "He splits it into two Level 40 Pokemon and four Level 25 Pokemon. He could also give up two weaker Pokemon to make a Level 25 Trainer."

**What the new code does:** The GM sets spawn count directly via a number spinner (min 1, max 20). The density suggestion appears below as a hint, not a constraint. The generate endpoint requires `count` from the request body (defaulting to 4 for backward compatibility).

**Ruling: CORRECT.** PTU explicitly puts encounter size in the GM's hands. The number of enemies is a creative decision based on level budget, narrative goals, and party composition. An explicit spinner is the right UI pattern.

### 3. Significance Multiplier is NOT a Spawn Count Modifier

**PTU source (p. 460):** The Significance Multiplier (x1 to x5+) is defined exclusively as an XP multiplier applied after combat:
1. Total defeated enemy levels (trainers at 2x)
2. Multiply by significance
3. Divide by number of players

**PTU source (p. 460):** "Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5."

**What the old code did:** `densityMultiplier` on `TableModification` was used as a spawn count scaler, conflating density scaling with what should have been a post-combat XP concept.

**What the new code does:** `densityMultiplier` is removed from the TypeScript interface and UI. The DB column is preserved for backward compatibility but is no longer read by generation logic. The generate endpoint comment explicitly states: "Modifications still affect species pool (add/remove/override weights) but do not scale spawn count."

**Ruling: CORRECT.** Significance is a post-combat XP multiplier, not a pre-combat spawn parameter. Removing `densityMultiplier` from the generation flow eliminates this conflation. The actual significance multiplier will be implemented in P1 per the design spec.

### 4. The Difficulty Adjustment (+/- x0.5-x1.5) is Additive to Significance

**PTU source (p. 460):** "Lower or raise the significance a little, by x0.5 to x1.5, based on the difficulty of the challenge."

**What the P0 does:** Nothing yet -- this is P1 scope. But the design spec correctly models it as an additive modifier to the base significance (not a separate multiplier), which matches the PTU text: "Lower or raise the significance a little."

**Ruling: CORRECT framing.** No P0 action needed. The design spec accurately describes the intended P1 behavior.

---

## Detailed File Review

### `app/types/habitat.ts`

| Item | Status | Notes |
|------|--------|-------|
| `DensityTier` type preserved | CORRECT | Still useful as a descriptive label |
| `DENSITY_SUGGESTIONS` replaces `DENSITY_RANGES` | CORRECT | Suggestions are informational hints, not mechanical inputs |
| `suggested` values (2/4/6/8) | ACCEPTABLE | These are reasonable GM hints. PTU doesn't prescribe specific numbers, so these are app-level convenience values. The key point is they are non-binding. |
| `MAX_SPAWN_COUNT = 20` | ACCEPTABLE | Safety cap. No PTU basis, but a reasonable UI guard against accidental massive generation. |
| `densityMultiplier` removed from `TableModification` interface | CORRECT | It had no PTU basis as a spawn count scaler. DB column preserved (no migration risk). |

### `app/server/services/encounter-generation.service.ts`

| Item | Status | Notes |
|------|--------|-------|
| `calculateSpawnCount` removed | CORRECT | The function derived spawn count from density -- a non-PTU concept. |
| `CalculateSpawnCountInput` removed | CORRECT | Associated type no longer needed. |
| `generateEncounterPokemon` unchanged | CORRECT | The core weighted random selection with diversity enforcement is unrelated to the density/significance separation. It correctly takes `count` as an input. |

### `app/server/api/encounter-tables/[id]/generate.post.ts`

| Item | Status | Notes |
|------|--------|-------|
| `count` from request body (default 4) | CORRECT | GM provides spawn count. Default 4 is a safe backward-compat value. |
| Clamped to [1, MAX_SPAWN_COUNT] | CORRECT | Input validation. |
| `density` in response meta as `DensityTier` | CORRECT | Still informational -- returned for display, not used mechanically. |
| `densityMultiplier` removed from meta | CORRECT | No longer relevant to generation. |
| Modification only affects species pool | CORRECT | Comment on line 70 explicitly states this. The modification loop only adds/removes/overrides entries in the pool. |

### `app/stores/encounterTables.ts`

| Item | Status | Notes |
|------|--------|-------|
| `generateFromTable` requires `count` | CORRECT | No longer derives count from density. |
| `density` in meta type (informational) | CORRECT | Display only. |
| `densityMultiplier` absent from meta type | CORRECT | Clean removal. |
| `createModification` / `updateModification` no longer pass `densityMultiplier` | CORRECT | The parameter is removed from the method signatures. |

### `app/components/habitat/GenerateEncounterModal.vue`

| Item | Status | Notes |
|------|--------|-------|
| Explicit count spinner (min 1, max 20) | CORRECT | GM sets spawn count directly. |
| `count` defaults to `DENSITY_SUGGESTIONS[table.density].suggested` | ACCEPTABLE | Using the suggestion as a default is a reasonable UX choice. The GM can immediately change it. |
| Density suggestion shown as italic hint | CORRECT | Non-binding informational text. |
| Density badge in table info (display only) | CORRECT | Shows the tier name, not a spawn range. |
| `count` passed to `generateFromTable` | CORRECT | Direct mapping from UI input to API. |

### `app/components/encounter-table/ModificationCard.vue`

| Item | Status | Notes |
|------|--------|-------|
| `densityMultiplier` editor removed | CORRECT | No slider, no preset buttons, no `parentDensity` prop. |
| `parentEntries` prop remains | CORRECT | Still needed for species comparison (isNewEntry check). |
| Modifications show species changes only | CORRECT | Weight overrides, additions, and removals are the only modification effects displayed. |

### `app/components/encounter-table/TableEditor.vue`

| Item | Status | Notes |
|------|--------|-------|
| Density display shows `getDensityDescription` | CORRECT | Shows flavor text instead of spawn range. |
| Settings modal density help text | CORRECT | "Describes the habitat's population density (informational -- does not control spawn count)" |
| `densityOptions` from `DENSITY_SUGGESTIONS` | CORRECT | Labels include description text. |
| ModificationCard no longer receives `parentDensity` prop | CORRECT | Clean removal. |

### `app/composables/useTableEditor.ts`

| Item | Status | Notes |
|------|--------|-------|
| `getSpawnRange` replaced with `getDensityDescription` | CORRECT | Returns descriptive text instead of "X-Y Pokemon" range string. |
| Imports `DENSITY_SUGGESTIONS` instead of `DENSITY_RANGES` | CORRECT | Clean replacement. |

### `app/components/habitat/EncounterTableCard.vue` & `app/components/encounter-table/TableCard.vue`

| Item | Status | Notes |
|------|--------|-------|
| Density badge shows tier name only | CORRECT | `getDensityLabel` capitalizes the tier name. No spawn range displayed. |

### Tests (`encounterGeneration.test.ts`)

| Item | Status | Notes |
|------|--------|-------|
| `calculateSpawnCount` tests removed | CORRECT | Function no longer exists. |
| `DENSITY_SUGGESTIONS` constant validation tests added | CORRECT | All tiers present, suggestions ordered, within MAX_SPAWN_COUNT. |
| `MAX_SPAWN_COUNT` test added | CORRECT | Verifies the cap value. |
| Core generation tests unchanged | CORRECT | Weighted selection, diversity enforcement, caps -- all unaffected by density separation. |

### Tests (`encounterTables.test.ts`)

| Item | Status | Notes |
|------|--------|-------|
| `createMockModification` no longer includes `densityMultiplier` | CORRECT | Matches updated `TableModification` interface. |
| All existing tests pass | CORRECT per ticket (65 tests across 2 files). |

---

## Residual `densityMultiplier` in API Serialization

The API endpoints (`index.get.ts`, `[id].get.ts`, `[id].put.ts`, `modifications/index.post.ts`, `modifications/[modId].put.ts`, `modifications/[modId].get.ts`) still read `densityMultiplier` from the Prisma model and include it in API responses.

**Is this a PTU correctness issue?** No. The design spec explicitly states: "Column preserved in DB; only generation logic stops reading it; UI removes editor; data intact for future reference." The field is inert -- nothing in the generation or UI logic uses the value. This is a backward-compat / data preservation decision, not a rule violation.

**Observation:** The `modifications/index.post.ts` endpoint still accepts and validates `densityMultiplier` from the request body (lines 34-36). Since the UI no longer sends this field, this code path is effectively dead. A future cleanup ticket could remove it, but it is not a PTU correctness concern.

---

## Risk Assessment

| Risk | Level | Assessment |
|------|-------|-----------|
| P0 breaks existing workflows | LOW | Default count of 4 if not provided ensures backward compat. UI defaults to density suggestion. |
| Data loss from densityMultiplier removal | NONE | DB column preserved. Only TypeScript interface and UI removed. |
| Density suggestions mislead GMs | LOW | Values (2/4/6/8) are reasonable. The hint text and italic styling clearly signal they are suggestions, not rules. PTU has no prescribed numbers here, so any app-provided hint is acceptable as long as it's labeled as non-binding. |
| Missing significance multiplier | N/A | P1 scope. Not a P0 gap. |

---

## Summary

The P0 implementation correctly addresses all five review focus areas:

1. **Density does not equal spawn count** -- `DENSITY_RANGES` (which mapped density to count) is replaced by `DENSITY_SUGGESTIONS` (informational hints). No code path derives spawn count from density.
2. **Level budget** -- Encounter size is now determined by the GM's explicit input, consistent with PTU's "work backwards from Experience" guideline (p. 473). The level-budget calculator helper is deferred to P2 per ptu-rule-060.
3. **Significance** -- Correctly identified as an XP multiplier (x1-x5+), not a spawn modifier. No significance logic exists yet (P1 scope), but the removal of `densityMultiplier` eliminates the previous conflation.
4. **DensityMultiplier removal** -- Removed from TypeScript interface, UI, generation logic, store signatures, and test mocks. DB column preserved. API serialization still reads it (inert).
5. **Spawn count** -- Explicit GM input via number spinner, clamped to [1, 20], defaulting to the density suggestion. No derivation from density mechanics.

No PTU rule violations found. Implementation aligns with PTU 1.05 Chapter 11 (pp. 460, 473).
