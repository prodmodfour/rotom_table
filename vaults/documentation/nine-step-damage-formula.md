The PTR damage calculation follows a strict 9-step pipeline implemented in `utils/damageCalculation.ts`.

## Steps

1. **Initial Damage Base** — look up the move's DB value in the [[damage-base-to-dice-table]] to get a base dice expression.
2. **Five/Double-Strike** — if the move is a multi-strike move, modify the DB accordingly.
3. **DB Modifiers** — add all Damage Base modifiers. [[stab-adds-to-damage-base|STAB]] adds +2 to DB if the attacker shares a type with the move. Other sources (traits, weather) also apply here. The modified DB determines the final dice expression.
4. **Critical Hit** — if a crit, [[crit-doubles-dice-not-stats|double the dice portion only]], not stat bonuses. Some traits (e.g. [[sniper]]) add bonus damage that also gets multiplied.
5. **Roll Damage** — roll the dice expression from step 3 (modified by step 4 if crit), or use set damage if the move has a fixed damage value.
6. **Add Attacker's Stat** — add the attacker's relevant stat (Attack for physical, Sp.Attack for special) modified by [[combat-stage-asymmetric-scaling|combat stage multipliers]], plus any other flat bonuses.
7. **Subtract Defender's Stat and DR** — subtract the target's relevant defense stat (Defense for physical, Sp.Defense for special) modified by [[combat-stage-asymmetric-scaling|combat stage multipliers]], and subtract any damage reduction. A minimum floor of 1 applies here per [[non-immune-attacks-deal-damage]].
8. **Type Effectiveness** — multiply by the type effectiveness multiplier (double, neutral, resist, immune). A second minimum floor of 1 applies here — only full immunity (x0) produces 0. [[trainers-are-typeless|Trainer targets skip this step entirely]].
9. **Apply to HP** — subtract from the target's HP and check for [[hp-injury-system|injuries]].

The function returns a detailed breakdown object with every intermediate value, enabling the UI to show a step-by-step damage report.

## See also

- [[damage-flow-pipeline]] — the UI component chain that invokes this formula
- [[evasion-and-accuracy-system]] — accuracy check that precedes damage
- [[combat-stage-asymmetric-scaling]] — stage multipliers used in steps 6 and 7
- [[non-immune-attacks-deal-damage]] — minimum floors at steps 7 and 8
