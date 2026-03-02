# Design: Priority / Interrupt / Attack of Opportunity System

**Design ID:** design-priority-interrupt-001
**Feature Ticket:** feature-016
**Priority:** P2
**Domain:** combat + vtt-grid
**Status:** p2-implemented
**Created:** 2026-03-01

## Overview

This design implements the PTU 1.05 out-of-turn action system: Attack of Opportunity, Priority actions (Standard/Limited/Advanced), Interrupt actions, Hold Action, Intercept Melee/Ranged, and Disengage. These mechanics allow combatants to act outside their normal initiative order in response to triggers or by declaration.

## Matrix Rules Coverage

| Rule | Title | Domain | Tier | Status |
|------|-------|--------|------|--------|
| R110 | Attack of Opportunity | combat | P0 | Implemented |
| R031 | AoO Movement Trigger | vtt-grid | P0 | Implemented |
| R040 | Initiative — Holding Action | combat | P1 | Implemented |
| R046 | Priority Action Rules | combat | P1 | Implemented |
| R047 | Priority Limited/Advanced Variants | combat | P1 | Implemented |
| R048 | Interrupt Actions | combat | P1 | Implemented |
| R116 | Intercept Melee | combat | P2 | Implemented |
| R117 | Intercept Ranged | combat | P2 | Implemented |
| ptu-rule-095 | Disengage Maneuver | combat | P2 | Implemented |

## Tier Summary

### P0: Core AoO Trigger Detection + Out-of-Turn Resolution Engine
- Out-of-turn action engine (`OutOfTurnAction`, `OutOfTurnUsage`)
- AoO trigger detection for 5 trigger types (shift_away, ranged_attack, stand_up, maneuver_other, retrieve_item)
- VTT grid integration for movement-based AoO triggers
- GM prompt/resolution workflow (accept/decline)
- Disengage flag (`disengaged`) for AoO exemption
- Adjacency utility for multi-cell tokens
- WebSocket events for AoO triggered/resolved
- **Estimated commits:** 6-8

### P1: Priority Actions, Interrupt Actions, Hold Action
- Hold Action with turn order insertion and hold queue
- Priority (Standard) — full turn at any time between turns
- Priority (Limited) — only Priority action, rest of turn at normal initiative
- Priority (Advanced) — works even if already acted, forfeits next round turn
- Generic Interrupt framework for feature/move triggers
- Between-turns state for Priority declaration window
- League Battle integration per decree-021
- **Estimated commits:** 8-10

### P2: Intercept Melee/Ranged, Disengage Maneuver
- Intercept Melee: trigger detection, skill check resolution, position swap
- Intercept Ranged: line-of-attack calculation, skill check, movement resolution
- Disengage maneuver: COMBAT_MANEUVERS entry, 1m movement clamp
- Loyalty checks for Pokemon interceptors
- AoE edge case handling
- VTT visualization for line-of-attack
- **Estimated commits:** 8-10

## Architecture Decisions

### GM-Driven Resolution
All out-of-turn actions use a "prompt and decide" model. The system detects opportunities and presents them to the GM, who accepts or declines. Automatic execution is avoided because PTU rules often require GM judgment (e.g., whether a ranged attack targets "someone adjacent").

### Pending Action Queue
Out-of-turn actions are stored as `pendingOutOfTurnActions` on the Encounter. This is a JSON array persisted in the database (same pattern as `declarations`, `switchActions`). Actions have a lifecycle: pending -> accepted/declined/expired.

### Client-Side Between-Turns State
Priority actions require a between-turns declaration window. This is implemented as a client-side state (`betweenTurns: boolean`) in the encounter store, not a server-side phase. The server has no between-turns concept — it just processes Priority declarations as they arrive.

### Backward Compatibility
All new fields use optional types with defaults. Existing encounters work without migration. JSON parsing handles missing fields gracefully.

## Decree Dependencies

- **decree-003**: Token passability and rough terrain. AoO adjacency checks respect this.
- **decree-006**: Dynamic initiative reorder. Hold Action targets absolute initiative values, not positions.
- **decree-021**: League Battle phases. Priority/Hold integrate with declaration/resolution/pokemon phases.

## Related Tickets

- **ptu-rule-095**: Disengage maneuver — fully absorbed into P2.
- **feature-016**: Parent ticket for this design.

## Spec Files

| File | Description |
|------|-------------|
| [shared-specs.md](shared-specs.md) | Shared types, interfaces, DB schema, constants |
| [spec-p0.md](spec-p0.md) | P0: AoO trigger detection + out-of-turn engine |
| [spec-p1.md](spec-p1.md) | P1: Priority, Interrupt, Hold Action |
| [spec-p2.md](spec-p2.md) | P2: Intercept Melee/Ranged, Disengage |
| [testing-strategy.md](testing-strategy.md) | Testing approach for all tiers |

## Total Estimated Work

- **New files:** ~16
- **Modified files:** ~14
- **Total estimated commits:** 22-28
- **New API endpoints:** 8
- **New WebSocket events:** 8
- **New UI components:** 5

## Implementation Log

| Date | Tier | Action | Commits | Notes |
|------|------|--------|---------|-------|
| 2026-03-01 | ALL | Design complete | N/A | Full design spec written |
| 2026-03-01 | P0 | Implementation complete | 77f08598..416039c2 (8 commits) | 6 new files, 5 modified files. AoO trigger detection, out-of-turn engine, VTT grid integration, GM prompt UI, encounter store, WebSocket events |
| 2026-03-01 | P0 | Fix cycle (code-review-247) | 40a1bfda..e43fe165 (8 commits) | CRIT-001: reactor eligibility re-validation. H1-H3: input validation, DB4 damage base, app-surface. M1-M4: client preview eligibility, auto-decline on faint, stale record, action cleanup |
| 2026-03-01 | P1 | Implementation complete | 062b217a..0c4b0972 (11 commits) | 6 new files: hold-action.post.ts, release-hold.post.ts, priority.post.ts, interrupt.post.ts, HoldActionButton.vue, PriorityActionPanel.vue. 7 modified: combat.ts, encounter.ts, out-of-turn.service.ts, next-turn.post.ts, start.post.ts, encounter store, ws.ts. Also fixed ptu-rule-131 (Expert+ Combat AoO). |
| 2026-03-01 | P1 | Fix cycle (code-review-259 + rules-review-235) | 828ec965..e6c161a1 (10 commits) | 2C+4H+5M addressed. CRIT-001: betweenTurns wired in. CRIT-002: Standard Priority duplicate removed. HIGH-001: holdReleaseTriggered returned. HIGH-002: hold advances turn. HIGH-003: Advanced Priority standardActionUsed. HIGH-004: unused import. rules-HIGH-002: skipNextRound narrowed. MED-003: decline before eligibility. MED-004: checkHoldQueue returns all. MED-005: Priority filter to getter. MED-001: app-surface updated. MED-002: refactoring-117 already filed. |
| 2026-03-02 | P2 | Implementation complete | 93f0017f..e2c202e9 (8 commits) | 5 new files: intercept-melee.post.ts, intercept-ranged.post.ts, lineOfAttack.ts, disengage.post.ts, InterceptPrompt.vue. 5 modified: combatManeuvers.ts (Maneuver interface + Disengage + provokesAoO), combat.ts (INTERCEPT_BLOCKING_CONDITIONS), character.ts (loyalty), out-of-turn.service.ts (Intercept detection/resolution), useGridMovement.ts (1m clamp), encounter store (actions + getters). Covers R116, R117, ptu-rule-095. |
| 2026-03-02 | P2 | Fix cycle (code-review-273 + rules-review-249) | 43d0caaa..327c2c02 (8 commits) | CRIT-001: canIntercept &&→|| Full Action check. HIGH-001: PTU alternating diagonal in failure step loops. HIGH-002: ptuDistanceTokensBBox for multi-tile distance. HIGH-003: extracted intercept.service.ts (refactoring-120 resolved). rules-HIGH-001: getCombatantSpeed with modifiers. MED-001: actionId required in intercept-ranged. MED-002: Bad Sleep rationale comments. MED-003: InterceptPrompt targetSquare emit. app-surface.md updated. |
