#!/bin/bash
set -e

WD="/home/ashraf/pokemon_ttrpg/session_helper"
SESSION="rule-extractors"
DOMAINS=("capture" "healing" "pokemon-lifecycle" "character-lifecycle" "encounter-tables" "scenes" "vtt-grid")

# Helper: send text to a tmux pane, then press Enter
send_and_submit() {
  local target="$1"
  local text="$2"
  # Send text without -l so tmux interprets Enter as a key name
  tmux send-keys -t "$target" "$text" Enter
}

# Kill existing session if present
tmux kill-session -t "$SESSION" 2>/dev/null || true

# Create session with first window
tmux new-session -d -s "$SESSION" -n "rules-capture" -c "$WD"

# Create remaining 6 windows
for i in $(seq 1 6); do
  tmux new-window -t "$SESSION" -n "rules-${DOMAINS[$i]}" -c "$WD"
done

# Launch claude in all 7 windows (unset CLAUDECODE to avoid nesting check)
for domain in "${DOMAINS[@]}"; do
  send_and_submit "$SESSION:rules-${domain}" "unset CLAUDECODE && claude"
done

echo "[1/3] Claude instances starting in 7 windows..."
sleep 10

# Send skill load command to all windows
for domain in "${DOMAINS[@]}"; do
  send_and_submit "$SESSION:rules-${domain}" "load .claude/skills/ptu-rule-extractor.md"
done

echo "[2/3] Skill loading in all windows..."
sleep 12

# Send task prompts to all windows
for domain in "${DOMAINS[@]}"; do
  send_and_submit "$SESSION:rules-${domain}" "Extract all PTU rules for domain ${domain}. Output: artifacts/matrix/${domain}-rules.md"
done

echo "[3/3] All 7 rule extractors launched!"
echo ""
echo "Session: $SESSION"
echo "Domains: ${DOMAINS[*]}"
echo ""
echo "Commands:"
echo "  tmux attach -t $SESSION          # attach to session"
echo "  Ctrl-b n / Ctrl-b p              # next/prev window"
echo "  Ctrl-b <number>                  # jump to window by index"
echo "  Ctrl-b d                         # detach without killing"
