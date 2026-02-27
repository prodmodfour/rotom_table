---
review_id: code-review-173
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-083
domain: encounter
commits_reviewed:
  - 7642cc7
  - d7c8f91
files_reviewed:
  - app/components/encounter/XpDistributionModal.vue
  - app/assets/scss/components/_xp-distribution-modal.scss (deleted)
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
reviewed_at: 2026-02-26T08:30:00Z
follows_up: null
---

## Review Scope

Refactoring-083 (P0 BUILD-BREAK): The `@import` of the extracted SCSS partial `_xp-distribution-modal.scss` created a nested compilation scope where Nuxt's `additionalData`-injected variables (`$z-index-modal`) did not propagate, breaking the build. The fix inlines the partial back into the component's `<style scoped>` block and deletes the partial file.

2 commits, 2 files touched (+451 / -453 net).

## Issues

### CRITICAL

**C1: XpDistributionModal.vue is 1019 lines -- exceeds 800-line file size limit.**

The component was 569 lines before with the SCSS extracted to a 452-line partial. Inlining the partial pushes it to 1019 lines, which is 219 lines over the project's 800-line hard cap. The breakdown is:
- Template: 254 lines
- Script: 306 lines
- Style: 453 lines

The original extraction approach (separate SCSS partial) was the correct file-size solution but broke the build due to Sass variable scoping. The right fix is to inline the styles (as done here) AND then reduce the file size to comply with the limit. Options:
1. Extract non-modal-specific utility classes (`.form-select`, `.form-input--sm`, `.toggle`, `.btn--sm`, `.btn--ghost`) into shared SCSS mixins or the global stylesheet -- these are generic form/button patterns, not XP-modal-specific.
2. Split the component itself: extract the results phase into a separate `XpDistributionResults.vue` child component (it has its own distinct `.results-*` styling block, ~60 lines of template + ~55 lines of SCSS).

Either approach would bring the file under 800 lines. The current state is a build-fix-only interim.

## What Looks Good

1. **Root cause analysis is correct.** The commit message accurately explains why `@import` in a scoped style block creates a nested compilation context where `additionalData`-injected variables don't propagate. This is a real Nuxt/Sass edge case.
2. **Exact content preservation.** Diff verification confirms the inlined styles are byte-identical to the deleted partial (only a trailing blank line differs). No accidental style changes.
3. **Partial file cleanly deleted.** No orphaned references to `_xp-distribution-modal.scss` remain anywhere in the SCSS directory or Nuxt config.
4. **Consistent with project pattern.** All other modals (GMActionModal, CharacterModal, etc.) use inline scoped styles rather than extracted partials. This fix aligns with the established convention.
5. **Build-breaking P0 correctly prioritized.** Addressed first in the session, before any P4 refactoring work.

## Verdict

**CHANGES_REQUIRED** -- The build fix itself is correct and the approach (inline + delete) is sound, but the resulting file at 1019 lines violates the project's 800-line file size limit (a CRITICAL threshold per project rules). A follow-up commit is needed to bring the file under 800 lines through one of the approaches described in C1.

## Required Changes

1. **C1:** Reduce `XpDistributionModal.vue` below 800 lines. Recommended approach: extract generic form/button utility styles out of the component-scoped block into shared SCSS, and/or split the results phase into a child component. File a new refactoring ticket if this cannot be done immediately.
