The [[equipment-catalog-browser-modal]] provides two filter controls at the top of the modal body:

1. **Slot filter** — a `<select>` dropdown defaulting to "All Slots". Options correspond to the six [[equipment-slot-definitions]]: Head, Body, Main Hand, Off-Hand, Feet, Accessory.
2. **Search** — a text input with a magnifying glass icon and "Search items..." placeholder. Filters items by name or description (case-insensitive substring match).

Both filters apply simultaneously. Items must match the selected slot (if any) and contain the search query in name or description to appear.

The slot filter includes "Main Hand" even though the [[equipment-constants-catalog]] has no items for that slot. Selecting it produces the empty state ("No items match your search").
