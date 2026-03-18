The PTU damage calculation follows a strict 9-step pipeline implemented in `utils/damageCalculation.ts`.

## Steps

1. **Damage Base (DB)** — look up the move's DB value in the [[damage-base-chart]] to get a base damage number.
2. **STAB** — if the attacker shares a type with the move, add the STAB bonus.
3. **Set Damage** — sum DB + STAB into the pre-modifier damage value.
4. **Critical Hit** — on a critical, additional damage is applied at this stage.
5. **Attack Stage** — apply the attacker's relevant attack stat (Attack for physical, Sp.Attack for special) modified by [[combat-stage-system]] multipliers. Focus-equipped trainers add a flat +5 bonus after stage modification (PTU p.295).
6. **Defense Stage** — subtract the target's relevant defense stat (Defense for physical, Sp.Defense for special) modified by [[combat-stage-system]] multipliers. Focus-equipped defenders also get the +5 bonus applied.
7. **Damage Reduction (DR)** — subtract equipment DR. For human targets, DR is computed via [[equipment-bonus-aggregation]]. Helmet conditional DR applies only on critical hits.
8. **Type Effectiveness** — multiply by the type effectiveness multiplier (double, neutral, resist, immune).
9. **Floor** — final damage is floored to a minimum of 1 (or 0 if the target is immune).

The function returns a detailed breakdown object with every intermediate value, enabling the UI to show a step-by-step damage report.

## See also

- [[damage-flow-pipeline]] — the UI component chain that invokes this formula
- [[evasion-and-accuracy-system]] — accuracy check that precedes damage
- [[combat-stage-system]] — stage multipliers used in steps 5 and 6
