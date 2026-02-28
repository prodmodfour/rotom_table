---
id: decree-need-035
title: "Base Relations validation: raw species base or nature-adjusted base?"
priority: P1
severity: MEDIUM
domain: pokemon-lifecycle
source: design-pokemon-evolution-001/spec-p0.md (section 3.1.3)
created_by: slave-collector (plan-20260228-173500)
---

# decree-need-035: Base Relations — Raw vs Nature-Adjusted

## Ambiguity

PTU p.198 says Pokemon stats must "maintain the same relative ordering as base stats." The evolution design uses nature-adjusted base stats for the Base Relations ordering constraint.

## Interpretations

1. **Nature-adjusted (design default):** The ordering constraint uses the nature-modified base stats. A +Atk/-Def nature changes which stats must be higher/lower, giving more flexibility during stat redistribution on evolution.
2. **Raw species base:** The ordering constraint uses the unmodified species base stats. Natures affect final values but do not change the ordering requirement. Less flexible but simpler.

## Impact

Affects stat redistribution flexibility on evolution. Nature-adjusted is more permissive (allows more stat allocations). Raw base is stricter.

## Blocking

Blocks implementation of `validateBaseRelations()` in feature-006 (Pokemon Evolution System, P0 tier).
