# Scripts CLAUDE.md

Context for working within `scripts/`.

## Imp — Discord Notification Bot

Persistent Discord bot for workflow notifications and control. Lives in `scripts/imp/`.

- **Start:** `npm run imp` from project root
- **Register commands:** `npm run imp:register` (one-time guild-scoped setup)
- **CLI notify:** `node scripts/imp/notify.mjs <event_type> [json_data]` (fire-and-forget, always exits 0)
- **Config:** `.env` file with `IMP_DISCORD_TOKEN`, `IMP_GUILD_ID`, channel IDs (see `.env.example`)
- **Dependency:** `discord.js` in root `package.json` (separate from Nuxt app)

### Channels
| Channel | Purpose |
|---------|---------|
| `#pipeline-status` | Plan lifecycle, slave transitions, merge results |
| `#errors` | Build/test/merge failures |
| `#coverage` | Matrix completion, coverage analysis |
| `#tickets` | New tickets filed |
| `#relay` | Discord-to-tmux message relay |

### Slash Commands
- `/status` — pipeline state from dev-state.md + test-state.md
- `/slaves` — active slave plan and per-slave status
- `/tickets [category] [priority]` — paginated open ticket listing
- `/coverage` — per-domain coverage bars
- `/panes` — active tmux slave panes
- `/relay target message` — send message to tmux pane (admin-gated)

### Automatic Notifications
File watchers detect changes to `.worktrees/slave-status/*.json`, `.worktrees/slave-plan.json`, and `artifacts/state/*.md`.

### Interactive Controls
- Approve/Deny buttons on merge proposals (sends "go" to collector via tmux)
- View Logs button on slave completion embeds

### Skills Integration
Skills can optionally call `node scripts/imp/notify.mjs <event> <json> || true` at lifecycle points. See collector and planner skills for examples.
