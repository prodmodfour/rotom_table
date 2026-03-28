# Capture Accuracy Gate

Poke Ball throws are AC 6 Status Attack Rolls using the full accuracy system per [[full-accuracy-for-pokeball-throws]].

## Calculation

The accuracy check accepts thrower accuracy stage, target Speed Evasion, flanking penalty, and rough terrain penalty. Computes the threshold inline and returns the roll, hit/miss, and threshold.

## Rules

- Natural 1 always misses
- Natural 20 always hits
- Otherwise `roll >= threshold`
- On miss, the Standard Action is consumed but no capture attempt occurs

## Integration

The GM and server both enforce this gate. The player's capture acknowledgment distinguishes misses from capture failures.

## See also

- [[evasion-and-accuracy-system]] — the shared accuracy threshold formula
- [[poke-ball-system]]
- [[capture-roll-mechanics]]
