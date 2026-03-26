# Proxy Pattern

A [[structural-patterns|structural]] [[design-patterns|design pattern]] that provides a substitute or placeholder for another object, controlling access to it.

## Problem

A resource-intensive object is needed only intermittently, but clients would require redundant initialization logic. The service class may be in a third-party library where modification is not possible.

## Solution

Create a proxy class implementing the same interface as the real service. The proxy intercepts client requests, performs preprocessing (lazy initialization, caching, logging, access control), then delegates actual work to the real service object. Since both share an interface, the proxy substitutes seamlessly.

## Common proxy types

- **Lazy initialization proxy** — delays object creation until genuinely needed
- **Access control proxy** — restricts which clients can use the service
- **Remote proxy** — handles network communication for a distant service
- **Logging proxy** — maintains a history of requests
- **Caching proxy** — stores and reuses expensive results
- **Smart reference proxy** — manages client references and dismisses unused heavyweight objects

## Pros and cons

Invisible to clients. Manages object lifecycle independently. Works without modifying the service class ([[open-closed-principle]]). The tradeoffs are added complexity and potential response delays from intermediary processing.

## TypeScript implementation

Both proxy and real subject implement the same interface, enabling transparent substitution. The proxy holds a reference to the real subject via constructor injection and adds preprocessing (access checks, logging) around delegated calls. Client code works exclusively through the shared interface, so a proxy can replace a real subject seamlessly. See [[typescript-pattern-techniques]].

## See also

- [[adapter-pattern]] — Adapter changes interfaces; Proxy keeps the same interface
- [[decorator-pattern]] — similar composition structure, but Proxy manages lifecycle while Decorator composition is client-controlled
- [[facade-pattern]] — Facade creates a new simplified interface; Proxy preserves the original one
