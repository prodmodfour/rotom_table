---
ticket_id: ptu-rule-046
priority: P2
status: in-progress
domain: combat
matrix_source:
  rule_ids:
    - combat-R035
    - combat-R037
  audit_file: matrix/combat-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

League battle round structure is incomplete: (1) does not enforce that a player always gets both a trainer turn and a Pokemon turn in each round, and (2) skips the declaration phase (low-to-high speed order) and goes straight to resolution order (high-to-low).

## Expected Behavior (PTU Rules)

League battles: each round has a declaration phase (slowest first) then a resolution phase (fastest first). Each player gets both a trainer action and a Pokemon action per round.

## Actual Behavior

League mode uses the same turn structure as Full Contact — single initiative order, no declaration phase.

## Fix Log

### 2026-02-20: League Battle Declaration Phase Implementation

**Root cause:** League battles used the same flat turnOrder as Full Contact mode, sorting all combatants high-to-low speed with no phase separation.

**Changes made:**

1. **Schema** (`prisma/schema.prisma`): Added `currentPhase`, `trainerTurnOrder`, and `pokemonTurnOrder` columns to persist League battle phase state.

2. **Types** (`types/combat.ts`): Extended `TurnPhase` to `'trainer_declaration' | 'trainer_resolution' | 'pokemon'` (was `'trainer' | 'pokemon'`).

3. **Encounter Service** (`server/services/encounter.service.ts`): Updated `buildEncounterResponse` to read phase data from DB instead of defaulting to empty arrays. Updated `EncounterRecord` and `ParsedEncounter` interfaces.

4. **Start Endpoint** (`server/api/encounters/[id]/start.post.ts`): League battles now start in `trainer_declaration` phase. Trainers sorted low-to-high speed (slowest declares first, fastest reacts per PTU rules). Phase tracking persisted to DB.

5. **Next-Turn Endpoint** (`server/api/encounters/[id]/next-turn.post.ts`): Implemented phase-based turn progression for League battles:
   - `trainer_declaration` phase: walk through trainers low-to-high speed
   - When trainer phase ends, transition to `pokemon` phase (reset turnOrder to pokemonTurnOrder, reset index to 0)
   - When pokemon phase ends, start new round (back to `trainer_declaration`)
   - Full Contact mode unchanged (same linear progression)

6. **Encounter Store** (`stores/encounter.ts`): Added phase fields to WebSocket surgical update handler.

7. **UI - EncounterHeader** (`components/gm/EncounterHeader.vue`): Added purple phase badge showing "Trainer Phase" or "Pokemon Phase" during active League battles with PTU rule tooltips.

8. **UI - CombatantSides** (`components/gm/CombatantSides.vue`): Added phase indicator next to "Current Turn" heading.

9. **UI - Group View** (`components/group/InitiativeTracker.vue`, `pages/group/_components/EncounterView.vue`): Initiative tracker title shows current phase name during League battles.

10. **Supporting endpoints**: Fixed encounters list GET, PUT (undo/redo), and combatant DELETE to handle phase data correctly.

**PTU rule reference:** PTU 1.05 Core Rules, Chapter 7 (Combat), Page 229:
> "In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed. [...] Following that, all Pokemon then act in order from highest to lowest speed."

**What this implementation guarantees:**
- Each round, trainers get turns first (declaration phase), then Pokemon get turns (pokemon phase)
- Trainers declare in low-to-high speed order (slowest first = least information advantage)
- Pokemon act in high-to-low speed order (standard initiative)
- Full Contact mode is completely unaffected
