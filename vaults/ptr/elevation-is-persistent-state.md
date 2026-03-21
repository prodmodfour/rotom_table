# Elevation Is Persistent State

Vertical positioning — token elevation and terrain height — is real game state that must persist across turns, sessions, and views. PTU has vertical movement (flying via Sky [[trait-definition|trait]]) that persists across turns. If elevation is ephemeral, the game state becomes inconsistent.

A flying Pokemon at elevation 3 at the end of round 2 is still at elevation 3 at the start of round 3. If the page reloads between rounds, elevation must survive. If the group view shows the battle, it must show the same elevations the GM sees.

This means elevation needs the same persistence treatment as token positions and terrain types — saved to the database and synced via WebSocket.

## See also

- [[innate-traits]] — Sky is a species trait that enables flight
- [[grid-mode-is-encounter-identity]] — encounter visual state should persist
- [[the-table-as-shared-space]] — group view must reflect the same game state
