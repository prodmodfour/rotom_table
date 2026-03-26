# UML Process View

A [[uml-view|view]] within [[uml-modeling-system-integration|system integration modeling]] depicting the activities an IT system passes through when exchanging [[uml-system-integration-message|messages]] with other IT systems. Purely technical communication processes (dial-up, protocols) are excluded.

Uses [[uml-activity-diagram|activity diagrams]] for action dependencies and [[uml-business-object|business object]] flow, and [[uml-sequence-diagram|sequence diagrams]] for chronological message ordering.

## Foundation

The [[uml-modeling-business-systems|business system model]] provides the foundation. From its processes, those requiring IT system interaction are selected.

Activity diagrams show which business objects are exchanged but cannot show whether they are sent as message arguments — that requires sequence diagrams.

Sequence diagrams add chronological ordering and reveal that business objects are transmitted as message arguments, but do not show the underlying actions.

## See also

- [[uml-constructing-process-view-diagrams]] — construction steps and verification checklists
- [[uml-static-view]] — the companion view describing business object structure
