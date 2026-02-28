---
id: feature-011
title: Pokemon Switching Workflow
priority: P1
severity: HIGH
status: in-progress
domain: combat
source: matrix-gap (Gap 3)
matrix_source: combat R049, R050, R051, R052, R053
created_by: master-planner
created_at: 2026-02-28
---

# feature-011: Pokemon Switching Workflow

## Summary

No formal Pokemon switching workflow exists. GM can add/remove combatants manually, but there is no Standard Action switch with range check, no League Battle switch restrictions, and no recall/release as separate actions. 5 matrix rules (2 Partial, 3 Missing).

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R049 | Full Switch — Standard Action | Partial — GM can add/remove, no 8m range check or action enforcement |
| R050 | League Switch Restriction | Missing — switched Pokemon cannot act rest of round |
| R051 | Fainted Switch — Shift Action | Partial — can replace fainted, no enforcement as Shift Action |
| R052 | Recall and Release as Separate Actions | Missing — no separate recall/release tracked |
| R053 | Released Pokemon Can Act Immediately | Missing — no immediate-act logic for newly released |

## PTU Rules

- Chapter 7: Pokemon switching rules
- Standard Action to switch: recall current + release new within 8m
- League mode: switched Pokemon cannot act rest of round
- Fainted switch: Shift Action (free, but uses shift)
- Release without recall: free action, released Pokemon acts immediately if before its turn

## Implementation Scope

FULL-scope feature requiring design spec. Interacts with encounter store, initiative system, and VTT grid.

## Design Spec

Design complete: `artifacts/designs/design-pokemon-switching-001/`

| Tier | Scope | Status |
|------|-------|--------|
| P0 | Core switch as Standard Action, 8m range check, initiative insertion, encounter store | implemented |
| P1 | League restriction, fainted switch as Shift Action, forced switch exemption | design-complete |
| P2 | Immediate-act logic, separate recall/release, player view switch request | design-complete |

## Resolution Log

- Design spec created by slave-2 (2026-02-28)
- 2026-02-28: P0 implemented — full switch as Standard Action with 8m range check, initiative insertion, encounter store integration, GM UI
  - d80e0eb: SwitchAction type + switchActions on Encounter model/schema
  - 0998d41: switching.service.ts (validateSwitch, checkRecallRange, insertIntoTurnOrder, removeCombatantFromEncounter, markActionUsed, buildSwitchAction)
  - 9a7190a: switch.post.ts endpoint (10-step validation, execution, WebSocket broadcast)
  - b038f85: useSwitching composable (getBenchPokemon, canSwitch, executeSwitch)
  - 2eba7b0: SwitchPokemonModal.vue (bench selection UI)
  - 664b574: encounter store switchPokemon action + Switch button on CombatantCard
  - b22102f: switchActions lifecycle (clear on new round, init on start)
  - 4fdd15d: app-surface.md updated
