---
domain: encounter-tables
type: matrix
total_rules: 27
total_capabilities: 31
analyzed_at: 2026-03-05T12:00:00Z
analyzed_by: coverage-analyzer
session: 120
supersedes: encounter-tables/matrix.md (session 59)
relevant_decrees:
  - decree-030
  - decree-031
  - decree-048
---

# Coverage Matrix: encounter-tables (Updated)

> Re-analyzed with 31 fresh capabilities from session 120 capability re-mapping.
> Incorporates: density separation, significance tiers, encounter budgets, significance presets, equipment grantedCapabilities.
> Decree compliance checked: decree-030 (cap presets at x5), decree-031 (replace bogus budget citation), decree-048 (dark cave RAW penalties).

## Coverage Score

```
Implemented:             14
Implemented-Unreachable:  0
Partial:                  3
Missing:                  3
Subsystem-Missing:        0
Out of Scope:             7

Total:                   27
Scoreable (Total - OoS): 20

Coverage = (14 + 0.5*0 + 0.5*3) / 20 * 100 = 77.5%
```

**Breakdown:**
- 14 Implemented = 14.0
- 0 Implemented-Unreachable = 0.0
- 3 Partial = 1.5
- 3 Missing = 0.0
- 0 Subsystem-Missing = 0.0
- 7 Out of Scope (excluded from denominator)
- Score: 15.5 / 20 = **77.5%**

**Change from previous matrix (session 59):** Score unchanged at 77.5%. New capabilities (C030-C048) confirmed existing classifications. Decree compliance issues identified below.

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R001 | Habitat Types Enumeration | enumeration | core | gm | Implemented | gm | C001 (table name/description captures habitat), C047 (TableEditor UI) | -- | Tables represent habitats; GM names them after habitat types. 14 canonical habitats are not enforced as a fixed enum but are implicitly supported through freeform naming. Consistent with PTU guidance ("feel free to deviate"). |
| R002 | Species-to-Habitat Assignment | enumeration | core | gm | Implemented | gm | C002 (EncounterTableEntry links species via speciesId+weight), C013 (add entry API), C021 (store entry actions), C047 (TableEditor), C048 (EntryRow) | -- | Species assigned to tables via weighted entries. Per-entry level overrides (C002) add granularity. |
| R003 | Fun Game Progression Principle | constraint | core | gm | Implemented | gm | C001 (levelMin/levelMax per table), C002 (per-entry level override), C032 (difficulty analysis), C035 (DIFFICULTY_THRESHOLDS), C045 (BudgetIndicator) | -- | Level ranges + budget difficulty bands support progression design. New BudgetIndicator (C045) gives visual feedback. Qualitative GM guidance operationalized through structured tooling. |
| R004 | Sensible Ecosystems Principle | constraint | core | gm | Implemented | gm | C001 (habitat tables), C003 (sub-habitat modifications with density multiplier), C014 (modification CRUD API), C022 (store mod actions), C048 (ModificationCard) | -- | Sub-habitat system models ecosystem variations. Density multiplier (C003) supports ecosystem density modeling. Qualitative guidance operationalized. |
| R005 | Experience Calculation from Encounter | formula | core | gm | Implemented | gm | C033 (calculateEncounterXp: effectiveLevels * significance / players), C031 (calculateEffectiveEnemyLevels: trainers count double), C034 (SIGNIFICANCE_PRESETS), C040 (useEncounterBudget re-exports), C046 (SignificancePanel displays XP) | -- | Full PTU XP formula implemented. Trainer doubling confirmed in C031. Significance multiplier integrated via C033+C034. |
| R006 | Encounter Level Budget Formula | formula | core | gm | Implemented | gm | C030 (calculateEncounterBudget: avgPokemonLevel * 2 * playerCount), C032 (analyzeEncounterBudget: budget ratio + difficulty), C040 (useEncounterBudget composable), C045 (BudgetIndicator visual) | -- | Formula matches PTU R006. **Decree-031 note:** C030 still cites "PTU Core p. 473" which decree-031 identified as bogus. The formula itself is correct per PTU Core Chapter 11 "Basic Encounter Creation Guidelines" but the page citation must be corrected. Auditor should verify citation has been fixed. |
| R007 | Energy Pyramid / Rarity Distribution | modifier | core | gm | Implemented | gm | C002 (weight field per entry), C023 (getResolvedEntries computes final pool), C024 (getTotalWeight for probability %), C048 (EntryRow shows weight) | -- | Weight system models rarity. Higher weight = more common (producers/herbivores). Lower weight = rarer (predators). Probability display via C024. |
| R008 | Significance Multiplier | enumeration | core | gm | Implemented | gm | C034 (SIGNIFICANCE_PRESETS: 5 tiers capped at x5), C046 (SignificancePanel: preset selector + custom multiplier), C033 (calculateEncounterXp uses multiplier) | -- | **Decree-030 compliant:** 5 tiers from insignificant (x1-1.5) to legendary (x5). Previous climactic(x6) and legendary(x8) tiers removed per decree. Custom manual entry still available for GM house-ruling. |
| R009 | Difficulty Adjustment Modifier | modifier | situational | gm | Implemented | gm | C032 (analyzeEncounterBudget: budgetRatio difficulty bands), C035 (DIFFICULTY_THRESHOLDS: trivial/easy/balanced/hard/deadly), C045 (BudgetIndicator: color-coded difficulty display), C046 (SignificancePanel: difficulty adjustment slider) | -- | Budget ratio assessment (trivial <0.4 through deadly >1.8) provides difficulty feedback independent of significance tier. SignificancePanel includes difficulty adjustment slider. |
| R010 | Habitat Deviation Allowance | modifier | situational | gm | Implemented | gm | C004 (ModificationEntry uses speciesName string, not FK -- can add any species), C003 (sub-habitat modifications), C015 (add modification entry API) | -- | Freeform species names in modifications explicitly support habitat deviation. GM can add species not in parent table. |
| R011 | Pseudo-Legendary Placement Constraint | constraint | core | gm | Partial | gm | C001 (table level ranges), C002 (per-entry weight+level), C023 (resolved entries) | P3 | **Present:** GM controls species placement via weighted entries and level ranges. Rare species can be given low weights and high level ranges. **Missing:** No pseudo-legendary flag, no warning when powerful species are placed in low-level tables, no BST-based validation. GM must exercise judgment without automated guardrails. |
| R012 | Species Diversity per Encounter | constraint | core | gm | Implemented | gm | C016 (generate API: "diversity-enforced weighted random selection"), C025 (store generateFromTable) | -- | Generation algorithm enforces species diversity (2-3 species per encounter, matching PTU guidance). |
| R013 | Niche Competition and Adaptation | modifier | situational | gm | Out of Scope | -- | -- | -- | Qualitative world-building guidance about ecosystem niches and competitive exclusion. Not automatable -- requires narrative design judgment. App provides the structural tools (tables, weights, sub-habitats) but this is pure GM creativity. |
| R014 | Social Hierarchy in Encounters | interaction | situational | gm | Out of Scope | -- | -- | -- | Qualitative encounter narrative design. Pack leaders, hive queens, flock alphas are GM storytelling decisions. The level override system (C002) can model a "leader" being higher level, but the concept itself is narrative, not mechanical. |
| R015 | Special Habitat Requirements | modifier | situational | gm | Out of Scope | -- | -- | -- | Qualitative guidance about species-specific environmental needs (Electric types near industry, Ghosts in abandoned areas). Sub-habitat modifications (C003/C014) provide the structural mechanism but the species-environment knowledge is GM domain expertise. |
| R016 | Encounter Creation Workflow | workflow | core | gm | Implemented | gm | C047 (TableEditor: full editing UI), C025 (generateFromTable), C016 (generate API), C030-C032 (budget analysis chain), C045 (BudgetIndicator), C046 (SignificancePanel) | -- | Complete workflow chain: Create table (C011/C020) -> Add species entries (C013/C021) -> Set level ranges (C001/C002) -> Set density (C001) -> Generate encounter (C016/C025) -> Assess budget (C032/C045) -> Set significance (C046). All steps GM-accessible. |
| R017 | Level Distribution Across Enemies | workflow | core | gm | Partial | gm | C002 (per-entry level range override), C016 (generation within level ranges), C032 (budget analysis post-generation) | P2 | **Present:** Per-entry level range overrides allow GM to set different level bands for different species in the same table. Budget analysis (C032) shows whether distribution is balanced. **Missing:** No automatic level budget distribution tool. GM must manually calculate how to split levels across enemies. No "distribute 120 levels across 6 Pokemon" assistant. MS-3 in capability mapper confirms: table generation is count-based, not budget-aware. |
| R018 | Significance-Scaling Movesets | interaction | situational | gm | Partial | gm | C034 (SIGNIFICANCE_PRESETS defined with descriptions), C046 (SignificancePanel) | P2 | **Present:** Significance tiers exist and are exposed in UI. Descriptions hint at moveset complexity expectations (e.g., "significant" tier description mentions strategic moves). **Missing:** No automatic moveset scaling. Generated Pokemon get standard level-up movesets regardless of significance tier. High-significance encounters should feature Egg/TM/Tutor moves per PTU, but this is not automated. |
| R019 | Quick-Stat Workflow | workflow | situational | gm | Implemented | gm | C016 (generate API -> encounter-generation.service), C025 (store generate action) | -- | Generation service handles stat distribution for wild Pokemon, implementing the quick-stat pattern. Species selection from table -> stat block generation is automated. |
| R020 | Action Economy Warning | constraint | core | gm | Implemented | gm | C032 (analyzeEncounterBudget: "deadly" threshold at ratio >1.8), C035 (DIFFICULTY_THRESHOLDS), C045 (BudgetIndicator: red "Deadly" label when overwhelmed) | -- | Deadly difficulty flag serves as action economy warning. Many low-level enemies create high total levels relative to budget, triggering deadly assessment. Visual BudgetIndicator makes this immediately apparent. |
| R021 | Tax vs Threat Encounter Design | interaction | situational | gm | Out of Scope | -- | -- | -- | Qualitative encounter design philosophy. Tax (resource drain) vs Threat (defeat risk) is a narrative design choice. Budget analysis (C032) provides difficulty assessment that partially informs this, but the tax/threat distinction is pure GM judgment. |
| R022 | Swarm Multiplier Scale | formula | edge-case | gm | Missing | -- | -- | P3 | No swarm entity system. The 5-tier swarm multiplier scale (1 = <12, 2 = 15-25, 3 = 25-40, 4 = 40-60, 5 = 60+) has no data model or UI. Individual combatants only. |
| R023 | Swarm HP and Actions | formula | edge-case | gm | Missing | -- | -- | P3 | No swarm HP bar system. The mechanic of multiple HP bars (one per swarm multiplier) with multiplier decreasing as bars are depleted has no implementation. |
| R024 | Swarm Action Economy | workflow | edge-case | gm | Missing | -- | -- | P3 | No swarm-specific turn structure. Swarm Points, multi-action turns, frequency-to-SP-cost mapping, accuracy bonuses, damage resistance stepping, and AoE effectiveness stepping are all absent. |
| R025 | Environmental Encounter Modifiers | interaction | situational | gm | Out of Scope | -- | -- | -- | Environmental modifiers (dark caves, ice, hazards) are cross-domain with VTT/combat. **Decree-048 note:** Dark cave blindness penalties are now decreed to use RAW flat values (-6 Blindness, -10 Total Blindness) with two separate presets. This implementation lives in the combat/VTT domain (environmentPresets.ts, useMoveCalculation.ts), not encounter-tables. Encounter-tables domain provides table structure; environmental effects apply during combat. |
| R026 | Type Shift and Variant Pokemon | interaction | edge-case | gm | Out of Scope | -- | -- | -- | Type shifts and variant Pokemon are manual GM customizations applied during encounter design. The app stores types on Pokemon data but does not provide a type-shift tooling workflow within encounter-tables. Cross-domain with pokemon-lifecycle. |
| R027 | Giant Pokemon Encounter Modifier | modifier | edge-case | gm | Out of Scope | -- | -- | -- | Giant Pokemon (boosted stats, modified moves/abilities, size changes) are manual GM creations. Not a systematic mechanic with defined formulas -- PTU provides qualitative suggestions only. |

## Actor Accessibility Summary

| Actor | Total Rules | Reachable | Unreachable | Partial (reachable) | Missing | Out of Scope |
|-------|------------|-----------|-------------|---------------------|---------|-------------|
| gm | 27 | 14 | 0 | 3 | 3 | 7 |
| player | 0 | 0 | 0 | 0 | 0 | 0 |
| system | 0 | 0 | 0 | 0 | 0 | 0 |

**Actor Analysis:** All 27 encounter-tables rules target `actor: gm`. This is correct per PTU -- encounter tables are a GM preparation tool. All 31 capabilities are `accessible_from: gm`. No actor mismatch exists. The Capability Mapper's MS-1 (no player-facing encounter table browsing) is correctly identified as working-as-intended for PTU, since players do not interact with encounter tables.

## Subsystem Gaps

### SG-1: No Swarm Entity System
- **Missing subsystem:** Swarm multiplier, multi-HP-bar, swarm action economy
- **Affected rules:** R022, R023, R024 (3 rules)
- **Priority:** P3 (edge-case scope, all 3 rules)
- **Suggested feature ticket:** `feat: swarm encounter entity type` -- Single combatant data model representing a swarm with: swarm multiplier field (1-5), HP bars equal to multiplier, multi-action turn with SP costs, accuracy/damage/AoE modifiers per PTU swarm rules. Low priority: swarms are uncommon encounters, and GMs can work around by running multiple individual combatants.

### SG-2: No Budget-Aware Table Generation (Capability Mapper MS-3)
- **Missing subsystem:** Integration between encounter table generation and level budget system
- **Affected rules:** R016 (partial impact), R017 (primary impact)
- **Priority:** P2
- **Description:** Table generation (C016) generates by count, not by budget. The budget system (C030-C032, C045) exists separately. GM must generate Pokemon, then manually check if they fit the budget. No "generate encounter within budget X" workflow exists.
- **Note:** Not classified as Subsystem-Missing because the budget system and generation system both exist -- they are just not integrated. This is captured in R017's Partial classification.

### SG-3: No Wild Pokemon Generation History (Capability Mapper MS-2)
- **Missing subsystem:** Post-generation tracking/history for wild Pokemon
- **Affected rules:** None directly (tooling gap, not a PTU rule gap)
- **Priority:** P3
- **Description:** Generated wild Pokemon are ephemeral. No history of what was previously generated from a habitat. This is a UX convenience gap, not a PTU compliance gap.

## Decree Compliance

### decree-030: Cap significance presets at x5
- **Status:** COMPLIANT
- **Evidence:** C034 (SIGNIFICANCE_PRESETS) shows 5 tiers capping at x5 (legendary). Previous climactic(x6) and legendary(x8) tiers have been removed. Custom manual entry remains available.
- **Auditor action:** Verify SIGNIFICANCE_PRESETS in `app/utils/encounterBudget.ts` contains no tier exceeding x5.

### decree-031: Replace bogus encounter budget formula citation
- **Status:** PARTIALLY COMPLIANT -- citation may be stale
- **Evidence:** C030 (calculateEncounterBudget) still references "PTU Core p. 473" in its `game_concept` field. Decree-031 identified this page number as nonexistent in PTU 1.05. The formula itself (avgPokemonLevel * 2 * playerCount) IS from PTU Core Chapter 11 "Basic Encounter Creation Guidelines" and is correct. Only the citation is bogus.
- **Auditor action:** Check `app/utils/encounterBudget.ts` for any remaining "p. 473" or "p.473" references. Should cite "Chapter 11: Basic Encounter Creation Guidelines" instead.

### decree-048: Dark cave RAW blindness penalties
- **Status:** CROSS-DOMAIN -- not in encounter-tables scope
- **Evidence:** Decree-048 affects `app/constants/environmentPresets.ts` and `app/composables/useMoveCalculation.ts`, which belong to the combat/VTT domain. Encounter-tables domain provides table structure; environmental combat effects are separate. R025 (Environmental Encounter Modifiers) is classified Out of Scope for this domain.
- **Auditor action:** None for encounter-tables domain. Should be checked in combat or VTT-grid domain matrices.

## Gap Priorities Summary

| Priority | Count | Rules | Classification |
|----------|-------|-------|----------------|
| P2 | 2 | R017 (Level Distribution), R018 (Significance-Scaling Movesets) | Partial |
| P3 | 4 | R011 (Pseudo-Legendary Placement), R022 (Swarm Multiplier), R023 (Swarm HP), R024 (Swarm Actions) | Partial (1), Missing (3) |

## Auditor Queue

### Tier 1: Core Formulas (verify correctness)
1. **R005** -- XP Calculation: Verify C033 (`calculateEncounterXp`) implements `effectiveLevels * significanceMultiplier / playerCount`. Verify C031 (`calculateEffectiveEnemyLevels`) doubles trainer levels. Cross-check against PTU Core p.460.
2. **R006** -- Level Budget: Verify C030 (`calculateEncounterBudget`) implements `avgPokemonLevel * 2 * playerCount`. **Critical:** Check for bogus "p. 473" citation per decree-031 -- should reference Chapter 11 "Basic Encounter Creation Guidelines".
3. **R009** -- Difficulty Thresholds: Verify C035 (`DIFFICULTY_THRESHOLDS`) values: trivial <0.4, easy 0.4-0.7, balanced 0.7-1.3, hard 1.3-1.8, deadly >1.8. Verify C032 uses these correctly.

### Tier 2: Core Enumerations (verify completeness and decree compliance)
4. **R008** -- Significance Presets: Verify C034 (`SIGNIFICANCE_PRESETS`) has exactly 5 tiers capping at x5. **Decree-030 critical:** No preset may exceed x5. Verify custom manual entry still works for GM house-ruling.
5. **R007** -- Weighted Entries: Verify C002 weight field, C023 `getResolvedEntries` pool resolution, C024 `getTotalWeight` probability calculation. Verify modification overlay correctly applies weight overrides and removals.

### Tier 3: Core Workflows (verify chain accessibility)
6. **R016** -- Encounter Creation Workflow: Walk full chain: C047 (TableEditor) -> C020 (store CRUD) -> C011 (create API) -> C013 (add entries) -> C016 (generate) -> C032 (budget analysis). Verify every link is GM-accessible.
7. **R012** -- Species Diversity: Verify C016 generation endpoint enforces species diversity (2-3 species, not mono-species output).
8. **R019** -- Quick-Stat: Verify C016 -> encounter-generation.service -> pokemon-generator.service stat distribution produces valid stat blocks.

### Tier 4: Constraints and Supporting Capabilities (verify behavior)
9. **R003** -- Level Ranges: Verify C001 table-level `levelMin/levelMax`, C002 per-entry overrides, cascade order (entry > modification > table default).
10. **R001** -- Habitat Tables: Verify C001 model structure, C047 TableEditor allows freeform naming.
11. **R010** -- Habitat Deviation: Verify C004 `ModificationEntry` accepts arbitrary `speciesName` strings (not FK-constrained).
12. **R020** -- Action Economy Warning: Verify C032 "deadly" classification triggers at ratio >1.8 and C045 displays it prominently.

### Tier 5: Partial Items (verify present portion, document missing portion)
13. **R011** -- Pseudo-Legendary Placement: Verify weight system is usable for restricting rare species. Document absence of BST-based warnings.
14. **R017** -- Level Distribution: Verify per-entry level range overrides in C002. Document absence of budget-distribution automation (MS-3).
15. **R018** -- Significance-Scaling Movesets: Verify C034 preset descriptions and C046 UI exposure. Document absence of automatic moveset complexity scaling.

### Tier 6: Data and UI Components (verify completeness)
16. **R002** -- Species-to-Habitat: Verify C013 entry creation, C021 store actions, C048 EntryRow display.
17. **R004** -- Ecosystems: Verify C003/C014 modification system, C048 ModificationCard display.
18. **C017** -- Export/Import: Verify round-trip fidelity (export -> import produces identical table).
19. **C027** -- Filter/Search: Verify table filtering by name/description and sort options.
