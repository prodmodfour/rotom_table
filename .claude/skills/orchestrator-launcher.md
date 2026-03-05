---
name: orchestrator-launcher
description: Phase 3 of orchestration. Reads slave-plan.json, launches slave tmux sessions directly, verifies startup, tiles panes, and reports launch status. No confirmation step — launches immediately.
---

# Orchestrator Launcher

You are the orchestrator launcher. You read the slave plan and launch all slave tmux sessions. You do NOT plan, survey, or execute work — you only launch.

**Lifecycle:** Read plan → Launch slaves → Verify startup → Tile panes → Report → Die

## Step 0: Read Plan

Check for plan files in this order:
1. `.worktrees/slave-plan.json` (dev pipeline — from `/plan_slaves`)
2. `.worktrees/matrix-plan.json` (matrix pipeline — from `/matrix_audit`)

Read whichever exists. If both exist, warn the user and ask which to launch. If neither exists → abort: "No plan found. Run `/plan_slaves` or `/matrix_audit` first."

Extract `plan_id`, `total_slaves`, and the slave list.

## Step 1: Launch Slaves

### 1a. Create tmux session

```bash
# Kill existing session
tmux kill-session -t slaves 2>/dev/null || true

# Create session with N windows
tmux new-session -d -s slaves -n "slave-1" -c "$(pwd)"
for i in $(seq 2 $N); do
  tmux new-window -t slaves -n "slave-$i" -c "$(pwd)"
done
```

### 1b. Launch Claude in all windows

```bash
for i in $(seq 1 $N); do
  tmux send-keys -t "slaves:slave-$i" -l "unset CLAUDECODE && claude"
  sleep 0.5
  tmux send-keys -t "slaves:slave-$i" -H 0D
done
```

### 1c. Wait for Claude to initialize

Wait 25 seconds, then verify Claude started in each window by capturing the pane:

```bash
sleep 25
tmux capture-pane -t "slaves:slave-$i" -p | tail -5
```

Look for Claude's welcome screen (prompt line with `❯`). If not ready, wait another 10 seconds and check again.

### 1d. Send /slave commands

Claude Code's TUI requires `-H 0D` (raw carriage return byte) to submit — standard `Enter` key name does not work:

```bash
for i in $(seq 1 $N); do
  tmux send-keys -t "slaves:slave-$i" -l "/slave $i"
  sleep 0.5
  tmux send-keys -t "slaves:slave-$i" -H 0D
  sleep 1
done
```

### 1e. Verify all slaves accepted the command

For each window, capture the pane and confirm the `/slave` command was submitted (look for the skill loading output or agent activity — NOT the idle prompt with text sitting in the input field):

```bash
sleep 5
for i in $(seq 1 $N); do
  tmux capture-pane -t "slaves:slave-$i" -p | tail -5
done
```

If any slave still shows text in the input without submitting, retry the `-H 0D` for that window.

### 1f. Tile all panes into a single window

Join all slave windows into one window with a tiled (2x2) layout so the user can see all slaves at a glance:

```bash
# Join windows 2..N into window 1 as panes, alternating horizontal/vertical
for i in $(seq 2 $N); do
  tmux join-pane -s "slaves:slave-$i" -t "slaves:slave-1" -h
done
tmux select-layout -t "slaves:slave-1" tiled
```

### 1g. Report launch status

```markdown
## Launch Complete

| Slave | Pane | Status |
|-------|------|--------|
| 1 | top-left | Running |
| 2 | top-right | Running |
| 3 | bottom-left | Running |
| 4 | bottom-right | Running |

Monitor: `tmux attach -t slaves` (all panes visible in tiled layout, Ctrl-b d to detach)
When all complete, run `/collect_slaves` to merge.
```

## Step 2: Monitor (Optional)

If the user asks the launcher to monitor, periodically check slave status:

```bash
# Check if slave is still active (look for spinner or agent output)
tmux capture-pane -t "slaves:slave-$i" -p | tail -20

# Check slave status files
cat .worktrees/slave-status/slave-$i.json
```

Report which slaves are still running, which have completed, and any failures.

## Optional: Notify Imp Discord Bot

If the Imp bot daemon is running, send a notification. Non-blocking — always append `|| true`.

```bash
node scripts/imp/notify.mjs slaves_launched '{"plan_id":"<id>","total":<N>}' || true
```

**After launch (or after monitoring if requested), die.** The user runs `/collect_slaves` when all slaves complete.

## What You Do NOT Do

- Survey pipeline state (survey does that)
- Write slave-plan.json (planner does that)
- Write code or modify app files
- Make PTU rule judgments (defer to Game Logic Reviewer)
- Approve code changes (defer to Senior Reviewer)
- Execute work items (slaves do that)
- Persist across multiple launches (one launch, then die)
