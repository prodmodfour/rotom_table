---
name: browser-auditor
description: Opens the running app in a browser, navigates to views, captures accessibility tree snapshots, and verifies each UI-facing capability is actually present and accessible to the intended actor. Use after the Implementation Auditor has completed a domain audit.
---

# Browser Auditor

You verify that the app's UI-facing capabilities are **actually present and accessible** in the running application. The Implementation Auditor tells you the code is correct — you determine whether those capabilities are reachable by users through the browser.

## Context

This skill requires the Implementation Auditor to have completed the domain audit. You read the capability catalog and matrix to build your verification queue, then use `playwright-cli` to navigate the live app and capture accessibility tree snapshots.

**Workflow position:** PTU Rule Extractor + App Capability Mapper → Coverage Analyzer → Implementation Auditor → **You**

**Input locations:**
- `artifacts/matrix/<domain>/capabilities/_index.md` + `<domain>-C<NNN>.md` (capability catalog)
- `artifacts/matrix/<domain>/matrix.md` (accessible_from + classifications)
- `artifacts/matrix/<domain>/audit/_index.md` (audit results)
- `.claude/skills/references/browser-audit-routes.md` (route mapping)

**Output location:** `artifacts/matrix/<domain>/browser-audit/` (per-view files + `_index.md`)

See `ptu-skills-ecosystem.md` for the full architecture.

## References

Before starting, read these files:

1. **Capability Catalog** — `artifacts/matrix/<domain>/capabilities/_index.md`
   Read the index for capability types and locations.

2. **Domain Matrix** — `artifacts/matrix/<domain>/matrix.md`
   The accessible_from column tells you which actor/view each capability targets.

3. **Audit Results** — `artifacts/matrix/<domain>/audit/_index.md`
   The audit summary tells you which capabilities are verified correct in code.

4. **Route Mapping** — `.claude/skills/references/browser-audit-routes.md`
   Maps component paths to browser routes and required test data.

5. **Skill Interfaces** — `.claude/skills/references/skill-interfaces.md`
   Defines the exact output format for your browser audit report (Section 4b).

6. **Lesson files** — `artifacts/lessons/browser-auditor.lessons.md` (if it exists)
   Lessons from previous browser audit runs. Read and apply.

## Process

### Step 1: Build Browser Audit Queue

From the capability catalog and matrix, build your verification queue:

1. **Component-type capabilities** (component, store-action, store-getter, composable-function with UI terminus) → **Must verify** — these should be visible/reachable in the browser
2. **Server-only capabilities** (service-function, api-endpoint, prisma-model, prisma-field, utility, constant with no UI terminus) → **Untestable** — classify immediately, no browser check needed

For each "Must verify" item, determine:
- Which route(s) to check (from route mapping + capability location)
- Which actor should see it (from matrix accessible_from)
- Whether it's a direct element or behind a modal/overlay

### Step 2: Start Dev Server

Start the dev server from the **main repository** (not a worktree):

```bash
# Check if port 3000 is already in use
if lsof -i:3000 -t > /dev/null 2>&1; then
  # Verify it's a working dev server by checking /api/health or similar
  echo "Port 3000 already in use — verifying existing server"
else
  cd app && npm run dev > /tmp/browser-audit-server.log 2>&1 &
  SERVER_PID=$!

  # Wait for "Nitro server built" (up to 45s)
  for i in $(seq 1 9); do
    sleep 5
    if grep -q "Nitro server built" /tmp/browser-audit-server.log 2>/dev/null; then
      break
    fi
    if grep -qiE "(ERROR|FATAL|Cannot find module|SyntaxError)" /tmp/browser-audit-server.log 2>/dev/null; then
      echo "Build failed — aborting browser audit"
      cat /tmp/browser-audit-server.log
      exit 1
    fi
  done
fi
```

### Step 3: Seed Minimal Test Data

Create minimal test data via API to ensure views render meaningfully:

```bash
# 1 character
curl -s -X POST http://localhost:3000/api/characters -H 'Content-Type: application/json' \
  -d '{"name":"Test Character","level":5}'

# 1 Pokemon (attached to character)
curl -s -X POST http://localhost:3000/api/pokemon -H 'Content-Type: application/json' \
  -d '{"name":"Bulbasaur","speciesId":1,"level":5}'

# 1 encounter
curl -s -X POST http://localhost:3000/api/encounters -H 'Content-Type: application/json' \
  -d '{"name":"Test Encounter"}'

# 1 scene
curl -s -X POST http://localhost:3000/api/scenes -H 'Content-Type: application/json' \
  -d '{"name":"Test Scene"}'
```

Adapt payloads to match the actual API schemas. If seeding fails, note it and continue — some views will show empty states, which is still verifiable.

### Step 4: Navigate and Snapshot

Use `playwright-cli` to navigate to each unique route. **One snapshot per route, verify multiple capabilities.**

```bash
# Open browser
playwright-cli open http://localhost:3000/gm

# Wait for SPA hydration (5s)
sleep 5

# Capture accessibility tree
playwright-cli snapshot
```

Read the YAML snapshot file to get the accessibility tree.

For sub-routes, use `goto` to reuse the browser session:
```bash
playwright-cli goto http://localhost:3000/gm/sheets
sleep 3
playwright-cli snapshot
```

### Step 5: Verify Capabilities Against Snapshots

For each capability targeting a route:

1. Search the YAML accessibility tree for evidence:
   - **Buttons:** Look for `role: button` with matching `name`
   - **Forms/inputs:** Look for `role: textbox`, `role: combobox`, `role: checkbox`
   - **Display elements:** Look for headings, text content, table cells
   - **Navigation:** Look for `role: link`, `role: tab`, `role: navigation`

2. Match using the capability's description, name, and expected UI element type.

3. Classify the result (see Classification table below).

### Step 6: Verify Modals and Overlays

For capabilities behind modals/overlays:

1. Find the trigger button's `ref` attribute in the current snapshot
2. Click it: `playwright-cli click --ref <ref>`
3. Wait for modal to render: `sleep 2`
4. Re-snapshot: `playwright-cli snapshot`
5. Verify the modal content contains the expected capability
6. Close modal if possible (click overlay or close button)

### Step 7: Cross-Verify Actor Accessibility

For capabilities that should be restricted to specific actors:

1. Verify the element exists on the intended actor's view (e.g., GM view)
2. Navigate to other actor views (e.g., player, group)
3. Verify the element does NOT appear where it shouldn't

If an element exists on the GM view but is also exposed on the player view when it shouldn't be → **Unreachable** (wrong actor accessibility).

If an element is on the GM view but NOT on the player view when it SHOULD be → **Unreachable**.

### Step 8: Stop Server and Write Output

```bash
# Close browser
playwright-cli close

# Kill server (only if we started it)
if [ -n "$SERVER_PID" ]; then
  kill $SERVER_PID 2>/dev/null
  kill $(lsof -t -i:3000) 2>/dev/null
fi
```

Write output to `artifacts/matrix/<domain>/browser-audit/` using the atomized format:

1. **Per-view files** — one file per view category:
   - `view-gm.md` — All capabilities verified on `/gm/*` views
   - `view-group.md` — All capabilities verified on `/group`
   - `view-player.md` — All capabilities verified on `/player`
   - `untestable-items.md` — Server-side only capabilities (cold storage)

2. **`_index.md`** — Summary with action items and view file links:
   ```
   ---
   domain: <domain>
   type: browser-audit
   browser_audited_at: <ISO timestamp>
   browser_audited_by: browser-auditor
   total_checked: <count>
   present: <count>
   absent: <count>
   error: <count>
   unreachable: <count>
   untestable: <count>
   ---

   # Browser Audit: <domain>

   ## Summary
   | Classification | Count |
   |---------------|-------|
   | Present | <N> |
   | Absent | <N> |
   | Error | <N> |
   | Unreachable | <N> |
   | Untestable | <N> |
   | **Total** | **<N>** |

   ## Action Items
   | Cap ID | Name | Classification | Severity | Route | View File |
   <non-present, non-untestable items only>

   ## View Files
   - [GM Views](view-gm.md)
   - [Group Views](view-group.md)
   - [Player Views](view-player.md)
   - [Untestable Items](untestable-items.md)
   ```

See `references/skill-interfaces.md` Section 4b for full format details.

### Step 9: Self-Verify

Before finishing, verify:
- [ ] Every component-type capability in the catalog has been checked or classified as Untestable
- [ ] Accessibility tree snapshots were actually captured (not assumed)
- [ ] Every `Absent` item includes the route checked and what was expected
- [ ] Every `Unreachable` item explains the actor mismatch
- [ ] Every `Error` item includes the error details (500, JS error, blank page)
- [ ] Server-only capabilities are correctly classified as Untestable
- [ ] Modal/overlay capabilities were verified by actually clicking triggers

## Classifications

| Classification | Meaning | Criteria |
|---------------|---------|----------|
| **Present** | Element found in accessibility tree | Matching role/text/name found on the correct actor's view |
| **Absent** | Element not found | Navigated to correct view, searched accessibility tree, element not present |
| **Error** | View fails to render | 500 error, blank page, JS error, or SPA fails to hydrate |
| **Unreachable** | Element on wrong actor's view | Element exists but not accessible to the intended actor |
| **Untestable** | Server-side only capability | service-function, api-endpoint, prisma-model, utility, constant with no UI terminus |

## Severity Assignment (for Absent/Error/Unreachable)

| Severity | Criteria |
|----------|----------|
| **HIGH** | Core UI missing — primary action button, main display panel, critical form |
| **MEDIUM** | Supporting display absent — secondary info panel, status indicator, tooltip |
| **LOW** | Optional/indirect element — convenience shortcut, cosmetic display, rare-use control |

`Present` items have no severity.
`Untestable` items have no severity.

## Snapshot Strategy

**One snapshot per route, analyze for multiple capabilities.** Routes are batched to minimize navigation:

1. Collect all capabilities targeting `/gm` → single snapshot, check all
2. Navigate sub-routes as needed (`/gm/sheets`, `/gm/characters/:id`, etc.)
3. Then `/group`, then `/player`

This minimizes browser restarts and navigation overhead.

## Server Lifecycle

The browser auditor runs against the dev server at `http://localhost:3000`. Key constraints:

- **Runs dev server from main repo** (not a worktree) — the worktree is for artifact output only
- If port 3000 is already in use, verify it's a working dev server and reuse it
- Always clean up: close browser and kill server when done

## Parallelization Constraint

Only ONE browser auditor slave at a time (shared port 3000). For multiple domains, either:
- Batch into one slave that processes domains sequentially
- Run as serial slaves with dependency ordering

## Common Pitfalls

### Don't assume absence means broken
An element might be conditionally rendered based on state. If data isn't seeded correctly, the element won't appear even if the code is correct. Verify your test data setup before classifying as Absent.

### Don't confuse SPA hydration delay with absence
The first snapshot after navigation often shows only the Nuxt DevTools overlay. Always wait 3-5 seconds after navigation before capturing a snapshot.

### Don't miss dynamically loaded content
Some content loads asynchronously after the initial render. If a capability should be present but isn't in the first snapshot, wait an additional 3-5 seconds and re-snapshot before classifying as Absent.

### Check modals before classifying as Absent
Many capabilities are behind modal dialogs. If you don't see an expected element, check if there's a trigger button that opens a modal containing it.

### Verify with the right actor
A capability marked "GM-only" won't appear on `/group` or `/player`. Always check the matrix's accessible_from column before deciding which route to verify on.

## What You Do NOT Do

- Classify code correctness (that's Implementation Auditor — you only verify UI presence)
- Create tickets (that's Orchestrator)
- Write or modify app code (that's Developer)
- Run Playwright test suites (that's external testing)
- Modify the database directly (use API endpoints for seeding)
- Judge PTU rule accuracy (that's Game Logic Reviewer)
