# Pull Up Constructor Body

A [[dealing-with-generalization-techniques|dealing with generalization]] [[refactoring-techniques|technique]]. When subclass constructors contain mostly identical code, create a parent class constructor with the shared logic and call it from each subclass via `super()`.
