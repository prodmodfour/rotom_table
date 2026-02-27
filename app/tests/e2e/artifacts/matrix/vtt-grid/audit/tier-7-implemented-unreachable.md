## Tier 7: Implemented-Unreachable

### R041 — Intercept Melee

- **Rule:** "Full Action + Interrupt. Ally within movement range hit by adjacent foe. Shift to occupy their space."
- **Expected behavior:** Maneuver exists in combat system. Grid provides visual assistance.
- **Actual behavior:** `combatManeuvers.ts:79-87` — Intercept Melee defined: `actionType: 'interrupt'`, `actionLabel: 'Full + Interrupt'`, `requiresTarget: false`, `shortDesc: 'Take melee hit meant for adjacent ally'`. The maneuver exists and can be executed via the combat action system. However, the VTT grid does not provide visual assistance: no "ally within movement range" indicator, no path visualization.
- **Classification:** Correct (logic-wise) — Maneuver definition is correct. Grid visual assistance is a UI enhancement, not a rules implementation error.

---

## Ambiguous Items

### R030 — Disengage Maneuver Definition

The Disengage maneuver is described in PTU as "Shift 1 Meter without provoking AoO." The combat maneuvers constant does not include a Disengage entry. Since AoO (R031) is not implemented either, all movement is effectively AoO-free, making Disengage redundant. Two valid interpretations:

1. **Disengage should be defined** even without AoO, for completeness and future-proofing.
2. **Disengage is unnecessary** until AoO is implemented — adding it now would be dead code.

This is classified as **Incorrect** above because the maneuver definition is missing per PTU rules, but the practical impact is zero.

**Recommendation:** When AoO (R031) is implemented, Disengage should be added simultaneously. No decree-need ticket warranted.

---

## Revised Classifications (Stale Matrix Corrections)

Several items the matrix classified as "Partial" are now fully implemented based on current source code reading:

| Rule | Matrix Classification | Audit Classification | Reason |
|------|----------------------|---------------------|--------|
| R022 (Stuck) | Partial | **Correct** | `applyMovementModifiers` returns 0 speed for Stuck |
| R024 (Slowed) | Partial | **Correct** | `applyMovementModifiers` halves speed for Slowed |
| R026 (Speed CS) | Partial | **Correct** | `applyMovementModifiers` applies Speed CS with floor 2 |

These items were likely implemented after the previous coverage analysis (sessions 12-26) and the matrix was not updated to reflect the new code.

---

## Escalation Notes

### Items Requiring Fix

1. **R030 — Disengage Maneuver** (Incorrect, LOW): Disengage entry missing from `combatManeuvers.ts`. Should be added when AoO (R031) is implemented.

### Approximation Items (monitor)

- R015: Rough terrain accuracy penalty not implemented (MEDIUM)
- R025: Tripped condition doesn't consume shift action (LOW)
- R038: Levitate max height not enforced (LOW)

### Items Upgraded from Partial to Correct

- R022 (Stuck): Now enforced via `applyMovementModifiers`
- R024 (Slowed): Now enforced via `applyMovementModifiers`
- R026 (Speed CS): Now applied via `applyMovementModifiers` with floor 2

### Decree-Need References

Existing decree-needs relevant to this domain:
- decree-need-002: diagonal range calculation
- decree-need-003: token blocking
- decree-need-007: cone width
- decree-need-008: water terrain
- decree-need-009: diagonal line length
- decree-need-010: rough+slow overlap (relevant to R015)
- decree-need-011: mixed terrain speed (relevant to R008 which is Missing)

No new decree-need tickets recommended from this audit.
