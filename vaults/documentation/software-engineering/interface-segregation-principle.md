# Interface Segregation Principle

"Clients should not be forced to depend upon interfaces that they do not use."

Many small, specific interfaces are better than one massive general-purpose interface. A class should not have to implement methods it will never use just because they are grouped together.

Analogy: a streaming subscription that forces you to pay for a sports package when you only watch documentaries. Segregated packages would be better.

In code: instead of one large `MultiFunctionDevice` interface with `print()`, `scan()`, and `fax()` methods, split into `Printer`, `Scanner`, and `Fax` interfaces. A simple printer class only implements `print()`.

Part of [[solid-principles]].

## See also

- [[extract-interface]] — the refactoring technique that directly applies ISP
- [[trait-composed-domain-model]] — applies ISP via narrow composed trait interfaces
- [[solid-violation-causal-hierarchy]] — ISP violations are often symptoms of upstream SRP violations
