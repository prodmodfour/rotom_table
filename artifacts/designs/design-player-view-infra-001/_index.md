---
design_id: design-player-view-infra-001
ticket_id: feature-003
track: B
category: INFRASTRUCTURE
scope: FULL
domain: player-view
status: draft
depends_on: []
blocks:
  - design-player-view-integration (Track C)
affected_files: []
new_files: []
---


# Design: Player View Infrastructure -- Remote Access & Out-of-Session Architecture

## Overview

### Problem Statement

The PTU Session Helper runs on the GM's local machine as a Nuxt 3 SPA (`ssr: false`) backed by a SQLite database and Nitro server. During sessions, all devices on the same LAN can reach the app at `http://<gm-ip>:3000`. Between sessions, the server is off and inaccessible.

Players need to:
1. **Access character sheets between sessions** for leveling up, reviewing moves, planning team composition
2. **Connect remotely** when a player cannot physically attend (sickness, travel, mixed in-person/remote groups)
3. **Not depend on the GM running the server 24/7** for character management

The GM's home network has no static IP and sits behind ISP NAT, making direct port-forwarding unreliable and insecure.

### Constraints

| Constraint | Detail |
|------------|--------|
| **Database** | SQLite file (`app/prisma/ptu.db`) -- single-writer, local file, no built-in replication |
| **Server** | Nitro (Node.js) -- runs on GM's machine (Windows/Linux desktop or laptop) |
| **SPA mode** | `ssr: false` -- all rendering is client-side; Nitro only serves the static shell + API |
| **WebSocket** | Real-time combat sync via `/ws` route -- must work through any tunnel solution |
| **GM technical level** | Non-technical hobbyist -- setup must be near-zero-config |
| **Cost** | Free or very low cost -- this is a personal hobby tool |
| **Player count** | 3-6 players per group, typically 1 GM |

### User Personas

**GM (Server Operator)**
- Runs the app on their personal machine (Windows 10/11 or Linux desktop)
- Not a software developer -- may be comfortable with "click install, click start" but not with editing config files, DNS records, or firewall rules
- Wants to start a session with minimal setup (ideally one click)
- Does NOT want to leave their machine running 24/7 as a server

**Player (Remote Client)**
- Connects from a phone (primary) or laptop
- During sessions: needs real-time combat participation (WebSocket-dependent)
- Between sessions: needs read/write access to their character sheet and Pokemon team
- Technical tolerance: can follow a simple link or install an app, but nothing more

---


## Atomized Files

- [_index.md](_index.md)
- [spec.md](spec.md)
- [shared-specs.md](shared-specs.md)
- [implementation-log.md](implementation-log.md)
