---
ticket_id: ptu-rule-056
priority: P3
status: in-progress
design_spec: designs/design-char-creation-001.md
domain: character-lifecycle
matrix_source:
  rule_id: character-lifecycle-R051
  audit_file: matrix/character-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Manual character creation form only covers stats and name. Missing fields: edges, features, skills, classes, age, background, personality, goals. Requires CSV import for full character setup.

## Expected Behavior

Character creation should allow setting all PTU character fields including class selection, skill allocation, feature/edge selection, and biographical details.

## Actual Behavior

The manual creation form is a minimal stub. Full character data can only be entered via CSV import or post-creation PUT endpoint editing.

## Resolution Log

### P1 Follow-up Fixes (2026-02-20, code-review-121)

**H1 — Skill Edge removal now reverts skill rank** (`f29b845`)
- `removeEdge()` in `useCharacterCreation.ts` detects "Skill Edge: X" pattern, decrements the skill rank by one step before removing the edge string. Prevents orphaned rank data.

**H2 — Skill background validation clarified for Skill Edges** (`c95a237`)
- `validateSkillBackground()` accepts optional `edges` parameter. When Skill Edges are present, warning messages append "including Skill Edge modifications" and severity is downgraded to `info`. Eliminates false-positive confusion.

**M1 — Dead `skillEdgeError` code removed** (`f8d7854`)
- Removed unused `skillEdgeError` ref, template error div, and associated SCSS from `EdgeSelectionSection.vue`.

**M4 — Validation uses shared stat constants** (`68e33d7`)
- `validateStatAllocation()` now imports `TOTAL_STAT_POINTS` and `MAX_POINTS_PER_STAT` from `trainerStats.ts` instead of hardcoding `10` and `5`.

### P2 Implementation (2026-02-21)

**Biography fields in composable** (`5b0ab14`)
- Added age, gender, height, weight, backgroundStory, personality, goals, money to `useCharacterCreation` form state
- Wired all biography fields through `buildCreatePayload()`
- Default starting money: 5000 per PTU p.17
- Background story takes precedence over preset name for the DB `background` field

**BiographySection.vue component** (`67fd068`)
- New collapsible section component with age, gender, height (cm with ft/in display), weight (kg with lbs and PTU weight class), background story, personality, goals, money
- All fields optional/nullable. Section toggle controlled via props/emits
- Unit conversion helpers: cmToFeetInches, kgToLbs, computeWeightClass

**CreateMode type and section completion tracking** (`f8bd6c1`)
- Added `CreateMode` ('quick'|'full') type export and `SectionCompletion` interface
- Added `sectionCompletion` computed with per-section indicators for basicInfo, background, edges, classes, stats, biography

**Quick-Create/Full-Create mode toggle in create.vue** (`2c898c4`)
- Restructured create.vue with Quick Create (minimal: name, type, level, raw stats, notes) and Full Create (multi-section PTU-compliant form)
- Mode toggle with lightbulb/books icons
- Full Create includes section progress bar, all P0/P1/P2 sections, BiographySection
- Biography auto-expands for PCs, collapses for NPCs
- Create button always enabled (no hard validation blocks)

### P2 Follow-up Fixes (2026-02-22, code-review-129)

**H1 — cmToFeetInches() rounding bug** (`3374668`)
- Added inches===12 guard so 182cm displays as 6'0" instead of 5'12"

**H2 — computeWeightClass() wrong scale** (`d8c63eb`)
- Replaced Pokemon weight class scale (WC 1-6 in kg) with PTU Trainer scale (WC 3/4/5 in lbs)

**M1 — parseOptionalInt() rejects negative values** (`8c0279f`)
- Added `parsed < 1` guard to treat zero/negative input as null

**M2 — Magic number in section completion** (`c8d4edd`)
- Simplified background section completion to just `hasBackground` (removed `skillsWithRanks >= 5` threshold; validation warnings already cover skill counts)

**M3 — Quick Create money field** (`a34c2f4`)
- PCs now get DEFAULT_STARTING_MONEY (5000); NPCs stay at 0
- Exported DEFAULT_STARTING_MONEY from composable for reuse

**C1 — Extract QuickCreateForm.vue** (`06dca93`)
- Moved Quick Create form template, state, and submission logic into `components/create/QuickCreateForm.vue`
- create.vue reduced from 869 to 756 lines (under 800-line limit)

### P2 Follow-up Fixes (2026-02-23, code-review-133)

**H1 — Scoped CSS inheritance regression** (`27ffffd`)
- `.create-form`, `.create-form__section`, `.create-form__actions`, and `.form-row` styles were trapped in create.vue's `<style scoped>` block, unreachable by QuickCreateForm.vue child component
- Extracted shared styles into `app/assets/scss/_create-form.scss` global partial
- Registered partial in `nuxt.config.ts` SCSS preprocessor imports
- Removed duplicate style definitions from create.vue scoped block

**M1 — Type safety regression in QuickCreateForm emit** (`1180c9c`)
- Added `QuickCreatePayload` interface to `app/types/character.ts` with exact field shapes (name, characterType, level, stats, maxHp, currentHp, money, optional location/notes)
- Replaced `Record<string, unknown>` emit type in QuickCreateForm.vue with `QuickCreatePayload`
- Updated `createHumanQuick` handler in create.vue to accept `QuickCreatePayload`

### Style delivery fix (2026-02-23, code-review-138)

**H1 — _create-form.scss duplicated across all component compilations** (`aec7187`)
- `_create-form.scss` contains bare CSS rules but was registered in `additionalData`, which prepends it to every component's SCSS compilation (127 duplications)
- Removed `@use "~/assets/scss/_create-form.scss" as *;` from `additionalData` in `nuxt.config.ts`
- Added `'~/assets/scss/_create-form.scss'` to the `css` array for single global delivery
- Added `@use 'variables' as *;` at top of `_create-form.scss` so variable references resolve independently
