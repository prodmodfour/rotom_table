# Group View Lobby Tab

The default tab of the [[group-view-page]]. It fetches all player characters from `/api/characters/players` on mount and renders them in a responsive grid of [[group-view-lobby-player-card]]s.

The grid uses `auto-fit` columns with a 400px minimum width, so on a wide display it shows two or more columns. If no player characters exist in the library, a centered "No player characters in library" message appears instead.

The lobby also mounts a [[group-view-wild-spawn-overlay]] that polls for wild spawn previews every second. When a wild spawn is active, the overlay covers the entire lobby.

## See also

- [[group-view-tab-state]] — must be set to "lobby" for this tab to display
