# VTT Token Displays Combat State Badges

`VTTToken.vue` renders each combatant on the [[battle-grid]] with several visual indicators:

- **HP bar** — colored fill (green/yellow/red) proportional to current HP
- **Name/level label** — shown on hover or when selected (e.g. "Spiritomb Lv.10")
- **Size badge** — shown when `size > 1`, displays "NxN" (e.g. "2×2") per [[token-size-maps-to-grid-footprint]]
- **Elevation badge** — "Z{n}" when elevation > 0 in isometric mode ([[elevation-cost-charges-per-level-change]])
- **Mount badge** — rider icon on mount tokens carrying a rider ([[mounted-token-renders-rider-overlay]])

CSS classes encode combat states: `--selected`, `--multi-selected`, `--current` (active turn), `--flanked` ([[flanking-detection-scales-with-token-size]]), `--fainted`, `--pending-move` ([[player-move-request-follows-confirm-flow]]), `--own` (player's token), and side classes (`--player`, `--ally`, `--enemy`).

Tokens without a sprite (no Pokemon image available) show a single-letter initial as fallback.
