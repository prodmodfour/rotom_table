---
design_id: design-league-battle-001
ticket_id: ptu-rule-107
category: PTU_RULE
scope: FULL
domain: combat
status: p1-implemented
decree: decree-021
affected_files:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/encounter.service.ts
  - app/stores/encounter.ts
  - app/composables/useCombat.ts
new_files:
  - app/server/api/encounters/[id]/declare.post.ts
  - app/components/encounter/DeclarationPanel.vue
  - app/components/encounter/DeclarationSummary.vue
---

# Design: League Battle Two-Phase Trainer System

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Declaration Data Model, B. Declaration Recording API, C. Phase Transition Logic (declaration -> resolution -> pokemon), D. Resolution Execution | [spec-p0.md](spec-p0.md) |
| P1 | E. Declaration UI Panel, F. Resolution Summary Display, G. WebSocket Sync for Declarations, H. Edge Cases | [spec-p1.md](spec-p1.md) |

## Summary

Implement the true two-phase trainer system for League Battles per PTU p.227 and decree-021. In League Battles, each round's trainer portion follows two distinct phases:

1. **Declaration Phase** (`trainer_declaration`): Trainers declare their actions in order from lowest to highest speed. Actions are recorded but NOT executed. Slower trainers commit first; faster trainers see prior declarations before committing.
2. **Resolution Phase** (`trainer_resolution`): Declared actions resolve in order from highest to lowest speed. The fastest trainer's action executes first, giving them a tactical advantage.
3. **Pokemon Phase** (`pokemon`): After all trainer resolutions complete, Pokemon act in high-to-low speed order (existing behavior).

Currently, `start.post.ts` correctly sets up the declaration phase with low-to-high trainer ordering, but `next-turn.post.ts` skips the resolution phase entirely -- transitioning directly from declaration to pokemon. The `trainer_resolution` TurnPhase type exists in `combat.ts` but is never assigned at runtime.

---

## PTU Rules Reference

### Initiative & Turn Order (PTU Core p.227)

> "During Tournament matches and other League Battles where the Trainer doesn't participate directly in the fighting, all Trainers should take their turns, first, before any Pokemon act. In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed. This allows quicker Trainers to react to their opponent's switches and tactics. Following that, all Pokemon then act in order from highest to lowest speed."

### Switching in League Battles (PTU Core p.229-230)

> "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon."

### Related Decrees

- **decree-021**: Mandates true two-phase implementation. Declaration (low-to-high), resolution (high-to-low). Faster trainers get information advantage.
- **decree-006**: Dynamic initiative reordering on speed CS changes. Affects the order in which trainers declare and resolve.
- **decree-005**: Auto-apply CS from status conditions. Affects effective speed for initiative ordering.

---

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | Declaration data model (recording declared actions) | NOT_IMPLEMENTED | No field to store trainer declarations | **P0** |
| B | Declaration recording API | NOT_IMPLEMENTED | No endpoint to submit a declaration | **P0** |
| C | Phase transition: declaration -> resolution -> pokemon | PARTIAL | `next-turn.post.ts` skips resolution phase | **P0** |
| D | Resolution execution (process declared actions) | NOT_IMPLEMENTED | Resolution phase not wired up | **P0** |
| E | Declaration UI (GM panel showing declaration prompts) | NOT_IMPLEMENTED | No UI for declare-then-resolve flow | **P1** |
| F | Declaration summary display during resolution | NOT_IMPLEMENTED | Other players can't see what was declared | **P1** |
| G | WebSocket sync for declaration events | NOT_IMPLEMENTED | Declarations not broadcast | **P1** |
| H | Edge cases (fainted trainer, speed change mid-declaration, undo) | NOT_IMPLEMENTED | No edge case handling | **P1** |

---

## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
