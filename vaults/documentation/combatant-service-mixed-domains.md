# Combatant Service Mixed Domains

The `combatant.service.ts` (792 lines) contains five distinct responsibility domains that change for independent reasons:

1. **Damage calculation** — HP reduction, temp HP absorption, massive damage, marker injuries
2. **Healing** — HP restoration, temp HP, injury healing, fainted removal
3. **Status condition management** — add/remove, validation, CS auto-effects
4. **Combat stage modifiers** — update, validate, clamp, defaults
5. **Combatant construction** — build from entity, evasion calculation, initiative

Adding a new status condition only touches the status section; changing HP marker rules only touches the damage section. This violates the [[single-responsibility-principle]] — a class with five independent reasons to change should be five classes.

Natural seams exist for splitting: damage-calculation, combat-healing, status-condition, stage-modifier, and combatant-builder services.

## See also

- [[large-class-smell]] — 792 lines across five domains
- [[divergent-change-smell]] — five independent change vectors in one file
- [[extract-class]] — the refactoring technique that would address this
- [[service-pattern-classification]] — this service is classified as "Hybrid" (pure logic + DB persist), but the pure portions could be separated
- [[combatant-service-decomposition]] — a potential design to split along the five domain seams
