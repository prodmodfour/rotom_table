# UML Generalization and Specialization

Mechanisms in [[uml]] for modeling hierarchical relationships between classes in [[uml-class-diagram|class diagrams]].

## Generalization

Extracting shared characteristics (attributes, associations, methods) from two or more classes into a generalized superclass. The original classes become subclasses. Shared attributes exist only in the superclass but automatically apply to all subclasses.

## Specialization

Creating new subclasses from an existing class when certain attributes apply only to some objects. The specialized attribute is placed in the appropriate subclass.

## Three rules

1. **Inheritance** — all statements about a superclass apply to all subclasses. Subclasses inherit attributes, associations, and operations.
2. **Behavioral compatibility** — anything done with a superclass object can also be done with a subclass object.
3. **Semantic validity** — a subclass must be a special form of the superclass in the domain's terminology. Counter-example: "a flight is not a special case of a flight number."

## See also

- [[uml-class-diagram]] — the diagram that shows generalization hierarchies
