---
decree_id: decree-045
status: active
domain: combat
topic: sun-blanket-healing-fraction
title: "Use Tick (1/10th max HP) for Sun Blanket healing, not 1/16th"
ruled_at: 2026-03-03T21:30:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-044
implementation_tickets: []
tags: [combat, weather, sunny, sun-blanket, healing, tick, ability-description]
---

# decree-045: Use Tick (1/10th max HP) for Sun Blanket healing, not 1/16th

## The Ambiguity

The PTU 1.05 rulebook contradicts itself on Sun Blanket's healing amount in Sunny weather. The ability description says "a Tick of Hit Points" (1/10th max HP), while the weather summary table says "1/16th of their Max Hit Points." These are different values (10% vs 6.25%).

Source: decree-need-044, surfaced by rules-review-283.

## Options Considered

### Option A: Tick (1/10th max HP)
Follow the ability description text. Ability descriptions are the primary, detailed source. The weather summary is a secondary reference table. Rain Dish, Ice Body, and Dry Skin all consistently use "Tick" in both places. The 2016 playtest packet also says "Tick" for Sun Blanket. The current implementation already uses this value.

### Option B: 1/16th max HP
Follow the weather summary table. This would make Sun Blanket weaker, matching Solar Power's 1/16th HP loss pattern and Desert Weather's 1/16th healing. Could be an intentional correction in the summary.

## Ruling

**The true master decrees: Sun Blanket heals a Tick (1/10th max HP) per turn in Sunny weather. Ability descriptions take precedence over summary tables.**

The ability description is the primary, authoritative source for an ability's mechanics. The weather summary table is a secondary quick-reference that contains an error for Sun Blanket. This is consistent with Rain Dish, Ice Body, and Dry Skin, which all use "Tick" in both locations. The 2016 playtest packet further confirms "Tick" as the intended value. The summary table's "1/16th" is treated as a transcription error.

## Precedent

When an ability description and a summary table disagree on a mechanical value, the **ability description takes precedence**. Ability descriptions are the primary source of truth for ability mechanics; summary tables are secondary quick-references that may contain transcription errors.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: `app/server/services/weather-automation.service.ts` (already correct with `hpFraction: 10`)
- Skills affected: Game-logic reviewers should cite this decree when reviewing Sun Blanket healing
