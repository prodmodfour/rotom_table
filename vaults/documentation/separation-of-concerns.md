# Separation of Concerns

"Each module should address a distinct aspect of the problem."

Code should be organized so that each unit deals with one concern — a distinct area of functionality or domain knowledge. When concerns are mixed, a change in one domain forces changes in unrelated code that happens to share the same module.

Analogy: a hospital separates surgery, pharmacy, and billing into different departments. Even though a single patient interacts with all three, mixing them into one room would make every department harder to operate.

In code: a Vue component that computes game-rule-derived values, handles click events, manages local UI state, and renders templates has four concerns in one file. Extracting domain logic, interaction logic, and presentation into separate units lets each change independently.

Separation of Concerns is broader than [[single-responsibility-principle]]. SRP asks "how many reasons does this class have to change?" — a question about change frequency. SoC asks "how many unrelated domains does this module touch?" — a question about conceptual cohesion. A class can satisfy SRP (one reason to change) while violating SoC (mixing UI and domain knowledge in a way that is conceptually confused but happens to change together). In practice, SoC violations tend to become SRP violations as a project matures and concerns begin changing at different rates.

Coined by Edsger Dijkstra in 1974.

## See also

- [[single-responsibility-principle]] — the SOLID formalization of a related but distinct idea; SRP focuses on reasons to change, SoC focuses on domain boundaries
- [[horizontal-layer-coupling]] — organizing by technical layer rather than by domain mixes concerns at the directory level
- [[view-logic-component-entanglement]] — Vue components mixing domain logic, interaction, and presentation
- [[game-logic-boundary-absence]] — game rules scattered across utils, services, and composables instead of isolated by concern
- [[service-responsibility-conflation]] — services mixing business logic, data access, and orchestration
- [[facade-pattern]] — enforces concern separation by hiding subsystem details behind a boundary
- [[bridge-pattern]] — separates abstraction from implementation so two concerns evolve independently
- [[divergent-change-smell]] — a symptom of mixed concerns: one class changes for multiple unrelated reasons
- [[shotgun-surgery-smell]] — a symptom of scattered concerns: one conceptual change requires edits across many files
