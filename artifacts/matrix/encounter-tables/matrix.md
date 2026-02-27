---
domain: encounter-tables
type: matrix
total_rules: 27
analyzed_at: 2026-02-28T03:00:00Z
analyzed_by: coverage-analyzer
---

# Coverage Matrix: encounter-tables

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

Coverage = (14 + 0.5*3) / 20 * 100 = 77.5%
```

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R001 | Habitat Types Enumeration | enumeration | core | gm | Implemented | gm | C001 (table name/description captures habitat), C047 (TableEditor) | — | Tables represent habitats; GM names them after habitat types. App does not enforce canonical list but provides freeform habitat labeling. |
| R002 | Species-to-Habitat Assignment | enumeration | core | gm | Implemented | gm | C002 (EncounterTableEntry links species to table via speciesId), C013 (add entry API), C021 (store entry actions), C047 (TableEditor) | — | Species assigned to tables via entries |
| R003 | Fun Game Progression Principle | constraint | core | gm | Implemented | gm | C001 (levelMin/levelMax per table), C002 (per-entry level override), C032 (difficulty analysis) | — | Level ranges + difficulty assessment support progression. Qualitative GM guidance. |
| R004 | Sensible Ecosystems Principle | constraint | core | gm | Implemented | gm | C001 (habitat tables), C003 (sub-habitat modifications), C014 (modification API) | — | Sub-habitat system lets GM model ecosystem variations. Qualitative GM guidance. |
| R005 | Experience Calculation from Encounter | formula | core | gm | Implemented | gm | C033 (calculateEncounterXp), C031 (calculateEffectiveEnemyLevels — trainers count double), C034 (SIGNIFICANCE_PRESETS) | — | Full XP formula: effective levels * significance / players |
| R006 | Encounter Level Budget Formula | formula | core | gm | Implemented | gm | C030 (calculateEncounterBudget), C032 (analyzeEncounterBudget), C040 (useEncounterBudget composable), C045 (BudgetIndicator) | — | avgPokemonLevel * 2 * playerCount with visual difficulty indicator |
| R007 | Energy Pyramid / Rarity Distribution | modifier | core | gm | Implemented | gm | C002 (weight field per entry controls encounter probability), C023 (getResolvedEntries), C024 (getTotalWeight) | — | Weighted entries model rarity. Higher weight = more common (herbivore). Lower weight = rarer (predator). |
| R008 | Significance Multiplier | enumeration | core | gm | Implemented | gm | C034 (SIGNIFICANCE_PRESETS: 5 tiers from insignificant x1 to legendary x5), C046 (SignificancePanel), C033 (calculateEncounterXp) | — | 5 preset tiers with custom multiplier support |
| R009 | Difficulty Adjustment Modifier | modifier | situational | gm | Implemented | gm | C032 (analyzeEncounterBudget — difficulty bands: trivial/easy/balanced/hard/deadly), C035 (DIFFICULTY_THRESHOLDS), C045 (BudgetIndicator) | — | Budget ratio assessment supplements significance for difficulty |
| R010 | Habitat Deviation Allowance | modifier | situational | gm | Implemented | gm | C004 (ModificationEntry uses speciesName string — can add any species), C003 (sub-habitat modifications) | — | Freeform species names in modifications allow habitat deviation |
| R011 | Pseudo-Legendary Placement Constraint | constraint | core | gm | Partial | gm | C001, C002, C023 | P3 | **Present:** GM can control which species appear via weighted entries. **Missing:** No explicit pseudo-legendary flag or warning when powerful species placed in early-game tables. |
| R012 | Species Diversity per Encounter | constraint | core | gm | Implemented | gm | C016 (generate API uses diversity-enforced weighted random selection) | — | Diversity enforcement in generation algorithm |
| R013 | Niche Competition and Adaptation | modifier | situational | gm | Out of Scope | — | — | — | Qualitative world-building guidance. Not automatable. |
| R014 | Social Hierarchy in Encounters | interaction | situational | gm | Out of Scope | — | — | — | Qualitative encounter narrative design. Not automatable. |
| R015 | Special Habitat Requirements | modifier | situational | gm | Out of Scope | — | — | — | Qualitative world-building guidance (Electric types near industrial areas, etc). |
| R016 | Encounter Creation Workflow | workflow | core | gm | Implemented | gm | C047 (TableEditor), C025 (generateFromTable), C030-C032 (budget analysis), C016 (generate API) | — | Full workflow: build table -> set levels -> generate -> assess budget |
| R017 | Level Distribution Across Enemies | workflow | core | gm | Partial | gm | C002 (per-entry level range override), C016 (generation with level ranges) | P2 | **Present:** Level ranges per entry allow distribution control. **Missing:** No auto-distribution across budget. GM must manually design level splits. |
| R018 | Significance-Scaling Movesets | interaction | situational | gm | Partial | gm | C034 (significance presets defined) | P2 | **Present:** Significance tiers exist. **Missing:** No automatic moveset complexity scaling. Generated Pokemon use standard movesets regardless of significance. |
| R019 | Quick-Stat Workflow | workflow | situational | gm | Implemented | gm | C016 (generate API), pokemon-generator.service (generatePokemonData with stat distribution) | — | Pokemon generator service handles stat distribution for wild Pokemon |
| R020 | Action Economy Warning | constraint | core | gm | Implemented | gm | C032 (analyzeEncounterBudget returns difficulty assessment), C045 (BudgetIndicator shows deadly when overwhelmed) | — | Budget analysis flags when too many enemies (deadly threshold) |
| R021 | Tax vs Threat Encounter Design | interaction | situational | gm | Out of Scope | — | — | — | Qualitative design philosophy. Not automatable. |
| R022 | Swarm Multiplier Scale | formula | edge-case | gm | Missing | — | — | P3 | No swarm entity system. Individual combatants only. |
| R023 | Swarm HP and Actions | formula | edge-case | gm | Missing | — | — | P3 | No swarm HP bar or multi-action system. |
| R024 | Swarm Action Economy | workflow | edge-case | gm | Missing | — | — | P3 | No swarm-specific turn structure. |
| R025 | Environmental Encounter Modifiers | interaction | situational | gm | Out of Scope | — | — | — | Qualitative environment design guidance. Terrain painter in VTT handles implementation. |
| R026 | Type Shift and Variant Pokemon | interaction | edge-case | gm | Out of Scope | — | — | — | Type shifts are manual customization. App stores types but does not provide type-shift tooling. |
| R027 | Giant Pokemon Encounter Modifier | modifier | edge-case | gm | Out of Scope | — | — | — | Giant Pokemon are manual GM creations. Not a systematic mechanic. |

## Actor Accessibility Summary

| Actor | Total Rules | Reachable | Unreachable | Out of Scope |
|-------|------------|-----------|-------------|-------------|
| gm | 27 | 17 | 0 | 7 |
| player | 0 | 0 | 0 | 0 |

Note: All encounter-tables rules are GM-only. This is a GM preparation tool domain. The Capability Mapper confirmed all capabilities are gm-only access, which is correct for PTU encounter design.

## Subsystem Gaps

### SG-1: No Swarm Entity System
- **Missing subsystem:** Swarm multiplier, multi-HP-bar, swarm action economy
- **Affected rules:** R022, R023, R024 (3 rules)
- **Priority:** P3 (edge-case)
- **Suggested ticket:** "feat: swarm encounter entity type" -- single combatant representing a swarm with multiplier-based HP bars and multi-action turns. Low priority since swarms are uncommon encounters.

## Gap Priorities Summary

| Priority | Count | Rules |
|----------|-------|-------|
| P2 | 2 | R017, R018 |
| P3 | 4 | R011, R022, R023, R024 |

## Auditor Queue

### Tier 1: Core Formulas
1. **R005** — XP Calculation (C033, C031) — verify effective levels * significance / players, trainers count double
2. **R006** — Level Budget (C030, C032) — verify avgPokemonLevel * 2 * playerCount
3. **R009** — Difficulty thresholds (C035) — verify trivial<0.4, easy 0.4-0.7, balanced 0.7-1.3, hard 1.3-1.8, deadly >1.8

### Tier 2: Core Enumerations
4. **R008** — Significance Presets (C034) — verify 5 tiers: x1-1.5, x2-3, x3-4, x4-5, x5
5. **R007** — Weighted entries (C002, C023) — verify probability calculation from weights

### Tier 3: Core Workflows
6. **R016** — Encounter Creation (C047 -> C025 -> C016 -> generation service) — verify full chain
7. **R012** — Species Diversity (C016) — verify diversity enforcement in generation
8. **R019** — Quick-Stat (C016 -> pokemon-generator.service) — verify stat distribution

### Tier 4: Constraints
9. **R003** — Level ranges (C001, C002) — verify table-level and entry-level overrides cascade
10. **R010** — Habitat deviation (C004, C015) — verify freeform species in modifications
11. **R020** — Action economy (C032, C045) — verify deadly threshold warning

### Tier 5: Partial Items
12. **R011** — Pseudo-legendary placement (C002) — verify weight system usability
13. **R017** — Level distribution (C002 level overrides) — verify per-entry level ranges
14. **R018** — Significance-scaling movesets (C034) — verify significance stored on encounters
