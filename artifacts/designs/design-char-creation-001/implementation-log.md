# Implementation Log

## Implementation Log

### P0 Implementation (2026-02-20)

**Status:** Complete

**Files created:**
- `app/constants/trainerSkills.ts` -- 17 PTU skills by category, rank progression, level prereqs, `getDefaultSkills()`
- `app/constants/trainerBackgrounds.ts` -- 11 sample backgrounds with Adept/Novice/Pathetic assignments
- `app/utils/characterCreationValidation.ts` -- Pure validation: stat allocation, skill background, edge/feature counts
- `app/composables/useCharacterCreation.ts` -- Form state, stat tracking, background logic, payload builder
- `app/components/create/StatAllocationSection.vue` -- +/- stat buttons, 10-point pool, derived stats display
- `app/components/create/SkillBackgroundSection.vue` -- Preset dropdown, custom mode, categorized skill grid

**Files modified:**
- `app/pages/gm/create.vue` -- Replaced raw stat inputs with section components, uses composable

**Design decisions:**
- Composable returns computed refs; template accesses `.value` for prop bindings since the return is a plain object
- Background presets encode a single default for backgrounds with choice options (flagged for P1 enhancement)
- Custom background mode provides Adept/Novice dropdowns and Pathetic checkboxes (max 3)
- Validation is soft warnings only -- shown in summary section but never blocks form submission
- Hermit background encodes `Occult Ed` Adept / `Perception` Novice per PTU Core p.14 (corrected in rules-review-108 fix)

**Commits:**
1. `feat: add PTU trainer skill constants and background presets`
2. `feat: add character creation validation utility`
3. `feat: add useCharacterCreation composable`
4. `feat: add StatAllocationSection component for character creation`
5. `feat: add SkillBackgroundSection component for character creation`
6. `feat: integrate stat allocation and skill background into create page`

### Rules Review 108 Fixes (2026-02-20)

**Trigger:** rules-review-108 FAIL verdict on P0 implementation

**Fixes applied:**
1. **Hermit background** (`app/constants/trainerBackgrounds.ts`) -- Changed `adeptSkill` from `'Perception'` to `'Occult Ed'` and `noviceSkill` from `'Survival'` to `'Perception'` per PTU Core p.14: "Adept Education Skill, Novice Perception". Pathetic skills already correct.
2. **Evasion cap** (`app/composables/useCharacterCreation.ts`) -- Added `Math.min(6, ...)` to all three evasion computations per PTU Core p.16: "You may never have more than +6 in a given Evasion from Combat Stats alone."

**Commits:**
7. `fix: correct Hermit background skill assignments per PTU Core p.14`
8. `fix: cap evasion values at +6 per PTU Core p.16`

### P1 Implementation (2026-02-20)

**Status:** Complete

**Files created:**
- `app/constants/trainerStats.ts` -- Shared stat allocation constants (BASE_HP, BASE_OTHER, TOTAL_STAT_POINTS, MAX_POINTS_PER_STAT)
- `app/constants/trainerClasses.ts` -- 39 trainer classes across 6 categories with associated skills, branching flag, `getClassesByCategory()` utility
- `app/components/create/ClassFeatureSection.vue` -- Searchable class picker grouped by category, branching specialization prompts, feature text input (4+1 Training Feature), tag display
- `app/components/create/EdgeSelectionSection.vue` -- Edge name input with counter, Skill Edge shortcut integrating with skill grid, PTU rank-up validation

**Files modified:**
- `app/composables/useCharacterCreation.ts` -- Added class add/remove, feature add/remove/training, edge add/remove/skillEdge, allFeatures computed, classFeatureEdgeWarnings, expanded buildCreatePayload; imported shared stat constants; fixed applyBackground immutability pattern
- `app/components/create/StatAllocationSection.vue` -- Imports stat constants from shared trainerStats.ts instead of local declarations
- `app/utils/characterCreationValidation.ts` -- validateEdgesAndFeatures already existed from P0 (no changes needed)
- `app/pages/gm/create.vue` -- Integrated EdgeSelectionSection and ClassFeatureSection with handleSkillEdge bridge function

**Code review fixes addressed (from code-review-118):**
- M1: Stat constants extracted to `constants/trainerStats.ts`, imported by both composable and StatAllocationSection
- M2: `applyBackground` uses immutable spread pattern instead of bracket-assignment mutation

**Design decisions:**
- Class picker uses searchable grouped list (not modal) -- keeps the form flow single-page
- Branching classes (Type Ace, Stat Ace, Researcher, Martial Artist, Style Expert) prompt for specialization name before adding
- Features are free-text input (not a database lookup) per design spec rationale -- PTU has hundreds of features
- Skill Edge shortcut validates: cannot raise Pathetic skills, cannot exceed Novice at level 1
- Edge counter is informational (4 starting), not a hard cap -- GM may override for higher-level characters
- Section order: Background/Skills -> Edges -> Classes/Features -> Stats (edges before classes so Skill Edges are visible when selecting class features)

**Commits:**
9. `1ed7df6` -- `refactor: extract stat constants to shared trainerStats.ts and fix applyBackground immutability`
10. `68d4c2e` -- `feat: add PTU trainer class constants with categories and descriptions`
11. `9be9663` -- `feat: add class, feature, and edge state management to useCharacterCreation`
12. `295d4dd` -- `feat: add ClassFeatureSection component for character creation`
13. `a2c638a` -- `feat: add EdgeSelectionSection component for character creation`
14. `4a0eb0c` -- `feat: integrate class, feature, and edge sections into create page`

### P1 Review Fixes (2026-02-20)

**Trigger:** code-review-121 findings

**Fixes applied:**
- H1: Skill Edge removal now reverts skill rank (`f29b845`)
- H2: Skill background validation clarified for Skill Edges (`c95a237`)
- M1: Dead `skillEdgeError` code removed (`f8d7854`)
- M4: Validation uses shared stat constants (`68e33d7`)

### P2 Implementation (2026-02-21)

**Status:** Complete

**Files created:**
- `app/components/create/BiographySection.vue` -- Collapsible section with age, gender, height (cm+ft/in), weight (kg+lbs+WC), background story, personality, goals, money. Unit conversion helpers.

**Files modified:**
- `app/composables/useCharacterCreation.ts` -- Added biography form fields (age, gender, height, weight, backgroundStory, personality, goals, money), DEFAULT_STARTING_MONEY constant, sectionCompletion computed, CreateMode/SectionCompletion type exports, wired biography into buildCreatePayload()
- `app/pages/gm/create.vue` -- Restructured into Quick Create / Full Create mode toggle, integrated BiographySection, added section progress indicators, separate quickForm for minimal NPC creation, biography auto-expand for PCs

**Design decisions:**
- Quick Create is a separate form with its own `quickForm` ref -- does not share state with the Full Create composable (keeps forms independent, prevents data bleed)
- Quick Create sends raw stats directly to the API (no point allocation), matching the original minimal form behavior
- Full Create shows a section progress bar at the top with per-section completion indicators (checkmark vs dot)
- BiographySection is collapsible: expanded by default for Player Characters, collapsed for NPCs (via watch on characterType)
- Money defaults to 5000 (PTU p.17 level 1 starting funds), editable
- Background story field takes precedence over background preset name for the DB `background` field in buildCreatePayload
- Weight class display uses PTU weight class ranges (WC 1-6) for trainer reference
- Height/weight show inline unit conversions (cm to ft/in, kg to lbs)

**Commits:**
15. `5b0ab14` -- `feat: add biography fields to useCharacterCreation composable`
16. `67fd068` -- `feat: add BiographySection.vue for character creation`
17. `f8bd6c1` -- `feat: add CreateMode type and section completion tracking`
18. `2c898c4` -- `feat: add Quick-Create/Full-Create mode toggle with BiographySection`

