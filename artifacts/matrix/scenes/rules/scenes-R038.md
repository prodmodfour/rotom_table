---
rule_id: scenes-R038
name: Scene Boundary and Frequency Reset
category: condition
scope: cross-domain-ref
domain: scenes
---

## scenes-R038: Scene Boundary and Frequency Reset

- **Category:** condition
- **Scope:** cross-domain-ref
- **PTU Ref:** `core/10-indices-and-reference.md#Frequency`
- **Quote:** "Scene X: This Frequency means this Move can be performed X times per Scene." Combined with: "Daily is the lowest Frequency... Moves that can be used multiple times Daily can still only be used once a Scene and not multiple times within the same Scene."
- **Dependencies:** scenes-R025, scenes-R027
- **Errata:** false

### Notes
Cross-domain reference to combat domain. The definition of when a "scene" starts and ends is implicit in PTU — a scene encompasses one encounter/combat plus surrounding narrative. Scene-frequency moves reset between scenes. This boundary determines when limited-use abilities refresh.

---
