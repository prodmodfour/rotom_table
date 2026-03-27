# Capture Roll Mechanics

PTR 1d100 capture roll per [[capture-workflow]].

## Roll formula

```
modifiedRoll = roll + modifiers + ballModifier
```

PTR removes the trainer level modifier — [[only-pokemon-have-levels|trainers have no levels]]. Ball modifiers are negative (e.g. Great Ball = −10), reducing the roll to make capture easier. A critical hit on the [[capture-accuracy-gate|accuracy check]] (natural 20) adds +10 to the effective capture rate.

## Success conditions

- Natural 100 always captures regardless of modifiers
- Otherwise, success when `modifiedRoll ≤ effectiveCaptureRate`

## Output

Returns `success`, `roll`, `modifiedRoll`, `effectiveCaptureRate`, `naturalHundred`, and `ballModifier`.

## See also

- [[capture-rate-formula]]
- [[capture-accuracy-gate]]
- [[poke-ball-system]]
