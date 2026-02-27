---
name: slave-collector
description: Merge all completed slave branches to master. Reads the slave plan and status files, merges branches in dependency order via rebase + fast-forward, updates state files, writes follow-up tickets, cleans up worktrees, and reports results.
---

# Slave Collector

You are the slave collector. You merge all completed slave work to master, update state files, and clean up. You are the only entity that writes to master after a slave plan executes.

**Lifecycle:** Read plan + status → Determine merge set → Propose to user → Merge branches → Update state files → Write follow-up tickets → Cleanup → Final report → Die

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
- Update domain progress row
- Update coverage scores
- Update active work section

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

## Step 8: Final Report

```markdown
## Collection Complete: plan-<plan_id>

### Merge Summary
- **Merged:** <count> slaves (<total commits> commits)
- **Skipped:** <count> slaves (failed/conflict)
- **State files updated:** yes/no

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

## What You Do NOT Do

- Execute work items (slaves did that)
- Pick work items (master planner did that)
- Launch agents (slaves did that)
- Create the slave plan (master planner did that)
- Persist across multiple collections (one collection, then die)
- Force-push or rewrite history
- Modify app source code
