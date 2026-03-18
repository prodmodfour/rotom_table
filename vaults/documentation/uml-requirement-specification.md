# UML Requirement Specification

Models of the system to be developed make up an integral part of every requirement specification. Three factors determine the specification approach:

1. **Who** is specifying (user agent or IT agent)
2. **For whom** (target audience)
3. **What** is being specified (which model and view)

## Model-to-purpose mapping

| Model | View | Purpose |
|-------|------|---------|
| [[uml-modeling-business-systems\|Business System]] | [[uml-external-view\|External]] | Business documentation |
| Business System | [[uml-internal-view\|Internal]] | Basis for IT system specification |
| [[uml-modeling-it-systems\|IT System]] | External | System requirements |
| IT System | Structural, Behavioral, Interaction | IT system specification |
| [[uml-modeling-system-integration\|System Integration]] | Process, Static | Integration specification |

All views can only be verified by user agents with respect to correctness of content. Using a unified modeling language prevents misunderstanding through misinterpretation when multiple groups collaborate.
