# UML Business Object

A passive, structured data item within a [[uml-business-system|business system]] that does not initiate interactions. Business objects can participate in multiple use cases, outlive individual interactions, and connect different processes and [[uml-worker|workers]].

Examples: tickets, luggage, boarding passes, orders, passenger lists.

In [[uml-modeling-system-integration|system integration]], business objects are the structured information transmitted as message arguments between IT systems. They must be coherent, clearly understandable to all parties, reusable, and complete enough to handle edge cases.

## In package diagrams

Represented with the <<Business Object>> stereotype or a dedicated symbol in [[uml-package-diagram|package diagrams]].

## See also

- [[uml-system-integration-message]] — business objects travel as message arguments
- [[uml-class-diagram]] — models the structure and relationships of business objects
