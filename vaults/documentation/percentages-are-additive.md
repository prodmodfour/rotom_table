When multiple percentage-based modifiers apply to the same value, they add together rather than multiply. A +50% bonus and a +25% bonus produce +75%, not +87.5%.

Multiplicative stacking compounds quickly and can produce values far outside PTR's expected ranges. Additive stacking keeps the total modifier predictable and bounded. This aligns with how PTR's text reads percentage bonuses — as flat additions to a multiplier, not as successive scaling operations.

This applies throughout the [[damage-flow-pipeline]] and anywhere else percentage modifiers stack: STAB, type effectiveness adjustments, ability bonuses, item bonuses.

## See also

- [[raw-fidelity-as-default]] — additive stacking matches how PTR text reads, and prevents unintended compounding
- [[nine-step-damage-formula]] — the primary place where percentage modifiers accumulate
