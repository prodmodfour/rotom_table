The [[trainer-level-up-modal]] accepts an optional `fromLevel` prop that overrides the character's current level for advancement calculation. This exists because [[xp-award-updates-level-immediately|the server updates the level immediately]] when XP is awarded, so by the time the modal opens, `character.level` may already reflect the new level.

Without `fromLevel`, the modal would compute advancement from the new level to itself (e.g., level 2 -> 2), which yields zero gains. The `fromLevel` prop ensures the modal computes advancement from the pre-XP level (e.g., level 1 -> 2), producing the correct entitlements.

The character detail page passes `fromLevel` when the level-up is triggered by the [[gm-character-detail-xp-section]] XP award path.
