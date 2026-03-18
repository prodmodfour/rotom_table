# Encounter Use Item Modal

A modal opened by clicking the "Item" button on an [[encounter-combatant-card]]. The title reads "Use Item".

The modal shows:

- **User** — the combatant's name with a "Full-Round" badge (orange), indicating item use costs a full-round action (Standard + Shift)
- **Target** — a dropdown listing eligible targets with their current HP (e.g. "Ash (10/10 HP)")
- A note: "Full-Round Action (Standard + Shift)"
- An item list area — shows "No applicable items for this target." when the target has no usable items in inventory. Healing items are sourced from the [[healing-item-catalog-constant]]

Footer controls:

- **GM Mode** checkbox — allows overriding item restrictions
- **Target Refuses** button — disabled when no item is selected
- **Cancel** button
- **Apply Item** button
