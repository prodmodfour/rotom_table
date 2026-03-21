## Browser Interaction via playwright-cli

Use `playwright-cli` (the CLI tool, not the MCP server) to interact with the app in the browser. Run commands via Bash.

### Workflow

1. **Open**: `playwright-cli open http://localhost:3000/gm`
2. **Snapshot**: `playwright-cli snapshot` — returns a text snapshot with element `ref` ids
3. **Act**: use `click`, `fill`, `select`, `type`, etc. with the `ref` from the snapshot
4. **Re-snapshot** after each action to get updated refs before the next interaction

### Key Commands

| Command | Example |
|---------|---------|
| `open [url]` | `playwright-cli open http://localhost:3000/gm/create` |
| `goto <url>` | `playwright-cli goto http://localhost:3000/gm/sheets` |
| `snapshot` | `playwright-cli snapshot` |
| `click <ref>` | `playwright-cli click e5` |
| `fill <ref> <text>` | `playwright-cli fill e12 "Ash Ketchum"` |
| `select <ref> <val>` | `playwright-cli select e8 "Fire"` |
| `type <text>` | `playwright-cli type "some text"` |
| `check <ref>` | `playwright-cli check e14` |
| `screenshot [ref]` | `playwright-cli screenshot` |
| `eval <func> [ref]` | `playwright-cli eval "el => el.textContent" e3` |
| `close` | `playwright-cli close` |

### Sessions

- Use `-s=<name>` for named sessions (e.g. `-s=gm`, `-s=player`) to keep multiple browser windows open simultaneously.
- `playwright-cli list` to see active sessions.
- `playwright-cli close-all` to clean up.

### Routes

| Route | Purpose | Requires |
|-------|---------|----------|
| `/` | Landing | None |
| `/gm` | GM dashboard, active encounter | Encounter (optional) |
| `/gm/sheets` | Character & Pokemon sheets | Characters + Pokemon |
| `/gm/characters/:id` | Character detail | Character |
| `/gm/pokemon/:id` | Pokemon detail | Pokemon |
| `/gm/scenes` | Scene list | None |
| `/gm/scenes/:id` | Scene detail | Scene with entities |
| `/gm/encounters` | Encounter list | None |
| `/gm/encounter-tables` | Encounter table list | None |
| `/gm/encounter-tables/:id` | Encounter table detail | Encounter table with entries |
| `/gm/habitats` | Habitat list | None |
| `/gm/habitats/:id` | Habitat detail | Habitat |
| `/gm/create` | Character/Pokemon creation | None |
| `/gm/map` | VTT map | Active encounter + VTT |
| `/group` | Group/player view | Served content from GM |
| `/player` | Individual player view | Character assignment |

### Tips

- Always snapshot before acting — refs change between page loads and after DOM updates.
- For multi-step forms, snapshot after each step to get fresh refs.
- Use `screenshot` to visually verify the result when the snapshot text is ambiguous.
- The app runs on `http://localhost:3000` by default.
