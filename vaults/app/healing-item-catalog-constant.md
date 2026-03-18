The file `app/constants/healingItems.ts` defines `HEALING_ITEM_CATALOG`, a `Record<string, HealingItemDef>` containing 14 healing items from PTU Chapter 9 (p.276). Items fall into four categories:

**Restoratives** (HP healing): Potion (20 HP, 200P), Super Potion (35 HP, 700P), Hyper Potion (70 HP, 1200P).

**Cures** (status removal): Antidote (cures Poisoned/Badly Poisoned, 100P), Paralyze Heal (cures Paralyzed, 200P), Burn Heal (cures Burned, 250P), Ice Heal (cures Frozen, 250P), Awakening (cures Asleep/Bad Sleep, 250P), Full Heal (cures all persistent + volatile, 600P).

**Combined** (HP + status): Full Restore (heals to full HP + cures all conditions, 3000P).

**Revives**: Revive (restores Fainted to 20 HP + removes 1 injury, 1500P).

Four herbal items are flagged `repulsive: true` (may lower Pokemon loyalty): Energy Powder (50 HP, 500P), Energy Root (200 HP, 800P), Heal Powder (cures all, 450P), Revival Herb (revive to full HP, 2800P).

The `resolveConditionsToCure()` function determines which conditions an item removes from a target. Priority: `curesAllStatus` > `curesAllPersistent` > specific `curesConditions`. Fainted and Dead are excluded from "cure all" operations.

The [[encounter-use-item-modal]] presents these items when a combatant uses an item in combat.
