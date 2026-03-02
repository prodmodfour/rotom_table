# UX Sessions CLAUDE.md

Context for working within `ux-sessions/`.

## UX Exploration Sessions

Simulated play sessions where 5 AI personas interact with the live app through real browsers (Playwright). Each persona has a fixed device, viewport, personality, and PTU knowledge level.

- **Party profiles:** `ux-sessions/party.md` (5 fixed personas: Kaelen GM, Mira/Dex/Spark/Riven players)
- **Scenarios:** `ux-sessions/scenarios/ux-session-NNN.md`
- **Reports:** `ux-sessions/reports/ux-session-NNN/`
- **Command:** `/ux_session ux-session-NNN` — orchestrates 7-slave session (5 browser + narrator + ticket creator)
- **Blocking milestones:** No dev work during UX sessions. After session, tickets are created from findings.
- **Roadmap:** ux-session-001 (basic combat) → 002 (scenes) → 003 (VTT) → 004 (capture) → 005 (comprehensive)
- **Playwright scripts** must use `.cjs` extension (app uses ESM). Run from project root.
