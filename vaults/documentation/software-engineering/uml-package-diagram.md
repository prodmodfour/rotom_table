# UML Package Diagram

A [[uml]] diagram depicting organization units as packages in the [[uml-internal-view|internal view]] of a [[uml-business-system|business system]]. Packages can contain [[uml-worker|workers]], [[uml-business-object|business objects]], and other organization units.

## Elements

- **Package "Organization Unit"** — shown with the stereotype <<Organization Unit>> in a small upper-left box. The main box lists important elements.
- **Worker** — people who execute business processes, shown with a distinctive symbol (actor inside circle) or class notation with <<Worker>> stereotype
- **Business Object** — passive items like tickets and luggage, shown with their own symbol or class notation with <<Business Object>> stereotype

## Key principles

- Organization units represent abstractions of individual jobs within an organization
- Units within the business system are modeled as packages; those outside are [[uml-actor|actors]]
- A single symbol represents a role that can be fulfilled by any number of real people
- Package diagrams should not be confused with organization charts — they include business objects alongside employees

## See also

- [[uml-constructing-package-diagrams]] — construction steps and verification checklists
- [[uml-class-diagram]] — shows relationships between the workers and objects introduced in package diagrams
