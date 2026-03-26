# Interpreter Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that defines a grammar representation and an interpreter that uses that representation to process sentences in the language.

## Problem

A recurring problem domain can be characterized as a "language" — a set of valid expressions with defined semantics. Solving each instance of the problem requires parsing and evaluating these expressions, but hard-coding every variation leads to rigid, unextensible logic.

## Solution

Model the grammar as a class hierarchy. Each grammar rule maps to a class. Terminal rules become leaf classes; composite rules reference other rule classes. An abstract base class declares an `interpret(context)` method; concrete subclasses implement it by reading the current state of the input stream and contributing to the result. The hierarchy mirrors the grammar's recursive structure.

## When to use

- The domain has a well-defined grammar that can be expressed recursively
- Efficiency is not a primary concern (the pattern favors simplicity over speed)
- The grammar is simple enough that a dedicated parser would be overkill

## Pros and cons

Makes grammar explicit and easy to extend with new rules by adding classes. Each rule is isolated and testable. The tradeoff is poor scalability — complex grammars with many rules produce large class hierarchies, and the pattern does not address parsing itself.

## See also

- [[composite-pattern]] — Interpreter relies on Composite's recursive traversal to process sentences
- [[visitor-pattern]] — can be applied to the abstract syntax tree to add operations without modifying node classes
- [[iterator-pattern]] — applicable when traversing syntax tree nodes
- [[flyweight-pattern]] — terminal symbols can be shared across the tree
- [[state-pattern]] — can define parsing contexts within the interpreter
- [[strategy-pattern]] — Interpreter defines a fixed grammar; Strategy allows swapping algorithms without grammar structure
