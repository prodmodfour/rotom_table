---
id: ptu-rule-124
title: "Replace bogus encounter budget formula with PTU-sourced guidance"
priority: P4
severity: LOW
category: ptu-rule
source: decree-031
created_at: 2026-02-28
status: in-progress
---

## Summary

The encounter budget uses `avgPokemonLevel * 2 * playerCount` citing "Core p.473" which does not exist in PTU 1.05. Per decree-031, replace with PTU-sourced encounter design guidance from Chapter 11.

## Requirements

1. Research PTU Chapter 11 (Running the Game) in `books/markdown/core/11-running-the-game.md` for encounter balancing guidance
2. Find the current encounter budget formula in the codebase
3. Remove the false "Core p.473" citation immediately
4. Replace the formula with guidance derived from actual PTU encounter design principles
5. If PTU provides no concrete formula, implement a heuristic clearly labeled as app-specific (no PTU claim)
6. Update any UI that shows "recommended budget" or "level budget"
7. Update related tests

## PTU Reference

- PTU Core Chapter 11: encounter design guidance
- PTU Core p.460: significance and XP (related)
- "Core p.473" — does NOT exist, must be removed
- decree-031: replace with PTU-sourced guidance

## Affected Code

- Encounter budget calculation (find via searching for the formula or "p.473")
- Encounter table / template UI showing budget recommendations

## Resolution Log

### Research Finding

PTU Chapter 11 (p.473, "Basic Encounter Creation Guidelines") DOES contain the formula described in the code. The PTU text states: "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2... From there, simply multiply the Experience drop by your number of Trainers." The formula `avgPokemonLevel * 2 * playerCount` accurately implements this. However, the PTU text frames it as a **GM guideline** for everyday encounters (not a hard formula), with caveats about adjusting for low-level parties and scaling for significant encounters. The difficulty thresholds (trivial/easy/balanced/hard/deadly) are app-specific heuristics with no PTU source.

### Changes Made

| Commit | Description | Files |
|--------|-------------|-------|
| `46b4e12` | Remove all 'Core p.473' citations from encounterBudget.ts, reframe as PTU Chapter 11 guideline | `app/utils/encounterBudget.ts` |
| `ae33f25` | Remove 'PTU p.473' from scene page budget comments | `app/pages/gm/scenes/[id].vue` |
| `291b0b5` | Add '(PTU guideline)' label to BudgetGuide formula display | `app/components/habitat/BudgetGuide.vue` |
| `1b4dbf8` | Update matrix capability artifacts to remove p.473 citations | `artifacts/matrix/combat/capabilities/combat-C070.md`, `artifacts/matrix/encounter-tables/encounter-tables-capabilities.md`, `artifacts/matrix/scenes/audit/audit-report.md` |
| `e9154d1` | Update design specs to remove p.473 citations | `artifacts/designs/design-level-budget-001/spec-p0.md`, `artifacts/designs/_archive/design-level-budget-001.md` |

### Verification

- No remaining 'p.473' references in `app/` directory (verified via grep)
- Formula unchanged (same calculation, only documentation/attribution corrected)
- No existing unit tests for encounterBudget.ts — no test updates needed
- UI now shows '(PTU guideline)' to clarify the formula is advisory, not prescriptive
