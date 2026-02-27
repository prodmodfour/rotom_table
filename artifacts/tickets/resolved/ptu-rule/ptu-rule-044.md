---
ticket_id: ptu-rule-044
priority: P2
status: resolved
domain: combat
matrix_source:
  rule_ids:
    - combat-R059
    - combat-R060
    - vtt-grid-R022
    - vtt-grid-R028
  audit_files:
    - matrix/combat-audit.md
    - matrix/vtt-grid-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Movement-modifying conditions (Stuck, Slowed) and speed-modifying combat stages/maneuvers (Sprint +50%) are tracked in the combat system but not enforced during VTT grid movement. The grid movement validation ignores these combat state modifiers.

## Expected Behavior (PTU Rules)

- Stuck: cannot shift, movement actions cost double
- Slowed: reduce all movement speeds by half
- Speed CS: modifies effective speed for movement
- Sprint: +50% movement speed for the turn

## Actual Behavior

These conditions/modifiers are displayed in the combat UI but the VTT grid movement system does not read or enforce them when validating click-to-move.

## Resolution Log

**Date:** 2026-02-20
**Status:** in-progress (code complete, awaiting review)

### Changes Made

1. **`app/composables/useGridMovement.ts`**: Added `applyMovementModifiers()` function that reads the combatant's `statusConditions` and `tempConditions` to adjust effective speed:
   - **Stuck**: Halves effective speed (`Math.floor(speed / 2)`)
   - **Slowed**: Halves effective speed (`Math.floor(speed / 2)`)
   - **Speed CS**: Applies stage multiplier (-6 to +6, same table as `useCombat.ts`)
   - **Sprint**: +50% speed (`Math.floor(speed * 1.5)`) when `tempConditions` includes 'Sprint'
   - Minimum speed of 1 preserved (combatant can always move at least 1 cell)

   The `getSpeed()` function now calls `applyMovementModifiers()` after determining base speed, so both `isValidMove` and the movement range display respect these modifiers.

2. **`app/composables/useEncounterActions.ts`**: When Sprint maneuver is executed, adds 'Sprint' to `combatant.tempConditions`. This is the same pattern used for Take a Breather's Tripped/Vulnerable.

3. **`app/server/api/encounters/[id]/next-turn.post.ts`**: Clears `tempConditions` array when advancing past a combatant's turn. This ensures Sprint's +50% bonus expires at end of turn, and Tripped/Vulnerable from Take a Breather also expire correctly (fixing a pre-existing gap in tempConditions lifecycle).

### Design Notes

- Stuck and Slowed stack multiplicatively: a combatant with both conditions gets speed quartered.
- Sprint is applied AFTER Stuck/Slowed/Speed CS, so it boosts the already-modified speed.
- Speed CS uses the same multiplier table as `useCombat.ts` (0.4x at -6 through 2.2x at +6).

### Verification

All 546 unit tests pass.
