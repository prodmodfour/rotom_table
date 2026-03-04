---
review_id: rules-review-191
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-095+ptu-rule-119
domain: character-lifecycle+combat
commits_reviewed:
  - d8babb0
  - b4cb879
  - 9c3c0d6
  - 7103752
  - 062f41b
  - 5d3b632
files_reviewed:
  - app/composables/useCharacterCreation.ts
  - app/utils/combatantCapabilities.ts
  - app/prisma/schema.prisma
  - app/types/character.ts
  - app/components/character/tabs/HumanClassesTab.vue
  - app/pages/gm/characters/[id].vue
  - app/server/api/characters/[id].put.ts
  - app/server/api/characters/index.post.ts
  - app/server/services/combatant.service.ts
  - app/server/utils/serializers.ts
  - app/components/character/CharacterModal.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-28T08:15:00Z
follows_up: null
---

## Review Scope

PTU rules correctness review for:

1. **refactoring-095**: Guard `addEdge()` against Skill Edge string injection bypassing decree-027 pathetic skill block.
2. **ptu-rule-119**: Trainer Naturewalk support (Survivalist class feature, PTU 04-trainer-classes.md:4688-4693).

### PTU References Verified

- **PTU 02-character-creation.md** (pp. 14, 18): Pathetic skills cannot be raised during character creation.
- **PTU 03-skills-edges-and-features.md** (p. 41): Basic Skills Edge progression (Pathetic -> Untrained applies post-creation only per decree-027).
- **PTU 04-trainer-classes.md:4688-4693**: Survivalist class feature -- "Choose a Terrain... You gain Naturewalk for that terrain."
- **PTU 04-trainer-classes.md:2798-2801**: Naturewalk capability definition -- "Immunity to Slowed or Stuck in its appropriate Terrains."
- **PTU 10-indices-and-reference.md:322-325**: "Naturewalk is always listed with Terrain types in parentheses... Pokemon with Naturewalk treat all listed terrains as Basic Terrain."
- **PTU 09-gear-and-items.md:1701-1714**: Snow Boots (Naturewalk Tundra), Jungle Boots (Naturewalk Forest) -- items can also grant trainers Naturewalk.

### Decree Compliance

- **decree-027**: Properly enforced. The `addEdge()` guard blocks `"Skill Edge: ..."` strings from the free-text edge input, closing the injection vector. The existing `addSkillEdge()` function already blocks Pathetic skills (implemented in ptu-rule-118). Both paths are now guarded.

## Rules Analysis

### refactoring-095: addEdge() Skill Edge Injection Guard

**Rule correctness: CORRECT**

The regex `/^skill edge:/i` correctly identifies and blocks strings that match the `"Skill Edge: {skillName}"` format used by `addSkillEdge()`. This prevents a user from typing `"Skill Edge: Athletics"` into the generic edge text input to bypass the pathetic skill check.

The guard correctly:
- Uses case-insensitive matching (`/i` flag) to prevent case-variant bypasses
- Only checks the prefix (`^skill edge:`) -- any string starting with "Skill Edge:" is blocked
- Does not interfere with legitimate edges (e.g., "Basic Edge", "Skill Stunt: Acrobatics" -- note "Skill Stunt" is a different format)
- Returns a descriptive error string consistent with the existing `addSkillEdge()` return pattern

**Edge case verified**: "Skilled Edge" (no space before "Edge") would NOT be blocked, which is correct -- it is not the `"Skill Edge: X"` format.

### ptu-rule-119: Trainer Naturewalk via Survivalist

**Rule correctness: CORRECT**

PTU 04-trainer-classes.md:4688-4693 (Survivalist class, Rank 1 feature):
> "Choose a Terrain in which you have spent at least three nights. You gain Naturewalk for that terrain..."

This confirms that trainers can gain Naturewalk through the Survivalist class. The implementation correctly:

1. **Stores capabilities as a flat string array** on HumanCharacter: `["Naturewalk (Forest)", "Naturewalk (Mountain)"]`. This matches the format used in `otherCapabilities` for Pokemon, enabling code reuse via `parseNaturewalksFromOtherCaps()`.

2. **Extends `getCombatantNaturewalks`** to check human capabilities. For humans, it calls `parseNaturewalksFromOtherCaps(caps)` directly on the `capabilities` array. This is the correct approach since human capabilities use the same string format as Pokemon `otherCapabilities`.

3. **Removes the `combatant.type !== 'pokemon'` guard** from `findNaturewalkImmuneStatuses`. PTU 04-trainer-classes.md:2800-2801 states Naturewalk grants "Immunity to Slowed or Stuck in its appropriate Terrains" -- this applies to ALL entities with Naturewalk, not just Pokemon. The implementation correctly makes this function type-agnostic.

4. **Terrain bypass via `naturewalkBypassesTerrain`** already calls `getCombatantNaturewalks`, which now works for humans. No additional changes were needed -- the function is already type-agnostic via delegation.

**PTU items also grant Naturewalk to trainers**: Snow Boots (Tundra), Jungle Boots (Forest), per PTU 09-gear-and-items.md:1701-1714. The `capabilities` field supports these too -- the GM simply adds `"Naturewalk (Tundra)"` when the trainer equips Snow Boots. This is a correct general-purpose approach.

### Data Shape Analysis

The `capabilities: string[]` field on HumanCharacter is appropriate:

- **Not overly structured**: Trainers can gain various capabilities beyond Naturewalk (e.g., Wallclimber from 04-trainer-classes.md:2798). A flat string array accommodates future capability types without schema changes.
- **Matches Pokemon pattern**: Pokemon use `otherCapabilities: string[]` for free-form capability strings. Using the same format for humans enables code reuse.
- **Manual entry is acceptable**: Capabilities come from class features and items, not bulk generation. Manual entry via comma-separated text input is appropriate for the low volume.

## Issues

### MED-01: Equipment-granted Naturewalk not automatically tracked

**Rule reference:** PTU 09-gear-and-items.md:1701-1714 (Snow Boots, Jungle Boots)

Trainers can gain Naturewalk from equipped items (Snow Boots grant Naturewalk Tundra, Jungle Boots grant Naturewalk Forest). Currently, the `capabilities` field is manually edited by the GM, separate from the equipment system. If a trainer equips Jungle Boots, the GM must manually add `"Naturewalk (Forest)"` to capabilities. If the trainer unequips the boots, the GM must manually remove it.

This is acceptable for the current scope (ptu-rule-119 is specifically about Survivalist class features), but creates a consistency risk: the equipment system already tracks equipped items with stat bonuses and DR, but capabilities from equipment are not auto-derived.

**Not blocking**: The ticket scope is Survivalist Naturewalk, not equipment-derived capabilities. However, a follow-up ticket should be filed to track auto-deriving capabilities from equipped items.

## What Looks Good (Rules Perspective)

1. **Survivalist terrain selection is correctly modeled.** The class feature allows choosing terrains incrementally (1 at Rank 1, 2 at 2 features, 3 at 4 features, 4 at 6 features). The flat array supports adding terrains incrementally without data structure changes.

2. **Naturewalk immunity logic is correct.** The `findNaturewalkImmuneStatuses` function correctly:
   - Only blocks Slowed and Stuck (the two statuses PTU p.276/p.2800 specifies)
   - Requires terrain to be enabled and combatant to have a position
   - Checks the terrain type at the combatant's current position
   - Uses the `NATUREWALK_TERRAIN_MAP` for terrain-to-type mapping

3. **decree-027 enforcement is complete.** Both entry points for edges during character creation are now guarded:
   - `addSkillEdge()`: Checks `patheticSkills.includes(skill)` directly
   - `addEdge()`: Blocks `"Skill Edge: ..."` strings to prevent injection

4. **Page references are accurate.** PTU p.149 corresponds to the Survivalist class in Chapter 4 (04-trainer-classes.md:4688). The comments correctly cite this reference.

## Verdict

**APPROVED** from a game logic / PTU rules perspective.

The implementation correctly models Survivalist Naturewalk for trainers and the decree-027 injection guard. One MEDIUM issue (equipment-granted Naturewalk) is noted for follow-up but does not block this change.

The code-review (code-review-215) has identified implementation-level issues (comma parsing, missing tests, UX feedback) that should be addressed before merge. The rules logic itself is sound.
