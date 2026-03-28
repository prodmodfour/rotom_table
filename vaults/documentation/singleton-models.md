# Singleton Models

Two data models use a single-instance pattern:

- **GroupViewState** — Tracks the active tab and scene for the [[triple-view-system|Group View]]. Updated during [[scene-activation-lifecycle|scene activation/deactivation]]. Manages which of the four tabs (lobby, scene, encounter, map) is displayed on the shared screen.
- **AppSettings** — Stores damage mode and VTT default configuration.

Both are read/written as single rows. There is only ever one record of each.

## See also

- [[singleton-pattern]] — the design pattern these models apply at the database level
