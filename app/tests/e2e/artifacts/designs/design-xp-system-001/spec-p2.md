# P2 Specification

## E. Level-Up Detection & Notification (P2)

### Level-Up Response Data

The `xp-distribute` endpoint (P0) already returns `XpApplicationResult[]` which includes `levelsGained` and `levelUps[]`. P2 builds UI on top of this.

### New Component: `app/components/encounter/LevelUpNotification.vue`

Displayed after XP distribution succeeds, for each Pokemon that leveled up:

1. **Species name** and new level
2. **+1 Stat Point available** reminder (per level gained)
3. **New moves available** from learnset at this level
4. **Evolution available** flag (if applicable)
5. **New ability slot** (at Level 20 or 40)
6. **Tutor Point gained** (at levels divisible by 5)

This is informational only in P2 -- the GM/player must navigate to the Pokemon sheet to apply stat points, choose moves, and trigger evolution. Full automation is out of scope for this design.

### Future: Stat Allocation Modal (P2 stretch)

If time permits, a modal that lets the player immediately allocate their +1 stat point per level gained, with Base Relations Rule validation. This would:
1. Load the Pokemon's base stats and current stat point distribution
2. Show which stats can legally receive the point (respecting Base Relations)
3. Apply the stat point and recalculate derived stats (maxHp, evasions)
4. Save to database

This requires understanding the full Base Relations Rule implementation, which may warrant its own design spec if complexity is high.

---

