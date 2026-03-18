# UML Modeling System Integration

The [[uml]] approach to modeling how IT systems exchange information, comprising two [[uml-view|views]]:

## Process view

The [[uml-process-view|process view]] depicts activities when IT systems exchange [[uml-system-integration-message|messages]]:
- [[uml-activity-diagram|Activity diagrams]] — action dependencies and [[uml-business-object|business object]] flow between systems
- [[uml-sequence-diagram|Sequence diagrams]] — chronological order of message exchange

Purely technical processes (dial-up, connection protocols) are excluded.

## Static view

The [[uml-static-view|static view]] describes the structure of business objects sent as message arguments:
- [[uml-class-diagram|Class diagrams]] — content and structure of exchanged business objects

## Foundation

The [[uml-modeling-business-systems|business system model]] provides the foundation. From business processes, those requiring interaction between IT systems are selected.

Two integration approaches:
- **Internal integration** — IT systems within the same business system; uses internal view diagrams
- **External integration** — IT systems outside the business system; uses external view diagrams

## See also

- [[uml-system-integration-interface]] — the fundamental building blocks of integration
- [[uml-enterprise-application-integration]] — methods for connecting applications within organizations
- [[uml-electronic-data-interchange]] — standards for exchanging data between systems
- [[uml-data-transformation]] — mapping IT system data to message format
