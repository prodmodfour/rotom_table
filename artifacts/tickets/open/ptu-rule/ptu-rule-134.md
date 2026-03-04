---
id: ptu-rule-134
title: "Split Dark Cave preset into Dim Cave (-6) and Dark Cave (-10) with RAW penalties"
priority: P2
severity: high
status: open
domain: encounter-tables
source: decree-048
created_by: decree-facilitator
created_at: 2026-03-04
affected_files:
  - app/constants/environmentPresets.ts
  - app/types/encounter.ts
  - app/composables/useMoveCalculation.ts
---

## Summary

Per decree-048, replace the single Dark Cave preset with two RAW-accurate presets:

1. **Dim Cave** — Blindness (-6 accuracy). Represents partial darkness or obscured vision.
2. **Dark Cave** — Total Blindness (-10 accuracy). Represents complete darkness. Additional RAW effects: no map awareness, no Priority/Interrupt moves, Shift penalties.

## Required Implementation

1. Replace `accuracyPenaltyPerMeter` with a flat `accuracyPenalty` field in the `EnvironmentPreset` effect type.
2. Update `app/types/encounter.ts` to reflect the new field name.
3. In `app/constants/environmentPresets.ts`:
   - Replace `DARK_CAVE_PRESET` with `DIM_CAVE_PRESET` (Blindness, -6) and `DARK_CAVE_PRESET` (Total Blindness, -10).
   - Update `BUILT_IN_PRESETS`, `BUILT_IN_PRESET_IDS`, and `PRESET_LABELS`.
   - Dark Cave description should note the additional Total Blindness restrictions (no map awareness, no Priority/Interrupt).
4. Update any code in `useMoveCalculation.ts` that reads `accuracyPenaltyPerMeter` to use `accuracyPenalty` instead.

## Notes

- The environment preset system is a GM reference tool; these are default values the GM can override.
- PTU references: Blindness (07-combat.md:1693-1701), Total Blindness (07-combat.md:1702-1717).
