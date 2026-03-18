# Constructing UML Process View Diagrams

Step-by-step guide for building diagrams in the [[uml-process-view|process view]] of [[uml-modeling-system-integration|system integration]].

## Construction steps

1. **Determine interfaces** — select business processes requiring interaction between IT systems from the [[uml-modeling-business-systems|business system model]]
2. **Identify involved systems** — which IT systems execute the processes? Which initiates? Which concludes?
3. **Identify activities and control flow** — what actions enable message exchange? What order, conditions, simultaneous actions, and dependencies apply?
4. **Define messages** — which [[uml-system-integration-message|messages]] are exchanged? What [[uml-business-object|business objects]] do they carry?
5. **Define rules** — message exchanges operate under contractual agreements, international treaties, statutes, and industry standards
6. **Verify** — all confirmations present, all involved systems appear, all business objects exist as message arguments

## Verification: sequence diagrams

- Every exchanged business object appears as a message argument
- Message flow corresponds to object flow in [[uml-activity-diagram|activity diagrams]]

## Verification: activity diagrams

- Only message-exchange flows included (business processes belong in business models)
- Object flow visible with all business objects listed
- Output conditions do not overlap; conditions encompass all possibilities
- Forks and joins balance properly
