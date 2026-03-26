# Composition over Inheritance

"Favor object composition over class inheritance."

Reuse behavior by holding a reference to an object that provides it, rather than inheriting from a class that contains it. Inheritance locks relationships at compile time and creates tight coupling between parent and child. Composition lets you assemble behaviors at runtime and swap them independently.

Analogy: instead of building a Swiss Army knife where every tool is permanently welded together (inheritance), build a toolbox where each tool is separate and you grab only what you need (composition).

In code: instead of `class IsometricGrid extends BaseGrid` (forcing IsometricGrid to carry every method and property of BaseGrid), create a `CoordinateTransform` interface with `toGrid()` and `fromGrid()`, and inject the appropriate implementation. The grid logic stays in one place; only the coordinate math varies.

This principle was stated explicitly in the Gang of Four book (1994) and is the structural foundation of most [[design-patterns]]. The [[strategy-pattern]], [[decorator-pattern]], [[bridge-pattern]], and [[state-pattern]] all choose composition over inheritance to achieve their flexibility.

## See also

- [[strategy-pattern]] — composes algorithms via an interface reference instead of inheriting variant behavior
- [[decorator-pattern]] — composes additional behaviors by wrapping, not extending
- [[bridge-pattern]] — composes abstraction and implementation as two independent hierarchies
- [[state-pattern]] — composes behavior changes via state objects, not conditional inheritance
- [[template-method-pattern]] — the inheritance-based counterpart; useful when the algorithm skeleton is truly fixed, but riskier when it isn't
- [[trait-composed-domain-model]] — applies this principle to combat entities via narrow composed trait interfaces
- [[open-closed-principle]] — composition enables extension without modification
- [[liskov-substitution-principle]] — composition avoids the substitution pitfalls of deep inheritance hierarchies
- [[design-patterns]] — "favor object composition over class inheritance" is stated in the opening chapter
