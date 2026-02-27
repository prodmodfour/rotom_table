---
review_id: rules-review-059
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-017
domain: vtt-grid
commits_reviewed:
  - f2fe6a1
files_reviewed:
  - app/types/spatial.ts
  - app/stores/terrain.ts
  - app/composables/useCanvasDrawing.ts
  - app/composables/useCanvasRendering.ts
  - app/components/vtt/TerrainPainter.vue
  - app/tests/unit/stores/terrain.test.ts
mechanics_verified:
  - earth-terrain-passability
  - earth-terrain-movement-cost
  - rough-terrain-movement-cost
  - rough-terrain-accuracy-penalty
  - slow-terrain-renaming
  - terrain-type-taxonomy
verdict: APPROVED_WITH_NOTES
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Terrain (p.231)
  - core/07-combat.md#Blindness (p.248)
reviewed_at: 2026-02-20T14:00:00
---

## Review Scope

Reviewing commit `f2fe6a1` which adds Earth and Rough terrain types to the VTT grid system. The commit modifies type definitions, store logic, canvas drawing patterns, terrain painter UI, and unit tests. Also renames "Difficult" to "Slow" to match PTU terminology.

## PTU Rulebook Reference

From `books/markdown/core/07-combat.md` (p.231), the PTU 1.05 terrain rules define two categories:

**Basic Terrain Types** (determines which Movement Capability you use to Shift):
1. **Regular Terrain:** Dirt, short grass, cement, smooth rock, indoor building. Shift as normal.
2. **Earth Terrain:** Underground terrain with no existing tunnel. "You may only Shift through Earth Terrain if you have a Burrow Capability."
3. **Underwater:** Water a Pokemon or Trainer can be submerged in. "You may not move through Underwater Terrain during battle if you do not have a Swim Capability."

**Special Terrain Modifiers** (modify movement; layered on top of a Basic Terrain Type):
4. **Slow Terrain:** "Trainers and their Pokemon treat every square meter as two square meters instead." (2x movement cost)
5. **Rough Terrain:** "Most Rough Terrain is also Slow Terrain, but not always. When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokemon are considered Rough Terrain. Certain types of Rough Terrain may be ignored by certain Pokemon, based on their capabilities. [...] Squares occupied by enemies always count as Rough Terrain."
6. **Blocking Terrain:** "This is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions."

No terrain-related errata found in `books/markdown/errata-2.md`.

## Mechanics Verified

### 1. Earth Terrain -- Passability

- **Rule:** "You may only Shift through Earth Terrain if you have a Burrow Capability." (`core/07-combat.md`, p.231)
- **Implementation:** `terrain.ts` `isPassable` getter now accepts `canBurrow` parameter. Returns `false` for earth without burrow, `true` with burrow.
- **Status:** CORRECT
- **Notes:** Straightforward implementation. Earth terrain with Burrow = passable; without = impassable. Matches PTU exactly.

### 2. Earth Terrain -- Movement Cost

- **Rule:** Earth Terrain is a Basic Terrain Type. PTU does not specify an additional movement cost multiplier for Earth beyond requiring Burrow capability. With Burrow, it functions as traversable terrain.
- **Implementation:** `TERRAIN_COSTS` sets earth = `Infinity` (base cost), `getMovementCost` returns `1` (normal) with burrow, `Infinity` without.
- **Status:** CORRECT
- **Notes:** PTU describes Earth as simply requiring Burrow to traverse. It does not say Earth inherently costs extra movement -- it is just inaccessible without Burrow. Once you have Burrow, you move through normally. Cost of 1 (normal) with Burrow is correct.

### 3. Rough Terrain -- Movement Cost

- **Rule:** "Most Rough Terrain is also Slow Terrain, but not always." (`core/07-combat.md`, p.231). Rough Terrain's defining mechanic is the accuracy penalty, not movement cost. Slow Terrain is what imposes 2x movement cost.
- **Implementation:** `TERRAIN_COSTS` sets rough = `1` (normal movement cost). The terrain painter description says "Normal movement cost" and the cost label shows `1x/-2 acc`.
- **Status:** CORRECT
- **Notes:** This is a nuanced but correct design decision. PTU explicitly states that Rough and Slow are separate modifiers that often but do not always coincide. Setting Rough to 1x movement cost and keeping Slow (difficult) at 2x means the GM can paint a cell as Rough-only (accuracy penalty, normal movement), Slow-only (2x movement, no accuracy penalty), or both (by painting both on the same cell if terrain stacking is supported). The fix log acknowledges this: "most rough terrain is also slow per PTU, but that stacking is a GM decision per encounter setup."

### 4. Rough Terrain -- Accuracy Penalty

- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." (`core/07-combat.md`, p.231)
- **Implementation:** The terrain type is added with comments noting the -2 accuracy penalty. The UI description reads "Rough terrain - -2 accuracy penalty when targeting through." However, the accuracy penalty is **not mechanically enforced** -- the terrain store only tracks movement costs and passability, not accuracy modifiers. The combat system does not check for Rough terrain between attacker and target when resolving accuracy rolls.
- **Status:** PARTIAL -- terrain type correctly defined, but defining mechanic not automated
- **Notes:** This is a known gap documented in matrix artifacts (`combat-matrix.md` combat-R062, `vtt-grid-matrix.md` vtt-grid-R016). The accuracy penalty requires combat-system integration: checking the line between attacker and target for Rough terrain cells, then applying -2 to the roll. This is non-trivial and was not in scope for bug-017 (which was about adding missing terrain types to the painter). The terrain is correctly painted and labeled; the mechanical enforcement is a separate feature.

### 5. Slow Terrain Renaming

- **Rule:** PTU calls it "Slow Terrain" (`core/07-combat.md`, p.231).
- **Implementation:** The commit renames "Difficult" to "Slow" in the terrain painter UI label and description. The internal type key remains `'difficult'` for backward compatibility.
- **Status:** CORRECT
- **Notes:** The internal key `'difficult'` is kept to avoid a data migration on existing saved terrain cells. The user-facing label now matches PTU terminology. This is a sound compromise.

### 6. Terrain Type Taxonomy

- **Rule:** PTU defines 3 Basic Terrain Types (Regular, Earth, Underwater) and 3 Special Terrain Modifiers (Slow, Rough, Blocking). Special modifiers layer on top of Basic types.
- **Implementation:** The app treats all terrain types as a flat union: `'normal' | 'difficult' | 'blocking' | 'water' | 'earth' | 'rough' | 'hazard' | 'elevated'`. Each cell has exactly one type.
- **Status:** ACCEPTABLE (pragmatic simplification)
- **Notes:** PTU's two-layer system (Basic Type + Special Modifier) would require a more complex data model where each cell has both a basic type AND zero or more modifiers. The flat union approach means a cell cannot be simultaneously "Earth + Slow" or "Regular + Rough + Slow." This is a reasonable simplification for a VTT painter -- the GM can mentally note compound terrain or designate nearby cells differently. Previous rules-review-047 discussed this exact design tension and recommended the current approach as acceptable.

## Issues Found

### MEDIUM-1: Rough Terrain accuracy penalty not mechanically enforced

- **Severity:** MEDIUM
- **Description:** The -2 accuracy penalty when targeting through Rough Terrain is the defining mechanic of Rough terrain per PTU, but it is not automated in the combat system. The terrain cell exists and is painted correctly, but accuracy rolls do not consult terrain between attacker and target.
- **PTU Reference:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." (`core/07-combat.md`, p.231)
- **Mitigation:** The GM can manually apply the -2 penalty. The UI label clearly states the penalty exists, serving as a visual reminder.
- **Recommendation:** This is a known gap (combat-R062). Not blocking for this commit, which correctly adds the terrain type. The accuracy penalty automation should be tracked separately.

### MEDIUM-2: Enemy-occupied squares not automatically treated as Rough Terrain

- **Severity:** MEDIUM
- **Description:** PTU states "Spaces occupied by other Trainers or Pokemon are considered Rough Terrain" and "Squares occupied by enemies always count as Rough Terrain." The VTT does not automatically overlay Rough Terrain on occupied cells.
- **PTU Reference:** Same passage, `core/07-combat.md`, p.231.
- **Mitigation:** This is standard PTU table-play practice that GMs handle manually. Most VTTs do not automate this.
- **Recommendation:** Out of scope for bug-017. Already tracked in matrix artifacts.

## Summary

- Mechanics checked: 6
- Correct: 4
- Acceptable (pragmatic simplification): 1
- Partial (type added, mechanic not automated): 1
- Incorrect: 0
- Needs review: 0

## Rulings

1. **Earth Terrain movement cost of 1 with Burrow is correct.** PTU does not impose an extra movement cost on Earth terrain beyond requiring Burrow capability. It is a Basic Terrain Type, not a Special Modifier.

2. **Rough Terrain movement cost of 1 is correct.** Rough and Slow are separate PTU concepts. The GM should paint both Rough and Slow on a cell if the terrain is both (e.g., tall grass = Rough + Slow). Setting Rough to 1x movement preserves the separation of concerns.

3. **The "Difficult" to "Slow" rename aligns with PTU terminology.** Keeping the internal `'difficult'` key for backward compatibility is an acceptable engineering decision that does not affect PTU correctness.

## Verdict

APPROVED WITH NOTES -- The Earth and Rough terrain types are correctly added per PTU 1.05 definitions. Earth terrain's Burrow-gated passability and Rough terrain's normal movement cost are both PTU-accurate. The Slow rename improves PTU terminology alignment. Two MEDIUM issues are noted (accuracy penalty not automated, enemy-occupied-as-rough not automated) but these are known gaps outside the scope of this terrain-type-addition commit. The commit correctly solves what bug-017 asked for: adding the missing PTU terrain types to the VTT painter.
