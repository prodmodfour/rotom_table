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
files_reviewed:
  - app/server/api/encounters/[id]/calculate-damage.post.ts
  - app/composables/useMoveCalculation.ts
  - app/utils/equipmentBonuses.ts
  - app/constants/equipment.ts
  - books/markdown/core/09-gear-and-items.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-23T06:30:00Z
follows_up: null
---

## Review Scope

Verifying that the helmet conditional DR fix matches PTU 1.05 rules (p.293) and that server/client parity is restored for this mechanic.

## PTU Rule Reference

**PTU p.293 (09-gear-and-items.md line 1684-1687):**
> Helmet
> The user gains 15 Damage Reduction against Critical Hits. The user resists the Moves Headbutt and Zen Headbutt and can't be flinched by these Moves.
> $2,250

Key properties:
1. **15 Damage Reduction** -- flat DR value
2. **Against Critical Hits only** -- conditional, only applies on crits
3. **Stacks with other equipment** -- PTU does not state Helmet DR replaces other DR sources. DR from different equipment items stacks additively (Armor DR + Helmet DR on a crit)
4. **No cap mentioned** -- there is no rule stating a DR cap that would prevent stacking

## Rule Compliance Verification

### 1. Helmet DR Value: CORRECT

Equipment catalog (`app/constants/equipment.ts` line 39):
```typescript
conditionalDR: { amount: 15, condition: 'Critical Hits only' }
```
Matches PTU p.293: "15 Damage Reduction against Critical Hits."

### 2. Conditional Trigger (Critical Hits Only): CORRECT

**Server (calculate-damage.post.ts lines 184-189):**
```typescript
if (body.isCritical && targetEquipBonuses) {
  for (const cdr of targetEquipBonuses.conditionalDR) {
    if (cdr.condition === 'Critical Hits only') {
      effectiveDR = (effectiveDR ?? 0) + cdr.amount
    }
  }
}
```

**Client (useMoveCalculation.ts lines 451-456):**
```typescript
if (isCriticalHit.value) {
  for (const cdr of equipBonuses.conditionalDR) {
    if (cdr.condition === 'Critical Hits only') {
      equipmentDR += cdr.amount
    }
  }
}
```

Both correctly gate on the critical hit flag. Both iterate through conditional DR entries and match on the condition string. Both add the amount additively on top of existing DR.

### 3. DR Stacking Behavior: CORRECT

PTU does not prohibit stacking DR from different equipment sources. A character wearing both Light Armor (5 DR) and a Helmet should receive:
- Non-crit: 5 DR (armor only)
- Crit: 5 + 15 = 20 DR (armor + helmet)

**Server behavior after fix:**
- `effectiveDR` = `equipBonuses.damageReduction` (5 from armor)
- Helmet block adds 15 on crit: `effectiveDR` = 20

**Client behavior (unchanged):**
- `equipmentDR` = `equipBonuses.damageReduction` (5 from armor)
- Helmet block adds 15 on crit: `equipmentDR` = 20

Both produce 20 DR. CORRECT.

### 4. Manual DR Override + Helmet Stacking: CORRECT

The fix's key change is that when a GM provides a manual DR override (e.g., body.damageReduction = 10 for a custom scenario), the helmet +15 still applies on a crit. This is the correct behavior because:
- The manual override replaces the base equipment DR (GM judgment call)
- The helmet conditional DR is a separate conditional effect that should still trigger
- PTU has no rule suggesting a manual DR adjustment should suppress equipment conditional effects
- The GM can always set manual DR to account for the helmet if they want, but the system should not silently drop it

### 5. Human-Only Application: CORRECT

Both server and client correctly restrict equipment processing to human characters only:
- Server: `target.type === 'human'` guard for computing `targetEquipBonuses` (line 176)
- Client: `target.type === 'human'` guard at line 445

Pokemon do not wear equipment in PTU. This is correct.

### 6. Server/Client Parity: RESTORED

Before the fix, there was a parity gap:
- Server: manual DR override caused helmet DR to be silently dropped
- Client: no manual override concept, helmet DR always applied

After the fix, both paths consistently apply helmet DR on crits regardless of the DR source. The manual override path exists only on the server (GM API feature), which is correct by design -- the client computes damage locally for display, while the server is authoritative for applied damage.

## What Looks Good

1. The fix correctly separates the unconditional equipment DR (armor) from the conditional equipment DR (helmet on crits) into independent evaluation blocks.
2. The condition string matching (`'Critical Hits only'`) is consistent across catalog, server, and client.
3. The fix preserves the existing rule compliance for all non-helmet equipment (armor, shields, focus items) -- no regressions.

## Verdict

**APPROVED.** The fix correctly implements PTU p.293 helmet DR mechanics. Helmet +15 DR on critical hits now stacks properly with both equipment-derived DR and manual GM overrides. Server/client parity is restored.

## Required Changes

None.
