# Design: Priority / Interrupt / Attack of Opportunity System

**Design ID:** design-priority-interrupt-001
**Feature Ticket:** feature-016
**Priority:** P2
**Domain:** combat + vtt-grid
**Status:** design-complete
**Created:** 2026-03-01

## Overview

This design implements the PTU 1.05 out-of-turn action system: Attack of Opportunity, Priority actions (Standard/Limited/Advanced), Interrupt actions, Hold Action, Intercept Melee/Ranged, and Disengage. These mechanics allow combatants to act outside their normal initiative order in response to triggers or by declaration.

## Matrix Rules Coverage

| Rule | Title | Domain | Tier | Status |
|------|-------|--------|------|--------|
| R110 | Attack of Opportunity | combat | P0 | Designed |
| R031 | AoO Movement Trigger | vtt-grid | P0 | Designed |
| R040 | Initiative — Holding Action | combat | P1 | Designed |
| R046 | Priority Action Rules | combat | P1 | Designed |
| R047 | Priority Limited/Advanced Variants | combat | P1 | Designed |
| R048 | Interrupt Actions | combat | P1 | Designed |
| R116 | Intercept Melee | combat | P2 | Designed |
| R117 | Intercept Ranged | combat | P2 | Designed |
| ptu-rule-095 | Disengage Maneuver | combat | P2 | Designed |

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
