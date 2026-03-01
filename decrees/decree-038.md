---
decree_id: decree-038
status: active
domain: combat
topic: sleep-classification-and-condition-behavior-decoupling
title: "Decouple condition behaviors from categories; Sleep is volatile but persists through recall and encounter end"
ruled_at: 2026-03-01T00:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-037
implementation_tickets: [refactoring-106, ptu-rule-128]
tags: [combat, status-conditions, sleep, volatile, persistent, recall, architecture, decoupling]
---

# decree-038: Decouple condition behaviors from categories; Sleep is volatile but persists through recall and encounter end

## The Ambiguity

PTU 1.05 places Sleep's full definition under "Volatile Afflictions" (p.247), but the "Persistent Afflictions" intro text (p.246) mentions "Sleeping Pokemon will naturally awaken given time" alongside Frozen — grouping it with persistent conditions. The codebase classified Sleep as volatile, meaning recall and encounter-end both clear it. In the mainline Pokemon video games, Sleep persists through switching and battle end, contradicting the volatile classification's behavioral implications.

The deeper issue: the code uses rigid category arrays (`VOLATILE_CONDITIONS`, `PERSISTENT_CONDITIONS`) to derive behaviors (`RECALL_CLEARED_CONDITIONS = [...VOLATILE_CONDITIONS, ...]`). This makes it impossible to classify Sleep as volatile while giving it persistent-like behaviors.

Surfaced by rules-review-212 MEDIUM-001 via decree-need-037.

## Options Considered

### Option A: Reclassify Sleep as Persistent
Move `Asleep`/`Bad Sleep` from `VOLATILE_CONDITIONS` to `PERSISTENT_CONDITIONS`. Simple fix but wrong categorization — Sleep IS defined under Volatile in PTU p.247.

### Option B: Keep as Volatile (current code)
No changes. Recall and encounter-end clear Sleep. Contradicts video game behavior and p.246 grouping.

### Option C: Decouple behaviors from categories
Give each condition independent behavior flags (`clearsOnRecall`, `clearsOnEncounterEnd`, etc.) so category is for display/grouping only, not behavior derivation. Sleep stays volatile but doesn't clear on recall or encounter end.

## Ruling

**The true master decrees: decouple condition behaviors from category arrays, and Sleep is volatile but does NOT clear on recall or encounter end.**

Three binding points:

1. **Sleep remains categorized as "volatile"** per PTU p.247 structural placement. The p.246 mention is acknowledged as a behavioral note, not a classification.

2. **Sleep does NOT clear on recall or encounter end.** This matches mainline Pokemon video game behavior where Sleep persists through switching and battle end. Sleep is cured only by its normal wake-up mechanics (save checks, taking damage, items, Pokemon Center).

3. **Condition behaviors must be decoupled from category arrays.** The current pattern of `RECALL_CLEARED_CONDITIONS = [...VOLATILE_CONDITIONS, ...]` is too rigid. Each condition should have independent behavior flags (e.g., `clearsOnRecall`, `clearsOnEncounterEnd`, `clearsOnFaint`) so that category is used only for display grouping, not behavior derivation. This allows any condition to have whatever combination of behaviors is correct without being forced into a rigid package.

## Precedent

Status condition categories (volatile, persistent, other) are for **display and grouping purposes only**. Mechanical behaviors (clearing on recall, clearing on encounter end, clearing on faint) are specified **per-condition** via independent behavior flags. When PTU text or video game behavior contradicts the behavioral package implied by a category, the specific behavior wins over the category assumption. This principle applies to all conditions, not just Sleep.

## Implementation Impact

- Tickets created: refactoring-106 (decouple condition behaviors from category arrays), ptu-rule-128 (fix Sleep to persist through recall and encounter end)
- Files affected: `app/constants/statusConditions.ts` (primary), all consumers of `RECALL_CLEARED_CONDITIONS` and condition category arrays
- Skills affected: All combat reviewers, implementation auditor (new condition behavior model)
