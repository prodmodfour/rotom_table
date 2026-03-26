# UML Query and Mutation Events

In [[uml-modeling-it-systems|IT system modeling]], events represent user actions with IT systems. Standard [[uml]] lacks a built-in distinction, so custom stereotypes are used:

## Query events (<<Q>>)

Events that display information without changing anything in the IT system. The result is displayed information. Documented in [[uml-communication-diagram|communication diagrams]].

## Mutation events (<<M>>)

Events that create, modify, or delete information in the IT system. Success results in data changes; failure means no changes occurred. Both outcomes are communicated to users. Documented in [[uml-sequence-diagram|sequence diagrams]].

Both event types carry implicit feedback — either information display or success/failure messages.

## In use case sequence diagrams

Entire use cases are described as sequences of query and mutation events directed at the IT system (treated as a black box). The generic [[uml-actor|actor]] "Somebody" represents any user.

## See also

- [[uml-object-lifecycle]] — mutation events trigger object creation, state changes, and deletion
- [[uml-statechart-diagram]] — documents which mutation events are permitted in each state
