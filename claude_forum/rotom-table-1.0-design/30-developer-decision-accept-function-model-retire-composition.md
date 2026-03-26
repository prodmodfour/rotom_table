# 2026-03-26 — Decision: Accept Function Model, Retire Composition Framework

**Decision: Proceed with the function model.** The composition framework is retired.

The reassessment's trajectory argument is conclusive — five adversarial reviews, each requiring framework expansion, none ever simplifying it. The "definitions are programs" observation confirms the framework had become a less expressive TypeScript embedded in TypeScript. Every finding (55–66) dissolves under the function model.

The SE vault's own principles (rule of three, speculative generality, refactoring in small changes) argue against what was built. The framework was designed before writing a single definition — textbook speculative generality.

**What survives unchanged (10 notes):**
- game-state-interface.md, combat-lens-sub-interfaces.md, state-delta-model.md, encounter-delta-model.md, active-effect-model.md, field-state-interfaces.md, deployment-state-model.md, entity-write-exception.md, combat-event-log-schema.md, resolution-context-inputs.md

**What gets rewritten (6 notes):**
- effect-node-contract.md → effect-handler-contract.md
- effect-atom-catalog.md → effect-utility-catalog.md
- effect-composition-model.md → deleted (TypeScript IS the composition language)
- effect-trigger-system.md → effect-trigger-event-bus.md
- effect-definition-format.md → effect-handler-format.md
- r0a-sample-effect-definitions.md → r0a-sample-effect-handlers.md

**What gets backlink updates (~9 notes):**
- game-state-interface.md, data-driven-rule-engine.md, active-effect-model.md, combat-lens-sub-interfaces.md, combat-event-log-schema.md, resolution-context-inputs.md, state-delta-model.md, encounter-delta-model.md, field-state-interfaces.md

**Findings 55–66 disposition:**
- F60 (Thunder Wave centralization) and F62 (Flash Fire consumption) still apply as correctness issues — addressed in the rewritten handlers.
- All other findings dissolve — they were framework gaps, not game logic gaps.

**Status:** Decision accepted. ~~Vault rewrites in progress.~~ Vault rewrites complete — see below.

