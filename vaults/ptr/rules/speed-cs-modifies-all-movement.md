Speed combat stages affect movement in addition to initiative. A combatant gains or loses movement speed equal to half their current Speed CS value, rounded down per [[always-round-down]]. At Speed CS +6, that's +3 to all movement speeds. Negative CS reduces movement equally but can never reduce it below 2.

This creates a cross-system effect: Paralysis (which applies -4 Speed CS via [[status-cs-auto-apply-with-tracking]]) slows movement in addition to reducing initiative. The app must update movement [[trait-definition|traits]] whenever Speed CS changes.

## See also

- [[combat-stage-asymmetric-scaling]]
- [[dynamic-initiative-on-speed-change]]
