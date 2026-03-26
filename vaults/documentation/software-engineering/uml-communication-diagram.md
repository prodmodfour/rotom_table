# UML Communication Diagram

A [[uml]] interaction diagram emphasizing object relationships and topology rather than chronological ordering. More similar to [[uml-class-diagram|class diagrams]] than [[uml-sequence-diagram|sequence diagrams]], showing how objects connect and forward [[uml-query-and-mutation-events|query events]].

## Elements

- **Actor "Somebody"** — generic actor representing any user, since query events may appear in multiple use cases with different actors
- **Query event** — request for information, sent from actor to IT system objects
- **Parameter** — information attached to events (e.g., ticket number) enabling data retrieval
- **Object** — an instance of a class; the **entry object** is the first to receive a query event
- **Iteration** — indicated by asterisk (*), meaning all objects connected through an association receive the event

## Reading

Unlike sequence diagrams, communication diagrams lack a time dimension — objects can be positioned anywhere. When order matters, numbered event sequences are used. Branching paths can be documented through hierarchical numbering.

Communication diagrams are better suited for query events and parallel interaction paths. Sequence diagrams are better for mutation events with important ordering.

## See also

- [[uml-constructing-communication-diagrams]] — construction steps and verification checklists
- [[uml-sequence-diagram]] — the alternative interaction diagram emphasizing chronological flow
- [[uml-interaction-view]] — the modeling perspective that uses both communication and sequence diagrams
