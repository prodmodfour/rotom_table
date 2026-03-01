---
design_id: design-pokemon-switching-001
ticket_id: feature-011
category: FEATURE
scope: FULL
domain: combat
status: p2-implemented
decrees:
  - decree-006
  - decree-021
matrix_source:
  - combat-R049
  - combat-R050
  - combat-R051
  - combat-R052
  - combat-R053
affected_files:
  - app/types/combat.ts
  - app/types/encounter.ts
  - app/server/services/combatant.service.ts
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/combatants/[combatantId].delete.ts
  - app/stores/encounter.ts
  - app/composables/useCombat.ts
  - app/utils/gridDistance.ts
new_files:
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/recall.post.ts
  - app/server/api/encounters/[id]/release.post.ts
  - app/server/services/switching.service.ts
  - app/composables/useSwitching.ts
  - app/components/encounter/SwitchPokemonModal.vue
  - app/components/encounter/SwitchConfirmation.vue
---

# Design: Pokemon Switching Workflow

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Switch Data Model, B. Full Switch API Endpoint, C. Range Validation (8m), D. Initiative Slot Handling, E. Encounter Store Actions, F. Basic GM UI | [spec-p0.md](spec-p0.md) |
| P1 | G. League Battle Switch Restriction, H. Fainted Pokemon Switch (Shift Action), I. Forced Switch Exemption, J. Standard Action to Recall/Release Two | [spec-p1.md](spec-p1.md) |
| P2 | K. Released Pokemon Immediate-Act Logic, L. Recall/Release as Separate Tracked Actions, M. Player View Switch Request, N. Recall+Release in Same Round = Switch Detection | [spec-p2.md](spec-p2.md) |

## Summary

Implement the full Pokemon switching workflow per PTU Core p.229-230. Currently, the GM can add/remove combatants through the encounter management UI, but there is no formal switching action economy, no 8m range validation, no League-specific restrictions, and no recall/release as separate tracked actions.

This design covers 5 matrix rules:

| Rule | Title | Current Status | Target |
|------|-------|---------------|--------|
| R049 | Full Switch — Standard Action | Partial (GM add/remove, no action/range check) | Full switch with Standard Action enforcement and 8m range check |
| R050 | League Switch Restriction | Missing | Switched Pokemon cannot act rest of round |
| R051 | Fainted Pokemon Switch — Shift Action | Partial (can replace fainted, no action enforcement) | Proper Shift Action enforcement for fainted switches |
| R052 | Recall/Release as Separate Actions | Missing | Individual recall/release as Shift Actions, batch as Standard |
| R053 | Released Pokemon Can Act Immediately | Missing | Immediate-act logic for released Pokemon whose initiative passed |

## Related Decrees

- **decree-006**: Dynamically reorder initiative on speed changes. Relevant because switching a Pokemon changes the initiative roster, and the switched-in Pokemon may have a different speed that affects turn order.
- **decree-021**: True two-phase trainer system for League Battles. Relevant because switching is a declarable trainer action in League mode, and switched-in Pokemon have turn restrictions.

## PTU Rules Reference

PTU Core p.229-230 (Switching section):
- Full Switch = Standard Action (either Trainer or Pokemon initiative)
- Recall range: 8 meters (Poke Ball recall beam)
- League Battle: switched-in Pokemon cannot be commanded rest of round (exceptions: forced switch, fainted replacement)
- Fainted Switch = Shift Action
- Recall = Shift Action (one), Standard Action (two)
- Release = Shift Action (one), Standard Action (two)
- Recall+Release in same round = counts as Switch even if separate
- Cannot Recall+Release the same Pokemon in one round
- Released Pokemon can act if their initiative count already passed (act immediately)

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | Switch data model (tracking recall/release state) | NOT_IMPLEMENTED | No switch state on combatants | **P0** |
| B | Full Switch API endpoint (Standard Action) | NOT_IMPLEMENTED | No switch endpoint; only raw add/remove | **P0** |
| C | Range validation (8m via VTT grid) | NOT_IMPLEMENTED | No distance check between trainer and Pokemon | **P0** |
| D | Initiative slot handling for switched Pokemon | NOT_IMPLEMENTED | Add/remove doesn't manage turn order | **P0** |
| E | Encounter store actions for switching | NOT_IMPLEMENTED | Store only has addCombatant/removeCombatant | **P0** |
| F | Basic GM UI for switching | NOT_IMPLEMENTED | No switch action in combat UI | **P0** |
| G | League switch restriction (cannot command rest of round) | IMPLEMENTED | canBeCommanded set by switch endpoint, auto-skip in next-turn | **P1** |
| H | Fainted switch as Shift Action | IMPLEMENTED | Fainted switch with Shift Action cost enforcement | **P1** |
| I | Forced switch exemption (Roar, etc.) | IMPLEMENTED | Force Switch button, no action cost, bypasses Trapped | **P1** |
| J | Standard Action to recall/release two at once | IMPLEMENTED | Recall/release endpoints accept 1-2 Pokemon | **P1** |
| K | Released Pokemon immediate-act logic | IMPLEMENTED | hasInitiativeAlreadyPassed + immediate-act insertion | **P2** |
| L | Recall/Release as separate tracked Shift Actions | IMPLEMENTED | recall.post.ts + release.post.ts with SwitchAction tracking | **P2** |
| M | Player View switch request (via WebSocket) | IMPLEMENTED | Enhanced requestSwitchPokemon with recall/release context | **P2** |
| N | Recall+Release same round = Switch detection | IMPLEMENTED | checkRecallReleasePair + League restriction in both endpoints | **P2** |

## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
