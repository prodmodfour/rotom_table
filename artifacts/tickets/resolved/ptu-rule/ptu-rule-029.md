---
ticket_id: ptu-rule-029
ticket_type: ptu-rule
priority: P2
status: resolved
source: rules-review-029
domain: healing
affected_files:
  - app/components/common/HealingTab.vue
created_at: 2026-02-18T18:10:00
---

## Summary

Extended rest description for Pokemon lists "Asleep" as a persistent status condition. Per PTU 1.05 p.247, Sleep (Bad Sleep/Good Sleep) is a Volatile Affliction, not Persistent. The data model was corrected by refactoring-008 (commit `63fe747`), but this UI description text was never updated.

## PTU Rule Reference

- **Persistent Afflictions** (`core/07-combat.md#Persistent-Afflictions`, p.246): Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned
- **Volatile Afflictions** (`core/07-combat.md#Volatile-Afflictions`, p.247): Bad Sleep, Good Sleep, Confused, Cursed, Disabled, Enraged, Flinched, Infatuated, Rage, Suppressed, Tripped, Vulnerable

## Current Behavior

`HealingTab.vue:168`:
```
'Heal HP for 4 hours, clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Asleep), restore daily moves.'
```

## Expected Behavior

Remove "Asleep" from the parenthetical:
```
'Heal HP for 4 hours, clear persistent status conditions (Burned, Frozen, Paralyzed, Poisoned), restore daily moves.'
```

## Impact

Informational UI text only — does not affect game logic (server endpoints determine actual healing behavior). Presents incorrect PTU taxonomy to users. Sleep clears naturally during a 4-hour rest via save checks, so no functional change needed.

## Origin

Pre-existing in original `pokemon/[id].vue`, faithfully copied to `HealingTab.vue` during refactoring-024/026. Downstream artifact of resolved refactoring-008.
