Outside of active encounters, the player view across all four tabs is entirely read-only:

- [[player-view-character-tab]] — displays stats, skills, features, equipment, and inventory with no editing controls ([[player-character-tab-is-read-only]])
- [[player-view-team-tab]] — shows Pokemon cards that expand to reveal details but offer no management actions
- [[player-view-scene-tab]] — renders the active scene passively
- [[player-view-encounter-tab]] — shows "No active encounter" when none is running

The only write-capable interaction outside encounters is the [[player-view-character-export-import|import button]], which is [[import-endpoint-filters-to-safe-fields|filtered to safe fields]] (background, personality, goals, notes, Pokemon nicknames/held items/move order).

Players cannot create characters, edit stats, change equipment, manage inventory, or add Pokemon from the player view. All data mutation beyond the import's safe fields requires the GM to act through the [[gm-character-detail-edit-mode|GM character detail page]].