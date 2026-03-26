# Observer Pattern

A [[behavioral-patterns|behavioral]] [[design-patterns|design pattern]] that defines a subscription mechanism so multiple objects are notified when another object's state changes. Also known as "Event-Subscriber" or "Listener."

## Problem

One object's state changes require updates in multiple dependent objects, but the set of dependents is unknown at compile time or changes dynamically. Polling wastes resources; broadcasting to everyone wastes attention.

## Solution

The **publisher** maintains a subscription list and provides subscribe/unsubscribe methods. **Subscribers** implement a common interface (typically an `update` method). When state changes, the publisher iterates over subscribers and calls their update methods. The publisher communicates only through the subscriber interface, preventing coupling to concrete classes.

## When to use

- Changes in one object must propagate to others whose set is dynamic or unknown
- Observation relationships should be temporary or conditional, established and removed at runtime
- GUI frameworks where custom code responds to user actions

## Pros and cons

New subscribers integrate without modifying the publisher ([[open-closed-principle]]). Relationships form dynamically at runtime. The tradeoff is that notification order among subscribers is unpredictable.

## TypeScript implementation

Defines separate interfaces for Subject (`attach`, `detach`, `notify`) and Observer (`update`). The subject maintains an observer array, guards against duplicate subscriptions with `includes()`, and iterates over observers to notify. Observers receive the subject reference in `update` and use `instanceof` checks to safely access concrete subject state before reacting. See [[typescript-pattern-techniques]].

## See also

- [[mediator-pattern]] — Observer establishes one-way dynamic subscriptions; Mediator eliminates mutual dependencies through a central object. Mediators can be implemented using Observer
- [[command-pattern]] — Command uses fixed sender-receiver links; Observer uses dynamic subscriptions
- [[chain-of-responsibility-pattern]] — CoR is sequential; Observer fans out simultaneously
