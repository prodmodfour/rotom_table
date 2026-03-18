No Pinia store in the codebase directly imports or calls another store. Inter-store communication is handled entirely through external wiring — composables, page-level code, or WebSocket handlers read from one store and write to another.

This avoids circular dependency issues that can arise when stores reference each other, and keeps each store's dependencies explicit at the point of use rather than hidden in the store definition.

Stores that need data from other domains (e.g., the encounter tables page needing encounter data for generation) achieve this by having the page component orchestrate between the two stores rather than having one store reach into the other.

## See also

- [[encounter-store-delegates-via-build-context]] — decomposition within a single store's domain
- [[stores-instantiate-lazily-per-page]] — the lazy instantiation that results from this decoupled design
- [[some-getters-self-reference-via-use-store-call]] — self-references within the same store, not cross-store imports