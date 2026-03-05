---
id: refactoring-141
title: Remove redundant useAction('standard') call for Sprint and Breather
priority: P4
severity: LOW
status: open
domain: combat
source: rules-review-ptu-rule-121 M2
created_by: slave-collector (plan-1772711294)
created_at: 2026-03-05
affected_files:
  - app/composables/useEncounterActions.ts
---

# refactoring-141: Remove redundant useAction('standard') call for Sprint and Breather

## Summary

The Sprint and Take-a-Breather action flows in `useEncounterActions.ts` call `useAction(combatantId, 'standard')` client-side BEFORE calling the Sprint/Breather API endpoint. The server endpoint already sets `standardActionUsed: true` server-side, making the client-side call redundant.

## Problem

- Extra HTTP round-trip for the `useAction` call
- Potential race condition window between the two sequential calls
- Inconsistent pattern — the server endpoint is authoritative for action consumption

## Suggested Fix

Remove the `useAction(combatantId, 'standard')` call from the Sprint and Breather action handlers in `useEncounterActions.ts`. The server endpoints already handle action consumption.

## Impact

LOW — Functional behavior is correct (double-setting a flag to true is idempotent), but the redundant call adds latency and a minor race condition risk.
