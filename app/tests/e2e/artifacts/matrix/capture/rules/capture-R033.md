---
rule_id: capture-R033
name: Accuracy Check Natural 1 Always Misses
category: condition
scope: edge-case
domain: capture
---

## capture-R033: Accuracy Check Natural 1 Always Misses

- **Category:** condition
- **Scope:** edge-case
- **PTU Ref:** `core/07-combat.md#Accuracy`
- **Quote:** "Note that a roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit. Similarly, a roll of 20 is always a hit."
- **Dependencies:** capture-R004
- **Errata:** false

---

## Cross-Domain References

### capture-XREF-001: Injury System

- **Scope:** cross-domain-ref
- **Source Domain:** combat
- **PTU Ref:** `core/07-combat.md#Gaining Injuries`
- **Note:** Capture rate modifier (capture-R015) references injuries. Injuries are gained from Massive Damage (>=50% max HP in one hit) and Hit Point Markers (50%, 0%, -50%, -100%). Each injury reduces max HP by 1/10th. See combat domain for full injury rules.

### capture-XREF-002: Stuck and Slow Conditions

- **Scope:** cross-domain-ref
- **Source Domain:** combat
- **PTU Ref:** `core/07-combat.md#Other Afflictions`
- **Note:** Stuck (+10 capture rate) and Slow (+5 capture rate) are "Other Afflictions" — not true Status Afflictions. Stuck prevents Shift actions and negates Speed Evasion. Slowed halves movement. Both curable by switching or end of Scene.

### capture-XREF-003: Capture Specialist Trainer Class

- **Scope:** cross-domain-ref
- **Source Domain:** character-lifecycle
- **PTU Ref:** `core/04-trainer-classes.md#Capture Specialist`
- **Note:** Capture Specialist class provides Capture Techniques that modify capture mechanics: Snare (-10 to capture rolls for baited/stuck), Tools of the Trade (+2 accuracy with balls), Curve Ball (deals Struggle damage on ball hit), Fast Pitch (Priority ball throw), Captured Momentum (bonuses on successful capture), Gotta Catch 'Em All (swap digits on 1d100 roll), Catch Combo (capture fainted Pokemon as if 1 HP), False Strike (reduce to 1 HP instead of faint), Devitalizing Throw (inflict conditions on escape), Relentless Pursuit (interrupt fleeing).

### capture-XREF-004: Loyalty on Capture

- **Scope:** cross-domain-ref
- **Source Domain:** pokemon-lifecycle
- **PTU Ref:** `core/05-pokemon.md#Loyalty`
- **Note:** Most caught wild Pokémon begin at Loyalty 2. Friend Ball grants +1 Loyalty. Disposition and circumstances can affect starting loyalty.

### capture-XREF-005: Errata Capture Mechanic Revision

- **Scope:** cross-domain-ref
- **Source Domain:** capture
- **PTU Ref:** `books/markdown/errata-2.md#Capture Mechanic Changes`
- **Note:** The September 2015 playtest errata proposes an alternative d20-based capture system replacing the d100 system. Base Capture Rate becomes 10 + (level/10), with a checklist of -2 modifiers. Trainer level bonuses: Amateur +1, Capable +2, Veteran +3, Elite +4, Champion +5. This is PLAYTEST MATERIAL — the base 1.05 rules use the d100 system described in capture-R001 through capture-R029.

## Notes on Errata

The errata file (`errata-2.md`) contains a **playtest revision** to the capture mechanic that changes it from a d100 roll-under system to a d20 roll-over system. Key differences:

**Base 1.05 (d100 system — implemented in app):**
- Roll 1d100, subtract Trainer Level and ball modifiers
- Compare to Capture Rate (base 100 - level*2 + HP/evo/status modifiers)
- Roll under or equal = captured
- Natural 100 = auto-capture

**Errata Playtest (d20 system — NOT the default):**
- Roll 1d20, add Trainer tier bonus (+1 to +5)
- Compare to Capture Rate (base 10 + level/10 - checklist modifiers)
- Roll meets or exceeds = captured
- Checklist: <=50% HP (-2), <=25% HP (-2), 5+ injuries (-4), any status (-2), 2 evo stages remaining (-4), 1 evo stage remaining (-2)
- Rarity: GM discretion +5 to +20

The app should implement the **base 1.05 d100 system** unless the GM has opted into errata rules. The errata is clearly labeled as playtest material and subject to change.
