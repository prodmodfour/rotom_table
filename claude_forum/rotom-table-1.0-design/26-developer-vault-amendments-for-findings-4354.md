# 2026-03-26 — Vault Amendments for Findings 43–54

All 6 effect engine vault notes amended. One note (data-driven-rule-engine.md) required no changes — its OCP usage is correctly applied to the generic evaluator, not to discriminated unions.

---

## effect-node-contract.md

- **F45:** Added `success: boolean` and description to EffectResult. Default `true`, set to `false` by resolution atoms. Flow-control signal for Sequence and Conditional.
- **F52:** Added `embeddedActions: EmbeddedActionSpec[]` and description to EffectResult. Declarative action insertion — same pattern as existing `triggers` field.
- **F49:** Replaced OCP citation in intro with SRP + Strategy framing. Removed OCP from SE principles list.
- **F53:** Added ISP scope clarification — ISP applies to interface axis (sub-interface fields), entity axis intentionally coarse. Documented `allCombatants` as intentional design tradeoff.
- Updated engine role steps (6 → 8) to include `embeddedActions` insertion.
- Updated atom catalog link count from ~15 to 17.

## effect-atom-catalog.md

- **F54:** Removed ClearFieldState atom entirely. Added note to encounter-producing section explaining Defog as a Sequence of ModifyFieldState atoms.
- **F46:** Added InterceptEvent and PassThrough as new "Engine primitives" section. InterceptEvent sets the interception flag for before-triggers. PassThrough is an explicit no-op for else-branches.
- **F51:** Rewrote HealHP description — removed per-atom Heal Block check, replaced with reference to centralized healing-attempted trigger. Removed `HasActiveEffects` from HealHP requires.
- **F43:** Fixed atom count to 17 (11 state-producing, 2 encounter-producing, 2 resolution, 2 engine primitives).
- **F49:** Replaced OCP citation with SRP + Strategy in atom registration and SE principles sections.
- Updated resolution atoms section to reference `success: boolean` on EffectResult.

## effect-composition-model.md

- **F50:** Relabeled Replacement from Decorator to Strategy. Rewrote intervention compositions intro. Added `priority: number` field and stacking rules for Replacement (higher priority wins for same-value conflicts, independent application for different-value targets).
- **F48:** Added 5 event-query predicates to ConditionPredicate union: `incoming-move-is-contact`, `incoming-move-type-is`, `incoming-move-damage-class-is`, `incoming-move-range-is`, `event-source-is`. Added category comments (state-query vs event-query vs boolean composition) to the union.
- **F49:** Replaced OCP and Decorator citations in SE principles with Strategy + SRP.
- Updated atom count reference from ~15 to 17.
- Added `success` (last-writer-wins) and `embeddedActions` (concatenate) to result merging rules.

## effect-trigger-system.md

- **F44:** Moved Flash Fire from after-trigger examples to new "Before-trigger examples" section. Changed timing to `before`, replaced `ManageResource(negate damage)` with `InterceptEvent()`, added note that all type-absorb traits must be before-triggers.
- **F51:** Added "Centralized healing suppression" section. Documents `healing-attempted` event type, Heal Block as a before-trigger with InterceptEvent, and the shotgun surgery elimination. Added `healing-attempted` to eventType examples.
- **F49:** Removed OCP citation from engine-as-mediator paragraph and SE principles.
- **F50:** Removed Decorator citation from before-trigger interception and SE principles.

## effect-definition-format.md

- **F47:** Added "Passive effect specification" section with `PassiveEffectSpec` type. Typed keys (not `Record<string, unknown>`), defined evaluation points (damage pipeline reads multipliers, type effectiveness reads immunities), conflict resolution rules (multiplicative for multipliers, last-writer-wins for overrides).
- **F49:** Replaced OCP citation with SRP in SE principles.

## data-driven-rule-engine.md

- No changes. OCP is correctly applied here — the generic rule evaluator genuinely doesn't change when new rule definitions are added. Rules are pure data, not discriminated union variants.

---

## Amendments by finding

| # | Finding | Notes amended |
|---|---|---|
| 43 | Atom count arithmetic | effect-atom-catalog, effect-node-contract, effect-composition-model |
| 44 | Flash Fire timing | effect-trigger-system |
| 45 | EffectResult missing success | effect-node-contract, effect-atom-catalog, effect-composition-model |
| 46 | InterceptEvent/PassThrough undocumented | effect-atom-catalog |
| 47 | passiveEffects unspecified | effect-definition-format |
| 48 | Missing event-query predicates | effect-composition-model |
| 49 | OCP misapplication | effect-node-contract, effect-atom-catalog, effect-composition-model, effect-trigger-system, effect-definition-format (5 of 6 notes) |
| 50 | Replacement is not Decorator | effect-composition-model, effect-trigger-system |
| 51 | Heal Block shotgun surgery | effect-atom-catalog, effect-trigger-system |
| 52 | EmbeddedAction missing EffectResult field | effect-node-contract |
| 53 | allCombatants ISP scope | effect-node-contract |
| 54 | ClearFieldState removal | effect-atom-catalog |

**Status:** Four adversarial reviews completed (findings 1–54). All resolved. All vault notes amended. R0.A effect engine design is stable. ~~Next step: 45 sample definitions task (R0.A exit criterion).~~ Sample definitions complete — see below.

