# UML Sequence Diagram

A [[uml]] interaction diagram that focuses on the chronological course of exchanged information between objects. Simpler and more widely accepted than [[uml-communication-diagram|communication diagrams]].

## Elements

- **Objects** — positioned on the x-axis, representing actors and system participants
- **Lifeline** — vertical line showing an object's existence over time; thick rectangles show when the object is active
- **Messages** — displayed chronologically on the y-axis with arrows indicating direction; represent requests between objects
- **Business objects** — data items (tickets, boarding passes) that accompany messages
- **Comments** — annotations explaining activities or conditions at appropriate message levels
- **Interaction reference** — (UML 2.0) modularization construct enabling cross-references to other diagrams

## Variants

- **High-level sequence diagrams** span multiple use cases, giving a coarse overview of business process interactions. Useful as foundation for electronic data transfer documentation.
- **Use case sequence diagrams** combine textual description with sequence notation. Events are classified as [[uml-query-and-mutation-events|query (<<Q>>) or mutation (<<M>>)]] events. The generic actor "Somebody" represents any actor, and the IT system appears as a black box.

## Reading

Read top to bottom following the time axis. Messages flow from sender to receiver. The receiving party's activities appear as a gray vertical bar. Scope is restricted to message exchange — internal processes are not shown.

## See also

- [[uml-constructing-sequence-diagrams]] — construction steps and verification checklists
- [[uml-communication-diagram]] — emphasizes object topology rather than time ordering
- [[uml-activity-diagram]] — shows procedural flow rather than message exchange
