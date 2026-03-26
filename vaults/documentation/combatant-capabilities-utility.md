# Combatant Traits Utility

Shared combatant trait helpers.

**Movement traits:** `combatantCanFly`, `getFlySpeed`, `combatantCanSwim`, `combatantCanBurrow`. Queries [[movement-trait-types|movement traits]] (Landwalker, Flier, Swimmer, Phaser, Burrower, Teleporter). Human trainer movement is computed from skills via [[trainer-derived-stats]].

**Living Weapon:** `getLivingWeaponConfig` — checks whether a Pokemon qualifies as a Living Weapon, with homebrew species fallback. See [[living-weapon-system]].

**Naturewalks:** `getCombatantNaturewalks`, `naturewalkBypassesTerrain`, `findNaturewalkImmuneStatuses` — derived from the [[naturewalk]] trait.

Used across VTT movement, status immunity, and Living Weapon systems.
