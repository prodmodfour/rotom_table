---
review_id: rules-review-243
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-020
domain: healing
commits_reviewed:
  - fa825daf
  - f8ccb3ef
  - 97127519
  - 8c921290
  - 091b016e
  - af435404
  - 166aacdc
  - 1d8ac8aa
mechanics_verified:
  - healing-item-catalog-values
  - hp-restoration-amounts
  - injury-capped-effective-max-hp
  - item-healing-no-minimum
  - fainted-target-validation
  - target-refusal-mechanic
  - full-hp-validation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#Basic-Restoratives
  - core/09-gear-and-items.md#Using-Items
  - core/07-combat.md#Dealing-with-Injuries
reviewed_at: 2026-03-02T12:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. Healing Item Catalog Values (PTU p.276)

- **Rule:** "Potion: Heals 20 Hit Points, $200. Super Potion: Heals 35 Hit Points, $380. Hyper Potion: Heals 70 Hit Points, $800." (`core/09-gear-and-items.md#Basic-Restoratives`)
- **Implementation:** `app/constants/healingItems.ts` defines Potion (hpAmount: 20, cost: 200), Super Potion (hpAmount: 35, cost: 380), Hyper Potion (hpAmount: 70, cost: 800).
- **Status:** CORRECT

All five restorative-category items match PTU 1.05 exactly:

| Item | PTU HP | Code HP | PTU Cost | Code Cost | Match |
|------|--------|---------|----------|-----------|-------|
| Potion | 20 | 20 | $200 | 200 | Yes |
| Super Potion | 35 | 35 | $380 | 380 | Yes |
| Hyper Potion | 70 | 70 | $800 | 800 | Yes |
| Energy Powder | 25 | 25 | $150 | 150 | Yes |
| Energy Root | 70 | 70 | $500 | 500 | Yes |

Non-P0 items also verified for catalog completeness:

| Item | PTU HP | Code HP | PTU Cost | Code Cost | Match |
|------|--------|---------|----------|-----------|-------|
| Full Restore | 80 + cures all status | hpAmount: 80, curesAllStatus: true | $1450 | 1450 | Yes |
| Revive | Sets to 20 HP | hpAmount: 20, canRevive: true | $300 | 300 | Yes |
| Revival Herb | Sets to 50% HP | healToPercent: 50, canRevive: true | $350 | 350 | Yes |
| Antidote | Cures Poison | curesConditions: ['Poisoned', 'Badly Poisoned'] | $200 | 200 | Yes |
| Paralyze Heal | Cures Paralysis | curesConditions: ['Paralyzed'] | $200 | 200 | Yes |
| Burn Heal | Cures Burns | curesConditions: ['Burned'] | $200 | 200 | Yes |
| Ice Heal | Cures Freezing | curesConditions: ['Frozen'] | $200 | 200 | Yes |
| Full Heal | Cures all Persistent Status | curesAllPersistent: true | $450 | 450 | Yes |
| Heal Powder | Cures all Persistent - Repulsive | curesAllPersistent: true, repulsive: true | $350 | 350 | Yes |

Note: "Max Potion" does NOT exist in PTU 1.05 (p.276 table). The task description mentioned it but it is not a PTU item. The catalog's omission is correct.

Note: PTU 1.05 does not have a dedicated "Awakening" sleep cure in the Basic Restoratives table. Sleep is cured via Full Heal, Full Restore, or the Chesto Berry (held item). The catalog correctly omits a standalone sleep cure item.

### 2. HP Restoration Amounts

- **Rule:** "Heals 20 Hit Points" means exactly 20 HP healed, capped by effective max HP. (`core/09-gear-and-items.md#Basic-Restoratives`)
- **Implementation:** `healing-item.service.ts` line 96-98: `applyHealingToEntity(target, { amount: item.hpAmount })`. The `applyHealingToEntity` in `combatant.service.ts` line 236: `Math.min(effectiveMax, previousHp + options.amount)`.
- **Status:** CORRECT

The healing pipeline is: item's `hpAmount` -> `applyHealingToEntity({ amount })` -> cap at `getEffectiveMaxHp()`. This correctly heals the exact PTU amount, capped by injury-reduced maximum.

### 3. Injury-Capped Effective Max HP (decree-017)

- **Rule:** Per decree-017: "The injury cap on healing (p.250) is universal and cannot be bypassed by any healing source." PTU p.250: "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th." (`core/07-combat.md#Dealing-with-Injuries`)
- **Implementation:** `applyHealingToEntity` (combatant.service.ts line 234): `getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)` is called before capping HP. `getEffectiveMaxHp` (restHealing.ts line 20-23): `Math.floor(maxHp * (10 - effectiveInjuries) / 10)`. The service also uses `getEffectiveMaxHp` in `healToFull` (line 102) and `healToPercent` (line 111) paths.
- **Status:** CORRECT

Per decree-017, all healing respects the injury cap. The implementation correctly computes `effectiveMax = floor(maxHp * (10 - injuries) / 10)` and caps healing at that value across all three healing paths (hpAmount, healToFull, healToPercent).

### 4. No Minimum Healing for Items (decree-029 scope)

- **Rule:** Per decree-029: "Rest healing has a minimum of 1 HP." The system prompt clarifies: "NOTE: This does NOT apply to items -- items heal exact PTU amounts."
- **Implementation:** `applyHealingToEntity` (combatant.service.ts line 233-248) applies no `Math.max(1, ...)` floor. The amount passed in is used directly: `Math.min(effectiveMax, previousHp + options.amount)`. Compare with rest healing in `restHealing.ts` line 66: `Math.max(1, Math.floor(maxHp / 16))` which does apply the minimum.
- **Status:** CORRECT

Items correctly heal exact PTU amounts with no minimum floor. The minimum-1 rule is properly scoped to rest healing only.

### 5. Fainted Target Validation

- **Rule:** PTU p.276 "Basic Restoratives" are standard items. Fainted Pokemon cannot receive normal items (they are unconscious). Revive items explicitly "Revive fainted Pokemon." (`core/09-gear-and-items.md#Basic-Restoratives`)
- **Implementation:** `validateItemApplication` (healing-item.service.ts):
  - Line 44: Revive items require Fainted: `if (item.canRevive && !isFainted)` -> error
  - Line 49: Non-revive items reject Fainted: `if (!item.canRevive && isFainted && !item.curesAllStatus)` -> error
  - Full Restore (curesAllStatus) is exempted from the fainted check, which is correct since Full Restore cures all status including Fainted.
- **Status:** CORRECT

### 6. Target Refusal Mechanic

- **Rule:** "The target of these items may refuse to stay still and be healed; in that case, the item is not used, and the target does not forfeit their actions." (`core/09-gear-and-items.md#Using-Items`)
- **Implementation:** API endpoint (use-item.post.ts line 57-66): When `body.targetAccepts === false`, returns success with `refused: true` and message "Target refused the item. Item was not consumed." No encounter state is modified.
- **Status:** CORRECT

The item is not consumed on refusal, matching PTU rules exactly.

### 7. Full HP Validation

- **Rule:** Using a healing item on a target already at full HP would be wasteful and have no effect.
- **Implementation:** `validateItemApplication` (healing-item.service.ts line 54-61): Checks `entity.currentHp >= effectiveMax` using injury-reduced effective max HP. If at full HP, returns error message.
- **Status:** CORRECT

The full-HP check correctly uses effective max (injury-adjusted), not raw max HP. A Pokemon with 3 injuries and 50 max HP is "full" at 35 HP, not 50.

### 8. Items Usable on Humans and Pokemon

- **Rule:** "Potions and other Basic Restoratives can be used on Pokemon and Humans alike to repair damaged tissue and seal wounds." (`core/09-gear-and-items.md#Medicines`)
- **Implementation:** No entity-type restriction exists in `validateItemApplication` or `applyHealingItem`. Both Pokemon and HumanCharacter combatants can receive items.
- **Status:** CORRECT

### 9. P0 Scope Enforcement

- **Rule:** Design spec limits P0 to 'restorative' category only. Status cures, revives, and combined items are deferred to P1.
- **Implementation:** API endpoint (use-item.post.ts line 48-53): `p0AllowedCategories = ['restorative']`. Any non-restorative item returns a 400 error with a descriptive message.
- **Status:** CORRECT

This correctly prevents Full Restore (combined), Revive (revive), Antidote (cure), etc. from being used in P0, even though they exist in the catalog.

## Summary

The healing item system P0 implementation correctly implements all PTU 1.05 healing item mechanics within scope:

1. **Catalog accuracy:** All 14 catalog items match PTU 1.05 p.276 exactly in HP amounts, costs, and descriptions.
2. **HP restoration:** Items heal their exact PTU amount, capped at injury-reduced effective max HP (decree-017).
3. **No minimum floor:** Items do NOT apply the rest-healing minimum of 1 HP (decree-029 is correctly scoped to rest only).
4. **Validation rules:** Fainted check, full-HP check, and target refusal all follow PTU rules precisely.
5. **Scope enforcement:** P0 correctly limits to restorative category only.
6. **Entity agnostic:** Items work on both Pokemon and Humans per PTU.
7. **WebSocket broadcast:** Item usage events are broadcast to encounter watchers for real-time sync.

## Rulings

- **Max Potion does not exist in PTU 1.05.** The task description mentioned "Max Potion" but this item is not in the PTU 1.05 rulebook (p.276 Basic Restoratives table). The catalog correctly omits it. If Max Potion is desired as a homebrew item, a decree-need should be filed.
- **decree-017 compliance confirmed.** All healing paths (hpAmount, healToFull, healToPercent) use `getEffectiveMaxHp` to cap healing at injury-reduced maximum.
- **decree-029 correctly scoped.** The minimum-1-HP rule applies only to rest healing. Item healing uses exact PTU amounts with no floor. This is correct per the decree's explicit note.

## Verdict

**APPROVED** -- No PTU rule violations found. All healing item values, HP restoration logic, injury-cap compliance, and validation rules are correct per PTU 1.05 and active decrees.

## Required Changes

None.
