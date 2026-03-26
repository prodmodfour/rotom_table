# UML Dynamic Business Rule

A [[uml-business-rules|business rule]] that can only be verified when specific events occur and addresses object behavior. Documented in [[uml-statechart-diagram|statechart diagrams]] within the [[uml-behavioral-view|behavioral view]].

Examples:
- "A plane cannot be assigned a flight during maintenance"
- "A plane cannot be withdrawn if flights remain scheduled"
- "A frequent flyer card cannot accumulate miles while suspended"

These rules connect specific [[uml-query-and-mutation-events|mutation events]] to specific object states, determining whether events are permitted and how objects respond.

## See also

- [[uml-static-business-rule]] — rules verifiable at any time
- [[uml-object-lifecycle]] — the lifecycle that dynamic rules govern
