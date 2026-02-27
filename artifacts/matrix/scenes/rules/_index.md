---
domain: scenes
type: rules
total_rules: 42
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
---

# Rules: scenes

# PTU Rules: Scenes

## Summary
- Total rules: 42
- Categories: formula(1), condition(3), workflow(6), constraint(9), enumeration(7), modifier(7), interaction(9)
- Scopes: core(24), situational(11), edge-case(4), cross-domain-ref(3)

## Dependency Graph
- Foundation: scenes-R001, scenes-R002, scenes-R009, scenes-R016, scenes-R025, scenes-R029
- Derived: scenes-R003 (R001, R002), scenes-R004 (R001, R002), scenes-R005 (R004), scenes-R006 (R004), scenes-R007 (R002), scenes-R010 (R009), scenes-R011 (R009), scenes-R012 (R009), scenes-R013 (R009), scenes-R014 (R009), scenes-R015 (R011-R014), scenes-R017 (R016), scenes-R018 (R016), scenes-R019 (R016), scenes-R020 (R017, R018), scenes-R026 (R025), scenes-R027 (R025), scenes-R028 (R025), scenes-R030 (R029), scenes-R039 (R009), scenes-R040 (R009), scenes-R041 (R011, R014), scenes-R042 (R021)
- Workflow: scenes-R008 (R002, R007), scenes-R021 (R016, R018), scenes-R022 (R016), scenes-R023 (R022), scenes-R024 (R022), scenes-R031 (R029, R030), scenes-R032 (R001, R002, R029), scenes-R033 (R029, R030), scenes-R034 (R029), scenes-R035 (R016), scenes-R036 (R002), scenes-R037 (R029, R030), scenes-R038 (R025, R027)

---

## Rule Listing

| Rule ID | Name | Category | Scope |
|---------|------|----------|-------|
| scenes-R001 | Habitat Type Enumeration | enumeration | core |
| scenes-R002 | Habitat Pokemon Assignment | enumeration | core |
| scenes-R003 | Fun Game Progression | constraint | core |
| scenes-R004 | Sensible Ecosystems | constraint | core |
| scenes-R005 | Energy Pyramid Population Distribution | constraint | situational |
| scenes-R006 | Niche Competition | interaction | situational |
| scenes-R007 | Pokemon Hierarchies and Social Organization | enumeration | core |
| scenes-R008 | Pokemon Behavior and Intelligence | workflow | situational |
| scenes-R009 | Weather Keyword Definition | enumeration | core |
| scenes-R010 | Natural Weather vs Game Weather | condition | core |
| scenes-R011 | Hail Weather Effects | modifier | core |
| scenes-R012 | Rainy Weather Effects | modifier | core |
| scenes-R013 | Sandstorm Weather Effects | modifier | core |
| scenes-R014 | Sunny Weather Effects | modifier | core |
| scenes-R015 | Weather-Dependent Ability Interactions | interaction | situational |
| scenes-R016 | Basic Terrain Types | enumeration | core |
| scenes-R017 | Slow Terrain | modifier | core |
| scenes-R018 | Rough Terrain | modifier | core |
| scenes-R019 | Blocking Terrain | constraint | core |
| scenes-R020 | Naturewalk Terrain Bypass | interaction | situational |
| scenes-R021 | Dark Cave Environment | workflow | situational |
| scenes-R022 | Environmental Hazard Encounters | workflow | core |
| scenes-R023 | Collateral Damage Environment | constraint | situational |
| scenes-R024 | Arctic/Ice Environment | interaction | edge-case |
| scenes-R025 | Scene Frequency Definition | enumeration | core |
| scenes-R026 | Scene Frequency EOT Restriction | constraint | core |
| scenes-R027 | Daily Frequency Scene Limit | constraint | core |
| scenes-R028 | Narrative Frequency Optional Rule | interaction | edge-case |
| scenes-R029 | Encounter Creation Baseline | formula | core |
| scenes-R030 | Significance Multiplier | modifier | core |
| scenes-R031 | Quick-Stat Wild Pokemon | workflow | situational |
| scenes-R032 | Wild Encounter Trigger Scenarios | workflow | core |
| scenes-R033 | Encounter Tax vs Threat | interaction | situational |
| scenes-R034 | Quick NPC Building | workflow | situational |
| scenes-R035 | Movement Capabilities | enumeration | cross-domain-ref |
| scenes-R036 | Shiny and Variant Pokemon | interaction | edge-case |
| scenes-R037 | Experience Calculation from Encounters | interaction | cross-domain-ref |
| scenes-R038 | Scene Boundary and Frequency Reset | condition | cross-domain-ref |
| scenes-R039 | Weather Exclusivity Constraint | constraint | core |
| scenes-R040 | Weather Duration Constraint | constraint | core |
| scenes-R041 | Frozen Status Weather Interaction | interaction | situational |
| scenes-R042 | Light Source Radii in Dark Environments | condition | edge-case |
