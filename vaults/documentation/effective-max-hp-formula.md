Each injury reduces a combatant's effective maximum HP by 1/10th of their real max HP, capped at 10 injuries. The formula is `floor(maxHp * (10 - injuries) / 10)`.

Examples:

- 50 max HP with 3 injuries: `floor(50 * 7/10)` = 35
- 100 max HP with 1 injury: `floor(100 * 9/10)` = 90
- 80 max HP with 10 injuries: `floor(80 * 0/10)` = 0

All healing — [[thirty-minute-rest]], [[extended-rest]], [[pokemon-center-healing]], and [[healing-mechanics]] — caps restored HP at this ceiling. The [[hp-injury-system]] creates the injuries that feed into this formula.

## See also

- [[hp-injury-system]]
- [[rest-healing-system]]
