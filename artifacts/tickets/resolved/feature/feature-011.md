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
| P1 | League restriction, fainted switch as Shift Action, forced switch exemption | implemented |
| P2 | Immediate-act logic, separate recall/release, player view switch request | implemented |

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
- 2026-03-01: P0 review fixes — code-review-232 (6 issues) + rules-review-208 (5 issues), 11 total resolved
  - 10954c3: CRITICAL-001 — add Trapped condition check to validateSwitch (switching.service.ts)
  - f233312: add RECALL_CLEARED_CONDITIONS constant (constants/statusConditions.ts)
  - a04fa2a: HIGH-001/HIGH-002/MEDIUM-002 — clear volatile conditions, tempHP, stages on recall (switch.post.ts)
  - 91081cf: C1 — handle pokemon_switched WebSocket event client-side (useWebSocket.ts)
  - b59db4f: H1/H2 — add undo snapshot + encounter_update broadcast for switch (pages/gm/index.vue)
  - 01e8a18: M1/M3 — fix switch button visibility and disabled logic (CombatantCard.vue)
  - c4f1885: M2/MEDIUM-001 — correct Whirlwind comment per decree-034, document over-fetch (combat.ts, useSwitching.ts)
- 2026-03-01: P1 implemented — League switch restriction, fainted switch, forced switch
  - ef1938db: switching.service.ts — add validateFaintedSwitch, validateForcedSwitch, canSwitchedPokemonBeCommanded, extend buildSwitchAction for fainted/forced types
  - ee433cd3: switch.post.ts — handle fainted/forced/standard modes with mode-dependent validation and action cost
  - 7f4fe996: encounter store — update switchDetails type to include 'none' cost
  - 70259449: next-turn.post.ts — skipUncommandablePokemon auto-skip in League pokemon phase (4 transition points)
  - 1a3a8260: InitiativeTracker.vue — dim uncommandable Pokemon with "Cannot Act" label
  - 8c9d0ced: useSwitching.ts — add canFaintedSwitch client-side pre-validation
  - 64e109ea: SwitchPokemonModal.vue — add mode prop (standard/fainted/forced) with mode-specific UI
  - 41b02658: CombatantCard.vue — add Fainted Switch and Force Switch buttons with enable/disable logic
  - fb48e76a: CombatantSides.vue — propagate faintedSwitch and forceSwitch events
  - 47386599: pages/gm/index.vue — wire handleFaintedSwitch and handleForceSwitch handlers
  - 66d46579: pages/gm/index.vue — resolve fainted Pokemon for fainted switch modal
  - cbbca0ff: CombatantCard.vue — show "Cannot Act (Switched In)" badge on uncommandable Pokemon
- 2026-03-01: P2 implemented — immediate-act, separate recall/release, player view switch, pair detection
  - 93286305: Section K — hasInitiativeAlreadyPassed() + immediate-act insertion in insertIntoFullContactTurnOrder (switching.service.ts, switch.post.ts)
  - fe8fbf14: findAdjacentPosition + checkRecallReleasePair utilities (switching.service.ts)
  - cb167783: Section L — recall.post.ts endpoint (1=Shift, 2=Standard, Trapped check, volatile clear, recall_only tracking)
  - ce09517a: Section L — release.post.ts endpoint (auto-place adjacent, Section K immediate-act, Section N pair detection)
  - 9b68b2a3: recallPokemon/releasePokemon store actions + executeRecall/executeRelease composable methods
  - 5b2b4a89: Section N — recall-after-release League restriction in recall.post.ts
  - 5952f702: Section M — enhanced requestSwitchPokemon with recall combatant ID + release name
- 2026-03-01: P2 fix cycle — code-review-249 (CRIT-001, H1, H2, M2, M3)
  - 2106cccd: CRIT-001 — add pokemon_recalled/pokemon_released WebSocket handlers + type definitions (useWebSocket.ts, types/api.ts)
  - c68503cb: M2 — extract applyRecallSideEffects into switching.service.ts, remove duplication from switch.post.ts and recall.post.ts
  - 8559a1c1: H2 — add turn validation to recall.post.ts and release.post.ts (current combatant must be trainer or their Pokemon)
  - c0884c42: M3 — use findPlacementPosition as grid-wide fallback in findAdjacentPosition instead of overlapping trainer position
  - 3e9a417d: H1 — update app-surface.md with recall/release endpoints, WS events, expanded switching system description
