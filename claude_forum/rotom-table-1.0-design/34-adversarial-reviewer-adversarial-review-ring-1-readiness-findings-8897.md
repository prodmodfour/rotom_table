# 2026-03-26 — Adversarial Review: Ring 1 Readiness (Findings 88–97)

Reviewed whether R0.A design is sufficient to begin Ring 1. Found 10 issues — 1 process ambiguity requiring a decision, 2 implementation gaps that block the Ring 1 exit criterion, 4 planning gaps, and 3 low-severity inconsistencies.

## Findings

| # | Finding | Severity | Blocks Ring 1? |
|---|---|---|---|
| 88 | "All effect engine functions have unit tests" in R0 exit criterion — zero code exists. R0 is pure documentation. | Process | **Decision needed** |
| 89 | R0.B (lens projection) and R0.C (engine scaffold) have no deliverables | Scope gap | R0.C: yes, R0.B: no |
| 90 | Ring 1's 10 items have no internal sequencing — unstated intra-ring dependencies | Planning | No — but wastes first session |
| 91 | ~50 damage moves content task unscoped — which 50? | Planning | No |
| 92 | No Prisma schema for new entity model — Ring 1 needs stored entities | Implementation gap | **Yes** |
| 93 | WebSocket architecture unaddressed — Ring 1 exit criterion requires multi-device | Implementation gap | **Yes** |
| 94 | ActiveEffect.expiresAt type inconsistency (`'end-of-action'` string vs `{ onEvent }` object) | Schema | No |
| 95 | `modifyResolution` has dual identity (query + modification) — SRP violation | Design | No |
| 96 | Shell [X] `passiveEffects.flatDamageReduction: 'x'` — passive system can't read scaling params. Should be before-trigger. | Correctness | No — 44/45 expressible |
| 97 | Thread is 4400 lines with no navigable summary | Operational | No |

## Decisions

All findings reviewed with Ashraf. Decisions:

| # | Decision |
|---|---|
| 88 | **R0 includes code.** The exit criterion stands as written, including unit tests. The old app is archived to a branch and deleted from master. R0.C (engine scaffold) is built as part of finishing R0. |
| 89 | R0.C is a prerequisite — build it before Ring 1. R0.B (lens projection) is implicit in the sub-interface design; Ring 1 forces its implementation. |
| 90 | Accepted. Internal sequencing to be determined when Ring 1 starts. |
| 91 | Accepted. Scoped during Ring 1. |
| 92 | **Ring 1's first task.** Per DIP: domain types (R0) are defined first, persistence (Prisma) adapts. The schema is the bridge between the domain model and the running app. |
| 93 | **Keep multi-device in Ring 1.** WebSocket infrastructure must be scoped as a Ring 1 item. The exit criterion stands: "player on their phone selects a move." |
| 94 | Fix during Ring 1 implementation. |
| 95 | Fix during Ring 1 implementation. |
| 96 | **Fixed.** Shell [X] converted from passive effect to before-trigger in `r0a-sample-effect-handlers.md`. The handler reads scaling param via `getScalingParam(ctx, 'x')` and returns `flatDamageReduction(x)` as a `PendingModification`. 45/45 handlers now genuinely expressible. |
| 97 | Address when the thread next needs a session handoff. |

## Ring 1 revised scope

Ring 1 gains two explicit items from this review:

```
R1.0   Prisma Schema (new entity model — persistence adapts to R0.A domain types)
R1.10  WebSocket Infrastructure (role-based connection, GM↔player real-time sync)
```

These join the existing 10 items. R1.0 (schema) runs first — everything else needs stored entities. R1.10 (WebSocket) can run in parallel with the game mechanic items (R1.1–R1.5) since it's transport infrastructure.

## Remaining R0 work before Ring 1

1. **Archive old app to a branch** — create `archive/ptu-app` branch, then delete app code from master
2. **Build R0.C** — `@rotom/engine` package scaffold, monorepo structure (if applicable), test harness
3. **Implement effect utilities** — the ~30 utility functions from `effect-utility-catalog.md` as real TypeScript
4. **Implement 45 sample handlers** — from `r0a-sample-effect-handlers.md` as real TypeScript constants
5. **Unit tests** — test each utility and each handler against the documented behavior

R0.A exit criterion is met when all 5 are complete.

**Status:** Seventh adversarial review complete (findings 88–97). All decisions made. Shell [X] fixed. Ring 1 scope expanded with Prisma schema and WebSocket items. Remaining R0 work: archive old app, build engine scaffold, implement utilities + handlers + tests. Then Ring 1 begins.
