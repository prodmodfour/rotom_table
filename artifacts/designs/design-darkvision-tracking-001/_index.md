---
design_id: design-darkvision-tracking-001
ticket_id: feature-025
category: FEATURE
scope: FULL
domain: encounter-tables, combat
status: p0-implemented
decree: decree-048
affected_files:
  - app/types/encounter.ts
  - app/composables/useMoveCalculation.ts
  - app/constants/environmentPresets.ts
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/EnvironmentSelector.vue
  - app/components/encounter/MoveTargetModal.vue
  - app/stores/encounter.ts
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/environment.post.ts
new_files:
  - app/utils/visionRules.ts
  - app/components/encounter/VisionCapabilityToggle.vue
---

# Design: Per-Combatant Darkvision/Blindsense Tracking (feature-025)

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Vision capability model on Combatant, B. Manual GM toggle per combatant, C. Accuracy penalty negation based on vision capabilities, D. Vision indicator on CombatantCard | [spec-p0.md](spec-p0.md) |
| P1 | E. Auto-detect Darkvision/Blindsense from Pokemon species capabilities, F. Light source tracking (Illuminate ability, items), G. Server-side accuracy penalty integration in calculate-damage | [spec-p1.md](spec-p1.md) |
| P2 | H. Dark Vision Goggles equipment integration, I. Bulk vision toggle (set all combatants at once), J. Preset-aware vision indicator tooltips, K. WebSocket sync for vision state | [spec-p1.md](spec-p1.md) |

## Summary

Implement per-combatant vision capability tracking so darkness penalties from environment presets (Dim Cave: -6 Blindness, Dark Cave: -10 Total Blindness) can be automatically negated for combatants with Darkvision or Blindsense. This fulfills the "future" clause in decree-048.

### PTU Rules Reference

- **Blindness (07-combat.md:1696-1701):** "-6 to Accuracy Check. This is in perpetual effect in deep darkness, unless the target has Blindsense or Darkvision. Pokemon or Trainers with Blindsense cannot be Blinded."
- **Total Blindness (07-combat.md:1702-1717):** "-10 to Accuracy Check. Total and complete sightlessness. No map awareness, cannot use Priority or Interrupt moves."
- **Darkvision (10-indices-and-reference.md:65-68):** "A Pokemon with the Darkvision Capability never has their vision hampered by a loss of light. They can even see in total darkness and are never Blind or affected by Total Blindness due to low-light conditions."
- **Blindsense (10-indices-and-reference.md:37-46):** "Pokemon and Trainers with Blindsense can function even in complete darkness, as if they had Darkvision, and they can never be Blinded."
- **Dark Vision Goggles (09-gear-and-items.md:1674-1677):** "These Goggles simply grant the Darkvision Capability while worn. $1,000."
- **Illuminate (10-indices-and-reference.md:1562-1566):** Attacks against the user have -2 Accuracy Penalty. Does not affect attackers with Blindsense.

### Related Decrees

- **decree-048 (BINDING):** Dark cave blindness penalties use RAW flat Blindness (-6) / Total Blindness (-10) penalties. Split into 'Dim Cave' and 'Dark Cave' presets. Replace accuracyPenaltyPerMeter with flat accuracyPenalty. Future: per-combatant Darkvision/Blindsense tracking.

### Current State

- Environment presets with accuracy penalties are fully implemented (ptu-rule-134, decree-048).
- `DIM_CAVE_PRESET` applies -6 accuracy penalty (Blindness). `DARK_CAVE_PRESET` applies -10 (Total Blindness).
- `environmentAccuracyPenalty` computed in `useMoveCalculation.ts` applies the flat penalty to ALL combatants equally.
- No per-combatant vision capability tracking exists. The penalty applies uniformly regardless of Darkvision/Blindsense.
- The preset descriptions mention Darkvision/Blindsense as flavor text only.
- Pokemon species data in the Pokedex includes capabilities as a text field, but these are not parsed into structured flags.

### Vision Capability Negation Rules (PTU RAW)

| Capability | Negates Blindness (-6)? | Negates Total Blindness (-10)? |
|---|---|---|
| Darkvision | Yes | Yes (10-indices:67-68: "never Blind or affected by Total Blindness due to low-light conditions") |
| Blindsense | Yes (10-indices:46: "can never be Blinded") | Yes (10-indices:44-45: "function even in complete darkness, as if they had Darkvision") |
| Light Source (within range) | Yes (reduces to dim/lit) | Partial (reduces to Blindness range, not full negation) |
| Dark Vision Goggles | Yes (grants Darkvision) | Yes (grants Darkvision) |

Key insight: Both Darkvision and Blindsense fully negate both Blindness and Total Blindness caused by darkness. They are equivalent for this feature's purposes. The distinction matters only for non-darkness-related Blindness effects (e.g., Flash move), which are out of scope.

## Dependencies

- **decree-048:** Defines the penalty values and preset structure this feature integrates with.
- **ptu-rule-134:** Implemented the Dim Cave / Dark Cave presets that this feature auto-negates.
- **No schema changes required for P0:** Vision capabilities stored as JSON within the Combatant struct (already a JSON blob in the `combatants` column).

## Priority Map

| # | Feature | Current Status | Gap | Priority |
|---|---------|---------------|-----|----------|
| A | Vision capability field on Combatant type | NOT_IMPLEMENTED | No field exists | **P0** |
| B | Vision rules utility (pure functions) | NOT_IMPLEMENTED | No vision logic exists | **P0** |
| C | GM toggle UI for vision per combatant | NOT_IMPLEMENTED | GM must track manually | **P0** |
| D | Accuracy penalty negation (client-side) | NOT_IMPLEMENTED | Penalty applies to all | **P0** |
| E | Vision indicator on CombatantCard | NOT_IMPLEMENTED | No visual feedback | **P0** |
| F | Auto-detect from Pokemon species capabilities | NOT_IMPLEMENTED | Species caps are text blobs | **P1** |
| G | Light source tracking (Illuminate, items) | NOT_IMPLEMENTED | No light source model | **P1** |
| H | Server-side accuracy penalty integration | NOT_IMPLEMENTED | Server ignores vision | **P1** |
| I | Dark Vision Goggles equipment integration | NOT_IMPLEMENTED | Equipment not parsed for caps | **P2** |
| J | Bulk vision toggle (set all at once) | NOT_IMPLEMENTED | One-by-one only | **P2** |
| K | Preset-aware vision tooltips | NOT_IMPLEMENTED | No contextual UI | **P2** |
| L | WebSocket sync for vision state | NOT_IMPLEMENTED | Group view unaware | **P2** |

---

## Atomized Files

- [_index.md](_index.md)
- [shared-specs.md](shared-specs.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [testing-strategy.md](testing-strategy.md)
