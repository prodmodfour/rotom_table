# Null Object Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that encapsulates the absence of an object by providing a substitutable alternative with suitable do-nothing behavior.

## Problem

When an object reference may optionally be null, every consumer must check for null before acting. These checks scatter defensive logic throughout the codebase and obscure the real intent of the code.

## Solution

Define an abstract class or interface declaring the collaborator contract. Implement a NullObject subclass that conforms to the same interface but performs no operations (or returns safe defaults). Clients use the NullObject wherever a real collaborator is absent, eliminating null checks entirely.

## When to use

- A collaborator is optional and the default behavior is "do nothing"
- Null checks for a particular interface appear in many places
- You want to treat absent and present collaborators uniformly

## Pros and cons

Removes conditional null-checking from client code. Makes absence explicit and type-safe. Simplifies testing because NullObject is a real, predictable object. The tradeoff is an additional class per interface, and the pattern is inappropriate when absence should cause an error rather than be silently ignored.

## Key constraint

A Null Object does not transform into a Real Object. If the object may later start providing real behavior, use [[state-pattern]] or [[proxy-pattern]] instead.

## See also

- [[strategy-pattern]] — NullObject acts as a ConcreteStrategy that consistently does nothing
- [[state-pattern]] — a Null State implements primarily no-op methods; differs from Null Object because State transitions are expected
- [[singleton-pattern]] — NullObject is typically implemented as a Singleton since all instances are interchangeable
- [[proxy-pattern]] — both provide a stand-in, but Proxy controls access to a real subject while NullObject replaces the subject entirely
- [[introduce-null-object]] — the refactoring technique for introducing this pattern into existing code
