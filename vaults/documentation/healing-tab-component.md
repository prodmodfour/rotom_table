`HealingTab.vue` in `components/common/` is the unified out-of-combat healing UI, rendered on both character and Pokemon sheet pages in the GM view.

## Display

- Current HP and injury count
- Rest minutes used today (out of 480)
- HP healed per rest period
- Drained AP (trainers only)
- Natural injury heal timer countdown

## Actions

- Rest 30 Minutes — [[thirty-minute-rest]]
- Extended Rest — [[extended-rest]]
- Pokemon Center — [[pokemon-center-healing]]
- Heal Injury (Natural) — [[natural-injury-healing]]
- Drain AP to Heal Injury (trainers only) — [[ap-drain-injury-healing]]
- New Day — [[new-day-reset]]

Accepts `entity-type` prop ("character" or "pokemon") and emits a `healed` event after any successful action, which the parent page uses to reload entity data.

## See also

- [[rest-healing-composable]]
- [[rest-healing-system]]
