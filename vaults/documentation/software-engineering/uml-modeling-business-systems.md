# UML Modeling Business Systems

The [[uml]] approach to modeling [[uml-business-system|business systems]] through two complementary [[uml-view|views]]:

## External view

The [[uml-external-view|external view]] shows what the business system looks like from outside — the perspective of customers, partners, and suppliers. Uses:
- [[uml-use-case-diagram|Use case diagrams]] — overview of available goods and services
- [[uml-activity-diagram|Activity diagrams]] — procedures and process flows
- [[uml-sequence-diagram|Sequence diagrams]] — chronological interaction chains

Not every diagram is needed in every case. Selection depends on which system characteristics require emphasis.

## Internal view

The [[uml-internal-view|internal view]] shows what happens inside — employees, workflows, IT systems. Uses:
- [[uml-package-diagram|Package diagrams]] — organizational units, workers, and business objects
- [[uml-class-diagram|Class diagrams]] — relationships between workers and business objects
- [[uml-activity-diagram|Activity diagrams]] — internal processes (focus shifts from actor interactions to worker responsibilities)

## Modeling approach

Begin with the external view, describing the system from outsiders' perspectives. The use cases from the external view serve as foundations for constructing test scenarios. Then model the internal view to understand how goods and services are delivered.

## See also

- [[uml-modeling-it-systems]] — models the computer-based system that supports business processes
- [[uml-modeling-system-integration]] — models how IT systems connect to each other
