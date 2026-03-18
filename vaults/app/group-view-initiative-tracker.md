# Group View Initiative Tracker

The initiative sidebar in the [[group-view-encounter-tab]] lists all combatants sorted by initiative order. Each entry shows a position number, a sprite (Pokemon) or avatar (trainer), the combatant name, an HP bar, and the initiative value.

Entries are color-coded by side — a left border in the side color (player, ally, or enemy). The current turn entry gets a highlighted background, a full side-colored border, and a glow shadow. Combatants that cannot be commanded appear at reduced opacity with partial grayscale and a "Cannot Act" label.

A "Flanked" badge appears on entries whose combatant is flanked according to the flanking map received from the GM via WebSocket.

HP bars use four-tier coloring: green above 50%, yellow at 25–50%, red below 25%, and a collapsed dark bar when fainted. The HP percentage accounts for injuries via `getEffectiveMaxHp`.

The title changes based on the encounter phase: "Declaration (Low → High)" during trainer declaration, "Resolution (High → Low)" during trainer resolution, "Pokemon Phase" during the pokemon phase, and "Initiative" as the default.

Trainer avatars fall back to the first letter of the trainer name when the sprite fails to load.

## See also

- [[group-view-combatant-details-panel]] — the right-side panel showing details for the current turn combatant
- [[group-view-layout-optimized-for-tv]] — at 4K the sidebar grows from 280px to 400px