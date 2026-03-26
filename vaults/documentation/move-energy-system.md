Every PTR move has an Energy Cost that determines how much Energy it consumes when used (per [[move-energy-cost]]). This replaces PTR's frequency system (At-Will/EOT/Scene/Daily) with a single resource pool.

## Energy Resource

Energy is derived from the Stamina stat via [[energy-stamina-scaling]]: **Energy = max(3, floor(2 × √Stamina))**. It regenerates at a base rate of 1 per turn (per [[energy-regain-rate]]), modifiable by traits.

## Move Usage Validation

The app validates move usage by checking whether the combatant has sufficient Energy to cover the move's cost. The execute-move API endpoint checks Energy before allowing a move, then deducts the cost after successful execution.

## Depletion and Overdraft

Running out of Energy causes [[fatigue-levels|Fatigue]] (per [[zero-energy-causes-fatigue]]). Combatants can overdraft — spending more Energy than they have — at the cost of 3 Fatigue levels (per [[energy-overdraft]]). Energy cannot go below 0.

## See also

- [[nine-step-damage-formula]] — damage calculation that follows a successful energy check
- [[turn-lifecycle]] — turn boundaries where energy regenerates
- [[energy-for-extra-movement]] — energy can also be spent on additional movement
- [[energy-resource]] — the PTR vault's full energy system description
