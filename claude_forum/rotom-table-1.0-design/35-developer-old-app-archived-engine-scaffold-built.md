# 2026-03-26 — Old App Archived, Engine Scaffold Built

## Step 1: Archive old app

Created `archive/ptu-app` branch preserving the full old codebase (971 files). Then deleted from master:

- `app/` — the old Nuxt/PTU app (components, composables, stores, server, prisma, tests, everything)
- `archive/` — old design docs (superseded by vaults)
- `scripts/` — PTU-era data generation scripts
- `docs/` — old screenshots and setup docs
- Root `package.json` + `package-lock.json` (discord bot deps)

Master now contains only: vaults, forum threads, CLAUDE.md, revisions, deprecated_books, .claude config.

## Step 2: R0.C engine scaffold

Created `packages/engine/` as `@rotom/engine` — a standalone TypeScript package.

### Structure

```
packages/engine/
├── package.json          (@rotom/engine, vitest + typescript)
├── tsconfig.json         (strict, ES2022, bundler resolution)
├── vitest.config.ts
├── src/
│   ├── index.ts          (barrel export)
│   ├── constants.ts      (stage multipliers, DB table, type chart, HP/energy formulas)
│   ├── types/
│   │   ├── base.ts       (PokemonType, StatBlock, GridPosition, etc.)
│   │   ├── lens.ts       (15 combat lens sub-interfaces, CombatantLens composite)
│   │   ├── field-state.ts (weather, terrain, hazards, blessings, coats, vortexes)
│   │   ├── delta.ts      (StateDelta, EncounterDelta, all mutation types)
│   │   ├── combat-event.ts (CombatEvent, TriggerEvent)
│   │   └── effect-contract.ts (EffectContext, EffectResult, MoveHandler, TraitTriggerHandler, MoveDefinition, TraitDefinition)
│   └── utilities/
│       ├── result.ts     (noEffect, intercept, merge)
│       └── stat.ts       (effectiveStat, maxHp, currentHp, maxEnergy, tickValue)
└── tests/
    ├── constants.test.ts (24 tests — stage multipliers, DB table, formulas, type chart)
    └── result.test.ts    (12 tests — noEffect, intercept, merge semantics)
```

### What's in place

**Type system** — direct translation of the R0.A documentation vault design:
- All 15 combat lens sub-interfaces from `combat-lens-sub-interfaces.md`
- StateDelta + EncounterDelta from `state-delta-model.md` / `encounter-delta-model.md`
- All field state instance types from `field-state-interfaces.md`
- EffectContext, EffectResult, MoveHandler, TraitTriggerHandler from `effect-handler-contract.md`
- MoveDefinition, TraitDefinition, PassiveEffectSpec from `effect-handler-format.md`
- CombatEvent, TriggerEvent from `combat-event-log-schema.md`
- PendingModification from `before-handler-response-modes.md`

**Constants** — from PTR vault rules:
- Stage multiplier table (asymmetric, from `combat-stage-asymmetric-scaling.md`)
- DB-to-dice table (DB 1–28, from `damage-base-to-dice-table.md`)
- Type effectiveness chart (18×18, from `type-effectiveness-chart.md`)
- HP formulas (Pokemon + Trainer, from `pokemon-hp-formula.md` / `trainer-hp-formula.md`)
- Energy formula (from `energy-stamina-scaling.md`)
- Tick value (from `tick-value-one-tenth-max-hp.md`)

**Utilities** — core result construction:
- `noEffect()`, `intercept()`, `merge()` from `effect-utility-catalog.md`
- `effectiveStat()`, `maxHp()`, `currentHp()`, `maxEnergy()`, `tickValue()` from `effect-utility-catalog.md`

**36 passing tests** covering all constants and merge semantics.

### What's next (remaining R0 work)

Per finding 88's decision, the R0 exit criterion requires:

1. ~~Archive old app~~ Done
2. ~~Build R0.C scaffold~~ Done
3. **Implement remaining ~25 effect utilities** — `dealDamage`, `dealTickDamage`, `applyStatus`, `removeStatus`, `modifyCombatStages`, `healHP`, `manageResource`, `displaceEntity`, `mutateInventory`, `modifyActionEconomy`, `modifyInitiative`, `applyActiveEffect`, `modifyMoveLegality`, `modifyFieldState`, `addBlessing`, `addHazard`, `addCoat`, `consumeBlessing`, `removeHazard`, `modifyDeployment`, `rollAccuracy`, `rollSkillCheck`, `withUser`, `choicePoint`, `embedAction`, `requestReroll`, `scaleDamage`, `flatDamageReduction`, `accuracyBonus`; plus state query helpers
4. **Implement 45 sample handlers** from `r0a-sample-effect-handlers.md`
5. **Unit tests** for all utilities and handlers

**Status:** R0.C scaffold complete. 36 tests passing. Ready to implement effect utilities.
