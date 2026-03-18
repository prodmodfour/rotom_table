# Constructing UML Sequence Diagrams

Step-by-step guide for building [[uml-sequence-diagram|sequence diagrams]] in external views and [[uml-interaction-view|interaction views]].

## External view construction

1. **Designate actors and business system** — interaction partners from [[uml-use-case-diagram|use case diagrams]]
2. **Designate initiators** — which actor starts the interaction?
3. **Describe message exchange** — document requests and [[uml-business-object|business objects]] exchanged
4. **Identify interaction order** — messages arranged chronologically top to bottom
5. **Insert additional information** — comments at significant points only
6. **Verify** — one per use case, one business system object maximum, actors match use case assignments

## Interaction view construction (mutation events)

1. **Identify involved classes** — check which [[uml-statechart-diagram|statechart diagrams]] contain the mutation event; also examine nearby classes in the [[uml-class-diagram|class diagram]]
2. **Determine initial object** — which object is already known? Where does the event go first?
3. **Propagate events** — forward mutation events along associations to all affected classes
4. **Specify event parameters** — what information do objects need to process the mutation?
5. **Verify** — all affected classes listed; events follow associations in the class diagram

## See also

- [[uml-constructing-communication-diagrams]] — the companion guide for query event flows
