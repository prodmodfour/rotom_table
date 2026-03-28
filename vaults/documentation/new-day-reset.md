The New Day operation resets all daily healing counters. Available per-entity or globally via the GM view.

## What resets

- `restMinutesToday` to 0
- `injuriesHealedToday` to 0
- Cascades from trainers to all linked Pokemon, resetting their counters

The global reset processes all Pokemon and all characters in a single bulk transaction. The advance day button in the GM layout triggers this.

This is distinct from daily counter auto reset, which only resets rest counters passively when a new calendar day is detected.

## See also

- [[rest-healing-system]]
- [[move-energy-system]]
- [[healing-data-fields]]
