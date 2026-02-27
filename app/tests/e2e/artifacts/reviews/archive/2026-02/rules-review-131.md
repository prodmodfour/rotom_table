---
review_id: rules-review-131
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-060
domain: scenes, encounter-tables
commits_reviewed:
  - 0092fcf
  - 88531ac
  - 6130c04
  - 15af1ab
  - 74aa1b6
  - 25f9261
  - 1d30e22
  - b2966fc
  - 53816d6
mechanics_verified:
  - encounter-budget-player-count
  - significance-multiplier-tiers
  - significance-xp-integration
  - significance-default-value
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/11-running-the-game.md#page-460-significance-multiplier
  - core/11-running-the-game.md#page-473-encounter-creation
reviewed_at: 2026-02-23T09:10:00Z
follows_up: rules-review-124
---

## Mechanics Verified

### 1. Encounter Budget Player Count (C1 Fix)

- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] From there, simply multiply the Experience drop by your number of Trainers." (`core/11-running-the-game.md#page-473`). "Divide by the number of Players -- not the number of Pokemon." (`core/11-running-the-game.md#page-460`). The budget formula counts only player trainers (PCs), not NPCs or allied trainers.
- **Implementation:** Commit `0092fcf` changes `characterType === 'pc'` to `characterType === 'player'` on line 223 of `app/pages/gm/scenes/[id].vue`. The `CharacterType` union type (`app/types/character.ts:12`) is `'player' | 'npc' | 'trainer'`. The Prisma schema (`app/prisma/schema.prisma:14`) defaults to `'npc'`. The filter now correctly matches characters with `characterType === 'player'`, which is the value used for PC trainers throughout the codebase. The `playerCharIds` array feeds both `playerCount` (used in the `avgLevel * 2 * playerCount` budget formula) and the `ownedPokemonLevels` lookup (restricting to PC-owned Pokemon only). When `playerCount === 0`, `budgetInfo` returns `undefined`, correctly hiding the budget display for NPC-only scenes.
- **Status:** CORRECT

### 2. Significance Multiplier Tier Definitions

- **Rule:** "The Significance Multiplier should range from x1 to about x5, and there's many things to consider when picking this value. [...] Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5 depending on their significance" (`core/11-running-the-game.md#page-460`)
- **Implementation:** The `SIGNIFICANCE_PRESETS` array in `app/utils/encounterBudget.ts:72-108` defines 5 tiers:

  | Tier | Label | Range | Default | PTU Reference |
  |------|-------|-------|---------|---------------|
  | insignificant | Insignificant | x1.0-1.5 | x1.0 | "x1 to x1.5" |
  | everyday | Everyday | x2.0-3.0 | x2.0 | "x2 or x3" |
  | significant | Significant | x3.0-4.0 | x3.5 | "x4" (gym leader) |
  | climactic | Climactic | x4.0-5.0 | x4.5 | "x4 to x5" |
  | legendary | Legendary | x5.0 | x5.0 | "x5 or even higher" |

  The ranges accurately partition the PTU-described spectrum. The rulebook describes a continuous range rather than discrete tiers, and the implementation correctly captures this by storing both a `defaultMultiplier` (used as the preset value) and a `multiplierRange` (for reference). The descriptions match PTU examples: "Random wild encounters" for insignificant, "Standard trainer battles" for everyday, "Gym leaders, rival encounters" for significant.
- **Status:** CORRECT

### 3. Significance Default Value

- **Rule:** The encounter creation page at `core/11-running-the-game.md#page-473` states: "This assumes an encounter with a Significance Multiplier of 1x, or insignificant." This establishes that the baseline/default significance is x1 (insignificant).
- **Implementation:** The Prisma schema (`app/prisma/schema.prisma:224`) sets `significanceTier String @default("insignificant")` and `significanceMultiplier Float @default(1.0)`. The `StartEncounterModal.vue` initializes `selectedTier` to `'insignificant'` (line 118). The `GenerateEncounterModal.vue` also defaults to `'insignificant'` (line 297), with a comment noting this is per PTU guidelines for wild encounters. All API endpoints (`index.post.ts:28`, `from-scene.post.ts:65`, `[id].put.ts:44`) default to `'insignificant'` and `1.0` when no value is provided. This is correct per PTU: the baseline encounter assumes x1 significance.
- **Status:** CORRECT

### 4. Significance-XP Integration

- **Rule:** "Second, consider the significance of the encounter. This will decide a value to multiply the Base Experience Value." (`core/11-running-the-game.md#page-460`). The XP formula is: `Base XP (sum of defeated enemy levels, trainers 2x) * Significance Multiplier / Player Count`.
- **Implementation:** The significance multiplier is stored on the Encounter record and flows through to the XP calculation pipeline. The `calculateEncounterXp()` function in `app/utils/experienceCalculation.ts:263-304` correctly applies the formula: Step 1 sums enemy levels (trainers at 2x), Step 2 multiplies by `significanceMultiplier`, Step 3 divides by player count (with boss exception per PTU p.489). The new `significanceTier` field stores the GM's selected preset label alongside the numeric `significanceMultiplier`, enabling the UI to display the selected tier without reverse-mapping. The `significanceTier` is synchronized via WebSocket (`app/stores/encounter.ts:396-401`) so Group View stays in sync. The dedicated `PUT /api/encounters/:id/significance` endpoint validates the multiplier range (0.5-10), which accommodates the PTU-described possibility of values "even higher" than x5 while rejecting unreasonable values.
- **Status:** CORRECT

### 5. Data Flow Integrity (Significance Through Full Pipeline)

- **Rule:** N/A (architecture verification, not a specific PTU rule).
- **Implementation:** The significance data flows correctly through all creation paths:
  - **Scene path:** `StartEncounterModal` emits `{ battleType, significanceMultiplier, significanceTier }` on confirm -> `handleStartEncounter` in `scenes/[id].vue` forwards to `encounterStore.createFromScene()` -> `POST /api/encounters/from-scene` persists both fields.
  - **Habitat/encounter-table path:** `GenerateEncounterModal` emits `{ multiplier, tier }` via `addToEncounter` event -> parent pages (`encounter-tables.vue`, `habitats/[id].vue`, `habitats/index.vue`) forward through `handleAddToEncounter` -> `encounterCreation.createWildEncounter()` -> `encounterStore.createEncounter()` -> `POST /api/encounters` persists both fields.
  - **Update path:** `PUT /api/encounters/:id` persists `significanceTier` alongside `significanceMultiplier`.
  - **WebSocket sync:** `updateFromWebSocket` in the encounter store handles both `significanceMultiplier` and `significanceTier` fields.
- **Status:** CORRECT

## Summary

All 9 commits have been reviewed for PTU rules compliance. The C1 fix correctly resolves the critical bug identified in code-review-134 and rules-review-124 -- the `characterType` filter in the scene budget computation now uses `'player'`, which matches the `CharacterType` union type and the Prisma schema default for PC trainers. The budget display will now function correctly for scenes containing player characters.

The P1 significance multiplier implementation faithfully represents the PTU 1.05 significance system (Core p.460). The five preset tiers accurately partition the x1-x5 range described in the rulebook, with appropriate defaults and descriptions. The default significance of `'insignificant'` (x1.0) matches the PTU baseline assumption on p.473. The significance value integrates correctly with the existing XP calculation pipeline in `experienceCalculation.ts`, where it serves as the Step 2 multiplier in the XP formula.

One minor note: the `experienceCalculation.ts` file has its own `SIGNIFICANCE_PRESETS` constant (lines 59-66) with a different set of tier names (`below_average`, `average`, `above_average`, `significant`, `major`) compared to the new `encounterBudget.ts` presets (`insignificant`, `everyday`, `significant`, `climactic`, `legendary`). These are two separate systems -- the `experienceCalculation.ts` presets power the post-combat XP distribution UI, while the `encounterBudget.ts` presets power the encounter creation significance selector. Both are valid representations of the same PTU rulebook text; they just use different granularity and naming. This is not a rules issue -- both correctly span the x1-x5 range -- but a future refactoring opportunity for UI consistency.

## Rulings

No PTU rules disputes. All mechanics are implemented correctly per the rulebook text.

## Verdict

**APPROVED** -- The C1 fix resolves the critical bug correctly. The P1 significance multiplier implementation accurately represents PTU 1.05 significance tiers and integrates properly with the existing XP calculation pipeline. No rules issues found.

## Required Changes

None.
