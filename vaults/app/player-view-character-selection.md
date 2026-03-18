# Player View Character Selection

The `/player` route initially presents a character selection screen. The page title is "Rotom Table" with the instruction "Select your character to continue."

All characters in the campaign are listed as [[player-view-character-selection-button]] entries. After selecting a character, the view transitions to the [[player-view-header]] and [[player-view-bottom-navigation]]. The selection is [[player-identity-persists-via-local-storage|persisted in localStorage]], so returning to `/player` restores the previously selected character without showing this screen again.


## See also

- [[players-endpoint-filters-by-character-type-and-library]] — the API query backing this selection screen