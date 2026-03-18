The out-of-combat rest and healing system provides five recovery mechanisms available exclusively through the GM view: [[thirty-minute-rest]], [[extended-rest]], [[pokemon-center-healing]], [[natural-injury-healing]], and [[new-day-reset]].

All rest operations share common constraints tracked by [[healing-data-fields]]: rest minutes used today (capped at 480), injuries healed today (capped at 3), and timestamps for [[daily-counter-auto-reset]]. Trainers additionally manage [[trainer-action-points]].

Healing is always capped at the [[effective-max-hp-formula]] ceiling — injuries permanently lower the maximum HP that healing can restore to until the injuries themselves are healed.

The [[healing-tab-component]] provides the unified UI, and the [[rest-healing-composable]] connects it to [[rest-healing-api-endpoints]]. The GM can also trigger a global reset via the [[advance-day-button]].

## See also

- [[healing-mechanics]] — in-combat healing via the encounter heal endpoint
- [[healing-item-system]] — item-based healing during encounters
- [[take-a-breather-mechanics]] — in-combat stage/status reset
