# Object Pool Pattern

A [[creational-patterns|creational]] [[design-patterns|design pattern]] that manages a set of reusable objects to avoid the cost of repeated creation and destruction.

## Problem

When initializing a class instance is expensive, instantiation rate is high, and few instances are active at once, constantly creating and discarding objects wastes resources. Client code has no way to reuse instances it no longer needs.

## Solution

Maintain a pool of pre-created or previously used objects. Clients call `acquire` to get an available instance and `release` to return it when done. The pool creates new instances only when none are available (up to an optional maximum). Typically implemented as a [[singleton-pattern|Singleton]] to ensure centralized management.

## When to use

- Object creation is expensive (database connections, thread contexts, large buffers)
- Objects are needed frequently but only briefly
- The number of simultaneously active instances is small relative to total usage

## Pros and cons

Reduces allocation overhead and garbage-collection pressure. Provides predictable resource limits via `setMaxPoolSize`. The tradeoff is added complexity in lifecycle management — objects must be reset to a clean state before reuse, and the pool itself must be thread-safe in concurrent environments.

## See also

- [[factory-method-pattern]] — encapsulates creation but does not manage objects after creation; Object Pool extends this with post-creation tracking
- [[singleton-pattern]] — Object Pool is usually implemented as one
- [[prototype-pattern]] — pool entries can be initialized via cloning
