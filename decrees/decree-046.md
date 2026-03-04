---
decree_id: decree-046
status: active
domain: combat
topic: no-guard-definition
title: "Use playtest +3/-3 flat accuracy version of No Guard"
ruled_at: 2026-03-04T12:30:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-045
implementation_tickets: []
tags: [no-guard, ability, accuracy, playtest, living-weapon, melee]
---

# decree-046: Use playtest +3/-3 flat accuracy version of No Guard

## The Ambiguity

The No Guard ability has two conflicting definitions in PTU source material. The core rulebook (p.325) defines it as evasion-based and melee-only, while the 2016 playtest packet (line 525) redefines it as a flat +3/-3 to all attack rolls. The codebase uses the playtest version but no decree formalized this choice. Surfaced by rules-review-294 during feature-005 P2 review (MEDIUM-003).

## Options Considered

### Option A: Playtest (+3/-3 flat accuracy)
The user gains a +3 bonus to all Attack Rolls; all foes gain a +3 bonus on Attack Rolls against the user. Affects all attacks (melee and ranged). Simpler to implement — a flat AC modifier. Already implemented in `calculate-damage.post.ts`. Represents the most recent PTU design intent (2016 playtest).

### Option B: Core (evasion-based, melee only)
The user may not apply any form of Evasion to avoiding Melee attacks; the user ignores all forms of evasion when making Melee attack rolls. Only affects Melee. More complex to implement (evasion zeroing rather than AC modifier, melee-only filtering). Matches the official 1.05 core text.

### Option C: Hybrid
Mix elements from both versions (e.g., +3/-3 numbers but melee only). No official source supports this combination.

## Ruling

**The true master decrees: Use the 2016 playtest packet version of No Guard — +3 bonus to all Attack Rolls for the user, +3 bonus to all Attack Rolls against the user, affecting all attack types.**

The playtest version is simpler, already implemented, and represents the more recent design intent. The flat +3/-3 modifier maps cleanly to the existing AC system. This confirms current behavior — no code changes are required.

## Precedent

When PTU core and playtest packet definitions conflict for the same ability, the playtest version may be adopted via decree. Each ability conflict must be decreed individually — this ruling applies only to No Guard. The playtest packet is not errata and does not automatically override core text; a decree is required for each adoption.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: `app/server/api/encounters/[id]/calculate-damage.post.ts` (already correct), `app/server/services/living-weapon.service.ts` (isNoGuardActive already correct)
- Skills affected: All reviewers should cite decree-046 when reviewing No Guard behavior
