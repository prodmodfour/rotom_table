---
domain: pokemon-lifecycle
analyzed_at: 2026-02-26T17:30:00Z
analyzed_by: coverage-analyzer
rules_catalog: pokemon-lifecycle-rules.md
capabilities_catalog: pokemon-lifecycle-capabilities.md (re-mapped 2026-02-26)
total_rules: 68
---

# Feature Completeness Matrix: Pokemon Lifecycle

## Coverage Score

```
Implemented:              35
Implemented-Unreachable:   0
Partial:                   8
Missing:                   9
Subsystem-Missing:         2
Out of Scope:             14
Coverage = (35 + 0.5*8 + 0.5*0) / (68 - 14) * 100 = (35 + 4) / 54 * 100 = 72.2%
```

| Classification | Count | % of Total |
|---------------|-------|------------|
| Implemented | 35 | 51.5% |
| Implemented-Unreachable | 0 | 0.0% |
| Partial | 8 | 11.8% |
| Missing | 9 | 13.2% |
| Subsystem-Missing | 2 | 2.9% |
| Out of Scope | 14 | 20.6% |
| **Total** | **68** | **100%** |

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Capability Match | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-----------------|-------------|-------|
| R001 | Pokemon Party Limit | constraint | core | gm | Missing | - | - | P2 | No enforcement of 6-Pokemon party limit per trainer. GM can link unlimited Pokemon. |
| R002 | Pokemon Maximum Level | constraint | core | system | Implemented | gm | C006, C014, C021 | - | MAX_EXPERIENCE constant caps at level 100 |
| R003 | Base Stats Definition | enumeration | core | system | Implemented | gm | C002 (SpeciesData) | - | 6 base stats from SpeciesData seeded from PTU pokedex |
| R004 | Pokemon Types | enumeration | core | system | Implemented | gm, player | C001 | - | Types stored on Pokemon model, from SpeciesData |
| R005 | Nature System | enumeration | core | system | Implemented | gm, player | C010, C013 | - | 36 natures in NATURE_TABLE constant |
| R006 | Nature Stat Adjustments | formula | core | system | Implemented | gm | C017 | - | applyNatureToBaseStats: HP +1/-1, others +2/-2, floor 1 |
| R007 | Neutral Natures | condition | core | system | Implemented | gm | C013, C017 | - | 6 neutral natures (raise === lower) return unmodified |
| R008 | Nature Flavor Preferences | enumeration | situational | system | Out of Scope | - | - | - | Flavor preferences are roleplay-only, not mechanical |
| R009 | Stat Points Allocation Total | formula | core | system | Implemented | gm | C029, C033 | - | Level + 10 stat points in generatePokemonData/distributeStatPoints |
| R010 | Base Relations Rule | constraint | core | system | Implemented | gm | C033 | - | distributeStatPoints enforces Base Relations ordering |
| R011 | Pokemon HP Formula | formula | core | system | Implemented | gm, player, group | C009, C029 | - | Level + (HP_stat * 3) + 10 in generator and HP calc |
| R012 | Evasion Calculation | formula | cross-domain-ref | system | Implemented | gm, player | combat-C061 | - | floor(stat/5), cap 6, in combat domain |
| R013 | Abilities — Initial Assignment | workflow | core | gm | Implemented | gm | C012, C029 | - | Random Basic Ability selected at generation |
| R014 | Abilities — Level 20 | workflow | core | gm | Partial | gm | C018, C043 | P1 | **Present:** checkLevelUp reports ability milestone at level 20. PokemonLevelUpPanel displays it. **Missing:** No UI for the GM to actually assign the second ability from the Basic/Advanced list. Manual JSON edit via PUT required. |
| R015 | Abilities — Level 40 | workflow | core | gm | Partial | gm | C018, C043 | P1 | **Present:** checkLevelUp reports milestone at 40. **Missing:** No assignment UI. Same gap as R014. |
| R016 | No Ability Maximum | constraint | situational | system | Implemented | gm | C012 | - | abilities stored as JSON array, no length validation |
| R017 | Move Slot Limit | constraint | core | system | Partial | gm | C011, C029 | P2 | **Present:** Generator selects max 6 moves. **Missing:** PUT endpoint allows saving >6 moves with no validation. No enforcement on manual edits. |
| R018 | Natural Move Sources | enumeration | core | system | Implemented | gm | C002, C029 | - | Learnset from SpeciesData includes level-up moves. Generator selects from these. |
| R019 | TM/Tutor Move Limit | constraint | core | system | Missing | - | - | P2 | No tracking of which moves are from TMs vs natural. No 3-TM limit enforcement. |
| R020 | TM-to-Natural Reclassification | condition | situational | system | Out of Scope | - | - | - | No TM/natural source tracking means no reclassification |
| R021 | Tutor Move Level Restrictions | constraint | core | system | Out of Scope | - | - | - | No tutor move learning UI; restrictions can't be applied |
| R022 | Tutor Points — Initial | formula | core | system | Implemented | gm | C008, C029 | - | Pokemon generation includes tutor points |
| R023 | Tutor Points — Level Progression | formula | core | system | Implemented | gm | C018, C021, C042, C045 | - | checkLevelUp awards tutor point at level 5 and every 5 levels |
| R024 | Tutor Points — Permanent Spend | constraint | core | system | Missing | - | - | P2 | No UI or endpoint for spending tutor points. tutorPoints field exists but is never decremented. |
| R025 | Tutor Points — Trade Refund | condition | situational | system | Out of Scope | - | - | - | No trade mechanic or Feature-to-Pokemon tracking |
| R026 | Level Up Workflow | workflow | core | gm | Implemented | gm | C018, C021, C042, C043, C045 | - | checkLevelUp + calculateLevelUps + XP endpoints handle full level-up |
| R027 | Level Up — Stat Point | formula | core | gm | Partial | gm | C018 | P1 | **Present:** checkLevelUp reports +1 stat point per level. **Missing:** No stat allocation UI. GM must manually edit stats via PUT. Base Relations Rule not enforced on manual edits. |
| R028 | Level Up — Move Check | workflow | core | gm | Partial | gm | C018, C073 | P1 | **Present:** checkLevelUp reports new moves available. PokemonLevelUpPanel displays them. **Missing:** No UI to add moves to active set. GM must manually edit moves JSON. |
| R029 | Evolution Check on Level Up | workflow | core | gm | Missing | - | - | P1 | No evolution detection. checkLevelUp does not check evolution conditions. SpeciesData does not encode evolution triggers. |
| R030 | Optional Evolution Refusal | condition | core | gm | Out of Scope | - | - | - | Evolution not implemented; refusal moot |
| R031 | Evolution — Stat Recalculation | workflow | core | gm | Subsystem-Missing | - | - | P1 | **Missing subsystem: Evolution.** No stat recalculation on evolution. No species change workflow. |
| R032 | Evolution — Ability Remapping | workflow | core | gm | Subsystem-Missing | - | - | P1 | Same missing subsystem: Evolution. |
| R033 | Evolution — Immediate Move Learning | workflow | core | gm | Missing | - | - | P1 | No evolution move learning |
| R034 | Evolution — Skills/Capabilities Update | workflow | core | gm | Missing | - | - | P1 | No evolution capability update |
| R035 | Vitamins — Base Stat Increase | modifier | core | gm | Missing | - | - | P2 | No vitamin item system. vitamins not tracked; no endpoint to apply them. |
| R036 | Vitamins — Maximum Per Pokemon | constraint | core | gm | Out of Scope | - | - | - | No vitamin system implemented |
| R037 | Heart Booster | modifier | situational | gm | Out of Scope | - | - | - | No item system |
| R038 | Pokemon Creation Workflow | workflow | core | gm | Implemented | gm | C029, C031, Chain 2 | - | Full workflow via pokemon-generator service |
| R039 | Breeding — Species Determination | formula | core | gm | Out of Scope | - | - | - | Breeding system not implemented |
| R040 | Breeding — Inheritance Move List | workflow | core | gm | Out of Scope | - | - | - | Breeding not implemented |
| R041 | Breeding — Inheritance Move Schedule | constraint | core | gm | Out of Scope | - | - | - | Breeding not implemented |
| R042 | Inheritance Move Level Restrictions | constraint | core | gm | Out of Scope | - | - | - | Breeding not implemented |
| R043 | Breeding — Trait Determination | workflow | core | gm | Out of Scope | - | - | - | Breeding not implemented |
| R044 | Breeding — Nature Choice Threshold | condition | situational | gm | Out of Scope | - | - | - | Breeding not implemented |
| R045 | Breeding — Ability Choice Threshold | condition | situational | gm | Out of Scope | - | - | - | Breeding not implemented |
| R046 | Breeding — Gender Choice Threshold | condition | situational | gm | Out of Scope | - | - | - | Breeding not implemented |
| R047 | Breeding — Shiny Determination | formula | situational | gm | Out of Scope | - | - | - | Breeding not implemented |
| R048 | Loyalty System — Ranks | enumeration | core | gm | Missing | - | - | P2 | No loyalty field on Pokemon model. 7 ranks (0-6) not tracked. |
| R049 | Loyalty — Command Checks | formula | core | gm | Missing | - | - | P2 | No loyalty; no command check DC enforcement |
| R050 | Loyalty — Starting Values | condition | core | system | Missing | - | - | P2 | No loyalty assigned at capture/creation |
| R051 | Loyalty — Intercept at Rank 3 | interaction | cross-domain-ref | system | Out of Scope | - | - | - | Loyalty not tracked; Intercept restrictions in combat domain |
| R052 | Loyalty — Intercept at Rank 6 | interaction | cross-domain-ref | system | Out of Scope | - | - | - | Same as R051 |
| R053 | Disposition System | enumeration | situational | gm | Missing | - | - | P3 | No disposition tracking for wild Pokemon |
| R054 | Disposition — Charm Check DCs | formula | situational | gm | Out of Scope | - | - | - | Disposition not implemented |
| R055 | Training Session | workflow | situational | gm | Missing | - | - | P2 | trainingExp field exists but no training session endpoint or UI |
| R056 | Experience Training Formula | formula | situational | gm | Missing | - | - | P2 | Half level + Command rank bonus not implemented |
| R057 | Experience Training Limit | constraint | situational | gm | Out of Scope | - | - | - | Training not implemented |
| R058 | Pokemon Experience Calculation | formula | core | system | Implemented | gm | C020, C044 | - | calculateEncounterXp: enemy levels * significance / players |
| R059 | Experience Distribution Rules | workflow | core | gm | Implemented | gm | C045, C078 | - | XpDistributionModal allows per-Pokemon allocation |
| R060 | Experience Chart | formula | core | system | Implemented | gm | C014, C024 | - | Full EXPERIENCE_CHART level 1-100 |
| R061 | Size Classes | enumeration | core | system | Implemented | gm | C001, C076 | - | Stored on Pokemon, displayed in PokemonCapabilitiesTab |
| R062 | Weight Classes | enumeration | core | system | Implemented | gm | C001, C076 | - | Weight class on Pokemon, used in capabilities display |
| R063 | Species Capabilities | enumeration | core | system | Implemented | gm | C001, C076 | - | capabilities JSON on Pokemon from SpeciesData |
| R064 | Move-Granted Capabilities | condition | situational | system | Partial | gm | C011 | P3 | **Present:** Capabilities stored on Pokemon. **Missing:** No automated linkage between moves and capability grants. If a move granting a capability is forgotten, the capability persists until GM manually removes it. |
| R065 | Pokemon Skills | enumeration | core | system | Implemented | gm | C001, C077 | - | Skills JSON from SpeciesData, displayed in PokemonSkillsTab |
| R066 | Mega Evolution — Trigger | workflow | edge-case | both | Partial | gm | C001 | P3 | **Present:** heldItem field can store Mega Stone name. **Missing:** No Mega Evolution trigger UI, no Swift Action integration, no Mega Ring check. |
| R067 | Mega Evolution — Stat/Ability Changes | formula | edge-case | system | Missing | - | - | P3 | No stat recalculation for Mega forms. No Mega stat data seeded. |
| R068 | Mega Evolution — Constraints | constraint | edge-case | system | Out of Scope | - | - | - | Mega Evolution not implemented; constraints moot |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 30 | 20 | 0 | 2 | 4 | 4 |
| gm | 33 | 14 | 0 | 5 | 5 | 9 |
| both | 1 | 0 | 0 | 1 | 0 | 0 |
| cross-domain | 4 | 1 | 0 | 0 | 0 | 3 |

### Key Findings
- **No Implemented-Unreachable rules:** All lifecycle capabilities are accessible from the GM view where they belong. Pokemon lifecycle is inherently a GM management domain.
- **Player visibility exists** for Pokemon data (stats, types, moves via player view), export/import (C047-C048/C070-C071), and sprites.
- **Evolution is the largest gap:** 4 rules (R029, R031-R034) are Missing/Subsystem-Missing. This is the single biggest functional gap in the pokemon-lifecycle domain.
- **Breeding is entirely Out of Scope:** 9 rules (R039-R047) classified as Out of Scope. The app is a session helper, not a breeding simulator.

---

## Subsystem Gaps

### 1. No Evolution System
- **Missing subsystem:** Pokemon evolution detection, species transformation, stat recalculation, ability remapping, move learning on evolution
- **Rules affected:** R029 (Evolution Check), R031 (Stat Recalc), R032 (Ability Remap), R033 (Move Learning), R034 (Skills/Capabilities Update) — 5 rules
- **Impact:** GM must manually create a new Pokemon of the evolved species and transfer stats. No automated detection of evolution eligibility. SpeciesData lacks evolution trigger encoding.
- **Suggested ticket:** "feat: implement Pokemon evolution system with species transformation" (P1)

### 2. No Loyalty System
- **Missing subsystem:** Loyalty ranks (0-6), starting values, command checks, combat restrictions
- **Rules affected:** R048 (Ranks), R049 (Command Checks), R050 (Starting Values) — 3 rules
- **Impact:** No loyalty field on Pokemon model. No command check enforcement. Intercept loyalty requirements unenforceable.
- **Suggested ticket:** "feat: add loyalty system with ranks, command checks, and starting values" (P2)

### 3. No Stat/Move Allocation UI for Level-Ups
- **Rules affected:** R027 (Stat Point), R028 (Move Check), R014 (Ability 20), R015 (Ability 40) — 4 rules
- **Impact:** Level-up effects are correctly detected and reported but no UI exists to allocate stat points, add moves, or assign abilities. GM must manually edit via PUT.
- **Suggested ticket:** "feat: implement level-up stat allocation and move learning UI" (P1)

### 4. No Training XP System
- **Rules affected:** R055 (Training Session), R056 (Experience Training Formula) — 2 rules
- **Impact:** trainingExp field exists but no training workflow. Players cannot train Pokemon for daily XP.
- **Suggested ticket:** "feat: implement daily training XP system" (P2)

---

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 7 | R014, R015, R027, R028, R029, R031, R032 |
| P2 | 8 | R001, R017, R019, R024, R035, R048, R049, R050, R055, R056 |
| P3 | 4 | R053, R064, R066, R067 |

---

## Auditor Queue

### Tier 1: Core Formulas (Verify Correctness)
1. R011 — Pokemon HP Formula → C009, C029 (level + HP*3 + 10)
2. R006 — Nature Stat Adjustments → C017 (HP +1/-1, others +2/-2, floor 1)
3. R009 — Stat Points Total → C029, C033 (level + 10)
4. R023 — Tutor Points Level Progression → C018, C021 (level 5 and every 5)
5. R058 — Experience Calculation → C020 (enemy levels * significance / players)
6. R060 — Experience Chart → C014 (1-100 thresholds)
7. R012 — Evasion Calculation → combat-C061 (cross-domain verify)

### Tier 2: Core Workflows (Verify Correctness)
8. R038 — Pokemon Creation Workflow → C029, C031 (full generation pipeline)
9. R013 — Abilities Initial → C029 (random Basic Ability selection)
10. R026 — Level Up Workflow → C018, C021, C042, C045
11. R059 — XP Distribution → C045, C078

### Tier 3: Core Constraints (Verify Correctness)
12. R002 — Max Level 100 → C006, C014 (MAX_EXPERIENCE cap)
13. R010 — Base Relations Rule → C033 (ordering enforcement)
14. R007 — Neutral Natures → C013, C017 (raise === lower returns unmodified)

### Tier 4: Enumerations (Verify Completeness)
15. R003 — Base Stats → C002 (SpeciesData has all 6 stats)
16. R004 — Pokemon Types → C001 (18 types)
17. R005 — Nature System → C013 (36 natures present)
18. R018 — Natural Move Sources → C002 (learnset includes level-up + egg + tutor(N))
19. R061 — Size Classes → C001, C076
20. R062 — Weight Classes → C001, C076
21. R063 — Species Capabilities → C001, C076
22. R065 — Pokemon Skills → C001, C077

### Tier 5: Partial Items — Present Portion (Verify)
23. R014 — Ability 20 milestone detection → C018, C043
24. R015 — Ability 40 milestone detection → C018, C043
25. R017 — Move limit at generation (6 moves) → C029
26. R027 — Stat point reporting (+1/level) → C018
27. R028 — New move detection → C018, C073
28. R064 — Capabilities stored → C001
29. R066 — Mega Stone held item → C001
