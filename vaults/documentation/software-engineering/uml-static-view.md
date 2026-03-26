# UML Static View

A [[uml-view|view]] within [[uml-modeling-system-integration|system integration modeling]] describing the structure of [[uml-business-object|business objects]] exchanged as [[uml-system-integration-message|message]] arguments. Uses only [[uml-class-diagram|class diagrams]].

## Design considerations

Business objects must satisfy competing requirements:
- **Semantic integrity** — clear and understandable to all parties
- **Coherence** — consistent interpretation by all involved
- **Reusability** — designed for use across the system
- **Completeness** — handles even rare demands without ambiguity

These requirements conflict, so the structure of any business object represents a compromise. "The ideal business object can never be found."

## See also

- [[uml-constructing-integration-class-diagrams]] — construction steps including data transformation
- [[uml-data-transformation]] — how IT system data maps to business object structure
- [[uml-electronic-data-interchange]] — target formats for exchanged business objects
- [[uml-process-view]] — the companion view describing interaction flow
