---
review_id: rules-review-177
review_type: rules
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-112
domain: vtt-grid
commits_reviewed:
  - c2741566cf87ffca1c043bee83566396f145f432
  - a9cedd349218a52eb0debeac95c48bbfc675dd22
  - 3c287c86cf136597e8a6735553032b1eeea63d82
  - 9fd4d128ccfdc52240a175ac79f215182b467b8e
files_reviewed:
  - app/constants/naturewalk.ts
  - app/utils/combatantCapabilities.ts
  - app/composables/useGridMovement.ts
  - app/composables/useMoveCalculation.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-27T22:15:00Z
follows_up: null
---

## Review Scope

Rules review of ptu-rule-112 implementation: Naturewalk capability terrain bypass. Verified all PTU rule references, decree compliance, and game-mechanical correctness of the terrain mapping, movement cost bypass, and accuracy penalty bypass.

### PTU Sources Checked

- **PTU p.322 (10-indices-and-reference.md:322-325):** "Naturewalk is always listed with Terrain types in parentheses, such as Naturewalk (Forest and Grassland). Pokemon with Naturewalk treat all listed terrains as Basic Terrain."
- **PTU p.443 (07-combat.md:443-444):** "Basic Terrain Type affects which Movement Capability you use to Shift." (Definition of Basic Terrain as the base type that has no movement modifiers.)
- **PTU p.465-478 (07-combat.md:465-485):** Slow Terrain doubles movement cost. Rough Terrain applies -2 accuracy penalty. Most Rough is also Slow.
- **PTU p.2136 (07-combat.md:2135-2138):** Example showing Oddish with Naturewalk (Forest, Grassland) bypassing the -2 rough terrain accuracy penalty in a forest encounter.
- **PTU p.1701-1714 (09-gear-and-items.md):** Snow Boots grant Naturewalk (Tundra) to humans. Jungle Boots grant Naturewalk (Forest) to humans.
- **PTU Survivalist class (p.4694):** Lists all 9 Naturewalk terrain categories: Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert.

### Decrees Checked

- **decree-003:** Enemy-occupied rough terrain is a game mechanic (not painted terrain). Naturewalk must NOT bypass it.
- **decree-010:** Multi-tag terrain system. Rough and slow are separate flags on cells.
- **decree-025:** Endpoint cells excluded from rough terrain accuracy penalty check.

## Rules Verification

### R1: Naturewalk Terrain Categories (PASS)

The `NATUREWALK_TERRAINS` array in `constants/naturewalk.ts` lists all 9 PTU terrain categories: Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert. Cross-referenced with the Survivalist class list at p.4694. Complete.

### R2: Basic Terrain Definition (PASS)

PTU p.443 defines Basic Terrain as the terrain type that determines which Movement Capability you use (Regular, Underwater, Pokemon-Accessible). Basic Terrain has no movement modifiers — no slow doubling, no rough penalty. The implementation correctly treats Naturewalk-matched terrain as having:
- No slow flag effect (base cost without doubling in `getTerrainCostForCombatant`)
- No rough flag effect (bypass in `targetsThroughRoughTerrain`)

### R3: Slow Terrain Bypass (PASS)

PTU p.465-474: "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead."

Naturewalk converts listed terrain to Basic Terrain, removing the Slow modifier. The implementation in `getTerrainCostForCombatant` (useGridMovement.ts:385-387) checks `flags.slow && naturewalkBypassesTerrain(combatant, terrain)` and returns `TERRAIN_COSTS[terrain]` (base cost 1) instead of the doubled cost. Correct.

### R4: Rough Terrain Accuracy Penalty Bypass (PASS)

PTU p.476-478: "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls."

PTU p.2136 example: "Other Pokemon would also take a penalty of 2 from targeting through Rough Terrain, but Oddish has the Naturewalk (Forest, Grassland) Capability and is not hindered by the grassy terrain."

The implementation in `targetsThroughRoughTerrain` (useMoveCalculation.ts:205-209) checks painted rough terrain and applies the Naturewalk bypass: if the attacker has a Naturewalk matching the cell's base terrain type, the rough flag is treated as if absent. This matches the PTU example exactly — the Oddish is the attacker, and its Naturewalk lets it ignore the forest rough terrain when targeting.

### R5: Enemy-Occupied Rough Terrain Not Bypassed (PASS)

Per decree-003 (PTU p.480-485): "Squares occupied by enemies always count as Rough Terrain."

Enemy-occupied rough terrain is a GAME MECHANIC (dynamic property of combatant positions), not PAINTED TERRAIN (static property of the cell). Naturewalk only affects terrain types, not game mechanics.

The implementation checks enemy-occupied cells FIRST (useMoveCalculation.ts:200-202) and returns `true` immediately without any Naturewalk check. The Naturewalk bypass only applies to the subsequent painted terrain check (lines 205-209). This ordering is correct and deliberate per decree-003.

### R6: Naturewalk Terrain Mapping to App Base Types (PASS with known limitation)

The app's terrain painter uses generic base types (normal, water, earth, elevated, blocking, hazard) that do not map 1:1 to PTU terrain categories. The mapping in `NATUREWALK_TERRAIN_MAP` is reasonable:

| PTU Terrain | App Base Types | Rationale |
|---|---|---|
| Grassland | normal | Grass/plains are normal ground |
| Forest | normal | Forests with underbrush are normal ground + rough/slow flags |
| Wetlands | water, normal | Marshes mix water and normal terrain |
| Ocean | water | Deep water |
| Tundra | normal | Snow/ice is normal ground + slow flag |
| Mountain | elevated, normal | Rocky terrain uses elevated + normal |
| Cave | earth, normal | Underground uses earth + normal for cave floors |
| Urban | normal | City terrain is normal ground |
| Desert | normal | Sand terrain is normal ground + slow flag |

**Known limitation:** Multiple PTU categories (Forest, Grassland, Tundra, Desert, Urban) all map to `normal` base type. A Pokemon with Naturewalk (Forest) will bypass slow/rough on ALL normal terrain, not just forest-themed terrain. This is documented in the constants file and is an acceptable limitation given the terrain painter's design. The GM must set up terrain appropriately.

### R7: Human Naturewalk Support (ACCEPTABLE)

PTU p.1701-1714 shows Snow Boots and Jungle Boots granting Naturewalk to human characters. The implementation's `getCombatantNaturewalks` returns empty for non-Pokemon combatants (`combatant.type !== 'pokemon'`). This is correct for the current data model — human characters do not have a `capabilities` field. Equipment-granted Naturewalk is a separate feature that would require the equipment system to contribute capabilities to the combatant. This is out of scope for ptu-rule-112 and documented as a known gap in the equipment system.

### R8: Naturewalk Data Extraction (PASS)

PTU pokedex entries format Naturewalk in the capability list as "Naturewalk (Forest, Grassland)" or "Naturewalk (Tundra)". The implementation parses from two sources:

1. `capabilities.naturewalk` — direct string array from the seeder
2. `capabilities.otherCapabilities` — parsed via regex from strings like "Naturewalk (Forest, Grassland)"

The regex handles comma separation, "and" conjunction, and case-insensitive matching. Verified against actual pokedex data (Grotle: "Naturewalk (Grassland, Forest)", Glaceon: "Naturewalk (Tundra)", Phione: "Naturewalk (Ocean)").

### R9: Impassable Terrain Unaffected (PASS)

Naturewalk makes terrain "Basic" — it does not grant the ability to traverse otherwise impassable terrain. The implementation correctly checks impassable conditions (blocking, water without Swim, earth without Burrow) BEFORE the Naturewalk bypass in `getTerrainCostForCombatant` (lines 379-381). A Pokemon with Naturewalk (Ocean) but no Swim capability still cannot enter water terrain. Correct per PTU — Naturewalk removes terrain MODIFIERS, not terrain REQUIREMENTS.

### R10: Decree-025 Endpoint Exclusion Preserved (PASS)

The `targetsThroughRoughTerrain` function continues to exclude actor and target cells from the rough terrain check (lines 163-175 build exclusion sets, line 197 checks against them). The Naturewalk changes did not alter this behavior. Per decree-025, this is correct.

## Issues

### MEDIUM

#### MED-1: Naturewalk on the ATTACKER bypasses rough — should the TARGET's Naturewalk also matter?

The PTU p.2136 example shows the attacker (Oddish) using its Naturewalk to bypass the rough terrain accuracy penalty. The implementation checks `actor.value` (the attacker) in `targetsThroughRoughTerrain`. The question is: if the TARGET has Naturewalk matching the terrain, should that also bypass the penalty?

PTU text says: "Pokemon with Naturewalk treat all listed terrains as Basic Terrain." This is about the Pokemon's own movement and experience of the terrain. The accuracy penalty is about targeting THROUGH rough terrain — the penalty applies to the attacker, not the target. The PTU example confirms this: Oddish (attacker) uses its own Naturewalk.

**Ruling:** The current implementation (attacker's Naturewalk only) is correct. The target's Naturewalk is irrelevant to the attacker's accuracy penalty. No change needed.

## Verdict

**APPROVED**

The implementation faithfully translates PTU Naturewalk rules into the app's terrain system. All 9 Naturewalk terrain categories are covered. Both movement cost bypass (slow flag) and accuracy penalty bypass (rough flag) are correctly implemented. Decree-003 (enemy-occupied rough never bypassed), decree-010 (multi-tag system), and decree-025 (endpoint exclusion) are all respected. The terrain mapping has a known limitation (multiple PTU categories mapping to `normal`) that is well-documented and acceptable given the terrain painter's design.

The code review (code-review-201) has separate issues around test coverage and documentation that are not rules concerns.
