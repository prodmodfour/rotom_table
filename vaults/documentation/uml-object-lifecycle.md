# UML Object Lifecycle

Objects representing real-world entities possess two interconnected but distinct lives: one in reality and one within an IT system. Both commence at creation and conclude at deletion, following prescribed courses governed by [[uml-business-rules|business rules]].

## Birth

A [[uml-query-and-mutation-events|mutation event]] always triggers object creation. The IT object may exist before the physical entity (e.g., aircraft sell before construction completes) or after it.

## Life

Between birth and death, objects experience:
- Reading operations triggered by query events
- Modification operations triggered by mutation events

[[uml-dynamic-business-rule|Dynamic business rules]] determine which events are permitted at specific moments and how objects respond.

## Death

A mutation event triggers deletion. IT deletion may precede physical destruction (objects resell) or follow it.

## Statechart representation

The [[uml-behavioral-view|behavioral view]] documents the lifecycle through [[uml-statechart-diagram|statechart diagrams]] — one per class, showing permitted states, transitions, and the events that trigger them.

## See also

- [[uml-statechart-diagram]] — the diagram that formalizes lifecycles
- [[uml-class-diagram]] — defines the attributes that change during the lifecycle
