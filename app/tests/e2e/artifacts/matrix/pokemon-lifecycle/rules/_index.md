---
domain: pokemon-lifecycle
type: rules
total_rules: 68
extracted_at: 2026-02-19T12:00:00Z
extracted_by: ptu-rule-extractor
---

# Rules: pokemon-lifecycle

## Rule Listing

| Rule ID | Name | Category | Scope |
|---------|------|----------|-------|
| pokemon-lifecycle-R001 | Pokemon Party Limit | constraint | core |
| pokemon-lifecycle-R002 | Pokemon Maximum Level | constraint | core |
| pokemon-lifecycle-R003 | Base Stats Definition | enumeration | core |
| pokemon-lifecycle-R004 | Pokemon Types | enumeration | core |
| pokemon-lifecycle-R005 | Nature System | enumeration | core |
| pokemon-lifecycle-R006 | Nature Stat Adjustments | formula | core |
| pokemon-lifecycle-R007 | Neutral Natures | condition | core |
| pokemon-lifecycle-R008 | Nature Flavor Preferences | enumeration | situational |
| pokemon-lifecycle-R009 | Stat Points Allocation Total | formula | core |
| pokemon-lifecycle-R010 | Base Relations Rule | constraint | core |
| pokemon-lifecycle-R011 | Pokemon HP Formula | formula | core |
| pokemon-lifecycle-R012 | Evasion Calculation | formula | cross-domain-ref |
| pokemon-lifecycle-R013 | Abilities - Initial Assignment | workflow | core |
| pokemon-lifecycle-R014 | Abilities - Level 20 | workflow | core |
| pokemon-lifecycle-R015 | Abilities - Level 40 | workflow | core |
| pokemon-lifecycle-R016 | No Ability Maximum | constraint | situational |
| pokemon-lifecycle-R017 | Move Slot Limit | constraint | core |
| pokemon-lifecycle-R018 | Natural Move Sources | enumeration | core |
| pokemon-lifecycle-R019 | TM/Tutor Move Limit | constraint | core |
| pokemon-lifecycle-R020 | TM-to-Natural Reclassification | condition | situational |
| pokemon-lifecycle-R021 | Tutor Move Level Restrictions | constraint | core |
| pokemon-lifecycle-R022 | Tutor Points - Initial | formula | core |
| pokemon-lifecycle-R023 | Tutor Points - Level Progression | formula | core |
| pokemon-lifecycle-R024 | Tutor Points - Permanent Spend | constraint | core |
| pokemon-lifecycle-R025 | Tutor Points - Trade Refund | condition | situational |
| pokemon-lifecycle-R026 | Level Up Workflow | workflow | core |
| pokemon-lifecycle-R027 | Level Up Stat Point | formula | core |
| pokemon-lifecycle-R028 | Level Up Move Check | workflow | core |
| pokemon-lifecycle-R029 | Evolution Check on Level Up | workflow | core |
| pokemon-lifecycle-R030 | Optional Evolution Refusal | condition | core |
| pokemon-lifecycle-R031 | Evolution - Stat Recalculation | workflow | core |
| pokemon-lifecycle-R032 | Evolution - Ability Remapping | workflow | core |
| pokemon-lifecycle-R033 | Evolution - Immediate Move Learning | workflow | core |
| pokemon-lifecycle-R034 | Evolution - Skills and Capabilities Update | workflow | core |
| pokemon-lifecycle-R035 | Vitamins - Base Stat Increase | modifier | core |
| pokemon-lifecycle-R036 | Vitamins - Maximum Per Pokemon | constraint | core |
| pokemon-lifecycle-R037 | Heart Booster | modifier | situational |
| pokemon-lifecycle-R038 | Pokemon Creation Workflow | workflow | core |
| pokemon-lifecycle-R039 | Breeding - Species Determination | formula | core |
| pokemon-lifecycle-R040 | Breeding - Inheritance Move List | workflow | core |
| pokemon-lifecycle-R041 | Breeding - Inheritance Move Schedule | constraint | core |
| pokemon-lifecycle-R042 | Inheritance Move Level Restrictions | constraint | core |
| pokemon-lifecycle-R043 | Breeding - Trait Determination | workflow | core |
| pokemon-lifecycle-R044 | Breeding - Nature Choice Threshold | condition | situational |
| pokemon-lifecycle-R045 | Breeding - Ability Choice Threshold | condition | situational |
| pokemon-lifecycle-R046 | Breeding - Gender Choice Threshold | condition | situational |
| pokemon-lifecycle-R047 | Breeding - Shiny Determination | formula | situational |
| pokemon-lifecycle-R048 | Loyalty System - Ranks | enumeration | core |
| pokemon-lifecycle-R049 | Loyalty - Command Checks | formula | core |
| pokemon-lifecycle-R050 | Loyalty - Starting Values | condition | core |
| pokemon-lifecycle-R051 | Loyalty - Intercept at Rank 3 | interaction | cross-domain-ref |
| pokemon-lifecycle-R052 | Loyalty - Intercept at Rank 6 | interaction | cross-domain-ref |
| pokemon-lifecycle-R053 | Disposition System | enumeration | situational |
| pokemon-lifecycle-R054 | Disposition - Charm Check DCs | formula | situational |
| pokemon-lifecycle-R055 | Training Session | workflow | situational |
| pokemon-lifecycle-R056 | Experience Training Formula | formula | situational |
| pokemon-lifecycle-R057 | Experience Training Limit | constraint | situational |
| pokemon-lifecycle-R058 | Pokemon Experience Calculation | formula | core |
| pokemon-lifecycle-R059 | Experience Distribution Rules | workflow | core |
| pokemon-lifecycle-R060 | Experience Chart | formula | core |
| pokemon-lifecycle-R061 | Size Classes | enumeration | core |
| pokemon-lifecycle-R062 | Weight Classes | enumeration | core |
| pokemon-lifecycle-R063 | Species Capabilities | enumeration | core |
| pokemon-lifecycle-R064 | Move-Granted Capabilities | condition | situational |
| pokemon-lifecycle-R065 | Pokemon Skills | enumeration | core |
| pokemon-lifecycle-R066 | Mega Evolution - Trigger | workflow | edge-case |
| pokemon-lifecycle-R067 | Mega Evolution - Stat and Ability Changes | formula | edge-case |
| pokemon-lifecycle-R068 | Mega Evolution - Constraints | constraint | edge-case |
