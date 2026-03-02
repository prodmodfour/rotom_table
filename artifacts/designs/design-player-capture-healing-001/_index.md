---
design_id: design-player-capture-healing-001
ticket_id: feature-023
category: FEATURE
scope: FULL
domain: player-view+capture+healing
status: p0-implemented
depends_on:
  - design-player-view-integration-001 (feature-003, all tracks complete)
  - design-priority-interrupt-001 (feature-016, P1 implemented — AoO awareness)
  - design-healing-items-001 (feature-020, design-complete — P2 integrates if implemented)
decrees:
  - decree-013 (use 1d100 capture system)
  - decree-014 (Stuck/Slow separate bonuses)
  - decree-015 (real max HP for capture rate)
  - decree-032 (Cursed tick fires only on actual Standard Action use)
matrix_source:
  - capture R004 (Throwing Accuracy Check)
  - capture R027 (Capture Workflow)
  - capture R032 (Capture Is Standard Action)
  - healing R018 (Take a Breather — Core Effects)
  - healing R019 (Take a Breather — Action Cost)
  - healing R024 (Trainer AP Drain for Injury)
affected_files:
  - app/composables/usePlayerCombat.ts
  - app/composables/usePlayerWebSocket.ts
  - app/components/player/PlayerCombatActions.vue
  - app/types/player-sync.ts
  - app/types/api.ts
  - app/server/routes/ws.ts
new_files:
  - app/composables/usePlayerCapture.ts
  - app/composables/usePlayerHealing.ts
  - app/components/player/PlayerCapturePanel.vue
  - app/components/player/PlayerHealingPanel.vue
  - app/components/encounter/PlayerRequestPanel.vue
---

# Design: Player Capture & Healing Interfaces

## Overview

Capture and healing features are fully implemented for the GM view but unreachable from the player view. Players cannot throw Poke Balls, use healing items, or trigger Take a Breather from their interface. This design extends the existing player action request framework (feature-003 Track C) to support capture and healing actions with GM approval.

## Gap Analysis

| Rule | Title | Domain | Current Status | Target |
|------|-------|--------|---------------|--------|
| R004 | Throwing Accuracy Check | capture | Impl-Unreachable (GM-only) | Player can initiate throw, see accuracy result |
| R027 | Capture Workflow | capture | Impl-Unreachable (GM-only) | Player can request capture via WS, GM approves/executes |
| R032 | Capture Is Standard Action | capture | Impl-Unreachable (GM-only) | Action cost displayed and enforced in player UI |
| R018 | Take a Breather Core | healing | Impl-Unreachable (GM-only) | Player can request breather via WS, GM approves/executes |
| R019 | Take a Breather Action Cost | healing | Impl-Unreachable (GM-only) | Full Action cost displayed in player UI |
| R024 | Trainer AP Drain for Injury | healing | Impl-Unreachable (GM-only) | Deferred -- AP drain is a rest/sheet mechanic, not combat action |

## Architecture Decision: Request-Only Model

All player capture and healing actions follow the **request-only model** established by feature-003 Track C. Players never directly modify game state. They submit structured action requests via WebSocket, the GM sees and approves/denies them, and the GM executes the actual game action. This preserves the GM's authority over game state while giving players agency to initiate actions from their devices.

The existing infrastructure already supports this pattern:
- `PlayerActionRequest` type with `requestId` tracking
- `forwardToGm()` / `routeToPlayer()` routing in `ws.ts`
- `pendingRequests` TTL map in `server/utils/pendingRequests.ts`
- `usePlayerWebSocket.sendAction()` with promise-based ack tracking
- `player_action` / `player_action_ack` WebSocket events

## Tier Summary

| Tier | Title | Sections | File |
|------|-------|----------|------|
| P0 | Player Action Request Extensions | A-D | [spec-p0.md](spec-p0.md) |
| P1 | Player Capture UI | E-H | [spec-p1.md](spec-p1.md) |
| P2 | Player Healing UI | I-L | [spec-p2.md](spec-p2.md) |

### P0: Player Action Request Extensions
Extend `PlayerActionType` and `PlayerActionRequest` to support `capture` and `breather` action types. Add GM-side `PlayerRequestPanel` to display incoming player requests with approve/deny buttons. Wire the request panel into the encounter view.

### P1: Player Capture UI
Add "Throw Poke Ball" button to `PlayerCombatActions.vue` with target selector (enemy Pokemon only), ball type selector, capture rate preview, and accuracy roll display. Routes through the P0 request framework. Shows capture result feedback via action ack.

### P2: Player Healing UI
Add "Take a Breather" button to `PlayerCombatActions.vue` with Standard Action awareness. Add healing item use button (if feature-020 is implemented). Routes through the P0 request framework.

## Related Features

| Feature | Relationship |
|---------|-------------|
| feature-003 | Foundation -- player WS protocol, action requests, identity |
| feature-016 | AoO awareness -- capture is a Standard Action that may trigger AoO |
| feature-020 | Healing items -- P2 integrates if feature-020 is implemented |

## Decree Dependencies

| Decree | Impact |
|--------|--------|
| decree-013 | Capture rate uses 1d100 system exclusively |
| decree-014 | Stuck/Slow bonuses are separate from volatile |
| decree-015 | HP percentage uses real max HP, not effective max |
| decree-032 | Cursed tick fires only on actual Standard Action use -- capture throw is a Standard Action |

## Spec Files

| File | Description |
|------|-------------|
| [_index.md](_index.md) | This file |
| [spec-p0.md](spec-p0.md) | P0: Player action request extensions + GM request panel |
| [spec-p1.md](spec-p1.md) | P1: Player capture UI |
| [spec-p2.md](spec-p2.md) | P2: Player healing UI |
| [shared-specs.md](shared-specs.md) | Shared types, data flow, integration points |
| [testing-strategy.md](testing-strategy.md) | Testing approach for all tiers |

## Total Estimated Work

- **New files:** 5
- **Modified files:** 7
- **Total estimated commits:** 12-16
- **New API endpoints:** 0 (reuses existing capture + breather endpoints)
- **New WebSocket events:** 0 (reuses existing player_action / player_action_ack)
- **New UI components:** 3 (PlayerCapturePanel, PlayerHealingPanel, PlayerRequestPanel)

## Implementation Log

| Date | Tier | Action | Commits | Notes |
|------|------|--------|---------|-------|
| 2026-03-01 | ALL | Design complete | N/A | Full multi-tier design spec written |
| 2026-03-02 | P0 | Implemented | a5a0a822, a0da08ee, eb42447b, d583486e, 15527ddc | Section A-D complete. Types extended, player request functions added, PlayerRequestPanel created, handlers extracted to composable, wired into GM view. Extra file: usePlayerRequestHandlers.ts (not in original spec, extracted for SRP/file-size). |
