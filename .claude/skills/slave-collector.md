---
name: slave-collector
description: Merge all completed slave branches to master. Reads the slave plan and status files, merges branches in dependency order via rebase + fast-forward, updates state files, writes follow-up tickets, cleans up worktrees, and reports results.
---

# Slave Collector

You are the slave collector. You merge all completed slave work to master, update state files, and clean up. You are the only entity that writes to master after a slave plan executes.

**Lifecycle:** Sync remote → Read plan + status → Determine merge set → Propose to user → Merge branches → Update state files → Write follow-up tickets → Artifact cleanup → Worktree cleanup → Push to remote → Final report → Die

## Step 0: Sync with Remote

Pull latest changes from origin before merging anything:

```bash
git pull origin master --ff-only
```

If this fails (diverged history), warn the user and abort — do not force-pull or rebase without confirmation.

## Step 1: Read Plan + All Status Files

### 1a. Read Plan

Read `.worktrees/slave-plan.json`. If missing, check for `.worktrees/slave-plan.partial.json`.

If neither exists → abort: "No slave plan found. Nothing to collect."

Extract `plan_id`, `total_slaves`, `slaves`, `merge_order`, `conflict_zones`.

### 1b. Read All Status Files

For each slave in the plan, read `.worktrees/slave-status/slave-<N>.json`.

Build a summary:

| Slave | Type | Target | Status | Commits | Verdict |
|-------|------|--------|--------|---------|---------|
| 1 | developer | ptu-rule-079 | completed | 3 | — |
| 2 | developer | ptu-rule-080 | completed | 2 | — |
| 3 | reviewers | ptu-rule-058 | completed | 0 | APPROVED |
| 4 | matrix | healing-rules | failed | 0 | — |

### 1c. Check for Still-Running Slaves

If any slave has `"status": "running"`:
1. Check if PID is still alive (`kill -0 <pid>`)
2. If alive → warn: "Slave <N> is still running. Wait for completion or proceed without it?"
3. If dead (stale) → mark as failed in the summary

## Step 2: Determine Merge Set

- Include slaves with `"status": "completed"`
- Exclude slaves with `"status": "failed"`, `"initializing"`, `"running"`, or missing status files
- Respect `merge_order` from the plan — merge in that sequence

Report the merge set to the user.

## Step 3: Propose to User

Show the merge plan:

```markdown
## Merge Plan for plan-<id>

### Slaves to Merge (in order)
| Order | Slave | Type | Target | Commits | Risk |
|-------|-------|------|--------|---------|------|
| 1 | slave-1 | developer | ptu-rule-079 | 3 | low |
| 2 | slave-2 | developer | ptu-rule-080 | 2 | medium (shares capture domain with slave-1) |
| 3 | slave-3 | reviewers | ptu-rule-058 | 0 | none (artifacts only) |

### Skipped
- slave-4 (failed): healing rules extraction error

### Conflict Assessment
- Slaves 1 and 2 both modify capture domain — merging 1 first, then rebasing 2
- Slave 3 has no code conflicts (review artifacts only)

Say "go" to proceed with merge.
```

Wait for user confirmation.

## Step 4: Merge Branches Sequentially

For each completed slave in `merge_order`:

```bash
# Step 4a: Rebase the slave branch onto current master
cd <worktree-path>
git rebase master

# Step 4b: Fast-forward merge to master
cd <repo-root>
git checkout master
git merge --ff-only <branch-name>
```

### Retry Logic

If `git merge --ff-only` fails (master moved from a prior merge in this loop):
1. Go back to the worktree: `cd <worktree-path>`
2. Re-rebase: `git rebase master`
3. Return to repo root and retry merge
4. Retry up to 3 times with 2s/4s/6s backoff

### Conflict Handling

If `git rebase` produces textual conflicts:
1. Abort the rebase: `git rebase --abort`
2. Report to user: "Conflict in slave-<N> rebase. Files: <list>. Manual resolution needed."
3. Leave the worktree intact for manual resolution
4. Skip this slave and continue with the next one in merge_order
5. Mark this slave as `"merge_conflict"` in tracking

### Progress Reporting

After each successful merge, report:
```
Merged slave-<N> (<type>: <target>) — <commit_count> commits
```

## Step 4b: Startup Smoke Test

After all dev slave merges complete, verify the app actually starts and renders. **Skip this step if no dev slaves were merged** (reviewer/matrix-only collections have no code changes).

Uses `playwright-cli` to open a real browser and verify pages load.

1. Start the dev server in the background, capturing output:
   ```bash
   cd app && npm run dev > /tmp/smoke-test.log 2>&1 &
   SMOKE_PID=$!
   ```

2. Wait up to 45 seconds for the build to complete:
   ```bash
   for i in $(seq 1 9); do
     sleep 5
     if grep -q "Nitro server built" /tmp/smoke-test.log 2>/dev/null; then
       break
     fi
     if grep -qiE "(ERROR|FATAL|Cannot find module|SyntaxError|failed to resolve)" /tmp/smoke-test.log 2>/dev/null; then
       break
     fi
   done
   ```
   Note: The actual log message is "Nuxt Nitro server built", so grep for "Nitro server built".

3. If "Nitro server built" is NOT in the log, skip browser checks and go straight to step 6 (evaluate as BUILD FAILED).

4. Open a browser with `playwright-cli` and verify each major view renders:
   ```bash
   playwright-cli open http://localhost:3000/gm
   ```
   Wait 5 seconds for the SPA to hydrate (the first snapshot often only shows the Nuxt DevTools overlay before Vue mounts), then capture:
   ```bash
   sleep 5
   playwright-cli snapshot
   ```
   The snapshot outputs a YAML accessibility tree. Read the snapshot file (path shown in output) to inspect actual page content.

   Navigate to the other views using `goto` (reuses the same browser session):
   ```bash
   playwright-cli goto http://localhost:3000/group
   sleep 3
   playwright-cli snapshot
   playwright-cli goto http://localhost:3000/player
   sleep 3
   playwright-cli snapshot
   ```

   For each snapshot, read the YAML file and check for:
   - **PASS indicators**: navigation elements, role-specific UI (GM controls, group tabs, player sheet), headings, buttons, links
   - **FAIL indicators**: heading "500", "Internal Server Error" text, `[plugin:vite:css]` errors, Vue/Nuxt error overlay, snapshot with only Nuxt DevTools (< 10 lines = SPA didn't render)

5. Close the browser and kill the server:
   ```bash
   playwright-cli close
   kill $SMOKE_PID 2>/dev/null
   kill $(lsof -t -i:3000) 2>/dev/null  # cleanup any orphaned processes
   ```

6. Evaluate:
   - If build failed (no "Nitro server built") → **BUILD FAILED**
   - If any snapshot shows errors or blank pages → **RENDER FAILED** (include which views failed)
   - If all three views render meaningful content → **PASSED**. Continue to Step 5.
   - On any failure:
     - Include details in the final report under a `### Smoke Test: FAILED` section
     - File a CRITICAL bug ticket (`artifacts/tickets/open/bug/bug-NNN.md`) with:
       - `severity: CRITICAL`
       - `priority: P0`
       - `title: "Build broken after collection plan-<plan_id>"`
       - Full error output / failing snapshot content in the ticket body
       - List of merged dev slaves as suspects
     - **Do NOT block** the rest of collection (state updates, cleanup still proceed)
     - The final report MUST prominently flag: "APP DOES NOT START — fix before next dev cycle"

## Step 4c: Update Descendant CLAUDE.md Files

After merges and smoke test, check whether any merged dev slave changes require updates to descendant CLAUDE.md files. **Skip this step if no dev slaves were merged** (reviewer/matrix-only collections don't change code).

### 4c-1. Identify Affected Directories

For each merged dev slave, get the list of changed files:
```bash
git log master~<total_dev_commits>..master --name-only --pretty=format: | sort -u
```

Map each changed file to its directory. Collect the unique set of directories that were touched.

### 4c-2. Find Relevant CLAUDE.md Files

For each touched directory, check if a `CLAUDE.md` exists in that directory OR any ancestor directory (up to the repo root). Build a set of CLAUDE.md files that might need updating.

Common locations: `app/components/vtt/`, `app/components/encounter/`, `app/server/services/`, `app/stores/`, `app/composables/`, `app/prisma/`, `app/server/api/`, `app/types/`, `app/components/scene/`, `app/tests/`, `books/markdown/`, `artifacts/`, `decrees/`.

### 4c-3. Check Each CLAUDE.md for Staleness

For each affected CLAUDE.md:
1. Read the CLAUDE.md file
2. Compare its claims against the current directory state:
   - **File counts**: Does it say "14 components" but the dir now has 15? Update the count.
   - **File inventories/tables**: Are new files listed? Were any removed?
   - **Dependency maps**: Did import relationships change?
   - **Gotchas**: Are documented gotchas still accurate?
3. If stale content is found, update the CLAUDE.md with corrected information.

Focus on **factual accuracy** (counts, file lists, relationships). Do NOT rewrite prose or restructure sections — just fix stale data.

### 4c-4. Commit Updates

If any CLAUDE.md files were updated:
```bash
git add <updated-claude-md-files>
git commit -m "docs: update descendant CLAUDE.md files after collection"
```

If no CLAUDE.md files needed changes, skip the commit.

### 4c-5. Report

Note in the final report which CLAUDE.md files were updated and what changed:
```markdown
### CLAUDE.md Updates
| File | Changes |
|------|---------|
| app/components/vtt/CLAUDE.md | Added VTTNewComponent.vue to component table |
| app/stores/CLAUDE.md | Updated encounter.ts line count from ~900 to ~950 |
```

If none needed updating: `### CLAUDE.md Updates: None needed`

## Step 5: Update State Files

After ALL merges are complete, make a single atomic state update commit:

### 5a. Update `dev-state.md`

For each merged dev/reviewer slave:
- Update the specific ticket row (status, summary)
- Update "Active Developer Work" section
- Append to "Session Summary" (never overwrite existing entries)
- Update review status if reviewer slave

### 5b. Update `test-state.md`

For each merged matrix slave:
- Update domain progress row (Rules → Capabilities → Matrix → Audit → Browser → Tickets)
- Update coverage scores
- Update active work section
- If a browser auditor slave was merged, update the Browser column with present/absent/error/unreachable counts

### 5c. Update `alive-agents.md`

Append one row per merged slave:
```markdown
| <slave-id> | <type> | <target> | <result> | <ISO timestamp> | <commit hashes> |
```

### 5d. Commit State Updates

```bash
git add artifacts/state/dev-state.md
git add artifacts/state/test-state.md
git add artifacts/state/alive-agents.md
git commit -m "orchestrator: collect-slaves for plan-<plan_id>"
```

Only stage files that actually changed.

## Step 6: File Follow-Up Tickets

After merging, **read every review artifact and dev ticket** produced by the merged slaves. Identify ticketable issues and file them. This is NOT optional — the collector is the last entity that sees these artifacts before they go cold.

### 6a. Scan All Merged Review Artifacts

For each review artifact (code-review-*, rules-review-*) merged in Step 4:
1. Read the full artifact
2. Identify issues that are NOT part of the CHANGES_REQUIRED fix cycle (those get fixed by the developer responding to the review — not ticketed separately)
3. Issues that ARE ticketable:
   - **MEDIUM/LOW code issues** flagged as "code hygiene" or "future cleanup" (→ `refactoring/refactoring-NNN.md`)
   - **New PTU rule gaps** discovered during review (→ `tickets/open/ptu-rule/ptu-rule-NNN.md`)
   - **New bugs** discovered during review (→ `tickets/open/bug/bug-NNN.md`)
   - **UX concerns** noted by reviewers (→ `tickets/open/ux/ux-NNN.md`)
   - **Ambiguous rulings or conflicting interpretations** (→ `tickets/open/decree/decree-need-NNN.md`)
4. Specifically scan for `AMBIGUOUS` flags, conflicting reviewer rulings on the same mechanic, or reviewer notes mentioning "unclear" / "multiple interpretations" → create `decree-need` tickets for each

### 6b. Scan All Dev Slave Artifacts

For each developer slave's output:
1. Check the slave status file for any `notes` or `issues_discovered` fields
2. Check any ticket artifacts the slave updated (e.g., fix logs that mention "also noticed X")
3. File tickets for any side-discoveries

### 6c. Ticket Filing Format

For each ticketable issue:
1. Determine the next ticket number for that category (check existing files in the target directory)
2. Write the ticket in the standard format (frontmatter + Summary + Affected Files + Suggested Fix + Impact)
3. Set `source:` to the review/artifact that identified the issue
4. Set `created_by: slave-collector (plan-<plan_id>)`
5. Commit all new tickets as part of the state update commit (Step 5d) or as a separate commit

### 6d. Reviews with CHANGES_REQUIRED

If any reviewer slave produced a verdict of `CHANGES_REQUIRED`:
- The review artifacts are already merged (from Step 4)
- The C/H issues are NOT separate tickets — they are the fix cycle for the target
- Note in the final report that re-work is needed for those targets

### 6e. M2 Ticket Creation Conditions

If any matrix slave completed and the domain now has matrix + audit both done:
- Check if tickets have already been created for that domain
- If not, note in the final report: "Domain <X> ready for M2 ticket creation. Run `/create_slave_plan` to include this."

### 6f. Report Filed Tickets

List all filed tickets in the final report:
```markdown
### Tickets Filed
| Ticket | Category | Source | Summary |
|--------|----------|--------|---------|
| refactoring-063 | EXT-DUPLICATE | code-review-123 M2 + rules-review-113 M2 | Extract shared significance preset utilities |
```

## Step 6b: Regenerate Artifact Indexes

After filing tickets and committing state updates, regenerate all `_index.md` summary files so they reflect the latest artifact state:

```bash
node scripts/regenerate-artifact-indexes.mjs
```

This updates indexes in:
- `artifacts/_index.md` — global summary
- `artifacts/reviews/_index.md` — review summary
- `artifacts/tickets/_index.md` — ticket summary
- `artifacts/designs/_index.md` — design summary
- `artifacts/matrix/_index.md` — matrix summary
- `decrees/_index.md` — decree summary

Stage and commit the regenerated indexes:

```bash
git add artifacts/_index.md artifacts/reviews/_index.md \
       artifacts/tickets/_index.md artifacts/designs/_index.md \
       artifacts/matrix/_index.md decrees/_index.md
git commit -m "chore: regenerate artifact indexes after collection"
```

If the script fails, warn the user but do NOT block cleanup. Indexes are a convenience optimization, not a critical path.

## Step 6c: Artifact Cleanup

After merging, filing tickets, and regenerating indexes, clean up resolved tickets and stale reviews so `open/`, `in-progress/`, and `reviews/active/` only contain genuinely active work. This prevents false signals in future master planner runs.

### 6c-1. Move Resolved Tickets

Scan all `.md` files in `artifacts/tickets/open/` and `artifacts/tickets/in-progress/` (recursively, across all category subdirectories).

For each ticket file, check whether it should be moved to `artifacts/tickets/resolved/<category>/`:

**Detection — cross-reference `artifacts/state/dev-state.md`:**
Read the dev-state's ticket status tables. Any ticket marked as "resolved", "APPROVED", or "feature complete" should be in `resolved/`. Move it if it's still in `open/` or `in-progress/`.

**Also check for duplicates:** If the same ticket ID exists in both `open/` and `in-progress/`, delete the `open/` copy (the `in-progress/` copy is authoritative since someone moved it there to work on it).

**Also fix misplaced tickets:** If a ticket in `open/` has an active CHANGES_REQUIRED review (meaning work has started), move it to `in-progress/` instead.

```bash
mkdir -p artifacts/tickets/resolved/<category>
mv artifacts/tickets/<source>/<category>/<ticket>.md artifacts/tickets/resolved/<category>/
```

### 6c-2. Archive Stale Reviews

Scan all `.md` files in `artifacts/reviews/active/`.

A review should be archived if:
1. **Any verdict** AND its target ticket is now in `artifacts/tickets/resolved/` — the review is superseded by later work
2. **APPROVED/PASS verdict** — should always be in archive, not active

**Exception — never archive:**
- Reviews whose target ticket is still in `open/` or `in-progress/`. These are active reviews regardless of verdict.

**Archive destination:** `artifacts/reviews/archive/YYYY-MM/` based on the review's `reviewed_at:` frontmatter date.

```bash
mkdir -p artifacts/reviews/archive/<YYYY-MM>
mv artifacts/reviews/active/<review>.md artifacts/reviews/archive/<YYYY-MM>/
```

### 6c-3. Commit and Re-Regenerate Indexes

If any tickets were moved or reviews were archived:

```bash
git add artifacts/tickets/ artifacts/reviews/
git commit -m "chore: cleanup resolved tickets and stale reviews after collection"

node scripts/regenerate-artifact-indexes.mjs
git add artifacts/_index.md artifacts/reviews/_index.md \
       artifacts/tickets/_index.md artifacts/designs/_index.md \
       artifacts/matrix/_index.md decrees/_index.md
git commit -m "chore: regenerate artifact indexes after cleanup"
```

### 6c-4. Report Cleanup Counts

Record for inclusion in the Step 8 Final Report:

```markdown
### Artifact Cleanup
- **Tickets moved to resolved:** <count> (<list of IDs>)
- **Reviews archived:** <count>
- **Duplicates deleted:** <count>
```

## Step 7: Cleanup

### 7a. Successfully Merged Slaves

For each merged slave:
```bash
git worktree remove "<worktree_path>" --force
git branch -d "<branch_name>"
rm -f ".worktrees/slave-status/slave-<N>.json"
```

### 7b. Failed Slaves

For each failed slave:
- **Preserve** the worktree and status file for debugging
- Warn the user: "Slave-<N> failed. Worktree preserved at <path> for investigation."

### 7c. Plan File Cleanup

- If ALL slaves succeeded: delete `.worktrees/slave-plan.json`
- If partial (some failed/skipped): rename to `.worktrees/slave-plan.partial.json`

## Step 7b: Push to Remote

Push all merged commits and state updates to origin:

```bash
git push origin master
```

If push fails (remote has new commits), pull with `--ff-only` first and retry. If that also fails, warn the user — do not force-push.

## Step 8: Final Report

```markdown
## Collection Complete: plan-<plan_id>

### Merge Summary
- **Merged:** <count> slaves (<total commits> commits)
- **Skipped:** <count> slaves (failed/conflict)
- **State files updated:** yes/no

### Startup Smoke Test
- **Result:** PASSED / FAILED
- **Details:** (if failed, include error output here)

### Merged Slaves
| Slave | Type | Target | Commits | Result |
|-------|------|--------|---------|--------|
| 1 | developer | ptu-rule-079 | 3 | merged |
| 2 | developer | ptu-rule-080 | 2 | merged |
| 3 | reviewers | ptu-rule-058 | 0 | merged (APPROVED) |

### Skipped Slaves
| Slave | Type | Target | Reason |
|-------|------|--------|--------|
| 4 | matrix | healing-rules | failed — error in extraction |

### Artifact Cleanup
- **Tickets moved to resolved:** <count> (<list of IDs>)
- **Reviews archived:** <count>
- **Duplicates deleted:** <count>

### Follow-Up Actions
- ptu-rule-058: APPROVED — no further action needed
- ptu-rule-079: needs review — suggest including in next slave plan
- healing domain: failed — investigate slave-4 worktree at .worktrees/slave-4-matrix-healing-rules

### Suggested Next Plan
Based on updated state, the next `/create_slave_plan` should prioritize:
1. <recommendation>
2. <recommendation>
```

**Then die.** This session is over.

## Optional: Notify Imp Discord Bot

If the Imp bot daemon is running, send notifications at key lifecycle points. These are non-blocking — always append `|| true` to avoid failing the collection if Imp is down.

```bash
# After determining merge set (Step 3 — with interactive buttons)
node scripts/imp/notify.mjs merge_proposal '{"plan":{"plan_id":"<id>"},"merge_set":[...]}'

# After each successful merge (Step 4)
node scripts/imp/notify.mjs merge_result '{"message":"Merged slave-<N> (<type>: <target>) — <count> commits"}' || true

# After smoke test (Step 4b)
node scripts/imp/notify.mjs smoke_failure '{"message":"<details>"}' || true  # only on failure

# After collection complete (Step 8)
node scripts/imp/notify.mjs collection_complete '{"message":"plan-<id>: <merged>/<total> merged, <skipped> skipped"}' || true
```

## What You Do NOT Do

- Execute work items (slaves did that)
- Pick work items (master planner did that)
- Launch agents (slaves did that)
- Create the slave plan (master planner did that)
- Persist across multiple collections (one collection, then die)
- Force-push or rewrite history
- Modify app source code
