---
id: refactoring-125
title: "CombatantCard.vue exceeds 800-line file size limit (930 lines)"
priority: P2
severity: MEDIUM
status: in-progress
domain: encounter
source: code-review-295 C1
created_by: code-review
created_at: 2026-03-04
affected_files:
  - app/components/encounter/CombatantCard.vue
  - app/components/encounter/CombatantGmActions.vue
---

## Summary

CombatantCard.vue was 930 lines after previous fix cycles reduced it from 999. Contains: initiative list item rendering, damage/healing controls, status condition management, mount relationship display, capture workflow, SCSS for all.

## Problem

File exceeds 800-line CRITICAL threshold. Needs extraction of self-contained sections into sub-components.

## Resolution Log

### Extraction: CombatantGmActions.vue

Extracted the entire GM actions panel into `CombatantGmActions.vue` (286 lines):
- **Template**: Damage/heal input controls, quick action buttons (+T, CS, ST), Use Item button, Act button, Switch/Fainted Switch/Force Switch buttons, Remove button, all four modals (TempHpModal, CombatStagesModal, StatusConditionsModal, UseItemModal)
- **Script**: damageInput/healInput state, modal visibility state, switch button computed properties (canShowSwitchButton, isSwitchDisabled, canShowFaintedSwitchButton, isFaintedSwitchDisabled, canShowForceSwitchButton), action handler functions
- **SCSS**: action-row, use-item-btn, btn-icon styles

Props passed from parent: combatant, displayName, currentTempHp, currentStages, statusConditions, entityTypes.
Events forwarded: damage, heal, stages, status, openActions, remove, switchPokemon, faintedSwitch, forceSwitch.

### Commits

| Hash | Description | Files |
|------|-------------|-------|
| 53fcd7e8 | Extract CombatantGmActions from CombatantCard | +CombatantGmActions.vue |
| 28c31aa3 | Use CombatantGmActions in CombatantCard | CombatantCard.vue |
| 9c237a93 | Remove unused __actions SCSS | CombatantCard.vue |
| 99e7caf5 | Update encounter CLAUDE.md | CLAUDE.md |

### Result

- CombatantCard.vue: 930 lines -> 585 lines (345 lines removed)
- CombatantGmActions.vue: 286 lines (new)
- All behavior preserved, no functional changes
