# Writing Context Injections & CLAUDE.md Rules

- Keep instructions **short and non-obvious**. Don't document what Claude can infer from existing files, templates, or conventions already in the repo.
- A good rule states a constraint or correction that would otherwise be missed. A bad rule restates what the templates/code already show.
- Prefer 3-5 bullet points over long procedural workflows. If a workflow needs more, link to a separate file.
- Never duplicate information already in CLAUDE.md, MEMORY.md, or templates — reference it instead.
- Context injections are loaded on-demand via `# Rules` references in CLAUDE.md. Only create one when a task category needs guardrails that aren't covered elsewhere.
