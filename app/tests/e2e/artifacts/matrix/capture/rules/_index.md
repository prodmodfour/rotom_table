---
domain: capture
type: rules
total_rules: 33
extracted_at: 2026-02-19T00:00:00Z
extracted_by: ptu-rule-extractor
---

# Rules: capture

# PTU Rules: Capture

## Summary
- Total rules: 33
- Categories: formula(7), condition(6), workflow(3), constraint(4), enumeration(3), modifier(8), interaction(2)
- Scopes: core(16), situational(12), edge-case(5)

## Dependency Graph
- Foundation: capture-R001, capture-R002, capture-R003, capture-R004, capture-R005, capture-R017, capture-R020
- Derived: capture-R006 (depends on capture-R001), capture-R007 (depends on capture-R001), capture-R008 (depends on capture-R001), capture-R009 (depends on capture-R001), capture-R010 (depends on capture-R001), capture-R011 (depends on capture-R001), capture-R012 (depends on capture-R001), capture-R013 (depends on capture-R001), capture-R014 (depends on capture-R001, capture-R002), capture-R015 (depends on capture-R001, capture-R003), capture-R016 (depends on capture-R001), capture-R018 (depends on capture-R017), capture-R019 (depends on capture-R017), capture-R021 (depends on capture-R020), capture-R022 (depends on capture-R020), capture-R023 (depends on capture-R020), capture-R024 (depends on capture-R020), capture-R025 (depends on capture-R020), capture-R026 (depends on capture-R020)
- Workflow: capture-R027 (depends on capture-R003, capture-R004, capture-R005, capture-R014), capture-R028 (depends on capture-R027, capture-R001), capture-R029 (depends on capture-R028, capture-R005)

---

## Rule Listing

| Rule ID | Name | Category | Scope |
|---------|------|----------|-------|
| capture-R001 | Capture Rate Base Formula | formula | core |
| capture-R002 | Persistent Status Condition Definition | enumeration | core |
| capture-R003 | Volatile Status Condition Definition | enumeration | core |
| capture-R004 | Throwing Accuracy Check | formula | core |
| capture-R005 | Capture Roll Mechanic | formula | core |
| capture-R006 | HP Modifier — Above 75% | modifier | core |
| capture-R007 | HP Modifier — 51-75% | modifier | core |
| capture-R008 | HP Modifier — 26-50% | modifier | core |
| capture-R009 | HP Modifier — 1-25% | modifier | core |
| capture-R010 | HP Modifier — Exactly 1 HP | modifier | core |
| capture-R011 | Evolution Stage Modifier — Two Evolutions Remaining | modifier | core |
| capture-R012 | Evolution Stage Modifier — One Evolution Remaining | modifier | core |
| capture-R013 | Evolution Stage Modifier — No Evolutions Remaining | modifier | core |
| capture-R014 | Status Affliction Modifier — Persistent | modifier | core |
| capture-R015 | Status Affliction Modifier — Volatile and Injuries | modifier | core |
| capture-R016 | Rarity Modifier — Shiny and Legendary | modifier | core |
| capture-R017 | Fainted Cannot Be Captured | constraint | core |
| capture-R018 | Owned Pokémon Cannot Be Captured | constraint | core |
| capture-R019 | Fainted Pokémon Capture Failsafe | constraint | core |
| capture-R020 | Poké Ball Type Modifiers | enumeration | core |
| capture-R021 | Level Ball Condition | condition | situational |
| capture-R022 | Love Ball Condition | condition | situational |
| capture-R023 | Timer Ball Scaling | formula | situational |
| capture-R024 | Quick Ball Decay | formula | situational |
| capture-R025 | Heavy Ball Scaling | formula | situational |
| capture-R026 | Heal Ball Post-Capture Effect | interaction | situational |
| capture-R027 | Capture Workflow | workflow | core |
| capture-R028 | Natural 20 Accuracy Bonus | interaction | situational |
| capture-R029 | Natural 100 Auto-Capture | condition | edge-case |
| capture-R030 | Missed Ball Recovery | condition | situational |
| capture-R031 | Poké Ball Recall Range | constraint | situational |
| capture-R032 | Capture Is a Standard Action | workflow | core |
| capture-R033 | Accuracy Check Natural 1 Always Misses | condition | edge-case |
