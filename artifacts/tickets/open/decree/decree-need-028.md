---
id: decree-need-028
title: "Rest healing minimum: should floor(maxHp/16) = 0 heal at least 1 HP?"
priority: P3
severity: MEDIUM
category: decree-need
source: healing audit A1 (plan-20260228-072000 slave-3)
created_by: slave-collector (plan-20260228-093200)
created_at: 2026-02-28
---

## Summary

PTU p.252 says Pokemon "heal 1/16th of their Maximum Hit Points" during rest. The code uses `Math.floor(maxHp / 16)`, which produces **0** for any Pokemon with maxHp < 16. Should there be a minimum healing amount of 1 HP per rest period?

## The Ambiguity

PTU does not specify a minimum healing amount. The strict reading of "1/16th" with floor rounding means very low-HP Pokemon heal nothing from rest.

## Interpretations

**A) No minimum (strict reading):**
PTU says floor, so `floor(15/16) = 0`. A low-HP Pokemon simply doesn't benefit from rest healing. The GM can use Pokemon Center healing instead.

**B) Minimum 1 HP (common sense):**
Rest should always provide some healing. A minimum of 1 HP per rest period ensures rest is never completely useless. Most tabletop groups would house-rule this anyway.

## Affected Code

- `app/utils/restHealing.ts` — natural healing calculation
- `app/server/api/characters/[id]/rest.post.ts` — rest endpoint

## PTU Reference

- PTU Core p.252: "heal 1/16th of their Maximum Hit Points"

## Impact

Low — only affects Pokemon with very low base HP (e.g., Shedinja with 1 base HP → maxHp 14 at level 1). Most Pokemon have maxHp >= 16 by mid-levels.
