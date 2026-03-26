# 2026-03-25 — Combat domain re-examination fixes

**`combat-stage-system.md`:** Verified correct. 5 stats with CS (Atk, Def, SpAtk, SpDef, Spd). Stamina and HP excluded — confirmed by `combat-stage-asymmetric-scaling.md`. No changes needed.

**`combat-maneuver-catalog.md`:** Restructured by action type with PTR vault links:
- Standard Action maneuvers (Push, Trip, Grapple, Disarm, Dirty Trick) — linked to `push-chains-with-movement`
- Manipulate maneuvers (Bon Mot, Flirt, Terrorize) — grouped with social skill resolution
- **Added Disengage** as Movement Action maneuver — linked to `disengage-avoids-opportunity-attacks`, `attack-of-opportunity-trigger-list`
- Reclassified Intercept (Melee/Ranged) as Full Action Interrupts — linked to `intercept-as-bodyguard-positioning`, `intercept-loyalty-gated`
- Take a Breather reclassified as Special Action — linked to `take-a-breather-resets-combat-state`, added Fatigue recovery detail

**`combat-entity-base-interface.md`:** Added `stamina`, `currentEnergy`, `maxEnergy` to shared field list (14→16). Linked to `stamina-stat` and `energy-resource`.

**Status/condition domain:** Verified correct. Categories match PTR vault. Suppressed was correctly removed as a status condition — in PTR, "suppress" is a verb applied to traits, not a condition. No changes needed.
