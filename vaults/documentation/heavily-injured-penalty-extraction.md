# Heavily Injured Penalty Extraction

A potential [[extract-method]] to address the [[heavily-injured-penalty-duplication|identical flow duplicated across 12 routes]].

## The idea

Extract the heavily injured penalty flow into a single service function:

```
applyHeavilyInjuredPenaltyFlow(combatant, encounter, options?) -> { combatant, fainted, died, synced }
```

The function handles the full sequence: check HP threshold -> apply penalty injury -> check faint -> apply Fainted status -> check death threshold -> apply Dead status -> sync entity to database -> set `heavilyInjuredPenaltyApplied` flag.

The 12 route copies become 12 one-line calls.

## Principles improved

- [[duplicate-code-smell]] — 12 copies reduced to 1
- [[single-responsibility-principle]] — the penalty flow is domain logic, not HTTP concern
- [[shotgun-surgery-smell]] — rule changes to the heavily injured mechanic need only one edit

## Patterns and techniques

- [[extract-method]] — the core refactoring
- The function would live in `combatant.service.ts` (or a new `combat-penalties.service.ts` if [[combatant-service-decomposition]] is pursued)

## Trade-offs

- The 12 copies have minor contextual variations: some check for league battle mode, some handle actor vs. target, some trigger additional effects after faint (auto-dismount, soulstealer). The extracted function needs to accommodate these without becoming a Swiss Army knife.
- The function performs a DB write (entity sync) — it is not a pure function. This makes it a "hybrid" in [[service-pattern-classification]] terms. If purity is valued, the sync could be a separate step returned to the caller.
- Some routes call the penalty flow multiple times (once per target in `move.post.ts`). The extracted function should handle single-combatant application, with callers looping.

## Open questions

- Should the function return a result describing what happened (fainted? died?) and let the caller handle downstream effects, or should it handle everything including auto-dismount?
- If it handles auto-dismount and soulstealer, it becomes the [[turn-advancement-service-extraction|turn advancement service]] in miniature — where's the boundary?
- Should the DB sync be inside the function or deferred to the caller for batching?

## See also

- [[turn-advancement-service-extraction]] — the service that would use this extracted function most heavily
- [[combatant-service-decomposition]] — where this function would live
