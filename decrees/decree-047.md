---
decree_id: decree-047
status: active
domain: combat
topic: other-condition-faint-clearing
title: "Other conditions do not clear on faint by default; clearing is source-dependent"
ruled_at: 2026-03-04T15:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-046
implementation_tickets: [ptu-rule-134, refactoring-129]
tags: [combat, status-conditions, faint, other-conditions, stuck, slowed, trapped, tripped, vulnerable, source-tracking]
---

# decree-047: Other conditions do not clear on faint by default; clearing is source-dependent

## The Ambiguity

PTU p.248 states: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." The Other category conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) are not mentioned. The refactoring-106 implementation (per decree-038's decoupling) set `clearsOnFaint: true` for all 5 Other conditions, expanding faint-cleared conditions from 14 to 19 — a behavioral change from the old code.

Surfaced by code-review-327 HIGH-001.

## Options Considered

### Option A: Keep expansion
Set `clearsOnFaint: true` for all Other conditions. Pragmatic — fainted Pokemon can't meaningfully be Stuck/Tripped. But contradicts RAW and old behavior.

### Option B: Revert to RAW
Set `clearsOnFaint: false` for all Other conditions. Matches literal PTU p.248 text and pre-refactoring-106 behavior.

### Option C: Source-dependent clearing
Whether an Other condition clears on faint depends on **what applied it**, not on the condition itself. A move-applied Stuck might clear, but terrain-based Stuck wouldn't. Requires tracking the source of applied conditions.

## Ruling

**The true master decrees: Other category conditions do NOT clear on faint by default. Whether an Other condition clears on faint is source-dependent, not condition-dependent.**

Three binding points:

1. **RAW baseline:** Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) have `clearsOnFaint: false` as the static default. This matches PTU p.248's explicit mention of only Persistent and Volatile conditions.

2. **Source-dependent clearing principle:** The static `clearsOnFaint` flag on condition definitions is insufficient for Other conditions. Whether an Other condition should clear on faint depends on what applied it. For example, a move-inflicted Stuck should clear (the move effect is gone), but terrain-based Stuck should not (the terrain is still there). This requires tracking the source of each applied condition instance.

3. **Interim behavior:** Until source tracking is implemented, Other conditions use the RAW default (`clearsOnFaint: false`). The current code must be corrected to set `clearsOnFaint: false` for all 5 Other conditions.

## Precedent

For Other category conditions, faint-clearing behavior is **source-dependent, not condition-dependent**. Static per-condition flags are appropriate for Persistent and Volatile conditions (which always clear on faint per RAW), but Other conditions require runtime source information to determine clearing behavior. This extends decree-038's decoupling principle: not only are behaviors decoupled from categories, but for the Other category, behaviors may also need to be decoupled from static condition definitions entirely.

## Implementation Impact

- Tickets created: ptu-rule-134 (revert Other conditions to clearsOnFaint: false), refactoring-129 (design source-tracking for applied conditions)
- Files affected: `app/constants/statusConditions.ts` (immediate fix), condition application system (future source tracking)
- Skills affected: All combat reviewers, implementation auditor — cite decree-047 for Other condition faint behavior
