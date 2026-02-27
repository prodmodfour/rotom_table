---
ticket_id: refactoring-033
priority: P2
categories:
  - DATA-INCORRECT
affected_files:
  - app/components/encounter-table/TableEditor.vue
estimated_scope: small
status: resolved
created_at: 2026-02-18T18:00:00
found_by: rules-review-028
---

## Summary

The density tier dropdown in the table settings modal hardcodes spawn count labels that don't match the actual `DENSITY_RANGES` constant. Users see wrong numbers when choosing a density tier.

## Findings

### Finding 1: DATA-INCORRECT

- **Location:** `app/components/encounter-table/TableEditor.vue:373-376`
- **Impact:** Users selecting a density tier see misleading spawn counts. The actual encounter generation uses the correct values from `DENSITY_RANGES`, so gameplay is not affected — only the UI label is wrong.
- **Evidence:**

| Tier | Dropdown Label | Actual `DENSITY_RANGES` (`types/habitat.ts:17-22`) |
|------|---------------|------------------------------------------------------|
| sparse | "Sparse (1-2 Pokemon)" | `{ min: 2, max: 4 }` |
| moderate | "Moderate (2-4 Pokemon)" | `{ min: 4, max: 8 }` |
| dense | "Dense (4-6 Pokemon)" | `{ min: 8, max: 12 }` |
| abundant | "Abundant (6-8 Pokemon)" | `{ min: 12, max: 16 }` |

The table-info panel correctly displays `getSpawnRange()` which reads from `DENSITY_RANGES`, so users see the correct range *after* saving. Only the settings dropdown is wrong.

## Suggested Fix

Replace the hardcoded option labels with values derived from `DENSITY_RANGES`:

```vue
<option v-for="tier in densityTiers" :key="tier.value" :value="tier.value">
  {{ tier.label }} ({{ tier.range }} Pokemon)
</option>
```

Where `densityTiers` is computed from `DENSITY_RANGES`. Alternatively, just fix the hardcoded strings to match the constant values.

Estimated commits: 1

## Resolution Log

- **Commit:** `b7feca3` — fix: derive density dropdown labels from DENSITY_RANGES constant
- **Files changed:** `app/components/encounter-table/TableEditor.vue`
- **Approach:** Replaced 4 hardcoded `<option>` elements with a `v-for` loop over a `densityOptions` array derived from `DENSITY_RANGES`. Imported `DENSITY_RANGES` and `DensityTier` from `~/types`. Labels now dynamically reflect the constant values (e.g., "Sparse (2-4 Pokemon)") and will stay in sync if ranges change in the future.
