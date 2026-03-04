---
ticket_id: ptu-rule-058
priority: P3
status: in-progress
design_spec: designs/design-density-significance-001.md
domain: encounter-tables
matrix_source:
  rule_ids:
    - encounter-tables-R025
    - encounter-tables-R009
  audit_file: matrix/encounter-tables-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Two conceptual mismatches between app and PTU encounter system: (1) VTT terrain/fog systems are generic tactical tools, not PTU-specific environmental modifier implementations. (2) Density multiplier scales spawn count, but PTU density affects encounter significance/XP reward, not spawn count.

## Expected Behavior (PTU Rules)

Density affects the significance and XP value of encounters. Environmental modifiers affect terrain and encounter difficulty per habitat.

## Actual Behavior

Density is used as a spawn count multiplier. Environmental effects are generic VTT features unconnected to PTU habitat rules.

## Fix Log

### P0 (Density Separation) -- 2026-02-20

Density tier is now a descriptive label only. Spawn count is an explicit parameter in the generation flow. `DENSITY_RANGES` replaced with `DENSITY_SUGGESTIONS` (informational hints). `calculateSpawnCount` removed. `densityMultiplier` removed from TypeScript interface and UI (DB column preserved for backward compat). All unit tests updated and passing (65 tests across 2 files).

**Commits:** `a5434db`, `c2d3b4d`, `1343265`, `c44853f`, `04c4a72`, `dd41e1d`, `e98b8e9`, `68be10d`

### P1 (Significance Multiplier + XP UI) -- 2026-02-21

Added `significanceMultiplier` persistence on Encounter model (Prisma column + type + serialization). New PUT endpoint `/api/encounters/:id/significance` with 0.5-10 range validation. SignificancePanel component in GM encounter sidebar with preset selector (PTU-labeled tiers), difficulty adjustment slider (-1.5 to +1.5), live XP breakdown, player count input, and boss encounter toggle. Store action `setSignificance()` with WebSocket sync. XpDistributionModal now defaults to encounter's persisted significance. Undo/redo and encounter list endpoints updated to include the field.

**Commits:** `ee1a0bd`, `353f342`, `de4339e`, `478b91e`, `ece9de3`, `0dcafb3`, `7c51539`, `645e8e4`, `9c1ddad`, `391eeb4`, `34299b1`
**Files (11):** `schema.prisma`, `encounter.ts` (type), `encounter.service.ts`, `significance.put.ts` (new), `[id].put.ts`, `index.get.ts`, `encounter.ts` (store), `_significance-panel.scss` (new), `SignificancePanel.vue` (new), `gm/index.vue`, `XpDistributionModal.vue`

### P1 Fix (code-review-123 CHANGES_REQUIRED) -- 2026-02-21

Six issues from code-review-123 resolved:
- **C1:** Added NaN/empty guards for v-model.number refs (customMultiplier, playerCount, difficultyAdjustment) in SignificancePanel
- **H1:** Added null guard to defeatedEnemies watcher in SignificancePanel
- **H2:** Added WebSocket broadcast after setSignificance succeeds
- **M1:** Updated app-surface.md with PUT significance endpoint and encounter components
- **M2:** Extracted resolvePresetFromMultiplier + SIGNIFICANCE_PRESET_LABELS to experienceCalculation.ts (resolves refactoring-063)
- **M3:** Fixed significance fallback from ?? 2 to ?? 1.0 in XpDistributionModal

**Commits:** `2d6831b`, `fabb4e5`, `93713fa`, `d3e89b2`, `52206fb`, `c73d0ec`
**Files (4):** `experienceCalculation.ts`, `SignificancePanel.vue`, `XpDistributionModal.vue`, `app-surface.md`

### code-review-126 H1 Fix (XpDistributionModal NaN guards) -- 2026-02-22

Added `safeCustomMultiplier` and `safePlayerCount` computed properties to XpDistributionModal, following the same NaN-safe pattern established in SignificancePanel (P1 Fix C1). Applied to `effectiveMultiplier`, `recalculate()`, `handleApply()`, and template display.

**Commits:** `321bb51`
**Files (1):** `XpDistributionModal.vue`

### P2 (Environmental Modifier Framework) -- 2026-03-04

Added EnvironmentPreset and EnvironmentEffect type definitions. Three built-in presets (Dark Cave, Frozen Lake, Hazard Factory) as constants. New `environmentPreset` JSON field on Encounter model with dedicated PUT endpoint. EnvironmentSelector GM component in encounter sidebar with preset picker, custom preset support, individual effect dismissal, and WebSocket broadcast. Accuracy penalty integration into move calculation flow: `calculateAccuracyThreshold` accepts optional `environmentPenalty`, `useMoveCalculation` reads accuracy_penalty effects from the active preset, and MoveTargetModal displays the environment penalty in the accuracy section.

**Commits:** `58f502d7`, `bb640c74`, `582efc38`, `9564494d`, `c98218e8`, `23f1fb52`, `ca41f198`
**Files (11):** `encounter.ts` (type), `environmentPresets.ts` (new), `schema.prisma`, `encounter.service.ts`, `environment-preset.put.ts` (new), `[id].put.ts`, `encounter.ts` (store), `EnvironmentSelector.vue` (new), `_environment-selector.scss` (new), `damageCalculation.ts`, `useMoveCalculation.ts`, `MoveTargetModal.vue`, `_move-target-modal.scss`, `gm/index.vue`

### P2 Fix Cycle (code-review-330 + decree-048) -- 2026-03-04

Resolved 2 HIGH + 3 MEDIUM issues from code-review-330. Implemented decree-048 (RAW blindness penalties with split cave presets).

- **MED-3:** Converted `EnvironmentEffect` from flat optional-field interface to discriminated union type (`AccuracyPenaltyEffect | TerrainOverrideEffect | StatusTriggerEffect | MovementModifierEffect | CustomEffect`). Compile-time exhaustiveness checking on `effect.type`.
- **MED-1:** Renamed `accuracyPenaltyPerMeter` to `accuracyPenalty` across types, constants, and composable (flat penalty, not per-meter).
- **MED-2:** Stored accuracy penalty as positive number. Removed `Math.abs` wrapper in composable.
- **decree-048:** Split single `DARK_CAVE_PRESET` into `DIM_CAVE_PRESET` (Blindness: -6, PTU 07-combat.md:1699-1700) and `DARK_CAVE_PRESET` (Total Blindness: -10, PTU 07-combat.md:1716-1717).
- **HIGH-1:** Converted `getEnvironmentAccuracyPenalty()` function to `environmentAccuracyPenalty` computed property. Updated MoveTargetModal template to use computed value (eliminates double evaluation per render).
- **HIGH-2:** When `dismissEffect` modifies a built-in preset, creates custom variant ID and sets dropdown to 'custom'. Shows '(modified)' label on badge. Prevents re-selecting original built-in from silently overriding customized version.

**Commits:** `dc566686`, `2b66a066`, `061e18fa`, `8f2c1abe`, `0122da9a`, `3ed80679`
**Files (4):** `encounter.ts` (type), `environmentPresets.ts`, `useMoveCalculation.ts`, `EnvironmentSelector.vue`, `MoveTargetModal.vue`

### P2 Fix Cycle Verification -- 2026-03-04

All 5 issues from code-review-330 verified as resolved on master:

- **HIGH-1 VERIFIED:** `getEnvironmentAccuracyPenalty()` converted to `environmentAccuracyPenalty` computed property in `useMoveCalculation.ts` (line 481). MoveTargetModal uses it as a reactive value (no function calls in template).
- **HIGH-2 VERIFIED:** `dismissEffect` in `EnvironmentSelector.vue` creates custom variant ID (`${currentId}-custom-${Date.now()}`) when modifying built-in preset, sets dropdown to 'custom', shows '(modified)' label via `isModifiedPreset` computed.
- **MED-1 VERIFIED:** `accuracyPenaltyPerMeter` fully renamed to `accuracyPenalty` across types, constants, and composable. Grep confirms zero remaining occurrences.
- **MED-2 VERIFIED:** Penalty stored as positive number (Dim Cave: 6, Dark Cave: 10). No `Math.abs` wrapper in composable — value used directly.
- **MED-3 VERIFIED:** `EnvironmentEffect` is a discriminated union type (`AccuracyPenaltyEffect | TerrainOverrideEffect | StatusTriggerEffect | MovementModifierEffect | CustomEffect`) with compile-time exhaustiveness.

**decree-048 compliance VERIFIED:** Dim Cave = 6 (Blindness, PTU -6), Dark Cave = 10 (Total Blindness, PTU -10). Split presets with correct RAW penalties.
