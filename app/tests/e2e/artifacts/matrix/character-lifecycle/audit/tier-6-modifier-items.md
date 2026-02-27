## Tier 6: Modifier Items

### R031 — Free Training Feature

- **Rule:** "Pick one Training Feature for free, no prerequisites required."
- **Expected behavior:** Training feature stored separately, no prereq checks.
- **Actual behavior:** `useCharacterCreation.ts:207-209` — `setTrainingFeature` stores separately in `form.trainingFeature`. No prerequisite checking for any features.
- **Classification:** Correct

### R043 — AP Bind and Drain

- **Rule:** "Bound AP off-limits until binding ends. Drained AP unavailable until Extended Rest."
- **Expected behavior:** drainedAp restored by extended rest, boundAp cleared by effect end.
- **Actual behavior:** `schema.prisma:58-60` — `drainedAp`, `boundAp`, `currentAp` fields. Extended rest restores all. Heal injury can drain 2 AP. New day resets all. `calculateAvailableAp` correctly computes `maxAp - boundAp - drainedAp`.
- **Classification:** Correct

### R019 — Trainer Size

- **Rule:** "Trainers are Medium by default."
- **Expected behavior:** Trainers treated as Medium.
- **Actual behavior:** No explicit `size` field. Trainers implicitly Medium: 1x1 grid tokens, default movement speed 5. Consistent throughout.
- **Classification:** Correct

### R020 — Weight Class

- **Rule:** "55-110 lbs = WC3, 111-220 = WC4, higher = WC5."
- **Expected behavior:** Weight class derived from weight.
- **Actual behavior:** `HumanCharacter.weight` field exists (Int?, kg). No WC derivation function. GM must manually track.
- **Classification:** Approximation
- **Severity:** LOW — Weight field exists; WC derivation is missing but rarely needed.

### R064 — Skill Stunt Edge

- **Rule:** "Choose a Skill at Novice+. Under specific circumstances, roll one less die, add +6."
- **Expected behavior:** Edge stored as string; mechanical effect is table-resolved.
- **Actual behavior:** Edges stored as string array. Can store "Skill Stunt: [skill]". No mechanical effect — dice rolling is not automated.
- **Classification:** Correct — Skill checks are Out of Scope (R027). Storage is correct.

### R065 — Skill Enhancement Edge

- **Rule:** "Choose two Skills. Gain +2 bonus to each."
- **Expected behavior:** Edge stored; bonus computed or table-resolved.
- **Actual behavior:** Edge stored as string. +2 bonus not auto-applied. Table-resolved.
- **Classification:** Correct — Same reasoning as R064.

### R066 — Categoric Inclination Edge

- **Rule:** "Choose Body/Mind/Spirit. Gain +1 to all Skill Checks of that category."
- **Expected behavior:** Edge stored; bonus computed or table-resolved.
- **Actual behavior:** Edge stored as string. +1 bonus not auto-applied. Table-resolved.
- **Classification:** Correct — Same reasoning as R064.

---

## Ambiguous Items

### R035 — Branch Feature Tag (Design Ambiguity)

Two valid interpretations exist for branch class handling:

1. **PTU RAW:** Branching classes should be addable multiple times from the catalog, each with a different specialization. The `addClass` function should skip the duplicate check when `isBranching` is true.
2. **Name-based approach:** Specializations are encoded in the class name string (e.g., "Type Ace: Fire", "Type Ace: Water"). The duplicate check passes because strings differ. This requires the UI to prompt for specialization before adding.

The code implements neither approach cleanly — `isBranching` exists but is unused, and the catalog provides "Type Ace" as a fixed string. This is classified as **Incorrect** above because the most natural user flow (selecting "Type Ace" from the catalog twice) fails.

**Recommendation:** Create a `decree-need` ticket clarifying branch class handling. Either: (a) allow duplicate class names for branching classes, or (b) require specialization suffix before adding to the array.

---

## Escalation Notes

### Items Requiring Fix

1. **R035 — Branch Feature Tag** (Incorrect, MEDIUM): `addClass` blocks duplicate class names, preventing branching classes from being taken multiple times with different specializations. The `isBranching` flag is defined but never consulted.

### Approximation Items (monitor, no immediate fix needed)

- R024: Pathetic skill enforcement gap in custom background mode (MEDIUM)
- R037: No duplicate feature detection (MEDIUM)
- R040: No max level 50 validation (LOW)
- R020: No weight class derivation (LOW)
- R033: No [+Stat] auto-bonus (LOW)
- R034: No ranked feature tracking (LOW)
- R042: AP refresh function exists but no auto-trigger (LOW)

### No Active Decrees

No active decrees exist in `decrees/`. The R035 branch class handling warrants a `decree-need` ticket.
