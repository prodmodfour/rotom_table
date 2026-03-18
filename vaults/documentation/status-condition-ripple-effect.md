# Status Condition Ripple Effect

The `StatusCondition` string literal union in `types/combat.ts` has ~100 consuming sites across 20+ files. Adding a new status condition requires updating: the union type itself, `AOO_BLOCKING_CONDITIONS`, `INTERCEPT_BLOCKING_CONDITIONS`, type-status immunity tables, status automation tick logic, CS auto-effect mappings, UI condition rendering components, and potentially capture bonus calculations.

There is no centralized registry that maps a condition to all its properties (whether it blocks AoO, its tick damage, CS effects, immunities, display color/icon). Each property is scattered across a different file.

This is the [[shotgun-surgery-smell]] — a single logical change (add a status condition) scatters modifications across many files. It also touches the [[open-closed-principle]]: the codebase is not closed for modification when a new condition is introduced.

## See also

- [[divergent-change-smell]] — the status condition type itself changes for many reasons
- [[strategy-pattern]] — a condition registry mapping each condition to a property bag would centralize the definition
- [[status-condition-registry]] — a potential design to centralize condition definitions
