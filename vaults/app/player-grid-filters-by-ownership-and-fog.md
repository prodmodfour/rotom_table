# Player Grid Filters by Ownership and Fog

`usePlayerGridView` controls what players see and can do on the [[player-view-encounter-vtt-map]]. Tokens in fog-hidden cells ([[fog-of-war-tracks-three-cell-states]]) are not rendered. For visible tokens, information is asymmetric: owned tokens show full stats, allied tokens show exact HP, and enemy tokens show rounded HP percentage tiers.

Players can only interact with tokens they own. The move request flow is: select an owned token, tap a destination cell, confirm the move, then wait in a pending state until the GM processes it ([[player-move-request-follows-confirm-flow]]). Non-owned tokens are visible but not selectable.

The [[group-grid-canvas-provides-read-only-spectating]] wraps this filtering into the spectator canvas.
