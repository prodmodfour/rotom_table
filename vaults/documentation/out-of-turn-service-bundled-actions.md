# Out-of-Turn Service Bundled Actions

The `out-of-turn.service.ts` (753 lines) bundles four mechanically distinct out-of-turn action types into one module: Attack of Opportunity, Hold Action, Priority Actions (standard/limited/advanced), and Interrupt Actions. Each has its own eligibility rules, resolution logic, and state mutations. They share only the `OutOfTurnUsage` tracking struct.

Additionally, the service includes an unrelated Struggle attack stats function and re-exports 8 functions plus 2 types from `intercept.service.ts` for backward compatibility.

This violates the [[single-responsibility-principle]] — each action type could be its own service module with a clear single reason to change. The re-exports also inflate the module surface, violating [[interface-segregation-principle]] by coupling consumers to the entire out-of-turn + intercept API whether they need it or not.

## See also

- [[large-class-smell]] — 753 lines across four distinct action systems
- [[trigger-validation-switch-chains]] — the `validateTriggerPreconditions` switch is an [[open-closed-principle]] concern within this service
- [[out-of-turn-service-split]] — a potential design to split into per-action-type services
