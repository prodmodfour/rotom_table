# UML Interaction View

A [[uml-view|view]] within [[uml-modeling-it-systems|IT system modeling]] that reveals what happens inside the system when processes execute. Analogy: even with a detailed plan of an oil refinery, the conversion process only becomes understandable when the flow is explained.

## Relationship to other views

- A complete [[uml-class-diagram|class diagram]] is **verified** through interaction modeling
- An incomplete class diagram is **enhanced and completed** through interaction modeling
- [[uml-use-case-diagram|Use cases]] show the external black box; interaction views open that box

## Two diagram types

- [[uml-communication-diagram|Communication diagrams]] — document [[uml-query-and-mutation-events|query event]] flow; better for parallel paths
- [[uml-sequence-diagram|Sequence diagrams]] — document mutation event propagation; better for important ordering

In practice, not every flow of every query and mutation is documented — the effort would be too great. Focus on verification of the [[uml-structural-view|structural view]], user importance, and complexity.

## How object-oriented systems function

Objects either perform work directly or delegate to other objects. Events flow between objects along associations in the class diagram. Objects must "know" each other through associations to send events.

## See also

- [[uml-constructing-communication-diagrams]] — construction steps for query flow diagrams
- [[uml-constructing-sequence-diagrams]] — construction steps for mutation flow diagrams
