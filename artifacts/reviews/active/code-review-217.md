---
review_id: code-review-217
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-107
domain: combat
commits_reviewed:
  - 4faef76
  - c46ad18
  - 2e47c3a
  - 904c765
  - 1f8aec1
  - 3bae724
  - d6d69f3
  - 790ebdc
files_reviewed:
  - app/components/encounter/DeclarationPanel.vue
  - app/components/encounter/DeclarationSummary.vue
  - app/server/routes/ws.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/declare.post.ts
  - app/pages/gm/index.vue
  - app/pages/group/_components/EncounterView.vue
  - app/components/gm/EncounterHeader.vue
  - app/components/gm/CombatantSides.vue
  - app/components/group/InitiativeTracker.vue
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/stores/encounter.ts
  - app/server/services/encounter.service.ts
  - app/tests/unit/api/league-battle-phases.test.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 3
reviewed_at: 2026-02-28T16:30:00Z
follows_up: code-review-202
---

## Review Scope

P1 implementation of ptu-rule-107 (League Battle two-phase trainer system), following the APPROVED P0 (code-review-202 + rules-review-178). This tier covers:

- **DeclarationPanel** (GM form during `trainer_declaration` phase)
- **DeclarationSummary** (read-only declaration list with resolving/resolved states)
- **WebSocket sync** for `trainer_declared` and `declaration_update` events
- **Auto-skip** fainted trainers during declaration and undeclared trainers during resolution
- **GM page** and **Group encounter view** integration
- **Phase labels** showing turn order direction across EncounterHeader, CombatantSides, InitiativeTracker

8 commits reviewed. No P2 spec exists -- P1 is the final tier for this feature.

## Decree Compliance

- **decree-021** (two-phase trainer system): Fully respected. Declaration phase shows low-to-high direction, resolution shows high-to-low. Components correctly read from `currentPhase` and the store's `currentDeclarations` getter filters by round. Phase labels reference decree-021 in tooltips.
- **decree-006** (dynamic initiative reorder): Not directly modified in P1. The P0 fix (commit `c53c70d`) made `reorderInitiativeAfterSpeedChange` phase-aware, which remains intact. P1 adds skip logic that operates after turn advancement, compatible with reorder semantics.
- **decree-005** (status CS auto-apply): Not affected by P1 changes.
- **decree-012** (type immunity enforcement): Not affected by P1 changes.

## Issues

### HIGH

#### H1: No unit tests for `skipFaintedTrainers` and `skipUndeclaredTrainers` behavioral changes

**File:** `app/server/api/encounters/[id]/next-turn.post.ts`, `app/tests/unit/api/league-battle-phases.test.ts`

P1 commit `904c765` added two new pure functions (`skipFaintedTrainers`, `skipUndeclaredTrainers`) and integrated them into the next-turn logic at 5 call sites. These functions alter turn progression behavior -- a fainted trainer at position 0 of declaration causes the entire declaration phase to be skipped to the first non-fainted trainer; an all-fainted trainer set cascades straight to pokemon phase.

The existing test file (`league-battle-phases.test.ts`) does NOT include these skip functions in its `simulateNextTurn` helper and has no test cases for:
- Fainted trainer being skipped during declaration
- Multiple consecutive fainted trainers being skipped
- All trainers fainted cascading to pokemon phase
- Undeclared trainer being skipped during resolution
- All trainers skipped during resolution cascading to pokemon

Per Senior Reviewer L1 (verify test coverage for behavioral changes), this is a HIGH issue. These are edge cases that touch turn progression correctness. The existing test suite would not catch a regression in skip logic.

**Required:** Add test cases for `skipFaintedTrainers` and `skipUndeclaredTrainers`. Update the `simulateNextTurn` helper to include the skip logic, or test the pure functions directly with their own describe block.

### MEDIUM

#### M1: `app-surface.md` missing new components and WebSocket events

**File:** `.claude/skills/references/app-surface.md`

The P0 fix cycle correctly added the `POST /api/encounters/:id/declare` endpoint to app-surface.md (HIGH H2 from code-review-198). However, the P1 implementation adds:
- Two new components: `DeclarationPanel.vue`, `DeclarationSummary.vue`
- Two new WebSocket events: `trainer_declared`, `declaration_update`

Neither the new components nor the new WebSocket events are documented in app-surface.md. The WebSocket events section (line ~66) lists broadcast events but does not mention `trainer_declared` or `declaration_update`. Since app-surface.md is the canonical feature map for all skills, omitting these creates discoverability gaps for future audits and UX sessions.

**Required:** Add `DeclarationPanel` and `DeclarationSummary` to the GM encounter page component listing. Add `trainer_declared` and `declaration_update` to the WebSocket events documentation.

#### M2: Hardcoded color values instead of SCSS variable `$color-accent-violet`

**Files:** `DeclarationPanel.vue`, `DeclarationSummary.vue`, `EncounterHeader.vue`, `CombatantSides.vue`

The project defines `$color-accent-violet: #7c3aed` in `_variables.scss`. The P1 implementation uses the raw hex `#7c3aed` in 15+ locations across 4 files and `#a78bfa` (light violet) in 5+ locations. This creates a maintenance burden -- if the league battle accent color needs to change, every hardcoded instance must be found and updated.

Examples:
- `DeclarationPanel.vue` line 114: `rgba(#7c3aed, 0.12)` should be `rgba($color-accent-violet, 0.12)`
- `DeclarationSummary.vue` line 93: `color: #a78bfa` should reference a variable
- `EncounterHeader.vue` line 373: `linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)` should use variables
- `CombatantSides.vue` line 274: same pattern

**Required:** Replace all raw `#7c3aed` with `$color-accent-violet`. Define a `$color-accent-violet-light: #a78bfa` variable (or similar) for the lighter shade and use it throughout. This is a straightforward find-and-replace.

#### M3: Declaration progress counter includes fainted trainers in denominator

**File:** `app/components/encounter/DeclarationPanel.vue` (lines 76-79)

```typescript
const declarationProgress = computed(() => {
  const trainers = encounterStore.trainersByTurnOrder
  const declared = encounterStore.currentDeclarations.length
  return `${declared + 1} of ${trainers.length}`
})
```

`trainersByTurnOrder` returns ALL trainers from the `trainerTurnOrder` array, including fainted ones that will be auto-skipped by `skipFaintedTrainers`. If there are 4 trainers and 1 is fainted, the progress shows "X of 4" but only 3 will ever declare. The numerator (`declared + 1`) correctly advances past skipped trainers (since they never submit a declaration), but the denominator overstates the total.

This creates a confusing display: e.g., after 2 declarations with 1 fainted trainer, it shows "3 of 4" followed by an immediate phase transition rather than the expected "3 of 3" or "3 of 4" then "4 of 4".

**Required:** Filter the denominator to exclude fainted trainers: `trainers.filter(t => t.entity.currentHp > 0).length`. This aligns the progress display with the actual number of trainers who will declare.

## What Looks Good

1. **Clean component separation.** DeclarationPanel (GM input) and DeclarationSummary (read-only display) have clear single responsibilities. The panel handles form state and submission; the summary handles display and visual state (resolving/resolved). Neither component contains business logic beyond what the store provides.

2. **Correct decree-021 compliance.** The phase label system across EncounterHeader, CombatantSides, and InitiativeTracker all use the same `PHASE_LABELS` map with directional arrows (Low -> High, High -> Low). Tooltips cite decree-021 explicitly.

3. **Solid edge case handling in next-turn.post.ts.** The `skipFaintedTrainers` and `skipUndeclaredTrainers` functions are clean while loops with well-documented JSDoc. They handle cascading scenarios (all trainers fainted -> skip to pokemon; no pokemon -> new round). The skip logic is called at all 5 necessary integration points: after advancing during declaration, after advancing during resolution, at transition to resolution, at new round start from resolution->declaration, and at new round start from pokemon->declaration.

4. **Immutable declaration building.** The `declare.post.ts` endpoint creates a new array via `[...declarations, declaration]` rather than mutating the parsed array. The declaration object itself is built as a new object literal.

5. **WebSocket integration follows established patterns.** The `trainer_declared` and `declaration_update` events are gated to GM role in ws.ts, consistent with how `encounter_update`, `turn_change`, and other GM-originated events are handled. The GM page broadcasts via the existing `encounter_update` event after declaration submission (line 443-449 of gm/index.vue).

6. **Scoped validation in declare.post.ts.** Phase check, current-turn check, human-type check, and duplicate-declaration check are all well-sequenced with informative error messages. The `VALID_ACTION_TYPES` constant prevents invalid action types at the API level.

7. **DeclarationSummary resolving/resolved logic is correct.** `isCurrentlyResolving` checks that the current phase is `trainer_resolution` and the current combatant matches. `isResolved` checks that the combatant's index in turnOrder is before `currentTurnIndex`. Both correctly handle non-resolution phases by returning false.

8. **Commit granularity is appropriate.** Each of the 7 functional commits (plus 1 docs commit) handles a single logical change. Component creation, WebSocket sync, edge case handling, view integration, and phase labels are all separate commits.

## Verdict

**CHANGES_REQUIRED**

The implementation is solid in its core logic and UI design. The decree-021 two-phase flow is faithfully represented in the UI. However, the lack of unit test coverage for the new skip-fainted/skip-undeclared behavioral changes (H1) is a blocking issue per the project's review standards -- these are turn progression correctness functions that handle edge cases, exactly the kind of code that needs test coverage. The three MEDIUM issues (app-surface gaps, hardcoded colors, progress counter accuracy) should be fixed in the same cycle.

## Required Changes

1. **[H1] Add unit tests for skip functions.** Add test cases in `league-battle-phases.test.ts` covering: single fainted trainer skip, multiple consecutive skips, all-fainted cascade to pokemon, undeclared trainer skip during resolution, all-undeclared cascade. Either update `simulateNextTurn` to include skip logic or test the pure functions directly.

2. **[M1] Update app-surface.md.** Add `DeclarationPanel.vue` and `DeclarationSummary.vue` to the component listing for the GM encounter page. Add `trainer_declared` and `declaration_update` to the WebSocket events section.

3. **[M2] Replace hardcoded violet hex values.** Use `$color-accent-violet` for `#7c3aed`. Define and use a new `$color-accent-violet-light` variable for `#a78bfa`. Apply across DeclarationPanel.vue, DeclarationSummary.vue, EncounterHeader.vue, and CombatantSides.vue.

4. **[M3] Fix progress counter denominator.** Filter fainted trainers from the denominator in DeclarationPanel's `declarationProgress` computed to match the actual number of trainers who will declare.
