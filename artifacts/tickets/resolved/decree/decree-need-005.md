---
ticket_id: decree-need-005
ticket_type: decree-need
priority: P1
status: addressed
decree_id: decree-005
domain: combat
topic: status-cs-auto-apply
affected_files:
  - app/server/api/encounters/[id]/status.post.ts
created_at: 2026-02-26T12:00:00
---

## Ambiguity

Should the app automatically apply/remove combat stage changes when Burn, Paralysis, or Poison status conditions are added/removed, or leave this to the GM?

## PTU Rule Reference

- **p.246**: "Burned: The target's Defense Stat is lowered by 2 Combat Stages for the duration of the Burn."
- **p.246**: "Paralysis: The Target's Speed Stat is lowered by 4 Combat Stages."
- **p.246**: "Poisoned: The target's Special Defense Value is lowered by 2 Combat Stages for the duration of the poison."

These are described as automatic, inherent properties of the status condition.

## Current Behavior

The status endpoint adds/removes status condition strings only. No automatic combat stage adjustment. The GM must manually adjust combat stages via the separate `/api/encounters/:id/stages` endpoint. When curing the condition, the GM must remember to reverse the CS changes.

## Options

### Option A: Manual (current)
GM handles all CS adjustments. Flexible but error-prone. Complex interactions (Take a Breather resets stages but doesn't cure Burn — GM must re-apply Burn's -2 Def CS after breather).

### Option B: Auto-apply with source tracking
Tag CS changes as "from Burn" etc. When condition is cured, reverse only those specific stages. When Take a Breather resets all stages, re-apply condition-sourced stages. Correct but complex to implement.

### Option C: Auto-apply without tracking
Apply -2 Def CS on Burn, restore +2 on cure. Simpler but can overshoot if stages changed independently.

### Option D: Visual reminder
Show a warning/indicator when status conditions with CS effects are present without corresponding stage changes. No automation.

## Blocking

Affects every combat with status conditions. Current behavior is functional but requires GM discipline.
