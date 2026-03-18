A streamlined UI workflow for allocating trainer combat stats during level-up. The app presents the available points and valid allocation targets, validates against PTU constraints, and applies changes in one step.

This is [[automate-routine-bookkeeping]] applied to the level-up experience — reducing a multi-step manual process to a guided flow. The workflow prevents invalid allocations (e.g., exceeding per-stat caps) by disabling options that would violate [[trainer-stat-budget]] constraints.

## See also

- [[automate-routine-bookkeeping]] — the design principle this implements
- [[trainer-stat-budget]] — the allocation constraints the workflow enforces
- [[trainer-level-up-wizard]] — the broader level-up flow this workflow belongs to
- [[six-trainer-combat-stats]] — the stats being allocated
