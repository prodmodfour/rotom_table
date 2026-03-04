---
review_id: rules-review-260
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-020
domain: healing
commits_reviewed:
  - f6303ee0
  - 4950bbe1
  - 23cef0e8
  - 5c87d511
mechanics_verified:
  - revive-hp-guard
  - awakening-decree-compliance
  - status-cure-resolution
  - revive-fainted-removal
  - combined-item-order
  - injury-cap-healing
  - item-catalog-accuracy
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#Basic-Restoratives
  - core/07-combat.md#Fainting
  - core/11-running-the-game.md#Pharmacy
  - core/04-trainer-classes.md#Restorative-Science
reviewed_at: 2026-03-02T19:45:00Z
follows_up: rules-review-254
---

## Previous Review Issues (rules-review-254)

| ID | Severity | Issue | Fix Commit | Status |
|----|----------|-------|------------|--------|
| H1 | HIGH | Awakening item not in PTU 1.05 ch9 p.276 gear table | 4950bbe1 | RESOLVED via decree-041 |

## Fix Verification

### Fix 1: Revive Math.max(1,...) HP Guard (f6303ee0)

**Original issue (code-review-278 M1):** The Revive branch used `Math.min(item.hpAmount, effectiveMax)` without a minimum-1 floor. At extreme injuries (e.g., 10 injuries on a low-HP Pokemon), `effectiveMax` could reach 0, causing Revive to set HP to 0 -- logically absurd for a revival item.

**Rule:** "Revives fainted Pokemon and sets to 20 Hit Points" (`core/09-gear-and-items.md`, p.276)

**Implementation after fix (healing-item.service.ts:245):**
```typescript
entity.currentHp = Math.max(1, Math.min(item.hpAmount, effectiveMax))
```

**Verification:** The fix wraps the existing `Math.min(item.hpAmount, effectiveMax)` with `Math.max(1, ...)`, ensuring a Revive always restores at least 1 HP. The Revival Herb path (line 249) already had the same `Math.max(1, ...)` guard. Both revive paths are now consistent.

PTU does not specify what happens when a Revive is used on a Pokemon with 10 injuries (effectiveMax=0). The minimum 1 HP guard is a reasonable implementation choice -- a revive item that leaves a Pokemon at 0 HP would be contradictory. This does not conflict with any PTU text.

**Status: CORRECT**

### Fix 2: Decree-041 Comment on Awakening (4950bbe1)

**Original issue (rules-review-254 H1 + code-review-278 M2):** Awakening at $200 is absent from the PTU 1.05 ch9 p.276 gear table. The previous review flagged this as non-RAW and recommended removal or decree authorization.

**Resolution:** decree-041 (ruled 2026-03-02) established that the ch9 omission is an editing error, citing:
- PTU 1.05 ch11 (Running the Game, Pharmacy stock list): "Commonly: Candy Bars, Potions, Antidotes, **Awakenings**, Burn Heals, Ice Heals, First Aid Kit, Chemistry Set, Repels" (p.276, line 3140)
- PTU 1.05 ch4 (Trainer Classes, Apothecary -- Restorative Science recipe): "You create an Antidote, Paralyze Heal, **Awakening**, Burn Heal, Ice Heal, or Potion." (p.141, line 4207)

**Implementation after fix (healingItems.ts:107):**
```typescript
// per decree-041: Awakening confirmed as standard cure item despite ch9 table omission
'Awakening': {
```

**Verification:** I confirmed both PTU cross-references in the source material. The decree-041 ruling is properly cited in the code comment. The Awakening item definition is correct:
- Category: `cure` -- CORRECT (targets specific conditions)
- Cures: `['Asleep', 'Bad Sleep']` -- CORRECT (Awakening cures Sleep; Bad Sleep is cured when Sleep is cured per PTU p.247)
- Cost: $200 -- CORRECT per decree-041 (matches all other single-condition cures)
- The `resolveConditionsToCure` function correctly resolves Awakening via the `curesConditions` path (specific named conditions), not the `curesAllPersistent` path, so it correctly targets these volatile conditions by name.

Per decree-041, this approach was ruled correct. Reviewers should cite this decree and stop flagging Awakening as non-RAW.

**Status: CORRECT (per decree-041)**

### Fix 3: App-Surface.md Update (23cef0e8)

**Original issue (code-review-278 H1):** The app-surface.md documentation did not reflect P1 additions (item count still 14, missing `resolveConditionsToCure`, endpoint description lacked P1 scope).

**Changes verified:**
1. Item count updated from 14 to 15 -- CORRECT (I verified: 3 restoratives + 6 cure items + 1 combined + 1 revive + 4 repulsive variants = 15)
2. Added `resolveConditionsToCure` to the exported function list -- CORRECT (this function is exported from `healingItems.ts` and re-exported from `healing-item.service.ts`)
3. Endpoint description updated to include "P1: status cure, revive, combined, repulsive" -- CORRECT
4. Added decree-041 reference for Awakening, grouped categories, repulsive badge -- CORRECT

**Status: CORRECT**

### Fix 4: Resolution Log Update (5c87d511)

Documentation-only commit recording the fix cycle. No PTU mechanics impact.

**Status: N/A (documentation)**

## Mechanics Verified

### Revive HP Restoration
- **Rule:** "Revives fainted Pokemon and sets to 20 Hit Points" (`core/09-gear-and-items.md`, p.276)
- **Implementation:** `hpAmount: 20, canRevive: true`. Removes Fainted status, then sets HP to `Math.max(1, Math.min(20, effectiveMax))`.
- **Status:** CORRECT

### Revival Herb HP Restoration
- **Rule:** "Revives Pokemon and sets to 50% Hit Points - Repulsive" (`core/09-gear-and-items.md`, p.276)
- **Implementation:** `healToPercent: 50, canRevive: true, repulsive: true`. Sets HP to `Math.max(1, Math.floor(effectiveMax * 50 / 100))`.
- **Status:** CORRECT

### Awakening Sleep Cure
- **Rule:** Awakening confirmed by ch11 Pharmacy stock list and ch4 Restorative Science recipe. Per decree-041, ch9 table omission is an editing error.
- **Implementation:** `category: 'cure', curesConditions: ['Asleep', 'Bad Sleep'], cost: 200`
- **Status:** CORRECT (per decree-041)

### Status Cure Resolution (resolveConditionsToCure)
- **Rule:** Items cure specific conditions or condition categories as described on p.276
- **Implementation:** Three-tier priority: (1) `curesAllStatus` clears all except Fainted/Dead, (2) `curesAllPersistent` clears persistent only (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned), (3) `curesConditions` clears specific named conditions
- **Status:** CORRECT -- persistent vs volatile distinction accurately reflects PTU p.246-247

### Combined Item (Full Restore)
- **Rule:** "Heals a Pokemon for 80 Hit Points and cures any Status Afflictions" ($1450, `core/09-gear-and-items.md`, p.276)
- **Implementation:** `category: 'combined', hpAmount: 80, curesAllStatus: true`. Application order: cure conditions first, then heal HP.
- **Status:** CORRECT -- cures-first ordering ensures CS reversal occurs before HP healing, which is the correct interaction

### Injury Cap on All Healing
- **Rule:** Each injury reduces max HP by 1/10th (`core/09-gear-and-items.md`, via `getEffectiveMaxHp`)
- **Implementation:** All HP healing paths (restorative, combined, revive) use `getEffectiveMaxHp(maxHp, injuries)` to cap healing at injury-reduced maximum, per decree-017
- **Status:** CORRECT

### Item Catalog Values
All 15 items verified against PTU 1.05 p.276:

| Item | HP | Cost | PTU Match |
|------|-----|------|-----------|
| Potion | 20 | $200 | Yes |
| Super Potion | 35 | $380 | Yes |
| Hyper Potion | 70 | $800 | Yes |
| Antidote | -- | $200 | Yes |
| Paralyze Heal | -- | $200 | Yes |
| Burn Heal | -- | $200 | Yes |
| Ice Heal | -- | $200 | Yes |
| Awakening | -- | $200 | Yes (decree-041) |
| Full Heal | -- | $450 | Yes |
| Full Restore | 80 | $1450 | Yes |
| Revive | 20 | $300 | Yes |
| Energy Powder | 25 | $150 | Yes |
| Energy Root | 70 | $500 | Yes |
| Heal Powder | -- | $350 | Yes |
| Revival Herb | 50% | $350 | Yes |

## Decree Compliance

| Decree | Topic | Compliance |
|--------|-------|------------|
| decree-005 | Status CS auto-apply/reversal | CORRECT -- cure items delegate to `updateStatusConditions()` which handles CS reversal with source tracking |
| decree-017 | Effective max HP cap | CORRECT -- all HP healing paths use `getEffectiveMaxHp` |
| decree-029 | Rest healing minimum 1 HP | CORRECT -- minimum 1 HP guard applied only to revive items (edge case), not to all item healing (rest-specific rule) |
| decree-041 | Awakening at $200 | CORRECT -- Awakening present in catalog with decree comment, $200 cost |

## Summary

All four issues from the previous review cycle (code-review-278 H1+M1+M2, rules-review-254 H1) have been resolved:

1. **Revive Math.max(1,...) guard (M1):** Both Revive and Revival Herb now have consistent minimum 1 HP floors. The fix is a 2-line change in `applyReviveItem` that wraps the existing cap with `Math.max(1, ...)`.

2. **Awakening decree-041 comment (M2 + rules-H1):** The Awakening entry now has a clear decree citation comment. The decree ruling is well-supported by two independent PTU cross-references (ch11 Pharmacy, ch4 Restorative Science) confirming the item's intended existence.

3. **App-surface.md update (H1):** The documentation now accurately reflects 15 items, P1 capabilities, `resolveConditionsToCure` export, and decree-041 reference.

4. **Resolution log (informational):** Fix cycle commits properly documented.

The underlying P1 implementation (status cures, revives, combined items, repulsive variants) was already verified as PTU-correct in rules-review-254. This re-review confirms the fix cycle resolved all outstanding issues without introducing new problems.

## Verdict

**APPROVED**

No remaining PTU correctness issues. All previous review findings resolved. All 15 healing items match PTU 1.05 values. Decree compliance verified for decree-005, decree-017, decree-029, and decree-041.
