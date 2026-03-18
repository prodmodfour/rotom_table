Each item in the [[equipment-catalog-browser-modal]] shows an "Equip" button only when the modal receives a `targetCharacterId` prop. Without a target character, the catalog is browse-only.

Clicking "Equip" sends a PUT request to `/api/characters/{id}/equipment` with the item's slot and data. On success, a green pill-shaped toast animates in at the bottom of the modal reading "Equipped {item name}", then fades out after 2.5 seconds. The modal emits an `equipped` event with the updated equipment slots. On failure, a GM toast shows the error.

The button is disabled while a save is in progress to prevent double-equipping. On the [[gm-character-detail-equipment-tab]], the slot updates immediately to show the [[equipment-tab-equipped-slot-display]] and the [[equipment-tab-combat-bonuses-section]] reflects the new item's bonuses.
