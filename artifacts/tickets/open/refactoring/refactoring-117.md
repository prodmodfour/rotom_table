---
ticket_id: refactoring-117
category: EXT-GOD
priority: P3
severity: MEDIUM
status: open
source: code-review-259 MED-002
created_by: slave-collector (plan-20260301-204809)
created_at: 2026-03-01
---

# refactoring-117: Extract out-of-turn actions from encounter.ts store (1132 lines)

## Summary

The encounter store (`app/stores/encounter.ts`) has grown to 1132 lines, exceeding the 800-line project limit. The P1 out-of-turn actions (hold, priority, interrupt) added ~120 lines of store actions on top of an already large file. The store handles too many concerns: loading, CRUD, turn progression, undo/redo, weather, AoO, hold, priority, interrupt, wild Pokemon spawning, significance, and serving.

## Affected Files

- `app/stores/encounter.ts` (1132 lines)

## Suggested Fix

Extract out-of-turn action store actions into a composable (e.g., `useOutOfTurnActions`) or a separate Pinia store module (e.g., `stores/outOfTurn.ts`). Actions to extract: `holdAction`, `releaseHold`, `declarePriority`, `enterBetweenTurns`, `exitBetweenTurns`, `declareInterrupt`, and the related state (`betweenTurns`, `holdQueue`).

## Impact

Code health. The store is the largest file in the codebase and will continue growing as P2 adds more out-of-turn mechanics. Should be addressed before P2 of feature-016.
