---
decree_id: decree-043
status: active
domain: combat
topic: living-weapon-skill-rank-gate
title: "Combat Skill Rank gates Living Weapon move access, not engagement"
ruled_at: 2026-03-03T08:45:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-042
implementation_tickets: []
tags: [combat, living-weapon, skill-rank, engagement, weapon-moves, honedge, doublade, aegislash]
---

# decree-043: Combat Skill Rank gates Living Weapon move access, not engagement

## The Ambiguity

PTU p.306 states the Living Weapon "may impart its wielder benefits as if it were a Simple or Fine Weapon, as long as the wielder has the requisite Combat Skill Rank." The design spec for feature-005 interpreted this as requiring a minimum Combat rank to engage (hold/wield) the Living Weapon at all (Novice for Simple, Adept for Fine). The game-logic reviewer (rules-review-270 HIGH #1) flagged this as inconsistent with PTU RAW weapon rules, which only gate move access, not wielding permission.

Source: decree-need-042, surfaced by rules-review-270 during feature-005 P0 review.

## Options Considered

### Option A: Gate moves only (PTU RAW)
Anyone can engage/wield a Living Weapon regardless of Combat rank. Skill rank only determines which weapon moves become available (Adept Combat for Simple weapon moves, Master Combat for Fine weapon moves). A trainer with Untrained Combat can still wield Honedge but won't gain access to Wounding Strike until Adept. This matches how normal weapons work in PTU — there is no minimum rank to hold a weapon, only to use its granted moves.

**Pros:** Consistent with normal weapon rules (p.287). More permissive gameplay. Separates "holding equipment" from "using techniques."
**Cons:** Slightly more complex — must track engagement separately from move availability.

### Option B: Gate engagement (current implementation)
Engagement itself requires minimum Combat rank (Novice for Simple, Adept for Fine). Trainers below the threshold cannot wield the Pokemon as a weapon at all. The "requisite Combat Skill Rank" phrasing could support reading engagement as requiring the rank.

**Pros:** Simpler implementation — one check blocks everything. More restrictive, arguably thematic.
**Cons:** Departs from how normal weapons work. No PTU weapon requires a minimum rank just to hold it.

## Ruling

**The true master decrees: Combat Skill Rank gates weapon move access only, not Living Weapon engagement. Any trainer can engage a willing Living Weapon regardless of Combat rank.**

Rationale:
- PTU p.287 defines weapon quality tiers (Crude, Simple, Fine) and states that Simple weapons "grant a single Move that can be used if the wielder has Adept Combat or higher." The rank gates the Move, not the wielding.
- The p.306 phrase "as long as the wielder has the requisite Combat Skill Rank" modifies "impart its wielder benefits as if it were a Simple or Fine Weapon" — meaning the weapon move benefits require the rank, not the act of wielding itself.
- No normal weapon in PTU requires a minimum rank to hold or equip. Crude weapons modify Struggle Attacks with zero rank requirement. Consistency demands Living Weapons follow the same pattern.
- Practically, a trainer wielding Honedge without sufficient Combat rank still gains the equipment slot overlay (Small Melee Weapon occupying mainHand) and Struggle Attack modifications from wielding a weapon — they just don't unlock Wounding Strike.

## Precedent

Weapon Skill Rank requirements in PTU gate **move access**, not **equipment permission**. Any trainer can hold/wield/equip any weapon; the Combat Skill Rank determines which weapon-granted Moves become available. This principle applies to both normal weapons and Living Weapons. When implementing weapon systems, separate the "equip/engage" action from the "move availability" check.

## Implementation Impact

- Tickets created: none — the fix is part of the feature-005 P0 fix cycle (rules-review-270 HIGH #1 already tracks this)
- Files affected: `app/server/services/living-weapon.service.ts` (remove rank check from `engageLivingWeapon`, defer rank gating to P1 move injection)
- Skills affected: Developer must remove the engagement rank gate during the feature-005 fix cycle. Reviewers should verify that the P1 move injection implementation gates moves by rank per this decree.
