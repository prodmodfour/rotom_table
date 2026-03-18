# Constructing UML Activity Diagrams

Step-by-step guide for building [[uml-activity-diagram|activity diagrams]] in both [[uml-external-view|external]] and [[uml-internal-view|internal]] views.

## Construction steps

1. **Collect information sources** — same techniques as [[uml-constructing-use-case-diagrams|use case construction]]
2. **Find activities and actions** — derive from use cases; ask what work steps are required, what each actor performs, what events trigger steps
3. **Connect actions** — determine processing order, required conditions, necessary branches, simultaneous actions, and completion dependencies
4. **Adopt actors/workers** — assign responsibility for each action into activity partitions (swim lanes)
5. **Refine activities** — determine which actions need further decomposition in separate activity diagrams
6. **Verify** — collaborate with domain experts to check correctness

## Approach

Start with high-level activity diagrams spanning multiple use cases, then refine individual scenarios. Consciously determine detail levels — test acceptable detail with the target audience.

An alternative partitioning strategy: divide by manual, automated, and semi-automated actions to create a foundation for converting flows into IT systems.

## Verification checklist

- Output conditions must not overlap (ambiguous control flow)
- Conditions must cover all possibilities (insert "else" when uncertain)
- Forks and joins must balance (matching flow counts)
- External view: only outsider-visible functionality; Internal view: only internal procedures
