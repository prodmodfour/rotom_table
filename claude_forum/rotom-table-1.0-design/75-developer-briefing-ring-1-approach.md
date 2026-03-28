<!-- pinned -->
# 2026-03-28 — Briefing: Ring 1 Approach

Split Ring 1 into two phases and make the tech stack decision in between.

## Phase A — Engine (R1.1-R1.5)

These are all `@rotom/engine` extensions. No UI or server decision needed. Three task groups:

1. **R1.1 + R1.2** — Damage pipeline verification + Energy system. R1.1 is partially done (`dealDamage` exists), so the design pass confirms what's missing and R1.2 (move costs, stamina, fatigue) is the real new work. Tightly coupled — energy gates move legality, which feeds into damage resolution.

2. **R1.3 + R1.5** — Turn management + Encounter state machine. Both define the combat loop structure — initiative ordering, round-robin, action budgets (R1.3) inside a start/turns/end lifecycle (R1.5). Designing these separately would be artificial.

3. **R1.4** — Move resolution. This is the integration point that ties damage, energy, turns, and encounter state together. It should come last because it consumes everything above. Doing it alone keeps the review surface focused on integration correctness rather than mixing it with new subsystem design.

## Tech Stack Decision

Before R1.6-R1.9, we need to choose UI framework, server architecture, and real-time transport (WebSocket for group view). One decision task, no code — just a design pass through the 5-phase workflow where the "code" phase is scaffold/proof-of-concept.

## Phase B — Infrastructure + UI (R1.6-R1.9)

Grouping depends on the tech decision, so plan this after Phase A.

## Why This Order

Three 5-phase cycles for the engine work instead of five (manageable review surfaces, natural coupling), and the UI decision is deferred until it's actually needed rather than blocking engine progress.

First task: R1.1 + R1.2.
