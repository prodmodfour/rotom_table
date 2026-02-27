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
