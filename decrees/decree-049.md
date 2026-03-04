---
decree_id: decree-049
status: active
domain: capture
topic: loyalty-default-by-origin
title: "Use origin-dependent default loyalty: wild catches at 2 (Wary), hatched/gifted at 3 (Neutral)"
ruled_at: 2026-03-04T23:35:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-048
implementation_tickets: [ptu-rule-135]
tags: [loyalty, capture, origin, wild, hatched, default]
---

# decree-049: Use origin-dependent default loyalty

## The Ambiguity

The Prisma schema sets `loyalty Int @default(3)` (Neutral) for all Pokemon regardless of origin. PTU RAW (05-pokemon.md:1468-1470) states "Most caught wild Pokemon will begin at [Loyalty 2]" while noting hatched Pokemon may begin at Loyalty 3 (05-pokemon.md:1499-1501). The bug-047 fix cycle (rules-review-311 MED-001) surfaced that the universal default of 3 contradicts RAW for wild captures.

## Options Considered

### Option A: Loyalty 2 (Wary) for All
Universal default of 2 per RAW's description of wild captures. Simple but incorrect for hatched/gifted Pokemon.

### Option B: Loyalty 3 (Neutral) for All — Current Behavior
Universal default of 3. Simple but contradicts RAW for wild captures. Mechanically grants Intercept eligibility immediately on capture.

### Option C: Origin-Dependent
Wild catches default to 2 (Wary), hatched/gifted/befriended Pokemon default to 3 (Neutral). Follows RAW distinctions for both categories. Adds per-origin logic to creation flows.

## Ruling

**The true master decrees: Use origin-dependent default loyalty — wild captures start at Loyalty 2 (Wary), hatched and gifted Pokemon start at Loyalty 3 (Neutral).**

This follows PTU RAW faithfully. Wild Pokemon must earn trust (Loyalty 2 → 3) before they can Intercept for their trainer. Hatched Pokemon bond naturally with their trainer and start at Neutral. The existing `origin` enum on the Pokemon model (`wild`, `hatched`, `gifted`, `starter`, `custom`) provides the basis for branching.

Mapping:
- `wild` → Loyalty 2 (Wary)
- `hatched` → Loyalty 3 (Neutral)
- `gifted` → Loyalty 3 (Neutral)
- `starter` → Loyalty 3 (Neutral)
- `custom` → Loyalty 3 (Neutral) — GM override available

The schema `@default(3)` remains unchanged (it serves as the safe fallback). The origin-based logic is applied at creation time in the capture and pokemon-generator services.

## Precedent

When PTU RAW defines different defaults based on Pokemon origin, implement origin-dependent behavior rather than collapsing to a single universal default. The `origin` enum is the canonical source for branching.

## Implementation Impact

- Tickets created: ptu-rule-135 (update capture flow to set loyalty 2 for wild captures)
- Files affected: `app/server/api/capture/attempt.post.ts`, `app/server/services/entity-builder.service.ts`, `app/server/api/pokemon/index.post.ts`
- Skills affected: Developer (implement origin branching), Game Logic Reviewer (verify loyalty assignment per origin)
