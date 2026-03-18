# Data Clumps

A [[bloater-smells|bloater]] [[code-smells|smell]]. Groups of variables that frequently appear together in multiple places — for example, database connection parameters (host, port, username, password) repeated across classes.

These clumps should be extracted into their own classes. Even if the resulting class only holds data at first, it creates a natural home for behavior that operates on those values.

## See also

- [[introduce-parameter-object]] — the primary technique for bundling data clumps into an object
- [[long-parameter-list-smell]] — data clumps often manifest as repeated parameter groups
- [[data-class-smell]] — extracting data clumps sometimes produces data classes, which may need further refinement
- [[combatant-interface-breadth]] — groups of fields in Combatant that always appear together
