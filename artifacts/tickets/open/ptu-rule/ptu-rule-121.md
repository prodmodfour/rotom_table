---
ticket_id: ptu-rule-121
title: "Sprint endpoint missing action consumption"
severity: LOW
priority: P4
domain: combat
source: combat-audit-report (R113, 2026-02-28)
matrix_source: combat-R113
created_by: master-planner (plan-20260228)
created_at: 2026-02-28
---

## Summary

The Sprint endpoint (`app/server/api/encounters/[id]/sprint.post.ts`) adds the 'Sprint' tempCondition for +50% movement but does NOT consume the standard action via `turnState.standardActionUsed = true`. The breather endpoint correctly marks both actions used, but sprint does not track action consumption.

## PTU Rule

PTU p.245: Sprint uses the "Standard Action" to add 50% to movement capabilities for the round.

## Current Behavior

Sprint adds a tempCondition but does not mark `standardActionUsed: true` in the turn state.

## Required Behavior

Set `standardActionUsed: true` (and optionally `shiftActionUsed: true` since the Sprint movement IS the shift) in the combatant's turn state.

## Affected Files

- `app/server/api/encounters/[id]/sprint.post.ts` — Add action consumption tracking
