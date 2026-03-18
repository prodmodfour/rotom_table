# UML System Integration Message

Information exchanged between IT systems via [[uml-system-integration-interface|interfaces]] in [[uml-modeling-system-integration|system integration]].

## Components

1. **Event information** — what action is being triggered
2. **Reference data** — structured information with defined semantics (invoices, passenger lists). Qualifies as a [[uml-business-object|business object]] when coherent, structured, self-contained, and outliving individual interactions.
3. **Control and routing information** — sender/receiver addresses, metadata, checksums, packaging

These components distribute differently depending on the standard used. In UN/EDIFACT, all three exist within a single transfer unit. In XML, reference data and meta-information are built into each message.

## In UML diagrams

Messages appear in [[uml-sequence-diagram|sequence diagrams]] as arrows with name and parameters. The message name specifies the event; arguments contain information for the receiver, potentially including business objects.

## See also

- [[uml-electronic-data-interchange]] — standards for message formatting (EDIFACT, XML)
- [[uml-process-view]] — the view that shows message exchange sequences
