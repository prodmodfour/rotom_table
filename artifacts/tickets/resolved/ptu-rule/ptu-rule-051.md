---
ticket_id: ptu-rule-051
priority: P3
status: resolved
domain: healing
matrix_source:
  rule_id: healing-R019
  audit_file: matrix/healing-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Take a Breather's forced 2-square shift movement away from enemies is not automated on the VTT grid. The GM must manually move the token after executing a Breather.

## Expected Behavior (PTU Rules)

Per PTU Core: after Taking a Breather, the character must Shift (2 squares) away from all adjacent enemies.

## Actual Behavior

The Breather maneuver applies HP healing and condition removal but does not trigger automatic grid movement.

## Fix Log

### Analysis

Re-read PTU p.245: "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability."

Fully automating "as far away from enemies as possible" would require computing optimal escape positions factoring in all enemy positions, terrain, blocked cells, and movement capabilities. This is a complex pathfinding problem that could also produce unintuitive results. Since the app is a GM tool, the practical approach is to prompt the GM to perform the shift manually with clear visual assistance.

### Changes Made

1. **`app/composables/useEncounterActions.ts`** — `handleExecuteAction` now returns a `BreatherShiftResult` when Take a Breather is executed, signaling the GM page to show the shift prompt.

2. **`app/components/encounter/BreatherShiftBanner.vue`** — New component: a warning-styled banner that appears after breather execution, telling the GM which combatant needs to shift away from enemies. Includes "Move on Grid" button (switches to grid view) and "Dismiss" button.

3. **`app/pages/gm/index.vue`** — Integrated the banner. After breather, auto-switches to grid view so the GM can immediately click the token and move it. Banner auto-dismisses when the pending combatant's token is moved on the grid.

4. **`app/server/api/encounters/[id]/breather.post.ts`** — Move log entry now includes "SHIFT REQUIRED: Move away from all enemies using full movement." so the requirement is visible in the combat log.

5. **`app/constants/combatManeuvers.ts`** — Updated Take a Breather short description to mention the shift requirement.

### Duplicate Code Path Check

Searched all paths that call `takeABreather` or handle `take-a-breather` maneuver. Only one code path exists: `GMActionModal` emits `executeAction` -> `useEncounterActions.handleExecuteAction` -> `encounterCombatStore.takeABreather`. No duplicates found.

### Note on Ticket Summary Correction

The ticket summary mentions "2-square shift" but PTU p.245 actually says "move as far away from enemies as possible, using their highest available Movement Capability" — this is a full movement shift, not limited to 2 squares. The implementation correctly prompts for full movement.
