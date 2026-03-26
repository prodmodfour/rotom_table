Where PTR formulas can produce degenerate results — zero damage, negative stats, division by zero — Rotom Table adds minimum floors. This is a deliberate divergence from RAW, not an accident.

The [[nine-step-damage-formula]] can produce zero or negative values at extreme stat combinations. A minimum damage floor of 1 preserves the formula's structure while ensuring that any attack that hits always does something. Similarly, derived stats are floored to prevent nonsensical negatives.

Floors are always the smallest value that prevents the absurd result. They do not round up to "reasonable" values — they prevent the degenerate case and nothing more.

## See also

- [[raw-fidelity-as-default]] — floors are an intentional divergence, documented as such
- [[per-conflict-decree-required]] — each floor is its own decree with its own justification
