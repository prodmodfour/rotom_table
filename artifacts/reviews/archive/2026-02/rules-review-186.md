---
review_id: rules-review-186
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-114+ptu-rule-116
domain: combat+vtt-grid
commits_reviewed:
  - 92ae757
  - 53c5bb7
mechanics_verified:
  - assisted-breather-zero-evasion
  - assisted-breather-tripped-status
  - assisted-breather-shift-requirement
  - assisted-breather-assister-penalties
  - naturewalk-status-immunity
  - naturewalk-terrain-matching
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
ptu_refs:
  - core/07-combat.md#take-a-breather (p.245)
  - core/04-trainer-classes.md#naturewalk (p.276)
  - core/10-indices-and-reference.md#naturewalk (p.322)
  - errata-2.md#medicine-education-rank-2
reviewed_at: 2026-02-27T16:45:00Z
follows_up: null
---

## Mechanics Verified

### 1. Assisted Breather — Zero Evasion (ptu-rule-114)

- **Rule:** "They then both become Tripped and are treated as having 0 Evasion until the end of their next turn." (`core/07-combat.md` p.245, lines 1478-1479)
- **Implementation:** The server endpoint `breather.post.ts` accepts `assisted: true` in the request body. When assisted, it applies a synthetic `ZeroEvasion` tempCondition instead of `Tripped` + `Vulnerable`. The `ZeroEvasion` condition is recognized by `evasionCalculation.ts` (line 46) and `calculate-damage.post.ts` (line 232), both of which correctly set all evasion values to 0 when this condition is present. The tempCondition is cleared at `next-turn.post.ts` (line 68) when the combatant's turn ends, matching the "until end of their next turn" duration.
- **Status:** INCORRECT (see HIGH-1)

The zero evasion mechanic itself is correctly implemented. Both the client-side `computeTargetEvasions()` and server-side `calculate-damage.post.ts` correctly detect `ZeroEvasion` in tempConditions and set all evasion to 0. The condition lifecycle (applied at breather, cleared at end of next turn via `tempConditions = []`) is also correct.

**However**, the assisted breather omits the Tripped condition that RAW requires. See HIGH-1 below.

### 2. Assisted Breather — Tripped Status Omission

- **Rule:** "They then both become **Tripped** and are treated as having 0 Evasion until the end of their next turn." (`core/07-combat.md` p.245, line 1478)
- **Implementation:** `breather.post.ts` lines 145-151 apply ONLY `ZeroEvasion` for the assisted variant. Tripped is NOT applied. The `combatManeuvers.ts` entry (line 115) describes "0 Evasion (no Trip)" — explicitly stating Tripped is not applied.
- **Status:** INCORRECT (HIGH-1)

The RAW text clearly states both the assister and the target "become Tripped." The key difference between standard and assisted breather is that the assisted variant replaces **Vulnerable** (which sets evasion to 0) with an explicit "treated as having 0 Evasion" — but Tripped is preserved in both variants.

**Corroborating evidence from errata:** The errata's Rank 2 Medicine Education feature (`errata-2.md` lines 328-335) explicitly says "They do not Shift and **do not become Tripped** as part of this action." This Medicine Education exception would be meaningless if the base assisted breather already excluded Tripped. The existence of this explicit exception proves that the base assisted breather DOES include Tripped.

### 3. Assisted Breather — Shift Requirement

- **Rule:** "both the assisting Trainer and their target must Shift as far away from enemies as possible, using the lower of the two's maximum movement for a single Shift." (`core/07-combat.md` p.245, lines 1475-1477)
- **Implementation:** `useEncounterActions.ts` lines 172-175 only prompt for shift on the UNASSISTED variant (`if (!assisted)`). The assisted variant skips the shift entirely.
- **Status:** INCORRECT (see MEDIUM-1)

The RAW text requires both the assister and the target to shift in the assisted variant. The implementation incorrectly suppresses the shift prompt for the assisted variant. However, since the shift is a GM-prompted manual action (not automated pathfinding), this is MEDIUM severity — the GM can manually move the tokens.

### 4. Assisted Breather — Assister Penalties

- **Rule:** "They then **both** become Tripped and are treated as having 0 Evasion" (`core/07-combat.md` p.245, line 1478)
- **Implementation:** Only the target combatant receives the ZeroEvasion tempCondition. The assisting trainer's penalties are not applied by the endpoint. The code comment at line 9 acknowledges: "The assistant's Standard Action must be consumed separately by the GM."
- **Status:** NEEDS REVIEW (acceptable limitation, noted)

Since the API endpoint is designed around a single combatant target, and the assisting trainer is a separate combatant whose action economy must be tracked separately, this is an acceptable simplification. The GM handles the assister's penalties manually. No severity assigned — this is a known architectural limitation consistent with how other multi-combatant interactions work (e.g., Intercept).

### 5. Naturewalk Status Immunity — Slowed/Stuck (ptu-rule-116)

- **Rule:** "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains." (`core/04-trainer-classes.md` p.276, line 2800)
- **Implementation:** `combatantCapabilities.ts` defines `NATUREWALK_IMMUNE_STATUSES = ['Slowed', 'Stuck']` (line 284). The `findNaturewalkImmuneStatuses()` function (lines 300-329) checks if the combatant is a Pokemon with Naturewalk, if terrain is enabled, if the combatant has a position, and if the terrain at their position matches their Naturewalk terrains via `naturewalkBypassesTerrain()`. The `status.post.ts` endpoint (lines 76-99) calls this function and rejects with a 409 status when Naturewalk immunity applies, with a GM override flag following the decree-012 pattern.
- **Status:** CORRECT

The immunity scope is exactly right: only `Slowed` and `Stuck`, only when standing on matching terrain, only for Pokemon. The GM override flag follows the established decree-012 pattern. The terrain matching uses `NATUREWALK_TERRAIN_MAP` which correctly maps PTU terrain categories to the app's base terrain types.

### 6. Naturewalk Terrain Matching

- **Rule:** "Naturewalk is always listed with Terrain types in parentheses, such as Naturewalk (Forest and Grassland). Pokemon with Naturewalk treat all listed terrains as Basic Terrain." (`core/10-indices-and-reference.md` p.322, lines 322-325)
- **Implementation:** `getCombatantNaturewalks()` (lines 191-210) extracts Naturewalk terrain names from both `capabilities.naturewalk` (direct field) and `capabilities.otherCapabilities` (parsed via regex). The `parseNaturewalksFromOtherCaps()` function handles formats like "Naturewalk (Forest, Grassland)" and "Naturewalk (Forest and Grassland)". The `NATUREWALK_TERRAIN_MAP` in `naturewalk.ts` maps all 9 PTU terrain categories to app terrain types.
- **Status:** CORRECT

The parsing is robust and covers the common data formats. All 9 PTU terrain categories (Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert) are mapped. The limitation that multiple PTU terrains map to the same base type (e.g., Grassland and Forest both map to `normal`) is a known architectural constraint of the terrain painter system, not a rules error.

## Issues

### HIGH-1: Assisted breather omits Tripped condition

**File:** `app/server/api/encounters/[id]/breather.post.ts`, lines 145-151
**File:** `app/constants/combatManeuvers.ts`, lines 108-117

PTU p.245 states that in the assisted breather variant, "They then both become **Tripped** and are treated as having 0 Evasion until the end of their next turn." The implementation applies only ZeroEvasion and explicitly omits Tripped. The maneuver description says "0 Evasion (no Trip)" which contradicts RAW.

The standard breather applies Tripped + Vulnerable. The assisted breather should apply Tripped + ZeroEvasion. The difference is: Vulnerable is replaced by the explicit "0 Evasion" language, but Tripped remains in both variants.

The errata's Medicine Education Rank 2 (errata-2.md lines 330-332) confirms this by explicitly stating "They do not Shift and do not become Tripped as part of this action" — proving the base assisted breather includes Tripped.

**Required fix:**
1. `breather.post.ts` assisted branch (line 145): Apply BOTH `Tripped` and `ZeroEvasion` tempConditions.
2. `combatManeuvers.ts` (line 115): Update shortDesc to "Assisted breather: reset stages, cure volatile status, Tripped + 0 Evasion. Adjacent ally must spend Standard Action."

### MEDIUM-1: Assisted breather suppresses shift prompt incorrectly

**File:** `app/composables/useEncounterActions.ts`, lines 172-175

The code only prompts the GM to shift the combatant away from enemies for the standard breather (`if (!assisted)`). However, PTU p.245 states: "both the assisting Trainer and their target must Shift as far away from enemies as possible, using the lower of the two's maximum movement for a single Shift."

The shift is required for BOTH variants. The assisted variant uses the lower of the two combatants' movement speeds for the shift distance.

**Required fix:** Remove the `if (!assisted)` guard so the shift prompt fires for both variants. Optionally, update the shift prompt text to indicate the lower-of-two-speeds rule for the assisted variant.

### MEDIUM-2: Incorrect PTU page reference in Naturewalk code comments

**File:** `app/server/api/encounters/[id]/status.post.ts`, line 73
**File:** `app/utils/combatantCapabilities.ts`, lines 276, 282, 292

The code comments cite "PTU p.239-240" for the Naturewalk status immunity rule. The actual rule is at:
- **p.276** (`core/04-trainer-classes.md` line 2800): "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains."
- **p.322** (`core/10-indices-and-reference.md` lines 322-325): "Pokemon with Naturewalk treat all listed terrains as Basic Terrain."

Page 239-240 (`core/07-combat.md`) discusses Type Effectiveness and type-based immunities (Electric immune to Paralysis, Fire immune to Burn, etc.), not Naturewalk.

**Required fix:** Update code comments to reference the correct pages (p.276 and p.322).

## Noted Limitations (No Action Required)

### Trainer Naturewalk not supported

Trainers can gain Naturewalk via the Survivalist class feature (`core/04-trainer-classes.md` p.149, line 4690). The current implementation only checks `combatant.type === 'pokemon'` for Naturewalk immunity. This is acceptable because `HumanCharacter` does not store a `capabilities` field in the data model. If trainer capabilities are added in the future, the Naturewalk immunity check should be extended to cover them.

### Assister penalties not auto-applied

The assisted breather API only applies effects to the target combatant. The assisting trainer's Tripped + ZeroEvasion conditions and action economy must be managed by the GM manually. This is consistent with how other multi-combatant interactions work in the system.

### Command Check not enforced

PTU p.245 requires a Command Check (DC 12) for the assisted breather to succeed. The implementation assumes the check has already been resolved by the GM. This is acceptable as it follows the same pattern as other skill-check-gated maneuvers.

## Decree Compliance

- **decree-005:** COMPLIANT. The breather correctly re-applies CS effects from surviving persistent status conditions (Burn/Paralysis/Poison) after the stage reset, via `reapplyActiveStatusCsEffects()` at line 134.
- **decree-012:** COMPLIANT. The Naturewalk immunity check follows the same pattern (server-side enforcement with GM override flag) established by decree-012 for type-based immunities.
- **decree-003:** COMPLIANT. The `combatantCapabilities.ts` comments (line 249) correctly note that Naturewalk does NOT bypass enemy-occupied rough terrain (game mechanic, not painted terrain).
- **decree-010:** COMPLIANT. Multi-tag terrain (cells being both Rough and Slow) is handled correctly — the Naturewalk check is based on the base terrain type, not individual flags.

## Summary

**ptu-rule-116 (Naturewalk status immunity):** Correctly implemented. The immunity scope (Slowed/Stuck only), terrain matching, and GM override pattern all match PTU RAW and decree precedent. The only issue is incorrect page references in comments (MEDIUM-2).

**ptu-rule-114 (Assisted breather):** The ZeroEvasion mechanism and its lifecycle are correctly implemented, but the assisted variant incorrectly omits the Tripped condition that RAW requires (HIGH-1), and incorrectly suppresses the shift prompt (MEDIUM-1). The errata's Medicine Education Rank 2 feature confirms that the base assisted breather includes Tripped by explicitly carving out an exception for it.

## Verdict

**CHANGES_REQUIRED** — 1 HIGH issue must be resolved before approval.

## Required Changes

1. **HIGH-1 (must fix):** Add `Tripped` tempCondition to the assisted breather branch in `breather.post.ts`. Update `combatManeuvers.ts` description to mention Tripped.
2. **MEDIUM-1 (should fix):** Enable the shift prompt for the assisted variant in `useEncounterActions.ts`.
3. **MEDIUM-2 (should fix):** Correct PTU page references from p.239-240 to p.276/p.322 in code comments.
