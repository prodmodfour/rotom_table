# 2026-03-26 — Vault Rewrites: Composition Framework → Function Model

All 6 vault notes rewritten. 6 old notes deleted. 9 external notes updated with new backlinks. Zero broken wikilinks remaining in the documentation vault.

---

## Notes created (5 new files)

| New note | Replaces | Key changes |
|---|---|---|
| `effect-handler-contract.md` | `effect-node-contract.md` | `MoveHandler` / `TraitTriggerHandler` function types replace `EffectNode`. `EffectContext` gives full lens (no ISP filtering at context level — utility params provide narrowing). `EffectResult` and engine role preserved but simplified. `TriggerContext` extends `EffectContext` with event data. |
| `effect-utility-catalog.md` | `effect-atom-catalog.md` | Same 18+ operations as typed utility functions. Added `dealTickDamage` (separates tick damage from formula damage — F61). Added `addBlessing`/`addHazard`/`addCoat` (trigger handlers passed as functions — F59). Added `withUser` (context switching — F58). Added `effectiveStat`, `choicePoint`, state query helpers. `applyStatus` centralizes type immunity — F60. |
| `effect-trigger-event-bus.md` | `effect-trigger-system.md` | Simplified event bus. `TriggerRegistration` has a `handler` function field instead of an `effect` EffectNode tree + `condition` predicate. Conditions are inline code. Three trigger sources: traits, active effects, field state instances (F59). Flash Fire consumption handler documented (F62). |
| `effect-handler-format.md` | `effect-definition-format.md` | Functions ARE the definitions. Worked examples as TypeScript functions. `MoveDefinition` carries metadata + handler field. `TraitDefinition` carries trigger registrations. `PassiveEffectSpec` preserved unchanged. No helper factory functions. |
| `r0a-sample-effect-handlers.md` | `r0a-sample-effect-definitions.md` | All 45 definitions rewritten as functions. **All 45 fully expressible** (was 38/45 under composition framework). Gaps resolved table documents how each finding dissolved. Coverage matrix updated for utilities and trigger patterns. |

## Note deleted (1 file with no replacement)

| Deleted | Reason |
|---|---|
| `effect-composition-model.md` | TypeScript IS the composition language. `if`/`for`/`map`/ternary replace Sequence, Conditional, Repeat, CrossEntityFilter, Replacement, ChoicePoint, EmbeddedAction. No replacement note needed. |

## Backlinks updated (9 files)

- `game-state-interface.md` — updated See also links and ISP description
- `data-driven-rule-engine.md` — updated See also links
- `active-effect-model.md` — updated See also links
- `combat-lens-sub-interfaces.md` — updated intro and See also links
- `combat-event-log-schema.md` — updated See also links
- `resolution-context-inputs.md` — updated See also links
- `state-delta-model.md` — updated See also links
- `encounter-delta-model.md` — updated inline references and See also links
- `field-state-interfaces.md` — updated See also links

## Findings disposition

| Finding | Under composition framework | Under function model |
|---|---|---|
| F55 | 5 missing predicates, 2 were R0 | Inline conditions — `effectiveStat()`, `targetHasActedThisRound()` |
| F56 | `bonusDamage` spec needed on DealDamage | Handler computes bonus inline, passes flat number |
| F57 | Resistance step missing from damage pipeline | `resistanceModifier` param on `dealDamage` |
| F58 | CrossEntityFilter context switching contract | `withUser(ctx, ally, fn)` utility |
| F59 | Blessing triggers embedded in ModifyFieldState params | Handler functions passed to `addBlessing`/`addHazard` |
| F60 | Thunder Wave type immunity in wrong place | Centralized in `applyStatus` utility |
| F61 | Stealth Rock conflates formula and tick damage | Separate `dealTickDamage` utility |
| F62 | Flash Fire has no consumption mechanism | Second trigger handler on `move-used` |
| F63 | Undocumented move metadata fields | Move metadata on `MoveDefinition`, not in handlers |
| F64 | `requestReroll` is a category error | Result marker, engine handles re-invocation |
| F65 | Teamwork CS alternative has side effects | `modifyResolution` modifies this check only |
| F66 | "No architectural rethinking" claim wrong | Moot — no framework |

## R0.A completion status

| Component | Status |
|---|---|
| GameState Interface (10 notes) | Complete — unchanged |
| Effect Engine (5 notes) | Complete — rewritten as function-based model |
| Sample Handlers (1 note) | Complete — 45/45 fully expressible |
| R0.A exit criterion | **Pending adversarial review** of function model rewrite |

**Status:** Vault rewrites complete. Function model needs adversarial review before R0.A exit criterion can be considered met. The rewrite is a significant architectural change — it must be validated the same way the composition framework was.

