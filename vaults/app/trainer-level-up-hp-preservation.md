When the [[trainer-level-up-composable|buildUpdatePayload()]] constructs the level-up result, it handles current HP specially. If the character was at full HP before leveling (currentHp >= maxHp), their currentHp is set to the new maxHp — they remain at full health. If they were below full HP, their currentHp is clamped to the new maxHp but otherwise unchanged.

This means a trainer who was at 48/48 HP and levels up to a new max of 53 will be at 53/53. A trainer who was at 30/48 HP will remain at 30/53.
