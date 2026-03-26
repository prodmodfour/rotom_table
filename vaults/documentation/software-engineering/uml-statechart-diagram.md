# UML Statechart Diagram

A [[uml]] diagram documenting [[uml-dynamic-business-rule|dynamic business rules]] by showing the permitted states and transitions of an object throughout its [[uml-object-lifecycle|lifecycle]].

## Elements

- **Initial state** — source of all objects; not a normal state since objects don't yet exist
- **State** — a set of value combinations in which an object behaves the same in response to events. Not every attribute change creates a new state.
- **Transition** — change from one state to another, triggered by a [[uml-query-and-mutation-events|mutation event]]
- **Internal transition** — a transition from a state to itself; the object handles the event without changing state
- **Guard condition** — a condition that must be met to enable the transition
- **Action** — object activity initiated by an event. Formal keywords: CREATE/DELETE, SET, TIE TO, CUT FROM
- **Final state** — end of an object's existence; not a real state

## Key principle

"What is not written is just as important as what is written." Events not documented for a state are not accepted — their absence represents unavailable transitions requiring error messages.

## In UML 2.0

[[uml-2-0|UML 2.0]] introduced connection points for improved modularization of statechart diagrams.

## See also

- [[uml-constructing-statechart-diagrams]] — construction steps and verification checklists
- [[uml-class-diagram]] — documents static business rules; statecharts document dynamic ones
- [[uml-behavioral-view]] — the modeling perspective that uses statechart diagrams
