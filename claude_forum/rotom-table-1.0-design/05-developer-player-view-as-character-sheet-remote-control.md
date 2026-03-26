# 2026-03-26 — Player View as Character Sheet + Remote Control

The ring plan treats the player view primarily as a combat interface. It's more than that. The player view has three modes:

## 1. In-session combat
The player's phone is their combat control surface. They select moves, targets, items, maneuvers. Their actions propagate to the group view (TV) in real-time — the group view is a projection of what players and GM are doing, not an independent display. This is partially captured by R1.7 and R2.8.

## 2. In-session non-combat
Between encounters, the player's phone is their character sheet — stats, traits, moves, inventory, team, skills. They can also request group view tab changes (scene, lobby). The group view reflects GM and player activity. This mode is not captured in the ring plan.

## 3. Out-of-session
Players must be able to manage their characters without an active session. Level up, assign trait points, swap moves, manage inventory, review their team. No GM connection required. No encounter active. The app serves them as a standalone character management tool. This mode is entirely missing from the ring plan.

## What this means for the architecture

- **The player view is always-on.** It's not gated by encounter state or GM presence. The view capability framework (R1.6) must account for a "solo/offline" capability context alongside GM/player/spectator.
- **The group view is driven, not autonomous.** `the-table-as-shared-space.md` captures the philosophy ("the digital battle mat everyone leans over") and `player-group-view-control.md` describes tab requests. But the deeper pattern is that the group view is a **live projection of the game state as modified by player and GM actions**. Every player action on their phone should be visible on the TV — move declarations appearing, damage numbers, status changes, grid movement. The group view doesn't have its own interaction logic; it renders what the active participants are doing.
- **The GM view controls everything and sees everything.** This is already captured but worth restating as a triad: GM controls, players act, group view reflects.

## Changes to the ring plan

**Ring 1** additions:
- R1.6 (View Capability Framework) must include an "out-of-session" capability context from the start — not just GM/player/spectator
- R1.7 (Minimal Combat UI) should be paired with R1.7b: **Minimal Character Sheet** — the player can see their Pokemon's stats, moves, HP, energy outside of combat. This is the other half of the player view

**Ring 2** additions:
- R2.8 (Combat Action Presentation) already captures the in-combat phone UI
- Add R2.13: **Group View as Live Projection** — the group view renders combat state driven by player/GM actions in real-time. Move declarations appear on TV as players submit them. Damage results display. Turn advancement is visible. This is the WebSocket architecture for "player acts on phone → server → group view updates on TV"

**Ring 3** changes:
- R3.16 (Full View System) already covers layouts, but out-of-session character management belongs here too
- Add R3.18: **Out-of-Session Character Management** — players can level up, assign traits, swap moves, manage inventory, review team without GM connection. This feeds into R3.6 (Pokemon Creation), R3.7 (Trainer Creation), R3.8 (Level Up/Evolution)

~~**Status:** Player view triad (combat control + character sheet + out-of-session management) and group view as live projection added to ring plan. Next step: begin Ring 0 design — starting with R0.1 (Effect Engine).~~

