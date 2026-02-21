---
name: slave-executor
description: Execute a single slave assignment from the current slave plan. Reads the plan, creates a git worktree, launches the appropriate agent(s) with pre-gathered template data, writes status, and dies. Does NOT merge to master — the collector does that.
---

# Slave Executor

You are a slave executor. You execute exactly one assignment from the slave plan, then die. You do NOT merge to master. You do NOT update state files. You commit to your branch, write a status file, and die.

**Lifecycle:** Parse argument → Read plan → Check dependencies → Write status → Create worktree → Launch agent(s) → Post-process → Report and die

## Step 1: Parse Argument

Extract the slave number X from the user's `/slave X` command. The argument is the 1-based slave number.

If no argument provided, ask the user: "Which slave number? Check `.worktrees/slave-plan.json` for available slaves."

## Step 2: Read Plan

Read `.worktrees/slave-plan.json`.

- If the file doesn't exist → abort with error: "No slave plan found. Run `/create_slave_plan` first."
- Find the entry where `slave_id == X`
- If X is out of range → abort with error: "Slave X not found in plan. Plan has <total_slaves> slaves."

Extract:
- `task_type`, `target`, `description`
- `agent_types`, `launch_mode`
- `depends_on`
- `branch_name`, `worktree_path`
- `template_data`

## Step 3: Check Dependencies

For each ID in `depends_on`, read `.worktrees/slave-status/slave-<dep>.json`:

| Status | Action |
|--------|--------|
| File missing | Warn: "Dependency slave-<dep> has not started yet." Ask proceed/abort. |
| `"status": "failed"` | Warn: "Dependency slave-<dep> failed." Ask proceed/abort. |
| `"status": "completed"` | Proceed — dependency satisfied. |
| `"status": "running"` or `"initializing"` | Warn: "Dependency slave-<dep> is still running." Ask wait/abort. |

If all dependencies are satisfied (or user overrides warnings), proceed.

## Step 4: Write Initial Status

Create `.worktrees/slave-status/slave-<X>.json`:

```json
{
  "slave_id": X,
  "status": "initializing",
  "started_at": "<ISO timestamp>",
  "pid": <$PPID value>,
  "plan_id": "<plan_id from slave-plan.json>",
  "task_type": "<from plan>",
  "target": "<from plan>",
  "description": "<from plan>",
  "commits": [],
  "artifacts_produced": [],
  "review_verdict": null,
  "error": null
}
```

## Step 5: Create Git Worktree

```bash
BRANCH="<branch_name from plan>"
WORKTREE="<worktree_path from plan>"

git worktree add -b "$BRANCH" "$WORKTREE" master
ln -s "$(pwd)/app/node_modules" "$WORKTREE/app/node_modules"
```

Resolve runtime placeholders in `template_data`:
- Replace `{{RESOLVED_AT_SLAVE_TIME}}` in `WORKTREE_PATH` with the absolute path to the worktree
- Replace `{{RESOLVED_AT_SLAVE_TIME}}` in `BRANCH_NAME` with the branch name

Update status to `"running"`.

## Step 6: Prepare & Launch Agent(s)

### 6a. Read Template

Read the appropriate template from `.claude/skills/templates/agent-<type>.md` based on the first entry in `agent_types`.

For dual mode (reviewers), read both:
- `.claude/skills/templates/agent-senior-reviewer.md`
- `.claude/skills/templates/agent-game-logic-reviewer.md`

### 6b. Replace Placeholders

Take the template content and replace all `{{PLACEHOLDER}}` tokens with values from `template_data`.

### 6c. Validate

Search for `{{` in the final prompt(s). If any unresolved placeholder remains → STOP, log it in the status file as an error, ask user before proceeding.

### 6d. Launch

**Single mode** (`launch_mode: "single"`):
- Launch one Task agent:
  - `subagent_type: "general-purpose"`
  - `model: "opus"`
  - Run in **foreground** — wait for completion
  - The prompt is the fully-resolved template

**Dual mode** (`launch_mode: "dual"`):
- Launch two Task agents:
  - Both with `subagent_type: "general-purpose"`, `model: "opus"`
  - Both with `run_in_background: true`
  - Poll with `TaskOutput` every 30 seconds until both complete
  - First agent: Senior Reviewer template
  - Second agent: Game Logic Reviewer template

## Step 7: Post-Process

**Do NOT merge to master. Do NOT update state files.**

### 7a. Collect Results

```bash
# Get commit hashes on this branch that aren't on master
cd "$WORKTREE"
git log "$BRANCH" --not master --oneline --format="%H %s"
```

### 7b. Collect Produced Artifacts

Diff the worktree against master to find new/modified artifacts:
```bash
git diff master --name-only --diff-filter=AM
```

### 7c. Detect Review Verdict (if reviewer task)

If this was a reviewer task, scan the produced review artifacts for the `verdict` field in YAML frontmatter.

### 7d. Write Final Status

Update `.worktrees/slave-status/slave-<X>.json`:

```json
{
  "slave_id": X,
  "status": "completed",
  "started_at": "<original>",
  "completed_at": "<ISO timestamp>",
  "pid": <$PPID>,
  "plan_id": "<plan_id>",
  "task_type": "<from plan>",
  "target": "<from plan>",
  "description": "<from plan>",
  "branch": "<branch_name>",
  "worktree": "<worktree_path>",
  "commits": ["<hash1> <message1>", "<hash2> <message2>"],
  "artifacts_produced": ["path/to/artifact1.md", "path/to/artifact2.md"],
  "review_verdict": "APPROVED|CHANGES_REQUIRED|null",
  "error": null
}
```

If the agent failed or produced no output:
```json
{
  "status": "failed",
  "error": "<description of what went wrong>",
  "commits": [],
  "artifacts_produced": []
}
```

## Step 8: Report and Die

Show a summary:

```markdown
## Slave <X> Complete

### Assignment
- **Type:** <task_type>
- **Target:** <target>
- **Description:** <description>

### Result
- **Status:** completed | failed
- **Commits:** <count> commits on branch <branch_name>
- **Artifacts:** <list of produced artifacts>
- **Review Verdict:** <if applicable>

### Branch
`<branch_name>` in worktree `<worktree_path>`

### Next Steps
Run `/collect_slaves` when all slaves are done to merge results to master.
```

**Then die.** This session is over. The collector merges everything.

## What You Do NOT Do

- Merge to master (collector does that)
- Update state files (collector does that)
- Create tickets (master planner does that)
- Pick work items (master planner assigned you)
- Launch other slaves (user does that)
- Persist across multiple assignments (one assignment, then die)
- Delete your worktree (collector does that on successful merge)
