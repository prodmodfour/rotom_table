Conditions in the "Other" category (Stuck, Tripped, Vulnerable, Trapped, Blindness) do not clear on faint by default — this is a key difference from volatile conditions as defined in [[status-condition-categories]].

However, their behavior on faint depends on their *source*. A move-inflicted Stuck clears on faint because the move's effect has ended — the source is gone. A terrain-based Stuck persists because the terrain source is still active and will re-impose the condition regardless.

[[condition-source-tracking]] enables this source-aware behavior. Each condition instance records its source (move, ability, terrain, weather, item, GM-applied). On faint, the system checks whether the source is still active:
- **Transient sources** (moves, abilities of fainted Pokemon): condition clears
- **Persistent sources** (terrain, weather, field effects): condition persists

This avoids the awkward tabletop pattern where a Pokemon faints, Stuck clears, the Pokemon is revived, and Stuck immediately re-applies because the terrain is still there. The app skips the unnecessary clear-and-reapply cycle for persistent sources.

## See also
- [[condition-source-tracking]] — provides the source information for faint decisions
- [[condition-independent-behavior-flags]] — faint behavior is flag-based, refined by source
- [[status-condition-categories]] — Other conditions defined here
- [[faint-and-revival-effects]] — the broader faint processing pipeline
