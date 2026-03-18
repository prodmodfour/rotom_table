# Player View Not Linked from Landing

The [[landing-page]] offers links to GM View (`/gm`) and Group View (`/group`) but does not include a link to the player view (`/player`). The [[gm-connect-panel]] shares URLs pointing to the app root, so players who scan the QR code or follow the shared link arrive at the landing page with no visible way to reach the [[player-view-character-selection]].

The `/player` route functions correctly when accessed directly by appending `/player` to the URL.
