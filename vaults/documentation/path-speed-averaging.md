When a Pokemon moves across tiles with different terrain speeds (normal, rough, difficult), the app calculates the effective movement cost by averaging terrain modifiers along the path.

This is [[automate-routine-bookkeeping]] applied to movement — the GM does not manually compute mixed-terrain costs. The [[pathfinding-algorithm]] evaluates each tile's movement modifier and produces a total cost for the path.

The result feeds into grid distance calculation, which the player and GM both see as the displayed movement cost.

## See also
- [[automate-routine-bookkeeping]]
- [[pathfinding-algorithm]]
