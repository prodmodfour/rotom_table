---
ticket_id: ptu-rule-104
ticket_type: ptu-rule
priority: P1
status: in-progress
domain: combat
topic: type-immunity-enforcement
source: decree-012
affected_files:
  - app/server/api/encounters/[id]/status.post.ts
  - app/composables/useTypeChart.ts
created_at: 2026-02-26T18:00:00
---

## Summary

Enforce type-based status condition immunities server-side with a GM override flag.

## PTU Rule

Electric immune to Paralysis, Fire immune to Burn, Ghost immune to Stuck/Trapped, Ice immune to Frozen, Poison/Steel immune to Poison (p.239).

## Current Behavior

Type-immunity mapping exists client-side in `useTypeChart.ts` (lines 12-20), but `status.post.ts` performs no type-immunity check. Server accepts any status on any type.

## Required Behavior

1. Server checks target's types against type-immunity mapping before applying status
2. If immune, reject with informative error (e.g., "Fire-type Pokemon are immune to Burn")
3. Accept `override: true` parameter to force the status through (for edge cases)
4. Client UI should show warning when attempting immune status, with confirmation prompt that sends override flag

## Notes

- Type-immunity map may need to be shared between client and server (extract to shared utility)
- Related: decree-012 establishes the "enforce by default, override for edge cases" pattern

## Resolution Log

### Implementation (slave/2-dev-combat-initiative-immunity branch)

**Files changed:**
- `app/utils/typeStatusImmunity.ts` — NEW: shared type-status immunity map and helpers
- `app/composables/useTypeChart.ts` — refactored to use shared utility
- `app/server/api/encounters/[id]/status.post.ts` — server-side immunity check with 409 rejection
- `app/stores/encounterCombat.ts` — added `override` parameter to status methods
- `app/composables/useEncounterActions.ts` — passes override flag, shows alert on 409
- `app/components/encounter/StatusConditionsModal.vue` — IMMUNE tags, warning banner, "Force Apply" button
- `app/components/encounter/CombatantCard.vue` — passes entity types and override to modal
- `app/components/gm/CombatantSides.vue` — passes override through event chain
- `app/components/encounter/GMActionModal.vue` — updated emit type for override

**Commits:** 590dffb, ac2c68c, 77fa3bb, 4e8d498, a81da94, 55c6fc8, 6e8c203, 9a8ff96, a9c9193

**Approach:**
1. Extracted `TYPE_STATUS_IMMUNITIES` map to `app/utils/typeStatusImmunity.ts` (shared between server/client)
2. Server checks Pokemon types against immunity map before applying status; rejects with 409 + informative message
3. `override: true` parameter bypasses the check (GM override per decree-012)
4. Client StatusConditionsModal shows IMMUNE tags on immune checkboxes, warning banner, and "Force Apply (GM Override)" button
5. Quick add/remove in GMActionModal shows alert on rejection guiding user to full modal

### Fix Cycle (code-review-186 CHANGES_REQUIRED)

**Commits:** 4294073, 1d43b60

**Fixes:**
- **MED-2** (4294073): `StatusConditionsModal.vue` — replaced `.push()` and `.splice()` in `toggleStatus` with immutable patterns (`[...arr, item]` and `.filter()`)
- **MED-1** (1d43b60): `app-surface.md` — added `typeStatusImmunity.ts` utility and new service functions (calculateCurrentInitiative, reorderInitiativeAfterSpeedChange, saveInitiativeReorder)
