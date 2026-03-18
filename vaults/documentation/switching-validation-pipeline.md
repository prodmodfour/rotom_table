# Switching Validation Pipeline

A potential [[template-method-pattern]] / pipeline to address the [[switching-validation-duplication|three near-identical validators in switching.service.ts]].

## The idea

Define shared validation steps as composable functions. Each switch variant composes the steps it needs:

```
const SHARED_STEPS = [
  checkCombatantExists,
  checkCombatantIsOwned,
  checkReplacementExists,
  checkReplacementNotInEncounter,
  checkReplacementNotFainted,  // skipped by faintedSwitch
  checkTurnState,
]

function validateSwitch(enc, req) {
  return runPipeline(SHARED_STEPS, enc, req)
}

function validateFaintedSwitch(enc, req) {
  return runPipeline(SHARED_STEPS.filter(s => s !== checkReplacementNotFainted), enc, req)
}
```

New switch variants (e.g., U-Turn switch) compose from the same building blocks.

## Principles improved

- [[open-closed-principle]] — new variants compose from existing steps without modifying existing validators
- [[duplicate-code-smell]] — shared steps written once, not three times
- [[template-method-pattern]] — the validation skeleton with variant-specific step selection

## Trade-offs

- Validation pipelines can be harder to debug than explicit sequential code — when a step fails, the stack trace points to the pipeline runner, not the business logic
- Error messages become generic unless each step returns structured error information (not just pass/fail)
- The three validators may have subtle ordering differences that a pipeline would need to preserve
- A step-filtering approach (`SHARED_STEPS.filter(...)`) can be brittle — removing a step by reference risks silent bugs if the step function is renamed or refactored
- For only 3 variants, the pipeline machinery may be more complex than the duplication it eliminates

## Open questions

- Pipeline (sequential function composition with filtering) or Template Method (base validator with override hooks)? Pipeline is more flexible; Template Method is more explicit about what varies.
- Should steps return `{ valid: boolean; error?: string }` or throw validation errors? The current validators use `throw` with message strings.
- Would named step sets per variant be clearer than filtering? E.g., `STANDARD_STEPS`, `FAINTED_STEPS`, `FORCED_STEPS` as explicit arrays.
- Is the expected addition of new switch variants realistic enough to justify the abstraction? If U-Turn is the only foreseeable addition, maybe the duplication is tolerable.

## See also

- [[chain-of-responsibility-pattern]] — validation steps as a chain where each can reject
- [[strategy-pattern]] — variant-specific steps as swappable strategies
