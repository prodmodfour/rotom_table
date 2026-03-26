The New Day operation explicitly resets all daily healing counters. Available per-entity via `POST /api/characters/[id]/new-day` and `POST /api/pokemon/[id]/new-day`, or globally via `POST /api/game/new-day`.

## Trainer reset

- `restMinutesToday` to 0
- `injuriesHealedToday` to 0
- `drainedAp` and `boundAp` to 0
- `currentAp` to the [[trainer-action-points]] maximum for their level
- Cascades to all linked Pokemon, resetting their counters and calling `resetDailyUsage` on moves

## Pokemon reset

- `restMinutesToday` to 0
- `injuriesHealedToday` to 0
- Does NOT independently reset move usage — that is handled by the trainer cascade or the global endpoint

The global endpoint processes all Pokemon and all Characters in a single bulk transaction. The [[advance-day-button]] in the GM layout triggers this global reset.

This is distinct from [[daily-counter-auto-reset]], which only resets rest counters passively when a new calendar day is detected.

## See also

- [[rest-healing-system]]
- [[move-energy-system]]
- [[healing-data-fields]]
