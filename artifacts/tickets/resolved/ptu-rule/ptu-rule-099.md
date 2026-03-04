---
ticket_id: ptu-rule-099
ticket_type: ptu-rule
priority: P1
status: in-progress
domain: combat
source: decree-006
affected_files:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/stages.post.ts
created_at: 2026-02-26
---

# ptu-rule-099: Dynamic initiative reorder on Speed CS change

## Problem

Initiative is currently static — calculated once at encounter start. Per decree-006, initiative should dynamically update when Speed combat stages change, without granting extra turns.

## Required Changes

1. **Initiative recalculation**: When combat stages change (especially Speed), recalculate initiative values for all combatants using their CS-modified Speed.
2. **Re-sort remaining turns**: After recalculation, re-sort only combatants who haven't acted this round. Combatants who already acted retain their position as "done."
3. **Acted flag**: Track which combatants have acted this round. Reordering never moves an acted combatant back into the unacted queue.
4. **Trigger points**: Initiative recalculation triggers on: status condition application (Paralysis), stage changes, any effect modifying Speed CS.
5. **WebSocket sync**: Broadcast updated turn order to all clients after reorder.

## PTU Reference

- p.227: "Initiative is simply their Speed Stat"
- p.235: Combat Stages persist until switch-out or encounter end

## Acceptance Criteria

- Speed CS changes trigger immediate initiative recalculation
- Turn order re-sorts for remaining (unacted) combatants
- Combatants who already acted this round cannot act again due to reorder
- Tie-breaking is consistent (re-use existing tie-break or re-roll)
- WebSocket broadcasts updated turn order

## Resolution Log

### Implementation (slave/2-dev-combat-initiative-immunity branch)

**Files changed:**
- `app/server/services/combatant.service.ts` — added `calculateCurrentInitiative()` function
- `app/server/services/encounter.service.ts` — added `reorderInitiativeAfterSpeedChange()` and `saveInitiativeReorder()` functions
- `app/server/api/encounters/[id]/stages.post.ts` — triggers reorder when speed CS changes
- `app/server/api/encounters/[id]/status.post.ts` — triggers reorder when status affects speed CS (Paralysis)
- `app/server/api/encounters/[id]/breather.post.ts` — triggers reorder after stage reset
- `app/stores/encounter.ts` — sync `hasActed` in WebSocket surgical update

**Commits:** 8b7728d, 19b063e, f5a22bf, 666e010, 9245d99, c1ed289

**Approach:**
1. `calculateCurrentInitiative()` mirrors `buildCombatantFromEntity` logic but uses current CS-modified speed
2. `reorderInitiativeAfterSpeedChange()` splits turn order into acted (frozen) + unacted (re-sortable), re-sorts unacted by new initiative with rolloff for ties
3. Three trigger points: `stages.post.ts` (direct speed change), `status.post.ts` (Paralysis auto-CS), `breather.post.ts` (stage reset)
4. WebSocket sync via existing `encounter_update` broadcast mechanism — updated encounter data includes new turn orders and initiative values

### Fix Cycle (code-review-186 CHANGES_REQUIRED)

**Commits:** 89615d4, f48c4a6, d7df3c9

**Fixes:**
- **HIGH-1** (89615d4): `stages.post.ts` — replaced `'speed' in body.changes` with `stageResult.changes.speed?.change !== 0` to only trigger reorder on actual speed CS value changes
- **HIGH-2** (f48c4a6): `next-turn.post.ts` — added full `turnState` reset to `resetCombatantsForNewRound` (hasActed, standardActionUsed, shiftActionUsed, swiftActionUsed, canBeCommanded, isHolding)
- **MED-3** (d7df3c9): `breather.post.ts` — track speed CS before/after reset+reapply cycle, only trigger initiative reorder when speed actually changed

### Fix Cycle 2 (code-review-192 CRITICAL-1 + rules-review-169 HIGH-1)

**Commits:** 65cfcc8

**Fixes:**
- **CRITICAL-1** (65cfcc8): `stages.post.ts` — replaced `stageResult.changes.speed?.change !== 0` with `stageResult.changes.speed != null && stageResult.changes.speed.change !== 0` to prevent false-positive initiative reorders on non-speed stage changes (`undefined !== 0` was always true)
