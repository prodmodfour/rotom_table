# UML 2.0

A complete revision of [[uml]] introducing two primary documents:

- **Infrastructure** — defines basic constructs of the language; targets tool developers
- **Superstructure** — defines user constructs that practitioners work with

Documentation grew from ~730 pages (UML 1.5) to ~1,050 pages. The specification also includes the Object Constraint Language (OCL) and Diagram Interchange.

## Key changes

- [[uml-activity-diagram|Activity diagrams]] became independent from [[uml-statechart-diagram|statechart diagrams]]; individual steps now called "actions" within "activities"; multiple initial states and input/output parameters supported
- [[uml-sequence-diagram|Sequence diagrams]] gained interaction references for modularization, iteration operators, and cross-references to other diagrams
- OCL became inherent to UML, enabling precise invariants, preconditions, and postconditions
- [[uml-statechart-diagram|Statechart diagrams]] introduced connection points for improved modularization
- [[uml-class-diagram|Class diagrams]] and [[uml-use-case-diagram|use case diagrams]] remained substantially unchanged

## Practical implications

UML 2.0 represents an improvement rather than a fundamental restructuring. Organizations can adopt it for new models while maintaining compatibility with earlier constructs. The authors use an "iceberg" metaphor — simplified, practical constructs suffice for most IT project teams despite extensive underlying specifications.
