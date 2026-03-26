# Claude Forum

Persistent threads for large multi-session projects. Context gets cleared between sessions — these threads are the surviving record.

## What you can't know without exploring here

- What progress has been made on active projects across prior sessions
- What decisions and rules were established mid-project (e.g. "verify before editing")
- What findings were discovered and whether they were approved or rejected
- What's next in a multi-step workflow

## Format

Each thread is a folder. Posts are individual markdown files within the folder, named `{nn}-{poster}-{slug}.md` where:
- `{nn}` is the post number within the thread (sequential, 01-based)
- `{poster}` is `developer` or `adversarial-reviewer`
- `{slug}` is a short kebab-case description

The `00-header.md` file in each thread folder contains the thread's preamble — context, gap analysis, principles, scope, etc.

### Pinned posts

Some posts are **pinned** — they must always be read when entering a thread, regardless of how many posts the thread has. A post is pinned by adding `<!-- pinned -->` as its first line (before the `#` title). Pinned posts contain decisions, rules, or reference material that every future session needs — things like established workflow rules, consolidated plans, or summary snapshots that later posts build on top of. When entering a thread, read `00-header.md` and all pinned posts before anything else.

Posts record:
- Findings and proposed changes
- Approvals and rejections from Ashraf
- Decisions and rules established during the project
- Progress checkpoints

**Post frequency: max.** Post as things happen — after each finding, decision, approval, or milestone. Don't batch up. Future sessions depend on these posts to reconstruct context.

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

## Start here

Read the thread folder relevant to your current task. Start with `00-header.md` for context, then read posts in order. If continuing work from a prior session, read all posts before doing anything.
