---
domain: healing
type: rules
total_rules: 42
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
---

# Rules: healing

# PTU Rules: Healing

## Summary
- Total rules: 42
- Categories: formula(8), condition(7), workflow(7), constraint(10), enumeration(3), modifier(4), interaction(3)
- Scopes: core(21), situational(14), edge-case(7)

## Dependency Graph
- Foundation: healing-R001, healing-R002, healing-R003, healing-R004, healing-R005, healing-R006, healing-R018, healing-R026
- Derived: healing-R007 (depends on healing-R001), healing-R008 (depends on healing-R002), healing-R009 (depends on healing-R003), healing-R010 (depends on healing-R003), healing-R011 (depends on healing-R003, healing-R010), healing-R012 (depends on healing-R004), healing-R013 (depends on healing-R004, healing-R005), healing-R014 (depends on healing-R006), healing-R015 (depends on healing-R006), healing-R016 (depends on healing-R003, healing-R010), healing-R017 (depends on healing-R003), healing-R019 (depends on healing-R018), healing-R020 (depends on healing-R018), healing-R021 (depends on healing-R018), healing-R022 (depends on healing-R005), healing-R023 (depends on healing-R001, healing-R003), healing-R024 (depends on healing-R003), healing-R025 (depends on healing-R003, healing-R010), healing-R027 (depends on healing-R026), healing-R028 (depends on healing-R026), healing-R029 (depends on healing-R026), healing-R030 (depends on healing-R003, healing-R026), healing-R031 (depends on healing-R006), healing-R032 (depends on healing-R003, healing-R006), healing-R033 (depends on healing-R003), healing-R034 (depends on healing-R004), healing-R035 (depends on healing-R005), healing-R036 (depends on healing-R003), healing-R037 (depends on healing-R003, healing-R004), healing-R038 (depends on healing-R004)
- Workflow: healing-R039 (depends on healing-R001, healing-R003, healing-R004, healing-R010), healing-R040 (depends on healing-R018, healing-R019, healing-R020, healing-R021), healing-R041 (depends on healing-R026, healing-R027, healing-R028, healing-R029), healing-R042 (depends on healing-R003, healing-R006, healing-R018)

---

## Rule Listing

| Rule ID | Name | Category | Scope |
|---------|------|----------|-------|
| healing-R001 | Tick of Hit Points Definition | formula | core |
| healing-R002 | Rest Definition | condition | core |
| healing-R003 | Injury Definition — HP Reduction per Injury | formula | core |
| healing-R004 | Injury Gained from Massive Damage | condition | core |
| healing-R005 | Injury Gained from HP Markers | condition | core |
| healing-R006 | Fainted Condition Definition | condition | core |
| healing-R007 | Natural Healing Rate (Rest HP Recovery) | formula | core |
| healing-R008 | Rest Requires Continuous Half Hour | constraint | core |
| healing-R009 | Rest HP Recovery Daily Cap (8 Hours) | constraint | core |
| healing-R010 | Heavily Injured Threshold (5+ Injuries) | condition | core |
| healing-R011 | Heavily Injured Blocks Rest HP Recovery | constraint | core |
| healing-R012 | Massive Damage Exclusion for Set/Lose HP Moves | constraint | situational |
| healing-R013 | Multiple Injuries from Single Attack | interaction | core |
| healing-R014 | Fainted Cured by Revive or Healing to Positive HP | workflow | core |
| healing-R015 | Fainted Clears All Status Conditions | interaction | core |
| healing-R016 | Heavily Injured Combat Penalty | modifier | core |
| healing-R017 | Injury Does Not Affect HP Marker Thresholds | constraint | core |
| healing-R018 | Take a Breather — Core Effects | workflow | core |
| healing-R019 | Take a Breather — Action Cost | constraint | core |
| healing-R020 | Take a Breather — Requires Save Checks | constraint | situational |
| healing-R021 | Take a Breather — Assisted by Trainer | workflow | situational |
| healing-R022 | Healing Past HP Markers Creates Re-Injury Risk | interaction | situational |
| healing-R023 | Natural Injury Healing (24-Hour Timer) | workflow | core |
| healing-R024 | Trainer AP Drain to Remove Injury | workflow | situational |
| healing-R025 | Daily Injury Healing Cap (3 per Day) | constraint | core |
| healing-R026 | Pokémon Center — Base Healing | workflow | core |
| healing-R027 | Pokémon Center — Injury Time Penalty (Under 5) | modifier | core |
| healing-R028 | Pokémon Center — Injury Time Penalty (5+ Injuries) | modifier | situational |
| healing-R029 | Pokémon Center — Injury Removal Cap (3/Day) | constraint | core |
| healing-R030 | Death from 10 Injuries | condition | edge-case |
| healing-R031 | Fainted Recovery Timer (Potions) | constraint | situational |
| healing-R032 | Extended Rest — Clears Persistent Status Conditions | workflow | core |
| healing-R033 | Extended Rest — Restores Drained AP | modifier | core |
| healing-R034 | Extended Rest — Daily Move Recovery | workflow | core |
| healing-R035 | Hit Points Lost from HP Markers vs Damage | condition | core |
| healing-R036 | Bandages — Double Natural Healing Rate | modifier | situational |
| healing-R037 | Bandages — Heal One Injury After Full Duration | condition | situational |
| healing-R038 | Bandages — Broken by Damage | constraint | situational |
| healing-R039 | Basic Restorative Items | enumeration | core |
| healing-R040 | Status Cure Items | enumeration | core |
| healing-R041 | Applying Restorative Items — Action Economy | workflow | core |
| healing-R042 | Action Points — Scene Refresh and Drain/Bind | workflow | cross-domain-ref |
