When game data has associated metadata that affects mechanics, prefer structured objects over string conventions. String suffixes (like [[branching-class-suffix-pattern]]) are acceptable for simple single-field specializations where uniqueness is the goal. But when metadata is multi-field or type-specific, structured objects are preferred.

This is why [[structured-edge-objects]] uses `{ name, metadata: {...} }` instead of a suffix pattern — edge metadata (like Categoric Inclination's chosen category) is richer than a branching class specialization.

Structured data enables [[automate-routine-bookkeeping]] by making mechanical effects queryable without fragile string parsing.
