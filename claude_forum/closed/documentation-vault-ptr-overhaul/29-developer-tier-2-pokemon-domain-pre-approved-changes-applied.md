# 2026-03-25 — Tier 2: pokemon domain — pre-approved changes applied

**Pre-approved (4 files):**
- `pokemon-hp-formula.md` — formula `level + (HP_stat × 3) + 10` → `(Level × 5) + (HP_stat × 3) + 10`, PTU Core → PTR
- `pokemon-loyalty.md` — PTU Chapter 10 → PTR
- `pokemon-center-healing.md` — "Move usage restored" → "Energy restored", removed frequency-based rolling window reference
- `pokemon-api-endpoints.md` — PTU HP formula → PTR HP formula

**Base Relations removed (5 files):**
- `pokemon-stat-allocation.md` — rewrote opening to unconstrained 5-per-level, removed BR utilities (`buildStatTiers`, `validateBaseRelations`, `getValidAllocationTargets`)
- `pokemon-evolution-system.md` — removed `validateBaseRelations` re-export and BR validation
- `pokemon-api-endpoints.md` — "Base Relations validation" → "freely"
- `service-inventory.md` — removed "Base Relations validation" from evolution service description

**PTR vault correction:** `pokemon-creation-ordered-steps.md` had wrong stat point formula ("level + 10 base") — fixed to "5 per level". Ashraf confirmed: stat points = 5 × level. No base bonus.

**Evolution system rewrite (`pokemon-evolution-system.md`):**
- Service: "abilities, moves, capabilities, skills" → "traits, skills". Added: inherited innate traits persist evolution, moves rechecked against unlock conditions.
- Modal step 1: "stat allocation with base stat comparison" → "full stat rebuild from scratch"
- Modal step 2: "Ability resolution" → "Trait resolution" (species innate traits update, inherited/learned/emergent persist)
- Modal step 3: "Move learning from learnset" → "Move condition recheck" (verify unlock conditions still met after species/type/stat changes)
- See-also: removed `pokemon-ability-assignment`, added `evolution-rebuilds-all-stats` and `evolution-trigger-conditions`

**Generator rewrite (`pokemon-generator-entry-point.md`):**
- Function 1: "rolls nature/gender, selects moves + abilities" → "rolls gender, assigns initial traits and moves, distributes stat points (5 × level), calculates HP"
- See-also: removed `pokemon-nature-system`, removed "learnset, abilities" from species-data-model description

**Ashraf clarifications captured:**
- Stat points at creation = 5 × level (not 5 per level-up)
- Inherited innate traits persist through evolution
- Moves must be rechecked for condition matching on evolution (species/type/stat changes can invalidate or satisfy conditions)
