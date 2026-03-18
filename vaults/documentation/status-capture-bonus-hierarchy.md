Status conditions provide capture rate bonuses in a defined hierarchy. Sleep and Freeze give the highest bonus, followed by Paralysis, Burn, and Poison at a lower tier. The bonuses do not stack — only the highest applicable bonus from the target's active conditions applies to the [[capture-rate-formula]].

The hierarchy (from PTU capture rules):
- **Sleep, Freeze**: highest bonus
- **Paralysis, Burn, Poison**: moderate bonus
- **Other conditions**: no capture bonus

This is a simple lookup within the [[ball-condition-service]] — when calculating capture rate, the service checks the target's active conditions, finds the highest-tier match, and applies that single bonus. If a Pokemon is both Paralyzed and Asleep, only the Sleep bonus applies.

The [[capture-rate-display-component]] shows the player which bonus is active and why, making the capture rate calculation transparent. This supports the broader goal of [[automate-routine-bookkeeping]] — players shouldn't need to remember which conditions give bonuses or manually calculate the modifier.

## See also
- [[capture-rate-formula]] — where the status bonus feeds into the overall calculation
- [[capture-rate-display-component]] — UI display of the active status bonus
- [[status-condition-categories]] — the conditions referenced in this hierarchy
- [[ball-condition-service]] — service that resolves condition bonuses
