When a slot on the [[gm-character-detail-equipment-tab]] has an item equipped, the dropdown selector is replaced by a read-only display showing the item name and an "Unequip item" button rendered as an X icon. Clicking the X sends a PUT request to clear that slot and restores the dropdown to its "-- Empty --" default.

This display applies both when equipping via the per-slot dropdown and when equipping through the [[equipment-catalog-browser-modal]] — the slot updates immediately on success in both cases.
