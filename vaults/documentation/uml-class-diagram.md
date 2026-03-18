# UML Class Diagram

A [[uml]] diagram showing classes, their attributes, relationships (associations), and behavior (methods). The best-known diagram in the object-oriented approach — and unfortunately, often the only one constructed.

## Elements

- **Class** — a relevant concept from the domain; a set of persons, objects, or ideas depicted in the system. Functions as both a pattern dictating characteristics and a set containing all objects created from that pattern.
- **Attribute** — a characteristic of a class that is of interest to users
- **Association** — a relationship between two classes with specifically defined meaning. Includes a name, optional direction triangle, and multiplicities.
- **Multiplicity** — statements about object count in an association. Common: `1..1` (exactly one), `0..1`, `1..*`, `0..*`, `*`. Custom ranges like `2..4` are also valid.
- **Aggregation** — special association meaning "consists of," shown with a white diamond. Semantically equivalent to a named association with the same meaning.
- **Generalization** — connects general class (superclass) with specialized class (subclass). See [[uml-generalization-specialization]].

## Reading

Standard pattern: "One object of class A has an association with N objects of class B." A direction triangle clarifies reading direction. Associations document [[uml-business-rules|static business rules]].

In business system modeling, multiplicities are intentionally omitted for clarity — they become relevant in IT system modeling. Association labels are essential: "in case of doubt, label too much rather than too little."

## See also

- [[uml-constructing-class-diagrams]] — top-down and bottom-up construction approaches
- [[uml-statechart-diagram]] — documents dynamic business rules that class diagrams cannot express
