---
id: decree-need-044
title: "Sun Blanket healing fraction: Tick (1/10th) vs 1/16th max HP"
priority: P2
severity: medium
status: open
domain: combat
source: rules-review-283
created_by: game-logic-reviewer
created_at: 2026-03-03T20:45:00Z
affected_files:
  - app/server/services/weather-automation.service.ts
---

## Summary

The PTU 1.05 rulebook contradicts itself on Sun Blanket's healing amount in Sunny weather. A decree is needed to resolve which value the implementation should use.

## The Ambiguity

**Sun Blanket ability description** (10-indices-and-reference.md, p.2575-2579):
> "The user is one step more resistant to Fire-Type Attacks, and gains a **Tick** of Hit Points at the beginning of each turn in Sunny weather."

A Tick = 1/10th max HP (PTU p.246).

**Sunny weather summary** (10-indices-and-reference.md, p.3612-3613):
> "Users with Sun Blanket gain **1/16th** of their Max Hit Points at the beginning of each turn."

These values are different: a Tick is 1/10th (10%) while the summary says 1/16th (6.25%).

## Current Implementation

The implementation uses `hpFraction: 10` (Tick = 1/10th), following the ability description. This was a deliberate design decision in spec-p1.md for design-weather-001.

## Options

- **Option A: Tick (1/10th)** — Follow the ability description text. Ability descriptions are typically more detailed and authoritative than summary tables.
- **Option B: 1/16th** — Follow the weather summary. This makes Sun Blanket weaker, matching Desert Weather's 1/16th pattern and Solar Power's 1/16th HP loss.

## Notes

- Rain Dish, Ice Body, and Dry Skin all consistently use "Tick" in both their ability descriptions AND the weather summary.
- Desert Weather consistently uses "1/16th" in both places.
- Sun Blanket is the only ability where the two sources disagree.
- No errata entry exists for Sun Blanket.
