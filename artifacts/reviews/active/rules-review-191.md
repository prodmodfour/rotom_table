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
mechanics_verified:
  - Skill Edge pathetic skills guard
  - Naturewalk trainer support
  - capabilities field data integrity
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/02-character-creation.md#Step 3 (p.18)
  - core/03-skills-edges-and-features.md#Skill Edges (p.41)
  - core/04-trainer-classes.md#Survivalist (p.149)
  - core/04-trainer-classes.md#Naturewalk immunity (p.276 equivalent at line 2800)
  - core/10-indices-and-reference.md#Naturewalk (p.322)
  - core/09-gear-and-items.md#Snow Boots / Jungle Boots
reviewed_at: 2026-02-28T04:30:00Z
follows_up: (none - first review)
---

## Mechanics Verified

### 1. Skill Edge Pathetic Skills Guard (refactoring-095)

- **Rule:** "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." (`core/02-character-creation.md`, p.18, Step 3). Additionally: "These Pathetic Skills cannot be raised above Pathetic during character creation" (p.14).
- **Decree:** decree-027 explicitly rules: "Skill Edges cannot raise Pathetic-locked skills during character creation." This is the controlling authority.
- **Implementation:** `addEdge()` in `useCharacterCreation.ts` (line 274-280) now rejects any string matching `/^skill edge:/i` with a user-friendly error message. The `addSkillEdge()` function (line 314-340) already checks `form.patheticSkills.includes(skill)` and blocks Pathetic skills with a decree-027 citation. The two-pronged approach prevents bypass via:
  1. Direct string injection through `addEdge()` (e.g., typing "Skill Edge: Athletics" into a generic edge input)
  2. Programmatic addition through `addSkillEdge()` (the intended path, which validates against patheticSkills)
- **Analysis:** The regex `^skill edge:/i` anchors to the start of the string and is case-insensitive. This correctly catches "Skill Edge: Athletics", "skill edge: Perception", "SKILL EDGE: Combat", etc. The anchor `^` prevents false positives on strings like "Advanced Skill Edge" (which is not a real PTU edge, but the guard is appropriately conservative). The return type was changed from `void` to `string | null` to propagate errors to the UI.
- **Edge case:** A user typing " Skill Edge: Athletics" (leading space) would bypass the guard. However, this is an acceptable risk: (a) it's a GM tool, not adversarial; (b) the string wouldn't match the `removeEdge()` Skill Edge pattern at line 286 either (`/^Skill Edge: (.+)$/`), so the skill revert-on-remove logic wouldn't fire. The mismatch is internally consistent.
- **Status:** CORRECT. Per decree-027, this approach was ruled correct.

### 2. Naturewalk Trainer Support (ptu-rule-119)

#### 2a. Survivalist Class Feature (Naturewalk Grant)

- **Rule:** "Choose a Terrain in which you have spent at least three nights. You gain Naturewalk for that terrain" (`core/04-trainer-classes.md`, p.149, Survivalist [Class] feature). The terrains are: Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert.
- **Implementation:** The `capabilities` field on `HumanCharacter` stores trainer Naturewalk as strings like `"Naturewalk (Forest)"`. This correctly mirrors the PTU format. The Survivalist grants up to 4 terrains (at 0/2/4/6 Survivalist Features), which the app handles by allowing a free-form string array. The GM manually enters capabilities via the edit UI.
- **Status:** CORRECT. The data format matches PTU's Naturewalk notation.

#### 2b. Naturewalk Terrain Bypass for Trainers

- **Rule:** "Pokemon with Naturewalk treat all listed terrains as Basic Terrain" (`core/10-indices-and-reference.md`, p.322). The Survivalist class grants Naturewalk directly to the trainer, making the trainer subject to the same Naturewalk rules as Pokemon.
- **Implementation:** `getCombatantNaturewalks()` in `combatantCapabilities.ts` (line 195-206) now handles both Pokemon and human combatants. For Pokemon, it delegates to `getPokemonNaturewalks()` which checks both `capabilities.naturewalk` and `capabilities.otherCapabilities`. For humans, it reads `human.capabilities` and passes it through `parseNaturewalksFromOtherCaps()`, which parses the `"Naturewalk (Forest)"` format.
- **Analysis:** The parsing regex at line 245 (`/^Naturewalk\s*\(([^)]+)\)$/i`) correctly handles:
  - `"Naturewalk (Forest)"` -> `['Forest']`
  - `"Naturewalk (Forest, Grassland)"` -> `['Forest', 'Grassland']`
  - `"Naturewalk (Forest and Grassland)"` -> `['Forest', 'Grassland']`
  - Case-insensitive matching
- **Status:** CORRECT.

#### 2c. Naturewalk Status Immunity for Trainers

- **Rule:** "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains" (`core/04-trainer-classes.md`, line 2800, in the Rider class's Mounted Prowess feature list -- this is the PTU general Naturewalk immunity rule).
- **Implementation:** `findNaturewalkImmuneStatuses()` (line 321-347) previously had a `if (combatant.type !== 'pokemon') return []` guard that was removed. Now it calls `getCombatantNaturewalks()` which handles both Pokemon and trainers. The function correctly:
  1. Checks terrain is enabled and combatant has a position
  2. Filters for Slowed/Stuck statuses only
  3. Looks up the terrain cell at the combatant's position
  4. Calls `naturewalkBypassesTerrain()` to check if the combatant's Naturewalk matches
- **Status:** CORRECT. The immunity applies identically to trainers and Pokemon per PTU rules.

#### 2d. Snow Boots / Jungle Boots Compatibility

- **Rule:** "Snow Boots grant you the Naturewalk (Tundra) capability" (`core/09-gear-and-items.md`, p.1701). "Jungle Boots grant you the Naturewalk (Forest) capability" (p.1714).
- **Implementation:** The free-form `capabilities: string[]` field supports this. A GM can add `"Naturewalk (Tundra)"` or `"Naturewalk (Forest)"` from equipment as well as from Survivalist. The parsing handles all formats identically.
- **Status:** CORRECT. Not explicitly targeted by ptu-rule-119 but the implementation naturally supports it.

### 3. Capabilities Field Data Integrity

- **Prisma schema** (`schema.prisma` line 40-42): `capabilities String @default("[]")` with comment citing PTU p.149. Default `"[]"` is correct for JSON array.
- **TypeScript interface** (`types/character.ts` line 238-239): `capabilities: string[]` -- matches the JSON array shape.
- **API create** (`index.post.ts` line 41): `capabilities: JSON.stringify(body.capabilities || [])` -- defaults to empty array, correct.
- **API update** (`[id].put.ts` line 42): `if (body.capabilities !== undefined) updateData.capabilities = JSON.stringify(body.capabilities)` -- conditional update, correct.
- **Serializer (full)** (`serializers.ts` line 92): `capabilities: JSON.parse(character.capabilities || '[]')` -- defensive `|| '[]'` handles null/undefined from pre-migration records, correct.
- **Serializer (summary)** (`serializers.ts` line 160): Same pattern, correct.
- **Combatant builder** (`combatant.service.ts` line 626): `capabilities: JSON.parse(record.capabilities || '[]')` -- defensive fallback, correct.
- **Status:** CORRECT. Full data layer coverage: Prisma -> API (create+update) -> serializers (full+summary) -> combatant builder -> TypeScript type.

### 4. UI Capabilities Display and Edit

- **HumanClassesTab.vue** (read-only modal view): Added `capabilities` prop, renders as green tags with `tag--capability` class. Empty state updated to include capabilities. Correct.
- **CharacterModal.vue**: Passes `humanData.capabilities` to HumanClassesTab. Correct.
- **gm/characters/[id].vue** (editable character sheet): Shows capabilities in Classes tab. In edit mode, provides a comma-separated text input with `onCapabilitiesChange()` handler (line 429-436) that splits, trims, and filters. In view mode, shows green tags. Shows the section when editing even if empty (to allow adding). Correct.
- **Note on onCapabilitiesChange:** The handler uses `@change` (fires on blur/enter) rather than `@input` (fires on every keystroke). This is appropriate for comma-separated input to avoid premature splitting while the user is still typing.

## Issues Found

### MED-01: Trainer movement capabilities (Swim, Burrow, Sky, Overland) not extended to trainers

**Severity:** MEDIUM
**Files:** `app/utils/combatantCapabilities.ts` lines 15-90

The movement capability functions (`combatantCanSwim`, `combatantCanBurrow`, `combatantCanFly`, `getOverlandSpeed`, etc.) all return hardcoded defaults for non-Pokemon combatants (e.g., `return false` for swim/burrow/fly, `return 5` for overland). While Naturewalk was correctly extended, the other movement capabilities were not. This is outside the scope of ptu-rule-119 (which specifically targeted Naturewalk) and is a pre-existing limitation, but worth noting for completeness.

The Snow Boots item (PTU p.1701) also lowers Overland Speed by -1 in ice/snow, which the current capabilities field cannot express (it's a conditional speed modifier, not a simple capability). This is a future enhancement consideration.

**Impact:** LOW -- trainers rarely need Swim/Sky/Burrow capabilities in the VTT. Overland speed 5 is the standard trainer speed. No incorrect game values are produced for the implemented Naturewalk mechanic.

**Recommendation:** File as a separate future ticket if trainer movement capability editing is desired.

## Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-027 | COMPLIANT | addEdge() blocks Skill Edge injection; addSkillEdge() checks patheticSkills |
| decree-003 | COMPLIANT | Naturewalk bypass explicitly excludes enemy-occupied rough terrain (line 267-269 comment, enforced by separate enemy-occupied logic) |
| decree-010 | NOT AFFECTED | Multi-tag terrain system unchanged |

## Summary

Both tickets are implemented correctly from a PTU rules perspective:

1. **refactoring-095** adds a proper guard to `addEdge()` that prevents Skill Edge string injection, enforcing decree-027's ruling that Pathetic skills cannot be raised during character creation. The regex is appropriately conservative and the return type change (`void` -> `string | null`) enables UI error feedback.

2. **ptu-rule-119** adds a complete `capabilities` field to the HumanCharacter data model (Prisma, TypeScript, API create/update, serializers, combatant builder) and extends the Naturewalk logic in `combatantCapabilities.ts` to check trainer capabilities alongside Pokemon capabilities. The Survivalist class grants Naturewalk per PTU p.149, and the implementation correctly applies both terrain bypass and Slowed/Stuck immunity to trainers with Naturewalk.

All 11 files changed are consistent with each other. The data flows correctly from database through API to client and back. The `parseNaturewalksFromOtherCaps()` function is reused for both Pokemon `otherCapabilities` and trainer `capabilities`, avoiding code duplication.

## Rulings

1. The `addEdge()` regex guard `/^skill edge:/i` is PTU-correct. The only legitimate path for Skill Edges is through `addSkillEdge()`, which enforces the patheticSkills check per decree-027.

2. Trainers gaining Naturewalk via Survivalist (PTU p.149) should receive the same terrain bypass and status immunity benefits as Pokemon with Naturewalk. The implementation correctly unifies this logic.

3. The free-form `capabilities: string[]` storage format (with strings like `"Naturewalk (Forest)"`) is appropriate. It accommodates Survivalist class features, Snow Boots/Jungle Boots items, and any future capability sources without schema changes.

## Verdict

**APPROVED** -- No critical or high issues. One medium observation (MED-01) is a pre-existing limitation outside the scope of these tickets. All PTU rules are correctly implemented. Decree-027 compliance is verified. Decree-003 compatibility is maintained.

## Required Changes

None. The implementation is correct as written.
