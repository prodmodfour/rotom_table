The `STAT_LABELS` map in `app/constants/equipment.ts` translates internal stat keys to display strings used in the [[equipment-catalog-grouped-display]] bonus badges. It covers eight stats: Attack, Defense, Sp. Atk, Sp. Def, Speed, HP, Accuracy, and Evasion.

The map is broader than what the current [[equipment-constants-catalog]] uses — only the five Focus accessories reference `statBonus`, and none use HP, Accuracy, or Evasion. The extra entries exist to support potential custom items.
