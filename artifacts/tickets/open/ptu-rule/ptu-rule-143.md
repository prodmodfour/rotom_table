---
id: ptu-rule-143
title: "Sprint should not consume Shift Action"
priority: P3
severity: MEDIUM
status: open
domain: combat
source: decree-050
created_by: decree-facilitator
created_at: 2026-03-05
affected_files:
  - app/server/api/encounters/[id]/sprint.post.ts
---

## Summary

Per decree-050, Sprint consumes only the Standard Action (PTU p.245). The current implementation incorrectly also sets `shiftActionUsed: true`.

## Required Implementation

1. In `app/server/api/encounters/[id]/sprint.post.ts`, remove `shiftActionUsed: true` from the turnState update (line 47)
2. Update the code comment to reference decree-050
3. The combatant should retain their Shift Action after sprinting

## Notes

- Source: decree-050 (Sprint consumes only the Standard Action)
- The `combatManeuvers.ts` constant already correctly lists Sprint as `actionType: 'standard'`
- Only the server endpoint needs fixing
