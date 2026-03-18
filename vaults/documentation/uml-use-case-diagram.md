# UML Use Case Diagram

A [[uml]] diagram that shows [[uml-actor|actors]], use cases, and the relationships between them. Use case diagrams do not describe procedures, chronological sequence, or alternative scenarios — they provide an overview of system functionality.

## Elements

- **Actor** — a role that an outsider takes when interacting with a system. Represented as stick figures or custom symbols. One person can occupy multiple roles.
- **Use case** — an interaction between an actor and a system describing functionality the actor can utilize. Described from the actor's perspective.
- **Association** — relationship between actor and use case indicating the actor can use that functionality. Multiple actors at one use case means each can perform it independently, not together.
- **Include relationship** — indicates one use case is included in another (arrow points toward the included use case). Captures repeated interaction patterns to reduce redundancy.
- **Subject** — optional rectangle surrounding use cases, representing the system boundary.

## Reading

Position in the diagram carries no semantic meaning — vertical arrangement does not imply execution order. Begin with either actors or use cases based on analysis needs, then trace associations.

At the business level, the term "business use case" replaces "use case" to maintain clear separation during transition to [[uml-modeling-it-systems|IT system models]].

## See also

- [[uml-constructing-use-case-diagrams]] — step-by-step construction and verification checklists
- [[uml-activity-diagram]] — describes the procedures that use case diagrams omit
- [[uml-sequence-diagram]] — shows the chronological interactions within use cases
