# Technical Debt

Accumulated design and implementation shortcuts that make future changes harder. It grows when code is written for speed over clarity, when duplication is tolerated, or when structure degrades over time. The metaphor was originally suggested by Ward Cunningham.

Like a bank loan, technical debt lets you move faster initially — but you pay interest. You can temporarily speed up without writing tests for new features, but this gradually slows progress every day until you pay off the debt. If enough interest accumulates, it can exceed your total capacity, making full repayment impossible.

[[refactoring]] is the primary tool for fighting technical debt — it transforms messy code into [[clean-code]].

## Causes

- [[technical-debt-cause-ignorance]]
- [[technical-debt-cause-tight-coupling]]
- [[technical-debt-cause-missing-tests]]
- [[technical-debt-cause-missing-documentation]]
- [[technical-debt-cause-poor-knowledge-sharing]]
- [[technical-debt-cause-branch-divergence]]
- [[technical-debt-cause-delayed-refactoring]]
- [[technical-debt-cause-no-coding-standards]]
- [[technical-debt-cause-incompetence]]

## See also

- [[code-smells]] — common structural symptoms of accumulated technical debt
- [[test-coverage-gaps]] — untested areas are a form of technical debt
