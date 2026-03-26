# Constructing UML Statechart Diagrams

Step-by-step guide for building [[uml-statechart-diagram|statechart diagrams]] in the [[uml-behavioral-view|behavioral view]].

## Construction steps

1. **Identify [[uml-query-and-mutation-events|mutation events]]** — what triggers object creation? What modifies attributes, relationships, or state? What triggers deletion?
2. **Group events chronologically** — categorize into birth events, operational events, and death events
3. **Model states and transitions** — begin with a simple initial→normal→final structure, then add mutation events while considering when events are permitted and conditional dependencies
4. **Add actions** — specify object responses using formal keywords: CREATE/DELETE, SET, TIE TO, CUT FROM
5. **Verify** — explicit final states exist, all states connect to termination, unique state-specific events, guard conditions are mutually exclusive

## Focus

Not every class needs a statechart diagram. Prioritize classes that contain many or important [[uml-dynamic-business-rule|dynamic business rules]] or describe important objects.

## See also

- [[uml-object-lifecycle]] — the lifecycle concept that statecharts formalize
