---
id: decree-need-042
title: "Living Weapon Combat Skill Rank gate: block engagement or only gate move access?"
priority: P1
severity: HIGH
status: addressed
decree_id: decree-043
domain: combat
source: rules-review-270 HIGH #1
created_by: slave-collector (plan-20260303-074602)
created_at: 2026-03-03
affected_files:
  - app/server/services/living-weapon.service.ts
---

## Summary

The Living Weapon engage logic gates engagement behind Combat Skill Rank requirements (`Novice` for Simple weapons, `Adept` for Fine). However, PTU RAW (p.287) states that skill ranks gate **weapon move access**, not wielding permission.

## Problem

PTU p.287: "Simple Weapons grant a single Move that can be used if the wielder has **Adept Combat** or higher." PTU p.306: "the Living Weapon may impart its wielder benefits as if it were a Simple or Fine Weapon, **as long as the wielder has the requisite Combat Skill Rank.**"

Two valid interpretations:

**Option A (PTU RAW strict):** Anyone can engage (hold) a Living Weapon regardless of Combat rank. Skill rank only determines which weapon moves become available (P1 scope). A trainer with Untrained Combat can still wield Honedge but won't get Wounding Strike until Adept.

**Option B (design spec current):** Engagement itself requires minimum Combat rank (`Novice` for Simple, `Adept` for Fine). Trainers without sufficient rank cannot wield the weapon at all.

The design spec chose Option B, but the game-logic reviewer flagged this as a PTU RAW discrepancy. A human ruling is needed.

## Impact

Affects whether low-Combat-rank trainers can wield Living Weapons at all. The current implementation blocks engagement entirely below rank threshold.

## Notes

The "requisite Combat Skill Rank" phrasing in PTU p.306 is ambiguous — it could refer to the rank needed to use weapon moves, or a minimum rank to wield at all. Other weapon rules (p.287) only gate moves, not holding.
