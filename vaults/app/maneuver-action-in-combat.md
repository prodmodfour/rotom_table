The "Combat Maneuvers" section in the [[encounter-act-modal]] is a collapsible panel that appears below "Standard Actions" and above "Status Conditions". When collapsed, it shows a "Combat Maneuvers" header with a ▼ toggle. Expanding it reveals the [[encounter-combat-maneuvers]] grid of 11 maneuver buttons.

Selecting any maneuver from the grid emits an `executeAction` event with the pattern `maneuver:{id}` (e.g. `maneuver:push`, `maneuver:trip`) and immediately closes the modal. There is no intermediate target-selection or damage-rolling step — all maneuver resolution is handled manually by the GM.

The grid includes Standard maneuvers ([[push-maneuver-in-combat]], [[sprint-maneuver-in-combat]], [[trip-maneuver-in-combat]], [[grapple-maneuver-in-combat]], [[disarm-maneuver-in-combat]], [[dirty-trick-maneuver-in-combat]]), one Shift maneuver ([[disengage-maneuver-in-combat]]), two Interrupt maneuvers ([[intercept-melee-maneuver-in-combat]], [[intercept-ranged-maneuver-in-combat]]), and two Full Action maneuvers (Take a Breather, Take a Breather Assisted).

Notably absent from this grid: [[attack-of-opportunity-in-combat]] (has its own prompt component), [[manipulate-maneuver-in-combat]] and its sub-options (not in UI at all).

## See also

- [[encounter-combat-maneuvers]]
- [[encounter-act-modal]]
