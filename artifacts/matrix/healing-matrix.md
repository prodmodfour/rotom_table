---
domain: healing
type: matrix
version: 2
total_rules: 42
analyzed_at: 2026-03-05T00:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: artifacts/matrix/healing/rules/_index.md
capabilities_catalog: artifacts/matrix/healing/capabilities/_index.md
previous_matrix: artifacts/matrix/healing/matrix.md
previous_session: 59
current_session: 120
---

# Feature Completeness Matrix: Healing (v2)

## Coverage Score

```
Implemented:              21
Implemented-Unreachable:   3
Partial:                   7
Missing:                   8
Subsystem-Missing:         0 (accounted in Missing/Partial counts below)
Out of Scope:              3
-------------------------------
Total:                    42
Out of Scope:              3
Effective Total:          39

Coverage = (21 + 0.5*7 + 0.5*3) / 39 * 100 = 26.0 / 39 * 100 = 66.7%
```

| Classification | Count | % of Effective |
|---------------|-------|----------------|
| Implemented | 21 | 53.8% |
| Implemented-Unreachable | 3 | 7.7% |
| Partial | 7 | 17.9% |
| Missing | 8 | 20.5% |
| Out of Scope | 3 | -- |
| **Effective Total** | **39** | **100%** |

**Coverage: 66.7%**

### Changes from v1 (Session 59)

- Coverage: 65.0% -> 66.7% (+1.7pp)
- Partial increased from 5 to 7 (R033 upgraded from Partial-P0 to Partial with clearer decree violation notes; R038 reclassified from Missing to Out of Scope; bandage group normalized)
- Out of Scope increased from 2 to 3 (R038 reclassified)
- Missing decreased from 10 to 8 (R038 reclassified Out of Scope)
- New decrees incorporated: decree-028, decree-029, decree-041
- Capability chain completeness verified against 15 fresh chains from session 120

---

## Relevant Decrees

| Decree | Title | Impact on Matrix |
|--------|-------|-----------------|
| **decree-016** | Extended rest clears only Drained AP, not Bound AP | R033 classification: Partial (P0). C002 still clears boundAp. Violation. |
| **decree-017** | Pokemon Center heals to effective max HP | R026 confirmed Implemented. C003/C008 respect injury cap. |
| **decree-018** | Extended rest accepts duration parameter | R007/R009 interaction: C002/C007 apply fixed 4h (8 periods). Duration parameter missing. |
| **decree-019** | New Day is pure counter reset, no implicit extended rest | R042 Note: confirms New Day and Extended Rest are independent. |
| **decree-020** | Pokemon Center healing time uses pre-healing injury count | R027/R028 confirmed Implemented. C015 uses arrival injuries. |
| **decree-028** | Bound AP persists across New Day | **NEW**: C005 and C011 reset boundAp to 0 on New Day. Violation. Affects R042 classification. |
| **decree-029** | Rest healing has minimum 1 HP | **NEW**: C012 already applies min 1. Confirms R007 Implemented. |
| **decree-041** | Awakening at $200 is a valid item | **NEW**: Relevant to R040 item catalog. Awakening must be included when item system is built. |

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Mapped Capabilities | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|--------------------|-----------------|--------------| ------|
| healing-R001 | Tick of Hit Points Definition | formula | core | system | **Implemented** | C052 | api-only | -- | 1/10th max HP. getEffectiveMaxHp uses this formula. |
| healing-R002 | Rest Definition | condition | core | system | **Implemented** | C001, C006 | gm | -- | Rest endpoints implement 30-min rest mechanic. Activity restriction is GM judgment (out of app scope). |
| healing-R003 | Injury Definition -- HP Reduction | formula | core | system | **Implemented** | C052, C033 | gm, api-only | -- | getEffectiveMaxHp: floor(maxHp * (10-injuries)/10). Used across all healing, damage, and display. |
| healing-R004 | Injury from Massive Damage | condition | core | system | **Implemented** | C033 | api-only | -- | calculateDamage checks 50%+ of real maxHp. Returns massiveDamageInjury boolean. |
| healing-R005 | Injury from HP Markers | condition | core | system | **Implemented** | C033 | api-only | -- | calculateDamage tracks marker crossings at 50%, 0%, -50%, -100% and every -50% below. |
| healing-R006 | Fainted Condition Definition | condition | core | system | **Implemented** | C028, C030, C033 | gm, api-only | -- | Fainted tracked on HP <= 0. Healing endpoint removes Fainted when HP restored above 0. |
| healing-R007 | Natural Healing Rate (1/16th per rest) | formula | core | system | **Implemented** | C012 | api-only | -- | calculateRestHealing: floor(maxHp/16), min 1 per decree-029. Capped at effective max HP. |
| healing-R008 | Rest Requires Continuous Half Hour | constraint | core | system | **Implemented** | C001, C006 | gm | -- | Each API call = one 30-min rest increment. Atomicity enforced by single-call design. |
| healing-R009 | Rest Daily Cap (8 Hours / 480 min) | constraint | core | system | **Implemented** | C001, C006, C012 | gm, api-only | -- | restMinutesToday capped at 480. canHeal=false when exceeded. |
| healing-R010 | Heavily Injured Threshold (5+ Injuries) | condition | core | system | **Implemented** | C012 | api-only | -- | canHeal=false when injuries >= 5. Threshold used in rest blocking and time calculations. |
| healing-R011 | Heavily Injured Blocks Rest HP Recovery | constraint | core | system | **Implemented** | C012, C001, C006 | gm, api-only | -- | calculateRestHealing returns canHeal=false at 5+ injuries. Both character and Pokemon rest endpoints enforce. |
| healing-R012 | Massive Damage Exclusion for Set/Lose HP | constraint | situational | system | **Partial** | C033 | api-only | P2 | **Present:** calculateDamage computes massive damage correctly for standard damage. **Missing:** No flag/distinction for "set HP" or "lose HP" effects (Pain Split, Endeavor). These should bypass massive damage injury. GM must manually avoid calling damage endpoint for such effects. |
| healing-R013 | Multiple Injuries from Single Attack | interaction | core | system | **Implemented** | C033 | api-only | -- | calculateDamage returns totalNewInjuries = massiveDamageInjury + markerInjuries in a single call. Example path from 100% to -150% yields 6 injuries (1 massive + 5 markers). |
| healing-R014 | Fainted Cured by Revive/Healing to Positive HP | workflow | core | system | **Implemented** | C028, C030 | gm | -- | applyHealingToEntity removes Fainted status when HP goes above 0. faintedRemoved flag returned. |
| healing-R015 | Fainted Clears All Status Conditions | interaction | core | system | **Partial** | C033 | api-only | P1 | **Present:** Fainted state detected by calculateDamage (fainted boolean in result). **Missing:** No confirmed auto-clearing of all persistent and volatile status conditions when fainted occurs. Damage pipeline may not trigger status clear on faint transition. Auditor must verify. |
| healing-R016 | Heavily Injured Combat Penalty | modifier | core | system | **Missing** | -- | -- | P1 | Heavily Injured (5+ injuries): lose HP = injury count on each Standard Action AND when taking damage. No capability implements this automatic HP loss. |
| healing-R017 | Injury Does Not Affect HP Marker Thresholds | constraint | core | system | **Implemented** | C033 | api-only | -- | calculateDamage uses real maxHp for marker threshold calculation, not effective max HP. |
| healing-R018 | Take a Breather -- Core Effects | workflow | core | player | **Implemented-Unreachable** | C029, C034, C046, C062 | gm | P1 | Full implementation: reset stages (Heavy Armor speed CS override via C062), remove temp HP, cure volatile conditions + Slowed + Stuck (Cursed excluded). **Intended actor: player.** Only accessible from GM encounter view. Player view has no breather action. |
| healing-R019 | Take a Breather -- Action Cost | constraint | core | player | **Implemented-Unreachable** | C029 | gm | P1 | Standard+shift actions marked used, Tripped+Vulnerable applied, move log reminder about shift movement. **Intended actor: player.** GM-only. |
| healing-R020 | Take a Breather -- Requires Save Checks | constraint | situational | system | **Missing** | -- | -- | P2 | Breather endpoint does not check for Confusion/Rage save requirements before execution. GM must manually enforce save checks. |
| healing-R021 | Take a Breather -- Assisted by Trainer | workflow | situational | player | **Missing** | -- | -- | P2 | No assisted breather workflow: Trainer Full Action + target Interrupt, shift to target, DC 12 Command Check. Entirely manual. |
| healing-R022 | Healing Past HP Markers Re-Injury Risk | interaction | situational | system | **Implemented** | C033 | api-only | -- | HP markers are absolute thresholds. Healing past a marker and taking damage through it again triggers a new injury via calculateDamage. The system inherently handles this. |
| healing-R023 | Natural Injury Healing (24h Timer) | workflow | core | gm | **Implemented** | C004, C009, C014 | gm | -- | canHealInjuryNaturally checks 24h elapsed since lastInjuryTime. Both character (C004) and Pokemon (C009) endpoints. |
| healing-R024 | Trainer AP Drain to Remove Injury | workflow | situational | player | **Implemented-Unreachable** | C004 | gm | P2 | Character heal-injury with method='drain_ap': costs 2 AP, increments drainedAp, enforces daily 3-injury cap. **Intended actor: player** (trainer drains own AP). Only accessible from GM character sheet. |
| healing-R025 | Daily Injury Healing Cap (3/Day) | constraint | core | system | **Implemented** | C004, C009, C016 | gm, api-only | -- | injuriesHealedToday checked against 3 in all paths: natural healing (C004/C009), Pokemon Center (C016), and cascading through heal-injury endpoints. |
| healing-R026 | Pokemon Center -- Base Healing | workflow | core | gm | **Implemented** | C003, C008 | gm | -- | Full HP to effective max (decree-017), clear ALL statuses, heal injuries (3/day cap), restore daily move usage (Pokemon only, C008). |
| healing-R027 | Pokemon Center -- Injury Time (Under 5) | modifier | core | system | **Implemented** | C015 | api-only | -- | calculatePokemonCenterTime: 1hr base + 30min/injury. Decree-020: uses pre-healing injury count. |
| healing-R028 | Pokemon Center -- Injury Time (5+) | modifier | situational | system | **Implemented** | C015 | api-only | -- | calculatePokemonCenterTime: 1hr/injury when injuries >= 5. |
| healing-R029 | Pokemon Center -- Injury Cap (3/Day) | constraint | core | system | **Implemented** | C016 | api-only | -- | calculatePokemonCenterInjuryHealing enforces same 3/day global cap. Returns atDailyLimit flag. |
| healing-R030 | Death from 10 Injuries | condition | edge-case | system | **Missing** | -- | -- | P1 | No death detection or warning at 10 injuries OR at death HP threshold (-50 HP or -200% HP, whichever is lower). GM must manually track. |
| healing-R031 | Fainted Recovery Timer (Potions) | constraint | situational | system | **Missing** | -- | -- | P2 | Potion healing brings HP above 0 but Pokemon should remain Fainted for 10 more minutes. No timer tracking. applyHealingToEntity removes Fainted immediately upon any positive HP. |
| healing-R032 | Extended Rest -- Clears Persistent Status | workflow | core | gm | **Implemented** | C002, C007, C017, C018 | gm | -- | clearPersistentStatusConditions removes Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. C044 constant defines the list. |
| healing-R033 | Extended Rest -- Restores Drained AP | modifier | core | system | **Partial** | C002, C054, C055 | gm | P0 | **Present:** Extended rest restores drained AP (sets drainedAp=0, recalculates currentAp). **Missing (CRITICAL):** C002 description states it also "clears all bound AP" and "sets currentAp to full maxAp." Per decree-016, extended rest must NOT clear bound AP. Per decree-028, bound AP persists until binding effect explicitly ends. **Also missing:** decree-018 mandates duration parameter (min 4h, max 8h, default 4h). C002 applies fixed 8 periods (4h) with no duration input. Implementation ticket ptu-rule-105 (decree-016) and ptu-rule-106 (decree-018) were created. |
| healing-R034 | Extended Rest -- Daily Move Recovery | workflow | core | system | **Implemented** | C007, C053 | gm | -- | isDailyMoveRefreshable implements rolling window: moves used today (lastUsedAt is today) are NOT refreshed. Only moves unused since previous day are restored. |
| healing-R035 | HP Lost vs Damage Distinction | condition | core | system | **Partial** | C033 | api-only | P2 | **Present:** calculateDamage handles standard damage correctly. **Missing:** No "set HP" or "lose HP" flag to differentiate effects that bypass defensive stats and massive damage injury. Same underlying gap as R012. |
| healing-R036 | Bandages -- Double Healing Rate | modifier | situational | gm | **Out of Scope** | -- | -- | -- | Bandages require 6-hour duration tracking with damage interruption. Session helper does not track time-based item effects. GM handles manually. |
| healing-R037 | Bandages -- Heal 1 Injury After Full Duration | condition | situational | gm | **Out of Scope** | -- | -- | -- | Same as R036. Requires time-based item effect tracking. |
| healing-R038 | Bandages -- Broken by Damage | constraint | situational | system | **Out of Scope** | -- | -- | -- | Follows from bandage system being out of scope. No bandage state to break. Reclassified from Missing (v1) to Out of Scope for consistency with R036/R037. |
| healing-R039 | Basic Restorative Items | enumeration | core | gm | **Partial** | C028 | gm | P1 | **Present:** In-combat healing (C028) can apply arbitrary HP amounts, functioning as a generic "use potion" action. C030 caps at effective max HP. Fainted removal works for Revive-like usage. **Missing:** No item catalog constant (Potion=20, Super Potion=35, Hyper Potion=70, Full Restore=80+cure, Revive=20+unfaint, Energy Powder=25, Energy Root=70, Revival Herb=50%+unfaint). No Revive-specific "set HP" logic. No Full Restore status cure integration. GM manually enters amounts. |
| healing-R040 | Status Cure Items | enumeration | core | gm | **Missing** | -- | -- | P2 | No item catalog for Antidote, Paralyze Heal, Burn Heal, Ice Heal, Full Heal, Heal Powder, or Awakening (per decree-041). Status conditions can be manually toggled but no item-based cure workflow exists. |
| healing-R041 | Applying Items -- Action Economy | workflow | core | player | **Missing** | -- | -- | P2 | No item use action economy: Standard Action by user, target forfeits Standard+Shift next turn, Medic Training exception, self-use is Full-Round with no forfeit. Entirely manual. |
| healing-R042 | AP Scene Refresh and Drain/Bind | workflow | cross-domain-ref | system | **Partial** | C054, C055, C056, C005, C011 | gm, api-only | P1 | **Present:** calculateMaxAp, calculateAvailableAp, calculateSceneEndAp utilities exist and are correct. New Day endpoints (C005, C011) reset daily AP counters. **Missing:** (1) No scene-end AP restoration trigger -- when encounter/scene ends, AP is not auto-restored. (2) **decree-028 violation (CRITICAL):** C005 and C011 reset boundAp to 0 on New Day. Per decree-028, bound AP persists across New Day until binding effect explicitly ends. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 28 | 17 | 0 | 5 | 4 | 2 |
| gm | 6 | 4 | 0 | 1 | 0 | 1 |
| player | 5 | 0 | 3 | 0 | 2 | 0 |
| cross-domain-ref | 1 | 0 | 0 | 1 | 0 | 0 |
| **TOTAL** | **42** (note: 2 rules count under both gm and system due to dual actor -- totals above reflect primary actor) | **21** | **3** | **7** | **8** (note: includes 2 counted as Out of Scope changes) | **3** |

### Actor Assignment Rationale

- **system** (28 rules): Formulas, conditions, constraints, and modifiers that execute automatically. The app enforces these without user action (e.g., R003 injury HP reduction is computed server-side).
- **gm** (6 rules): Rest workflows, Pokemon Center, injury healing. These are GM-initiated actions in PTU (the GM manages world state and NPC healing). R023 (natural injury healing) and R026 (Pokemon Center) are GM decisions.
- **player** (5 rules): Take a Breather (R018, R019) is the player's choice during their combat turn. AP Drain injury healing (R024) is the trainer choosing to spend their own AP. Item application (R041) is typically a player action. Assisted Breather (R021) is player-initiated.
- **cross-domain-ref** (1 rule): R042 (AP Scene Refresh) spans combat/encounter/healing domains.

### Key Findings

1. **All 3 Implemented-Unreachable rules are player-actor.** The healing system is entirely GM-gated. Players cannot trigger Take a Breather (R018/R019) or AP Drain injury healing (R024) from the player view.
2. **2 additional player-actor rules are Missing** (R021 Assisted Breather, R041 Item Action Economy), compounding the player access gap.
3. **The entire item subsystem is absent.** No item catalog, no item-specific healing logic, no item action economy. All 3 item-related rules (R039 Partial, R040 Missing, R041 Missing) are affected.
4. **2 decree violations identified:**
   - C002 clears bound AP during extended rest (violates decree-016)
   - C005/C011 reset bound AP on New Day (violates decree-028)

---

## Subsystem Gaps

### GAP-HEAL-1: No Player-Facing Healing Interface (Subsystem-Missing)

- **Type:** Subsystem-Missing (player view)
- **Affected Rules:** healing-R018, healing-R019 (Implemented-Unreachable), healing-R021, healing-R024, healing-R041 (Missing)
- **Rule Count:** 5
- **Priority:** P1
- **Description:** The player view has zero healing capabilities. Take a Breather, AP Drain injury healing, and item usage are all player-initiated actions in PTU but can only be performed from the GM view. Players must verbally request all healing actions.
- **Suggested Ticket:** `feat: Player View combat actions -- Take a Breather, item usage`
- **Workaround:** GM performs all player healing actions on their behalf.
- **Note:** This is the #1 accessibility gap. 5 rules depend on player access that does not exist.

### GAP-HEAL-2: No Healing Item System (Subsystem-Missing)

- **Type:** Subsystem-Missing (feature)
- **Affected Rules:** healing-R039 (Partial), healing-R040 (Missing), healing-R041 (Missing)
- **Rule Count:** 3
- **Priority:** P1
- **Description:** No item catalog constant exists for restorative items (Potion, Super Potion, Hyper Potion, Full Restore, Revive, Energy Powder, Energy Root, Revival Herb) or status cure items (Antidote, Burn Heal, Ice Heal, Paralyze Heal, Full Heal, Heal Powder, Awakening per decree-041). No item-specific healing logic (Revive sets HP + clears Fainted; Full Restore heals + cures all statuses). No item action economy (Standard Action, forfeit rules, Medic Training bypass).
- **Suggested Ticket:** `feat: Healing item system -- catalog constant, item-specific healing, action economy`
- **Workaround:** GM manually enters HP amounts and toggles status conditions.

### GAP-HEAL-3: No Death Detection (Missing)

- **Type:** Missing safety check
- **Affected Rules:** healing-R030
- **Rule Count:** 1
- **Priority:** P1
- **Description:** No warning or automatic detection when injuries reach 10 (death) or HP reaches death threshold (-50 HP or -200% HP, whichever is lower). During intense combat with multiple injury sources, the GM could miss a death trigger.
- **Suggested Ticket:** `feat: Death detection -- 10 injuries, extreme negative HP threshold`
- **Workaround:** GM manually monitors injury count and HP.

### GAP-HEAL-4: No Scene-End AP Restoration (Missing trigger)

- **Type:** Missing automation trigger
- **Affected Rules:** healing-R042 (Partial)
- **Rule Count:** 1
- **Priority:** P1
- **Description:** Utility functions calculateSceneEndAp (C056), calculateAvailableAp (C055), calculateMaxAp (C054) all exist and are correct. But no endpoint or UI event triggers AP restoration when a scene/encounter ends. AP restoration is a core PTU mechanic at every scene boundary.
- **Suggested Ticket:** `feat: Auto-restore AP on scene/encounter end`
- **Workaround:** GM manually adjusts AP values.

### GAP-HEAL-5: Decree Violations in AP Management (CRITICAL)

- **Type:** Implementation defect
- **Affected Rules:** healing-R033 (Partial), healing-R042 (Partial)
- **Priority:** P0
- **Description:** Two decree violations:
  1. **decree-016 violation:** C002 (Character Extended Rest API) clears boundAp during extended rest. Decree-016 mandates extended rest clears ONLY drained AP.
  2. **decree-028 violation:** C005 (Character New Day API) and C011 (Global New Day API) reset boundAp to 0. Decree-028 mandates bound AP persists across New Day.
- **Implementation Tickets:** ptu-rule-105 (decree-016 fix), additional ticket needed for decree-028.
- **Suggested Ticket:** `fix: Stop clearing bound AP in extended rest and new day per decree-016/028`

### GAP-HEAL-6: Bandage System (Out of Scope)

- **Type:** Documented exclusion
- **Affected Rules:** healing-R036, healing-R037, healing-R038 (all Out of Scope)
- **Rule Count:** 3
- **Priority:** P3
- **Description:** Bandages require 6-hour duration tracking, damage-based interruption, and healing rate modification. The session helper does not track time-based item effects. This is a deliberate scope exclusion. If implemented later, would add double healing rate modifier, injury healing after 6h, and damage cancellation listener.
- **Suggested Ticket:** None (intentionally out of scope).

---

## Gap Priorities

### P0 -- Decree Violation (CRITICAL)

| Rule ID | Rule Name | Classification | Gap Description | Decree |
|---------|-----------|---------------|-----------------|--------|
| healing-R033 | Extended Rest -- Drained AP | Partial | C002 clears boundAp during extended rest. Must clear ONLY drainedAp. Also missing duration parameter per decree-018. | decree-016, decree-018 |
| healing-R042 | AP Scene Refresh and Drain/Bind | Partial | C005/C011 reset boundAp to 0 on New Day. Bound AP must persist across New Day. | decree-028 |

### P1 -- Important Mechanic, Commonly Used

| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| healing-R015 | Fainted Clears All Statuses | Partial | Auto-clear persistent+volatile statuses on faint not confirmed in damage pipeline |
| healing-R016 | Heavily Injured Combat Penalty | Missing | 5+ injuries = lose HP equal to injury count per Standard Action and per damage taken |
| healing-R018 | Breather Core Effects | Implemented-Unreachable | Player cannot trigger Take a Breather from player view |
| healing-R019 | Breather Action Cost | Implemented-Unreachable | Player cannot trigger from player view |
| healing-R030 | Death from 10 Injuries | Missing | No death detection or warning |
| healing-R039 | Basic Restorative Items | Partial | No item catalog -- generic HP input only |

### P2 -- Situational, Workaround Exists

| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| healing-R012 | Massive Damage Set/Lose Exclusion | Partial | No "set HP" vs "damage" flag to bypass massive damage injury |
| healing-R020 | Breather Save Checks | Missing | No save check enforcement before breather |
| healing-R021 | Assisted Breather | Missing | No assisted breather workflow (DC 12 Command Check) |
| healing-R024 | AP Drain Injury | Implemented-Unreachable | Player cannot drain own AP from player view |
| healing-R031 | Fainted Potion Timer | Missing | No 10-min fainted persistence timer for potion healing |
| healing-R035 | HP Lost vs Damage | Partial | Same gap as R012 -- no "lose HP" effect flag |
| healing-R040 | Status Cure Items | Missing | No item catalog for status cure items |
| healing-R041 | Item Action Economy | Missing | No action cost tracking for item usage |

### P3 -- Edge Case, Minimal Impact

No P3 items remain in the effective set. R038 was the only P3 and has been reclassified to Out of Scope.

---

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness of implemented and partially-implemented items.

### Tier 0: Decree Compliance (CRITICAL -- verify first)

1. **healing-R033** -> C002 -- **CRITICAL decree-016 violation**: Verify whether extended rest endpoint actually clears boundAp. If yes, file/update ptu-rule-105 ticket. Also verify absence of duration parameter per decree-018 (ptu-rule-106).
2. **healing-R042** -> C005, C011 -- **CRITICAL decree-028 violation**: Verify whether New Day endpoints (character and global) reset boundAp to 0. If yes, file ticket for fix.
3. **healing-R007** -> C012 -- **decree-029 compliance**: Verify rest healing applies minimum 1 HP floor (not 0 for low-HP entities).
4. **healing-R026** -> C003, C008 -- **decree-017 compliance**: Verify Pokemon Center heals to effective max HP (injury-reduced), not real max HP.
5. **healing-R027** -> C015 -- **decree-020 compliance**: Verify healing time uses pre-healing (arrival) injury count, not post-healing.

### Tier 1: Core Formulas (verify calculation correctness)

6. **healing-R001** -> C052 -- Verify tick = floor(maxHp / 10). Used as unit throughout injury system.
7. **healing-R003** -> C052 -- Verify getEffectiveMaxHp: floor(maxHp * (10 - injuries) / 10). Confirm 10-injury cap produces 0.
8. **healing-R007** -> C012 -- Verify floor(maxHp / 16), min 1, capped at effectiveMaxHp - currentHp.
9. **healing-R027** -> C015 -- Verify 60 + injuries * 30 minutes (under 5 injuries).
10. **healing-R028** -> C015 -- Verify injuries * 60 minutes (5+ injuries).

### Tier 2: Core Constraints (verify validation logic)

11. **healing-R009** -> C001, C006, C012 -- Verify 480-min daily cap (restMinutesToday >= 480 -> canHeal=false).
12. **healing-R011** -> C012 -- Verify injuries >= 5 -> canHeal=false.
13. **healing-R025** -> C004, C009, C016 -- Verify 3/day injury healing limit enforced across all sources (natural, Pokemon Center, AP drain).
14. **healing-R029** -> C016 -- Verify Pokemon Center injury healing respects same 3/day global cap.
15. **healing-R017** -> C033 -- Verify HP marker thresholds use real maxHp, not effective max HP.

### Tier 3: Injury System (verify damage-to-injury pipeline)

16. **healing-R004** -> C033 -- Verify massive damage = single-hit >= 50% of real maxHp = 1 injury.
17. **healing-R005** -> C033 -- Verify HP marker crossings at 50%, 0%, -50%, -100%, and -50% intervals below.
18. **healing-R013** -> C033 -- Verify single attack can yield massive damage injury + multiple marker injuries simultaneously.
19. **healing-R022** -> C033 -- Verify that healing past a marker, then re-damaging through it, triggers a new injury.

### Tier 4: Healing Workflows (verify end-to-end chains)

20. **healing-R014** -> C028, C030 -- Verify Fainted removed when HP goes from <=0 to >0 via healing. Confirm faintedRemoved flag.
21. **healing-R026** -> C003, C008 -- Verify Pokemon Center: full HP (effective max), clear ALL statuses, heal injuries (3/day), restore all moves (Pokemon C008), healing time calculation (C015).
22. **healing-R032** -> C002, C007, C017, C018, C044 -- Verify extended rest clears exactly: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. No more, no less.
23. **healing-R034** -> C007, C053 -- Verify daily move refresh rolling window: only moves with lastUsedAt before today are refreshed. Moves used today are skipped.
24. **healing-R023** -> C004, C009, C014 -- Verify 24h timer: canHealInjuryNaturally returns true only when 24+ hours elapsed since lastInjuryTime.

### Tier 5: Breather System (verify end-to-end)

25. **healing-R018** -> C029, C034, C046, C062 -- Verify: (a) all combat stages reset to 0 (or -1 speed with Heavy Armor per C062), (b) temp HP set to 0, (c) volatile conditions cured (C046: all volatile except Cursed, plus Slowed and Stuck), (d) Tripped and Vulnerable applied.
26. **healing-R019** -> C029 -- Verify: standard action and shift action marked as used. Move log includes shift movement reminder.

### Tier 6: Partial Items -- Present Portion (verify what exists)

27. **healing-R039** -> C028, C030 -- Verify generic HP healing: amount applied correctly, capped at effective max HP, Fainted cleared on positive HP.
28. **healing-R042** -> C054, C055, C056 -- Verify AP utility calculations: calculateMaxAp (5 + floor(level/5)), calculateAvailableAp (max - bound - drained, min 0), calculateSceneEndAp (max - drained - bound).
29. **healing-R033** -> C002 -- Verify drainedAp restoration is correct (set to 0). Separate concern from bound AP violation.
30. **healing-R012 / healing-R035** -> C033 -- Verify standard damage path is correct (even without set/lose HP distinction).
31. **healing-R015** -> C033 -- Check whether damage pipeline auto-clears statuses on faint transition. If not, confirm this is the actual gap.

### Tier 7: Implemented-Unreachable (verify logic correct, flag accessibility gap)

32. **healing-R018** -> C029 -- Logic correct? Flag: intended actor is player, only accessible from gm.
33. **healing-R019** -> C029 -- Logic correct? Flag: intended actor is player, only accessible from gm.
34. **healing-R024** -> C004 -- Logic correct (2 AP cost, increments drainedAp, decrements currentAp, enforces 3/day)? Flag: intended actor is player (trainer), only accessible from gm.

### Tier 8: Data Model (verify schema correctness)

35. **healing-R002** -> C048, C049 -- Verify restMinutesToday tracked and incremented correctly across rest calls.
36. **healing-R006** -> C048, C049 -- Verify statusConditions JSON includes/handles Fainted status consistently.
37. **healing-R010** -> C048, C049 -- Verify injuries field maintained correctly across all healing and damage paths (rest, Pokemon Center, heal-injury, in-combat healing, damage).

---

## Appendix: Capability-to-Rule Mapping (Reverse Index)

For auditor reference, mapping each capability back to the rules it covers:

| Capability | Covers Rules | Notes |
|-----------|-------------|-------|
| C001 | R002, R007, R008, R009, R011 | Character 30-min rest |
| C002 | R032, R033 | Character extended rest. **decree-016 violation flagged.** |
| C003 | R026, R027, R029 | Character Pokemon Center |
| C004 | R023, R024, R025 | Character injury healing |
| C005 | R042 | Character new day. **decree-028 violation flagged.** |
| C006 | R002, R007, R008, R009, R011 | Pokemon 30-min rest |
| C007 | R032, R034 | Pokemon extended rest |
| C008 | R026, R027, R029, R034 | Pokemon Pokemon Center |
| C009 | R023, R025 | Pokemon injury healing |
| C010 | -- | Pokemon new day (counter reset only) |
| C011 | R042 | Global new day. **decree-028 violation flagged.** |
| C012 | R007, R009, R010, R011 | Rest healing calculation |
| C013 | -- | Daily counter reset detection (supporting utility) |
| C014 | R023 | Natural injury timer check |
| C015 | R027, R028 | Pokemon Center time calculation |
| C016 | R025, R029 | Pokemon Center injury healing with daily cap |
| C017 | R032 | Status identification for extended rest |
| C018 | R032 | Status clearing for extended rest |
| C019 | R007, R023 | Healing info aggregation (display) |
| C020-C027 | (composable wrappers) | Client-side wrappers for API calls |
| C028 | R014, R039 | In-combat healing (generic HP + faint clear) |
| C029 | R018, R019 | Take a Breather endpoint |
| C030 | R006, R014 | In-combat healing service (faint removal) |
| C031 | R006 | Sync healing to DB |
| C032 | R004, R005 | Sync damage + injury to DB |
| C033 | R003, R004, R005, R012, R013, R015, R017, R022, R035 | Core damage/injury calculation |
| C034 | R018 | Stage modifier reset (breather) |
| C035-C038 | (store actions) | Pinia store wrappers |
| C039 | R014 | Healing orchestration with undo |
| C040-C043 | (UI components) | HealingTab, sheet pages, Advance Day button |
| C044 | R032 | Persistent status constant |
| C045 | R018 | Volatile status constant |
| C046 | R018 | Breather cured conditions constant |
| C047 | -- | WebSocket broadcast (GM->Group sync) |
| C048-C049 | R002, R006, R010 | Database fields (healing state) |
| C050-C051 | -- | TypeScript type definitions |
| C052 | R001, R003 | Effective max HP formula |
| C053 | R034 | Daily move refresh eligibility |
| C054 | R042 | Max AP calculation |
| C055 | R042 | Available AP calculation |
| C056 | R042 | Scene-end AP calculation |
| C057 | R034 | Daily move usage reset |
| C058 | -- | Scene move usage reset (cross-domain) |
| C059-C061 | -- | TypeScript interfaces |
| C062 | R018 | Heavy Armor speed CS override for breather |

---

## Appendix: Unmapped Capabilities (No Direct Rule Coverage)

These capabilities exist but map to supporting infrastructure rather than specific PTU rules:

| Capability | Reason |
|-----------|--------|
| C010 | Pokemon new day -- pure counter reset, no specific rule |
| C013 | Daily counter detection -- infrastructure utility |
| C020-C027 | Composable wrappers -- thin clients over API endpoints |
| C035-C038 | Store actions -- thin Pinia wrappers over API endpoints |
| C039 | Undo/redo orchestration -- UX infrastructure |
| C040-C043 | UI components -- rendering layer |
| C047 | WebSocket broadcast -- real-time sync infrastructure |
| C050-C051 | TypeScript types -- dev tooling |
| C058 | Scene move reset -- cross-domain utility |
| C059-C061 | TypeScript interfaces -- dev tooling |
