# 2026-03-26 — Handoff for Adversarial Review

Since the last adversarial review (findings 1–9), the plan has changed substantially. This section summarizes everything that was added or decided, for a fresh adversarial pass.

## What changed

**Structural decisions:**
1. All 9 adversarial findings accepted. Plan restructured from 6 parallel tracks to 4 concentric rings.
2. **Effect engine is the new root** (R0.1), replacing the entity model (A1) as the foundation. Rationale: traits and moves are both "hundreds of individually novel effect programs" that share infrastructure.
3. **Composable effect system, not DSL.** ~15 atomic effect types composed with conditions and triggers. Data modeling problem, not language design problem.
4. **Fresh data start.** Current PTU-shaped data discarded, schema migration history preserved. No migration effort.
5. **Pure-function testing strategy.** Effect engine functions are pure (input state → output state). Each move/trait is a test case.

**Principles added:**
6. (Principle 6) Every design must cross-reference and link to specific SE patterns/principles from `vaults/documentation/software-engineering/`.
7. (Principle 7) Decided designs become documentation vault notes. The thread records decisions; the vault holds authoritative designs.

**Views elevated to first-class:**
8. **Player view has three modes:** in-session combat (remote control), in-session non-combat (character sheet), out-of-session (character management without GM).
9. **Group view is a live projection** driven by player/GM actions, not autonomous.
10. **GM view has three modes:** session prep (content creation, no players), session orchestration (in-session, non-combat), encounter command (multi-entity combat control + request queue + rule arbitration).
11. **Three views threaded through every ring.** Ring 1 now includes minimal versions of all three views (R1.7, R1.7b, R1.7c, R1.7d). Ring 2 adds GM multi-entity UI (R2.14), GM request queue (R2.15), group view live projection (R2.13). Ring 3 adds out-of-session management (R3.18) and GM session prep (R3.19).

**Functionality catalog added:**
12. Complete catalog of previous app functionality across 12 domains (session infrastructure, GM nav/content, encounter lifecycle, combat flow, combatant interaction, capture, battle grid, scenes, habitats, player view, group view, XP/progression). Records what users could do, not how it was implemented.

## What to challenge

This review should be broader than the first. The first review challenged the dependency graph. This one should challenge the *entire plan as it now stands* — rings, principles, view model, functionality coverage, and the decisions themselves.

Specific areas to probe:

- **Ring structure.** Are the ring boundaries correct? Do the exit criteria actually prove the ring works? Are items in the wrong ring? Is there a missing ring?
- **Effect engine as root.** Is the composable effect system (R0.1) actually more foundational than the entity model (R0.2)? Could you design entities without knowing what effects look like? What if the effect engine design is wrong — does it cascade and invalidate everything above it? Is this putting too much weight on a single unproven system?
- **~15 atomic effects claim.** The pushback on the DSL framing claims a finite set of ~15 atomic effect types. Is this actually true? Sample more traits and moves — are there effects that don't decompose into the listed atoms? Are there composition patterns (e.g. "trigger on event X, then conditionally do Y if state Z, modifying how the next instance of W resolves") that the simple "sequence + conditional" model can't express?
- **Three-view threading.** Does adding minimal versions of all three views to Ring 1 bloat the critical path? Ring 1 went from 9 items to 13. Is that still "shortest path to playable encounter" or is it now "shortest path to full session infrastructure"?
- **Functionality catalog completeness.** Is anything missing from the previous app that should be preserved? Is anything listed that shouldn't survive (PTU-specific workflows that don't apply to PTR)?
- ~~**Scope creep.**~~ Not a concern. We're sharpening the saw.
- **Habitat/scene/encounter table placement.** These are in Ring 4 but the functionality catalog shows they're core session-running features. Should any of them move earlier?
- **The "design before code" vs "composable effect engine" tension.** The effect engine is the most novel and uncertain system. The plan says "design before code" (Principle 4). But can the effect engine be designed without implementation spikes? The first review flagged this (Finding 7) and the answer was "pure functions are testable." But testable ≠ designable-without-prototyping.
- **Data model implications.** Fresh data start is decided, but the plan doesn't describe the new data model at all. How do effects get stored? Are move/trait definitions in the database, in code, or in vault files that get compiled? This affects Ring 0 fundamentally.
- **What's the actual first deliverable?** Ring 0 has no exit criterion. Rings 1–4 do. When is Ring 0 "done"?

~~**Status:** Awaiting adversarial review of the full plan as it now stands.~~

