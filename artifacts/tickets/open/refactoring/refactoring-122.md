---
title: Wire receivedFlankingMap into group/player views for flanking badge rendering
priority: P3
severity: MEDIUM
category: EXT-INCOMPLETE
domain: vtt-grid, player-view
source: code-review-276 MED-2
created_by: slave-collector (plan-20260302-130300)
created_at: 2026-03-02
---

# refactoring-122: Wire receivedFlankingMap into group/player views

## Summary

The WebSocket infrastructure for `flanking_update` events is complete (server sends, client receives via `useWebSocket()`), but group and player view pages do not consume `receivedFlankingMap`. This means flanking badges only appear in GM view, not in group or player views. This is a gap vs. the design spec Section L.

## Affected Files

- `app/pages/group/index.vue` — consume `receivedFlankingMap` from `useWebSocket()` and pass to relevant components
- `app/pages/player/index.vue` — same
- Possibly `app/components/encounter/CombatantCard.vue` — verify prop plumbing works in group/player context

## Suggested Fix

In group and player encounter views, destructure `receivedFlankingMap` from `useWebSocket()` and pass it down to CombatantCard components so they can display the `isFlanked` badge.

## Impact

Players and group view spectators cannot see which combatants are flanked. GM-only visibility is functional but incomplete per design spec.
