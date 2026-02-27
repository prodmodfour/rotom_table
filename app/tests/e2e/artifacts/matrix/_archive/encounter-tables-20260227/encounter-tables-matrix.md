---
domain: encounter-tables
analyzed_at: 2026-02-26T14:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: encounter-tables-rules.md
capabilities_catalog: encounter-tables-capabilities.md
---

# Feature Completeness Matrix: Encounter Tables

## Important Context

The PTU 1.05 rulebook does **not** define formal encounter tables (no weighted probabilities, no density tiers, no random roll tables). PTU provides qualitative guidance: habitat lists, design principles, XP-budget encounter creation, and quick-stat guidelines. The app's encounter table system **operationalizes** this guidance into structured GM tooling. Rules are evaluated for consistency with PTU guidance rather than 1:1 mapping.

## Coverage Score

```
Implemented:              13
Implemented-Unreachable:   0
Partial:                   3
Missing:                   0
Subsystem-Missing:         0
Out of Scope:             11
---
Total:                    27
Effective Total:          16  (27 - 11 Out of Scope)

Coverage = (13 + 0.5*3) / 16 * 100
         = 14.5 / 16 * 100
         = 90.6%
```

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-------------|-------|
| R001 | Habitat Types Enumeration | enumeration | core | gm | **Implemented** | gm | — | C001 (EncounterTable model with name/description serves as habitat), C047 (TableEditor allows naming tables by habitat). App uses freeform names rather than a fixed 14-habitat enum, which is consistent with R010 (deviation allowance). |
| R002 | Species-to-Habitat Assignment | enumeration | core | gm | **Implemented** | gm | — | C002 (EncounterTableEntry links species to table via speciesId FK), C013 (Entry CRUD APIs), C021 (store entry management). Species assigned to tables manually by GM, consistent with PTU's species-habitat mapping. |
| R003 | Fun Game Progression | constraint | core | gm | **Implemented** | gm | — | C001/C002 (level range on table and per-entry override), C047 (TableEditor shows level ranges). GM controls progression by setting level ranges — weaker Pokemon on early-game tables, stronger on late-game tables. |
| R004 | Sensible Ecosystems | constraint | core | gm | **Implemented** | gm | — | C003/C004 (sub-habitat modifications allow regional variants), C014-C015 (modification APIs). GM curates species per habitat. Modification system supports ecosystem specialization (e.g., cave-deep vs cave-entrance). |
| R005 | Experience Calculation from Encounter | formula | core | gm | **Implemented** | gm | — | C033 (calculateEncounterXp: effectiveLevels * significanceMultiplier / playerCount), C031 (calculateEffectiveEnemyLevels: trainer levels doubled). Full PTU XP formula implemented. |
| R006 | Encounter Level Budget Formula | formula | core | gm | **Implemented** | gm | — | C030 (calculateEncounterBudget: avgPokemonLevel * 2 * playerCount), C032 (analyzeEncounterBudget with difficulty bands), C045 (BudgetIndicator visual display). |
| R007 | Energy Pyramid / Rarity Distribution | modifier | core | gm | **Implemented** | gm | — | C002 (weight field on entries). Weights encode relative rarity — common species get higher weights, apex predators get lower weights. GM-controlled, consistent with PTU's qualitative guidance. |
| R008 | Significance Multiplier | enumeration | core | gm | **Implemented** | gm | — | C034 (SIGNIFICANCE_PRESETS: insignificant x1-1.5, everyday x2-3, significant x3-4, climactic x4-5, legendary x5), C046 (SignificancePanel with preset selector + custom multiplier). Matches PTU scale. |
| R009 | Difficulty Adjustment Modifier | modifier | situational | gm | **Implemented** | gm | — | C046 (SignificancePanel includes difficulty adjustment slider), C035 (DIFFICULTY_THRESHOLDS for budget ratio assessment). Difficulty adjusts independently of narrative significance. |
| R010 | Habitat Deviation Allowance | modifier | situational | gm | **Implemented** | gm | — | C003/C004 (modifications add species not in parent table — speciesName string, not FK), C015 (add modification entry API). Freeform table names + modification system supports deviation. |
| R011 | Pseudo-Legendary Placement | constraint | core | gm | **Out of Scope** | — | — | Design guidance for GM world-building. App provides the tooling (level ranges, weighted entries) but does not enforce placement constraints. GM responsibility. |
| R012 | Species Diversity per Encounter | constraint | core | gm | **Partial** | gm | P3 | **Present:** C016 (generate API uses diversity-enforced weighted random selection). **Missing:** No explicit 2-3 species guideline enforcement or warning. Generation enforces some diversity but doesn't warn if all generated Pokemon are the same species. |
| R013 | Niche Competition and Adaptation | modifier | situational | gm | **Out of Scope** | — | — | Qualitative ecosystem design guidance. App provides modification system for variants but doesn't enforce ecological competition rules. |
| R014 | Social Hierarchy in Encounters | interaction | situational | gm | **Out of Scope** | — | — | Qualitative encounter design guidance (pack leaders, hive queens). GM applies this when building tables. Not mechanizable. |
| R015 | Special Habitat Requirements | modifier | situational | gm | **Out of Scope** | — | — | Qualitative guidance about species-specific environmental needs (Electric near industry, Ghosts in ruins). GM applies when populating tables. |
| R016 | Encounter Creation Workflow | workflow | core | gm | **Implemented** | gm | — | Chain 4 (Pokemon Generation) + Chain 6 (Budget Analysis) + Chain 7 (Significance & XP). Full workflow: create table (C011) → add species (C013) → set level range/density → generate (C016) → assess budget (C045) → set significance (C046) → calculate XP (C033). |
| R017 | Level Distribution Across Enemies | workflow | core | gm | **Partial** | gm | P2 | **Present:** C016 (generation respects level range), C032 (budget analysis shows budget ratio and difficulty). **Missing:** No distribution guidance within the generated set. All generated Pokemon use the same level range — no support for "leader + grunts" split (e.g., one L40 + four L20). |
| R018 | Significance-Scaling Movesets | interaction | situational | gm | **Out of Scope** | — | — | Qualitative guidance about customizing movesets for important encounters. Generated Pokemon use standard stats; moveset customization is done in the encounter/combat domain post-generation. |
| R019 | Quick-Stat Workflow | workflow | situational | gm | **Out of Scope** | — | — | Pokemon stat generation is handled by pokemon-generator.service (pokemon-lifecycle domain), not encounter tables. Cross-domain reference. |
| R020 | Action Economy Warning | constraint | core | gm | **Partial** | gm | P2 | **Present:** C032 (analyzeEncounterBudget assesses difficulty as trivial/easy/balanced/hard/deadly), C045 (BudgetIndicator displays difficulty visually). **Missing:** No specific action economy warning about swarm count. Budget analysis considers total levels but not count of enemies. A swarm of 20 low-level enemies shows a low budget ratio but may overwhelm via action economy. |
| R021 | Tax vs Threat Encounter Design | interaction | situational | gm | **Out of Scope** | — | — | Qualitative encounter design guidance. GM applies this philosophy when setting significance and choosing species. Not mechanizable. |
| R022 | Swarm Multiplier Scale | formula | edge-case | gm | **Out of Scope** | — | — | Swarm mechanics are a combat-resolution mechanic, not an encounter table feature. Would belong in the combat domain if implemented. |
| R023 | Swarm HP and Actions | formula | edge-case | gm | **Out of Scope** | — | — | Swarm combat mechanics — combat domain. |
| R024 | Swarm Action Economy | workflow | edge-case | gm | **Out of Scope** | — | — | Swarm combat mechanics — combat domain. |
| R025 | Environmental Encounter Modifiers | interaction | situational | gm | **Out of Scope** | — | — | Environmental modifiers (traps, visibility, terrain) are scene/VTT domain features, not encounter table features. |
| R026 | Type Shift and Variant Pokemon | interaction | edge-case | gm | **Out of Scope** | — | — | Type shifts and variants are pokemon-lifecycle domain features. Encounter tables can include any species; variant handling is done post-generation. |
| R027 | Giant Pokemon Encounter Modifier | modifier | edge-case | gm | **Out of Scope** | — | — | Giant Pokemon variants are a pokemon-lifecycle / combat domain feature. Beyond encounter table scope. |

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|-------------|-------------|-------------------|---------|---------|-------------|
| gm | 27 | 13 | 0 | 3 | 0 | 11 |
| player | 0 | 0 | 0 | 0 | 0 | 0 |

**Actor reachability:**
- **gm** rules: All 16 in-scope rules are accessible from GM view. No actor mismatch issues.
- **player** rules: None — encounter tables are inherently a GM preparation tool in PTU. No player interaction expected.

## Subsystem Gaps

No subsystem-level gaps identified. All Missing Subsystems from the capability mapper are either:
- **MS-1 (No player browsing):** Correct — PTU encounter tables are GM tools. Not a gap.
- **MS-2 (No post-generation tracking):** Quality-of-life feature, not a PTU rule gap.
- **MS-3 (No budget-aware generation):** See R017 partial classification.

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P2 | 2 | R017 (partial — no level distribution guidance), R020 (partial — no action economy warning) |
| P3 | 1 | R012 (partial — no diversity enforcement feedback) |

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness.

### Tier 1: Core Formulas (verify correctness first)
1. **R005** — Experience Calculation (C033) — verify effectiveLevels * significanceMultiplier / playerCount, trainer levels doubled
2. **R006** — Encounter Level Budget (C030) — verify avgPokemonLevel * 2 * playerCount
3. **R008** — Significance Multiplier (C034) — verify preset scale matches PTU (x1-x5+)
4. **R009** — Difficulty Adjustment (C035) — verify threshold bands are reasonable

### Tier 2: Core Data Model (verify structure)
5. **R001** — Habitat Types (C001) — verify table model supports habitat-style naming
6. **R002** — Species Assignment (C002) — verify entry FK to SpeciesData, weight field
7. **R003** — Level Range (C001, C002) — verify table-level and entry-level level range overrides
8. **R007** — Weight as Rarity (C002) — verify weight field drives generation probability
9. **R010** — Deviation Allowance (C003, C004) — verify modifications can add new species not in parent

### Tier 3: Core Workflows (verify flow)
10. **R016** — Encounter Creation Workflow — verify full chain: create table → add entries → generate → budget analysis → significance → XP
11. **R004** — Sensible Ecosystems (C003) — verify sub-habitat modification system works correctly

### Tier 4: Partial Items (verify present portion)
12. **R012** — Species Diversity (C016) — verify diversity-enforced selection in generation
13. **R017** — Level Distribution — verify level range used in generation, check for leader/grunt support
14. **R020** — Action Economy (C032) — verify budget analysis difficulty bands, check for count-based warnings
