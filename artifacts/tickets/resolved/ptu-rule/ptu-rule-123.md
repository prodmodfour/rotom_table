---
id: ptu-rule-123
title: "Remove significance presets above x5 (climactic x6, legendary x8)"
priority: P3
severity: MEDIUM
category: ptu-rule
source: decree-030
created_at: 2026-02-28
status: in-progress
---

## Summary

The significance preset system includes `climactic` (x6) and `legendary` (x8) tiers that exceed PTU Core p.460's stated range of "x1 to about x5." Per decree-030, remove these presets and cap at x5.

## Requirements

1. Find the significance presets definition (likely in `app/constants/significancePresets.ts` or similar)
2. Remove `climactic` (x6) and `legendary` (x8) entries
3. Ensure the UI still allows manual/custom numeric input for GMs who want to go beyond x5
4. Verify XP calculations work correctly with the remaining presets
5. Update any related tests

## PTU Reference

- PTU Core p.460: "The Significance Multiplier should range from x1 to about x5"
- decree-030: cap presets at x5

## Affected Code

- `app/constants/significancePresets.ts` (or equivalent)
- Encounter table significance UI components
- XP calculation if it references presets

## Resolution Log

### Fix: Remove climactic and legendary significance presets (decree-030)

**Branch:** `slave/5-developer-ptu-rule-123-20260228`

**Commits:**
- `cd7061d` — Remove climactic (x6) and legendary (x8) from `SIGNIFICANCE_PRESETS` in `app/utils/encounterBudget.ts`. Update `SignificanceTier` type to `'insignificant' | 'everyday' | 'significant'`. Promote 'significant' tier to cover x4-x5 range as the new top preset.
- `f5a6a22` — Remove climactic and legendary from `VALID_SIGNIFICANCE_TIERS` in `app/server/utils/significance-validation.ts` (server-side validation).
- `3c67187` — Update comments in `app/utils/experienceCalculation.ts` to reflect x5 cap (was "1-10", now "typically 1-5"). Update preset object comment.
- `6c23966` — Update Prisma schema comment for `significanceTier` column.

**Files changed:**
- `app/utils/encounterBudget.ts` — Core preset definitions and type
- `app/server/utils/significance-validation.ts` — Server-side tier whitelist
- `app/utils/experienceCalculation.ts` — Derived presets and comments
- `app/prisma/schema.prisma` — Column comment only (no schema change)

**Backward compatibility:**
- Existing encounters with `significanceTier = 'climactic'` or `'legendary'` in the DB will render as "Custom" in the UI (via `resolvePresetFromMultiplier` returning `'custom'` for unrecognized multipliers).
- The numeric `significanceMultiplier` endpoint still accepts 0.5-10, so GMs can manually set values above x5 via custom input.
- UI components (SignificancePanel, XpDistributionModal, StartEncounterModal, GenerateEncounterModal) all iterate `SIGNIFICANCE_PRESETS` dynamically, so no UI changes were needed.

**Verification:**
- Custom numeric input still available in SignificancePanel.vue (line 36-45) and XpDistributionModal.vue (line 55-66)
- XP calculations use the multiplier value directly (not the tier name), so they work unchanged
- No existing unit tests reference climactic/legendary significance tiers (only legendarySpecies for capture rate, which is unrelated)
