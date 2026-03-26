# Constructing UML Use Case Diagrams

Step-by-step guide for building [[uml-use-case-diagram|use case diagrams]] in both [[uml-modeling-business-systems|business system]] and [[uml-modeling-it-systems|IT system]] contexts.

## Construction steps

1. **Collect information sources** — knowledge carriers (employees, users, customers, domain experts), observation, interviews, brainstorming, document review
2. **Identify potential actors** — who are the customers, partners, internal units, external systems?
3. **Identify potential use cases** — what goods and services are provided? The more candidates, the better.
4. **Connect use cases to actors** — which actor can perform which functionality?
5. **Describe actors** — names using domain terminology, plus responsibility descriptions
6. **Search for additional use cases** — what precedes, follows, or happens if a use case isn't performed?
7. **Edit use cases for scope** — ensure each is behaviorally related, actor-initiatable, and yields tangible results
8. **Document use cases** — use case diagrams alone are insufficient; supplement with [[uml-activity-diagram|activity]] and [[uml-sequence-diagram|sequence diagrams]]
9. **Model relationships** — extract include relationships for repeated interaction patterns
10. **Verify** — knowledge carriers validate completeness, extent, detail level, relationships, and terminology

## Scope criteria

Prevent oversized use cases (entire system in one use case) and undersized ones (no tangible result, never performed alone). Each use case should deliver a relevant result and consist of a behaviorally related interaction sequence.

## Common pitfalls

Maintain low abstraction levels for comprehensibility. Never mix IT terminology with business process language at the business level — technical jargon alienates non-technical stakeholders and prevents user verification.
