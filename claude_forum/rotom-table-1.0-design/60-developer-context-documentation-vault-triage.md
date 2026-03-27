# 2026-03-27 — Context Gather: Documentation Vault Triage

## Task
Separate old-app descriptions from valid design intent in the ~377 documentation vault root notes (excluding CLAUDE.md, software-engineering/, and move-implementations/).

## What exists

The documentation vault has 377 root-level notes. The old `app/` was deleted in post 35 and archived to the `archive/ptu-app` branch. The new codebase is `packages/engine/` (`@rotom/engine`), a standalone TypeScript package with types, constants, and utilities. No Nuxt, no Vue, no Prisma, no API routes.

## Contamination signals

I searched for old-app artifact references across all 377 notes:

| Signal | Files matched | What it means |
|---|---|---|
| `app/server/services/`, `app/stores/`, `app/components/`, `app/composables/`, `app/pages/` | 5 | Direct path references to deleted directories |
| Prisma / `.prisma` / `prisma/schema` references | 48 | References to deleted ORM layer |
| Old service/route file references (`.service.ts`, `.post.ts`, `.get.ts`, etc.) | 72 | References to deleted server code |
| Old composable references (`useMove*`, `useCombat*`, `useEncounter*`, etc.) | 59 | References to deleted Vue composables |
| "destructive" keyword (proposals) | 63 | Proposals that analyzed old code — some adopted, some not |

Many notes appear in multiple lists. The union is roughly **~120 unique notes** with some form of old-app reference.

## What's clean

| Category | Count | Examples |
|---|---|---|
| New engine design (R0.A) | ~18 | game-state-interface, combat-lens-sub-interfaces, state-delta-model, effect-handler-contract, effect-handler-format, effect-trigger-event-bus, effect-utility-catalog, field-state-interfaces, encounter-delta-model, before-handler-response-modes, active-effect-model, deployment-state-model, resolution-context-inputs, r0a-sample-effect-handlers, combat-event-log-schema, entity-write-exception, trigger-event-field-semantics, encounter-context-interfaces |
| Conventions (phase 3 outputs) | ~3 | status-application-must-use-applyStatus, utility-self-targeting-convention, silence-means-no-effect |
| Pure game rule translations | ~40+ | nine-step-damage-formula, capture-rate-formula, hp-injury-system, combat-stage-system, evasion-and-accuracy-system, status-condition-categories, battle-modes, healing-mechanics, initiative-and-turn-order, take-a-breather-mechanics, etc. — BUT many of these also reference old service files/utils |
| Pure design philosophy | ~15 | gm-delegates-authority-into-system, automate-routine-bookkeeping, information-asymmetry-by-role, raw-fidelity-as-default, the-table-as-shared-space, per-conflict-decree-required, server-enforcement-with-gm-override, player-autonomy-boundaries, encounter-creation-is-gm-driven, minimum-floors-prevent-absurd-results, separate-mechanics-stay-separate, etc. |

## The blending problem

Most notes are not purely one category. A note like `nine-step-damage-formula.md` describes the valid game formula (design intent) but opens with "implemented in `utils/damageCalculation.ts`" (dead code). `status-condition-categories.md` describes the valid condition taxonomy but references `constants/combat.ts` (deleted). `turn-lifecycle.md` describes valid game phases but lists specific Vue component names that no longer exist.

The contamination is typically: **valid design intent + old implementation location/detail**. The design intent should survive; the implementation references need removal or flagging.

## Note type taxonomy (observed)

Across the 377 notes, I see six functional types:

1. **Engine design** (~18) — R0.A architecture notes, already implemented in `packages/engine/`. Clean. No action needed.
2. **Pure philosophy/principle** (~15) — Implementation-agnostic design principles. Clean. No action needed.
3. **Game mechanic design** (~50) — Describe how a PTR rule becomes app logic. Contain valid formulas/workflows but reference old code locations. **Need cleanup**: remove old file paths, keep the design.
4. **Old-app architecture analysis** (~60) — Diagnose problems in the old codebase: smell analyses, coupling reports, service decompositions. The old code is gone. **Decision needed**: do these retain value as cautionary design notes, or are they dead?
5. **Destructive proposals** (~25) — Proposed redesigns of the old app. Some adopted (combatant-as-lens, game-state-interface), some not (domain-module-architecture, encounter-dissolution). **Decision needed**: adopted ones are now just "the design." Unadopted ones may or may not inform future rings.
6. **Old implementation specs** (~70+) — Describe specific old Vue components, composables, API routes, stores, service functions. Pure implementation detail for deleted code. **Candidates for deletion** unless they also carry forward design intent.

The remaining ~160 notes are in the `move-implementations/` and `software-engineering/` subdirectories, which are out of scope for this triage (SE is pure knowledge; move-implementations has its own lifecycle).

## What's missing

- No vault note documents the **triage categories** or the **status of each note** (valid/stale/ambiguous).
- The CLAUDE.md for the documentation vault still describes all 369 notes as if they're current.
- No note marks which "destructive proposals" were adopted vs. which remain proposals.
