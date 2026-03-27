# Movement Preview Sync

The `movement_preview` WebSocket event broadcasts token movement previews from GM to Group View during drag operations, enabling real-time position syncing.

**Payload:** Combatant ID and preview position (grid coordinates).

**Flow:** GM drags a token on the grid -> client emits `movement_preview` via WebSocket -> server broadcasts to group clients -> Group View renders the token at the preview position.

This provides responsive feedback in the group display while the GM is still dragging, before the final position is committed via the position API.

## See also

