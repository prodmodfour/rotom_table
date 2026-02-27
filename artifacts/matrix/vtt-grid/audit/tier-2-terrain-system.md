## Tier 2: Terrain System

### R012 — Basic Terrain Types

- **Rule:** "Regular Terrain: easy to walk on. Earth Terrain: requires Burrow. Underwater: requires Swim."
- **Expected behavior:** Terrain types with appropriate movement costs and capability requirements.
- **Actual behavior:** `app/stores/terrain.ts:17-26` defines `TERRAIN_COSTS`:
  - `normal: 1` (PTU Regular)
  - `difficult: 2` (PTU Slow)
  - `blocking: Infinity` (PTU Blocking)
  - `water: 2` (PTU Underwater — requires Swim, else Infinity)
  - `earth: Infinity` (PTU Earth — requires Burrow, else Infinity)
  - `rough: 1` (PTU Rough — normal movement cost)
  - `hazard: 1`, `elevated: 1` (app-specific additions)

  `terrain.ts:71-82` — `getMovementCost` correctly checks `canSwim` for water and `canBurrow` for earth, returning Infinity if the capability is absent. PTU terrain types are fully covered.
- **Classification:** Correct

### R014 — Slow Terrain

- **Rule:** "When Shifting through Slow Terrain, treat every square meter as two square meters."
- **Expected behavior:** 2x movement cost.
- **Actual behavior:** `terrain.ts:20` — `difficult: 2`. Pathfinding at `usePathfinding.ts:104` — `moveCost = baseCost * terrainMultiplier`. So a straight move into a `difficult` cell costs 1*2=2, and a first-diagonal into difficult costs 1*2=2. This doubles the cost as PTU requires. Water terrain also costs 2 (even with Swim), which is correct — water is Slow Terrain for swimmers per PTU.
- **Classification:** Correct

### R016 — Blocking Terrain

- **Rule:** "Terrain that cannot be Shifted or Targeted through."
- **Expected behavior:** Impassable in movement and targeting.
- **Actual behavior:** `terrain.ts:19` — `blocking: Infinity`. Pathfinding at `usePathfinding.ts:88-90` — `if (!isFinite(terrainMultiplier)) continue` skips blocked cells. `useRangeParser.ts:242-284` — `hasLineOfSight` checks blocking function for targeting. Blocking terrain is correctly impassable for both movement and LoS.
- **Classification:** Correct

### R013 — Movement Capability Types

- **Rule:** "Overland, Sky, Swim, Levitate, Teleporter, Burrow capabilities."
- **Expected behavior:** Capability queries for movement type selection.
- **Actual behavior:** `app/utils/combatantCapabilities.ts` provides:
  - `combatantCanFly` — checks `pokemon.capabilities.sky > 0` (lines 37-43)
  - `getSkySpeed` — returns `pokemon.capabilities.sky` (lines 48-53)
  - `combatantCanSwim` — checks `pokemon.capabilities.swim > 0` (lines 13-18)
  - `combatantCanBurrow` — checks `pokemon.capabilities.burrow > 0` (lines 25-30)
  - Human characters default to 0 for all capabilities.

  `useGridMovement.ts:59-76` — `getTerrainAwareSpeed` selects Swim speed for water terrain, Burrow speed for earth terrain, and Overland for all else. `useElevation.ts` (C026) manages elevation for flying Pokemon. Levitate is handled via the elevation system. Teleporter is not implemented (Out of Scope).
- **Classification:** Correct

---
