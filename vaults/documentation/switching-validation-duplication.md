# Switching Validation Duplication

`switching.service.ts` contains three separate validation functions — `validateSwitch`, `validateFaintedSwitch`, and `validateForcedSwitch` — that share substantial duplicated validation logic. Steps 1-8 are nearly identical between the standard and forced switch validators: both check combatant existence, type validity, ownership, fainted status, and turn state.

Adding a fourth switch variant (e.g., U-Turn forced switch) would require writing yet another near-duplicate function. This violates the [[open-closed-principle]] and exhibits the [[duplicate-code-smell]].

A validation pipeline with composable steps — where each step is a small, reusable check — would let new switch variants compose from shared validation logic. This is a [[template-method-pattern]] application: define the validation skeleton, let variants override specific steps.

## See also

- [[extract-method]] — extracting shared validation steps
- [[template-method-pattern]] — the skeleton + override approach
- [[strategy-pattern]] — variant-specific steps as swappable strategies
- [[switching-validation-pipeline]] — a potential pipeline to compose shared validation steps
