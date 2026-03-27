# Switching System

Pokemon switch, recall, and release during encounters.

## Switch (Full)

Standard Action. Recall the active Pokemon (8m [[poke-ball-recall-range|range check]]) and release a bench Pokemon. The new combatant is inserted into the turn order at the appropriate initiative position. Volatile [[status-condition-categories|conditions]] are cleared on recall.

## Recall (Standalone)

1st recall per round costs a Shift Action; 2nd costs a Standard Action. Removes from field, clears volatile conditions.

## Release (Standalone)

1st release per round costs a Shift Action; 2nd costs a Standard Action. Auto-places adjacent to trainer. If the released Pokemon's initiative has not yet passed in this round, it may act immediately.

## Validation

A 10-step validation chain ensures: the bench Pokemon exists, the trainer owns it, it's not already active, it's not fainted (unless fainted-switch), range is within 8m, and action economy allows it.

## See also

- [[status-condition-categories]] — volatile conditions cleared on recall
- [[faint-and-revival-effects]] — fainted switch triggers special validation
- [[initiative-and-turn-order]] — new combatant inserted by initiative
- [[turn-lifecycle]]
- [[deployment-state-model]] — tracks active/reserve/fainted roster for switching decisions
