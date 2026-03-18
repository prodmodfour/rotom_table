# Capture Rate Display Component

`CaptureRateDisplay.vue` in `components/encounter/` presents the [[capture-rate-formula|capture rate]] as a percentage with a [[capture-difficulty-labels|difficulty label]] and color-coded border (green for Very Easy through red for Very Difficult, grayed out for fainted or impossible).

## Breakdown tooltip

Hover reveals the full modifier breakdown: base 100, level, HP, evolution, shiny, legendary, status, injuries, Stuck, Slowed. When a non-Basic Ball is selected, also shows [[ball-modifier-formatting|ball modifier breakdown]]: base modifier, conditional modifier (met or n/a), and total.

Optional "Attempt Capture" button emits an `attempt` event.

Used by both the GM's `CapturePanel` and the player's `PlayerCapturePanel`.

## See also

- [[poke-ball-system]]
- [[encounter-component-categories]]
