# Constructing UML Communication Diagrams

Step-by-step guide for building [[uml-communication-diagram|communication diagrams]] in the [[uml-interaction-view|interaction view]], documenting [[uml-query-and-mutation-events|query event]] flow.

## Construction steps

1. **Draft query result** — sketch the expected display or printout. Identify which elements are data from the IT system vs fixed labels.
2. **Identify involved classes** — determine which classes in the [[uml-class-diagram|class diagram]] supply the needed attributes. Note any missing classes.
3. **Define initial object** — which object is already known? Where does the query start?
4. **Design event path** — trace a path through class associations to reach all needed objects. For simple queries, marking the path on a class diagram printout may suffice.
5. **Amend event path** — add iterations (asterisk: query all related objects) or selections (filter to specific objects) where multiplicities allow multiple targets
6. **Identify necessary attributes** — document which attributes answer the query. All data elements in the result must trace back to class diagram attributes.
7. **Verify** — can the result be constructed? Do event paths follow associations? Are iterations/selections specified correctly?

## See also

- [[uml-constructing-sequence-diagrams]] — the companion guide for mutation event flows
