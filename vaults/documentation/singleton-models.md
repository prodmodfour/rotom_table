# Singleton Models

Two Prisma models use hardcoded string IDs instead of UUIDs:

- **GroupViewState** (id: `"singleton"`) — Tracks the active tab (`activeTab`) and scene (`activeSceneId`) for the [[triple-view-system|Group View]]. Updated during [[scene-activation-lifecycle|scene activation/deactivation]]. Manages which of the four tabs (lobby, scene, encounter, map) is displayed on the shared screen.
- **AppSettings** (id: `"default"`) — Stores damage mode and VTT default configuration.

Both are read/written as single rows. There is only ever one record of each in the database.

## See also

- [[singleton-pattern]] — the design pattern these models apply at the database level
