# UML Modeling IT Systems

The [[uml]] approach to modeling an IT system through four [[uml-view|views]], building on the [[uml-modeling-business-systems|business system model]] as foundation.

## External view

The [[uml-external-view|external view]] treats the IT system as a black box. [[uml-actor|Actors]] interact with it through use cases without seeing internal mechanics. Uses:
- [[uml-use-case-diagram|Use case diagrams]] — all users and available tasks
- Use case [[uml-sequence-diagram|sequence diagrams]] — flows described as [[uml-query-and-mutation-events|query and mutation events]]
- Interface prototypes — potential UI designs

## Structural view

The [[uml-structural-view|structural view]] shows the static internal structure:
- [[uml-class-diagram|Class diagrams]] — classes, attributes, associations, and multiplicity
- Documents [[uml-static-business-rule|static business rules]]

## Behavioral view

The [[uml-behavioral-view|behavioral view]] shows dynamic object behavior:
- [[uml-statechart-diagram|Statechart diagrams]] — one per class, showing permitted states and transitions
- Documents [[uml-dynamic-business-rule|dynamic business rules]]

## Interaction view

The [[uml-interaction-view|interaction view]] reveals what happens inside when processes execute:
- [[uml-communication-diagram|Communication diagrams]] — query event flow between objects
- [[uml-sequence-diagram|Sequence diagrams]] — mutation event propagation between objects

## See also

- [[uml-modeling-business-systems]] — the business model provides the foundation
- [[uml-modeling-system-integration]] — how the IT system connects to external systems
