# Rotom Table 1.0 Design Thread

Destructive redesign of the Rotom Table app from PTU to PTR. 41 posts and growing.

## Start here

1. Read `CURRENT-TASK.md` — tells you the active task, current phase, and what to do next.
2. Read all pinned posts (marked with `<!-- pinned -->` on line 1):
   - `11-developer-consolidated-ring-plan-post-review-reference.md` — authoritative ring plan
   - `53-developer-five-phase-workflow-adopted.md` — workflow rules and rationale
3. Read posts referenced in CURRENT-TASK.md's "Key Posts" section for immediate context.
4. Read `00-header.md` if you need gap analysis or design principles.
5. Read further back in the thread only if the above isn't sufficient.

## Rules

- **Full 5-phase workflow.** Every task follows the 5-phase development workflow defined in `claude_forum/CLAUDE.md` (Context Gather → Plan → Pre-docs → Code → Vault Update). No phase is skipped unless Ashraf explicitly routes past it.
- **Cite SE principles.** Adversarial review findings must cite the specific SE patterns, principles, or smells from `vaults/documentation/software-engineering/` that justify the finding. Name the concept, explain why it applies to the code under review, and link the consequence to the principle. "This is wrong" is not a finding — "this is Primitive Obsession because `string` stands in for `WeatherType`, a domain concept that already has a union type" is.
- **Plan reviews check the same things as code reviews.** The adversarial reviewer checks plans for: missed utilities/conventions, incorrect SE citations, design gaps, unhandled edge cases. Catching issues in the plan phase prevents implementation churn.

## Pinned posts

Posts with `<!-- pinned -->` as their first line contain decisions, rules, or reference material that every session needs. Always read them before doing any work in this thread, even if you're only picking up from a recent post.

## Rotom Table 1.0 Design Principles

These are the governing principles from the active redesign thread (`rotom-table-1.0-design/`). They apply to all design and implementation work.

1. **PTR vault is the source of truth** for what the game system IS.
2. **Documentation vault is the design authority** for how the system becomes software.
3. **SE vault provides the constraints** — patterns and principles are requirements, not suggestions.
4. **Design before code.** Every feature gets a documentation note before it gets an implementation.
5. **Destructive by default.** Existing code that doesn't match the new design is deleted. No compatibility shims. Fresh data start (PTU data discarded, schema migration history preserved).
6. **Cross-reference SE principles.** Every design must cite specific SE patterns/principles from `vaults/documentation/software-engineering/` and explain why they apply.
7. **Designs live in the documentation vault.** Decided designs become vault notes. The thread records decisions; the vault holds authoritative designs.
8. **SE notes contain pure knowledge.** Pattern definitions, principle explanations, smell descriptions, technique instructions. Application-specific links belong in design notes that reference the SE concepts, not the other way around.
9. **Conventions are documented before they're needed.** When a utility, type contract, or coding convention is established, it gets a documentation vault note immediately — not after a reviewer catches a violation. If a developer discovers during context gathering that a convention has no note, writing that note is part of pre-implementation documentation (phase 3).

