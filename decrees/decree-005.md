---
decree_id: decree-005
status: active
domain: combat
topic: status-cs-auto-apply
title: "Auto-apply combat stage changes from status conditions with source tracking"
ruled_at: 2026-02-26T18:04:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-005
implementation_tickets: [ptu-rule-098]
tags: [combat, status-conditions, combat-stages, burn, paralysis, poison, automation]
---

# decree-005: Auto-apply combat stage changes from status conditions with source tracking

## The Ambiguity

Should the app automatically apply/remove combat stage changes when Burn (-2 Def CS), Paralysis (-4 Speed CS), or Poison (-2 SpDef CS) are added/removed?

Source: decree-need-005.

## Options Considered

### Option A: Manual (current)
GM handles all CS adjustments. Flexible but error-prone.

### Option B: Auto-apply with source tracking
Tag CS changes by source. Auto-apply on status add, reverse on cure, re-apply after Take a Breather.

### Option C: Auto-apply without tracking
Simple apply/reverse but can overshoot with independent stage changes.

### Option D: Visual reminder
Show warnings, no automation.

## Ruling

**The true master decrees: auto-apply combat stage changes from status conditions with source tracking.**

When Burn is applied, automatically apply -2 Def CS tagged as "source: Burn." When Burn is cured, reverse only the Burn-sourced stages. When Take a Breather resets all stages, re-apply stages from active status conditions. This is the PTU-correct approach — these CS effects are inherent properties of the conditions.

## Precedent

Status conditions with inherent combat stage effects (Burn, Paralysis, Poison) are automatically applied and tracked by source. Source-tagged stages survive Take a Breather (which resets non-sourced stages, then re-applies condition-sourced ones). Manual CS adjustments remain independent.

## Implementation Impact

- Tickets created: ptu-rule-098 (auto-apply status condition CS with source tracking)
- Files affected: `app/server/api/encounters/[id]/status.post.ts`, combat stage data model, Take a Breather handler
- Skills affected: all combat reviewers, combat service developers
