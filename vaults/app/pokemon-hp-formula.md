Pokemon max HP is computed as `level + (hpStat * 3) + 10`, where `hpStat` is the allocated HP stat points (not the base stat).

This formula is used in three places:
- The [[pokemon-creation-tab]] (`create.vue`) computes it when creating a Pokemon manually
- The `POST /api/pokemon/:id/allocate-stats` endpoint recalculates it during [[pokemon-level-up-panel]] stat allocation
- The [[evolution-service]] recalculates it after stat redistribution during evolution

During evolution, current HP is proportionally adjusted to the new max HP.
