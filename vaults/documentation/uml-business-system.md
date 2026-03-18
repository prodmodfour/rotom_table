# UML Business System

A business system encompasses both static and dynamic aspects of a business: organizational structures, [[uml-business-object|business objects]], information objects, and [[uml-business-process|business processes]]. Each business system generates economic benefit, and a single business can span multiple systems.

## System boundaries

Defining boundaries is critical for analysis. A business system can span an entire organization or focus on a selected portion. Everything outside the boundary is treated as external — modeled only at its interface with the business system.

Rather than modeling entire external systems, attention focuses on the interfaces between the business system and external systems. The business system must know how to interact with external parties but need not understand their internal operations.

## Two views

A business system is modeled through two complementary [[uml-view|views]]:

- [[uml-external-view]] — what the business system looks like from outside (customer, partner, supplier perspective); constructed first
- [[uml-internal-view]] — what happens inside (employees, workflows, IT systems); typically hidden from outsiders

## See also

- [[uml-modeling-business-systems]] — the modeling perspective that describes business systems
- [[uml-actor]] — the outsiders who interact with the business system
- [[uml-worker]] — the internal roles that operate within the business system
