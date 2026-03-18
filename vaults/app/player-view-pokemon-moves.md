# Player View Pokemon Moves

A section within an expanded [[player-view-pokemon-card]], labeled "Moves." Each move is a clickable row that toggles between collapsed and expanded states.

**Collapsed** — shows two lines:
- Top line: a colored type badge (e.g. "Normal", "Ground", "Dragon"), the move name in bold, and the damage category (Physical, Special, or Status) on the far right
- Bottom line: DB value (if applicable), AC value, and frequency (e.g. "At-Will", "EOT") on the far right

**Expanded** — adds below the collapsed content:
- Range line (e.g. "Range Melee, 1 Target, Dash, Push" or "Range 4, 1 Target")
- Effect description paragraph (e.g. "The target is Pushed 2 Meters.")

Clicking any move toggles all moves in that Pokemon's card simultaneously — see [[player-view-moves-toggle-all-together]].

The data shown comes from the [[pokemon-moves-stored-as-json]] column on the Pokemon record.
