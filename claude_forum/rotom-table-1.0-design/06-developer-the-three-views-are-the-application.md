# 2026-03-26 — The Three Views Are the Application

The ring plan treated views as a feature to be slotted in (R1.6, R3.16). This is wrong. The three views ARE how sessions are run. Without all three working together, the app doesn't function. They need to be a first-class concern threaded through every ring, not a line item in one.

## The triad

| View | Device | Role | Core pattern |
|---|---|---|---|
| **GM View** | Desktop/laptop | Controls everything, sees everything | **Orchestration dashboard** — manages the encounter, all NPCs, all wild Pokemon, approves player requests, prepares content |
| **Player View** | Phone/tablet | Controls own characters, sees restricted info | **Character sheet + remote control** — acts within the encounter, drives group view updates |
| **Group View** | TV/projector | No interaction, shows shared state | **Live projection** — renders the game state as modified by GM and player actions |

These three run simultaneously during a session. The GM acts on their laptop, players act on their phones, and the TV shows the shared result. Every system in the ring plan must answer: "how does this appear on each view?"

## GM View — three modes

**1. Session prep (out-of-session)**
The GM's primary pre-session workflow. No players connected.
- Create and edit Pokemon, trainers, NPCs
- Build encounter templates (combatant rosters, difficulty budgets)
- Design scenes (maps, weather, positioned groups)
- Manage encounter tables and habitats
- Review player characters (stats, traits, progression)
- Campaign-level management (party roster, story state)

**2. Session orchestration (in-session, non-combat)**
Players are connected. No active encounter.
- Activate scenes, set weather, narrate
- Manage the group view (what's shown on TV)
- Handle player requests
- Trigger encounters from scenes or encounter tables
- Award XP, manage rest/healing

**3. Encounter command (in-session, combat)**
The heaviest mode. The GM is simultaneously:
- **Multi-entity controller** — resolving turns for every NPC and wild Pokemon (could be 6-10+ entities). Each entity has its own moves, traits, energy, action budget. The UI must let the GM quickly select an entity, choose an action, and resolve it without hunting through menus. This is the biggest UX difference from the player view — players control 1-2 entities, the GM controls many.
- **Encounter manager** — advancing turns, tracking initiative, spawning/despawning combatants mid-encounter, ending the encounter
- **Rule arbiter** — applying damage manually, toggling status conditions, overriding rules when the situation demands it (e.g. applying environmental damage, ruling an improvised action)
- **Request handler** — reviewing and approving/rejecting player action requests as they come in. This is an inbox/queue pattern — requests arrive asynchronously as players submit them on their phones
- **Information monitor** — seeing all combatant HP, energy, status, traits, positions, weather, terrain simultaneously. This is an information density problem — the GM needs a dashboard, not a card view

## What changes in the ring plan

The three views must appear in every ring, not just Ring 3. Each ring's exit criterion already implies view behavior — now it's explicit.

**Ring 0** — no change (pure data model and effect engine, no UI)

**Ring 1** additions:
- R1.6 becomes: **View Capability Framework** — three capability contexts (GM, player, out-of-session) from day one. Not "minimal player can see moves" — minimal versions of all three views
- R1.7 becomes: **Minimal Player Combat UI** — player selects move, picks target, sees result on phone
- R1.7b: **Minimal Character Sheet** — player sees their Pokemon stats/moves/HP outside combat (already added)
- Add R1.7c: **Minimal GM Combat UI** — GM sees all combatants, can select an NPC, choose its action, resolve it, advance turns. This is the other half of the combat loop — without it, Ring 1's exit criterion ("two Pokemon can fight") doesn't work, because someone has to control the opponent
- Add R1.7d: **Minimal Group View** — TV shows the encounter state (who's fighting, whose turn it is, what just happened). Even in Ring 1, the group view matters — it's what the table sees

**Ring 2** additions:
- R2.8 (Combat Action Presentation) is the player phone UI — keep as-is
- Add R2.14: **GM Multi-Entity Combat UI** — the GM's interface for controlling 6+ NPCs/wild Pokemon efficiently. Entity quick-select, action shortcuts, bulk status management. This is the GM-side equivalent of R2.8
- Add R2.15: **GM Request Queue** — inbox for player action requests. Approve/reject with context (what the player wants to do, current game state). Must handle concurrent requests from multiple players
- R2.13 (Group View as Live Projection) — already added, keep as-is

**Ring 3** additions:
- R3.16 (Full View System) — already covers layouts, but now explicitly includes all three views at full fidelity
- R3.18 (Out-of-Session Character Management) — already added for players
- Add R3.19: **GM Session Prep** — encounter building, NPC creation, scene design, encounter tables, campaign management. The GM's out-of-session workflow

**Ring 4** — no change (world-building systems feed into GM session prep tools from R3.19)

## Why this was missing

The original dependency analysis was mechanics-first — "what game systems exist and how do they depend on each other." The adversarial review was also mechanics-first — "what's missing from the game systems graph." Neither asked "how does a session actually run?" The three views answer that question, and they should have been the starting point, not an afterthought.

The documentation vault already understood this — `the-table-as-shared-space.md`, `triple-view-system.md`, `gm-delegates-authority-into-system.md`, `view-capability-projection.md` all describe the view triad as foundational. The ring plan failed to carry that understanding forward.

~~**Status:** Three views elevated from line items to first-class concerns threaded through every ring. GM view decomposed into three modes (session prep, session orchestration, encounter command). Ring 1 now includes minimal versions of all three views. Ring 2 adds GM multi-entity UI and request queue. Next step: begin Ring 0 design — starting with R0.1 (Effect Engine).~~

