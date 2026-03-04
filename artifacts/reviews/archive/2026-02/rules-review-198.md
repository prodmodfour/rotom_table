---
review_id: rules-review-198
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-120
domain: combat+character-lifecycle
commits_reviewed:
  - b34916d
  - f7b6f84
  - 5c1f8f6
  - 04ece11
  - c648df0
  - 8a6ed18
  - 0dfb08a
mechanics_verified:
  - equipment-granted-naturewalk
  - naturewalk-terrain-bypass
  - naturewalk-status-immunity
  - equipment-capability-catalog
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/09-gear-and-items.md#feet-equipment-p293
  - core/10-indices-and-reference.md#naturewalk-p322
  - core/04-trainer-classes.md#survivalist-p149
  - core/04-trainer-classes.md#naturewalk-immunity-p276
reviewed_at: 2026-02-28T18:30:00Z
follows_up: null
---

## Mechanics Verified

### Equipment-Granted Naturewalk (Catalog Accuracy)

- **Rule:** "Snow Boots grant you the Naturewalk (Tundra) capability, but lower your Overland Speed by -1 while on ice or deep snow." (`core/09-gear-and-items.md` line 1701-1702)
- **Rule:** "Jungle Boots grant you the Naturewalk (Forest) capability" (`core/09-gear-and-items.md` line 1714)
- **Implementation:** `EQUIPMENT_CATALOG` in `app/constants/equipment.ts` defines Snow Boots with `grantedCapabilities: ['Naturewalk (Tundra)']` and Jungle Boots with `grantedCapabilities: ['Naturewalk (Forest)']`. Both are `slot: 'feet'` and priced at $1500, matching the rulebook exactly.
- **Status:** CORRECT

The terrain names "Tundra" and "Forest" match the PTU Survivalist terrain list (`core/04-trainer-classes.md` line 4694) and the `NaturewalkTerrain` type in `app/constants/naturewalk.ts`. No data mismatch.

### Equipment Capability Derivation

- **Rule:** Equipment items grant capabilities while worn. The capability is active only while the item is equipped.
- **Implementation:** `getEquipmentGrantedCapabilities()` in `app/utils/equipmentBonuses.ts` iterates all equipped items and collects `grantedCapabilities` strings into a deduplicated array. Pure function, no side effects. Uses `Set<string>` for deduplication.
- **Status:** CORRECT

The function correctly handles: empty equipment (returns `[]`), items without `grantedCapabilities` (skipped via `continue`), and deduplication when multiple items grant the same capability.

### Naturewalk Terrain Bypass (Merged Sources)

- **Rule:** "Naturewalk is always listed with Terrain types in parentheses, such as Naturewalk (Forest and Grassland). Pokemon with Naturewalk treat all listed terrains as Basic Terrain." (`core/10-indices-and-reference.md` line 322-325)
- **Implementation:** `getCombatantNaturewalks()` in `app/utils/combatantCapabilities.ts` merges three Naturewalk sources for human combatants:
  1. `HumanCharacter.capabilities[]` (manual/Survivalist class, PTU p.149)
  2. Equipment-derived capabilities via `getEquipmentGrantedCapabilities(human.equipment)`

  Both sources are concatenated, parsed for "Naturewalk (X)" patterns, and deduplicated via `Set`. The `naturewalkBypassesTerrain()` function then maps parsed terrain names to base terrain types via `NATUREWALK_TERRAIN_MAP`.
- **Status:** CORRECT

The merge logic correctly handles: trainer with no equipment (only manual caps), trainer with only equipment caps (only equipment-derived), trainer with both sources (merged and deduplicated), and the null-safety guard `human.equipment ?? {}`.

### Naturewalk Status Immunity (Human Extension)

- **Rule:** "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains." (`core/04-trainer-classes.md` line 2800-2801)
- **Rule:** PTU p.149 Survivalist: "You gain Naturewalk for that terrain" -- trainers gain the full Naturewalk capability, including the immunity aspect.
- **Implementation:** In `app/server/api/encounters/[id]/status.post.ts`, the Naturewalk immunity check was previously gated by `combatant.type === 'pokemon'`. The fix removes this type guard, allowing the check to run for both Pokemon and human combatants. The underlying `findNaturewalkImmuneStatuses()` already correctly handled both types (it delegates to `getCombatantNaturewalks()` which handles both).
- **Status:** CORRECT

The fix is minimal and correct. The `findNaturewalkImmuneStatuses()` function was already type-agnostic -- only the guard in `status.post.ts` artificially restricted it to Pokemon. The GM override mechanism (`body.override`) remains intact per decree-012.

### Decree Compliance

- **decree-003:** The implementation does not affect enemy-occupied rough terrain. `naturewalkBypassesTerrain()` only checks painted terrain cells. COMPLIANT.
- **decree-010:** Multi-tag terrain is orthogonal to this change. Naturewalk bypasses both rough and slow flags on matching terrain. COMPLIANT.
- **decree-012:** The Naturewalk immunity check follows the same pattern as type-based immunity: reject by default, allow `override: true` for GM override. COMPLIANT.

### API Layer (Zod Validation)

- **Implementation:** The `equipment.put.ts` Zod schema includes `grantedCapabilities: z.array(z.string().min(1)).optional()`. The `.strict()` modifier ensures no unexpected fields pass through.
- **Status:** CORRECT -- custom items can include `grantedCapabilities`, and the validation allows it.

### GET Response

- **Implementation:** `equipment.get.ts` now returns `grantedCapabilities` alongside `aggregateBonuses` in the response, computed from the stored equipment via `getEquipmentGrantedCapabilities()`.
- **Status:** CORRECT -- derived at read time from persisted equipment data, consistent with PUT response.

## Summary

The implementation correctly auto-derives Naturewalk capabilities from equipped items (Snow Boots and Jungle Boots per PTU p.293) and integrates them into the existing Naturewalk terrain bypass and status immunity systems. The equipment catalog entries match the rulebook exactly for terrain names and costs. The Naturewalk immunity check in `status.post.ts` was correctly extended from Pokemon-only to all combatant types, since trainers can gain Naturewalk from both the Survivalist class (PTU p.149) and equipment.

All three relevant decrees (003, 010, 012) are respected. No errata corrections exist for Naturewalk.

## Rulings

### MED-01: Snow Boots Conditional Speed Penalty Not Mechanically Enforced

**Severity:** MEDIUM

PTU p.293: Snow Boots "lower your Overland Speed by -1 while on ice or deep snow." The implementation stores the Naturewalk capability but does not mechanically enforce the conditional -1 Overland penalty. The description string mentions it ("Naturewalk (Tundra), -1 Overland on ice/deep snow"), but there is no `conditionalSpeedPenalty` field or runtime check.

**Mitigation:** This is a context-dependent penalty that requires the terrain system to distinguish "ice or deep snow" from general Tundra terrain. The current terrain painter does not have this granularity (Tundra maps to `'normal'` base type). The penalty is documented in the item description for GM reference. This is an acceptable limitation given the terrain system's current scope, but should be tracked for future enhancement if the terrain system gains PTU-specific terrain categories.

**Impact:** In practice, a trainer wearing Snow Boots on Tundra terrain would have their Overland Speed be 1 higher than it should be. Minor gameplay effect.

### MED-02: Other Capability-Granting Equipment Missing grantedCapabilities

**Severity:** MEDIUM

PTU p.293: Dark Vision Goggles "grant the Darkvision Capability while worn." PTU p.293: Re-Breather grants "the Gilled Capability for up to an hour." These catalog entries (`EQUIPMENT_CATALOG`) don't include `grantedCapabilities` for Darkvision/Gilled.

**Mitigation:** These capabilities (Darkvision, Gilled) have no mechanical impact in the current combat or VTT systems -- there are no darkness checks or underwater breathing mechanics implemented. The ticket scope is specifically Naturewalk (which has mechanical impact via terrain bypass and status immunity). Populating `grantedCapabilities` for non-Naturewalk items would be a catalog completeness improvement but not a correctness issue. No gameplay values are affected.

**Impact:** None in current system. Informational only for future reference.

## Verdict

**APPROVED**

All 7 implementation commits correctly implement equipment-granted Naturewalk per PTU 09-gear-and-items.md. The catalog entries match the rulebook. The capability derivation utility is pure, correctly deduplicated, and properly integrated into the existing Naturewalk terrain bypass and status immunity systems. The Naturewalk immunity extension to human combatants fixes a genuine bug where trainers (from Survivalist class or equipment) were excluded from the immunity check. Both MEDIUM issues are acknowledged limitations, not correctness errors.

## Required Changes

None. Both MEDIUM issues are acceptable limitations given the current system scope.
