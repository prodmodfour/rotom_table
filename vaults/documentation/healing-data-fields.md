Healing state tracked on both trainer and Pokemon entities.

## Shared fields (both models)

- `currentHp` / `maxHp` — current and maximum hit points
- `temporaryHp` — [[temp-hp-mechanics]] buffer
- `injuries` — injury count feeding into [[effective-max-hp-formula]]
- `statusConditions` — JSON array of [[status-condition-categories]]
- `lastInjuryTime` — timestamp for [[natural-injury-healing]] 24-hour timer
- `restMinutesToday` — minutes rested today (max 480), for [[thirty-minute-rest]]
- `injuriesHealedToday` — injuries healed today (max 3)
- `lastRestReset` — timestamp for daily counter auto reset

## Pokemon-only fields

- `currentEnergy` / `maxEnergy` — [[energy-resource]] pool derived from [[stamina-stat]]

## See also

- [[rest-healing-system]]
