# Rules Review 080

**Ticket:** refactoring-033
**Commits:** b7feca3, 74568fc
**File:** `app/components/encounter-table/TableEditor.vue`
**Reviewer:** Game Logic Reviewer
**Date:** 2026-02-20

## Scope

Refactoring-033 replaced four hardcoded `<option>` elements in the density tier dropdown with a `v-for` loop over a `densityOptions` array derived from the `DENSITY_RANGES` constant. This is a UI label fix -- no game mechanics code was touched.

## PTU Mechanics Audit

### Density Tiers — APP-DEFINED, NOT PTU

PTU 1.05 does not define population density tiers or spawn count ranges. The four-tier system (sparse, moderate, dense, abundant) and the `DENSITY_RANGES` constant are entirely app-defined homebrew for GM convenience. This was previously confirmed in rules-review-051 and rules-review-060.

Since these values are not PTU rules, there is no PTU correctness concern -- only internal consistency between what the UI displays and what the generation logic uses.

### DENSITY_RANGES Values — VERIFIED CONSISTENT

The single source of truth is `app/types/habitat.ts:17-22`:

| Tier | min | max |
|------|-----|-----|
| sparse | 2 | 4 |
| moderate | 4 | 8 |
| dense | 8 | 12 |
| abundant | 12 | 16 |

The fix derives dropdown labels directly from this constant via `Object.entries(DENSITY_RANGES)`, so the labels now display these exact values (e.g., "Sparse (2-4 Pokemon)"). This eliminates the prior mismatch where the dropdown showed wrong ranges (1-2, 2-4, 4-6, 6-8).

### Encounter Generation Logic — NOT CHANGED

- `app/server/api/encounter-tables/[id]/generate.post.ts` reads from `DENSITY_RANGES` at line 109 -- untouched
- `app/composables/useTableEditor.ts` `getSpawnRange()` reads from `DENSITY_RANGES` at line 104 -- untouched
- `app/components/habitat/GenerateEncounterModal.vue` reads from `DENSITY_RANGES` at line 350 -- untouched
- No server-side logic, spawn count calculation, or density multiplier code was modified

### Label Format — CORRECT

The generated label format `${tier.charAt(0).toUpperCase() + tier.slice(1)} (${range.min}-${range.max} Pokemon)` produces:
- "Sparse (2-4 Pokemon)"
- "Moderate (4-8 Pokemon)"
- "Dense (8-12 Pokemon)"
- "Abundant (12-16 Pokemon)"

This matches the format previously used by the hardcoded labels and is consistent with how `getSpawnRange()` displays ranges elsewhere in the UI.

### Tier Ordering — VERIFIED

`Object.entries()` on `DENSITY_RANGES` preserves insertion order (sparse, moderate, dense, abundant), which matches the original hardcoded order and the logical progression from least to most Pokemon.

## Changes Summary

| Line | Change | PTU Impact |
|------|--------|------------|
| 373-376 | Replaced 4 `<option>` elements with `v-for` over `densityOptions` | None |
| 400 | Added import of `DENSITY_RANGES` and `DensityTier` from `~/types` | None |
| 409-412 | Added `densityOptions` computed from `Object.entries(DENSITY_RANGES)` | None |

## Verdict

**PASS** -- No PTU game mechanics were altered. The density tier system is entirely app-defined homebrew, and this fix simply aligns the UI dropdown labels with the authoritative `DENSITY_RANGES` constant that was already used by the generation logic and info panel. The fix is a strict improvement to internal consistency with no gameplay impact.
