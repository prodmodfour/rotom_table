---
id: decree-need-046
title: "Should faint clearing expand to Other category conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable)?"
priority: P3
severity: medium
status: addressed
decree_id: decree-047
domain: combat
source: code-review-327 HIGH-001
created_by: slave-collector (plan-20260304-144401)
created_at: 2026-03-04
affected_files:
  - app/constants/statusConditions.ts
---

## Summary

PTU p.248 states: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." The refactoring-106 implementation (per decree-038) sets `clearsOnFaint: true` for all Other category conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable), expanding the faint-cleared set from 14 (persistent + volatile) to 19 conditions.

## The Ambiguity

RAW explicitly mentions only "Persistent and Volatile" for faint clearing. Other conditions (Stuck, Slowed, Trapped, Tripped, Vulnerable) are not addressed.

**Argument for expanding:** A fainted Pokemon pragmatically cannot be Stuck, Tripped, or Trapped — these conditions have no meaningful effect on a fainted entity. Leaving them on is technically correct per RAW but creates invisible dead state.

**Argument against expanding:** The old code (before refactoring-106) only cleared persistent and volatile conditions on faint. Expanding is a behavioral change that contradicts the refactoring-106 acceptance criteria ("All existing condition behaviors are preserved"). If the behavior is desired, it should be an explicit decision.

## Options

1. **Keep expansion** — Set `clearsOnFaint: true` for Other conditions. Pragmatic improvement, conditions are meaningless on fainted Pokemon.
2. **Revert to RAW** — Set `clearsOnFaint: false` for Other conditions. Match old behavior and literal RAW text.
3. **Selective** — Only clear some Other conditions on faint (e.g., Trapped and Stuck are physical states that faint should clear, but Slowed/Vulnerable might persist for edge cases).

## Related

- decree-038 (Sleep persistence through recall/encounter end)
- code-review-327 HIGH-001 (flagged this expansion)
- refactoring-106 (the ticket implementing the behavior decoupling)
