# Refactoring

Restructuring existing code without changing its external behavior. The main purpose of refactoring is to fight [[technical-debt]] by transforming messy code into [[clean-code]] and simple design.

## When to refactor

- [[rule-of-three]] — start refactoring the third time you do something similar
- [[refactoring-when-adding-features]] — refactor dirty code first to understand it and ease new changes
- [[refactoring-when-fixing-bugs]] — clean code reveals bugs; proactive refactoring prevents special refactoring tasks
- [[refactoring-during-code-review]] — the last chance to tidy up before code goes public

## How to refactor

- [[refactoring-in-small-changes]] — each change makes code slightly better while keeping the program working
- [[refactoring-checklist]] — three rules for verifying refactoring was done correctly

## Techniques

- [[refactoring-techniques]] — a catalog of proven code transformations

## See also

- [[code-smells]] — the structural problems that signal refactoring is needed
- [[solid-principles]] — design rules that refactoring often moves code toward
- [[design-patterns]] — patterns often emerge during refactoring as code matures toward better structure
- [[single-responsibility-principle]] — a common refactoring target when classes or functions do too much
- [[technical-debt-cause-delayed-refactoring]] — the longer refactoring is delayed, the more dependent code must be reworked
