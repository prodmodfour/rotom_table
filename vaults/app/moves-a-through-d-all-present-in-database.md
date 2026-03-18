All 174 moves from Absorb through Dynamic Punch are present in the [[movedata-reference-table]], verified via the [[batch-move-lookup-api]]. Each move has values for all core fields: `name`, `type`, `damageClass`, `frequency`, `range`, and `effect`. The `ac` and `damageBase` fields are `null` for Status moves and certain variable-damage moves like [[beat-up-counter-bide-have-variable-damage-bases]].

Notable data variations within the A-D range:

- [[aura-wheel-stored-as-normal-type]] and [[bitter-malice-stored-as-normal-physical]] have incorrect type/class values due to the [[move-seed-splits-by-newline-breaking-multiline-fields]]
- [[dragon-rage-damage-base-parsed-as-fifteen]] stores a numeric DB despite dealing flat damage
- [[curse-frequency-stored-as-see-text]] uses a frequency value outside the [[move-frequency-type]] union
- [[bind-and-clamp-are-static-grapple-passives]] have range `--` and function as passives rather than usable actions
