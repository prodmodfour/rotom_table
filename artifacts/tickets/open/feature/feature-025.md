---
id: feature-025
title: "Per-combatant Darkvision/Blindsense tracking to auto-negate darkness penalties"
priority: P2
severity: medium
status: open
domain: encounter-tables
source: decree-048
created_by: decree-facilitator
created_at: 2026-03-04
affected_files:
  - app/types/encounter.ts
  - app/composables/useMoveCalculation.ts
  - app/components/encounter/
---

## Summary

Per decree-048, implement per-combatant vision capability tracking so darkness penalties from environment presets can be automatically negated for combatants with Darkvision or Blindsense.

## Required Implementation

1. Add a vision capabilities field to the combatant model (or encounter-level override) that tracks:
   - Darkvision (negates Blindness / -6 penalty)
   - Blindsense (negates Total Blindness / -10 penalty)
   - Light source (negates penalties within illuminated area)
2. When calculating accuracy penalties from environment presets, check the attacking combatant's vision capabilities and skip the penalty if applicable.
3. Provide a GM-accessible UI to toggle vision capabilities per combatant during encounters.

## Notes

- This is a future enhancement — current behavior (GM text note) is acceptable interim.
- Pokemon species data may eventually include Darkvision/Blindsense flags from ability/capability data, but manual GM toggle is sufficient for now.
- PTU references: Darkvision negates Blindness (07-combat.md:1699-1700), Blindsense negates Total Blindness (07-combat.md:1716-1717).
