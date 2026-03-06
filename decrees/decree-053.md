---
decree_id: decree-053
status: active
domain: combat
topic: recall-source-dependent-clearing
title: "Other conditions clear on recall per RAW, then re-apply on send-out if source persists"
ruled_at: 2026-03-06T12:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-052
implementation_tickets: [ptu-rule-156]
tags: [combat, status-conditions, recall, switching, terrain, weather, other-conditions, source-tracking]
---

# decree-053: Other conditions clear on recall per RAW, then re-apply on send-out if source persists

## The Ambiguity

Decree-047 established source-dependent clearing for Other conditions on **faint**, but the implementation in `conditionSourceRules.ts` extended source-dependent clearing to **recall** as well. For terrain and weather sources, `clearsOnRecall: false` was set, meaning terrain-sourced Stuck/Slowed would NOT clear on recall. However, PTU p.248 explicitly states that Stuck and Slowed "may be removed by switching" — i.e., recall should always clear them regardless of source.

Surfaced by rules-review-314 MEDIUM-001.

## Options Considered

### Option A: RAW-compliant
Stuck/Slowed always clear on recall regardless of source. Source-dependent clearing only applies to faint (per decree-047's explicit scope). Follows literal PTU p.248 text. Downside: recalling and re-sending into the same terrain would require the GM to manually re-apply conditions.

### Option B: Current implementation
Terrain/weather-sourced Stuck/Slowed do NOT clear on recall. Practical reasoning: recalling into the same terrain would just re-apply the condition. Extends decree-047's principle beyond its explicit scope. Diverges from RAW p.248.

### Option C: Hybrid — clear on recall, re-apply on send-out
Clear on recall per RAW, but automatically re-apply when the Pokemon is sent back out if the terrain/weather source is still active. Respects both RAW switching rules and the practical concern about terrain persistence. Requires send-out hook logic.

## Ruling

**The true master decrees: Other conditions clear on recall per RAW; if the source (terrain/weather) is still active when the Pokemon is sent back out, the condition is automatically re-applied.**

This is the hybrid approach. The clearing rules in `SOURCE_CLEARING_RULES` must set `clearsOnRecall: true` for all source types (terrain, weather included). A separate send-out hook must check whether persisting condition sources (terrain, weather, environment) are still active and re-apply their conditions with the appropriate source tag.

This preserves RAW compliance (switching always clears per p.248) while avoiding the burden of manual re-application by the GM. The re-apply logic on send-out is the system's responsibility, not the GM's.

## Precedent

Recall clearing follows RAW unconditionally for all conditions that RAW says clear on switching. Source-dependent clearing (decree-047) applies to **faint behavior only**, not recall. However, persistent environmental sources (terrain, weather) automatically re-apply their conditions on send-out. This establishes a "clear-then-reapply" pattern: the game mechanic (switching clears) is respected, but the world state (terrain exists) is also enforced.

## Implementation Impact

- Tickets created: ptu-rule-156 (fix terrain/weather clearsOnRecall to true; implement send-out re-apply hook)
- Files affected: `app/constants/conditionSourceRules.ts` (change clearsOnRecall for terrain/weather), encounter send-out logic (new re-apply hook)
- Skills affected: All combat reviewers, implementation auditor — cite decree-053 for recall + send-out behavior
