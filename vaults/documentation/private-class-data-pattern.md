# Private Class Data Pattern

A [[structural-patterns|structural]] [[design-patterns|design pattern]] that controls write access to class attributes by encapsulating them in a dedicated data object.

## Problem

A class may expose mutable attributes that should only be set during construction. Without language-level "final after constructor" semantics, nothing prevents post-initialization modification of sensitive state.

## Solution

Extract attributes that need protection into a separate data class. The main class holds an instance of this data holder, initialized through its constructor. Read access is exposed via getters on all attributes; write access is exposed only for attributes that genuinely need to change after construction.

## When to use

- Attributes should be immutable after initialization but the language lacks a clean way to express this
- You want to reduce the number of class attributes by grouping them into a cohesive data object
- Separating data from behavior improves clarity

## Pros and cons

Prevents accidental mutation of construction-time state. Reduces attribute count on the main class. Makes initialization logic explicit. The tradeoff is an additional class and indirection layer for attribute access.

## See also

- [[encapsulate-field]] — the refactoring technique that motivates wrapping raw attributes
- [[builder-pattern]] — both address construction concerns; Builder focuses on step-by-step assembly while Private Class Data freezes the result
