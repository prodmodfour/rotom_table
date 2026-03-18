# Code Smells

Common structural problems in code that indicate deeper design issues. Code smells are not bugs — the code works — but they signal that [[refactoring]] is needed to prevent [[technical-debt]] from growing.

Code smells usually accumulate gradually as programs evolve without deliberate maintenance. Recognizing them is the first step toward producing [[clean-code]].

## Categories

- [[bloater-smells]] — code that has grown too large to work with easily
- [[object-orientation-abuser-smells]] — incomplete or incorrect application of object-oriented principles
- [[change-preventer-smells]] — structural problems that make changes cascade or fragment
- [[dispensable-smells]] — unnecessary code that adds weight without value
- [[coupler-smells]] — excessive coupling between classes

## See also

- [[refactoring-techniques]] — the catalog of transformations used to fix code smells
- [[refactoring]] — the primary tool for eliminating code smells
- [[design-patterns]] — recognizing smells helps identify which pattern could resolve the underlying problem
- [[rule-of-three]] — a heuristic for when repeated smells justify refactoring
