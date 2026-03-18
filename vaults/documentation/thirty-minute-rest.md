A 30-minute rest heals 1/16th of the entity's real max HP (minimum 1), capped at the [[effective-max-hp-formula]] ceiling. Implemented in `server/api/characters/[id]/rest.post.ts` and `server/api/pokemon/[id]/rest.post.ts`.

A rest is blocked when:

- The entity has 5 or more injuries
- The entity has already rested 480 minutes today
- Current HP already equals the effective max HP

The endpoint auto-triggers [[daily-counter-auto-reset]] if a new calendar day has started since the last reset, then increments `restMinutesToday` by 30.

## See also

- [[rest-healing-system]]
- [[healing-data-fields]]
