# Constructing UML Class Diagrams

Step-by-step guide for building [[uml-class-diagram|class diagrams]], combining two analysis approaches.

## Top-down analysis

1. **Identify and model classes** — analyze domain knowledge, expert discussions, documentation. What are the most important things in the system?
2. **Identify and model associations** — what relationships exist between class pairs? Establish multiplicities.
3. **Define attributes** — what information is required about each class?

## Bottom-up analysis

4. **List required queries and inputs** — catalog what the system must answer and accept, building from use cases and business processes
5. **Formulate displays** — precisely define how results and inputs appear, using existing forms and prototypes
6. **Information analysis** — create individual class diagrams per query/input, identifying data elements, objects, relationships, and reusable classes
7. **Consolidate** — merge individual diagrams into one cumulative model, resolving naming inconsistencies and redundancies
8. **Verify** — completeness (can the diagram answer all required queries?) and correctness (collaborative review)

## Business system context

In [[uml-internal-view|internal view]] class diagrams, classes come from [[uml-package-diagram|package diagrams]]. Associations require meaningful labels with direction triangles. Multiplicities are omitted at the business level for clarity — they become relevant in [[uml-modeling-it-systems|IT system modeling]].

## See also

- [[uml-generalization-specialization]] — grouping classes into hierarchies during construction
