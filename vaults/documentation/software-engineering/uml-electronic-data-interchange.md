# UML Electronic Data Interchange

Electronic Data Interchange (EDI) is the standardized exchange of business documents (orders, invoices, shipping information) between organizational IT systems.

## Standards

- **UN/EDIFACT** — international standard for electronic data exchange in administration, economics, and transportation. Represents complex hierarchical message structures. All three [[uml-system-integration-message|message]] components exist in one transfer unit. Freely available.
- **ANSI X12** — US-centric EDI standard
- **SWIFT** — financial messaging standard
- **XML** — exceeds EDI scope; adopted through bottom-up acceptance. Standardized by W3C with related standards (XSL, Xlink). Evolved more rapidly than EDIFACT.

## UML as neutral foundation

Rather than creating messages directly in proprietary formats, the recommended approach involves modeling in [[uml]] first, then transforming to target formats. This enables format conversion and migration. The *UML Profile for Enterprise Distributed Object Computing* and *Model Driven Architecture (MDA)* provide transformation guidelines.

## See also

- [[uml-static-view]] — describes the structure of exchanged business objects
- [[uml-enterprise-application-integration]] — the broader discipline of connecting applications
