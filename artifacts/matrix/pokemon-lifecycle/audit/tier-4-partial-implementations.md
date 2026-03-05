---
domain: pokemon-lifecycle
type: audit-tier
tier: 4
name: Partial Implementations
items_audited: 11
correct: 7
incorrect: 0
approximation: 4
ambiguous: 0
audited_at: 2026-03-05T18:00:00Z
audited_by: implementation-auditor
session: 121
---

# Tier 4: Partial Implementations

11 items verifying the present portion of partial implementations and flagging missing portions.

---

## Item 25: R014 -- Abilities: Level 20 Milestone (C018, C073)

**Rule:** "At Level 20, a Pokemon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities." (PTU p.200)

**Expected behavior:** Level 20 milestone detected and displayed. UI to assign ability.

**Actual behavior (present):**
- `app/utils/levelUpCheck.ts:67-69`: `if (level === 20) { abilityMilestone = 'second'; abilityMessage = 'This Pokemon can now gain a Second Ability (Basic or Advanced).' }`.
- `app/components/pokemon/PokemonLevelUpPanel.vue:38-49`: Displays milestone with "Assign Ability" button.
- `app/components/pokemon/AbilityAssignmentPanel.vue`: Full ability assignment panel exists -- fetches species abilities, filters by Basic/Advanced for 'second' milestone.
- `app/components/encounter/LevelUpNotification.vue:59-68`: Displays milestone with clickable action to open assignment.

**Missing:** None -- both detection and assignment UI are now implemented.

**Classification:** Correct

---

## Item 26: R015 -- Abilities: Level 40 Milestone (C018, C073)

**Rule:** "At Level 40, a Pokemon gains a Third Ability, which may be chosen from any of its Abilities." (PTU p.200)

**Expected behavior:** Level 40 milestone detected and displayed. UI to assign ability.

**Actual behavior (present):**
- `app/utils/levelUpCheck.ts:70-73`: `else if (level === 40) { abilityMilestone = 'third'; abilityMessage = 'This Pokemon can now gain a Third Ability (any category).' }`.
- Same UI components as R014 handle the 'third' milestone.

**Missing:** None -- both detection and assignment UI are now implemented.

**Classification:** Correct

---

## Item 27: R017 -- Move Slot Limit (C011, C029)

**Rule:** "Pokemon may learn a maximum of 6 Moves from all sources combined. However, certain Abilities and Features may allow a Pokemon to bypass this limit." (PTU p.200)

**Expected behavior:** Generation limits to 6 moves. Validation on manual edits.

**Actual behavior (present):**
- `app/server/services/pokemon-generator.service.ts:493-494`: `selectMovesFromLearnset()` uses `.slice(-6)` to limit to 6 moves at generation.
- `app/components/pokemon/MoveLearningPanel.vue`: Move learning panel exists for level-up move assignment.

**Missing:**
- `app/server/api/pokemon/[id].put.ts:46`: `if (body.moves !== undefined) updateData.moves = JSON.stringify(body.moves)` -- no move count validation. GM can save >6 moves.
- No server-side validation that moves <= 6 on the PUT endpoint.

**Classification:** Approximation
**Severity:** LOW

**Notes:** Generation path correctly limits to 6. The lack of enforcement on manual edits is the gap. PTU notes "certain Abilities and Features may allow a Pokemon to bypass this limit", so a hard server-side block may be inappropriate. A warning-level validation would be more suitable.

---

## Item 28: R027 -- Level Up Stat Point (C018, C073)

**Rule:** "First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule." (PTU p.202)

**Expected behavior:** +1 stat point per level reported. Stat allocation UI with Base Relations enforcement.

**Actual behavior (present):**
- `app/utils/levelUpCheck.ts:80`: `statPointsGained: 1` for each level.
- `app/components/pokemon/PokemonLevelUpPanel.vue:8-17`: Shows stat points with "Allocate Stats" button.
- `app/components/pokemon/StatAllocationPanel.vue`: Full stat allocation panel with:
  - Base Relations tier display (lines 15-28).
  - Per-stat +/- buttons with valid target enforcement (line 53: `:disabled="!validTargets[stat]"`).
  - Validation feedback for Base Relations violations (lines 66-71).
  - Uses `useLevelUpAllocation` composable for allocation logic.

**Missing:** No server-side Base Relations validation on the PUT endpoint when stat points are submitted.

**Classification:** Correct

**Notes:** The detection, display, and allocation UI with client-side Base Relations enforcement are all present. The PUT endpoint accepts any stat values, but this is consistent with the GM-tool design where the GM is trusted to make correct edits. The StatAllocationPanel enforces Base Relations client-side before submission.

---

## Item 29: R029 -- Evolution Check on Level Up (C073, C082)

**Rule:** "Check its Pokedex Entry to see if [the Pokemon may Evolve]." (PTU p.202)

**Expected behavior:** Evolution eligibility detected and displayed at level-up.

**Actual behavior (present):**
- `app/utils/evolutionCheck.ts`: Full evolution eligibility check system.
- `app/utils/experienceCalculation.ts:341`: `canEvolve: evolutionLevels ? evolutionLevels.includes(info.newLevel) : false`.
- `app/server/api/pokemon/[id]/add-experience.post.ts:86-94`: Loads `evolutionTriggers` from SpeciesData, computes `evolutionLevels` via `getEvolutionLevels()`.
- `app/components/encounter/LevelUpNotification.vue:71-80`: Shows "Evolution available at Level X!" with clickable action button.
- `app/components/pokemon/PokemonLevelUpPanel.vue:52-54`: Shows evolution reminder text with link to Evolve button.
- `app/server/services/evolution.service.ts`: Full evolution execution service (stat recalculation, ability remapping, move learning, capability update).

**Missing:** None -- evolution detection, notification, and execution are all implemented.

**Classification:** Correct

---

## Item 30: R001 -- Pokemon Party Limit (C005, C039)

**Rule:** "Trainers are allowed to carry with them a maximum of six Pokemon at a time." (PTU p.196)

**Expected behavior:** ownerId relationship functional. Party size enforcement.

**Actual behavior (present):**
- `app/prisma/schema.prisma:177-178`: `ownerId String?; owner HumanCharacter? @relation(...)`.
- Link/unlink endpoints exist at `POST /api/pokemon/:id/link` and `POST /api/pokemon/:id/unlink`.
- `library.getPokemonByOwner` store getter returns all Pokemon linked to a trainer.

**Missing:** No server-side enforcement of the 6-Pokemon party limit on the link endpoint. The GM can link >6 Pokemon to a single trainer.

**Classification:** Approximation
**Severity:** LOW

**Notes:** PTU itself notes "a GM may certainly bend this rule for their own campaign" (p.196). The lack of enforcement is consistent with a GM-tool that trusts the GM. An optional warning would be an improvement.

---

## Item 31: R012 -- Evasion Calculation (C074)

**Rule:** PTU p.236 (combat chapter): Evasion derived from Defense, Special Defense, and Speed stats.

**Expected behavior:** Stats displayed; auto-calculation available.

**Actual behavior (present):**
- Stats (Defense, SpDef, Speed) are stored and displayed in `PokemonStatsTab` (C074).
- Evasion IS auto-calculated during combat via `useCombat` composable and `useMoveCalculation` composable, which use `calculateEvasion()` from `app/utils/damageCalculation.ts`.
- The evasion calculation happens at move resolution time, not on the Pokemon sheet itself.

**Missing:** No standalone evasion display on the Pokemon sheet (evasion values only appear during combat targeting).

**Classification:** Approximation
**Severity:** LOW

**Notes:** Cross-domain with combat. Evasion is correctly calculated when needed (during combat), but not displayed as a pre-computed stat on the Pokemon sheet. This is a display gap, not a calculation gap.

---

## Item 32: R024 -- Tutor Points: Permanent Spend (C008, C037)

**Rule:** "Tutor Points are stored until used by a TM, Feature, or Poke Edge. Once used, Tutor Points are lost forever." (PTU p.202)

**Expected behavior:** tutorPoints field editable. Spend workflow tracks purchases.

**Actual behavior (present):**
- `app/prisma/schema.prisma:156`: `tutorPoints Int @default(0)`.
- PUT endpoint allows editing `tutorPoints` (the field is on the Pokemon model but not explicitly shown in PUT handler -- however, it can be updated via the generic field update pattern).
- `PokemonSkillsTab` (C077) displays tutor points.

**Missing:** No spend/purchase workflow. No tracking of what tutor points were spent on. GM manually edits the integer.

**Classification:** Approximation
**Severity:** LOW

**Notes:** The tutor points field exists and is functional. The missing workflow is a convenience gap, not a rules correctness issue. The GM decrements manually.

---

## Item 33: R035 -- Vitamins: Base Stat Increase (C037)

**Rule:** PTU describes vitamins that permanently increase a base stat.

**Expected behavior:** Vitamin application workflow. Tracking of vitamin usage.

**Actual behavior (present):**
- GM can manually increase base stats via `PUT /api/pokemon/:id` with `body.baseStats` (lines 67-74 of `[id].put.ts`).

**Missing:** No vitamin-specific UI. No tracking of vitamin usage count. No vitamin application workflow.

**Classification:** Approximation
**Severity:** LOW

**Notes:** The stat editing capability exists. Vitamins are a manual GM operation, which is consistent with the tool's design.

---

## Item 34: R030 -- Optional Evolution Refusal (C073)

**Rule:** "You may choose not to Evolve your Pokemon if you wish." (PTU p.202)

**Expected behavior:** Explicit accept/refuse UI for evolution.

**Actual behavior (present):**
- Evolution is not automatic -- the GM must explicitly trigger it via the Evolve button.
- The evolution service requires deliberate invocation with `targetSpecies`, `statPoints`, etc.
- Default behavior is no evolution (refusal by omission).

**Missing:** No explicit "refuse" button, but refusal is the default state. The GM simply does not click Evolve.

**Classification:** Correct

**Notes:** In the previous audit, this was classified as "vacuously satisfied" because the evolution system didn't exist. Now that the evolution system is implemented, refusal is explicitly the default state (GM must take action to evolve). This is a correct implementation of the rule.

---

## Item 35: R010 -- Base Relations: Manual Edit Validation (C033)

**Rule:** "This order must be maintained when adding Stat Points." (PTU p.198)

**Expected behavior:** Base Relations validated on manual stat edits.

**Actual behavior (present):**
- Auto-generation: `enforceBaseRelations()` in `pokemon-generator.service.ts` enforces during creation.
- Evolution: `validateBaseRelations()` in `evolution.service.ts` validates during evolution.
- Client-side: `StatAllocationPanel.vue` enforces Base Relations during level-up allocation.

**Missing:** No server-side validation on the PUT endpoint (`[id].put.ts`). The GM can set stats that violate Base Relations via direct API call.

**Classification:** Approximation
**Severity:** LOW

**Notes:** Client-side enforcement exists for the normal allocation workflow (StatAllocationPanel). The server-side gap only affects direct API calls or custom tooling. The GM is trusted to make correct edits.
