Each move in the [[gm-pokemon-detail-moves-tab]] is rendered as a card (`move-card` class) with a violet left border against a secondary background.

The card layout has four sections, top to bottom:

1. **Header row** — move name (bold, medium font) on the left, type badge on the right (colored by Pokemon type, e.g. "Normal", "Fire")
2. **Details row** — Class (Physical/Special/Status), Frequency (At-Will/EOT/Scene/etc.), AC (if present), Damage formula (if damaging, via the `getMoveDamageFormula` helper)
3. **Range row** — the move's range string (e.g. "Melee, 1 Target, Dash, Push")
4. **Effect text** — the move's full effect description, displayed only when non-empty

Below these, the [[gm-moves-tab-roll-buttons]] appear separated by a top border.
