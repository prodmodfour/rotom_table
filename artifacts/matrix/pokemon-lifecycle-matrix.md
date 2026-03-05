---
domain: pokemon-lifecycle
type: coverage-matrix
version: 2
total_rules: 68
total_capabilities: 82
generated_at: 2026-03-05T12:00:00Z
generated_by: coverage-analyzer
previous_version: session-59 (stale)
relevant_decrees: [decree-035, decree-036]
---

# Feature Completeness Matrix: pokemon-lifecycle

## Coverage Score

```
Implemented:              34
Implemented-Unreachable:   0
Partial:                  13
Missing:                  12
Subsystem-Missing:         2  (covering 9 rules)
Out of Scope:              9

Total rules:              68
Scoring denominator:      68 - 9 (Out of Scope) = 59

Coverage = (34 + 0.5*13 + 0.5*0) / 59 * 100
         = (34 + 6.5) / 59 * 100
         = 40.5 / 59 * 100
         = 68.6%
```

### Breakdown

| Classification | Count | % of Total |
|---------------|-------|------------|
| Implemented | 34 | 50.0% |
| Implemented-Unreachable | 0 | 0.0% |
| Partial | 13 | 19.1% |
| Missing | 12 | 17.6% |
| Subsystem-Missing | 2 groups (9 rules) | 13.2% |
| Out of Scope | 9 | -- |

---

## Coverage Matrix

Legend for Actor column:
- `gm` = Game Master initiates/controls
- `player` = Player/Trainer initiates
- `both` = Either GM or player, depending on table conventions
- `system` = Automatic calculation, no human actor

Legend for Accessible From:
- `gm` = GM view only
- `player` = Player view
- `gm+player` = Both views
- `api-only` = Backend only, no UI
- `all` = GM + player + group views
- `--` = Not implemented

| Rule ID | Rule Name | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|-------|---------------|-----------------|----------------------|-------------|-------|
| R001 | Pokemon Party Limit | gm | Partial | gm | C005, C039, C053, C059 | P2 | **Present:** ownerId links Pokemon to trainers; getPokemonByOwner returns party. **Missing:** No server-side enforcement of 6-Pokemon party limit on link endpoint. GM can link >6 Pokemon to a single trainer. |
| R002 | Pokemon Maximum Level | system | Implemented | gm | C006, C007, C042, C045, C014 | -- | experience field capped at MAX_EXPERIENCE (20,555 = level 100). Level derived from EXPERIENCE_CHART. add-experience validates max. |
| R003 | Base Stats Definition | system | Implemented | gm+player | C001, C002, C074 | -- | Pokemon model stores baseStats. SpeciesData seeded from pokedex. PokemonStatsTab displays base stats. |
| R004 | Pokemon Types | system | Implemented | gm+player | C001, C002, C072 | -- | Types stored on Pokemon model and SpeciesData. Displayed as type badges in PokemonEditForm. |
| R005 | Nature System | system | Implemented | gm+player | C010, C013, C074 | -- | 36 natures in NATURE_TABLE constant. Nature stored as JSON on Pokemon. Displayed in PokemonStatsTab with raised/lowered indicators. |
| R006 | Nature Stat Adjustments | system | Implemented | api-only | C017, C013 | -- | applyNatureToBaseStats() implements HP +1/-1, others +2/-2, floor at 1. Pure function used at generation. |
| R007 | Neutral Natures | system | Implemented | api-only | C017, C013 | -- | NATURE_TABLE includes 6 neutral natures (raise === lower). applyNatureToBaseStats returns unmodified copy for neutrals. |
| R008 | Nature Flavor Preferences | both | Out of Scope | -- | -- | -- | Flavor preferences are narrative/RP content. No mechanical impact on the session helper app. |
| R009 | Stat Points Allocation Total | system | Implemented | api-only | C033, C029 | -- | distributeStatPoints allocates (level + 10) stat points. generatePokemonData uses this at creation. |
| R010 | Base Relations Rule | system | Partial | api-only | C033 | P1 | **Present:** distributeStatPoints enforces Base Relations during auto-generation (stats with higher base values get >= added points). **Missing:** No validation when GM manually edits stats via PUT endpoint. No UI enforcement during manual stat point allocation. decree-035 requires nature-adjusted ordering -- unclear if auto-generation respects this (auditor should verify). |
| R011 | Pokemon HP Formula | system | Implemented | gm+player | C009, C029, C036, C042 | -- | HP = Level + (HP_stat * 3) + 10. Applied at creation (generatePokemonData, POST /api/pokemon). Updated on level-up (maxHp += levelsGained for level component). |
| R012 | Evasion Calculation | system | Partial | gm | C074, C001 | P2 | **Present:** Stats from which evasion derives (Def, SpDef, Speed) are stored and displayed. **Missing:** No automatic evasion calculation from stats. Evasion values are not computed or displayed. Cross-domain with combat. |
| R013 | Abilities - Initial Assignment | system | Implemented | gm | C012, C029, C072 | -- | generatePokemonData picks one random Basic Ability. Stored in abilities JSON. Displayed on sheet. |
| R014 | Abilities - Level 20 | system | Partial | gm | C018, C073, C082 | P1 | **Present:** checkLevelUp detects level 20 milestone and reports "second ability" in abilityMilestones. PokemonLevelUpPanel and LevelUpNotification display this. **Missing:** No UI to select and add the second ability. GM must manually edit abilities JSON. |
| R015 | Abilities - Level 40 | system | Partial | gm | C018, C073, C082 | P1 | **Present:** checkLevelUp detects level 40 milestone and reports "third ability". Displayed in notifications. **Missing:** No UI to select and add the third ability. Same gap as R014. |
| R016 | No Ability Maximum | system | Implemented | gm | C012, C037 | -- | abilities field is a JSON array with no length constraint. PUT endpoint accepts any number of abilities. |
| R017 | Move Slot Limit | both | Partial | gm | C011, C029 | P1 | **Present:** generatePokemonData selects up to 6 moves at creation. **Missing:** No server-side validation on PUT that move count <= 6. No UI enforcement when manually editing moves. |
| R018 | Natural Move Sources | system | Implemented | api-only | C002, C029, C018 | -- | SpeciesData.learnset contains level-up moves (natural). Generation selects from learnset. checkLevelUp reports new natural moves per level. |
| R019 | TM/Tutor Move Limit | both | Missing | -- | -- | P2 | No tracking of TM vs Natural move sources on the moves JSON. No enforcement of 3 TM/Tutor limit. Moves stored as flat array without source classification. |
| R020 | TM-to-Natural Reclassification | both | Missing | -- | -- | P3 | No move source tracking means reclassification cannot be detected or applied. Depends on R019 gap. |
| R021 | Tutor Move Level Restrictions | system | Missing | -- | -- | P2 | No validation of move frequency/damage base vs Pokemon level for tutor-taught moves. No tutor move teaching UI exists. |
| R022 | Tutor Points - Initial | system | Implemented | gm | C008, C029 | -- | tutorPoints field on Pokemon model. Initial value set during generation. Displayed in PokemonSkillsTab. |
| R023 | Tutor Points - Level Progression | system | Implemented | gm | C018, C042, C045 | -- | checkLevelUp awards tutor point at level 5 and every 5 levels. add-experience and xp-distribute endpoints update tutorPoints on level-up. |
| R024 | Tutor Points - Permanent Spend | both | Partial | gm | C008, C037 | P2 | **Present:** tutorPoints field can be decremented via PUT. **Missing:** No spend/purchase workflow. No tracking of what tutor points were spent on. GM manually edits the integer. |
| R025 | Tutor Points - Trade Refund | gm | Missing | -- | -- | P3 | No feature-to-Pokemon association tracking. No refund logic on ownership transfer (unlink). |
| R026 | Level Up Workflow | system | Partial | gm | C018, C019, C021, C042, C045, C073, C082 | P1 | **Present:** Level-up detection via checkLevelUp (stat points, moves, abilities, tutor points). Preview via PokemonLevelUpPanel. Notifications via LevelUpNotification. Auto-updates experience/level/tutorPoints/maxHp. **Missing:** No orchestrated workflow that walks GM through each step (allocate stat point, choose move, check evolution). Each step requires manual editing. |
| R027 | Level Up Stat Point | system | Partial | gm | C018, C073 | P1 | **Present:** checkLevelUp reports +1 stat point per level gained. Displayed in PokemonLevelUpPanel. **Missing:** No stat point allocation UI. GM must manually edit base stats via PUT. No Base Relations validation on manual edit. |
| R028 | Level Up Move Check | system | Implemented | gm | C018, C073, C082 | -- | checkLevelUp reports new moves available at each level from learnset. PokemonLevelUpPanel and LevelUpNotification display them. GM informed of available moves. |
| R029 | Evolution Check on Level Up | system | Partial | gm | C073, C082 | P1 | **Present:** PokemonLevelUpPanel shows "evolution reminder" text. LevelUpNotification shows evolution eligibility. **Missing:** No evolution condition detection (SpeciesData lacks evolution triggers). No automated species transformation. GM must manually handle. Subsystem gap (see below). |
| R030 | Optional Evolution Refusal | both | Partial | gm | C073 | P2 | **Present:** Evolution is not automatic, so refusal is the default behavior (nothing happens unless GM manually evolves). **Missing:** No explicit accept/refuse UI. Evolution system doesn't exist, so refusal is vacuously satisfied. |
| R031 | Evolution - Stat Recalculation | gm | Subsystem-Missing | -- | -- | P1 | Part of missing Evolution System. decree-035 mandates nature-adjusted base stats for ordering. No implementation exists. |
| R032 | Evolution - Ability Remapping | gm | Subsystem-Missing | -- | -- | P1 | Part of missing Evolution System. No ability slot remapping on species change. |
| R033 | Evolution - Immediate Move Learning | gm | Subsystem-Missing | -- | -- | P1 | Part of missing Evolution System. decree-036 mandates stone evolutions use current level as upper bound. No implementation exists. |
| R034 | Evolution - Skills and Capabilities Update | gm | Subsystem-Missing | -- | -- | P1 | Part of missing Evolution System. No automated skill/capability refresh on species change. |
| R035 | Vitamins - Base Stat Increase | gm | Partial | gm | C037 | P2 | **Present:** GM can manually increase base stats via PUT /api/pokemon/:id. **Missing:** No vitamin-specific UI, no tracking of vitamin usage count, no vitamin application workflow. |
| R036 | Vitamins - Maximum Per Pokemon | gm | Missing | -- | -- | P2 | No tracking of vitamins used per Pokemon. No enforcement of 5-vitamin cap. |
| R037 | Heart Booster | gm | Missing | -- | -- | P3 | No heart booster item logic. No 1-per-Pokemon constraint. GM can manually increment tutorPoints but no guardrail. |
| R038 | Pokemon Creation Workflow | gm | Implemented | gm | C029, C030, C031, C036, C050 | -- | Full creation pipeline: generatePokemonData (species lookup, nature, stat distribution, HP, moves, ability) -> createPokemonRecord -> DB. Manual creation via POST /api/pokemon. Store action library.createPokemon. |
| R039 | Breeding - Species Determination | gm | Out of Scope | -- | -- | -- | Breeding system is not within the session helper's core scope (encounter/combat assistance tool). |
| R040 | Breeding - Inheritance Move List | gm | Out of Scope | -- | -- | -- | Breeding system out of scope. |
| R041 | Breeding - Inheritance Move Schedule | gm | Out of Scope | -- | -- | -- | Breeding system out of scope. |
| R042 | Inheritance Move Level Restrictions | gm | Out of Scope | -- | -- | -- | Breeding system out of scope. |
| R043 | Breeding - Trait Determination | gm | Out of Scope | -- | -- | -- | Breeding system out of scope. |
| R044 | Breeding - Nature Choice Threshold | gm | Out of Scope | -- | -- | -- | Breeding system out of scope. |
| R045 | Breeding - Ability Choice Threshold | gm | Out of Scope | -- | -- | -- | Breeding system out of scope. |
| R046 | Breeding - Gender Choice Threshold | gm | Out of Scope | -- | -- | -- | Breeding system out of scope. |
| R047 | Breeding - Shiny Determination | gm | Out of Scope | -- | -- | -- | Breeding system out of scope. |
| R048 | Loyalty System - Ranks | gm | Missing | -- | -- | P2 | No loyalty field on Pokemon model. No loyalty rank tracking. |
| R049 | Loyalty - Command Checks | gm | Missing | -- | -- | P2 | No loyalty system, no command check DC lookup. |
| R050 | Loyalty - Starting Values | system | Missing | -- | -- | P2 | No loyalty field. Starting values not assigned at creation. |
| R051 | Loyalty - Intercept at Rank 3 | system | Missing | -- | -- | P3 | Cross-domain with combat. No loyalty system to gate intercept. |
| R052 | Loyalty - Intercept at Rank 6 | system | Missing | -- | -- | P3 | Cross-domain with combat. No loyalty system to gate intercept. |
| R053 | Disposition System | gm | Missing | -- | -- | P3 | No disposition tracking for wild Pokemon. Narrative/encounter setup. |
| R054 | Disposition - Charm Check DCs | gm | Missing | -- | -- | P3 | No disposition system, no charm check DC lookup. |
| R055 | Training Session | both | Subsystem-Missing | -- | -- | P2 | Part of missing Training System. trainingExp field exists on model but no endpoint or UI. |
| R056 | Experience Training Formula | both | Subsystem-Missing | -- | -- | P2 | Part of missing Training System. Formula (half level + Command Rank bonus) not implemented. |
| R057 | Experience Training Limit | both | Subsystem-Missing | -- | -- | P2 | Part of missing Training System. No daily limit tracking per trainer. |
| R058 | Pokemon Experience Calculation | system | Implemented | gm | C020, C022, C044 | -- | calculateEncounterXp: sums defeated enemy levels (trainers 2x), multiplies by significance, divides by player count. Floors all divisions. |
| R059 | Experience Distribution Rules | gm | Implemented | gm | C045, C056, C078 | -- | XpDistributionModal allows GM to allocate XP to participating Pokemon freely. No restriction on fainted Pokemon receiving XP. GM splits as desired. Over-allocation validation prevents exceeding total. |
| R060 | Experience Chart | system | Implemented | gm | C014, C023, C024, C025 | -- | EXPERIENCE_CHART constant maps levels 1-100 to cumulative XP. getXpForLevel, getLevelForXp, getXpToNextLevel provide lookups. |
| R061 | Size Classes | system | Implemented | gm | C002, C076, C032 | -- | SpeciesData stores size. PokemonCapabilitiesTab displays size. buildPokemonCombatant determines token size from species size. |
| R062 | Weight Classes | system | Implemented | gm | C002, C076 | -- | SpeciesData stores weight class. PokemonCapabilitiesTab displays weight class. |
| R063 | Species Capabilities | system | Implemented | gm | C002, C076, C001 | -- | SpeciesData stores capabilities. Pokemon model stores capabilities JSON (set from species at generation). PokemonCapabilitiesTab displays them. |
| R064 | Move-Granted Capabilities | both | Missing | -- | -- | P3 | No tracking of move-granted capabilities. Capabilities stored as flat list without source attribution. Forgetting a move doesn't remove associated capabilities. |
| R065 | Pokemon Skills | system | Implemented | gm | C002, C001, C077, C066 | -- | SpeciesData stores skill ranks. Pokemon model stores skills JSON. PokemonSkillsTab displays with dice roll support. |
| R066 | Mega Evolution - Trigger | both | Subsystem-Missing | -- | -- | P3 | Part of missing Evolution System (mega evolution sub-type). No mega stone item tracking, no mega ring check, no trigger action. Edge-case scope. |
| R067 | Mega Evolution - Stat and Ability Changes | system | Subsystem-Missing | -- | -- | P3 | Part of missing Evolution System. No mega stat recalculation or temporary ability addition. Edge-case scope. |
| R068 | Mega Evolution - Constraints | system | Subsystem-Missing | -- | -- | P3 | Part of missing Evolution System. No scene-duration tracking, no one-mega-per-trainer constraint. Edge-case scope. |

---

## Actor Accessibility Summary

### Rules by Actor

| Actor | Total Rules | Implemented | Partial | Missing | Subsystem-Missing | Out of Scope |
|-------|------------|-------------|---------|---------|-------------------|-------------|
| system | 30 | 20 | 5 | 4 | 1 (3 rules) | 0 |
| gm | 22 | 5 | 2 | 8 | 1 (4 rules) | 9 |
| both | 13 | 0 | 5 | 2 | 2 (5 rules) | 0 |
| player | 0 | 0 | 0 | 0 | 0 | 0 |

Note: No rules in this domain have `actor: player` exclusively. PTU Pokemon management is primarily trainer (player) and GM territory, but in this VTT app, the GM view serves as the primary management interface. Players have read-only access to their Pokemon via the player view and export/import capability.

### Reachability Analysis

All implemented and partial capabilities in this domain are accessible from the **GM view**. The player view has:
- Read access to own Pokemon data (via character sheet)
- Export/Import functionality (C047, C048, C070, C071)
- Sprite display (C062-C065)
- WebSocket updates (C079)

No `Implemented-Unreachable` classifications exist because:
1. All GM-actor rules are accessible from the GM view (correct actor match)
2. All system-actor rules execute automatically (no actor needed)
3. All both-actor rules that are partially implemented are accessible from the GM view (GM can proxy for player)

The player cannot independently allocate stat points, choose moves, or manage abilities -- but this is consistent with the app's design where the GM manages Pokemon sheets and the player views them.

---

## Subsystem Gaps

### Subsystem Gap 1: Evolution System

**Missing subsystem:** No automated evolution detection, species transformation, or post-evolution recalculation.

**Affected rules (7):**
| Rule | Name | Gap Priority |
|------|------|-------------|
| R029 | Evolution Check on Level Up | P1 (partial -- reminder exists but no detection) |
| R030 | Optional Evolution Refusal | P2 (partial -- vacuously satisfied) |
| R031 | Evolution - Stat Recalculation | P1 |
| R032 | Evolution - Ability Remapping | P1 |
| R033 | Evolution - Immediate Move Learning | P1 |
| R034 | Evolution - Skills and Capabilities Update | P1 |
| R066-R068 | Mega Evolution (trigger, stats, constraints) | P3 |

**Root cause:** SpeciesData model does not encode evolution triggers (level, item, trade, etc.). No evolution service or endpoint exists. No species-change workflow.

**Decree impact:** decree-035 (nature-adjusted base stats for Base Relations ordering) and decree-036 (stone evolution move learning formula) both apply to this subsystem.

**Suggested feature ticket:** "Evolution System -- detect evolution eligibility, transform species, recalculate stats/abilities/moves/skills per PTU rules and decree-035/decree-036"

### Subsystem Gap 2: Training System

**Missing subsystem:** No daily training session workflow, experience training grants, or training limit tracking.

**Affected rules (3):**
| Rule | Name | Gap Priority |
|------|------|-------------|
| R055 | Training Session | P2 |
| R056 | Experience Training Formula | P2 |
| R057 | Experience Training Limit | P2 |

**Root cause:** trainingExp field exists on Pokemon model but is never written to by any endpoint. No training endpoint or UI exists.

**Suggested feature ticket:** "Training System -- daily training session with XP grants (half level + Command Rank bonus), per-trainer daily limit, training features/edges support"

---

## Gap Priorities

### P0 (Blocks basic session usage)
None. The core loop (create Pokemon, run encounter, distribute XP) works.

### P1 (Important mechanic, commonly used)

| Rule | Gap | Type |
|------|-----|------|
| R010 | Base Relations not validated on manual stat edits | Partial |
| R014 | No UI to select/add second ability at level 20 | Partial |
| R015 | No UI to select/add third ability at level 40 | Partial |
| R017 | No move count validation on manual edit | Partial |
| R026 | No orchestrated level-up workflow (each step is manual) | Partial |
| R027 | No stat point allocation UI with Base Relations enforcement | Partial |
| R029 | Evolution detection exists only as reminder text | Partial |
| R031 | Evolution stat recalculation -- subsystem missing | Subsystem-Missing |
| R032 | Evolution ability remapping -- subsystem missing | Subsystem-Missing |
| R033 | Evolution immediate move learning -- subsystem missing | Subsystem-Missing |
| R034 | Evolution skills/capabilities update -- subsystem missing | Subsystem-Missing |

### P2 (Situational, workaround exists)

| Rule | Gap | Type |
|------|-----|------|
| R001 | No party limit enforcement (GM can over-link) | Partial |
| R012 | No evasion auto-calculation from stats | Partial |
| R019 | No TM/Tutor move source tracking or 3-move limit | Missing |
| R021 | No tutor move level restrictions | Missing |
| R024 | No tutor point spend workflow | Partial |
| R030 | No explicit evolution accept/refuse UI | Partial |
| R035 | No vitamin-specific UI or tracking | Partial |
| R036 | No vitamin cap (5 per Pokemon) enforcement | Missing |
| R048 | No loyalty rank tracking | Missing |
| R049 | No loyalty command check DCs | Missing |
| R050 | No loyalty starting values | Missing |
| R055 | Training session -- subsystem missing | Subsystem-Missing |
| R056 | Experience training formula -- subsystem missing | Subsystem-Missing |
| R057 | Experience training limit -- subsystem missing | Subsystem-Missing |

### P3 (Edge case, minimal gameplay impact)

| Rule | Gap | Type |
|------|-----|------|
| R020 | TM-to-Natural reclassification | Missing |
| R025 | Tutor point trade refund | Missing |
| R037 | Heart Booster item logic | Missing |
| R051 | Loyalty intercept at rank 3 | Missing |
| R052 | Loyalty intercept at rank 6 | Missing |
| R053 | Disposition system | Missing |
| R054 | Disposition charm check DCs | Missing |
| R064 | Move-granted capabilities | Missing |
| R066 | Mega Evolution trigger | Subsystem-Missing |
| R067 | Mega Evolution stat changes | Subsystem-Missing |
| R068 | Mega Evolution constraints | Subsystem-Missing |

---

## Auditor Queue

Prioritized list for Implementation Auditor verification. Ordered: core scope first, formulas/conditions first, foundation before derived.

### Tier 1: Core Formulas and Constants (verify correctness)

| Priority | Rule | Capability | Verify |
|----------|------|-----------|--------|
| 1 | R006 | C017 (applyNatureToBaseStats) | HP +1/-1, others +2/-2, floor at 1, neutral natures no-op |
| 2 | R007 | C013, C017 | 6 neutral natures correctly identified (Composed, Hardy, Docile, Bashful, Quirky, Serious) |
| 3 | R005 | C013 (NATURE_TABLE) | All 36 natures present with correct raise/lower stats |
| 4 | R011 | C009, C029 | HP formula: Level + (HP_stat * 3) + 10. Verify in generatePokemonData and add-experience maxHp update |
| 5 | R009 | C033 (distributeStatPoints) | Total = Level + 10 stat points allocated |
| 6 | R010 | C033 | Base Relations enforcement in auto-generation. Verify decree-035: nature-adjusted ordering |
| 7 | R060 | C014 (EXPERIENCE_CHART) | All 100 level thresholds match PTU book. Level 1 = 0, Level 100 = 20,555 |
| 8 | R058 | C020 (calculateEncounterXp) | Enemy level sum, trainer 2x, significance multiply, player count divide, floor divisions |
| 9 | R002 | C006, C042 | MAX_EXPERIENCE cap at 20,555. Level 100 ceiling. |

### Tier 2: Core Workflows (verify behavior)

| Priority | Rule | Capability | Verify |
|----------|------|-----------|--------|
| 10 | R038 | C029, C030, C031 | Creation workflow: species lookup, nature apply, stat distribute, HP calc, move select, ability pick |
| 11 | R013 | C029 | Initial ability is random Basic Ability from species list |
| 12 | R018 | C002, C029 | Learnset contains level-up moves. Generation selects from learnset at or below level |
| 13 | R026 | C018, C021 | Level-up detection: stat points, moves, abilities, tutor points all reported per level |
| 14 | R028 | C018 | New moves from learnset reported at each level gained |
| 15 | R023 | C018, C042 | Tutor points awarded at level 5 and every 5 levels (10, 15, 20...). Verify in checkLevelUp and DB update |
| 16 | R059 | C045, C078 | XP distribution: GM allocates freely, over-allocation blocked, fainted Pokemon eligible |
| 17 | R022 | C029 | Initial tutor points = 1 at creation. Verify in generatePokemonData |

### Tier 3: Data Model and Enumerations (verify completeness)

| Priority | Rule | Capability | Verify |
|----------|------|-----------|--------|
| 18 | R003 | C001, C002 | All 6 base stats stored (HP, Atk, Def, SpAtk, SpDef, Speed) |
| 19 | R004 | C001, C002 | 18 types enumerated correctly |
| 20 | R061 | C002, C076 | Size classes: Small, Medium, Large, Huge, Gigantic present |
| 21 | R062 | C002, C076 | Weight classes 1-6 present |
| 22 | R063 | C002, C076 | Species capabilities populated from pokedex |
| 23 | R065 | C002, C077 | 6 skills: Athletics, Acrobatics, Combat, Stealth, Perception, Focus |
| 24 | R016 | C012 | Abilities JSON array has no artificial length limit |

### Tier 4: Partial Implementations (verify present portion, flag missing)

| Priority | Rule | Capability | Verify Present | Flag Missing |
|----------|------|-----------|---------------|-------------|
| 25 | R014 | C018, C073 | Level 20 milestone detected and displayed | No ability selection UI |
| 26 | R015 | C018, C073 | Level 40 milestone detected and displayed | No ability selection UI |
| 27 | R017 | C011, C029 | 6-move limit at generation | No validation on PUT |
| 28 | R027 | C018, C073 | +1 stat point per level reported | No allocation UI |
| 29 | R029 | C073, C082 | Evolution reminder/eligibility shown | No evolution detection |
| 30 | R001 | C005, C039 | ownerId relationship functional | No party size enforcement |
| 31 | R012 | C074 | Stats displayed for manual evasion calc | No auto-calculation |
| 32 | R024 | C008, C037 | tutorPoints field editable | No spend workflow |
| 33 | R035 | C037 | Stats editable via PUT | No vitamin tracking |
| 34 | R030 | C073 | Default is no evolution (manual process) | No explicit accept/refuse UI |
| 35 | R010 | C033 | Base Relations in auto-generation | No validation on manual edit |

### Tier 5: Supporting Capabilities (verify integration)

| Priority | Rule | Capability | Verify |
|----------|------|-----------|--------|
| 36 | -- | C028 (serializePokemon) | JSON fields parsed correctly (nature, abilities, moves, capabilities, skills) |
| 37 | -- | C027 (resolveNickname) | "Species N+1" auto-naming when no nickname provided |
| 38 | -- | C079 (character_update) | WebSocket broadcast on Pokemon updates reaches all clients |
| 39 | -- | C047, C048, C070, C071 | Player export/import preserves Pokemon data integrity |
| 40 | -- | C062-C065 | Sprite resolution chain (B2W2 Gen1-5, Showdown Gen6+, fallback) |

---

## Decree Compliance Notes

### decree-035: Nature-adjusted base stats for Base Relations ordering

**Status:** Requires auditor verification.

The auto-generation path (C033 distributeStatPoints) receives base stats that have already been nature-adjusted by applyNatureToBaseStats (C017). The auditor should verify that:
1. distributeStatPoints sorts by the nature-adjusted values (not raw species base stats)
2. Equal base stats after nature adjustment form tiers correctly
3. The ordering is preserved in the final stat allocation

The manual editing path (PUT /api/pokemon/:id) has NO Base Relations validation, so decree-035 cannot be violated or enforced there -- it is simply bypassed.

### decree-036: Stone evolutions learn new-form moves at or below current level

**Status:** Not applicable (Evolution System missing).

This decree will need to be implemented when the Evolution System subsystem is built. The formula `newFormMoves WHERE moveLevel <= currentLevel AND NOT IN oldFormLearnset` must be used for stone/trade/non-level-gated evolutions.
