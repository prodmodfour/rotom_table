# Damage Pipeline as Chain of Responsibility

The [[damage-flow-pipeline]] follows the [[chain-of-responsibility-pattern]]: each link in the chain processes its concern and passes the result forward.

The chain: `MoveButton` (select move) → `MoveTargetModal` (pick targets, roll accuracy) → `useMoveCalculation` (STAB, weather modifiers, evasion, effectiveness) → `DamageSection` (damage roll display) → `TargetDamageList` (per-target final damage after defense).

No single component handles the full [[nine-step-damage-formula]]; each handles one aspect and delegates the rest. For status moves (no damage base), `MoveTargetModal` short-circuits the chain by skipping the damage section entirely.

This follows the [[single-responsibility-principle]] at the component level — each component in the chain has one job. However, the `useMoveCalculation` composable itself bundles several chain steps internally (see its [[single-responsibility-principle]] concerns in the composable audit), so the chain-of-responsibility pattern is cleaner at the component level than the composable level.

## See also

- [[nine-step-damage-formula]] — the PTR calculation the pipeline implements
- [[encounter-component-categories]] — where these components sit in the encounter UI
- [[turn-lifecycle]] — the broader turn flow that the damage pipeline is part of
- [[saga-orchestrated-turn-lifecycle]] — a destructive proposal where the damage pipeline becomes a saga phase
