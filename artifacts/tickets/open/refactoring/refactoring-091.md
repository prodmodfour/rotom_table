---
id: refactoring-091
title: "Replace alert() calls in create.vue with inline feedback"
priority: P4
severity: LOW
status: in-progress
domain: character-lifecycle
category: EXT-DUPLICATE
source: code-review-203 M1
created_by: slave-collector (plan-20260227-210000)
created_at: 2026-02-27
---

# refactoring-091: Replace alert() calls in create.vue with inline feedback

## Summary

`app/pages/gm/create.vue` uses `window.alert()` for error feedback in 5+ places: `handleSetSkillRank`, `handleSkillEdge`, `createHumanQuick`, `createHuman`, `createPokemon`. These are blocking browser dialogs that disrupt the creation flow.

The project has SCSS warning styles (`.warning-item--warning`) and inline error patterns already used on the same page (validation summary section). Replace all `alert()` calls with inline toast/notification or error banner feedback.

Note: `create.vue` is exactly 800 lines (at project max). This refactoring should also extract SCSS or split template sections to create headroom.

## Affected Files

- `app/pages/gm/create.vue` (800 lines — at project max)

## Suggested Fix

1. Create a composable `useToast` or inline error state to replace `alert()` calls
2. Extract SCSS to shared partial or split template into sub-components to reduce file size below 800 lines

## Resolution Log

- **Commit 1:** `e4ec251` — refactor: extract create page SCSS to shared partial
  - Created `app/assets/scss/components/_create-page.scss` (324 lines of extracted styles)
  - Added `.create-error-banner` class for inline error UI
  - Registered in `app/nuxt.config.ts` css array
- **Commit 2:** `fb9afd4` — refactor: replace alert() calls with inline error banner in create.vue
  - Replaced all 6 `alert()` calls with `errorMessage.value = ...`
  - Added `errorMessage` ref and dismissible error banner in template
  - Removed entire `<style scoped>` block (styles now global in `_create-page.scss`)
  - File reduced from 809 lines to 563 lines (246 line reduction)
  - Async handlers (`createHumanQuick`, `createHuman`, `createPokemon`) clear error on submission start
