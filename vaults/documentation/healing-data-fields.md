The Prisma schema tracks healing state on both `HumanCharacter` and `Pokemon` models.

## Shared fields (both models)

- `currentHp` / `maxHp` — current and maximum hit points
- `temporaryHp` — [[temp-hp-mechanics]] buffer
- `injuries` — injury count feeding into [[effective-max-hp-formula]]
- `statusConditions` — JSON array of [[status-condition-categories]]
- `lastInjuryTime` — timestamp for [[natural-injury-healing]] 24-hour timer
- `restMinutesToday` — minutes rested today (max 480), for [[thirty-minute-rest]]
- `injuriesHealedToday` — injuries healed today (max 3)
- `lastRestReset` — timestamp for [[daily-counter-auto-reset]]

## Trainer-only fields (HumanCharacter)

- `drainedAp` — AP spent on [[ap-drain-injury-healing]]
- `boundAp` — AP temporarily locked
- `currentAp` — current available [[trainer-action-points]]

## Pokemon-only fields

- `moves` — JSON with `usedToday`, `usedThisScene`, `lastUsedAt` per move, tracked by [[move-frequency-system]]

## See also

- [[prisma-schema-overview]]
- [[rest-healing-system]]
