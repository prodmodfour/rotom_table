---
review_id: rules-review-126
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-079
domain: combat
commits_reviewed:
  - d0ab030
  - 126879e
mechanics_verified:
  - helmet-conditional-dr
  - dr-stacking
  - server-client-parity
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - 09-gear-and-items.md#page-293
  - 07-combat.md#page-244
  - errata-2.md
reviewed_at: 2026-02-23T06:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Helmet Conditional DR Value
- **Rule:** "The user gains 15 Damage Reduction against Critical Hits. The user resists the Moves Headbutt and Zen Headbutt and can't be flinched by these Moves." (`09-gear-and-items.md` p.293, lines 1684-1686)
- **Implementation:** Equipment catalog defines `conditionalDR: { amount: 15, condition: 'Critical Hits only' }` (`app/constants/equipment.ts` line 39). The `computeEquipmentBonuses()` utility collects this into the `conditionalDR[]` array (`app/utils/equipmentBonuses.ts` lines 53-55). Both server and client iterate this array and match on `cdr.condition === 'Critical Hits only'` to add `cdr.amount` (15) to DR.
- **Status:** CORRECT

### 2. Conditional Trigger (Critical Hits Only)
- **Rule:** "15 Damage Reduction against Critical Hits" -- the DR is conditional, only applying on critical hit attacks (`09-gear-and-items.md` p.293)
- **Implementation:** Server (`calculate-damage.post.ts` line 184): `if (body.isCritical && targetEquipBonuses)`. Client (`useMoveCalculation.ts` line 451): `if (isCriticalHit.value)`. Both correctly gate helmet DR behind the critical hit flag. Non-critical hits receive no helmet DR.
- **Status:** CORRECT

### 3. DR Stacking (Armor + Helmet)
- **Rule:** PTU p.293 lists Helmet as head equipment and body armor as body equipment -- different equipment slots. The damage formula (07-combat.md p.244, step 7) says "Subtract relevant defense stat and damage reduction" as a single aggregated subtraction. There is no rule text prohibiting stacking DR from different equipment items. Errata-2 revises armor DR values but does NOT modify Helmet or introduce stacking restrictions.
- **Implementation:** Server resolves `effectiveDR` from equipment base DR (armor), then independently adds helmet conditional DR on crits: `effectiveDR = (effectiveDR ?? 0) + cdr.amount`. Client does the same: `equipmentDR = equipBonuses.damageReduction` then `equipmentDR += cdr.amount`. For Light Armor (5 DR) + Helmet on a crit: both produce 5 + 15 = 20 DR. On a non-crit: both produce 5 DR.
- **Status:** CORRECT

### 4. DR Stacking (Manual Override + Helmet)
- **Rule:** Manual DR override is a GM convenience feature (not a PTU mechanic). The Helmet rule says "15 Damage Reduction against Critical Hits" unconditionally -- there is no exception for "unless DR comes from a manual override." The GM can always adjust the manual DR value if they want to account for helmet DR themselves, but the system should not silently drop it.
- **Implementation (pre-fix, BROKEN):** The helmet check was nested inside `if (effectiveDR === undefined && targetEquipBonuses)`, meaning when the GM provided `body.damageReduction`, `effectiveDR` was defined, so the entire block -- including the helmet check -- was skipped.
- **Implementation (post-fix, CORRECT):** The helmet check is now its own independent block at lines 182-190: `if (body.isCritical && targetEquipBonuses)`. This runs regardless of whether `effectiveDR` came from manual override or equipment computation. The `(effectiveDR ?? 0)` pattern safely handles the edge case where no prior DR exists.
- **Status:** CORRECT

### 5. Human-Only Application
- **Rule:** Pokemon do not wear Trainer equipment in PTU. Equipment is a Trainer-only system (09-gear-and-items.md p.286).
- **Implementation:** Server: `targetEquipBonuses` is `null` for Pokemon (line 176-178: only computed when `target.type === 'human'`). The helmet DR block guards with `&& targetEquipBonuses`, so Pokemon targets never receive helmet DR. Client: `target.type === 'human'` guard at line 445.
- **Status:** CORRECT

### 6. Server/Client Parity
- **Rule:** The server endpoint (`calculate-damage.post.ts`) and client composable (`useMoveCalculation.ts`) should produce identical damage results for the same inputs.
- **Implementation:** Before the fix, the server silently dropped helmet DR when a manual override was provided, while the client (which has no manual override concept) always applied it. After the fix, both paths consistently apply helmet DR on crits for human targets with a helmet equipped. The manual override path exists only on the server (GM API feature), which is correct by design.
- **Status:** CORRECT -- parity restored

### 7. Errata Check
- **Rule:** Errata-2 revises some DR sources: Light Armor split into Physical/Special variants (5 DR each), Heavy Armor reduced to 5 DR. However, the errata makes NO changes to Helmet.
- **Implementation:** The codebase uses the core rulebook value for Helmet (15 DR vs critical hits). No errata override needed.
- **Status:** CORRECT -- errata does not affect this mechanic

## Summary

The fix correctly addresses the bug where helmet conditional DR (+15 on critical hits) was skipped when the GM provided a manual `damageReduction` override via the server API. The root cause was structural: the helmet check was nested inside the equipment-only DR branch, so it was unreachable when the manual override path was taken.

The fix separates the helmet conditional DR into its own independent block that runs regardless of how base DR was resolved. The `(effectiveDR ?? 0)` pattern safely handles the edge case where no prior DR exists at all.

The PTU rulebook (p.293) states "The user gains 15 Damage Reduction against Critical Hits" with no exceptions or stacking restrictions. The errata does not modify this rule. The implementation now correctly reflects this unconditional application.

## Rulings

1. **Helmet DR is unconditional on critical hits.** PTU p.293 does not restrict or exclude stacking with other DR sources. The fix correctly stacks helmet DR on top of both manual override and equipment-based DR.
2. **The errata does not modify Helmet.** While the errata revises Light Armor and Heavy Armor DR values, Helmet is untouched. The 15 DR value and critical-hit-only condition stand as written in the core rulebook.
3. **Conditional DR is additive.** The PTU damage formula (07-combat.md p.244, step 7) subtracts total DR as a single value. Helmet's conditional DR adds to any existing DR -- it does not replace it.
4. **Manual DR override does not suppress equipment conditional effects.** The manual override replaces base equipment DR (GM judgment), but conditional effects like Helmet should still trigger independently.

## Verdict

**APPROVED.** The fix correctly implements PTU p.293 helmet DR mechanics. Helmet +15 DR on critical hits now stacks properly with both equipment-derived DR and manual GM overrides. Server/client parity is restored. No game logic issues found.

## Required Changes

None.
