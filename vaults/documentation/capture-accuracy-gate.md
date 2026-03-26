# Capture Accuracy Gate

Poke Ball throws are AC 6 Status Attack Rolls using the full accuracy system per [[full-accuracy-for-pokeball-throws]].

## Calculation

`rollAccuracyCheck(params?: CaptureAccuracyParams)` accepts thrower accuracy stage, target Speed Evasion, flanking penalty, and rough terrain penalty. Computes threshold inline as a single expression matching the `useMoveCalculation.ts` formula to avoid double clamping. Returns `{ roll, isNat1, isNat20, hits, threshold }`.

## Rules

- Natural 1 always misses
- Natural 20 always hits
- Otherwise `roll >= threshold`
- On miss, the Standard Action is consumed but no capture attempt occurs

## Integration

`CombatantCaptureSection.vue` computes accuracy params from encounter combatant data (trainer accuracy CS, target speedEvasion). Both `handleApproveCapture` (GM-side) and `attempt.post.ts` (server-side) enforce this gate. Player acknowledgment includes `accuracyHit: boolean` to distinguish misses from capture failures.

## See also

- [[evasion-and-accuracy-system]] — the shared accuracy threshold formula
- [[poke-ball-system]]
- [[capture-roll-mechanics]]
- [[damage-flow-pipeline]]
