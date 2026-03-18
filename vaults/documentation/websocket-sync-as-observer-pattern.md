# WebSocket Sync as Observer Pattern

The [[websocket-real-time-sync]] system implements the [[observer-pattern]]: the GM view acts as the authoritative publisher, Group View and Player View are subscribers that receive state broadcasts, and the server relays events without understanding their content.

This follows the [[open-closed-principle]]: adding a new view (a fourth audience) requires no modification to the publisher or relay — only a new subscriber. The decoupling is clean: the GM view publishes encounter state changes, and any number of consumers can listen.

The [[triple-view-system]] — GM, Group, Player — is the architectural expression of this pattern. Each view's WebSocket composable (`useWebSocket`, `useGroupViewWebSocket`, `usePlayerWebSocket`) is an independent subscriber.

## See also

- [[triple-view-system]] — the three audiences that the observer pattern serves
- [[websocket-event-union]] — the event types that flow through the observer channel
- [[websocket-union-extensibility]] — how the event type design supports the open-closed principle
- [[websocket-store-sync]] — how stores consume observed events
