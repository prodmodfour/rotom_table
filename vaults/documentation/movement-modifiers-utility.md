# Movement Modifiers Utility

Shared movement modifier calculations in `utils/movementModifiers.ts`, used by both client composables and server services for consistent movement budget calculation.

**Function:** `applyMovementModifiers` — applies the following modifiers to a base speed value:

- **Stuck** — blocks movement, speed 0.
- **Tripped** — blocks movement, speed 0.
- **Slowed** — halves movement.
- **Speed CS** — additive modifier from combat stages.
- **Sprint** — +50% movement.
- **Thermosensitive Hail** — halves movement when Hail is active and combatant has the Thermosensitive ability.

## See also

- [[sprint-action]] — the Sprint combat action that grants +50% movement
- [[combat-stage-system]] — Speed CS used as an additive modifier
- [[vtt-component-composable-map]]
