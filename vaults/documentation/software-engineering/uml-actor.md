# UML Actor

A role that an outsider takes when interacting with a system. Actors may be humans, organizations, or IT systems. Roles matter more than entity types — whether a person, machine, or system fills a role is less important than understanding which role exists.

## Key characteristics

- Actors are always located **outside** the system they interact with
- One person can occupy multiple roles simultaneously
- A [[uml-business-process|business use case]] begins when an actor initiates it
- Activities initiated by internal employees represent the [[uml-internal-view|internal view]], not the external

## Business vs IT system actors

The same person may be an actor in one context but not another:
- Passengers are business system actors but become IT system actors only during automated check-in
- Check-in employees are IT system actors (they operate the system) but not business system actors
- Check-in representatives are business system actors only

## Representation

Stick figures are traditional, but other symbols can be used for practical, readable diagrams. Each actor has a name clarifying their role using domain-specific terminology.

## See also

- [[uml-use-case-diagram]] — diagrams showing actors and their associated use cases
- [[uml-worker]] — internal roles within a business system, distinct from external actors
