# Rules Review 055 — bug-016: Spawn Count Hard-Cap at 10

**Reviewer:** Game Logic Reviewer
**Date:** 2026-02-20
**Commit:** `4ba0b8b`
**Ticket:** bug-016
**Domain:** encounter-tables (density tiers / spawn generation)

---

## PTU Reference Summary

PTU 1.05 Chapter 11 ("Running the Game") does **not** define formal "density tiers" or prescribe a fixed maximum number of Pokemon in a wild encounter. The rulebook's guidance on encounter size is entirely qualitative:

1. **Encounter Building (p. 473):** The GM calculates total available levels from party size and experience targets, then distributes those levels across enemy Pokemon. The worked example uses 6 Pokemon for an everyday encounter and 6 Pokemon (2 high-level + 4 lower-level) for a significant encounter. No numerical cap is stated.

2. **Action Economy Warning (p. 473):** "A large swarm of low Level foes can quickly overwhelm even the strongest of parties. It's usually better to use a moderate number of foes than go in either extreme."

3. **Quick-Statting (p. 474):** Suggests "2 or 3 different species" but does not limit total head count.

4. **Swarm Template (p. 476):** For encounters with "a dozen or more" Pokemon, the Swarm Template abstracts them into a single entity with Swarm Multiplier 1 (< 12), 2 (15-25), 3 (25-40), 4 (40-60), 5 (60+). This implies that encounters with 12+ individual combatants are expected at the high end, but are typically abstracted.

**Key takeaway:** PTU imposes no hard upper bound on individual Pokemon in an encounter. The number is entirely GM discretion. The Swarm Template exists as an optional abstraction for large groups, but the rulebook never says "you may not have more than N Pokemon."

---

## Verification Checklist

### 1. Do the app's density tier ranges match PTU?

The density tiers (`sparse`, `moderate`, `dense`, `abundant`) are **app-defined homebrew constants**, not PTU-specified values. PTU does not define density tiers at all. The app's ranges are:

| Tier | Min | Max |
|------|-----|-----|
| sparse | 2 | 4 |
| moderate | 4 | 8 |
| dense | 8 | 12 |
| abundant | 12 | 16 |

These are reasonable homebrew ranges for an encounter generation tool. The values align with PTU's qualitative guidance — everyday encounters typically have 4-6 Pokemon, while the upper end of "abundant" (16) approaches the Swarm Template threshold (~12).

**Verdict: ACCEPTABLE.** App-defined tiers; no PTU violation.

### 2. Does the fix allow the correct maximum spawn count?

Before the fix: `Math.min(count, 10)` capped all spawns at 10, making the Abundant tier's 12-16 range unreachable.

After the fix: `MAX_SPAWN_COUNT` is derived dynamically as `Math.max(...Object.values(DENSITY_RANGES).map(r => r.max))`, which evaluates to **16** (from `abundant.max`).

All 5 hard-coded `10` values were replaced:
- Server: manual override path (line 105) and density-based path (line 113)
- UI: HTML input `max` attribute (line 46), display calculation in `GenerateEncounterModal.vue` (line 354), display calculation in `ModificationCard.vue` (line 190)

**Verdict: CORRECT.** The cap now matches the highest defined density tier.

### 3. Does PTU define an upper bound that should be enforced?

No. PTU has no hard cap on encounter Pokemon count. The Swarm Template is optional and descriptive, not a rule that forbids encounters with >12 individual Pokemon. A GM tool that allows up to 16 individual combatants is entirely within PTU's guidelines.

The `MAX_SPAWN_COUNT` of 16 is a sensible **practical** cap (performance, usability, tactical grid space) rather than a rules-mandated one.

**Verdict: NO PTU VIOLATION.** No rulebook-mandated cap exists.

### 4. Does the density multiplier interact correctly with the cap?

When a sub-habitat has a `densityMultiplier > 1.0`, the scaled max is computed as:
```
scaledMax = Math.min(MAX_SPAWN_COUNT, Math.round(range.max * densityMultiplier))
```

For example, a `dense` tier (max 12) with a 1.5x multiplier would compute `Math.round(12 * 1.5) = 18`, capped to 16. This is correct behavior — the multiplier scales within bounds, and the cap prevents runaway values.

**Verdict: CORRECT.**

### 5. Is the dynamic derivation of MAX_SPAWN_COUNT sound?

```typescript
export const MAX_SPAWN_COUNT = Math.max(
  ...Object.values(DENSITY_RANGES).map(r => r.max)
);
```

This is a clean, self-maintaining constant. If someone later adds a new density tier with a higher max (e.g., `swarming: { min: 16, max: 24 }`), the cap automatically adjusts. No manual coordination required.

**Verdict: CORRECT.** Good engineering pattern.

---

## Issues Found

**None.** The fix is PTU-correct and internally consistent.

---

## Final Verdict

| Check | Result |
|-------|--------|
| Density tiers match PTU | N/A (homebrew, no PTU equivalent) |
| Fix allows correct max per app tiers | PASS |
| PTU upper bound respected | PASS (none exists) |
| Density multiplier interaction | PASS |
| MAX_SPAWN_COUNT derivation | PASS |

**APPROVED** — No PTU rule violations. The previous hard cap of 10 contradicted the app's own Abundant density tier. The fix correctly raises the cap to 16 using a dynamically derived constant. PTU 1.05 imposes no maximum on individual Pokemon per encounter, so 16 is a valid practical limit.
