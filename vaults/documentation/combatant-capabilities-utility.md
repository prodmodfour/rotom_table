# Combatant Capabilities Utility

Shared combatant capability helpers in `utils/combatantCapabilities.ts`.

**Movement capabilities:** `combatantCanFly`, `getSkySpeed`, `combatantCanSwim`, `combatantCanBurrow`. Human trainer Overland/Swimming speeds are computed from skills via [[trainer-derived-stats]].

**Living Weapon:** `getLivingWeaponConfig` — checks whether a Pokemon qualifies as a Living Weapon, with homebrew species fallback. See [[living-weapon-system]].

**Naturewalks:** `getCombatantNaturewalks`, `naturewalkBypassesTerrain`, `findNaturewalkImmuneStatuses` — derived from the [[trainer-capabilities-field]].

Used across VTT movement, status immunity, and Living Weapon systems.
