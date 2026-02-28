---
id: decree-need-031
title: "Encounter budget formula: bogus PTU citation 'Core p.473' — keep heuristic?"
priority: P4
severity: LOW
category: decree-need
source: encounter-tables audit A1 R006 (plan-20260228-072000 slave-3)
created_by: slave-collector (plan-20260228-093200)
created_at: 2026-02-28
---

## Summary

The encounter budget calculation uses the formula `avgPokemonLevel * 2 * playerCount` and cites "Core p.473" as its source. This page does not exist in the PTU 1.05 core text. The formula appears to be either a community-derived heuristic or from an unidentified supplement.

## The Ambiguity

The formula has no verifiable PTU source. It may come from:
- A community-derived heuristic based on PTU encounter design philosophy
- A PTU supplement, playtest document, or errata not in the core 1.05 text
- An invention by a previous developer

## Interpretations

**A) Keep the heuristic, fix the citation:**
The formula produces reasonable encounter budgets. Remove the false "Core p.473" citation and attribute it as a community heuristic or app-specific tool. No PTU authority claim.

**B) Remove the formula entirely:**
Since it has no PTU basis, remove the auto-calculated budget and let GMs set encounter budgets manually. PTU provides encounter design guidance (Chapter 11) but no specific formula.

**C) Replace with a PTU-sourced alternative:**
Research PTU Chapter 11 (Running the Game) for any encounter balancing guidance and implement that instead.

## Affected Code

- Encounter budget calculation (likely in encounter table or encounter template service)
- Any UI showing "recommended budget" or "level budget"

## PTU Reference

- PTU Core Chapter 11 (Running the Game): encounter design guidance
- PTU Core p.460: significance and XP (related but distinct from budget)
- "Core p.473" — **does not exist** in PTU 1.05
