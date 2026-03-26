Before-handlers on the [[effect-trigger-event-bus]] have three response modes: interception (block the pending event entirely via `intercept()`), modification (adjust the pending event's delta via `pendingModifications` on the [[effect-handler-contract|EffectResult]]), and pass-through (`noEffect()`).

Modification uses a `PendingModification` discriminated union with typed adjustment instructions (`scale-damage`, `flat-damage-reduction`, `accuracy-bonus`). The engine applies collected modifications in a defined order: accuracy adjustments, then damage scaling, then flat damage reduction. Interception overrides all modifications.

This three-mode model replaces the original binary interception model, which could only block or pass through. PTR mechanics like Light Screen (damage reduction) and Teamwork (accuracy boost) require the intermediate modification mode.

## See also

- [[effect-trigger-event-bus]] — the dispatch mechanism that invokes before-handlers and applies their response modes
- [[effect-handler-contract]] — `EffectResult.pendingModifications` field definition
- [[effect-utility-catalog]] — `intercept()`, `scaleDamage()`, `accuracyBonus()` utilities that produce modifications
- [[strategy-pattern]] — each response mode is a strategy for handling the pending event
- [[open-closed-principle]] — new modification types extend the `PendingModification` union without modifying the engine's dispatch logic
