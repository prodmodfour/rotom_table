# Movement Modifiers Utility

Shared movement modifier calculations in `utils/movementModifiers.ts`, used by both client composables and server services for consistent movement budget calculation.

**Function:** `applyMovementModifiers` — applies the following modifiers to a base speed value:

- **Stuck** — blocks movement, speed 0.
- **Tripped** — blocks movement, speed 0.
- **Slowed** — halves movement per [[slowed-halves-movement]].
- **Speed CS** — additive modifier from combat stages.
- **Thermosensitive Hail** — halves movement when Hail is active and combatant has the Thermosensitive trait.

## See also

- [[energy-for-extra-movement]] — spend 5 Energy for additional movement (replaces Sprint)
- [[combat-stage-system]] — Speed CS used as an additive modifier
- [[vtt-component-composable-map]]
