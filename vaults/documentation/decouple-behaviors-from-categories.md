Status condition categories (volatile, persistent, other) are for display and grouping only. Mechanical behaviors (clearing on recall, clearing on faint, clearing on encounter end) are specified per-condition via [[condition-independent-behavior-flags]].

The old pattern of `RECALL_CLEARED_CONDITIONS = [...VOLATILE_CONDITIONS]` was too rigid — it made it impossible to have a volatile condition that doesn't clear on recall (like [[sleep-volatile-but-persists]]). The decoupled model gives each condition whatever combination of behaviors is correct without forcing it into a rigid package.

This is an application of [[specific-text-over-general-category]]: when a condition's specific text contradicts what its category would imply, the specific text wins.

## See also

- [[condition-source-tracking]]
- [[suppressed-frequency-downgrade]] — Suppressed is a volatile condition with unique frequency-modifying behavior
