# Encounter Combat Maneuvers

The Combat Maneuvers section inside the [[encounter-act-modal]] lists tactical actions available to combatants. Each maneuver shows a name, action cost, AC requirement (if any), and a short description.

**Standard Action maneuvers:**
- **Push** (AC 4) — Push target 1m away (opposed Combat/Athletics)
- **Sprint** — +50% Movement Speed this turn
- **Trip** (AC 6) — Trip target (opposed Combat/Acrobatics)
- **Grapple** (AC 4) — Initiate grapple (opposed Combat/Athletics)
- **Disarm** (AC 6) — Force target to drop held item (opposed Combat/Stealth)
- **Dirty Trick** (AC 2) — Hinder, Blind, or Low Blow (once per Scene per target)

**Shift Action maneuvers:**
- **Disengage** — Shift 1m without provoking Attack of Opportunity

**Full Action maneuvers:**
- **Intercept Melee** (Full + Interrupt) — Take melee hit meant for adjacent ally
- **Intercept Ranged** (Full + Interrupt) — Intercept ranged attack for ally
- **Take a Breather** — Reset stages, cure volatile status, become Tripped. Must Shift away from enemies.
- **Take a Breather (Assisted)** — Assisted breather: reset stages, cure volatile status, Tripped + 0 Evasion (no Vulnerable). Adjacent ally must spend Standard Action.

Maneuvers targeting non-adjacent enemies (Push, Trip, Grapple, Disarm, Dirty Trick) provoke Attacks of Opportunity — see [[aoo-trigger-constants]]. The underlying data for this list comes from the [[combat-maneuver-constants]].

Individual maneuver observations: [[push-maneuver-in-combat]], [[sprint-maneuver-in-combat]], [[trip-maneuver-in-combat]], [[grapple-maneuver-in-combat]], [[disarm-maneuver-in-combat]], [[dirty-trick-maneuver-in-combat]], [[disengage-maneuver-in-combat]], [[intercept-melee-maneuver-in-combat]], [[intercept-ranged-maneuver-in-combat]]. The overall section is described in [[maneuver-action-in-combat]].

Maneuvers absent from this grid but present in the rules: [[attack-of-opportunity-in-combat]] (has a dedicated prompt), [[manipulate-maneuver-in-combat]] (trainer-only, not in UI).
