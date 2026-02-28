---
id: feature-010
title: Status Condition Automation Engine
priority: P1
severity: HIGH
status: resolved
design_spec: design-status-automation-001
domain: combat
source: matrix-gap (Gap 1, remaining automation)
matrix_source: combat R088, R089, R090, R091, R093, R094
created_by: master-planner
created_at: 2026-02-28
---

# feature-010: Status Condition Automation Engine

## Summary

Status conditions are tracked as labels but their mechanical effects beyond CS changes are not automated. CS auto-apply is implemented (ptu-rule-098, decree-005) and type immunities are enforced (ptu-rule-104, decree-012), but tick damage, save checks, turn restrictions, and condition-specific effects remain manual. 6 matrix rules classified as Partial.

## What's Already Implemented

- Burn/Paralysis/Poison CS changes auto-applied (ptu-rule-098)
- Type-based status immunities enforced server-side (ptu-rule-104)
- Vulnerable/Frozen/Asleep zero evasion (ptu-rule-084)
- Status conditions displayed in UI

## What's Missing

| Rule | Condition | Missing Automation |
|------|-----------|-------------------|
| R088 | Burn | Tick damage: 1/10 max HP at end of turn on Standard Action |
| R089 | Frozen | Turn skip, 0 evasion, save check (20- on d20), fire-move thaw |
| R090 | Paralysis | Save check (11+ on d20 to act), turn skip on fail |
| R091 | Poison | Tick damage: 1/10 max HP at end of turn; Badly Poisoned escalation |
| R093 | Sleep | Turn skip, 0 evasion, save check (11+ on d20), wake on damage |
| R094 | Confused | Save check (DC 50- on d100), self-hit DB 6 on fail |

## PTU Rules

- Chapter 7 (Combat) — Status Conditions section
- Each condition has: application rules, mechanical effects, save checks, cure conditions
- Tick damage applies at end of the afflicted's turn
- Save checks happen at start of turn (Frozen/Paralysis/Sleep) or on action (Confused)

## Implementation Scope

FULL-scope feature requiring design spec. Core combat mechanic that affects turn flow.

## Design Spec

Design spec created: `artifacts/designs/design-status-automation-001/`

| Tier | Scope | Status |
|------|-------|--------|
| P0 | Tick damage (Burn/Poison/Badly Poisoned/Cursed) at turn end | implemented |
| P1 | Save checks (Frozen/Paralysis/Sleep/Confused) with turn gating | design-complete |
| P2 | Auto-cure (fire thaw, wake on damage), weather modifiers, ability reference | design-complete |

## Resolution Log

- 2026-02-28: Design spec `design-status-automation-001` created with 3 priority tiers, shared specs, and testing strategy
- 2026-02-28: P0 implemented — tick damage at turn end for Burn/Poison/Badly Poisoned/Cursed
  - 7c389d8: status-automation.service.ts with pure calculation functions
  - cfbfd7f: badlyPoisonedRound field on Combatant interface
  - 922f56b: badlyPoisonedRound initialized in combatant builder
  - b5ef1a2: TICK_DAMAGE_CONDITIONS constant
  - 5fd16e5: tick damage integration in next-turn.post.ts
  - f03a8df: status_tick WebSocket event handler
  - a40ff0f: 23 unit tests for tick damage functions
  - 01ea9aa: badlyPoisonedRound management in status.post.ts
