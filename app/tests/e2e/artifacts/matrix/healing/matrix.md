---
domain: healing
analyzed_at: 2026-02-26T17:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: healing-rules.md
capabilities_catalog: healing-capabilities.md (re-mapped 2026-02-26)
total_rules: 42
---

# Feature Completeness Matrix: Healing

## Coverage Score

```
Implemented:              26
Implemented-Unreachable:   0
Partial:                   5
Missing:                   4
Subsystem-Missing:         0
Out of Scope:              7
Coverage = (26 + 0.5*5 + 0.5*0) / (42 - 7) * 100 = (26 + 2.5) / 35 * 100 = 81.4%
```

| Classification | Count | % of Total |
|---------------|-------|------------|
| Implemented | 26 | 61.9% |
| Implemented-Unreachable | 0 | 0.0% |
| Partial | 5 | 11.9% |
| Missing | 4 | 9.5% |
| Subsystem-Missing | 0 | 0.0% |
| Out of Scope | 7 | 16.7% |
| **Total** | **42** | **100%** |

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Capability Match | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-----------------|-------------|-------|
| healing-R001 | Tick of Hit Points Definition | formula | core | system | Implemented | gm | C012, C052 | - | 1/10th of maxHP used in rest healing calculations |
| healing-R002 | Rest Definition | condition | core | gm | Implemented | gm | C001, C006, C020 | - | 30-min rest periods tracked via API and HealingTab |
| healing-R003 | Injury Definition — HP Reduction | formula | core | system | Implemented | gm | C052 | - | getEffectiveMaxHp: each injury reduces maxHP by 1/10 |
| healing-R004 | Injury from Massive Damage | condition | core | system | Implemented | gm | C033 | - | calculateDamage checks 50%+ maxHP for injury |
| healing-R005 | Injury from HP Markers | condition | core | system | Implemented | gm | C033 | - | countMarkersCrossed at 50%, 0%, -50%, -100% |
| healing-R006 | Fainted Condition Definition | condition | core | system | Implemented | gm | C033, C030 | - | Fainted at 0 HP; removed by healing from 0 |
| healing-R007 | Natural Healing Rate (Rest HP) | formula | core | gm | Implemented | gm | C012, C001, C006 | - | 1/16th maxHP per 30-min rest period |
| healing-R008 | Rest Requires Continuous Half Hour | constraint | core | gm | Implemented | gm | C001, C006 | - | Each rest action represents 30 continuous minutes |
| healing-R009 | Rest HP Recovery Daily Cap (8h) | constraint | core | system | Implemented | gm | C001, C006, C012 | - | Capped at 480 min/day (16 periods) |
| healing-R010 | Heavily Injured Threshold (5+) | condition | core | system | Implemented | gm | C012 | - | canHeal=false when injuries >= 5 |
| healing-R011 | Heavily Injured Blocks Rest HP | constraint | core | system | Implemented | gm | C012, C001, C006 | - | calculateRestHealing returns canHeal=false at 5+ injuries |
| healing-R012 | Massive Damage Exclusion for Set/Lose | constraint | situational | system | Partial | gm | C033 | P2 | **Present:** Damage system handles standard damage. **Missing:** No "set HP" or "lose HP" mode that bypasses massive damage check. Moves like Pain Split cannot be modeled correctly. |
| healing-R013 | Multiple Injuries from Single Attack | interaction | core | system | Implemented | gm | C033 | - | calculateDamage accumulates massive + marker injuries in single call |
| healing-R014 | Fainted Cured by Revive or Healing | workflow | core | gm | Implemented | gm | C030, C028 | - | applyHealingToEntity removes Fainted when healed from 0 HP |
| healing-R015 | Fainted Clears All Status | interaction | core | system | Implemented | gm | C033 (via combat damage service) | - | applyDamageToEntity clears persistent+volatile on faint |
| healing-R016 | Heavily Injured Combat Penalty | modifier | core | system | Missing | - | - | P1 | No automated HP loss when heavily injured combatant takes standard action or receives damage. GM must manually apply. |
| healing-R017 | Injury Does Not Affect HP Marker Thresholds | constraint | core | system | Implemented | gm | C033 | - | calculateDamage uses real maxHP for marker calculations, not injury-reduced |
| healing-R018 | Take a Breather — Core Effects | workflow | core | both | Implemented | gm | C029, C036 | - | Resets stages, removes temp HP, cures volatiles + Slowed/Stuck |
| healing-R019 | Take a Breather — Action Cost | constraint | core | both | Implemented | gm | C029 | - | Marks standard+shift used. Applies Tripped+Vulnerable. |
| healing-R020 | Take a Breather — Requires Save Checks | constraint | situational | both | Out of Scope | - | - | - | Save check requirements for confused/enraged not automated |
| healing-R021 | Take a Breather — Assisted by Trainer | workflow | situational | both | Out of Scope | - | - | - | Assisted breather with Command Check DC 12 not modeled |
| healing-R022 | Healing Past HP Markers — Re-Injury Risk | interaction | situational | system | Partial | gm | C028, C033 | P2 | **Present:** Healing system caps HP at effective max. Subsequent damage can cross markers again producing new injuries. **Missing:** No warning or tracking that a previously-crossed marker can be re-crossed. The mechanic works correctly by consequence but there is no explicit UI indicator of the risk. |
| healing-R023 | Natural Injury Healing (24h Timer) | workflow | core | gm | Implemented | gm | C004, C009, C014 | - | canHealInjuryNaturally checks 24h elapsed since lastInjuryTime |
| healing-R024 | Trainer AP Drain to Remove Injury | workflow | situational | gm | Implemented | gm | C004 (method='drain_ap') | - | Costs 2 AP, decrements currentAp, increments drainedAp |
| healing-R025 | Daily Injury Healing Cap (3/Day) | constraint | core | system | Implemented | gm | C004, C009, C016 | - | injuriesHealedToday tracked, capped at 3 from all sources |
| healing-R026 | Pokemon Center — Base Healing | workflow | core | gm | Implemented | gm | C003, C008 | - | Full HP, clear all status, restore daily moves |
| healing-R027 | Pokemon Center — Injury Time (Under 5) | modifier | core | system | Implemented | gm | C015 | - | 1hr base + 30min per injury |
| healing-R028 | Pokemon Center — Injury Time (5+) | modifier | situational | system | Implemented | gm | C015 | - | 1hr per injury when 5+ injuries |
| healing-R029 | Pokemon Center — Injury Removal Cap | constraint | core | system | Implemented | gm | C016 | - | Max 3 injuries per day from all sources |
| healing-R030 | Death from 10 Injuries | condition | edge-case | system | Missing | - | - | P2 | No death detection at 10 injuries or extreme HP thresholds. |
| healing-R031 | Fainted Recovery Timer (Potions) | constraint | situational | system | Missing | - | - | P3 | Potions bring above 0 HP but Pokemon stays Fainted for 10 min. Not modeled — applyHealingToEntity always removes Fainted when HP > 0. |
| healing-R032 | Extended Rest — Clears Persistent Status | workflow | core | gm | Implemented | gm | C002, C007, C017, C018 | - | clearPersistentStatusConditions removes Burn/Freeze/Paralysis/Poison/Badly Poisoned |
| healing-R033 | Extended Rest — Restores Drained AP | modifier | core | gm | Implemented | gm | C002 | - | Extended rest sets drainedAp=0, currentAp=maxAp |
| healing-R034 | Extended Rest — Daily Move Recovery | workflow | core | gm | Implemented | gm | C007, C053 | - | isDailyMoveRefreshable checks rolling window (not used today) |
| healing-R035 | HP Lost vs Damage Distinction | condition | core | system | Partial | gm | C033 | P2 | **Present:** Standard damage handled. **Missing:** No "lose HP" action that skips defense stats and massive damage. Same gap as R012. |
| healing-R036 | Bandages — Double Healing Rate | modifier | situational | gm | Missing | - | - | P2 | No bandage item system. Doubles healing to 1/8th per rest period and heals 1 injury after 6 hours. |
| healing-R037 | Bandages — Heal One Injury After Duration | condition | situational | gm | Out of Scope | - | - | - | Part of bandage item system (not implemented) |
| healing-R038 | Bandages — Broken by Damage | constraint | situational | system | Out of Scope | - | - | - | Part of bandage item system (not implemented) |
| healing-R039 | Basic Restorative Items | enumeration | core | gm | Partial | gm | C028, C030 | P1 | **Present:** In-combat healing (HP, temp HP, injuries) exists via heal endpoint. **Missing:** No item inventory or item catalog (Potion 20HP, Super Potion 35HP, Revive, etc.). GM must know item values and enter manually. |
| healing-R040 | Status Cure Items | enumeration | core | gm | Partial | gm | C024 | P1 | **Present:** Status conditions can be manually removed via status endpoint. **Missing:** No item catalog for Antidote, Paralyze Heal, Full Heal, etc. GM must manually remove conditions. |
| healing-R041 | Applying Restorative Items — Action Economy | workflow | core | both | Out of Scope | - | - | - | Item application action cost (Standard Action, target forfeits next turn) not modeled. Medic Training edge bypass not tracked. |
| healing-R042 | AP — Scene Refresh and Drain/Bind | workflow | cross-domain-ref | system | Partial | gm | C054, C055, C056 | P2 | **Present:** calculateMaxAp, calculateAvailableAp, calculateSceneEndAp utilities exist. Extended rest restores drained AP. **Missing:** No automated AP restoration on scene/encounter end. The calculateSceneEndAp utility exists but no endpoint or trigger calls it. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 25 | 17 | 0 | 3 | 2 | 3 |
| gm | 12 | 9 | 0 | 2 | 1 | 0 |
| both | 4 | 2 | 0 | 0 | 0 | 2 |
| cross-domain | 1 | 0 | 0 | 0 | 1 | 0 |

### Key Findings
- **No Implemented-Unreachable rules:** All healing capabilities that exist are accessible from the GM view where they belong. This is correct since PTU healing is generally a GM-managed activity.
- **Player healing is entirely absent:** No healing actions available from the player view. This is noted in the capabilities catalog as Missing Subsystem #1.
- **Item system is the primary gap:** Restorative items (R039) and status cure items (R040) lack a catalog. The healing infrastructure exists but requires manual GM knowledge.

---

## Subsystem Gaps

### 1. No Item Catalog or Inventory System
- **Rules affected:** R039 (Restorative Items), R040 (Status Cure Items) — 2 core rules
- **Impact:** Potions, Super Potions, Revives, Antidotes, etc. have no catalog. GM must remember item HP values and manually enter amounts. No inventory tracking per character.
- **Suggested ticket:** "feat: implement restorative item catalog with one-click application" (P1)

### 2. No Bandage System
- **Rules affected:** R036 (Double Healing Rate), R037 (Injury Heal), R038 (Broken by Damage) — 3 rules
- **Impact:** Bandage items with duration-based effects (6hr double healing + injury cure) not tracked.
- **Suggested ticket:** "feat: implement bandage tracking with timer-based healing boost" (P2)

### 3. No Automated Scene-End AP Restoration
- **Rules affected:** R042 (Scene Refresh)
- **Impact:** AP utility functions exist (calculateSceneEndAp) but no trigger restores AP when scenes/encounters end.
- **Suggested ticket:** "fix: trigger AP restoration on scene/encounter end" (P2)

### 4. No Heavily Injured Combat Penalty Automation
- **Rules affected:** R016
- **Impact:** 5+ injuries should cause HP loss on standard actions and when receiving damage. This is a combat-domain integration gap.
- **Suggested ticket:** "feat: automate heavily injured combat HP penalty" (P1)

### 5. No Player-Initiated Healing
- **Rules affected:** All healing rules (no player accessibility)
- **Impact:** Players cannot rest, use items, or visit Pokemon Centers from their view.
- **Suggested ticket:** "feat: add player healing request workflow" (P2)

---

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 3 | R016, R039, R040 |
| P2 | 5 | R012, R022, R030, R035, R036, R042 |
| P3 | 1 | R031 |

---

## Auditor Queue

### Tier 1: Core Formulas (Verify Correctness)
1. healing-R001 — Tick of HP (1/10th maxHP) → C012, C052
2. healing-R003 — Injury HP Reduction → C052 (getEffectiveMaxHp)
3. healing-R007 — Rest HP Recovery (1/16th) → C012 (calculateRestHealing)
4. healing-R027 — PC Injury Time Under 5 → C015 (calculatePokemonCenterTime)
5. healing-R028 — PC Injury Time 5+ → C015
6. healing-R033 — Extended Rest AP Restoration → C002, C054

### Tier 2: Core Workflows (Verify Correctness)
7. healing-R004 — Massive Damage Injury → C033
8. healing-R005 — HP Marker Injuries → C033
9. healing-R013 — Multiple Injuries Single Attack → C033
10. healing-R014 — Fainted Cure by Heal → C030
11. healing-R015 — Fainted Clears Status → C033
12. healing-R023 — Natural Injury Heal 24h → C004, C014
13. healing-R024 — AP Drain Injury Heal → C004
14. healing-R026 — Pokemon Center Full Healing → C003, C008
15. healing-R032 — Extended Rest Clear Status → C002, C007, C017, C018
16. healing-R034 — Extended Rest Daily Moves → C007, C053
17. healing-R018 — Take a Breather → C029

### Tier 3: Core Constraints (Verify Correctness)
18. healing-R008 — Rest 30-Min Continuous → C001, C006
19. healing-R009 — Rest 8h Cap → C001, C006
20. healing-R010 — Heavily Injured Threshold → C012
21. healing-R011 — Heavily Injured Blocks Rest → C012
22. healing-R017 — Injury Uses Real Max → C033
23. healing-R025 — Daily 3 Injury Cap → C004, C009, C016
24. healing-R029 — PC Injury Cap → C016
25. healing-R019 — Breather Action Cost → C029

### Tier 4: Partial Items — Present Portion (Verify)
26. healing-R012 — Massive Damage (standard path) → C033
27. healing-R022 — Re-Injury Risk (consequence path) → C028, C033
28. healing-R035 — HP Lost (standard damage) → C033
29. healing-R039 — In-combat heal (manual amount) → C028, C030
30. healing-R040 — Status removal (manual) → combat-C024
31. healing-R042 — AP utilities (calculateSceneEndAp) → C054, C055, C056
