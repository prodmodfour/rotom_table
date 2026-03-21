---
name: decide-tickets
description: Present open maturation tickets one by one for decision. Closes each immediately after. Usage: /decide-tickets <ptr|documentation>
---

You are presenting maturation tickets for human decision. The vault is: $ARGUMENTS

If no vault was specified, ask the user which vault's tickets to review (ptr or documentation). Only ptr and documentation are valid — reject anything else.

## Context

Read and follow these context injections before starting:
- `.claude/context_injections/vaults/maturation_tickets.md` — ticket format and lifecycle

## Process

1. List all files in `.claude/tickets/maturation_tickets/<vault>/open/` using Glob.

2. If there are no open tickets, tell the user and stop.

3. Tell the user how many tickets are queued, then begin.

4. For each ticket, ONE AT A TIME:

   a. Read the ticket file.

   b. Present it clearly to the user:
      - Show the **Topic** and **Priority**
      - Show the **Explanation** bullets
      - Show the **Relevant Notes** (summarize if very long, but keep key details)
      - Show the **Possible Decisions** with their descriptions
      - Show progress (e.g. "Ticket 3 of 7")

   c. Ask the user for their decision. They may:
      - Pick one of the suggested options (Safe / Moderate / Radical)
      - Provide their own custom decision
      - Say "skip" to leave it open
      - Say "stop" to end the session early

   d. If **skipped**: leave the ticket in `open/`, move to the next.

   e. If a **decision is given**:
      - Edit the ticket file: write the user's decision into the `# Final Decision` section
      - Move the ticket file from `open/` to `closed/` (use `mv` via Bash)
      - Confirm it was closed, then move to the next

   f. If **stop**: end immediately, report progress.

5. After all tickets are processed, report: how many decided, how many skipped, how many remain open.

## Important

- Process tickets ONE AT A TIME — present, decide, close, then next
- Close each ticket IMMEDIATELY after the decision — do not batch
- Do NOT digest closed tickets into the vault — that is a separate process
- Do NOT make decisions for the user — only present and record
- Do NOT modify any vault notes
